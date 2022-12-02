import { useState } from "react";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import { Stepper, Step, StepLabel, Typography, Paper } from "@mui/material";
import { Container } from "@mui/system";

import { TokenInfo } from "../models/Cis2Types";
import Cis2FindInstanceOrInit from "../components/Cis2FindInstanceOrInit";
import ConnectPinata from "../components/ConnectPinata";
import UploadFiles from "../components/ui/UploadFiles";
import Cis2BatchMint from "../components/Cis2BatchMint";
import Cis2BatchMetadataPrepareOrAdd from "../components/Cis2BatchMetadataPrepareOrAdd";
import { Cis2ContractInfo } from "../models/ConcordiumContractClient";

enum Steps {
	GetOrInitCis2,
	ConnectPinata,
	UploadFiles,
	PrepareMetadata,
	Mint,
}

type StepType = { step: Steps; title: string };

function MintPage(props: {
	provider: WalletApi;
	account: string;
	contractInfo: Cis2ContractInfo;
}) {
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
			[tokenId: string]: TokenInfo;
		};
		pinataJwt: string;
		files: File[];
	}>({
		activeStep: steps[0],
		pinataJwt: "",
		files: [],
	});

	function onGetCollectionAddress(
		address: ContractAddress,
		contractInfo: Cis2ContractInfo
	) {
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
		[tokenId: string]: TokenInfo;
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
						contractInfo={props.contractInfo}
						onDone={(address, contractInfo) =>
							onGetCollectionAddress(address, contractInfo)
						}
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
					<Cis2BatchMetadataPrepareOrAdd
						contractInfo={props.contractInfo}
						pinataJwt={state.pinataJwt}
						files={state.files}
						onDone={onMetadataPrepared}
					/>
				);
			case Steps.Mint:
				return (
					<Cis2BatchMint
						contractInfo={props.contractInfo}
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

export default MintPage;
