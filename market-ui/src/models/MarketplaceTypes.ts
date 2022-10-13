import { ContractAddress } from "@concordium/web-sdk";

export type TokenList = TokenListItem[];
export interface TokenListItem {
	/**
	 * Hex of token Id
	 */
	tokenId: string;
	contract: ContractAddress;
	price: bigint;
}
