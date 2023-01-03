use concordium_std::*;

/// `bid` function errors
#[derive(Debug, PartialEq, Eq, Clone, Reject, Serial, SchemaType)]
pub enum BidError {
    /// Raised when a contract tries to bid; Only accounts
    /// are allowed to bid.
    OnlyAccount,
    /// Raised when new bid amount is lower than current highest bid.
    BidBelowCurrentBid,
    /// Raised when a new bid amount is raising the current highest bid
    /// with less than the minimum raise.
    BidBelowMinimumRaise,
    /// Raised when bid is placed after auction end time passed.
    BidTooLate,
    /// Raised when bid is placed after auction has been finalized.
    AuctionNotOpen,
    NotAParticipant
}

/// `finalize` function errors
#[derive(Debug, PartialEq, Eq, Clone, Reject, Serial, SchemaType)]
pub enum FinalizeError {
    /// Raised when finalizing an auction before auction end time passed
    AuctionStillActive,
    /// Raised when finalizing an auction that is already finalized
    AuctionNotOpen,
    Cis2TransferError,
}

#[derive(Debug, PartialEq, Eq, Clone, Reject, Serial, SchemaType)]
pub enum ReceiveError {
    ParseParams,
    ContractOnly,
    OnlyAccount,
    UnAuthorized,
    AuctionAlreadyInitialized

}
