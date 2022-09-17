import { Buffer } from "buffer/";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";

import { MarketplaceDeserializer } from "./MarketplaceDesrializer";
import { TokenList } from "./MarketplaceTypes";
import { toGtu } from "./Utils";
import { MARKET_CONTRACT_SCHEMA } from "../Constants";
import { invokeContract, updateContract } from "./ConcordiumContractClient";

const CONTRACT_NAME = "Market-NFT";
const SCHEMA_BUFFER = Buffer.from(MARKET_CONTRACT_SCHEMA, "hex");
const enum MethodNames {
	add = "add",
	transfer = "transfer",
	list = "list",
}

export async function list(
	provider: WalletApi,
	marketContractAddress: ContractAddress
): Promise<TokenList> {
	const retValue = await invokeContract(
		provider,
		SCHEMA_BUFFER,
		CONTRACT_NAME,
		marketContractAddress,
		MethodNames.list
	);
	return new MarketplaceDeserializer(retValue).readTokenList();
}

export async function add(
	provider: WalletApi,
	account: string,
	tokenId: string,
	marketContractAddress: ContractAddress,
	nftContractAddress: ContractAddress,
	price: number,
	maxContractExecutionEnergy = BigInt(9999)
) {
	const paramJson = {
		nft_contract_address: {
			index: nftContractAddress.index.toString(),
			subindex: nftContractAddress.subindex.toString(),
		},
		token_id: tokenId,
		price: price.toString(),
	};
	return updateContract(
		provider,
		CONTRACT_NAME,
		SCHEMA_BUFFER,
		paramJson,
		account,
		marketContractAddress,
		MethodNames.add,
		maxContractExecutionEnergy
	);
}

export async function transfer(
	provider: WalletApi,
	account: string,
	marketContractAddress: ContractAddress,
	nftContractAddress: ContractAddress,
	tokenId: string,
	priceCcd: bigint,
	maxContractExecutionEnergy = BigInt(6000)
) {
	const paramJson = {
		nft_contract_address: {
			index: nftContractAddress.index.toString(),
			subindex: nftContractAddress.subindex.toString(),
		},
		token_id: tokenId,
		to: account,
	};

	return updateContract(
		provider,
		CONTRACT_NAME,
		SCHEMA_BUFFER,
		paramJson,
		account,
		marketContractAddress,
		MethodNames.transfer,
		maxContractExecutionEnergy,
		toGtu(priceCcd)
	);
}
