import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import { useEffect, useState } from "react";
import { getTokenMetadata } from "../models/Cis2Client";
import { Metadata } from "../models/Cis2Types";
import { fetchJson } from "../models/Utils";

function toLocalstorageKey(tokenId: string, contract: ContractAddress): string {
	return `NFT_${tokenId}_${contract.index}_${contract.subindex}`;
}

function Nft(props: {
	provider: WalletApi;
	account: string;
	tokenId: string;
	contractAddress: ContractAddress;
}) {
	const [state, setState] = useState<{
		metadata?: Metadata;
		error?: string;
		loading: boolean;
	}>({ loading: false });

	const localStorageKey = toLocalstorageKey(
		props.tokenId,
		props.contractAddress
	);

	useEffect(() => {
		setState({ ...state, loading: true });
		let nftJson = localStorage.getItem(localStorageKey);
		if (nftJson) {
			setState({ ...state, loading: false, metadata: JSON.parse(nftJson) });
		} else {
			getTokenMetadata(
				props.provider,
				props.account,
				props.contractAddress,
				props.tokenId
			)
				.then((m) => fetchJson<Metadata>(m.url))
				.then((metadata) => {
					localStorage.setItem(localStorageKey, JSON.stringify(metadata));
					setState({ ...state, loading: false, metadata });
				});
		}
	}, [
		props.tokenId,
		props.contractAddress.index,
		props.contractAddress.subindex,
	]);

	return state.loading ? (
		<p>Loading</p>
	) : (
		<img
			src={state.metadata?.display.url}
			srcSet={state.metadata?.display.url}
			alt={state.metadata?.name}
			loading="lazy"
            width="100%"
		/>
	);
}

export default Nft;
