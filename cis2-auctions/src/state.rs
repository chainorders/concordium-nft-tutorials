use concordium_cis2::{TokenAmountU64, TokenIdU8};
use concordium_std::*;

use crate::contract::InitParameter;

pub type ContractTokenId = TokenIdU8;

/// Contract token amount type.
pub type ContractTokenAmount = TokenAmountU64;

#[derive(Debug, Serialize, SchemaType, Eq, PartialEq, PartialOrd, Clone)]
pub struct AuctionTokenIdentifier {
    pub(crate) contract: ContractAddress,
    pub(crate) token_id: ContractTokenId,
    pub(crate) amount: ContractTokenAmount,
}

#[derive(Serial, Deserial, SchemaType, Clone)]
pub struct ParticipationTokenIdentifier {
    pub(crate) contract: ContractAddress,
    pub(crate) token_id: ContractTokenId,
}

impl ParticipationTokenIdentifier {
    pub(crate) fn token_eq(&self, token_identifier: &AuctionTokenIdentifier) -> bool {
        self.contract.eq(&token_identifier.contract) && self.token_id.eq(&token_identifier.token_id)
    }
}

impl AuctionTokenIdentifier {
    pub(crate) fn new(
        contract: ContractAddress,
        token_id: ContractTokenId,
        amount: ContractTokenAmount,
    ) -> Self {
        AuctionTokenIdentifier {
            contract,
            token_id,
            amount,
        }
    }
}

/// The state of the auction.
#[derive(Debug, Serialize, SchemaType, Eq, PartialEq, PartialOrd, Clone)]
pub enum AuctionState {
    NotInitialized,
    /// The auction is either
    /// - still accepting bids or
    /// - not accepting bids because it's past the auction end, but nobody has
    ///   finalized the auction yet.
    NotSoldYet(AuctionTokenIdentifier),
    /// The auction has been finalized and the item has been sold to the
    /// winning `AccountAddress`.
    Sold(AccountAddress),
}

impl AuctionState {
    pub fn is_open(&self) -> bool {
        match self {
            AuctionState::NotInitialized => false,
            AuctionState::NotSoldYet(_) => true,
            AuctionState::Sold(_) => false,
        }
    }
}

/// The state of the smart contract.
/// This state can be viewed by querying the node with the command
/// `concordium-client contract invoke` using the `view` function as entrypoint.
#[derive(StateClone, Serial, DeserialWithState)]
#[concordium(state_parameter = "S")]
pub struct State<S: HasStateApi> {
    /// State of the auction
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
    pub participants: StateSet<AccountAddress, S>,
}

impl<S: HasStateApi> State<S> {
    pub fn new(parameter: InitParameter, state_builder: &mut StateBuilder<S>) -> Self {
        State {
            auction_state: AuctionState::NotInitialized,
            highest_bidder: None,
            minimum_raise: parameter.minimum_raise,
            end: parameter.end,
            participation_token: parameter.participation_token,
            participants: state_builder.new_set(),
        }
    }
}
