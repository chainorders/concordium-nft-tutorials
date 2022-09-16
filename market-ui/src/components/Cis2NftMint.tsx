import { useState } from "react";
import { TextField, Typography, Button } from "@mui/material";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";

import { isValidTokenId, mintNft } from "../models/Cis2Client";
import { MetadataUrl } from "../models/Cis2Types";
import { ensureValidOutcome } from "../models/Utils";
import Cis2MetadataDisplay from "./Cis2MetadataDisplay";

function Cis2NftMint(props: {
	provider: WalletApi;
	account: string;
	nftContractAddress: ContractAddress;
	metadata: MetadataUrl;
	onDone: (tokenId: string) => void;
}) {
	const [state, setState] = useState({
		tokenId: "",
		checking: false,
		error: "",
	});

	function onMintClicked() {
		if (!isValidTokenId(state.tokenId || "")) {
			setState({ ...state, error: "Invalid token Id" });
			return;
		}

		if (!state.tokenId) {
			setState({ ...state, error: "Token Id is null" });
			return;
		}

		setState({ ...state, error: "", checking: true });
		mintNft(
			props.provider,
			props.account,
			state.tokenId,
			props.metadata,
			props.nftContractAddress
		)
			.then((o) => ensureValidOutcome(o))
			.then((_) => {
				setState({ ...state, error: "", checking: false });
				props.onDone(state.tokenId as string);
			})
			.catch((e: Error) => {
				setState({ ...state, error: e.message, checking: false });
			});
	}

	return (
		<>
			<h3>Mint NFT</h3>
			<h4>Metadata Url : {props.metadata.url}</h4>
			<h5>Metadata Hash : {props.metadata.hash}</h5>
			<br />
			<Cis2MetadataDisplay metadata={props.metadata} />
			<br />
			<form>
				<TextField
					id="token-id"
					label="Token Id Hex"
					variant="standard"
					value={state.tokenId}
					onChange={(v) => setState({ ...state, tokenId: v.target.value })}
					disabled={state.checking}
				/>
				<div>{state.error && <Typography>{state.error}</Typography>}</div>
				<div>{state.checking && <Typography>Checking..</Typography>}</div>
				<Button
					variant="contained"
					disabled={state.checking}
					onClick={() => onMintClicked()}
				>
					Mint
				</Button>
			</form>
		</>
	);
}

export default Cis2NftMint;