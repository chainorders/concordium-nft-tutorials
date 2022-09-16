import { Buffer } from "buffer/";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import {
	ContractAddress,
	serializeUpdateContractParameters,
	SchemaVersion,
	AccountTransactionType,
	TransactionSummary,
	UpdateContractPayload,
	AccountAddress,
	InitContractPayload,
	ModuleReference,
} from "@concordium/web-sdk";

import { Cis2Deserializer } from "./Cis2Deserializer";
import { MetadataUrl, OperatorOfQueryParams } from "./Cis2Types";
import {
	ensureValidOutcome,
	parseContractAddress,
	toGtu,
	waitForTransaction,
} from "./Utils";

export const CONTRACT_NAME = "CIS2-NFT";
export const enum MethodNames {
	operatorOf = "operatorOf",
	supports = "supports",
	balanceOf = "balanceOf",
	updateOperator = "updateOperator",
	mint = "mint",
	tokenMetadata = "tokenMetadata",
}
export const NFT_CONTRACT_MODULE_REF="8e8e7beaa6a1ced4041077c641efb10bbf0f6b8c4f3614d1861d06a6fc6b40dc";
export const NFT_CONTRACT_SCHEMA = "ffff020100000008000000434953322d4e465400090000000900000062616c616e63654f6602100114000200000008000000746f6b656e5f69641d0007000000616464726573731502000000070000004163636f756e7401010000000b08000000436f6e747261637401010000000c10011b25000000040000006d696e7400140002000000050000006f776e65721502000000070000004163636f756e7401010000000b08000000436f6e747261637401010000000c06000000746f6b656e7312001d001400020000000300000075726c1601040000006861736816010a0000006f70657261746f724f66021001140002000000050000006f776e65721502000000070000004163636f756e7401010000000b08000000436f6e747261637401010000000c07000000616464726573731502000000070000004163636f756e7401010000000b08000000436f6e747261637401010000000c1001010f000000736574496d706c656d656e746f72730014000200000002000000696416000c000000696d706c656d656e746f727310020c08000000737570706f727473021001160010011503000000090000004e6f537570706f72740207000000537570706f72740209000000537570706f72744279010100000010000c0d000000746f6b656e4d657461646174610210011d0010011400020000000300000075726c160104000000686173681502000000040000004e6f6e650204000000536f6d650101000000132000000002080000007472616e7366657200100114000500000008000000746f6b656e5f69641d0006000000616d6f756e741b250000000400000066726f6d1502000000070000004163636f756e7401010000000b08000000436f6e747261637401010000000c02000000746f1502000000070000004163636f756e7401010000000b08000000436f6e747261637401020000000c160104000000646174611d010e0000007570646174654f70657261746f720010011400020000000600000075706461746515020000000600000052656d6f7665020300000041646402080000006f70657261746f721502000000070000004163636f756e7401010000000b08000000436f6e747261637401010000000c04000000766965770114000300000005000000737461746510020f1502000000070000004163636f756e7401010000000b08000000436f6e747261637401010000000c1400020000000c0000006f776e65645f746f6b656e7310021d00090000006f70657261746f727310021502000000070000004163636f756e7401010000000b08000000436f6e747261637401010000000c0a000000616c6c5f746f6b656e7310021d00080000006d6574616461746110020f1d001400020000000300000075726c160104000000686173681601"

export async function initContract(
	provider: WalletApi,
    account: string,
) {
	const schemaBuffer = Buffer.from(NFT_CONTRACT_SCHEMA, "hex");
	let txnHash = await provider.sendTransaction(
		account,
		AccountTransactionType.InitializeSmartContractInstance,
		{
			moduleRef: new ModuleReference(NFT_CONTRACT_MODULE_REF),
			contractName: CONTRACT_NAME,
			parameter: Buffer.from([]),
			amount: toGtu(BigInt(0)),
			maxContractExecutionEnergy: BigInt(9999),
		} as InitContractPayload,
		{},
		schemaBuffer.toString("base64"),
		2
	);

	let outcomes = await waitForTransaction(provider, txnHash);
	outcomes = ensureValidOutcome(outcomes);

	return parseContractAddress(outcomes);
}

export async function isOperator(
	provider: WalletApi,
	account: string,
	marketAddress: ContractAddress,
	nftAddress: ContractAddress
): Promise<boolean> {
	let res = await provider.getJsonRpcClient().invokeContract({
		contract: nftAddress,
		method: `${CONTRACT_NAME}.${MethodNames.operatorOf}`,
		parameter: serializeUpdateContractParameters(
			"CIS2-NFT",
			"operatorOf",
			[
				{
					owner: {
						Account: [account],
					},
					address: {
						Contract: [marketAddress],
					},
				},
			] as OperatorOfQueryParams,
			Buffer.from(NFT_CONTRACT_SCHEMA, "hex"),
			SchemaVersion.V2
		),
	});

	if (!res || res.tag === "failure") {
		return Promise.reject(
			"Could not check if market is an operator of CIS2 Contract. Please try again."
		);
	}

	if (!res.returnValue) {
		return Promise.reject(
			"Could not check if market is an operator of CIS2 Contract. Please try again."
		);
	}

	let parsedResult = new Cis2Deserializer(
		Buffer.from(res.returnValue, "hex")
	).readOperatorOfQueryResponse();
	return parsedResult[0];
}

export async function ensureSupportsCis2(
	provider: WalletApi,
	address: ContractAddress
) {
	let res = await provider.getJsonRpcClient().invokeContract({
		contract: address,
		method: `${CONTRACT_NAME}.${MethodNames.supports}`,
		parameter: serializeUpdateContractParameters(
			CONTRACT_NAME,
			MethodNames.supports,
			["CIS-2"],
			Buffer.from(NFT_CONTRACT_SCHEMA, "hex"),
			SchemaVersion.V2
		),
	});

	if (!res || res.tag === "failure") {
		return Promise.reject(
			"Could not check if the contract supports CIS2. Please try again."
		);
	}

	if (!res.returnValue) {
		return Promise.reject("Contract does not support CIS2");
	}

	let parsedResult = new Cis2Deserializer(
		Buffer.from(res.returnValue, "hex")
	).readSupportsQueryResponse();

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
	let res = await provider.getJsonRpcClient().invokeContract({
		contract: nftAddress,
		method: `${CONTRACT_NAME}.${MethodNames.balanceOf}`,
		parameter: serializeUpdateContractParameters(
			CONTRACT_NAME,
			MethodNames.balanceOf,
			[
				{
					token_id: tokenId,
					address: { Account: [account] },
				},
			],
			Buffer.from(NFT_CONTRACT_SCHEMA, "hex"),
			SchemaVersion.V2
		),
	});

	if (!res || res.tag === "failure") {
		return Promise.reject("Could not check token balance. Please try again.");
	}

	if (!res.returnValue) {
		return Promise.reject("Could not check token balance. Please try again.");
	}

	let parsedResult = new Cis2Deserializer(
		Buffer.from(res.returnValue, "hex")
	).readBalanceOfQueryResponse();

	return parsedResult[0];
}

export async function updateOperator(
	provider: WalletApi,
	account: string,
	marketAddress: ContractAddress,
	nftContractAddress: ContractAddress
): Promise<Record<string, TransactionSummary> | undefined> {
	const schemaBuffer = Buffer.from(NFT_CONTRACT_SCHEMA, "hex");
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
	const parameter = serializeUpdateContractParameters(
		CONTRACT_NAME,
		MethodNames.updateOperator,
		paramJson,
		schemaBuffer,
		SchemaVersion.V2
	);

	let txnhash = await provider.sendTransaction(
		account,
		AccountTransactionType.UpdateSmartContractInstance,
		{
			amount: toGtu(BigInt(0)),
			contractAddress: nftContractAddress,
			maxContractExecutionEnergy: BigInt(6000),
			receiveName: `${CONTRACT_NAME}.${MethodNames.updateOperator}`,
			parameter,
		} as UpdateContractPayload,
		paramJson as any,
		schemaBuffer.toString("base64"),
		2
	);

	return waitForTransaction(provider, txnhash);
}

export async function mintNft(
	provider: WalletApi,
	account: string,
	tokenId: string,
	tokenMedataUrl: MetadataUrl,
	nftContractAddress: ContractAddress
) {
	const schemaBuffer = Buffer.from(NFT_CONTRACT_SCHEMA, "hex");
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
	const parameter = serializeUpdateContractParameters(
		CONTRACT_NAME,
		MethodNames.mint,
		paramJson,
		schemaBuffer,
		SchemaVersion.V2
	);

	let txnhash = await provider.sendTransaction(
		account,
		AccountTransactionType.UpdateSmartContractInstance,
		{
			amount: toGtu(BigInt(0)),
			contractAddress: nftContractAddress,
			maxContractExecutionEnergy: BigInt(9999),
			receiveName: `${CONTRACT_NAME}.${MethodNames.mint}`,
			parameter,
		} as UpdateContractPayload,
		paramJson as any,
		schemaBuffer.toString("base64"),
		2
	);

	return waitForTransaction(provider, txnhash);
}

export async function getTokenMetadata(
	provider: WalletApi,
	account: string,
	nftContractAddress: ContractAddress,
	tokenId: string
) {
	let res = await provider.getJsonRpcClient().invokeContract({
		contract: nftContractAddress,
		method: `${CONTRACT_NAME}.${MethodNames.tokenMetadata}`,
		parameter: serializeUpdateContractParameters(
			CONTRACT_NAME,
			MethodNames.tokenMetadata,
			[tokenId],
			Buffer.from(NFT_CONTRACT_SCHEMA, "hex"),
			SchemaVersion.V2
		),
		invoker: new AccountAddress(account),
	});

	if (!res || res.tag === "failure")
		return Promise.reject("invoke contract error");

	return new Cis2Deserializer(
		Buffer.from(res.returnValue as string, "hex")
	).readTokenMetadata();
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