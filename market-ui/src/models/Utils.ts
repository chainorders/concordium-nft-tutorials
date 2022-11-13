import { TokenListItem } from "./MarketplaceTypes";

export function toLocalstorageKey(item: TokenListItem): string {
	return `NFT_${item.tokenId}_${item.contract.index}_${item.contract.subindex}`;
}

export async function fetchJson<T>(metadataUrl: string): Promise<T> {
	let res = await fetch(metadataUrl);

	if (!res.ok) {
		return Promise.reject(new Error("Could not load Metadata"));
	}

	let json = await res.json();

	return json as T;
}
