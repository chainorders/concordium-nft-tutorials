import { useState } from "react";
import { Stepper, Step, StepLabel } from "@mui/material";
import { Box } from "@mui/system";
import { useNavigate } from "react-router-dom";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/common-sdk";

import Cis2BalanceOf from "../components/Cis2BalanceOf";
import Cis2OperatorOf from "../components/Cis2OperatorOf";
import Cis2UpdateOperator from "../components/Cis2UpdateOperator";
import Cis2FindInstance from "../components/Cis2FindInstance";
import MarkerplaceAdd from "../components/MarkerplaceAdd";

enum Steps {
	FindCollection,
	CheckOperator,
	UpdateOperator,
	CheckTokenBalance,
	AddToken,
}

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
		activeStep: Steps;
		nftContract?: ContractAddress;
		tokenId?: string;
	}>({
		activeStep: Steps.FindCollection,
	});

	function onGetCollectionAddress(address: ContractAddress) {
		setState({
			...state,
			activeStep: Steps.CheckOperator,
			nftContract: address,
		});
	}

	function onCheckOperator(hasOwnership: boolean) {
		if (hasOwnership) {
			setState({
				...state,
				activeStep: Steps.CheckTokenBalance,
			});
		} else {
			setState({
				...state,
				activeStep: Steps.UpdateOperator,
			});
		}
	}

	function onUpdateOperator() {
		setState({
			...state,
			activeStep: Steps.CheckTokenBalance,
		});
	}

	function onTokenBalance(tokenId: string, _balance: number) {
		setState({
			...state,
			activeStep: Steps.AddToken,
			tokenId: tokenId,
		});
	}

	let navigate = useNavigate();
	function onTokenListed() {
		navigate("/");
	}

	function StepContent() {
		switch (state.activeStep) {
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
		<>
			<h1>Add NFT</h1>
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

export default AddNftPage;
