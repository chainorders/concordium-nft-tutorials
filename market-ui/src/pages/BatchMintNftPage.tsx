import { useState } from "react";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import {
	Stepper,
	Step,
	StepLabel,
	Typography,
	Paper,
} from "@mui/material";
import { Container } from "@mui/system";

import { MetadataUrl } from "../models/Cis2Types";
import Cis2FindInstanceOrInit from "../components/Cis2FindInstanceOrInit";
import ConnectPinata from "../components/ConnectPinata";
import UploadFiles from "../components/UploadFiles";
import Cis2NftBatchMint from "../components/Cis2NftBatchMint";
import Cis2NftBatchMetadataPrepareOrAdd from "../components/Cis2NftBatchMetadataPrepareOrAdd";

enum Steps {
	GetOrInitCis2,
	ConnectPinata,
	UploadFiles,
	PrepareMetadata,
	Mint,
}

type StepType = { step: Steps; title: string };

function BatchMintNftPage(props: { provider: WalletApi; account: string }) {
	const steps: StepType[] = [
		{
			step: Steps.GetOrInitCis2,
			title: "Deploy Or Find NFT Collection",
		},
		{
			step: Steps.ConnectPinata,
			title: "Connect Pinata",
		},
		{
			step: Steps.UploadFiles,
			title: "Upload Image Files",
		},
		{
			step: Steps.PrepareMetadata,
			title: "Prepare Metadata",
		},
		{ step: Steps.Mint, title: "Mint" },
	];

	let [state, setState] = useState<{
		activeStep: StepType;
		nftContract?: ContractAddress;
		tokenMetadataMap?: {
			[tokenId: string]: MetadataUrl;
		};
		pinataJwt: string;
		files: File[];
	}>({
		activeStep: steps[0],
		pinataJwt: "",
		files: [],
	});

	function onGetCollectionAddress(address: ContractAddress) {
		setState({
			...state,
			activeStep: steps[1],
			nftContract: address,
		});
	}

	function onPinataConnected(pinataJwt: string) {
		setState({
			...state,
			pinataJwt,
			activeStep: steps[2],
		});
	}

	function onPinataSkipped() {
		setState({
			...state,
			pinataJwt: "",
			activeStep: steps[3],
		});
	}

	function onFilesUploaded(files: File[]) {
		setState({
			...state,
			files,
			activeStep: steps[3],
		});
	}

	function onMetadataPrepared(tokenMetadataMap: {
		[tokenId: string]: MetadataUrl;
	}) {
		setState({
			...state,
			activeStep: steps[4],
			tokenMetadataMap,
		});
	}

	function onNftsMinted() {
		alert("All Minted");
	}

	function StepContent() {
		switch (state.activeStep.step) {
			case Steps.GetOrInitCis2:
				return (
					<Cis2FindInstanceOrInit
						provider={props.provider}
						account={props.account}
						onDone={(address) => onGetCollectionAddress(address)}
					/>
				);
			case Steps.ConnectPinata:
				return (
					<ConnectPinata onDone={onPinataConnected} onSkip={onPinataSkipped} />
				);
			case Steps.UploadFiles:
				return <UploadFiles onDone={onFilesUploaded} />;
			case Steps.PrepareMetadata:
				return (
					<Cis2NftBatchMetadataPrepareOrAdd
						pinataJwt={state.pinataJwt}
						files={state.files}
						onDone={onMetadataPrepared}
					/>
				);
			case Steps.Mint:
				return (
					<Cis2NftBatchMint
						provider={props.provider}
						account={props.account}
						nftContractAddress={state.nftContract as ContractAddress}
						tokenMetadataMap={state.tokenMetadataMap!}
						onDone={(_) => onNftsMinted()}
					/>
				);
			default:
				return <>Invalid Step</>;
		}
	}

	return (
		<Container sx={{ maxWidth: "xl", pt: "10px" }}>
			<Stepper
				activeStep={state.activeStep.step}
				alternativeLabel
				sx={{ padding: "20px" }}
			>
				{steps.map((step) => (
					<Step key={step.step}>
						<StepLabel>{step.title}</StepLabel>
					</Step>
				))}
			</Stepper>
			<Paper sx={{ padding: "20px" }} variant="outlined">
				<Typography
					variant="h4"
					gutterBottom
					sx={{ pt: "20px" }}
					textAlign="left"
				>
					{state.activeStep.title}
				</Typography>
				<StepContent />
			</Paper>
		</Container>
	);
}

export default BatchMintNftPage;
