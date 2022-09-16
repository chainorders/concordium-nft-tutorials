mod cis2_client;
mod errors;
mod params;
mod state;

use std::ops::Mul;

use cis2_client::Cis2Client;
use concordium_std::*;
use errors::MarketplaceError;
use params::{AddParams, TokenList, TokenListItem};
use state::{Commission, ContractTokenId, State};

use crate::{params::TransferParams, state::TokenState};

type ContractResult<A> = Result<A, MarketplaceError>;

#[init(contract = "Market-NFT")]
fn init<S: HasStateApi>(
    _ctx: &impl HasInitContext,
    state_builder: &mut StateBuilder<S>,
) -> InitResult<State<S>> {
    Ok(State::new(state_builder))
}

#[receive(
    contract = "Market-NFT",
    name = "add",
    parameter = "AddParams",
    mutable
)]
fn add<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<()> {
    let params: AddParams = ctx
        .parameter_cursor()
        .get()
        .map_err(|_e| MarketplaceError::ParseParams)?;

    ensure_supports_cis2(host, &params.nft_contract_address)?;
    ensure_is_operator(host, ctx, &params.nft_contract_address)?;
    ensure_balance(host, params.token_id, &params.nft_contract_address, ctx)?;

    let sender_account_address: AccountAddress = match ctx.sender() {
        Address::Account(account_address) => Option::Some(account_address),
        Address::Contract(_) => Option::None,
    }
    .ok_or(MarketplaceError::CalledByAContract)?;

    host.state_mut().list_token(
        params.token_id,
        params.nft_contract_address,
        sender_account_address,
        params.price,
    );
    ContractResult::Ok(())
}

#[receive(
    contract = "Market-NFT",
    name = "transfer",
    parameter = "TransferParams",
    mutable,
    payable
)]
fn transfer<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    amount: Amount,
) -> ContractResult<()> {
    let params: TransferParams = ctx
        .parameter_cursor()
        .get()
        .map_err(|_e| MarketplaceError::ParseParams)?;

    let token: TokenState = host
        .state()
        .get_token(params.token_id, params.nft_contract_address)
        .ok_or(MarketplaceError::TokenNotListed)?
        .to_owned();

    if let state::TokenListState::Listed(price) = token.get_curr_state() {
        ensure!(
            amount.cmp(&price).is_ge(),
            MarketplaceError::InvalidAmountPaid
        );

        let amounts = calculate_amounts(&amount, &host.state().commission);

        Cis2Client::transfer(
            host,
            params.token_id,
            params.nft_contract_address,
            concordium_cis2::TokenAmountU8(1),
            token.get_owner(),
            concordium_cis2::Receiver::Account(params.to),
        )
        .map_err(MarketplaceError::Cis2ClientError)?;

        host.invoke_transfer(&token.get_owner(), amounts.to_owner)
            .map_err(|_| MarketplaceError::InvokeTransferError)?;
        host.invoke_transfer(&ctx.owner(), amounts.to_marketplace)
            .map_err(|_| MarketplaceError::InvokeTransferError)?;
        host.state_mut()
            .delist_token(params.token_id, params.nft_contract_address, params.to);
    } else {
        bail!(MarketplaceError::TokenNotListed)
    };

    // host.state_mut()
    //     .transfer_token(params.token_id, params.nft_contract_address, params.price)
    //     .ok_or(MarketplaceError::StateInsertTokenError)?;

    ContractResult::Ok(())
}

#[receive(contract = "Market-NFT", name = "list", return_value = "TokenList")]
fn list<S: HasStateApi>(
    _ctx: &impl HasReceiveContext,
    host: &impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<TokenList> {
    let tokens: Vec<TokenListItem> = host
        .state()
        .tokens
        .iter()
        .filter(|i| i.1.is_listed())
        .map(|i| TokenListItem {
            token_id: i.0.id,
            contract: i.0.address,
            price: i.1.get_price().unwrap(),
        })
        .collect();

    Ok(TokenList(tokens))
}

struct DistributableAmounts {
    to_owner: Amount,
    to_marketplace: Amount,
}

fn ensure_supports_cis2<S: HasStateApi>(
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    nft_contract_address: &ContractAddress,
) -> Result<(), MarketplaceError> {
    let supports_cis2 = Cis2Client::supports_cis2(host, nft_contract_address)
        .map_err(MarketplaceError::Cis2ClientError)?;
    ensure!(supports_cis2, MarketplaceError::CollectionNotCis2);
    Ok(())
}

fn ensure_is_operator<S: HasStateApi>(
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    ctx: &impl HasReceiveContext<()>,
    nft_contract_address: &ContractAddress,
) -> Result<(), MarketplaceError> {
    let is_operator = cis2_client::Cis2Client::is_operator_of(
        host,
        ctx.sender(),
        ctx.self_address(),
        nft_contract_address,
    )
    .map_err(MarketplaceError::Cis2ClientError)?;
    ensure!(is_operator, MarketplaceError::NotOperator);
    Ok(())
}

fn ensure_balance<S: HasStateApi>(
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    token_id: ContractTokenId,
    nft_contract_address: &ContractAddress,
    ctx: &impl HasReceiveContext<()>,
) -> Result<(), MarketplaceError> {
    let has_balance = Cis2Client::has_balance(host, token_id, nft_contract_address, ctx.sender())
        .map_err(MarketplaceError::Cis2ClientError)?;
    ensure!(has_balance, MarketplaceError::NoBalance);
    Ok(())
}

fn calculate_amounts(amount: &Amount, commission: &Commission) -> DistributableAmounts {
    let commission_fraction = amount
        .mul(commission.percentage_basis.into())
        .quotient_remainder(10000);

    DistributableAmounts {
        to_owner: amount.subtract_micro_ccd(commission_fraction.0.micro_ccd()),
        to_marketplace: Amount { micro_ccd: 1 }
            .add_micro_ccd(commission_fraction.0.micro_ccd())
            .add_micro_ccd(commission_fraction.1.micro_ccd()),
    }
}

#[cfg(test)]
mod test {
    use crate::{
        add, calculate_amounts,
        cis2_client::{
            BALANCE_OF_ENTRYPOINT_NAME, OPERATOR_OF_ENTRYPOINT_NAME, SUPPORTS_ENTRYPOINT_NAME,
        },
        list,
        params::{AddParams, TokenListItem},
        state::{Commission, ContractTokenId, State, TokenInfo, TokenListState, TokenState},
    };
    use concordium_cis2::*;
    use concordium_std::ops::{Mul, Sub};
    use concordium_std::{test_infrastructure::*, *};
    type ContractBalanceOfQueryResponse = BalanceOfQueryResponse<TokenAmountU8>;

    const ACCOUNT_0: AccountAddress = AccountAddress([0u8; 32]);
    const ADDRESS_0: Address = Address::Account(ACCOUNT_0);
    const NFT_CONTRACT_ADDRESS: ContractAddress = ContractAddress {
        index: 1,
        subindex: 0,
    };
    const MARKET_CONTRACT_ADDRESS: ContractAddress = ContractAddress {
        index: 2,
        subindex: 0,
    };
    const TOKEN_ID_1: ContractTokenId = TokenIdU32(1);
    const TOKEN_ID_2: ContractTokenId = TokenIdU32(2);

    #[concordium_test]
    fn should_add_token() {
        let mut ctx = TestReceiveContext::default();
        ctx.set_sender(ADDRESS_0);
        ctx.set_self_address(MARKET_CONTRACT_ADDRESS);

        let price = Amount::from_ccd(1);
        let add_params = AddParams {
            nft_contract_address: NFT_CONTRACT_ADDRESS,
            price,
            token_id: TOKEN_ID_1,
        };
        let parameter_bytes = to_bytes(&add_params);
        ctx.set_parameter(&parameter_bytes);

        let mut state_builder = TestStateBuilder::new();
        let state = State::new(&mut state_builder);
        let mut host = TestHost::new(state, state_builder);

        fn mock_supports(
            _p: Parameter,
            _a: Amount,
            _a2: &mut Amount,
            _s: &mut State<TestStateApi>,
        ) -> Result<(bool, SupportsQueryResponse), CallContractError<SupportsQueryResponse>>
        {
            Result::Ok((
                false,
                SupportsQueryResponse {
                    results: vec![SupportResult::Support],
                },
            ))
        }

        fn mock_is_operator_of(
            _p: Parameter,
            _a: Amount,
            _a2: &mut Amount,
            _s: &mut State<TestStateApi>,
        ) -> Result<(bool, OperatorOfQueryResponse), CallContractError<OperatorOfQueryResponse>>
        {
            Result::Ok((false, OperatorOfQueryResponse { 0: vec![true] }))
        }

        fn mock_balance_of(
            _p: Parameter,
            _a: Amount,
            _a2: &mut Amount,
            _s: &mut State<TestStateApi>,
        ) -> Result<
            (bool, ContractBalanceOfQueryResponse),
            CallContractError<ContractBalanceOfQueryResponse>,
        > {
            Result::Ok((false, BalanceOfQueryResponse(vec![TokenAmountU8(1)])))
        }

        TestHost::setup_mock_entrypoint(
            &mut host,
            NFT_CONTRACT_ADDRESS,
            OwnedEntrypointName::new_unchecked(SUPPORTS_ENTRYPOINT_NAME.to_string()),
            MockFn::new_v1(mock_supports),
        );

        TestHost::setup_mock_entrypoint(
            &mut host,
            NFT_CONTRACT_ADDRESS,
            OwnedEntrypointName::new_unchecked(OPERATOR_OF_ENTRYPOINT_NAME.to_string()),
            MockFn::new_v1(mock_is_operator_of),
        );

        TestHost::setup_mock_entrypoint(
            &mut host,
            NFT_CONTRACT_ADDRESS,
            OwnedEntrypointName::new_unchecked(BALANCE_OF_ENTRYPOINT_NAME.to_string()),
            MockFn::new_v1(mock_balance_of),
        );

        let res = add(&ctx, &mut host);

        unsafe {
            claim!(res.is_ok(), "Results in rejection");
            claim!(host.state().tokens.iter().count() != 0, "Token not added");
            claim_eq!(
                host.state().commission,
                Commission {
                    percentage_basis: 250
                }
            );

            let token = host.state().tokens.iter().next().unwrap();
            claim_eq!(
                token.0.to_owned(),
                TokenInfo {
                    id: TOKEN_ID_1,
                    address: NFT_CONTRACT_ADDRESS
                }
            );
            claim_eq!(
                token.1.to_owned(),
                TokenState {
                    counter: 0,
                    curr_state: TokenListState::Listed(price),
                    owner: ACCOUNT_0
                }
            )
        }
    }

    #[concordium_test]
    fn should_list_token() {
        let mut ctx = TestReceiveContext::default();
        ctx.set_sender(ADDRESS_0);
        ctx.set_self_address(MARKET_CONTRACT_ADDRESS);

        let mut state_builder = TestStateBuilder::new();
        let mut state = State::new(&mut state_builder);
        state.list_token(
            TOKEN_ID_1,
            NFT_CONTRACT_ADDRESS,
            ACCOUNT_0,
            Amount::from_ccd(1),
        );
        state.list_token(
            TOKEN_ID_2,
            NFT_CONTRACT_ADDRESS,
            ACCOUNT_0,
            Amount::from_ccd(2),
        );
        let host = TestHost::new(state, state_builder);
        let list_result = list(&ctx, &host);

        unsafe {
            claim!(list_result.is_ok());
            let token_list = list_result.unwrap();
            let list = token_list.0;
            claim_eq!(list.len(), 2);

            let first_token = list.first().unwrap();
            let second_token = list.last().unwrap();

            claim_eq!(
                first_token,
                &TokenListItem {
                    token_id: TOKEN_ID_1,
                    contract: NFT_CONTRACT_ADDRESS,
                    price: Amount::from_ccd(1)
                }
            );

            claim_eq!(
                second_token,
                &TokenListItem {
                    token_id: TOKEN_ID_2,
                    contract: NFT_CONTRACT_ADDRESS,
                    price: Amount::from_ccd(2)
                }
            )
        }
    }

    #[test]
    fn callculate_commissions_test() {
        let cases: Vec<u64> = (1..500).collect();
        let percentage_basis: u8 = 250;

        for ele in cases {
            let init_amount = Amount::from_ccd(ele);
            let distributable_amounts =
                calculate_amounts(&init_amount, &Commission { percentage_basis });

            let cc = init_amount
                .mul(u64::from(percentage_basis))
                .quotient_remainder(10000)
                .0;

            unsafe {
                claim_eq!(
                    distributable_amounts.to_owner,
                    Amount::from_ccd(ele).sub(cc)
                );
                claim_eq!(distributable_amounts.to_marketplace, cc);
                claim_eq!(
                    init_amount,
                    Amount::from_ccd(0)
                        .add_micro_ccd(distributable_amounts.to_owner.micro_ccd())
                        .add_micro_ccd(distributable_amounts.to_marketplace.micro_ccd())
                )
            }
        }
    }
}
