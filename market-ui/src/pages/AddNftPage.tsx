import { useState } from "react";
import {
	Stepper,
	Step,
	StepLabel,
	Typography,
	Paper,
	Divider,
	Stack,
	Container,
} from "@mui/material";
import { Box } from "@mui/system";
import { useNavigate } from "react-router-dom";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/common-sdk";

import Cis2BalanceOf from "../components/Cis2BalanceOf";
import Cis2OperatorOf from "../components/Cis2OperatorOf";
import Cis2UpdateOperator from "../components/Cis2UpdateOperator";
import Cis2FindInstance from "../components/Cis2FindInstance";
import MarkerplaceAdd from "../components/MarketplaceAdd";

enum Steps {
	FindCollection,
	CheckOperator,
	UpdateOperator,
	CheckTokenBalance,
	AddToken,
}
type StepType = { step: Steps; title: string };

function AddNftPage(props: {
	provider: WalletApi;
	account: string;
	marketContractAddress: ContractAddress;
}) {
	const steps = [
		{
			title: "Nft Collection Contract Address",
			step: Steps.FindCollection,
		},
		{ title: "Check Ownership", step: Steps.CheckOperator },
		{ title: "Update Ownership", step: Steps.UpdateOperator },
		{ title: "Check Token Balance", step: Steps.CheckTokenBalance },
		{ title: "Add Token", step: Steps.AddToken },
	];

	let [state, setState] = useState<{
		activeStep: StepType;
		nftContract?: ContractAddress;
		tokenId?: string;
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

	function onCheckOperator(hasOwnership: boolean) {
		if (hasOwnership) {
			setState({
				...state,
				activeStep: steps[3],
			});
		} else {
			setState({
				...state,
				activeStep: steps[2],
			});
		}
	}

	function onUpdateOperator() {
		setState({
			...state,
			activeStep: steps[3],
		});
	}

	function onTokenBalance(tokenId: string, _balance: number) {
		setState({
			...state,
			activeStep: steps[4],
			tokenId: tokenId,
		});
	}

	let navigate = useNavigate();
	function onTokenListed() {
		navigate("/");
	}

	function StepContent() {
		switch (state.activeStep.step) {
			case Steps.FindCollection:
				return (
					<Cis2FindInstance
						provider={props.provider}
						onDone={(address) => onGetCollectionAddress(address)}
					/>
				);
			case Steps.CheckOperator:
				return (
					<Cis2OperatorOf
						provider={props.provider}
						account={props.account}
						marketContractAddress={props.marketContractAddress}
						nftContractAddress={state.nftContract as ContractAddress}
						onDone={(isOperator) => onCheckOperator(isOperator)}
					/>
				);
			case Steps.UpdateOperator:
				return (
					<Cis2UpdateOperator
						provider={props.provider}
						account={props.account}
						marketContractAddress={props.marketContractAddress}
						nftContractAddress={state.nftContract as ContractAddress}
						onDone={() => onUpdateOperator()}
					/>
				);
			case Steps.CheckTokenBalance:
				return (
					<Cis2BalanceOf
						provider={props.provider}
						account={props.account}
						nftContractAddress={state.nftContract as ContractAddress}
						onDone={(id, balance) => onTokenBalance(id, balance)}
					/>
				);
			case Steps.AddToken:
				return (
					<MarkerplaceAdd
						provider={props.provider}
						account={props.account}
						marketContractAddress={props.marketContractAddress}
						nftContractAddress={state.nftContract as ContractAddress}
						tokenId={state.tokenId as string}
						onDone={() => onTokenListed()}
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

export default AddNftPage;
