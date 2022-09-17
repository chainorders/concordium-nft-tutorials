import { Buffer } from "buffer/";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import {
	ContractAddress,
	AccountAddress,
	GtuAmount,
	AccountTransactionType,
	UpdateContractPayload,
	serializeUpdateContractParameters,
	SchemaVersion,
	ModuleReference,
	InitContractPayload,
	InstanceInfo,
	TransactionStatusEnum,
	TransactionSummary,
} from "@concordium/web-sdk";

import { toGtu } from "./Utils";

export async function initContract(
	provider: WalletApi,
	moduleRef: ModuleReference,
	schemaBuffer: Buffer,
	contractName: string,
	account: string,
	maxContractExecutionEnergy = BigInt(9999),
	amount = toGtu(BigInt(0))
) {
	let txnHash = await provider.sendTransaction(
		account,
		AccountTransactionType.InitializeSmartContractInstance,
		{
			moduleRef,
			maxContractExecutionEnergy,
			contractName,
			parameter: Buffer.from([]),
			amount,
		} as InitContractPayload,
		{},
		schemaBuffer.toString("base64"),
		2
	);

	let outcomes = await waitForTransaction(provider, txnHash);
	return ensureValidOutcome(outcomes);
}

export async function invokeContract<T>(
	provider: WalletApi,
	schema: Buffer,
	contractName: string,
	contract: ContractAddress,
	methodName: string,
	params?: T,
	invoker?: ContractAddress | AccountAddress
) {
	const parameter = !!params
		? serializeParams(contractName, schema, methodName, params)
		: undefined;
	let res = await provider.getJsonRpcClient().invokeContract({
		parameter,
		contract,
		invoker,
		method: `${contractName}.${methodName}`,
	});

	if (!res || res.tag === "failure") {
		return Promise.reject(
			`failed invoking contract ` +
				`method:${methodName}, ` +
				`contract:(index: ${contract.index.toString()}, subindex: ${contract.subindex.toString()})`
		);
	}

	if (!res.returnValue) {
		return Promise.reject(
			`failed invoking contract, null return value` +
				`method:${methodName}, ` +
				`contract:(index: ${contract.index.toString()}, subindex: ${contract.subindex.toString()})`
		);
	}

	return Buffer.from(res.returnValue, "hex");
}

export async function updateContract<T>(
	provider: WalletApi,
	contractName: string,
	schema: Buffer,
	paramJson: T,
	account: string,
	contractAddress: ContractAddress,
	methodName: string,
	maxContractExecutionEnergy: bigint = BigInt(9999),
	amount: GtuAmount = toGtu(BigInt(0))
) {
	const parameter = serializeParams(
		contractName,
		schema,
		methodName,
		paramJson
	);
	let txnHash = await provider.sendTransaction(
		account,
		AccountTransactionType.UpdateSmartContractInstance,
		{
			maxContractExecutionEnergy,
			contractAddress,
			parameter,
			amount,
			receiveName: `${contractName}.${methodName}`,
		} as UpdateContractPayload,
		paramJson as any,
		schema.toString("base64"),
		2 //Schema Version
	);

	let outcomes = await waitForTransaction(provider, txnHash);

	return ensureValidOutcome(outcomes);
}

export async function getInstanceInfo(
	provider: WalletApi,
	address: ContractAddress
): Promise<InstanceInfo> {
	let instanceInfo = await provider.getJsonRpcClient().getInstanceInfo(address);

	if (!instanceInfo) {
		throw Error(
			"Could not get Contract Information. Please confirm the address is correct"
		);
	}

	return instanceInfo;
}

function waitForTransaction(
	provider: WalletApi,
	txnhash: string
): Promise<Record<string, TransactionSummary> | undefined> {
	return new Promise((res, rej) => {
		_wait(provider, txnhash, res, rej);
	});
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

function ensureValidOutcome(
	outcomes?: Record<string, TransactionSummary>
): Record<string, TransactionSummary> {
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

function serializeParams<T>(
	contractName: string,
	schema: Buffer,
	methodName: string,
	params: T
) {
	return serializeUpdateContractParameters(
		contractName,
		methodName,
		params,
		schema,
		SchemaVersion.V2
	);
}
