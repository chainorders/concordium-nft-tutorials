import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/common-sdk";
import {
	Stepper,
	Step,
	StepLabel,
	Paper,
	TextField,
	Button,
	Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FindNftCollection from "../components/FindNftCollection";
import {
	addTokenMarketplace,
	balanceOf,
	ensureValidOutcome,
	isOperator,
	updateOperator,
} from "../models/Utils";

enum Steps {
	GetCollectionContractAddress,
	CheckOperator,
	UpdateOperator,
	CheckTokenBalance,
	AddToken,
}

function CheckingOperatorStep(props: {
	provider: WalletApi;
	marketContractAddress: ContractAddress;
	nftContractAddress: ContractAddress;
	onDone: (hasOwnership: boolean) => void;
}) {
	const [state, setState] = useState({ checking: false, error: "" });

	function checkOperator() {
		let s = { ...state };
		isOperator(
			props.provider,
			props.marketContractAddress,
			props.nftContractAddress
		)
			.then((hasOwnership) => props.onDone(hasOwnership))
			.catch((err: Error) => {
				s.checking = false;
				s.error = err.message;
				setState(s);
			})
			.finally(() => {
				s.checking = false;
				setState(s);
			});
	}

	useEffect(() => {
		setState({ ...state, checking: true });
		if (!state.checking) {
			checkOperator();
		}
	}, [props.provider, props.nftContractAddress]);

	return (
		<Paper>
			<h3>Checking Collection Ownership...</h3>
			<div>{state.error && <Typography>{state.error}</Typography>}</div>
			<Button
				variant="contained"
				disabled={state.checking}
				onClick={() => checkOperator()}
			>
				{state.checking ? "Checking..." : "Check"}
			</Button>
		</Paper>
	);
}

function UpdateOperator(props: {
	provider: WalletApi;
	marketContractAddress: ContractAddress;
	nftContractAddress: ContractAddress;
	onDone: () => void;
}) {
	const [state, setState] = useState({ updating: false, error: "" });

	function update() {
		let s = { ...state };
		updateOperator(
			props.provider,
			props.marketContractAddress,
			props.nftContractAddress
		)
			.then((_) => {
				console.log(_);
				props.onDone();
			})
			.catch((err: Error) => {
				s.updating = false;
				s.error = err.message;
				setState(s);
			})
			.finally(() => {
				s.updating = false;
				setState(s);
			});
	}

	useEffect(() => {
		setState({ ...state, updating: true });
		if (!state.updating) {
			update();
		}
	}, [props.provider, props.nftContractAddress]);

	return (
		<>
			<h3>Update Collection Ownership</h3>
			<div>{state.error && <Typography>{state.error}</Typography>}</div>
			<Button
				variant="contained"
				disabled={state.updating}
				onClick={() => update()}
			>
				{state.updating ? "Updating..." : "Update"}
			</Button>
		</>
	);
}

function CheckTokenBalanceStep(props: {
	provider: WalletApi;
	nftContractAddress: ContractAddress;
	onDone: (tokenId: string, balance: number) => void;
}) {
	const [state, setState] = useState({
		checking: false,
		error: "",
		tokenId: "",
	});

	function checkBalance() {
		let s = { ...state, checking: true };
		setState(s);

		balanceOf(props.provider, props.nftContractAddress, state.tokenId)
			.then((balance) => {
				console.log(`balance: ${balance}`);
				if (balance > 0) {
					setState({ ...state, checking: false, error: "" });
					props.onDone(state.tokenId, balance);
				} else {
					setState({ ...state, checking: false, error: "Not enough balance" });
				}
			})
			.catch((err: Error) => {
				s.checking = false;
				s.error = err.message;
				console.error(err);
				setState(s);
			});
	}

	function isValid() {
		return !!state.tokenId;
	}

	function onOkClicked() {
		checkBalance();
	}

	return (
		<>
			<h3>Check Token Balance</h3>
			<form>
				<div>
					<TextField
						id="token-id"
						label="Token Id"
						variant="standard"
						value={state.tokenId}
						onChange={(v) => setState({ ...state, tokenId: v.target.value })}
						disabled={state.checking}
					/>
				</div>
				<div>{state.error && <Typography>{state.error}</Typography>}</div>
				<div>{state.checking && <Typography>Checking..</Typography>}</div>
				<div>
					<Button
						variant="contained"
						disabled={!isValid() || state.checking}
						onClick={() => onOkClicked()}
					>
						Ok
					</Button>
				</div>
			</form>
		</>
	);
}

function ListTokenOnMarketplaceStep(props: {
	provider: WalletApi;
	marketContractAddress: ContractAddress;
	nftContractAddress: ContractAddress;
	tokenId: string;
	onDone: () => void;
}) {
	const [state, setState] = useState({
		listing: false,
		error: "",
		price: "",
	});

	function isValid() {
		try {
			return state.price && BigInt(state.price) >= 0;
		} catch (e) {
			return false;
		}
	}

	function listToken() {
		setState({ ...state, listing: true });
		addTokenMarketplace(
			props.provider,
			props.tokenId,
			props.marketContractAddress,
			props.nftContractAddress,
			parseInt(state.price)
		)
			.then((outcomes) => ensureValidOutcome(outcomes))
			.then(() => {
				setState({ ...state, error: "", listing: false });
				props.onDone();
			})
			.catch((err: Error) => {
				setState({ ...state, error: err.message, listing: false });
			});
	}

	function onOkClicked() {
		listToken();
	}

	return (
		<>
			<h3>List NFT on Marketplace</h3>
			<form>
				<div>
					<TextField
						id="token-id"
						label="Token Id"
						variant="standard"
						value={props.tokenId}
						disabled
					/>
					<br />
					<TextField
						id="price"
						type={"number"}
						label="Token Price in CCD"
						variant="standard"
						value={state.price}
						onChange={(v) => setState({ ...state, price: v.target.value })}
						disabled={state.listing}
					/>
				</div>
				<div>{state.error && <Typography>{state.error}</Typography>}</div>
				<div>{state.listing && <Typography>Listing..</Typography>}</div>
				<div>
					<Button
						variant="contained"
						disabled={!isValid() || state.listing}
						onClick={() => onOkClicked()}
					>
						Ok
					</Button>
				</div>
			</form>
		</>
	);
}

function AddNftPage(props: {
	provider: WalletApi;
	marketContractAddress: ContractAddress;
}) {
	const steps = [
		{
			title: "Nft Collection Contract Address",
			step: Steps.GetCollectionContractAddress,
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
		activeStep: Steps.GetCollectionContractAddress,
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
			case Steps.GetCollectionContractAddress:
				return (
					<FindNftCollection
						provider={props.provider}
						onDone={(address) => onGetCollectionAddress(address)}
					/>
				);
			case Steps.CheckOperator:
				return (
					<CheckingOperatorStep
						provider={props.provider}
						marketContractAddress={props.marketContractAddress}
						nftContractAddress={state.nftContract as ContractAddress}
						onDone={(hasOwnersip) => onCheckOperator(hasOwnersip)}
					/>
				);
			case Steps.UpdateOperator:
				return (
					<UpdateOperator
						provider={props.provider}
						marketContractAddress={props.marketContractAddress}
						nftContractAddress={state.nftContract as ContractAddress}
						onDone={() => onUpdateOperator()}
					/>
				);
			case Steps.CheckTokenBalance:
				return (
					<CheckTokenBalanceStep
						provider={props.provider}
						nftContractAddress={state.nftContract as ContractAddress}
						onDone={(id, balance) => onTokenBalance(id, balance)}
					/>
				);
			case Steps.AddToken:
				return (
					<ListTokenOnMarketplaceStep
						provider={props.provider}
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
