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

export interface AddParams {
	nft_contract_address: {
		index: string;
		subindex: string;
	};
	token_id: string;
	price: string;
	royalty: number;
}
