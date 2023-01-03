import { FormEvent, useState } from "react";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { Typography, Button, Stack, TextField } from "@mui/material";
import { Container } from "@mui/system";
import { TransactionSummary, ContractAddress } from "@concordium/web-sdk";

import * as connClient from "../models/ConcordiumContractClient";
import { Cis2ContractInfo } from "../models/ConcordiumContractClient";

async function mint(
	provider: WalletApi,
	account: string,
	tokens: { [tokenId: string]: [{ url: string; hash: string }, string] },
	nftContractAddress: { index: number; subindex: number },
	contractInfo: Cis2ContractInfo,
	maxContractExecutionEnergy = BigInt(9999)
): Promise<Record<string, TransactionSummary>> {
	const paramJson = {
		owner: {
			Account: [account],
		},
		tokens: Object.keys(tokens).map((tokenId) => [tokenId, tokens[tokenId]]),
	};

	return connClient.updateContract(
		provider,
		contractInfo,
		paramJson,
		account,
		nftContractAddress,
		"mint",
		maxContractExecutionEnergy,
		BigInt(0)
	);
}

function MintPage(props: {
	provider: WalletApi;
	account: string;
	contractInfo: Cis2ContractInfo;
	contract?: ContractAddress;
}) {
	let [state, setState] = useState<{
		checking: boolean;
		error: string;
	}>({
		checking: false,
		error: "",
	});

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setState({ ...state, error: "", checking: true });
		const formData = new FormData(event.currentTarget);

		var formValues = {
			index: parseInt(formData.get("contractIndex")?.toString() || "-1"),
			subindex: parseInt(formData.get("contractSubindex")?.toString() || "-1"),
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

		if (!isValidTokenId(formValues.tokenId, props.contractInfo)) {
			setState({ ...state, error: "Invalid Token Id" });
		}

		const address = { index: formValues.index, subindex: formValues.subindex };
		mint(
			props.provider,
			props.account,
			{
				[formValues.tokenId]: [
					{ url: formValues.metadataUrl, hash: "" },
					formValues.quantity.toString(),
				],
			},
			address,
			props.contractInfo
		)
			.then((_) => {
				setState({ ...state, error: "", checking: false });
				alert("Minted");
			})
			.catch((err: Error) =>
				setState({ ...state, error: err.message, checking: false })
			);
	}

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
				<Button
					type="submit"
					variant="contained"
					disabled={state.checking}
					fullWidth
					size="large"
				>
					Mint
				</Button>
			</Stack>
		</Container>
	);
}

export default MintPage;

function isValidTokenId(
	tokenIdHex: string,
	contractInfo: Cis2ContractInfo
): boolean {
	try {
		let buff = Buffer.from(tokenIdHex, "hex");
		let parsedTokenIdHex = Buffer.from(
			buff.subarray(0, contractInfo.tokenIdByteSize)
		).toString("hex");

		return parsedTokenIdHex === tokenIdHex;
	} catch (error) {
		console.error(error);
		return false;
	}
}
