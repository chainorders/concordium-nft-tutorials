import { FormEvent, useState } from "react";
import { detectConcordiumProvider } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import { Typography, Button, Stack, Container } from "@mui/material";

import { Cis2ContractInfo } from "../models/ConcordiumContractClient";
import * as connClient from "../models/ConcordiumContractClient";

export default function Cis2Init(props: {
	contractInfo: Cis2ContractInfo;
	onDone: (address: ContractAddress, contractInfo: Cis2ContractInfo) => void;
}) {
	const [state, setState] = useState({
		error: "",
		processing: false,
	});

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const provider = await detectConcordiumProvider();
		const account = await provider.connect();

		if (!account) {
			return Promise.reject(new Error("Could not connect"));
		}

		setState({ ...state, processing: true });
		connClient
			.initContract(provider, props.contractInfo, account)
			.then((address) => {
				setState({ ...state, processing: false });
				props.onDone(address, props.contractInfo);
			})
			.catch((err: Error) => {
				setState({ ...state, processing: false, error: err.message });
			});
	}

	return (
		<Container sx={{ maxWidth: "xl", pt: "10px" }}>
			<Stack
				component={"form"}
				spacing={2}
				onSubmit={(e) =>
					submit(e).catch((err) =>
						setState({ ...state, error: err.message, processing: false })
					)
				}
			>
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
		</Container>
	);
}
