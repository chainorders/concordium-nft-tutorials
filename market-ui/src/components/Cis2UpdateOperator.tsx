import { useState, useEffect } from "react";
import { Typography, Button } from "@mui/material";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";

import { updateOperator } from "../models/Cis2Client";

function Cis2UpdateOperator(props: {
	provider: WalletApi;
	account: string;
	marketContractAddress: ContractAddress;
	nftContractAddress: ContractAddress;
	onDone: () => void;
}) {
	const [state, setState] = useState({ updating: false, error: "" });

	function update() {
		let s = { ...state };
		updateOperator(
			props.provider,
			props.account,
			props.marketContractAddress,
			props.nftContractAddress
		)
			.then((_) => {
				props.onDone();
			})
			.catch((err: Error) => {
				s.updating = false;
				s.error = err.message;
				setState(s);
			})
			.finally(() => {
				s.updating = false;
				setState(s);
			});
	}

	useEffect(() => {
		setState({ ...state, updating: true });
		if (!state.updating) {
			update();
		}
	}, [props.provider, props.nftContractAddress]);

	return (
		<>
			<h3>Update Collection Ownership</h3>
			<div>{state.error && <Typography>{state.error}</Typography>}</div>
			<Button
				variant="contained"
				disabled={state.updating}
				onClick={() => update()}
			>
				{state.updating ? "Updating..." : "Update"}
			</Button>
		</>
	);
}

export default Cis2UpdateOperator;
