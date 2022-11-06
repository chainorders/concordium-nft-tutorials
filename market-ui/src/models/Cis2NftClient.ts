import { Buffer } from "buffer/";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import {
	ContractAddress,
	TransactionSummary,
	AccountAddress,
	ModuleReference,
} from "@concordium/web-sdk";

import { Cis2Deserializer } from "./Cis2Deserializer";
import { MetadataUrl, OperatorOfQueryParams } from "./Cis2Types";
import { NFT_CONTRACT_MODULE_REF, NFT_CONTRACT_SCHEMA } from "../Constants";
import {
	initContract,
	invokeContract,
	updateContract,
} from "./ConcordiumContractClient";

export const CONTRACT_NAME = "CIS2-NFT";
export const enum MethodName {
	operatorOf = "operatorOf",
	supports = "supports",
	balanceOf = "balanceOf",
	updateOperator = "updateOperator",
	mint = "mint",
	tokenMetadata = "tokenMetadata",
}
const SCHEMA_BUFFER = Buffer.from(NFT_CONTRACT_SCHEMA, "hex");
const MODULE_REF = new ModuleReference(NFT_CONTRACT_MODULE_REF);

/**
 * Initilizes CIS2-NFT contract.
 * @param provider Wallet Provider.
 * @param account Account to initialize the contract with.
 * @param maxContractExecutionEnergy Max energy to be used to initialize the contract.
 * @returns
 */
export async function initCis2NftContract(
	provider: WalletApi,
	account: string,
	maxContractExecutionEnergy = BigInt(9999)
): Promise<ContractAddress> {
	return await initContract(
		provider,
		MODULE_REF,
		SCHEMA_BUFFER,
		CONTRACT_NAME,
		account,
		maxContractExecutionEnergy
	);
}

/**
 * Checks wether the input market address in an Operator Of the input account in the CIS2 contract.
 * @param provider Wallet Provider.
 * @param account Account address.
 * @param marketAddress Marketplace Contract Address.
 * @param nftAddress CIS2-NFT contract address.
 * @returns true if @see marketAddress is an operator of @see account in @see nftAddress
 */
export async function isOperator(
	provider: WalletApi,
	account: string,
	marketAddress: ContractAddress,
	nftAddress: ContractAddress
): Promise<boolean> {
	const params = [
		{
			owner: {
				Account: [account],
			},
			address: {
				Contract: [marketAddress],
			},
		},
	] as OperatorOfQueryParams;

	const retValue = await invokeCis2NftContract(
		provider,
		nftAddress,
		MethodName.operatorOf,
		params
	);

	let parsedResult = new Cis2Deserializer(
		retValue
	).readOperatorOfQueryResponse();
	return parsedResult[0];
}

/**
 * Throws an error if the input {@link address} does not support CIS2 format.
 * @param provider Wallet provider.
 * @param address Address of a Smart Contract.
 * @returns undefined.
 */
export async function ensureSupportsCis2(
	provider: WalletApi,
	address: ContractAddress
): Promise<undefined> {
	const paramsJson = ["CIS-2"];
	const retValue = await invokeCis2NftContract(
		provider,
		address,
		MethodName.supports,
		paramsJson
	);

	let parsedResult = new Cis2Deserializer(retValue).readSupportsQueryResponse();

	if (!parsedResult.results || parsedResult.results[0].type !== "Support") {
		return Promise.reject("Contract does not support CIS2");
	}
}

/**
 * Gets token balance of an account.
 * @param provider Wallet Provider.
 * @param account Account to check the balance.
 * @param nftAddress Address of CIS2 smart contract.
 * @param tokenId Hex encoded Token Id.
 * @returns Balance of the {@link tokenId} Token for account {@link account} in CIS2 contract {@link nftAddress}
 */
export async function balanceOf(
	provider: WalletApi,
	account: string,
	nftAddress: ContractAddress,
	tokenId: string
): Promise<number> {
	const paramsJson = [
		{
			token_id: tokenId,
			address: { Account: [account] },
		},
	];

	const retValue = await invokeCis2NftContract(
		provider,
		nftAddress,
		MethodName.balanceOf,
		paramsJson
	);

	let parsedResult = new Cis2Deserializer(
		retValue
	).readBalanceOfQueryResponse();

	return parsedResult[0];
}

/**
 * Gets token Metadata Url.
 * @param provider Wallet Provider.
 * @param account Account address.
 * @param nftContractAddress Contract Address.
 * @param tokenId Hex encoded Token Id.
 * @returns Token Metadata {@link MetadataUrl}
 */
export async function getTokenMetadata(
	provider: WalletApi,
	account: string,
	nftContractAddress: ContractAddress,
	tokenId: string
): Promise<MetadataUrl> {
	const params = [tokenId];
	const retValue = await invokeCis2NftContract(
		provider,
		nftContractAddress,
		MethodName.tokenMetadata,
		params,
		new AccountAddress(account)
	);
	return new Cis2Deserializer(retValue).readTokenMetadata();
}

/**
 * Updates the operator for Account: {@link account}
 * in Contract: {@link nftContractAddress} to Contract: {@link marketAddress}
 * @param provider Wallet Provider.
 * @param account Account address.
 * @param marketAddress Marketplace contract address.
 * @param nftContractAddress CIS2-NFT contract address.
 * @param maxContractExecutionEnergy Max energy to spend on the operation.
 * @returns Transaction outcomes {@link Record<string, TransactionSummary>}
 */
export async function updateOperator(
	provider: WalletApi,
	account: string,
	marketAddress: ContractAddress,
	nftContractAddress: ContractAddress,
	maxContractExecutionEnergy = BigInt(6000)
): Promise<Record<string, TransactionSummary> | undefined> {
	const paramJson = [
		{
			update: { Add: {} },
			operator: {
				Contract: [
					{
						index: marketAddress.index.toString(),
						subindex: marketAddress.subindex.toString(),
					},
				],
			},
		},
	];

	return updateCis2NftContract(
		provider,
		paramJson,
		account,
		nftContractAddress,
		MethodName.updateOperator,
		maxContractExecutionEnergy,
		BigInt(0)
	);
}

/**
 * Mints an new NFT in Contract: {@link nftContractAddress}
 * represented by Id: {@link tokenId} and Metadata: {@link tokenMedataUrl}
 * @param provider Wallet Provider.
 * @param account Account address.
 * @param tokenId Token Id
 * @param tokenMedataUrl Token Metadata Url & Hash
 * @param nftContractAddress CIS-NFT contract address.
 * @param maxContractExecutionEnergy Max allowed energy ot Minting.
 * @returns Transaction outcomes {@link Record<string, TransactionSummary>}
 */
export async function mintNft(
	provider: WalletApi,
	account: string,
	tokenId: string,
	tokenMedataUrl: MetadataUrl,
	nftContractAddress: ContractAddress,
	maxContractExecutionEnergy = BigInt(9999)
): Promise<Record<string, TransactionSummary>> {
	const paramJson = {
		owner: {
			Account: [account],
		},
		tokens: [
			[
				tokenId,
				{
					url: tokenMedataUrl.url,
					hash: tokenMedataUrl.hash,
				},
			],
		],
	};

	return updateCis2NftContract(
		provider,
		paramJson,
		account,
		nftContractAddress,
		MethodName.mint,
		maxContractExecutionEnergy,
		BigInt(0)
	);
}

/**
 * Mints multiple NFT in Contract: {@link nftContractAddress}
 * represented by {@link tokenMetadataMap}
 * @param provider Wallet Provider.
 * @param account Account address.
 * @param tokenMetadataMap Map of Token Id and Metadata Url.
 * @param nftContractAddress CIS-NFT contract address.
 * @param maxContractExecutionEnergy Max allowed energy ot Minting.
 * @returns Transaction outcomes {@link Record<string, TransactionSummary>}
 */
export async function batchMintNft(
	provider: WalletApi,
	account: string,
	tokenMetadataMap: { [tokenId: string]: MetadataUrl },
	nftContractAddress: ContractAddress,
	maxContractExecutionEnergy = BigInt(9999)
): Promise<Record<string, TransactionSummary>> {
	const paramJson = {
		owner: {
			Account: [account],
		},
		tokens: Object.keys(tokenMetadataMap).map((tokenId) => [
			tokenId,
			tokenMetadataMap[tokenId],
		]),
	};

	return updateCis2NftContract(
		provider,
		paramJson,
		account,
		nftContractAddress,
		MethodName.mint,
		maxContractExecutionEnergy,
		BigInt(0)
	);
}

/**
 * Invokes a CIS2 Smart Contract.
 */
async function invokeCis2NftContract<T>(
	provider: WalletApi,
	contract: ContractAddress,
	methodName: MethodName,
	params: T,
	invoker?: ContractAddress | AccountAddress
): Promise<Buffer> {
	return invokeContract(
		provider,
		SCHEMA_BUFFER,
		CONTRACT_NAME,
		contract,
		methodName,
		params,
		invoker
	);
}

/**
 * Updates a CIS2 Smart Contract.
 */
async function updateCis2NftContract<T>(
	provider: WalletApi,
	paramJson: T,
	account: string,
	contractAddress: ContractAddress,
	methodName: MethodName,
	maxContractExecutionEnergy: bigint,
	ccdAmount: bigint
): Promise<Record<string, TransactionSummary>> {
	return updateContract(
		provider,
		CONTRACT_NAME,
		SCHEMA_BUFFER,
		paramJson,
		account,
		contractAddress,
		methodName,
		maxContractExecutionEnergy,
		ccdAmount
	);
}

/**
 * Checks if an input hex encoded token id is a valid token id.
 * @param tokenIdHex Hex encoded token id.
 * @param size Size of the token in bytes in the Contract.
 * @returns true if token is valid.
 */
export function isValidTokenId(tokenIdHex: string, size = 4): boolean {
	try {
		let buff = Buffer.from(tokenIdHex, "hex");
		let parsedTokenIdHex = Buffer.from(buff.subarray(0, size)).toString("hex");

		return parsedTokenIdHex === tokenIdHex;
	} catch (error) {
		console.error(error);
		return false;
	}
}
