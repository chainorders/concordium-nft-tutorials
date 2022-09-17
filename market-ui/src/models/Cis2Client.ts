import { Buffer } from "buffer/";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import {
	ContractAddress,
	TransactionSummary,
	AccountAddress,
	ModuleReference,
	GtuAmount,
} from "@concordium/web-sdk";

import { Cis2Deserializer } from "./Cis2Deserializer";
import { MetadataUrl, OperatorOfQueryParams } from "./Cis2Types";
import { parseContractAddress, toGtu } from "./Utils";
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

export async function initCis2NftContract(
	provider: WalletApi,
	account: string,
	maxContractExecutionEnergy = BigInt(9999)
) {
	const outcomes = await initContract(
		provider,
		MODULE_REF,
		SCHEMA_BUFFER,
		CONTRACT_NAME,
		account,
		maxContractExecutionEnergy
	);

	return parseContractAddress(outcomes);
}

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

export async function ensureSupportsCis2(
	provider: WalletApi,
	address: ContractAddress
) {
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

export async function getTokenMetadata(
	provider: WalletApi,
	account: string,
	nftContractAddress: ContractAddress,
	tokenId: string
) {
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
		toGtu(BigInt(0))
	);
}

export async function mintNft(
	provider: WalletApi,
	account: string,
	tokenId: string,
	tokenMedataUrl: MetadataUrl,
	nftContractAddress: ContractAddress,
	maxContractExecutionEnergy = BigInt(9999)
) {
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
		toGtu(BigInt(0))
	);
}

async function invokeCis2NftContract<T>(
	provider: WalletApi,
	contract: ContractAddress,
	methodName: MethodName,
	params: T,
	invoker?: ContractAddress | AccountAddress
) {
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

async function updateCis2NftContract<T>(
	provider: WalletApi,
	paramJson: T,
	account: string,
	contractAddress: ContractAddress,
	methodName: MethodName,
	maxContractExecutionEnergy: bigint,
	amount: GtuAmount
) {
	return updateContract(
		provider,
		CONTRACT_NAME,
		SCHEMA_BUFFER,
		paramJson,
		account,
		contractAddress,
		methodName,
		maxContractExecutionEnergy,
		amount
	);
}

export function isValidTokenId(tokenIdHex: string, size = 4): boolean {
	try {
		let buff = Buffer.from(tokenIdHex, "hex");
		let parsedTokenIdHex = Buffer.from(buff.subarray(0, size)).toString("hex");
		console.log(
			`input token id; ${tokenIdHex}, parsed token id:${parsedTokenIdHex}`
		);
		return parsedTokenIdHex === tokenIdHex;
	} catch (error) {
		console.error(error);
		return false;
	}
}
