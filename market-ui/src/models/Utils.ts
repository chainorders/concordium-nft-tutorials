import {
	ContractAddress,
	GtuAmount,
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
