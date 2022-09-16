import { Buffer } from "buffer/";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import {
	AccountTransactionType,
	ContractAddress,
	SchemaVersion,
	serializeUpdateContractParameters,
	UpdateContractPayload,
} from "@concordium/web-sdk";

import { MarketplaceDeserializer } from "./MarketplaceDesrializer";
import { TokenList } from "./MarketplaceTypes";
import { toGtu, waitForTransaction } from "./Utils";

export const CONTRACT_NAME = "Market-NFT";
export const enum MethodNames {
	add = "add",
	transfer = "transfer",
	list = "list",
}
export const TRANSFER_ENERGY = BigInt(6000);
export const MARKET_CONTRACT_SCHEMA =
	"FFFF02010000000A0000004D61726B65742D4E465400030000000300000061646400140003000000140000006E66745F636F6E74726163745F616464726573730C08000000746F6B656E5F69641D000500000070726963650A040000006C69737401140101000000100114000300000008000000746F6B656E5F69641D0008000000636F6E74726163740C0500000070726963650A080000007472616E7366657200140003000000140000006E66745F636F6E74726163745F616464726573730C08000000746F6B656E5F69641D0002000000746F0B";
export const MARKET_CONTRACT_SCHEMA_BASE64 =
	"//8CAQAAAAoAAABNYXJrZXQtTkZUAAMAAAADAAAAYWRkABQAAwAAABQAAABuZnRfY29udHJhY3RfYWRkcmVzcwwIAAAAdG9rZW5faWQdAAUAAABwcmljZQoEAAAAbGlzdAEUAQEAAAAQARQAAwAAAAgAAAB0b2tlbl9pZB0ACAAAAGNvbnRyYWN0DAUAAABwcmljZQoIAAAAdHJhbnNmZXIAFAADAAAAFAAAAG5mdF9jb250cmFjdF9hZGRyZXNzDAgAAAB0b2tlbl9pZB0AAgAAAHRvCw==";

export async function list(
	provider: WalletApi,
	marketContractAddress: ContractAddress
): Promise<TokenList> {
	let res = await provider.getJsonRpcClient().invokeContract({
		contract: marketContractAddress,
		method: `${CONTRACT_NAME}.${MethodNames.list}`,
	});

	if (!res || res.tag === "failure") {
		return Promise.reject("invoke contract failure");
	}

	return new MarketplaceDeserializer(
		Buffer.from(res.returnValue as string, "hex")
	).readTokenList();
}

export async function add(
	provider: WalletApi,
	account: string,
	tokenId: string,
	marketContractAddress: ContractAddress,
	nftContractAddress: ContractAddress,
	price: number
) {
	const schemaBuffer = Buffer.from(MARKET_CONTRACT_SCHEMA, "hex");
	const paramJson = {
		nft_contract_address: {
			index: nftContractAddress.index.toString(),
			subindex: nftContractAddress.subindex.toString(),
		},
		token_id: tokenId,
		price: price.toString(),
	};
	const parameter = serializeUpdateContractParameters(
		CONTRACT_NAME,
		MethodNames.add,
		paramJson,
		schemaBuffer,
		SchemaVersion.V2
	);

	let txnhash = await provider.sendTransaction(
		account,
		AccountTransactionType.UpdateSmartContractInstance,
		{
			amount: toGtu(BigInt(0)),
			contractAddress: marketContractAddress,
			maxContractExecutionEnergy: BigInt(9999),
			receiveName: `${CONTRACT_NAME}.${MethodNames.add}`,
			parameter,
		} as UpdateContractPayload,
		paramJson as any,
		schemaBuffer.toString("base64"),
		2
	);

	return waitForTransaction(provider, txnhash);
}

export async function transfer(
	provider: WalletApi,
	account: string,
	marketContractAddress: ContractAddress,
	nftContractAddress: ContractAddress,
	tokenId: string,
	priceCcd: bigint
) {
	const paramJson = {
		nft_contract_address: {
			index: nftContractAddress.index.toString(),
			subindex: nftContractAddress.subindex.toString(),
		},
		token_id: tokenId,
		to: account,
	};

	const marketContractSchemaBuffer = Buffer.from(
		MARKET_CONTRACT_SCHEMA_BASE64,
		"base64"
	);

	const parameter = serializeUpdateContractParameters(
		CONTRACT_NAME,
		MethodNames.transfer,
		paramJson,
		marketContractSchemaBuffer,
		SchemaVersion.V2
	);

	let txnhash = await provider.sendTransaction(
		account,
		AccountTransactionType.UpdateSmartContractInstance,
		{
			amount: toGtu(priceCcd),
			contractAddress: marketContractAddress,
			maxContractExecutionEnergy: TRANSFER_ENERGY,
			receiveName: `${CONTRACT_NAME}.${MethodNames.transfer}`,
			parameter,
		} as UpdateContractPayload,
		paramJson,
		MARKET_CONTRACT_SCHEMA_BASE64,
		2
	);

	return waitForTransaction(provider, txnhash);
}
