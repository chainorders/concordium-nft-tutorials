use concordium_cis2::{TokenIdU32};
use concordium_std::{Serial, Deserial, SchemaType, ContractAddress, Amount, AccountAddress, Serialize};

type ContractTokenId = TokenIdU32;

#[derive(Serial, Deserial, SchemaType)]
pub(crate) struct AddParams {
    pub nft_contract_address: ContractAddress,
    pub token_id: ContractTokenId,

    /// Price at this the NFT is to be sold.
    /// This includes Selling Price + Marketplace Comission
    pub price: Amount
}

#[derive(Serial, Deserial, SchemaType)]
pub(crate) struct TransferParams {
    pub nft_contract_address: ContractAddress,
    pub token_id: ContractTokenId,
    pub to: AccountAddress
}

#[derive(Debug, Serialize, SchemaType)]
pub struct TokenList(#[concordium(size_length = 2)] pub Vec<TokenListItem>);

#[derive(Debug, Serialize, SchemaType, PartialEq, Eq)]
pub struct TokenListItem {
    pub token_id: ContractTokenId,
    pub contract: ContractAddress,
    pub price: Amount
}