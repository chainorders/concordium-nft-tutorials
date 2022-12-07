//! A multi token example implementation of the Concordium Token Standard CIS2.
//!
//! # Description
//! An instance of this smart contract can contain a number of different token
//! types each identified by a token ID. A token type is then globally
//! identified by the contract address together with the token ID.
//!
//! In this example the contract is initialized with no tokens, and tokens can
//! be minted through a `mint` contract function, which will only succeed for
//! the contract owner. No functionality to burn token is defined in this
//! example.
//!
//! Note: The word 'address' refers to either an account address or a
//! contract address.
//!
//! As follows from the CIS2 specification, the contract has a `transfer`
//! function for transferring an amount of a specific token type from one
//! address to another address. An address can enable and disable one or more
//! addresses as operators. An operator of some address is allowed to transfer
//! any tokens owned by this address.
//!
//! This contract also contains an example of a function to be called when
//! receiving tokens. In which case the contract will forward the tokens to
//! the contract owner.
//! This function is not very useful and is only there to showcase a simple
//! implementation of a token receive hook.

#![cfg_attr(not(feature = "std"), no_std)]
pub mod contract;
mod error;
mod params;
mod state;
mod cis2_client;

use concordium_cis2::*;

use crate::error::ContractError;

/// List of supported standards by this contract address.
const SUPPORTS_STANDARDS: [StandardIdentifier<'static>; 2] =
    [CIS0_STANDARD_IDENTIFIER, CIS2_STANDARD_IDENTIFIER];

// Types

/// Contract token ID type.
/// To save bytes we use a small token ID type, but is limited to be represented
/// by a `u8`.
type ContractTokenId = TokenIdU8;

/// Contract token amount type.
type ContractTokenAmount = TokenAmountU64;
type ContractResult<A> = Result<A, ContractError>;
