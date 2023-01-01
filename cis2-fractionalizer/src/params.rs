use concordium_cis2::*;
use concordium_std::*;
use core::convert::TryInto;

use crate::{
    state::{CollateralKey, CollateralState},
    ContractTokenAmount, ContractTokenId,
};

#[derive(Serial, Deserial, SchemaType)]
pub struct TokenMintParams {
    pub metadata: TokenMetadata,
    pub amount: ContractTokenAmount,
    pub contract: ContractAddress,
    pub token_id: ContractTokenId,
}

/// The parameter for the contract function `mint` which mints a number of
/// token types and/or amounts of tokens to a given address.
#[derive(Serial, Deserial, SchemaType)]
pub struct MintParams {
    /// Owner of the newly minted tokens.
    pub owner: Address,
    /// A collection of tokens to mint.
    pub tokens: collections::BTreeMap<ContractTokenId, TokenMintParams>,
}

/// The parameter type for the contract function `setImplementors`.
/// Takes a standard identifier and a list of contract addresses providing
/// implementations of this standard.
#[derive(Debug, Serialize, SchemaType)]
pub struct SetImplementorsParams {
    /// The identifier for the standard.
    pub id: StandardIdentifierOwned,
    /// The addresses of the implementors of the standard.
    pub implementors: Vec<ContractAddress>,
}

#[derive(Debug, Serialize, Clone, SchemaType)]
pub struct TokenMetadata {
    /// The URL following the specification RFC1738.
    #[concordium(size_length = 2)]
    pub url: String,
    /// A optional hash of the content.
    #[concordium(size_length = 2)]
    pub hash: String,
}

impl TokenMetadata {
    fn get_hash_bytes(&self) -> Option<[u8; 32]> {
        match hex::decode(self.hash.to_owned()) {
            Ok(v) => {
                let slice = v.as_slice();
                match slice.try_into() {
                    Ok(array) => Option::Some(array),
                    Err(_) => Option::None,
                }
            }
            Err(_) => Option::None,
        }
    }

    pub(crate) fn to_metadata_url(&self) -> MetadataUrl {
        MetadataUrl {
            url: self.url.to_string(),
            hash: self.get_hash_bytes(),
        }
    }
}

#[derive(Serialize, SchemaType)]
pub struct ViewAddressState {
    pub balances: Vec<(ContractTokenId, ContractTokenAmount)>,
    pub operators: Vec<Address>,
}

#[derive(Serialize, SchemaType)]
pub struct ViewState {
    pub state: Vec<(Address, ViewAddressState)>,
    pub tokens: Vec<ContractTokenId>,
    pub collaterals: Vec<(CollateralKey, CollateralState)>,
}

/// Parameter type for the CIS-2 function `balanceOf` specialized to the subset
/// of TokenIDs used by this contract.
pub type ContractBalanceOfQueryParams = BalanceOfQueryParams<ContractTokenId>;

/// Response type for the CIS-2 function `balanceOf` specialized to the subset
/// of TokenAmounts used by this contract.
pub type ContractBalanceOfQueryResponse = BalanceOfQueryResponse<ContractTokenAmount>;

pub type TransferParameter = TransferParams<ContractTokenId, ContractTokenAmount>;
