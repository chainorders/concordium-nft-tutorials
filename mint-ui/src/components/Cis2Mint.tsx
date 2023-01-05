import { detectConcordiumProvider } from "@concordium/browser-wallet-api-helpers";
import {
	AccountTransactionType,
	CcdAmount,
	serializeUpdateContractParameters,
	UpdateContractPayload,
} from "@concordium/web-sdk";
import {
	Button,
	Container,
	Link,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { ChangeEvent, FormEvent, useState } from "react";

import MetadataUrlInput from "./MetadataUrlInput";
import { Cis2ContractInfo } from "../models/ConcordiumContractClient";

const mint = async (
	contractInfo: Cis2ContractInfo,
	formValues: {
		index: bigint;
		subindex: bigint;
		metadataUrl: string;
		tokenId: string;
		quantity: number;
	}
) => {
	const provider = await detectConcordiumProvider();
	const account = await provider.connect();

	if (!account) {
		return Promise.reject(new Error("Could not connect"));
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

	const serializedParams = serializeUpdateContractParameters(
		process.env.REACT_APP_CONTRACT_NAME!,
		"mint",
		paramJson,
		contractInfo.schemaBuffer
	);
	return provider.sendTransaction(
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
		contractInfo.schemaBuffer.toString("base64")
	);
};

export default function Cis2Mint(props: { contractInfo: Cis2ContractInfo }) {
	let [state, setState] = useState({
		checking: false,
		error: "",
		hash: "",
	});

	const [formData, setFormData] = useState({
		contractIndex: "",
		contractSubIndex: "0",
		metadataUrl: "",
		tokenId: "01",
		quantity: "1",
	});

	const handleChange = (name?: string, value?: string) => {
		name &&
			setFormData({
				...formData,
				[name]: value,
			});
	};

	const handleChangeEvent = (event: ChangeEvent<HTMLInputElement>) => {
		handleChange(event.target.name, event.target.value);
	};

	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setState({ ...state, error: "", checking: true, hash: "" });

		var formValues = {
			index: BigInt(formData.contractIndex || "-1"),
			subindex: BigInt(formData.contractSubIndex || "-1"),
			metadataUrl: formData.metadataUrl || "",
			tokenId: formData.tokenId || "",
			quantity: parseInt(formData.quantity || "-1"),
		};

		//form validations
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

		mint(props.contractInfo, formValues)
			.then((txnHash) =>
				setState({ checking: false, error: "", hash: txnHash })
			)
			.catch((err) =>
				setState({ checking: false, error: err.message, hash: "" })
			);
	};

	return (
		<Container sx={{ maxWidth: "xl", pt: "10px" }}>
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
					value={formData.contractIndex}
					onChange={handleChangeEvent}
				/>
				<TextField
					id="contract-subindex"
					name="contractSubindex"
					label="Contract Sub Index"
					variant="standard"
					type={"number"}
					disabled={state.checking}
					value={formData.contractSubIndex}
					onChange={handleChangeEvent}
				/>
				<MetadataUrlInput
					id="metadata-url"
					name="metadataUrl"
					label="Metadata Url"
					variant="standard"
					disabled={state.checking}
					value={formData.metadataUrl}
					onChange={handleChange}
				/>
				<TextField
					id="token-id"
					name="tokenId"
					label="Token Id"
					variant="standard"
					disabled={state.checking}
					defaultValue="01"
					value={formData.tokenId}
					onChange={handleChangeEvent}
				/>
				<TextField
					id="quantity"
					name="quantity"
					label="Token Quantity"
					variant="standard"
					type="number"
					disabled={state.checking}
					defaultValue="1"
					onChange={handleChangeEvent}
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
		</Container>
	);
}
