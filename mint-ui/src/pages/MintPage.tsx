import { useState } from "react";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import { Stepper, Step, StepLabel, Typography, Paper } from "@mui/material";
import { Container } from "@mui/system";

import { TokenInfo } from "../models/Cis2Types";
import Cis2FindInstanceOrInit from "../components/Cis2FindInstanceOrInit";
import Cis2BatchMint from "../components/Cis2BatchMint";
import { Cis2ContractInfo } from "../models/ConcordiumContractClient";
import Cis2BatchMetadataAdd from "../components/Cis2BatchMetadataAdd";

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
	}>({
		activeStep: steps[0],
	});

	function onGetCollectionAddress(address: ContractAddress) {
		setState({
			...state,
			activeStep: steps[1],
			nftContract: address,
		});
	}

	function onMetadataPrepared(tokenMetadataMap: {
		[tokenId: string]: TokenInfo;
	}) {
		setState({
			...state,
			activeStep: steps[2],
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
						onDone={(address, _contractInfo) => onGetCollectionAddress(address)}
					/>
				);
			case Steps.PrepareMetadata:
				return (
					<Cis2BatchMetadataAdd
						contractInfo={props.contractInfo}
						onDone={onMetadataPrepared}
						startingTokenId={0}
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
