import { Buffer } from "buffer/";
import {
	detectConcordiumProvider,
	WalletApi,
} from "@concordium/browser-wallet-api-helpers";
import {
	AccountAddress,
	AccountTransactionType,
	ContractAddress,
	GtuAmount,
	InitContractPayload,
	ModuleReference,
	SchemaVersion,
	serializeUpdateContractParameters,
	TransactionStatusEnum,
	TransactionSummary,
	UpdateContractPayload,
} from "@concordium/web-sdk";

import {
	MARKET_CONTRACT_SCHEMA,
	MICROCCD_IN_CCD,
	NFT_CONTRACT_SCHEMA,
} from "../Constants";
import { MetadataUrl } from "./MetadataUrl";
import { TokenListItem } from "./TokenListItem";
import { Metadata } from "./Types";
import { Cis2Deserializer } from "./cis2Deserializer";
import { OperatorOfQueryParams } from "./Cis2Types";

export function toGtu(ccdAmount: number) {
	return new GtuAmount(BigInt(ccdAmount) * BigInt(MICROCCD_IN_CCD));
}

export function toLocalstorageKey(item: TokenListItem) {
	return `NFT_${item.tokenId}_${item.contract.index}_${item.contract.subIndex}`;
}

export async function getMetadata(metadataUrl: string): Promise<Metadata> {
	let res = await fetch(metadataUrl);
	let json = await res.json();

	return json as Metadata;
}

export function loadNft(provider: WalletApi, item: TokenListItem) {
	return provider
		.getMostRecentlySelectedAccount()
		.then((account) => {
			if (!account) return Promise.reject("null account");
			return provider.getJsonRpcClient().invokeContract({
				contract: {
					index: item.contract.index,
					subindex: item.contract.subIndex,
				},
				method: "CIS2-NFT.tokenMetadata",
				parameter: serializeUpdateContractParameters(
					"CIS2-NFT",
					"tokenMetadata",
					[item.tokenId],
					Buffer.from(NFT_CONTRACT_SCHEMA, "hex"),
					SchemaVersion.V2
				),
				invoker: new AccountAddress(account),
			});
		})
		.then((r) => {
			if (!r || r.tag === "failure")
				return Promise.reject("invoke contract error");

			return MetadataUrl.fromHex(r.returnValue as string);
		})
		.then((metadata) => getMetadata(metadata.url));
}

export function getProvider() {
	return detectConcordiumProvider();
}

export async function connectWallet(provider: WalletApi): Promise<string> {
	let account = await provider.getMostRecentlySelectedAccount();
	account = account || (await provider.connect());
	if (!account) {
		throw Error("Could not connect wallet");
	}

	return account;
}

export async function listTokens(
	provider: WalletApi,
	marketContractAddress: ContractAddress
) {
	let res = await provider.getJsonRpcClient().invokeContract({
		contract: marketContractAddress,
		method: "Market-NFT.list",
	});

	if (!res || res.tag === "failure") {
		return Promise.reject("invoke contract failure");
	}

	return TokenListItem.readArrayfromHex(res.returnValue as string);
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

export async function getInstanceInfo(
	provider: WalletApi,
	address: ContractAddress
) {
	let instanceInfo = await provider.getJsonRpcClient().getInstanceInfo(address);

	if (!instanceInfo) {
		throw Error(
			"Could not get Contract Information. Please confirm the address is correct"
		);
	}

	return instanceInfo;
}

export async function ensureSupportsCis2(
	provider: WalletApi,
	address: ContractAddress
) {
	let res = await provider.getJsonRpcClient().invokeContract({
		contract: address,
		method: "CIS2-NFT.supports",
		parameter: serializeUpdateContractParameters(
			"CIS2-NFT",
			"supports",
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

	console.log("ensureSupportsCis2", JSON.stringify(res.returnValue));
	let parsedResult = new Cis2Deserializer(
		Buffer.from(res.returnValue, "hex")
	).readSupportsQueryResponse();
	console.log("ensureSupportsCis2", JSON.stringify(parsedResult));

	if (!parsedResult.results || parsedResult.results[0].type !== "Support") {
		return Promise.reject("Contract does not support CIS2");
	}
}

export async function isOperator(
	provider: WalletApi,
	marketAddress: ContractAddress,
	nftAddress: ContractAddress
) {
	let account = await connectWallet(provider);
	let res = await provider.getJsonRpcClient().invokeContract({
		contract: nftAddress,
		method: "CIS2-NFT.operatorOf",
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

	console.log("isOperator", JSON.stringify(res.returnValue));
	let parsedResult = new Cis2Deserializer(
		Buffer.from(res.returnValue, "hex")
	).readOperatorOfQueryResponse();
	console.log("isOperator", JSON.stringify(parsedResult));

	return parsedResult[0];
}

export async function updateOperator(
	provider: WalletApi,
	marketAddress: ContractAddress,
	nftContractAddress: ContractAddress
) {
	const account = await connectWallet(provider);
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
		"CIS2-NFT",
		"updateOperator",
		paramJson,
		schemaBuffer,
		SchemaVersion.V2
	);

	let txnhash = await provider.sendTransaction(
		account,
		AccountTransactionType.UpdateSmartContractInstance,
		{
			amount: toGtu(0),
			contractAddress: nftContractAddress,
			maxContractExecutionEnergy: BigInt(6000),
			receiveName: "CIS2-NFT.updateOperator",
			parameter,
		} as UpdateContractPayload,
		paramJson as any,
		schemaBuffer.toString("base64"),
		2
	);

	return waitForTransaction(provider, txnhash);
}

export async function balanceOf(
	provider: WalletApi,
	nftAddress: ContractAddress,
	tokenId: string
) {
	let account = await connectWallet(provider);
	let res = await provider.getJsonRpcClient().invokeContract({
		contract: nftAddress,
		method: "CIS2-NFT.balanceOf",
		parameter: serializeUpdateContractParameters(
			"CIS2-NFT",
			"balanceOf",
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

	console.log("balanceOf", JSON.stringify(res.returnValue));
	let parsedResult = new Cis2Deserializer(
		Buffer.from(res.returnValue, "hex")
	).readBalanceOfQueryResponse();
	console.log("balanceOf", JSON.stringify(parsedResult));

	return parsedResult[0];
}

export async function addTokenMarketplace(
	provider: WalletApi,
	tokenId: string,
	marketContractAddress: ContractAddress,
	nftContractAddress: ContractAddress,
	price: number
) {
	const account = await connectWallet(provider);
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
		"Market-NFT",
		"add",
		paramJson,
		schemaBuffer,
		SchemaVersion.V2
	);

	let txnhash = await provider.sendTransaction(
		account,
		AccountTransactionType.UpdateSmartContractInstance,
		{
			amount: toGtu(0),
			contractAddress: marketContractAddress,
			maxContractExecutionEnergy: BigInt(9999),
			receiveName: "Market-NFT.add",
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
	tokenId: string,
	tokenMedataUrl: MetadataUrl,
	nftContractAddress: ContractAddress
) {
	const account = await connectWallet(provider);
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
		"CIS2-NFT",
		"mint",
		paramJson,
		schemaBuffer,
		SchemaVersion.V2
	);

	let txnhash = await provider.sendTransaction(
		account,
		AccountTransactionType.UpdateSmartContractInstance,
		{
			amount: toGtu(0),
			contractAddress: nftContractAddress,
			maxContractExecutionEnergy: BigInt(9999),
			receiveName: "CIS2-NFT.mint",
			parameter,
		} as UpdateContractPayload,
		paramJson as any,
		schemaBuffer.toString("base64"),
		2
	);

	return waitForTransaction(provider, txnhash);
}

export async function deployModule(provider: WalletApi, moduleRef: string) {
	const schemaBuffer = Buffer.from(NFT_CONTRACT_SCHEMA, "hex");

	return connectWallet(provider)
		.then((account) =>
			provider.sendTransaction(
				account,
				AccountTransactionType.InitializeSmartContractInstance,
				{
					moduleRef: new ModuleReference(moduleRef),
					contractName: "CIS2-NFT",
					parameter: Buffer.from([]),
					amount: toGtu(0),
					maxContractExecutionEnergy: BigInt(9999),
				} as InitContractPayload,
				{},
				schemaBuffer.toString("base64"),
				2
			)
		)
		.then((txnHash) => waitForTransaction(provider, txnHash))
		.then((outcomes) => ensureValidOutcome(outcomes))
		.then((outcomes) => parseContractAddress(outcomes));
}

export function waitForTransaction(
	provider: WalletApi,
	txnhash: string
): Promise<Record<string, TransactionSummary> | undefined> {
	return new Promise((res, rej) => {
		_wait(provider, txnhash, res, rej);
	});
}

export function ensureValidOutcome(
	outcomes?: Record<string, TransactionSummary>
) {
	if (!outcomes) {
		throw Error("Null Outcome");
	}

	let successTxnSummary = Object.keys(outcomes)
		.map((k) => outcomes[k])
		.find((s) => s.result.outcome === "success");

	if (!successTxnSummary) {
		let failures = Object.keys(outcomes)
			.map((k) => outcomes[k])
			.filter((s) => s.result.outcome === "reject")
			.map((s) => (s.result as any).rejectReason.tag)
			.join(",");
		throw Error(`Transaction failed, reasons: ${failures}`);
	}

	return outcomes;
}

function toBigInt(num: BigInt | number): bigint {
	return BigInt(num.toString(10));
}

export function parseContractAddress(
	outcomes: Record<string, TransactionSummary>
): ContractAddress {
	console.log(outcomes);
	for (const blockHash in outcomes) {
		const res = outcomes[blockHash];

		if (res.result.outcome === "success") {
			for (const event of res.result.events) {
				if (event.tag === "ContractInitialized") {
					return {
						index: toBigInt((event as any).address.index),
						subindex: toBigInt((event as any).address.subindex),
					};
				}
			}
		}
	}

	throw Error(`unable to parse Contract Address from input outcomes`);
}

function _wait(
	provider: WalletApi,
	txnhash: string,
	res: (p: Record<string, TransactionSummary> | undefined) => void,
	rej: (reason: any) => void
) {
	setTimeout(() => {
		provider
			.getJsonRpcClient()
			.getTransactionStatus(txnhash)
			.then((txnStatus) => {
				if (!txnStatus) {
					return rej("Transaction Status is null");
				}

				console.info(`txn : ${txnhash}, status: ${txnStatus?.status}`);
				if (txnStatus?.status === TransactionStatusEnum.Finalized) {
					return res(txnStatus.outcomes);
				}

				_wait(provider, txnhash, res, rej);
			})
			.catch((err) => rej(err));
	}, 1000);
}

// //@ts-ignore
// BigInt.prototype.toJSON = function () {
// 	return this.toString();
// };
