import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import { Box, Stepper, Step, StepLabel } from "@mui/material";

import { MetadataUrl } from "../models/Cis2Types";
import Cis2NftMint from "../components/Cis2NftMint";
import Cis2FindInstanceOrInit from "../components/Cis2FindInstanceOrInit";
import Cis2BatchMetadataPrepare from "../components/Cis2BatchMetadataPrepare";
import ConnectPinata from "../components/ConnectPinata";
import UploadFiles from "../components/UploadFiles";
import Cis2NftBatchMint from "../components/Cis2NftBatchMint";

enum Steps {
	GetOrInitCis2,
	ConnectPinata,
	UploadFiles,
	PrepareNftMetadata,
	MintNft,
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
			title: "Upload Nft Image Files",
		},
		{ step: Steps.PrepareNftMetadata, title: "Prepare Nft Metadata" },
		{ step: Steps.MintNft, title: "Mint NFT" },
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

	function onFilesUploaded(files: File[]) {
		setState({
			...state,
			files,
			activeStep: Steps.PrepareNftMetadata,
		});
	}

	function onMetadataPrepared(tokenMetadataMap: {
		[tokenId: string]: MetadataUrl;
	}) {
		setState({
			...state,
			activeStep: Steps.MintNft,
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
				return <ConnectPinata onDone={onPinataConnected} />;
			case Steps.PrepareNftMetadata:
				return (
					<Cis2BatchMetadataPrepare
						provider={props.provider}
						pinataJwt={state.pinataJwt}
						files={state.files}
						onDone={onMetadataPrepared}
					/>
				);
			case Steps.MintNft:
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
			<h1>Mint NFT</h1>
			<Box sx={{ width: "100%" }}>
				<Stepper activeStep={state.activeStep} alternativeLabel>
					{steps.map((step) => (
						<Step key={step.step}>
							<StepLabel>{step.title}</StepLabel>
						</Step>
					))}
				</Stepper>
			</Box>
			<StepContent />
		</>
	);
}

export default BatchMintNftPage;
