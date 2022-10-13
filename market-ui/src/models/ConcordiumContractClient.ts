import { Buffer } from "buffer/";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import {
	ContractAddress,
	AccountAddress,
	AccountTransactionType,
	UpdateContractPayload,
	serializeUpdateContractParameters,
	SchemaVersion,
	ModuleReference,
	InitContractPayload,
	InstanceInfo,
	TransactionStatusEnum,
	TransactionSummary,
	GtuAmount,
} from "@concordium/web-sdk";

/**
 * Initializes a Smart Contract.
 * @param provider Wallet Provider.
 * @param moduleRef Contract Module Reference. Hash of the Deployed Conctract Module.
 * @param schemaBuffer Buffer of Contract Schema.
 * @param contractName Name of the Contract.
 * @param account Account to Initialize the contract with.
 * @param maxContractExecutionEnergy Maximum energy allowed to execute.
 * @param ccdAmount CCD Amount to initialize the contract with.
 * @returns Contract Address.
 */
export async function initContract(
	provider: WalletApi,
	moduleRef: ModuleReference,
	schemaBuffer: Buffer,
	contractName: string,
	account: string,
	maxContractExecutionEnergy = BigInt(9999),
	ccdAmount = BigInt(0)
): Promise<ContractAddress> {
	let txnHash = await provider.sendTransaction(
		account,
		AccountTransactionType.InitializeSmartContractInstance,
		{
			moduleRef,
			maxContractExecutionEnergy,
			contractName,
			parameter: Buffer.from([]),
			amount: toGtu(ccdAmount),
		} as InitContractPayload,
		{},
		schemaBuffer.toString("base64"),
		2
	);

	let outcomes = await waitForTransaction(provider, txnHash);
	outcomes = ensureValidOutcome(outcomes);
	return parseContractAddress(outcomes);
}

/**
 * Invokes a Smart Contract.
 * @param provider Wallet Provider.
 * @param schema Buffer of Contract Schema.
 * @param contractName Name of the Contract.
 * @param contract Contract Address.
 * @param methodName Contract Method name to Call.
 * @param params Parameters to call the Contract Method with.
 * @param invoker Invoker Account.
 * @returns Buffer of the return value.
 */
export async function invokeContract<T>(
	provider: WalletApi,
	schema: Buffer,
	contractName: string,
	contract: ContractAddress,
	methodName: string,
	params?: T,
	invoker?: ContractAddress | AccountAddress
): Promise<Buffer> {
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
		const msg =
			`failed invoking contract ` +
			`method:${methodName}, ` +
			`contract:(index: ${contract.index.toString()}, subindex: ${contract.subindex.toString()})`;
		return Promise.reject(new Error(msg, { cause: res }));
	}

	if (!res.returnValue) {
		const msg =
			`failed invoking contract, null return value` +
			`method:${methodName}, ` +
			`contract:(index: ${contract.index.toString()}, subindex: ${contract.subindex.toString()})`;
		return Promise.reject(new Error(msg, { cause: res }));
	}

	return Buffer.from(res.returnValue, "hex");
}

/**
 * Updates a Smart Contract.
 * @param provider Wallet Provider.
 * @param contractName Name of the Contract.
 * @param schema Buffer of Contract Schema.
 * @param paramJson Parameters to call the Contract Method with.
 * @param account  Account to Update the contract with.
 * @param contractAddress Contract Address.
 * @param methodName Contract Method name to Call.
 * @param maxContractExecutionEnergy Maximum energy allowed to execute.
 * @param amount CCD Amount to update the contract with.
 * @returns Update contract Outcomes.
 */
export async function updateContract<T>(
	provider: WalletApi,
	contractName: string,
	schema: Buffer,
	paramJson: T,
	account: string,
	contractAddress: ContractAddress,
	methodName: string,
	maxContractExecutionEnergy: bigint = BigInt(9999),
	amount: bigint = BigInt(0)
): Promise<Record<string, TransactionSummary>> {
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
			amount: toGtu(amount),
			receiveName: `${contractName}.${methodName}`,
		} as UpdateContractPayload,
		paramJson as any,
		schema.toString("base64"),
		2 //Schema Version
	);

	let outcomes = await waitForTransaction(provider, txnHash);

	return ensureValidOutcome(outcomes);
}

/**
 * Gets Information about a Smart Contract Instance.
 * @param provider Wallet Provider.
 * @param address Contract Address.
 * @returns Smart Contract instance information.
 */
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

/**
 * Waits for the input transaction to Finalize.
 * @param provider Wallet Provider.
 * @param txnHash Hash of Transaction.
 * @returns Transaction outcomes.
 */
function waitForTransaction(
	provider: WalletApi,
	txnHash: string
): Promise<Record<string, TransactionSummary> | undefined> {
	return new Promise((res, rej) => {
		_wait(provider, txnHash, res, rej);
	});
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

/**
 * Uses Contract Schema to serialize the contract parameters.
 * @param contractName Name of the Contract.
 * @param schema  Buffer of Contract Schema.
 * @param methodName Contract method name.
 * @param params Contract Method params in JSON.
 * @returns Serialize buffer of the input params.
 */
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

function _wait(
	provider: WalletApi,
	txnHash: string,
	res: (p: Record<string, TransactionSummary> | undefined) => void,
	rej: (reason: any) => void
) {
	setTimeout(() => {
		provider
			.getJsonRpcClient()
			.getTransactionStatus(txnHash)
			.then((txnStatus) => {
				if (!txnStatus) {
					return rej("Transaction Status is null");
				}

				console.info(`txn : ${txnHash}, status: ${txnStatus?.status}`);
				if (txnStatus?.status === TransactionStatusEnum.Finalized) {
					return res(txnStatus.outcomes);
				}

				_wait(provider, txnHash, res, rej);
			})
			.catch((err) => rej(err));
	}, 1000);
}

function parseContractAddress(
	outcomes: Record<string, TransactionSummary>
): ContractAddress {
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

function toBigInt(num: BigInt | number): bigint {
	return BigInt(num.toString(10));
}

const MICROCCD_IN_CCD = 1000000;
function toGtu(ccdAmount: bigint): GtuAmount {
	return new GtuAmount(ccdAmount * BigInt(MICROCCD_IN_CCD));
}
