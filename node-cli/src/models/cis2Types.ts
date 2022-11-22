import { ContractAddress } from "@concordium/node-sdk";
import { Tuple } from "./cis2MultiTypes";

export type TokenIdU32 = number;
export type Address = string | ContractAddress;
export type ContractTokenId = string;
export interface ViewAddressState {
  ownedTokens: ContractTokenId[];
  operators: Address[];
}

export type StateItem = {
  address: string | ContractAddress;
  viewAddressState: ViewAddressState;
};

export interface TokenMetadata {
  url: string;
  hash: string;
}

export interface Metadata {
  tokenId: ContractTokenId;
  tokenMetadata: TokenMetadata;
}

export interface ViewState {
  state: StateItem[];
  allTokens: ContractTokenId[];
  metadata: Metadata[];
}

export interface MetadataUrl {
  url: string;
  hash: string;
}

export interface MintParams {
  owner: {
    Account: string[];
  };
  tokens: Tuple<string, MetadataUrl>[];
}
