use concordium_cis2::*;
use concordium_std::*;

use crate::{
    cis2_client::Cis2Client,
    error::{ContractError, CustomContractError},
    params::{
        ContractBalanceOfQueryParams, ContractBalanceOfQueryResponse, MintParams,
        SetImplementorsParams, TransferParameter, ViewAddressState, ViewState,
    },
    state::State,
    ContractResult, ContractTokenAmount, ContractTokenId, SUPPORTS_STANDARDS,
};

// Contract functions
/// Initialize contract instance with a no token types.
#[init(contract = "CIS2-Fractionalizer")]
fn contract_init<S: HasStateApi>(
    _ctx: &impl HasInitContext,
    state_builder: &mut StateBuilder<S>,
) -> InitResult<State<S>> {
    // Construct the initial contract state.
    Ok(State::empty(state_builder))
}

/// View function for testing. This reports on the entire state of the contract
/// for testing purposes. In a realistic example there `balance_of` and similar
/// functions with a smaller response.
#[receive(
    contract = "CIS2-Fractionalizer",
    name = "view",
    return_value = "ViewState"
)]
fn contract_view<S: HasStateApi>(
    _ctx: &impl HasReceiveContext,
    host: &impl HasHost<State<S>, StateApiType = S>,
) -> ReceiveResult<ViewState> {
    let state = host.state();

    let mut inner_state = Vec::new();
    for (k, a_state) in state.state.iter() {
        let mut balances = Vec::new();
        let mut operators = Vec::new();
        for (token_id, amount) in a_state.balances.iter() {
            balances.push((*token_id, *amount));
        }
        for o in a_state.operators.iter() {
            operators.push(*o);
        }

        inner_state.push((
            *k,
            ViewAddressState {
                balances,
                operators,
            },
        ));
    }
    let mut tokens = Vec::new();
    for v in state.tokens.iter() {
        tokens.push(v.0.to_owned());
    }

    Ok(ViewState {
        state: inner_state,
        tokens,
        collaterals: state.collaterals.iter().map(|(a, b)| (*a, *b)).collect(),
    })
}

/// Mint new tokens with a given address as the owner of these tokens.
/// Can only be called by the contract owner.
/// Logs a `Mint` and a `TokenMetadata` event for each token.
/// The url for the token metadata is the token ID encoded in hex, appended on
/// the `TOKEN_METADATA_BASE_URL`.
///
/// It rejects if:
/// - The sender is not the contract instance owner.
/// - Fails to parse parameter.
/// - Any of the tokens fails to be minted, which could be if:
///     - Fails to log Mint event.
///     - Fails to log TokenMetadata event.
///
/// Note: Can at most mint 32 token types in one call due to the limit on the
/// number of logs a smart contract can produce on each function call.
#[receive(
    contract = "CIS2-Fractionalizer",
    name = "mint",
    parameter = "MintParams",
    error = "ContractError",
    enable_logger,
    mutable
)]
fn contract_mint<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    logger: &mut impl HasLogger,
) -> ContractResult<()> {
    let sender = match ctx.sender() {
        Address::Account(a) => a,
        Address::Contract(_) => bail!(CustomContractError::AccountsOnly.into()),
    };

    // Parse the parameter.
    let params: MintParams = ctx.parameter_cursor().get()?;

    let (state, builder) = host.state_and_builder();
    for (token_id, token_info) in params.tokens {
        ensure!(
            state.has_collateral(&token_info.contract, &token_info.token_id, &sender),
            concordium_cis2::Cis2Error::Custom(CustomContractError::InvalidCollateral)
        );

        // Mint the token in the state.
        state.mint(
            &token_id,
            &token_info.metadata,
            token_info.amount,
            &params.owner,
            builder,
        );

        state.update_collateral_token(
            token_info.contract,
            token_info.token_id,
            sender,
            token_id,
        )?;

        // Event for minted token.
        logger.log(&Cis2Event::Mint(MintEvent {
            token_id,
            amount: token_info.amount,
            owner: params.owner,
        }))?;

        // Metadata URL for the token.
        logger.log(&Cis2Event::TokenMetadata::<_, ContractTokenAmount>(
            TokenMetadataEvent {
                token_id,
                metadata_url: token_info.metadata.to_metadata_url(),
            },
        ))?;
    }
    Ok(())
}

/// Execute a list of token transfers, in the order of the list.
/// If the transfer is to the self address the tokens are burned instead.
/// If the balance after burning is zero then the collateral is returned back to the original sender.
///
/// Logs a `Transfer` event and invokes a receive hook function for every
/// transfer in the list.
///
/// It rejects if:
/// - It fails to parse the parameter.
/// - Any of the transfers fail to be executed, which could be if:
///     - The `token_id` does not exist.
///     - The sender is not the owner of the token, or an operator for this
///       specific `token_id` and `from` address.
///     - The token is not owned by the `from`.
/// - Fails to log event.
/// - Any of the receive hook function calls rejects.
#[receive(
    contract = "CIS2-Fractionalizer",
    name = "transfer",
    parameter = "TransferParameter",
    error = "ContractError",
    enable_logger,
    mutable
)]
fn contract_transfer<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    logger: &mut impl HasLogger,
) -> ContractResult<()> {
    // Parse the parameter.
    let TransferParams(transfers): TransferParameter = ctx.parameter_cursor().get()?;
    // Get the sender who invoked this contract function.
    let sender = ctx.sender();

    for Transfer {
        token_id,
        amount,
        from,
        to,
        data,
    } in transfers
    {
        let (state, builder) = host.state_and_builder();
        // Authenticate the sender for this transfer
        ensure!(
            from == sender || state.is_operator(&sender, &from),
            ContractError::Unauthorized
        );

        if to.address().matches_contract(&ctx.self_address()) {
            // tokens are being transferred to self
            // burn the tokens
            let remaining_amount: ContractTokenAmount = state.burn(&token_id, amount, &from)?;

            // log burn event
            logger.log(&Cis2Event::Burn(BurnEvent {
                token_id,
                amount,
                owner: from,
            }))?;

            // Check of there is any remaining amount
            if remaining_amount.eq(&ContractTokenAmount::from(0)) {
                // Everything has been burned
                // Transfer collateral back to the original owner
                let (collateral_key, collateral_amount) = state
                    .find_collateral(&token_id)
                    .ok_or(Cis2Error::Custom(CustomContractError::InvalidCollateral))?;

                // Return back the collateral
                Cis2Client::transfer(
                    host,
                    collateral_key.token_id,
                    collateral_key.contract,
                    collateral_amount,
                    concordium_std::Address::Contract(ctx.self_address()),
                    concordium_cis2::Receiver::Account(collateral_key.owner),
                )
                .map_err(CustomContractError::Cis2ClientError)?;
            }
        } else {
            let to_address = to.address();

            // Tokens are being transferred to another address
            // Update the contract state
            state.transfer(&token_id, amount, &from, &to_address, builder)?;

            // Log transfer event
            logger.log(&Cis2Event::Transfer(TransferEvent {
                token_id,
                amount,
                from,
                to: to_address,
            }))?;

            // If the receiver is a contract we invoke it.
            if let Receiver::Contract(address, entrypoint_name) = to {
                let parameter = OnReceivingCis2Params {
                    token_id,
                    amount,
                    from,
                    data,
                };
                host.invoke_contract(
                    &address,
                    &parameter,
                    entrypoint_name.as_entrypoint_name(),
                    Amount::zero(),
                )?;
            }
        }
    }

    Ok(())
}

/// Enable or disable addresses as operators of the sender address.
/// Logs an `UpdateOperator` event.
///
/// It rejects if:
/// - It fails to parse the parameter.
/// - Fails to log event.
#[receive(
    contract = "CIS2-Fractionalizer",
    name = "updateOperator",
    parameter = "UpdateOperatorParams",
    error = "ContractError",
    enable_logger,
    mutable
)]
fn contract_update_operator<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    logger: &mut impl HasLogger,
) -> ContractResult<()> {
    // Parse the parameter.
    let UpdateOperatorParams(params) = ctx.parameter_cursor().get()?;
    // Get the sender who invoked this contract function.
    let sender = ctx.sender();

    let (state, builder) = host.state_and_builder();
    for param in params {
        // Update the operator in the state.
        match param.update {
            OperatorUpdate::Add => state.add_operator(&sender, &param.operator, builder),
            OperatorUpdate::Remove => state.remove_operator(&sender, &param.operator),
        }

        // Log the appropriate event
        logger.log(
            &Cis2Event::<ContractTokenId, ContractTokenAmount>::UpdateOperator(
                UpdateOperatorEvent {
                    owner: sender,
                    operator: param.operator,
                    update: param.update,
                },
            ),
        )?;
    }
    Ok(())
}

/// Get the balance of given token IDs and addresses.
///
/// It rejects if:
/// - It fails to parse the parameter.
/// - Any of the queried `token_id` does not exist.
#[receive(
    contract = "CIS2-Fractionalizer",
    name = "balanceOf",
    parameter = "ContractBalanceOfQueryParams",
    return_value = "ContractBalanceOfQueryResponse",
    error = "ContractError"
)]
fn contract_balance_of<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<ContractBalanceOfQueryResponse> {
    // Parse the parameter.
    let params: ContractBalanceOfQueryParams = ctx.parameter_cursor().get()?;
    // Build the response.
    let mut response = Vec::with_capacity(params.queries.len());
    for query in params.queries {
        // Query the state for balance.
        let amount = host.state().balance(&query.token_id, &query.address)?;
        response.push(amount);
    }
    let result = ContractBalanceOfQueryResponse::from(response);
    Ok(result)
}

/// Takes a list of queries. Each query is an owner address and some address to
/// check as an operator of the owner address.
///
/// It rejects if:
/// - It fails to parse the parameter.
#[receive(
    contract = "CIS2-Fractionalizer",
    name = "operatorOf",
    parameter = "OperatorOfQueryParams",
    return_value = "OperatorOfQueryResponse",
    error = "ContractError"
)]
fn contract_operator_of<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<OperatorOfQueryResponse> {
    // Parse the parameter.
    let params: OperatorOfQueryParams = ctx.parameter_cursor().get()?;
    // Build the response.
    let mut response = Vec::with_capacity(params.queries.len());
    for query in params.queries {
        // Query the state for address being an operator of owner.
        let is_operator = host.state().is_operator(&query.address, &query.owner);
        response.push(is_operator);
    }
    let result = OperatorOfQueryResponse::from(response);
    Ok(result)
}

/// Parameter type for the CIS-2 function `tokenMetadata` specialized to the
/// subset of TokenIDs used by this contract.
type ContractTokenMetadataQueryParams = TokenMetadataQueryParams<ContractTokenId>;

/// Get the token metadata URLs and checksums given a list of token IDs.
///
/// It rejects if:
/// - It fails to parse the parameter.
/// - Any of the queried `token_id` does not exist.
#[receive(
    contract = "CIS2-Fractionalizer",
    name = "tokenMetadata",
    parameter = "ContractTokenMetadataQueryParams",
    return_value = "TokenMetadataQueryResponse",
    error = "ContractError"
)]
fn contract_token_metadata<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<TokenMetadataQueryResponse> {
    // Parse the parameter.
    let params: ContractTokenMetadataQueryParams = ctx.parameter_cursor().get()?;
    // Build the response.
    let mut response = Vec::with_capacity(params.queries.len());
    for token_id in params.queries {
        let metadata_url: MetadataUrl = match host
            .state()
            .tokens
            .get(&token_id)
            .map(|metadata| metadata.to_owned())
        {
            Option::Some(m) => Result::Ok(m),
            Option::None => Result::Err(ContractError::InvalidTokenId),
        }?;

        response.push(metadata_url);
    }
    let result = TokenMetadataQueryResponse::from(response);
    Ok(result)
}

/// This functions should be invoked by any CIS2 Contract whose token is being transferred.
/// TO this contract
///
/// Upon receiving any token its added to the collateral state of the contract.
/// Mint function can be called in a separate transaction to mint a token against the collateral.
///
/// It rejects if:
/// - Sender is not a contract.
/// - It fails to parse the parameter.
/// - Contract name part of the parameter is invalid.
/// - Calling back `transfer` to sender contract rejects.
#[receive(
    contract = "CIS2-Fractionalizer",
    name = "onReceivingCIS2",
    error = "ContractError",
    mutable
)]
fn contract_on_cis2_received<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<()> {
    // Ensure the sender is a contract.
    let sender = if let Address::Contract(contract) = ctx.sender() {
        contract
    } else {
        bail!(CustomContractError::ContractOnly.into())
    };

    // Parse the parameter.
    let params: OnReceivingCis2Params<ContractTokenId, ContractTokenAmount> =
        ctx.parameter_cursor().get()?;

    let from_account = match params.from {
        Address::Account(a) => a,
        Address::Contract(_) => bail!(CustomContractError::ContractOnly.into()),
    };

    host.state_mut()
        .add_collateral(sender, params.token_id, from_account, params.amount);
    Ok(())
}

/// Get the supported standards or addresses for a implementation given list of
/// standard identifiers.
///
/// It rejects if:
/// - It fails to parse the parameter.
#[receive(
    contract = "CIS2-Fractionalizer",
    name = "supports",
    parameter = "SupportsQueryParams",
    return_value = "SupportsQueryResponse",
    error = "ContractError"
)]
fn contract_supports<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<SupportsQueryResponse> {
    // Parse the parameter.
    let params: SupportsQueryParams = ctx.parameter_cursor().get()?;

    // Build the response.
    let mut response = Vec::with_capacity(params.queries.len());
    for std_id in params.queries {
        if SUPPORTS_STANDARDS.contains(&std_id.as_standard_identifier()) {
            response.push(SupportResult::Support);
        } else {
            response.push(host.state().have_implementors(&std_id));
        }
    }
    let result = SupportsQueryResponse::from(response);
    Ok(result)
}

/// Set the addresses for an implementation given a standard identifier and a
/// list of contract addresses.
///
/// It rejects if:
/// - Sender is not the owner of the contract instance.
/// - It fails to parse the parameter.
#[receive(
    contract = "CIS2-Fractionalizer",
    name = "setImplementors",
    parameter = "SetImplementorsParams",
    error = "ContractError",
    mutable
)]
fn contract_set_implementor<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<()> {
    // Authorize the sender.
    ensure!(
        ctx.sender().matches_account(&ctx.owner()),
        ContractError::Unauthorized
    );
    // Parse the parameter.
    let params: SetImplementorsParams = ctx.parameter_cursor().get()?;
    // Update the implementors in the state
    host.state_mut()
        .set_implementors(params.id, params.implementors);
    Ok(())
}

// Tests
#[concordium_cfg_test]
mod tests {
    use crate::params::{TokenMetadata, TokenMintParams};

    use super::*;
    use test_infrastructure::*;

    const ACCOUNT_0: AccountAddress = AccountAddress([0u8; 32]);
    const ADDRESS_0: Address = Address::Account(ACCOUNT_0);
    const ACCOUNT_1: AccountAddress = AccountAddress([1u8; 32]);
    const ADDRESS_1: Address = Address::Account(ACCOUNT_1);
    const TOKEN_0: ContractTokenId = TokenIdU8(2);
    const TOKEN_1: ContractTokenId = TokenIdU8(42);
    const TOKEN_COLLATERAL_0: ContractTokenId = TokenIdU8(100);
    const TOKEN_COLLATERAL_1: ContractTokenId = TokenIdU8(200);
    const CONTRACT_COLLATERAL_0: ContractAddress = ContractAddress {
        index: 1,
        subindex: 0,
    };

    /// Test helper function which creates a contract state with two tokens with
    /// id `TOKEN_0` and id `TOKEN_1` owned by `ADDRESS_0`
    fn initial_state<S: HasStateApi>(state_builder: &mut StateBuilder<S>) -> State<S> {
        let mut state = State::empty(state_builder);
        state.mint(
            &TOKEN_0,
            &{
                let url = "url".to_owned();
                let hash =
                    "db2ca420a0090593ac6559ff2a98ce30abfe665d7a18ff3c63883e8b98622a73".to_owned();
                TokenMetadata { url, hash }
            },
            400.into(),
            &ADDRESS_0,
            state_builder,
        );
        state.mint(
            &TOKEN_1,
            &{
                let url = "url".to_owned();
                let hash =
                    "db2ca420a0090593ac6559ff2a98ce30abfe665d7a18ff3c63883e8b98622a73".to_owned();
                TokenMetadata { url, hash }
            },
            1.into(),
            &ADDRESS_0,
            state_builder,
        );
        state
    }

    /// Test initialization succeeds with a state with no tokens.
    #[concordium_test]
    fn test_init() {
        // Setup the context
        let ctx = TestInitContext::empty();
        let mut builder = TestStateBuilder::new();

        // Call the contract function.
        let result = contract_init(&ctx, &mut builder);

        // Check the result
        let state = result.expect_report("Contract initialization failed");

        // Check the state
        claim_eq!(
            state.tokens.iter().count(),
            0,
            "Only one token is initialized"
        );
    }

    /// Test minting succeeds and the tokens are owned by the given address and
    /// the appropriate events are logged.
    #[concordium_test]
    fn test_mint() {
        // Setup the context
        let mut ctx = TestReceiveContext::empty();
        ctx.set_sender(ADDRESS_0);
        ctx.set_owner(ACCOUNT_0);

        let url = "url".to_owned();
        let hash = "db2ca420a0090593ac6559ff2a98ce30abfe665d7a18ff3c63883e8b98622a73".to_owned();
        // and parameter.
        let mut tokens = collections::BTreeMap::new();
        tokens.insert(
            TOKEN_0,
            TokenMintParams {
                amount: 400.into(),
                token_id: TOKEN_COLLATERAL_0,
                contract: CONTRACT_COLLATERAL_0,
                metadata: TokenMetadata {
                    url: url.to_string(),
                    hash: hash.to_string(),
                },
            },
        );
        tokens.insert(
            TOKEN_1,
            TokenMintParams {
                amount: 400.into(),
                token_id: TOKEN_COLLATERAL_1,
                contract: CONTRACT_COLLATERAL_0,
                metadata: TokenMetadata { url, hash },
            },
        );
        let parameter = MintParams {
            owner: ADDRESS_0,
            tokens,
        };
        let parameter_bytes = to_bytes(&parameter);
        ctx.set_parameter(&parameter_bytes);

        let mut logger = TestLogger::init();
        let mut state_builder = TestStateBuilder::new();
        let state = State::empty(&mut state_builder);
        let mut host = TestHost::new(state, state_builder);

        // Call the contract function.
        let result: ContractResult<()> = contract_mint(&ctx, &mut host, &mut logger);

        // Check the result
        claim!(result.is_ok(), "Results in rejection");

        // Check the state
        claim_eq!(
            host.state().tokens.iter().count(),
            2,
            "Only one token is initialized"
        );
        let balance0 = host
            .state()
            .balance(&TOKEN_0, &ADDRESS_0)
            .expect_report("Token is expected to exist");
        claim_eq!(
            balance0,
            400.into(),
            "Initial tokens are owned by the contract instantiater"
        );

        let balance1 = host
            .state()
            .balance(&TOKEN_1, &ADDRESS_0)
            .expect_report("Token is expected to exist");
        unsafe {
            claim_eq!(
                balance1,
                1.into(),
                "Initial tokens are owned by the contract instantiater"
            );

            // Check the logs
            claim_eq!(logger.logs.len(), 4, "Exactly four events should be logged");
            claim!(
                logger.logs.contains(&to_bytes(&Cis2Event::Mint(MintEvent {
                    owner: ADDRESS_0,
                    token_id: TOKEN_0,
                    amount: ContractTokenAmount::from(400),
                }))),
                "Expected an event for minting TOKEN_0"
            );
            claim!(
                logger.logs.contains(&to_bytes(&Cis2Event::Mint(MintEvent {
                    owner: ADDRESS_0,
                    token_id: TOKEN_1,
                    amount: ContractTokenAmount::from(1),
                }))),
                "Expected an event for minting TOKEN_1"
            );

            claim!(
                logger.logs.contains(&to_bytes(
                    &Cis2Event::TokenMetadata::<_, ContractTokenAmount>(TokenMetadataEvent {
                        token_id: TOKEN_0,
                        metadata_url: (TokenMetadata {
                            url: "url".to_string(),
                            hash:
                                "db2ca420a0090593ac6559ff2a98ce30abfe665d7a18ff3c63883e8b98622a73"
                                    .to_string()
                        })
                        .to_metadata_url(),
                    })
                )),
                "Expected an event for token metadata for TOKEN_0"
            );

            claim!(
                logger.logs.contains(&to_bytes(
                    &Cis2Event::TokenMetadata::<_, ContractTokenAmount>(TokenMetadataEvent {
                        token_id: TOKEN_1,
                        metadata_url: (TokenMetadata {
                            url: "url".to_string(),
                            hash:
                                "db2ca420a0090593ac6559ff2a98ce30abfe665d7a18ff3c63883e8b98622a73"
                                    .to_string()
                        })
                        .to_metadata_url(),
                    })
                )),
                "Expected an event for token metadata for TOKEN_1"
            );
        }
    }

    /// Test transfer succeeds, when `from` is the sender.
    #[concordium_test]
    fn test_transfer_account() {
        // Setup the context
        let mut ctx = TestReceiveContext::empty();
        ctx.set_sender(ADDRESS_0);

        // and parameter.
        let transfer = Transfer {
            token_id: TOKEN_0,
            amount: ContractTokenAmount::from(100),
            from: ADDRESS_0,
            to: Receiver::from_account(ACCOUNT_1),
            data: AdditionalData::empty(),
        };
        let parameter = TransferParams::from(vec![transfer]);
        let parameter_bytes = to_bytes(&parameter);
        ctx.set_parameter(&parameter_bytes);

        let mut logger = TestLogger::init();
        let mut state_builder = TestStateBuilder::new();
        let state = initial_state(&mut state_builder);
        let mut host = TestHost::new(state, state_builder);

        // Call the contract function.
        let result: ContractResult<()> = contract_transfer(&ctx, &mut host, &mut logger);
        // Check the result.
        claim!(result.is_ok(), "Results in rejection");

        // Check the state.
        let balance0 = host
            .state()
            .balance(&TOKEN_0, &ADDRESS_0)
            .expect_report("Token is expected to exist");
        let balance1 = host
            .state()
            .balance(&TOKEN_0, &ADDRESS_1)
            .expect_report("Token is expected to exist");
        claim_eq!(
            balance0,
            300.into(),
            "Token owner balance should be decreased by the transferred amount."
        );
        claim_eq!(
            balance1,
            100.into(),
            "Token receiver balance should be increased by the transferred amount"
        );

        // Check the logs.
        claim_eq!(logger.logs.len(), 1, "Only one event should be logged");
        claim_eq!(
            logger.logs[0],
            to_bytes(&Cis2Event::Transfer(TransferEvent {
                from: ADDRESS_0,
                to: ADDRESS_1,
                token_id: TOKEN_0,
                amount: ContractTokenAmount::from(100),
            })),
            "Incorrect event emitted"
        )
    }

    /// Test transfer token fails, when sender is neither the owner or an
    /// operator of the owner.
    #[concordium_test]
    fn test_transfer_not_authorized() {
        // Setup the context
        let mut ctx = TestReceiveContext::empty();
        ctx.set_sender(ADDRESS_1);

        // and parameter.
        let transfer = Transfer {
            from: ADDRESS_0,
            to: Receiver::from_account(ACCOUNT_1),
            token_id: TOKEN_0,
            amount: ContractTokenAmount::from(100),
            data: AdditionalData::empty(),
        };
        let parameter = TransferParams::from(vec![transfer]);
        let parameter_bytes = to_bytes(&parameter);
        ctx.set_parameter(&parameter_bytes);

        let mut logger = TestLogger::init();
        let mut state_builder = TestStateBuilder::new();
        let state = initial_state(&mut state_builder);
        let mut host = TestHost::new(state, state_builder);

        // Call the contract function.
        let result: ContractResult<()> = contract_transfer(&ctx, &mut host, &mut logger);
        // Check the result.
        let err = result.expect_err_report("Expected to fail");
        claim_eq!(
            err,
            ContractError::Unauthorized,
            "Error is expected to be Unauthorized"
        )
    }

    /// Test transfer succeeds when sender is not the owner, but is an operator
    /// of the owner.
    #[concordium_test]
    fn test_operator_transfer() {
        // Setup the context
        let mut ctx = TestReceiveContext::empty();
        ctx.set_sender(ADDRESS_1);

        // and parameter.
        let transfer = Transfer {
            from: ADDRESS_0,
            to: Receiver::from_account(ACCOUNT_1),
            token_id: TOKEN_0,
            amount: ContractTokenAmount::from(100),
            data: AdditionalData::empty(),
        };
        let parameter = TransferParams::from(vec![transfer]);
        let parameter_bytes = to_bytes(&parameter);
        ctx.set_parameter(&parameter_bytes);

        let mut logger = TestLogger::init();
        let mut state_builder = TestStateBuilder::new();
        let mut state = initial_state(&mut state_builder);
        state.add_operator(&ADDRESS_0, &ADDRESS_1, &mut state_builder);
        let mut host = TestHost::new(state, state_builder);

        // Call the contract function.
        let result: ContractResult<()> = contract_transfer(&ctx, &mut host, &mut logger);

        // Check the result.
        claim!(result.is_ok(), "Results in rejection");

        // Check the state.
        let balance0 = host
            .state()
            .balance(&TOKEN_0, &ADDRESS_0)
            .expect_report("Token is expected to exist");
        let balance1 = host
            .state()
            .balance(&TOKEN_0, &ADDRESS_1)
            .expect_report("Token is expected to exist");
        claim_eq!(
            balance0,
            300.into(),
            "Token owner balance should be decreased by the transferred amount"
        );
        claim_eq!(
            balance1,
            100.into(),
            "Token receiver balance should be increased by the transferred amount"
        );

        // Check the logs.
        claim_eq!(logger.logs.len(), 1, "Only one event should be logged");
        claim_eq!(
            logger.logs[0],
            to_bytes(&Cis2Event::Transfer(TransferEvent {
                from: ADDRESS_0,
                to: ADDRESS_1,
                token_id: TOKEN_0,
                amount: ContractTokenAmount::from(100),
            })),
            "Incorrect event emitted"
        )
    }

    /// Test adding an operator succeeds and the appropriate event is logged.
    #[concordium_test]
    fn test_add_operator() {
        // Setup the context
        let mut ctx = TestReceiveContext::empty();
        ctx.set_sender(ADDRESS_0);

        // and parameter.
        let update = UpdateOperator {
            operator: ADDRESS_1,
            update: OperatorUpdate::Add,
        };
        let parameter = UpdateOperatorParams(vec![update]);
        let parameter_bytes = to_bytes(&parameter);
        ctx.set_parameter(&parameter_bytes);

        let mut logger = TestLogger::init();
        let mut state_builder = TestStateBuilder::new();
        let state = initial_state(&mut state_builder);
        let mut host = TestHost::new(state, state_builder);

        // Call the contract function.
        let result: ContractResult<()> = contract_update_operator(&ctx, &mut host, &mut logger);

        // Check the result.
        claim!(result.is_ok(), "Results in rejection");

        // Check the state.
        let is_operator = host.state().is_operator(&ADDRESS_1, &ADDRESS_0);
        claim!(is_operator, "Account should be an operator");

        // Checking that `ADDRESS_1` is an operator in the query response of the
        // `contract_operator_of` function as well.
        // Setup parameter.
        let operator_of_query = OperatorOfQuery {
            address: ADDRESS_1,
            owner: ADDRESS_0,
        };

        let operator_of_query_vector = OperatorOfQueryParams {
            queries: vec![operator_of_query],
        };
        let parameter_bytes = to_bytes(&operator_of_query_vector);

        ctx.set_parameter(&parameter_bytes);

        // Checking the return value of the `contract_operator_of` function
        let result: ContractResult<OperatorOfQueryResponse> = contract_operator_of(&ctx, &host);

        claim_eq!(
            result.expect_report("Failed getting result value").0,
            [true],
            "Account should be an operator in the query response"
        );

        // Check the logs.
        claim_eq!(logger.logs.len(), 1, "One event should be logged");
        claim_eq!(
            logger.logs[0],
            to_bytes(
                &Cis2Event::<ContractTokenId, ContractTokenAmount>::UpdateOperator(
                    UpdateOperatorEvent {
                        owner: ADDRESS_0,
                        operator: ADDRESS_1,
                        update: OperatorUpdate::Add,
                    }
                )
            ),
            "Incorrect event emitted"
        )
    }
}
