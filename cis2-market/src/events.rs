use concordium_std::{SchemaType, Serial};

use crate::{state::TokenListItem, ContractTokenAmount, ContractTokenId};

#[derive(Debug, SchemaType, Serial)]
pub enum MarketEvent {
    QuantityUpdated(TokenListItem<ContractTokenId, ContractTokenAmount>),
}
