import { useState } from "react";
import { TextField, Typography, Button } from "@mui/material";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";

import { add } from "../models/MarketplaceClient";
import { ensureValidOutcome } from "../models/Utils";

function MarkerplaceAdd(props: {
	provider: WalletApi;
	account: string;
	marketContractAddress: ContractAddress;
	nftContractAddress: ContractAddress;
	tokenId: string;
	onDone: () => void;
}) {
	const [state, setState] = useState({
		adding: false,
		error: "",
		price: "",
	});

	function isValid() {
		try {
			return state.price && BigInt(state.price) >= 0;
		} catch (e) {
			return false;
		}
	}

	function onAddClicked() {
		setState({ ...state, adding: true });
		add(
			props.provider,
			props.account,
			props.tokenId,
			props.marketContractAddress,
			props.nftContractAddress,
			parseInt(state.price)
		)
			.then((outcomes) => ensureValidOutcome(outcomes))
			.then(() => {
				setState({ ...state, error: "", adding: false });
				props.onDone();
			})
			.catch((err: Error) => {
				setState({ ...state, error: err.message, adding: false });
			});
	}

	return (
		<>
			<h3>Add NFT to Marketplace</h3>
			<form>
				<div>
					<TextField
						id="token-id"
						label="Token Id"
						variant="standard"
						value={props.tokenId}
						disabled
					/>
					<br />
					<TextField
						id="price"
						type={"number"}
						label="Token Price in CCD"
						variant="standard"
						value={state.price}
						onChange={(v) => setState({ ...state, price: v.target.value })}
						disabled={state.adding}
					/>
				</div>
				<div>{state.error && <Typography>{state.error}</Typography>}</div>
				<div>{state.adding && <Typography>Adding..</Typography>}</div>
				<div>
					<Button
						variant="contained"
						disabled={!isValid() || state.adding}
						onClick={() => onAddClicked()}
					>
						Add
					</Button>
				</div>
			</form>
		</>
	);
}

export default MarkerplaceAdd;
