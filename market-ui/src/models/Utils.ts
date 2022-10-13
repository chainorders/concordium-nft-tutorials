import { TokenListItem } from "./MarketplaceTypes";

export function toLocalstorageKey(item: TokenListItem): string {
	return `NFT_${item.tokenId}_${item.contract.index}_${item.contract.subindex}`;
}

export async function fetchJson<T>(metadataUrl: string): Promise<T> {
	console.info("metadataUrl", metadataUrl);
	let res = await fetch(metadataUrl);
	let json = await res.json();

	return json as T;
}
