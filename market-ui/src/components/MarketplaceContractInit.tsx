import { FormEvent, useState } from "react";
import { Buffer } from "buffer/";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import { Typography, Button, Stack } from "@mui/material";

import { ContractInfo, initContract } from "../models/ConcordiumContractClient";

function MarketplaceContractInit(props: {
	provider: WalletApi;
	account: string;
	contractInfo: ContractInfo;
	onDone: (address: ContractAddress) => void;
}) {
	const [state, setState] = useState({
		error: "",
		processing: false,
	});

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setState({ ...state, processing: true });

		const params = { commission: 0 };
		const serializedParams = Buffer.alloc(2);
		serializedParams.writeUInt16LE(params.commission, 0);

		initContract(
			props.provider,
			props.contractInfo,
			props.account,
			params,
			serializedParams
		)
			.then((address) => {
				setState({ ...state, processing: false });
				props.onDone(address);
			})
			.catch((err: Error) => {
				setState({ ...state, processing: false, error: err.message });
			});
	}

	return (
		<Stack component={"form"} spacing={2} onSubmit={submit}>
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
			<Button variant="contained" disabled={state.processing} type="submit">
				Deploy New
			</Button>
		</Stack>
	);
}

export default MarketplaceContractInit;
