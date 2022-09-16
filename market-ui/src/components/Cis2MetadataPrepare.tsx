import { Buffer } from "buffer/";
import { useState } from "react";
import { TextField, Typography, Button } from "@mui/material";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress, sha256 } from "@concordium/web-sdk";

import { MetadataUrl } from "../models/Cis2Types";

function Cis2MetadataPrepare(props: {
	provider: WalletApi;
	nftContractAddress: ContractAddress;
	onDone: (metadata: MetadataUrl) => void;
}) {
	const [state, setState] = useState({
		url: "",
		hash: "",
		error: "",
		checking: false,
	});

	function onOkClicked() {
		fetch(state.url)
			.then((res) => res.arrayBuffer())
			.then((res) => sha256([Buffer.from(res)]).toString("hex"))
			.then((hash) => {
				setState({ ...state, hash, checking: false });
				props.onDone({
					hash,
					url: state.url,
				});
			})
			.catch((err: Error) => {
				setState({ ...state, checking: false, error: err.message });
			});
	}

	return (
		<>
			<h3>Prepare NFT Metadata</h3>
			<h4>
				Contract Index: {props.nftContractAddress.index.toString()}, Sub Index:{" "}
				{props.nftContractAddress.subindex.toString()}
			</h4>
			<form>
				<TextField
					id="metadata-url"
					label="Metadata Url"
					variant="standard"
					value={state.url}
					onChange={(v) => setState({ ...state, url: v.target.value })}
					disabled={state.checking}
				/>
				<br />
				<div>{state.error && <Typography>{state.error}</Typography>}</div>
				<div>{state.checking && <Typography>Checking..</Typography>}</div>
				<Button
					variant="contained"
					disabled={state.checking}
					onClick={() => onOkClicked()}
				>
					Ok
				</Button>
			</form>
		</>
	);
}

export default Cis2MetadataPrepare;
