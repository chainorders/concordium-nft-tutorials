import { useState } from "react";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import { Paper, Typography, Button } from "@mui/material";

import { initCis2NftContract } from "../models/Cis2Client";

function Cis2Init(props: {
	provider: WalletApi;
	account: string;
	onDone: (address: ContractAddress) => void;
}) {
	let [state, setState] = useState({
		error: "",
		processing: false,
	});

	function onOkClicked() {
		setState({ ...state, processing: true });

		initCis2NftContract(props.provider, props.account)
			.then((address) => {
				setState({ ...state, processing: false });
				props.onDone(address);
			})
			.catch((err: Error) => {
				setState({ ...state, processing: false, error: err.message });
			});
	}

	return (
		<Paper sx={{padding: "10px"}} variant="outlined">
			<Typography variant="h3">Deploy NFT Collection</Typography>
			<form>
				<div>{state.error && <Typography>{state.error}</Typography>}</div>
				<div>{state.processing && <Typography>Deploying..</Typography>}</div>
				<div>
					<Button
						variant="contained"
						disabled={state.processing}
						onClick={() => onOkClicked()}
					>
						Deploy
					</Button>
				</div>
			</form>
		</Paper>
	);
}

export default Cis2Init;
