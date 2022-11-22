import { useState } from "react";
import { Button, Grid } from "@mui/material";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";

import { batchMintNft } from "../models/Cis2Client";
import { MetadataUrl } from "../models/Cis2Types";
import Cis2NftBatchItemMint from "./Cis2NftBatchItemMint";

interface TokenState {
	metadataUrl: MetadataUrl;
	minting: boolean;
	minted: boolean;
	error: string;
}

function Cis2NftBatchMint(props: {
	provider: WalletApi;
	account: string;
	nftContractAddress: ContractAddress;
	tokenMetadataMap: { [tokenId: string]: MetadataUrl };
	onDone: (data: { [tokenId: string]: MetadataUrl }) => void;
}) {
	var tokens: { [tokenId: string]: TokenState } = {};

	Object.keys(props.tokenMetadataMap).forEach(
		(tokenId) =>
			(tokens[tokenId] = {
				metadataUrl: props.tokenMetadataMap[tokenId],
				minting: false,
				minted: false,
				error: "",
			})
	);

	const [state, setState] = useState({
		tokens,
		mintingCount: 0,
	});

	function onMintClicked() {
		var tokens = state.tokens;
		var mintingCount = Object.keys(tokens).length;
		setTokensState(tokens, true, false);
		setState({
			...state,
			tokens,
			mintingCount: state.mintingCount + mintingCount,
		});
		batchMintNft(
			props.provider,
			props.account,
			props.tokenMetadataMap,
			props.nftContractAddress
		)
			.then((_) => {
				setTokensState(tokens, false, true);
				var mintingCount = Object.keys(tokens).length;
				setState({
					...state,
					tokens,
					mintingCount: state.mintingCount + mintingCount,
				});
				props.onDone(props.tokenMetadataMap);
			})
			.catch((e: Error) => {
				setTokensState(tokens, false, false, e.message);
				var mintingCount = Object.keys(tokens).length;
				setState({
					...state,
					tokens,
					mintingCount: state.mintingCount - mintingCount,
				});
			});
	}

	return (
		<>
			<h3>Mint NFT</h3>
			<br />
			<Grid container spacing={2}>
				{Object.keys(state.tokens).map((tokenId) => (
					<Grid item xs={6} key={tokenId}>
						<Cis2NftBatchItemMint
							error={state.tokens[tokenId].error}
							key={tokenId}
							metadataUrl={state.tokens[tokenId].metadataUrl}
							minted={state.tokens[tokenId].minted}
							minting={state.tokens[tokenId].minting}
							tokenId={tokenId}
						/>
					</Grid>
				))}
			</Grid>

			<Button
				variant="contained"
				disabled={state.mintingCount > 0}
				onClick={() => onMintClicked()}
			>
				Mint
			</Button>
		</>
	);

	function setTokensState(
		tokens: { [tokenId: string]: TokenState },
		isMinting: boolean,
		isMinted: boolean,
		error?: string
	) {
		Object.keys(tokens).forEach((tokenId) => {
			tokens[tokenId].error = error || "";
			tokens[tokenId].minting = isMinting;

			if (isMinting) {
				tokens[tokenId].minted = false;
			} else {
				tokens[tokenId].minted = isMinted;
			}
		});
	}
}

export default Cis2NftBatchMint;
