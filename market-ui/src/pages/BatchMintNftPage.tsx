import { useState } from "react";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import { Box, Stepper, Step, StepLabel, Typography } from "@mui/material";

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

function BatchMintNftPage(props: { provider: WalletApi; account: string }) {
	const steps = [
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
		{ step: Steps.PrepareMetadata, title: "Prepare Metadata" },
		{ step: Steps.Mint, title: "Mint" },
	];

	let [state, setState] = useState<{
		activeStep: Steps;
		nftContract?: ContractAddress;
		tokenMetadataMap?: {
			[tokenId: string]: MetadataUrl;
		};
		pinataJwt: string;
		files: File[];
	}>({
		activeStep: Steps.GetOrInitCis2,
		pinataJwt: "",
		files: [],
	});

	function onGetCollectionAddress(address: ContractAddress) {
		setState({
			...state,
			activeStep: Steps.ConnectPinata,
			nftContract: address,
		});
	}

	function onPinataConnected(pinataJwt: string) {
		setState({
			...state,
			pinataJwt,
			activeStep: Steps.UploadFiles,
		});
	}

	function onPinataSkipped() {
		setState({
			...state,
			pinataJwt: "",
			activeStep: Steps.PrepareMetadata,
		});
	}

	function onFilesUploaded(files: File[]) {
		setState({
			...state,
			files,
			activeStep: Steps.PrepareMetadata,
		});
	}

	function onMetadataPrepared(tokenMetadataMap: {
		[tokenId: string]: MetadataUrl;
	}) {
		setState({
			...state,
			activeStep: Steps.Mint,
			tokenMetadataMap,
		});
	}

	function onNftsMinted() {
		alert("All Minted");
	}

	function StepContent() {
		switch (state.activeStep) {
			case Steps.GetOrInitCis2:
				return (
					<Cis2FindInstanceOrInit
						provider={props.provider}
						account={props.account}
						onDone={(address) => onGetCollectionAddress(address)}
					/>
				);
			case Steps.UploadFiles:
				return <UploadFiles onDone={onFilesUploaded} />;
			case Steps.ConnectPinata:
				return (
					<ConnectPinata onDone={onPinataConnected} onSkip={onPinataSkipped} />
				);
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
		<>
			<Typography variant="h2">Mint NFTs</Typography>
			<Box>
				<Stepper activeStep={state.activeStep} alternativeLabel>
					{steps.map((step) => (
						<Step key={step.step}>
							<StepLabel>{step.title}</StepLabel>
						</Step>
					))}
				</Stepper>
				<StepContent />
			</Box>
		</>
	);
}

export default BatchMintNftPage;
