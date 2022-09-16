use concordium_std::*;

#[derive(Serialize, Debug, PartialEq, Eq, Reject)]
pub enum MarketplaceError {
    ParseParams,
    CalledByAContract,
    TokenNotListed,
    Cis2ClientError(Cis2ClientError),
    CollectionNotCis2,
    InvalidAmountPaid,
    InvokeTransferError,
    NoBalance,
    NotOperator
}

#[derive(Serialize, Debug, PartialEq, Eq, Reject)]
pub enum Cis2ClientError {
    InvokeContractError,
    ParseParams,
    ParseResult,
}