import { useState } from "react";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import { Typography, Button, Stack } from "@mui/material";

import { initCis2NftContract } from "../models/Cis2NftClient";
import { ContractInfo } from "../models/ConcordiumContractClient";

function Cis2Init(props: {
	provider: WalletApi;
	account: string;
	contractInfo: ContractInfo;
	onDone: (address: ContractAddress) => void;
}) {
	let [state, setState] = useState({
		error: "",
		processing: false,
	});

	function onOkClicked() {
		setState({ ...state, processing: true });

		initCis2NftContract(props.provider, props.contractInfo, props.account)
			.then((address) => {
				setState({ ...state, processing: false });
				props.onDone(address);
			})
			.catch((err: Error) => {
				setState({ ...state, processing: false, error: err.message });
			});
	}

	return (
		<Stack component={"form"} spacing={2}>
			{state.error && (
				<Typography component="div" color="error" variant="body1">
					{state.error}
				</Typography>
			)}
			{state.processing && (
				<Typography component="div" variant="body1">
					Deploying..
				</Typography>
			)}
			<Button
				variant="contained"
				disabled={state.processing}
				onClick={() => onOkClicked()}
			>
				Deploy New
			</Button>
		</Stack>
	);
}

export default Cis2Init;
