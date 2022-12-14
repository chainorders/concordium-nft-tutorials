import { FormEvent, useState } from "react";
import { Buffer } from "buffer/";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import {
	AccountTransactionType,
	CcdAmount,
	ContractAddress,
	InitContractPayload,
} from "@concordium/web-sdk";
import { Typography, Button, Stack, Container } from "@mui/material";

import { Cis2ContractInfo } from "../models/ConcordiumContractClient";
import * as connClient from "../models/ConcordiumContractClient";

export default function Cis2Init(props: {
	provider: WalletApi;
	account: string;
	contractInfo: Cis2ContractInfo;
	onDone: (address: ContractAddress, contractInfo: Cis2ContractInfo) => void;
}) {
	const [state, setState] = useState({
		error: "",
		processing: false,
	});

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		setState({ ...state, processing: true });
		connClient
			.initContract(props.provider, props.contractInfo, props.account)
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
		</Container>
	);
}

async function initContract<T>(
	provider: WalletApi,
	contractInfo: Cis2ContractInfo,
	account: string,
	params?: T,
	maxContractExecutionEnergy = BigInt(9999),
	amount: CcdAmount = new CcdAmount(BigInt(0))
): Promise<string> {
	const { moduleRef, schemaBuffer, contractName } = contractInfo;

	let txnHash = await provider.sendTransaction(
		account,
		AccountTransactionType.InitContract,
		{
			amount,
			moduleRef,
			initName: contractName,
			param: Buffer.from([]),
			maxContractExecutionEnergy,
		} as InitContractPayload,
		params || {},
		schemaBuffer.toString("base64"),
		2
	);

	return txnHash;
}
