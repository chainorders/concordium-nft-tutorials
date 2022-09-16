import {
	detectConcordiumProvider,
	WalletApi,
} from "@concordium/browser-wallet-api-helpers";
import {
	ContractAddress,
	GtuAmount,
	InstanceInfo,
	TransactionStatusEnum,
	TransactionSummary,
} from "@concordium/web-sdk";

import { MICROCCD_IN_CCD } from "../Constants";
import { TokenListItem } from "./MarketplaceTypes";

export function toGtu(ccdAmount: bigint): GtuAmount {
	return new GtuAmount(BigInt(ccdAmount) * BigInt(MICROCCD_IN_CCD));
}

export function toLocalstorageKey(item: TokenListItem): string {
	return `NFT_${item.tokenId}_${item.contract.index}_${item.contract.subindex}`;
}

export async function fetchJson<T>(metadataUrl: string): Promise<T> {
	let res = await fetch(metadataUrl);
	let json = await res.json();

	return json as T;
}

export function getProvider(): Promise<WalletApi> {
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
