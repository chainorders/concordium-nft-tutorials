use concordium_cis2::{OnReceivingCis2Params, Receiver};
use concordium_std::*;

use crate::{cis2_client::Cis2Client, error::*, state::*};

pub type ContractOnReceivingCis2Params =
    OnReceivingCis2Params<ContractTokenId, ContractTokenAmount>;

/// Type of the parameter to the `init` function
#[derive(Serialize, SchemaType)]
pub struct InitParameter {
    /// Time when auction ends using the RFC 3339 format (https://tools.ietf.org/html/rfc3339)
    pub end: Timestamp,
    /// The minimum accepted raise to over bid the current bidder in Euro cent.
    pub minimum_raise: u64,
    /// Token needed to participate in the Auction.
    pub participation_token: ParticipationTokenIdentifier,
}

/// Init function that creates a new auction
#[init(contract = "auction", parameter = "InitParameter")]
pub fn auction_init<S: HasStateApi>(
    ctx: &impl HasInitContext,
    state_builder: &mut StateBuilder<S>,
) -> InitResult<State<S>> {
    let parameter: InitParameter = ctx.parameter_cursor().get()?;
    Ok(State::new(parameter, state_builder))
}

#[receive(
    contract = "auction",
    name = "onReceivingCIS2",
    error = "ReceiveError",
    mutable
)]
fn auction_on_cis2_received<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
) -> Result<(), ReceiveError> {
    // Ensure the sender is a contract.
    let sender = if let Address::Contract(contract) = ctx.sender() {
        contract
    } else {
        bail!(ReceiveError::ContractOnly)
    };

    // Parse the parameter.
    let params: ContractOnReceivingCis2Params = ctx
        .parameter_cursor()
        .get()
        .map_err(|_| ReceiveError::ParseParams)?;

    let from_account = match params.from {
        Address::Account(a) => a,
        Address::Contract(_) => bail!(ReceiveError::OnlyAccount),
    };

    let token_identifier = AuctionTokenIdentifier::new(sender, params.token_id, params.amount);
    let state = host.state_mut();

    if state.participation_token.token_eq(&token_identifier) {
        state.participants.insert(from_account);
    } else {
        ensure!(from_account.eq(&ctx.owner()), ReceiveError::UnAuthorized);
        ensure_eq!(
            state.auction_state,
            AuctionState::NotInitialized,
            ReceiveError::AuctionAlreadyInitialized
        );
        state.auction_state = AuctionState::NotSoldYet(token_identifier)
    }

    Ok(())
}

/// Receive function for accounts to place a bid in the auction
#[receive(
    contract = "auction",
    name = "bid",
    payable,
    mutable,
    error = "BidError"
)]
pub fn auction_bid<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    amount: Amount,
) -> Result<(), BidError> {
    let state = host.state();
    // Ensure the auction has not been finalized yet
    ensure!(state.auction_state.is_open(), BidError::AuctionNotOpen);

    let slot_time = ctx.metadata().slot_time();
    // Ensure the auction has not ended yet
    ensure!(slot_time <= state.end, BidError::BidTooLate);

    // Ensure that only accounts can place a bid
    let sender_address = match ctx.sender() {
        Address::Contract(_) => bail!(BidError::OnlyAccount),
        Address::Account(account_address) => account_address,
    };

    ensure!(
        host.state().participants.contains(&sender_address),
        BidError::NotAParticipant
    );

    // Balance of the contract
    let balance = host.self_balance();

    // Balance of the contract before the call
    let previous_balance = balance - amount;

    // Ensure that the new bid exceeds the highest bid so far
    ensure!(amount > previous_balance, BidError::BidBelowCurrentBid);

    // Calculate the difference between the previous bid and the new bid in CCD.
    let amount_difference = amount - previous_balance;
    // Get the current exchange rate used by the chain
    let exchange_rates = host.exchange_rates();
    // Convert the CCD difference to EUR
    let euro_cent_difference = exchange_rates.convert_amount_to_euro_cent(amount_difference);
    // Ensure that the bid is at least the `minimum_raise` more than the previous
    // bid
    ensure!(
        euro_cent_difference >= state.minimum_raise,
        BidError::BidBelowMinimumRaise
    );

    if let Some(account_address) = host.state_mut().highest_bidder.replace(sender_address) {
        // Refunding old highest bidder;
        // This transfer (given enough NRG of course) always succeeds because the
        // `account_address` exists since it was recorded when it placed a bid.
        // If an `account_address` exists, and the contract has the funds then the
        // transfer will always succeed.
        // Please consider using a pull-over-push pattern when expanding this smart
        // contract to allow smart contract instances to participate in the auction as
        // well. https://consensys.github.io/smart-contract-best-practices/attacks/denial-of-service/
        host.invoke_transfer(&account_address, previous_balance)
            .unwrap_abort();
    }
    Ok(())
}

#[derive(Serial, SchemaType)]
pub struct ViewState {
    pub auction_state: AuctionState,
    /// The highest bidder so far; The variant `None` represents
    /// that no bidder has taken part in the auction yet.
    pub highest_bidder: Option<AccountAddress>,
    /// The minimum accepted raise to over bid the current bidder in Euro cent.
    pub minimum_raise: u64,
    /// Time when auction ends (to be displayed by the front-end)
    pub end: Timestamp,
    /// Token needed to participate in the Auction
    pub participation_token: ParticipationTokenIdentifier,
    pub participants: Vec<AccountAddress>,
}

/// View function that returns the content of the state
#[receive(contract = "auction", name = "view", return_value = "ViewState")]
pub fn view<S: HasStateApi>(
    _ctx: &impl HasReceiveContext,
    host: &impl HasHost<State<S>, StateApiType = S>,
) -> ReceiveResult<ViewState> {
    let state = host.state();
    let participants = state.participants.iter().map(|a| *a).collect();

    Ok(ViewState {
        auction_state: state.auction_state.to_owned(),
        highest_bidder: state.highest_bidder,
        minimum_raise: state.minimum_raise,
        end: state.end,
        participation_token: state.participation_token.to_owned(),
        participants,
    })
}

/// ViewHighestBid function that returns the highest bid which is the balance of
/// the contract
#[receive(contract = "auction", name = "viewHighestBid", return_value = "Amount")]
pub fn view_highest_bid<S: HasStateApi>(
    _ctx: &impl HasReceiveContext,
    host: &impl HasHost<State<S>, StateApiType = S>,
) -> ReceiveResult<Amount> {
    Ok(host.self_balance())
}

/// Receive function used to finalize the auction. It sends the highest bid (the
/// current balance of this smart contract) to the owner of the smart contract
/// instance.
#[receive(
    contract = "auction",
    name = "finalize",
    mutable,
    error = "FinalizeError"
)]
pub fn auction_finalize<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
) -> Result<(), FinalizeError> {
    let state = host.state();
    // Ensure the auction has not been finalized yet
    ensure!(state.auction_state.is_open(), FinalizeError::AuctionNotOpen);

    let slot_time = ctx.metadata().slot_time();
    // Ensure the auction has ended already
    ensure!(slot_time > state.end, FinalizeError::AuctionStillActive);

    if let Some(account_address) = state.highest_bidder {
        if let AuctionState::NotSoldYet(token_identifier) = &state.auction_state {
            Cis2Client::transfer(
                host,
                token_identifier.token_id,
                token_identifier.contract,
                token_identifier.amount,
                Address::Contract(ctx.self_address()),
                Receiver::Account(account_address),
            )
            .map_err(|_| FinalizeError::Cis2TransferError)?
        }

        // Marking the highest bid (the last bidder) as winner of the auction
        host.state_mut().auction_state = AuctionState::Sold(account_address);
        let owner = ctx.owner();
        let balance = host.self_balance();
        // Sending the highest bid (the balance of this contract) to the owner of the
        // smart contract instance;
        // This transfer (given enough NRG of course) always succeeds because the
        // `owner` exists since it deployed the smart contract instance.
        // If an account exists, and the contract has the funds then the
        // transfer will always succeed.
        host.invoke_transfer(&owner, balance).unwrap_abort();
    }
    Ok(())
}

#[concordium_cfg_test]
mod tests {
    use super::*;
    use concordium_cis2::{AdditionalData, TokenAmountU64, TokenIdU8};
    use core::fmt::Debug;
    use std::sync::atomic::{AtomicU8, Ordering};
    use test_infrastructure::*;

    // A counter for generating new accounts
    static ADDRESS_COUNTER: AtomicU8 = AtomicU8::new(0);
    const AUCTION_END: u64 = 1;
    const OWNER_ACCOUNT: AccountAddress = AccountAddress([
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 1,
    ]);
    const PARTICIPATION_TOKEN: ParticipationTokenIdentifier = ParticipationTokenIdentifier {
        contract: ContractAddress {
            index: 1,
            subindex: 0,
        },
        token_id: TokenIdU8(1),
    };

    fn expect_error<E, T>(expr: Result<T, E>, err: E, msg: &str)
    where
        E: Eq + Debug,
        T: Debug,
    {
        let actual = expr.expect_err_report(msg);
        unsafe {
            claim_eq!(actual, err);
        }
    }

    fn item_end_parameter() -> InitParameter {
        InitParameter {
            end: Timestamp::from_timestamp_millis(AUCTION_END),
            minimum_raise: 100,
            participation_token: PARTICIPATION_TOKEN,
        }
    }

    fn create_parameter_bytes(parameter: &InitParameter) -> Vec<u8> {
        to_bytes(parameter)
    }

    fn parametrized_init_ctx(parameter_bytes: &[u8]) -> TestInitContext {
        let mut ctx = TestInitContext::empty();
        ctx.set_parameter(parameter_bytes);
        ctx
    }

    fn new_account() -> AccountAddress {
        let account = AccountAddress([ADDRESS_COUNTER.load(Ordering::SeqCst); 32]);
        ADDRESS_COUNTER.fetch_add(1, Ordering::SeqCst);
        account
    }

    fn new_account_ctx<'a>() -> (AccountAddress, TestReceiveContext<'a>) {
        let account = new_account();
        let ctx = new_ctx(account, Address::Account(account), AUCTION_END);
        (account, ctx)
    }

    fn new_ctx<'a>(
        owner: AccountAddress,
        sender: Address,
        slot_time: u64,
    ) -> TestReceiveContext<'a> {
        let mut ctx = TestReceiveContext::empty();
        ctx.set_sender(sender);
        ctx.set_owner(owner);
        ctx.set_metadata_slot_time(Timestamp::from_timestamp_millis(slot_time));
        ctx
    }

    fn bid(
        host: &mut TestHost<State<TestStateApi>>,
        ctx: &TestContext<TestReceiveOnlyData>,
        amount: Amount,
        current_smart_contract_balance: Amount,
    ) {
        // Setting the contract balance.
        // This should be the sum of the contract’s initial balance and
        // the amount you wish to invoke it with when using the TestHost.
        // https://docs.rs/concordium-std/latest/concordium_std/test_infrastructure/struct.TestHost.html#method.set_self_balance
        // This is because the `self_balance` function on-chain behaves as follows:
        // https://docs.rs/concordium-std/latest/concordium_std/trait.HasHost.html#tymethod.self_balance
        host.set_self_balance(amount + current_smart_contract_balance);

        // Invoking the bid function.
        auction_bid(ctx, host, amount).expect_report("Bidding should pass.");
    }

    fn initialize_auction(host: &mut TestHost<State<TestStateApi>>) {
        let sender = Address::Contract(PARTICIPATION_TOKEN.contract);
        let mut ctx = new_ctx(OWNER_ACCOUNT, sender, 0);
        let params = ContractOnReceivingCis2Params {
            amount: TokenAmountU64::from(1),
            data: AdditionalData::empty(),
            from: Address::Account(OWNER_ACCOUNT),
            token_id: TokenIdU8(2),
        };
        let param_bytes = to_bytes(&params);
        ctx.set_parameter(&param_bytes);

        auction_on_cis2_received(&ctx, host).expect("should add a token for Auction");
    }

    fn add_auction_participant(host: &mut TestHost<State<TestStateApi>>, participant: Address) {
        let sender = Address::Contract(PARTICIPATION_TOKEN.contract);
        let mut ctx = new_ctx(OWNER_ACCOUNT, sender, 0);
        let params = ContractOnReceivingCis2Params {
            amount: TokenAmountU64::from(1),
            data: AdditionalData::empty(),
            from: participant,
            token_id: PARTICIPATION_TOKEN.token_id,
        };
        let param_bytes = to_bytes(&params);
        ctx.set_parameter(&param_bytes);

        auction_on_cis2_received(&ctx, host).expect("should add a participant");
    }

    #[concordium_test]
    /// Test that the smart-contract initialization sets the state correctly
    /// (no bids, active state, indicated auction-end time and item name).
    fn test_init() {
        let parameter_bytes = create_parameter_bytes(&item_end_parameter());
        let ctx = parametrized_init_ctx(&parameter_bytes);

        let mut state_builder = TestStateBuilder::new();

        let state_result = auction_init(&ctx, &mut state_builder);
        state_result.expect_report("Contract initialization results in error");
    }

    #[concordium_test]
    /// Test a sequence of bids and finalizations:
    /// 0. Auction is initialized.
    /// 1. Alice successfully bids 0.1 CCD.
    /// 2. Alice successfully bids 0.2 CCD, highest
    /// bid becomes 0.2 CCD. Alice gets her 0.1 CCD refunded.
    /// 3. Bob successfully bids 0.3 CCD, highest
    /// bid becomes 0.3 CCD. Alice gets her 0.2 CCD refunded.
    /// 4. Someone tries to finalize the auction before
    /// its end time. Attempt fails.
    /// 5. Dave successfully finalizes the auction after its end time.
    /// Carol (the owner of the contract) collects the highest bid amount.
    /// 6. Attempts to subsequently bid or finalize fail.
    fn test_auction_bid_and_finalize() {
        let parameter_bytes = create_parameter_bytes(&item_end_parameter());
        let ctx0 = parametrized_init_ctx(&parameter_bytes);

        let amount = Amount::from_micro_ccd(100);
        let winning_amount = Amount::from_micro_ccd(300);
        let big_amount = Amount::from_micro_ccd(500);

        let mut state_builder = TestStateBuilder::new();

        // Initializing auction
        let initial_state =
            auction_init(&ctx0, &mut state_builder).expect("Initialization should pass");

        let mut host = TestHost::new(initial_state, state_builder);
        host.set_exchange_rates(ExchangeRates {
            euro_per_energy: ExchangeRate::new_unchecked(1, 1),
            micro_ccd_per_euro: ExchangeRate::new_unchecked(1, 1),
        });

        initialize_auction(&mut host);

        // 1st bid: Alice bids `amount`.
        // The current_smart_contract_balance before the invoke is 0.
        let (alice, alice_ctx) = new_account_ctx();
        add_auction_participant(&mut host, alice_ctx.sender());
        bid(&mut host, &alice_ctx, amount, Amount::from_micro_ccd(0));

        // 2nd bid: Alice bids `amount + amount`.
        // Alice gets her initial bid refunded.
        // The current_smart_contract_balance before the invoke is amount.
        bid(&mut host, &alice_ctx, amount + amount, amount);

        // 3rd bid: Bob bids `winning_amount`.
        // Alice gets refunded.
        // The current_smart_contract_balance before the invoke is amount + amount.
        let (bob, bob_ctx) = new_account_ctx();
        add_auction_participant(&mut host, bob_ctx.sender());
        bid(&mut host, &bob_ctx, winning_amount, amount + amount);

        // Trying to finalize auction that is still active
        // (specifically, the tx is submitted at the last moment,
        // at the AUCTION_END time)
        let mut ctx4 = TestReceiveContext::empty();
        ctx4.set_metadata_slot_time(Timestamp::from_timestamp_millis(AUCTION_END));
        ctx4.set_self_address(ContractAddress {
            index: 1,
            subindex: 0,
        });
        let fin_res = auction_finalize(&ctx4, &mut host);
        expect_error(
            fin_res,
            FinalizeError::AuctionStillActive,
            "Finalizing the auction should fail when it's before auction end time",
        );

        // Finalizing auction
        let carol = new_account();
        let dave = new_account();
        let mut ctx5 = new_ctx(carol, Address::Account(dave), AUCTION_END + 1);
        ctx5.set_self_address(ContractAddress {
            index: 1,
            subindex: 0,
        });
        host.setup_mock_entrypoint(
            ContractAddress {
                index: 1,
                subindex: 0,
            },
            OwnedEntrypointName::new_unchecked("transfer".into()),
            MockFn::returning_ok(()),
        );
        let fin_res2 = auction_finalize(&ctx5, &mut host);
        fin_res2.expect_report("Finalizing the auction should work");
        let transfers = host.get_transfers();
        // The input arguments of all executed `host.invoke_transfer`
        // functions are checked here.
        unsafe {
            claim_eq!(
                &transfers[..],
                &[
                    (alice, amount),
                    (alice, amount + amount),
                    (carol, winning_amount),
                ],
                "Transferring CCD to Alice/Carol should work"
            );
            claim_eq!(
                host.state().auction_state,
                AuctionState::Sold(bob),
                "Finalizing the auction should change the auction state to `Sold(bob)`"
            );
            claim_eq!(
                host.state().highest_bidder,
                Some(bob),
                "Finalizing the auction should mark bob as highest bidder"
            );
        }

        // Attempting to finalize auction again should fail.
        let fin_res3 = auction_finalize(&ctx5, &mut host);
        expect_error(
            fin_res3,
            FinalizeError::AuctionNotOpen,
            "Finalizing the auction a second time should fail",
        );

        // Attempting to bid again should fail.
        let res4 = auction_bid(&bob_ctx, &mut host, big_amount);
        expect_error(
            res4,
            BidError::AuctionNotOpen,
            "Bidding should fail because the auction is finalized",
        );
    }

    #[concordium_test]
    /// Bids for amounts lower or equal to the highest bid should be rejected.
    fn test_auction_bid_repeated_bid() {
        let ctx1 = new_account_ctx().1;
        let ctx2 = new_account_ctx().1;

        let parameter_bytes = create_parameter_bytes(&item_end_parameter());
        let ctx0 = parametrized_init_ctx(&parameter_bytes);

        let amount = Amount::from_micro_ccd(100);

        let mut state_builder = TestStateBuilder::new();

        // Initializing auction
        let initial_state =
            auction_init(&ctx0, &mut state_builder).expect("Initialization should succeed.");

        let mut host = TestHost::new(initial_state, state_builder);
        host.set_exchange_rates(ExchangeRates {
            euro_per_energy: ExchangeRate::new_unchecked(1, 1),
            micro_ccd_per_euro: ExchangeRate::new_unchecked(1, 1),
        });

        initialize_auction(&mut host);
        add_auction_participant(&mut host, ctx1.sender());
        add_auction_participant(&mut host, ctx2.sender());

        // 1st bid: Account1 bids `amount`.
        // The current_smart_contract_balance before the invoke is 0.
        bid(&mut host, &ctx1, amount, Amount::from_micro_ccd(0));

        // Setting the contract balance.
        // This should be the sum of the contract’s initial balance and
        // the amount you wish to invoke it with when using the TestHost.
        // The current_smart_contract_balance before the invoke is `amount`.
        // The balance we wish to invoke the next function with is `amount` as well.
        // https://docs.rs/concordium-std/latest/concordium_std/test_infrastructure/struct.TestHost.html#method.set_self_balance
        // This is because the `self_balance` function on-chain behaves as follows:
        // https://docs.rs/concordium-std/latest/concordium_std/trait.HasHost.html#tymethod.self_balance
        host.set_self_balance(amount + amount);

        // 2nd bid: Account2 bids `amount` (should fail
        // because amount is equal to highest bid).
        let res2 = auction_bid(&ctx2, &mut host, amount);
        expect_error(
            res2,
            BidError::BidBelowCurrentBid,
            "Bidding 2 should fail because bid amount must be higher than highest bid",
        );
    }

    #[concordium_test]
    /// Bids for 0 CCD should be rejected.
    fn test_auction_bid_zero() {
        let mut state_builder = TestStateBuilder::new();

        // initializing auction
        let parameter_bytes = create_parameter_bytes(&item_end_parameter());
        let ctx = parametrized_init_ctx(&parameter_bytes);
        let initial_state =
            auction_init(&ctx, &mut state_builder).expect("Initialization should succeed.");

        let mut host = TestHost::new(initial_state, state_builder);

        initialize_auction(&mut host);
        let ctx1 = new_account_ctx().1;
        add_auction_participant(&mut host, ctx1.sender());

        let res = auction_bid(&ctx1, &mut host, Amount::zero());
        expect_error(
            res,
            BidError::BidBelowCurrentBid,
            "Bidding zero should fail",
        );
    }
}
