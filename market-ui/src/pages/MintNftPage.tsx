import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import { Box, Stepper, Step, StepLabel } from "@mui/material";

import { MetadataUrl } from "../models/Cis2Types";
import Cis2NftMint from "../components/Cis2NftMint";
import Cis2MetadataPrepare from "../components/Cis2MetadataPrepare";
import Cis2FindInstanceOrInit from "../components/Cis2FindInstanceOrInit";

enum Steps {
	GetOrInitCis2,
	PrepareNftMetadata,
	MintNft,
}

function MintNftPage(props: { provider: WalletApi; account: string }) {
	const steps = [
		{
			step: Steps.GetOrInitCis2,
			title: "Deploy Or Find NFT Collection",
		},
		{ step: Steps.PrepareNftMetadata, title: "Prepare Metadata" },
		{ step: Steps.MintNft, title: "Mint NFT" },
	];

	let [state, setState] = useState<{
		activeStep: Steps;
		nftContract?: ContractAddress;
		tokenId?: string;
		nftMetadata?: MetadataUrl;
	}>({
		activeStep: Steps.GetOrInitCis2,
	});

	function onGetCollectionAddress(address: ContractAddress) {
		setState({
			...state,
			activeStep: Steps.PrepareNftMetadata,
			nftContract: address,
		});
	}

	function onMetadataPrepared(metadata: MetadataUrl) {
		setState({
			...state,
			activeStep: Steps.MintNft,
			nftMetadata: metadata,
		});
	}

	let navigate = useNavigate();

	function onNftMinted(tokenId: string) {
		setState({
			...state,
			tokenId,
		});

		navigate("/add");
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
			case Steps.PrepareNftMetadata:
				return (
					<Cis2MetadataPrepare
						provider={props.provider}
						nftContractAddress={state.nftContract as ContractAddress}
						onDone={(metadata) => onMetadataPrepared(metadata)}
					/>
				);
			case Steps.MintNft:
				return (
					<Cis2NftMint
						provider={props.provider}
						account={props.account}
						nftContractAddress={state.nftContract as ContractAddress}
						metadata={state.nftMetadata as MetadataUrl}
						onDone={(tokenId) => onNftMinted(tokenId)}
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

export default MintNftPage;
