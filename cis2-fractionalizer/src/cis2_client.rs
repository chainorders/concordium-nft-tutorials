//! CIS2 client is the intermediatory layer between marketplace contract and CIS2 contract.
//!
//! # Description
//! It allows Marketplace contract to abstract away logic of calling CIS2 contract for the following methods
//! - `supports_cis2` : Calls [`supports`](https://proposals.concordium.software/CIS/cis-0.html#supports)
//! - `is_operator_of` : Calls [`operatorOf`](https://proposals.concordium.software/CIS/cis-2.html#operatorof)
//! - `get_balance` : Calls [`balanceOf`](https://proposals.concordium.software/CIS/cis-2.html#balanceof)
//! - `transfer` : Calls [`transfer`](https://proposals.concordium.software/CIS/cis-2.html#transfer)

use std::vec;

use concordium_cis2::*;
use concordium_std::*;

use crate::state::State;

pub const TRANSFER_ENTRYPOINT_NAME: &str = "transfer";

#[derive(Serialize, Debug, PartialEq, Eq, Reject, SchemaType)]
pub enum Cis2ClientError {
    InvokeContractError,
    ParseParams,
}

pub struct Cis2Client;

impl Cis2Client {
    pub(crate) fn transfer<
        S,
        T: IsTokenId + Clone + Copy,
        A: IsTokenAmount + Clone + Copy + ops::Sub<Output = A>,
    >(
        host: &mut impl HasHost<State<S>, StateApiType = S>,
        token_id: T,
        nft_contract_address: ContractAddress,
        amount: A,
        from: Address,
        to: Receiver,
    ) -> Result<(), Cis2ClientError>
    where
        S: HasStateApi,
        A: IsTokenAmount,
    {
        let params = TransferParams(vec![Transfer {
            token_id,
            amount,
            from,
            data: AdditionalData::empty(),
            to,
        }]);

        Cis2Client::invoke_contract_read_only(
            host,
            &nft_contract_address,
            TRANSFER_ENTRYPOINT_NAME,
            &params,
        )?;

        Ok(())
    }

    fn invoke_contract_read_only<S: HasStateApi, R: Deserial, P: Serial>(
        host: &mut impl HasHost<State<S>, StateApiType = S>,
        contract_address: &ContractAddress,
        entrypoint_name: &str,
        params: &P,
    ) -> Result<R, Cis2ClientError> {
        let invoke_contract_result = host
            .invoke_contract_read_only(
                contract_address,
                params,
                EntrypointName::new(entrypoint_name).unwrap_abort(),
                Amount::from_ccd(0),
            )
            .map_err(|_e| Cis2ClientError::InvokeContractError)?;
        let mut invoke_contract_res = match invoke_contract_result {
            Some(s) => s,
            None => return Result::Err(Cis2ClientError::InvokeContractError),
        };
        let parsed_res =
            R::deserial(&mut invoke_contract_res).map_err(|_e| Cis2ClientError::ParseParams)?;

        Ok(parsed_res)
    }
}
