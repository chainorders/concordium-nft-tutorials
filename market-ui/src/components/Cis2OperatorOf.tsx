import { useState, useEffect } from "react";
import { Paper, Typography, Button } from "@mui/material";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";

import { isOperator } from "../models/Cis2Client";

function Cis2OperatorOf(props: {
	account: string;
	provider: WalletApi;
	marketContractAddress: ContractAddress;
	nftContractAddress: ContractAddress;
	onDone: (hasOwnership: boolean) => void;
}) {
	const [state, setState] = useState({ checking: false, error: "" });

	function checkOperator() {
		let s = { ...state };
		isOperator(
			props.provider,
			props.account,
			props.marketContractAddress,
			props.nftContractAddress
		)
			.then((isOperator) => props.onDone(isOperator))
			.catch((err: Error) => {
				s.checking = false;
				s.error = err.message;
				setState(s);
			})
			.finally(() => {
				s.checking = false;
				setState(s);
			});
	}

	useEffect(() => {
		setState({ ...state, checking: true });
		if (!state.checking) {
			checkOperator();
		}
	}, [props.provider, props.nftContractAddress]);

	return (
		<Paper>
			<h3>Checking Collection Ownership...</h3>
			<div>{state.error && <Typography>{state.error}</Typography>}</div>
			<Button
				variant="contained"
				disabled={state.checking}
				onClick={() => checkOperator()}
			>
				{state.checking ? "Checking..." : "Check"}
			</Button>
		</Paper>
	);
}

export default Cis2OperatorOf;
