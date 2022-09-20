import { Address, ContractTokenId } from "./cis2Types";

export type Tuple<T1, T2> = [T1, T2];
export type TokenAmountU64 = bigint;
export type ContractTokenAmount = TokenAmountU64;

export interface ViewState {
  state: Tuple<Address, ViewAddressState>[];
  tokens: ContractTokenId[];
}

export interface ViewAddressState {
  balances: Tuple<ContractTokenId, ContractTokenAmount>[];
  operators: Address[];
}
