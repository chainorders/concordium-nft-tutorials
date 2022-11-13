import { ContractAddress, AccountAddress } from '@concordium/web-sdk';

export type TokenList = TokenListItem[];
export interface TokenListItem {
	/**
	 * Hex of token Id
	 */
	tokenId: string;
	contract: ContractAddress;
	price: bigint;
	owner: string;
	royalty: number;
	primaryOwner: string;
	quantity: bigint;
}

export interface AddParams {
	nft_contract_address: {
		index: string;
		subindex: string;
	};
	token_id: string;
	price: string;
	royalty: number;
	quantity: string;
}
