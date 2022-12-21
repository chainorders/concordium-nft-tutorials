import { detectConcordiumProvider } from "@concordium/browser-wallet-api-helpers";
import {
	AccountTransactionType,
	CcdAmount,
	serializeUpdateContractParameters,
	UpdateContractPayload,
} from "@concordium/web-sdk";
import { Button, Link, Stack, TextField, Typography } from "@mui/material";
import { FormEvent, useState } from "react";
import { Buffer } from "buffer/";

export default function Mint() {
	let [state, setState] = useState({
		checking: false,
		error: "",
		hash: "",
	});

	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setState({ ...state, error: "", checking: true, hash: "" });
		const formData = new FormData(event.currentTarget);

		var formValues = {
			index: BigInt(formData.get("contractIndex")?.toString() || "-1"),
			subindex: BigInt(formData.get("contractSubindex")?.toString() || "-1"),
			metadataUrl: formData.get("metadataUrl")?.toString() || "",
			tokenId: formData.get("tokenId")?.toString() || "",
			quantity: parseInt(formData.get("quantity")?.toString() || "-1"),
		};

		if (!(formValues.index >= 0)) {
			setState({ ...state, error: "Invalid Contract Index" });
			return;
		}

		if (!(formValues.subindex >= 0)) {
			setState({ ...state, error: "Invalid Contract Subindex" });
			return;
		}

		if (!(formValues.quantity >= 0)) {
			setState({ ...state, error: "Invalid Quantity" });
			return;
		}

		if (!formValues.metadataUrl) {
			setState({ ...state, error: "Invalid Metadata Url" });
			return;
		}

		if (!formValues.tokenId) {
			setState({ ...state, error: "Invalid Token Id" });
			return;
		}

		const provider = await detectConcordiumProvider();
		const account = await provider.connect();

		if (!account) {
			alert("Please connect");
		}

		const address = { index: formValues.index, subindex: formValues.subindex };
		const paramJson = {
			owner: {
				Account: [account],
			},
			tokens: [
				[
					formValues.tokenId,
					[
						{
							url: formValues.metadataUrl,
							hash: "",
						},
						formValues.quantity.toString(),
					],
				],
			],
		};

		try {
			const schemaBuffer = Buffer.from(
				process.env.REACT_APP_CONTRACT_SCHEMA!,
				"hex"
			);
			const serializedParams = serializeUpdateContractParameters(
				process.env.REACT_APP_CONTRACT_NAME!,
				"mint",
				paramJson,
				schemaBuffer
			);
			const txnHash = await provider.sendTransaction(
				account!,
				AccountTransactionType.Update,
				{
					address,
					message: serializedParams,
					receiveName: `${process.env.REACT_APP_CONTRACT_NAME!}.mint`,
					amount: new CcdAmount(BigInt(0)),
					maxContractExecutionEnergy: BigInt(9999),
				} as UpdateContractPayload,
				paramJson,
				schemaBuffer.toString("base64")
			);

			setState({ checking: false, error: "", hash: txnHash });
		} catch (error: any) {
			setState({ checking: false, error: error.message || error, hash: "" });
		}
	};

	return (
		<Stack
			component={"form"}
			spacing={2}
			onSubmit={submit}
			autoComplete={"true"}
		>
			<TextField
				id="contract-index"
				name="contractIndex"
				label="Contract Index"
				variant="standard"
				type={"number"}
				disabled={state.checking}
			/>
			<TextField
				id="contract-subindex"
				name="contractSubindex"
				label="Contract Sub Index"
				variant="standard"
				type={"number"}
				disabled={state.checking}
				value={0}
			/>
			<TextField
				id="metadata-url"
				name="metadataUrl"
				label="Metadata Url"
				variant="standard"
				disabled={state.checking}
			/>
			<TextField
				id="token-id"
				name="tokenId"
				label="Token Id"
				variant="standard"
				disabled={state.checking}
				defaultValue="01"
			/>
			<TextField
				id="quantity"
				name="quantity"
				label="Token Quantity"
				variant="standard"
				type="number"
				disabled={state.checking}
				defaultValue="1"
			/>
			{state.error && (
				<Typography component="div" color="error">
					{state.error}
				</Typography>
			)}
			{state.checking && <Typography component="div">Checking..</Typography>}
			{state.hash && (
				<Link
					href={`https://dashboard.testnet.concordium.com/lookup/${state.hash}`}
					target="_blank"
				>
					View Transaction <br />
					{state.hash}
				</Link>
			)}
			<Button
				type="submit"
				variant="contained"
				fullWidth
				size="large"
				disabled={state.checking}
			>
				Mint
			</Button>
		</Stack>
	);
}
