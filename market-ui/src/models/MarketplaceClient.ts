import { Buffer } from "buffer/";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress, TransactionSummary } from "@concordium/web-sdk";

import { MarketplaceDeserializer } from "./MarketplaceDesrializer";
import { TokenList } from "./MarketplaceTypes";
import { MARKET_CONTRACT_SCHEMA } from "../Constants";
import { invokeContract, updateContract } from "./ConcordiumContractClient";

const CONTRACT_NAME = "Market-NFT";
const SCHEMA_BUFFER = Buffer.from(MARKET_CONTRACT_SCHEMA, "hex");
const enum MethodNames {
	add = "add",
	transfer = "transfer",
	list = "list",
}

/**
 * Gets a list of Tokens available to buy.
 * @param provider Wallet Provider.
 * @param marketContractAddress Contract Address.
 * @returns List of buyable tokens.
 */
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

/**
 * Adds a token to buyable list of tokens in marketplace.
 * @param provider Wallet Provider.
 * @param account Account address.
 * @param tokenId Token id.
 * @param marketContractAddress Market place contract Address.
 * @param nftContractAddress CIS2-NFT contract address.
 * @param price Selling Price of the Token.
 * @param maxContractExecutionEnergy Max energy allowed for the transaction.
 * @returns Transaction outcomes.
 */
export async function add(
	provider: WalletApi,
	account: string,
	tokenId: string,
	marketContractAddress: ContractAddress,
	nftContractAddress: ContractAddress,
	price: bigint,
	maxContractExecutionEnergy = BigInt(9999)
): Promise<Record<string, TransactionSummary>> {
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

/**
 * Transfers token ownership from the current owner to {@link account}.
 * @param provider Wallet Provider.
 * @param account Account address buying the token.
 * @param marketContractAddress Market contract address.
 * @param nftContractAddress CIS-NFT contract address.
 * @param tokenId Hex encoded Token Id
 * @param priceCcd Price of the Token
 * @param maxContractExecutionEnergy Max Energy allowed for the transaction.
 * @returns Transaction outcomes.
 */
export async function transfer(
	provider: WalletApi,
	account: string,
	marketContractAddress: ContractAddress,
	nftContractAddress: ContractAddress,
	tokenId: string,
	priceCcd: bigint,
	maxContractExecutionEnergy = BigInt(6000)
): Promise<Record<string, TransactionSummary>> {
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
		priceCcd
	);
}
