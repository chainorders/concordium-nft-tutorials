use concordium_cis2::*;
use concordium_std::{*};

use crate::{
    error::{ContractError, CustomContractError},
    params::TokenMetadata,
    ContractResult, ContractTokenAmount, ContractTokenId,
};

/// The state for each address.
#[derive(Serial, DeserialWithState, Deletable, StateClone)]
#[concordium(state_parameter = "S")]
pub struct AddressState<S> {
    /// The amount of tokens owned by this address.
    pub(crate) balances: StateMap<ContractTokenId, ContractTokenAmount, S>,
    /// The address which are currently enabled as operators for this address.
    pub(crate) operators: StateSet<Address, S>,
}

impl<S: HasStateApi> AddressState<S> {
    fn empty(state_builder: &mut StateBuilder<S>) -> Self {
        AddressState {
            balances: state_builder.new_map(),
            operators: state_builder.new_set(),
        }
    }
}

#[derive(Serial, Deserial, Clone, SchemaType, Copy)]
pub struct CollateralKey {
    pub contract: ContractAddress,
    pub token_id: ContractTokenId,
    pub owner: AccountAddress,
}

#[derive(Serial, Deserial, Clone, Copy, SchemaType)]
pub struct CollateralState {
    pub received_token_amount: ContractTokenAmount,
    pub minted_token_id: Option<ContractTokenId>,
}

impl CollateralState {
    fn new() -> Self {
        CollateralState {
            received_token_amount: ContractTokenAmount::from(0),
            minted_token_id: Option::None,
        }
    }
}

/// The contract state,
///
/// Note: The specification does not specify how to structure the contract state
/// and this could be structured in a more space efficient way.
#[derive(Serial, DeserialWithState, StateClone)]
#[concordium(state_parameter = "S")]
pub struct State<S> {
    /// The state of addresses.
    pub(crate) state: StateMap<Address, AddressState<S>, S>,
    /// All of the token IDs
    pub(crate) tokens: StateMap<ContractTokenId, MetadataUrl, S>,
    /// Map with contract addresses providing implementations of additional
    /// standards.
    pub(crate) implementors: StateMap<StandardIdentifierOwned, Vec<ContractAddress>, S>,
    pub(crate) collaterals: StateMap<CollateralKey, CollateralState, S>,
}

impl<S: HasStateApi> State<S> {
    /// Construct a state with no tokens
    pub(crate) fn empty(state_builder: &mut StateBuilder<S>) -> Self {
        State {
            state: state_builder.new_map(),
            tokens: state_builder.new_map(),
            implementors: state_builder.new_map(),
            collaterals: state_builder.new_map(),
        }
    }

    /// Mints an amount of tokens with a given address as the owner.
    pub(crate) fn mint(
        &mut self,
        token_id: &ContractTokenId,
        token_metadata: &TokenMetadata,
        amount: ContractTokenAmount,
        owner: &Address,
        state_builder: &mut StateBuilder<S>,
    ) {
        self.tokens
            .insert(*token_id, token_metadata.to_metadata_url());
        let mut owner_state = self
            .state
            .entry(*owner)
            .or_insert_with(|| AddressState::empty(state_builder));
        let mut owner_balance = owner_state.balances.entry(*token_id).or_insert(0.into());
        *owner_balance += amount;
    }

    pub(crate) fn burn(
        &mut self,
        token_id: &ContractTokenId,
        amount: ContractTokenAmount,
        owner: &Address,
    ) -> ContractResult<ContractTokenAmount> {
        match self.state.get_mut(owner) {
            Some(address_state) => match address_state.balances.get_mut(token_id) {
                Some(mut b) => {
                    ensure!(
                        b.cmp(&amount).is_ge(),
                        Cis2Error::Custom(CustomContractError::NoBalanceToBurn)
                    );

                    *b -= amount;
                    Ok(*b)
                }
                None => Err(Cis2Error::Custom(CustomContractError::NoBalanceToBurn)),
            },
            None => Err(Cis2Error::Custom(CustomContractError::NoBalanceToBurn)),
        }
    }

    /// Check that the token ID currently exists in this contract.
    #[inline(always)]
    pub(crate) fn contains_token(&self, token_id: &ContractTokenId) -> bool {
        self.tokens.get(token_id).is_some()
    }

    /// Get the current balance of a given token id for a given address.
    /// Results in an error if the token id does not exist in the state.
    pub(crate) fn balance(
        &self,
        token_id: &ContractTokenId,
        address: &Address,
    ) -> ContractResult<ContractTokenAmount> {
        ensure!(self.contains_token(token_id), ContractError::InvalidTokenId);
        let balance = self.state.get(address).map_or(0.into(), |address_state| {
            address_state
                .balances
                .get(token_id)
                .map_or(0.into(), |x| *x)
        });
        Ok(balance)
    }

    /// Check if an address is an operator of a given owner address.
    pub(crate) fn is_operator(&self, address: &Address, owner: &Address) -> bool {
        self.state
            .get(owner)
            .map(|address_state| address_state.operators.contains(address))
            .unwrap_or(false)
    }

    /// Update the state with a transfer.
    /// Results in an error if the token id does not exist in the state or if
    /// the from address have insufficient tokens to do the transfer.
    pub(crate) fn transfer(
        &mut self,
        token_id: &ContractTokenId,
        amount: ContractTokenAmount,
        from: &Address,
        to: &Address,
        state_builder: &mut StateBuilder<S>,
    ) -> ContractResult<()> {
        ensure!(self.contains_token(token_id), ContractError::InvalidTokenId);
        // A zero transfer does not modify the state.
        if amount == 0.into() {
            return Ok(());
        }

        // Get the `from` state and balance, if not present it will fail since the
        // balance is interpreted as 0 and the transfer amount must be more than
        // 0 as this point.;
        {
            let mut from_address_state = self
                .state
                .entry(*from)
                .occupied_or(ContractError::InsufficientFunds)?;
            let mut from_balance = from_address_state
                .balances
                .entry(*token_id)
                .occupied_or(ContractError::InsufficientFunds)?;
            ensure!(*from_balance >= amount, ContractError::InsufficientFunds);
            *from_balance -= amount;
        }

        let mut to_address_state = self
            .state
            .entry(*to)
            .or_insert_with(|| AddressState::empty(state_builder));
        let mut to_address_balance = to_address_state
            .balances
            .entry(*token_id)
            .or_insert(0.into());
        *to_address_balance += amount;

        Ok(())
    }

    /// Update the state adding a new operator for a given address.
    /// Succeeds even if the `operator` is already an operator for the
    /// `address`.
    pub(crate) fn add_operator(
        &mut self,
        owner: &Address,
        operator: &Address,
        state_builder: &mut StateBuilder<S>,
    ) {
        let mut owner_state = self
            .state
            .entry(*owner)
            .or_insert_with(|| AddressState::empty(state_builder));
        owner_state.operators.insert(*operator);
    }

    /// Update the state removing an operator for a given address.
    /// Succeeds even if the `operator` is not an operator for the `address`.
    pub(crate) fn remove_operator(&mut self, owner: &Address, operator: &Address) {
        self.state.entry(*owner).and_modify(|address_state| {
            address_state.operators.remove(operator);
        });
    }

    /// Check if state contains any implementors for a given standard.
    pub(crate) fn have_implementors(&self, std_id: &StandardIdentifierOwned) -> SupportResult {
        if let Some(addresses) = self.implementors.get(std_id) {
            SupportResult::SupportBy(addresses.to_vec())
        } else {
            SupportResult::NoSupport
        }
    }

    pub(crate) fn add_collateral(
        &mut self,
        contract: ContractAddress,
        token_id: ContractTokenId,
        owner: AccountAddress,
        received_token_amount: ContractTokenAmount,
    ) {
        let key = CollateralKey {
            contract,
            token_id,
            owner,
        };

        let mut cs = match self.collaterals.get(&key) {
            Some(v) => *v,
            None => CollateralState::new(),
        };

        cs.received_token_amount += received_token_amount;

        self.collaterals.insert(key, cs);
    }

    pub(crate) fn has_collateral(
        &self,
        contract: &ContractAddress,
        token_id: &ContractTokenId,
        owner: &AccountAddress,
    ) -> bool {
        let key = CollateralKey {
            contract: *contract,
            token_id: *token_id,
            owner: *owner,
        };

        self.collaterals.get(&key).is_some()
    }

    pub(crate) fn find_collateral(
        &self,
        token_id: &ContractTokenId,
    ) -> Option<(CollateralKey, ContractTokenAmount)> {
        for c in self.collaterals.iter() {
            match c.1.minted_token_id {
                Some(t) => {
                    if t.eq(token_id) {
                        return Some((c.0.clone(), c.1.received_token_amount));
                    }
                }
                None => continue,
            };
        }

        None
    }

    pub(crate) fn update_collateral_token(
        &mut self,
        contract: ContractAddress,
        token_id: ContractTokenId,
        owner: AccountAddress,
        minted_token_id: ContractTokenId,
    ) -> ContractResult<()> {
        let key = CollateralKey {
            contract,
            token_id,
            owner,
        };

        match self.collaterals.entry(key) {
            Entry::Vacant(_) => bail!(Cis2Error::Custom(CustomContractError::InvalidCollateral)),
            Entry::Occupied(mut e) => {
                e.modify(|s| s.minted_token_id = Some(minted_token_id));
                Ok(())
            }
        }
    }

    /// Set implementors for a given standard.
    pub(crate) fn set_implementors(
        &mut self,
        std_id: StandardIdentifierOwned,
        implementors: Vec<ContractAddress>,
    ) {
        self.implementors.insert(std_id, implementors);
    }
}
