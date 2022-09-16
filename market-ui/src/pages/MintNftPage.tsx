import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress, sha256 } from "@concordium/web-sdk";
import {
	Box,
	Stepper,
	Step,
	StepLabel,
	Divider,
	Button,
	Paper,
	Typography,
	TextField,
	Chip,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Buffer } from "buffer/";

import FindNftCollection from "../components/FindNftCollection";
import { NFT_CONTRACT_MODULE_REF } from "../Constants";
import { MetadataUrl } from "../models/MetadataUrl";
import {
	deployModule,
	ensureValidOutcome,
	getMetadata,
	isValidTokenId,
	mintNft,
} from "../models/Utils";
import { Metadata } from "../models/Types";
import { Container } from "@mui/system";
import { Label } from "@mui/icons-material";

enum Steps {
	DeployOrFindNftCollectionContract,
	PrepareNftMetadata,
	MintNft,
}

function DeployNftCollection(props: {
	provider: WalletApi;
	moduleRef: string;
	onDone: (address: ContractAddress) => void;
}) {
	let [state, setState] = useState({
		error: "",
		processing: false,
	});

	function onOkClicked() {
		setState({ ...state, processing: true });

		deployModule(props.provider, props.moduleRef)
			.then((address) => {
				setState({ ...state, processing: false });
				props.onDone(address);
			})
			.catch((err: Error) => {
				setState({ ...state, processing: false, error: err.message });
			});
	}

	return (
		<Paper>
			<h3>Deploy NFT Collection</h3>
			<h4>Module : {props.moduleRef}</h4>
			<form>
				<div>{state.error && <Typography>{state.error}</Typography>}</div>
				<div>{state.processing && <Typography>Deploying..</Typography>}</div>
				<div>
					<Button
						variant="contained"
						disabled={state.processing}
						onClick={() => onOkClicked()}
					>
						Deploy
					</Button>
				</div>
			</form>
		</Paper>
	);
}

function DeployOrFindNftCollectionContractStep(props: {
	provider: WalletApi;
	moduleRef: string;
	onDone: (address: ContractAddress) => void;
}) {
	return (
		<>
			<DeployNftCollection {...props} />
			<Divider />
			<FindNftCollection provider={props.provider} onDone={props.onDone} />
		</>
	);
}

function PrepareNftMetadataStep(props: {
	provider: WalletApi;
	nftContractAddress: ContractAddress;
	onDone: (metadata: MetadataUrl) => void;
}) {
	const [state, setState] = useState({
		url: "",
		hash: "",
		error: "",
		checking: false,
	});

	function onOkClicked() {
		fetch(state.url)
			.then((res) => res.arrayBuffer())
			.then((res) => sha256([Buffer.from(res)]).toString("hex"))
			.then((hash) => {
				setState({ ...state, hash, checking: false });
				props.onDone({
					hash,
					url: state.url,
				});
			})
			.catch((err: Error) => {
				setState({ ...state, checking: false, error: err.message });
			});
	}

	return (
		<>
			<h3>Prepare NFT Metadata</h3>
			<h4>
				Contract Index: {props.nftContractAddress.index.toString()}, Sub Index:{" "}
				{props.nftContractAddress.subindex.toString()}
			</h4>
			<form>
				<TextField
					id="metadata-url"
					label="Metadata Url"
					variant="standard"
					value={state.url}
					onChange={(v) => setState({ ...state, url: v.target.value })}
					disabled={state.checking}
				/>
				<br />
				<div>{state.error && <Typography>{state.error}</Typography>}</div>
				<div>{state.checking && <Typography>Checking..</Typography>}</div>
				<Button
					variant="contained"
					disabled={state.checking}
					onClick={() => onOkClicked()}
				>
					Ok
				</Button>
			</form>
		</>
	);
}

function DisplayNftMetadata(props: { metadata: MetadataUrl }) {
	const [state, setState] = useState<{
		metadata?: Metadata;
		loadingMetdata: boolean;
		error: string;
	}>({ loadingMetdata: false, error: "" });

	useEffect(() => {
		setState({ ...state, loadingMetdata: true });
		getMetadata(props.metadata.url)
			.then((metadata) =>
				setState({ ...state, metadata, loadingMetdata: false })
			)
			.catch((err) => {
				setState({
					...state,
					loadingMetdata: false,
					error: err.message,
				});
			});
	}, [props.metadata.url]);

	return (
		<Container>
			<div>{state.error && <Typography>{state.error}</Typography>}</div>
			<div>
				{state.loadingMetdata && <Typography>Loading Metdata..</Typography>}
			</div>
			<Box>
				<img src={state.metadata?.display.url} alt="Nft Display" width="50%" />
				<br />
				<Chip label={`Name: ${state.metadata?.name}`} variant="filled" />
				<Chip label={`${state.metadata?.description}`} variant="filled" />
			</Box>
		</Container>
	);
}

function MintNftStep(props: {
	provider: WalletApi;
	nftContractAddress: ContractAddress;
	metadata: MetadataUrl;
	onDone: (tokenId: string) => void;
}) {
	const [state, setState] = useState({
		tokenId: "",
		checking: false,
		error: "",
	});

	function onMintClicked() {
		if (!isValidTokenId(state.tokenId || "")) {
			setState({ ...state, error: "Invalid token Id" });
			return;
		}

		if (!state.tokenId) {
			setState({ ...state, error: "Token Id is null" });
			return;
		}

		setState({ ...state, error: "", checking: true });
		mintNft(
			props.provider,
			state.tokenId,
			props.metadata,
			props.nftContractAddress
		)
			.then((o) => ensureValidOutcome(o))
			.then((_) => {
				setState({ ...state, error: "", checking: false });
				props.onDone(state.tokenId as string);
			})
			.catch((e: Error) => {
				setState({ ...state, error: e.message, checking: false });
			});
	}

	return (
		<>
			<h3>Mint NFT</h3>
			<h4>Metadata Url : {props.metadata.url}</h4>
			<h5>Metadata Hash : {props.metadata.hash}</h5>
			<br />
			<DisplayNftMetadata metadata={props.metadata} />
			<br />
			<form>
				<TextField
					id="token-id"
					label="Token Id Hex"
					variant="standard"
					value={state.tokenId}
					onChange={(v) => setState({ ...state, tokenId: v.target.value })}
					disabled={state.checking}
				/>
				<div>{state.error && <Typography>{state.error}</Typography>}</div>
				<div>{state.checking && <Typography>Checking..</Typography>}</div>
				<Button
					variant="contained"
					disabled={state.checking}
					onClick={() => onMintClicked()}
				>
					Mint
				</Button>
			</form>
		</>
	);
}

function MintNftPage(props: { provider: WalletApi }) {
	const steps = [
		{
			step: Steps.DeployOrFindNftCollectionContract,
			title: "Deploy Or Find NFT Collection",
		},
		{ step: Steps.PrepareNftMetadata, title: "Prepare Nft Metadata" },
		{ step: Steps.MintNft, title: "Mint NFT" },
	];

	let [state, setState] = useState<{
		activeStep: Steps;
		nftContract?: ContractAddress;
		tokenId?: string;
		nftMetadata?: MetadataUrl;
	}>({
		activeStep: Steps.DeployOrFindNftCollectionContract,
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
			case Steps.DeployOrFindNftCollectionContract:
				return (
					<DeployOrFindNftCollectionContractStep
						provider={props.provider}
						moduleRef={NFT_CONTRACT_MODULE_REF}
						onDone={(address) => onGetCollectionAddress(address)}
					/>
				);
			case Steps.PrepareNftMetadata:
				return (
					<PrepareNftMetadataStep
						provider={props.provider}
						nftContractAddress={state.nftContract as ContractAddress}
						onDone={(metadata) => onMetadataPrepared(metadata)}
					/>
				);
			case Steps.MintNft:
				return (
					<MintNftStep
						provider={props.provider}
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
