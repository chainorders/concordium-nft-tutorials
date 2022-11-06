import {
	Button,
	Card,
	CardActions,
	CardContent,
	CardMedia,
	Checkbox,
	FormControlLabel,
	Link,
	Stack,
	SxProps,
	TextField,
	Typography,
} from "@mui/material";
import { FormEvent, useState } from "react";
import { sha256 } from "@concordium/web-sdk";
import { Buffer } from "buffer/";
import { PinataClient } from "../models/PinataClient";
import { Metadata, MetadataUrl } from "../models/Cis2Types";
import {
	tokenIdToNftImageFileName,
	tokenIdToNftMetadataFileName,
} from "../Constants";
import { Theme } from "@mui/system";
import DisplayError from "./DisplayError";
import GetTokenIdCardStep from "./GetTokenIdCardStep";
import GetNftMintCardStep from "./GetNftMintCardStep";

const cardMediaSx: SxProps<Theme> = { maxHeight: "200px" };

enum Steps {
	GetTokenId,
	UploadImage,
	CreateMetadata,
	Mint,
}

function UploadImageIpfsCardStep(props: {
	tokenId: string;
	file: File;
	imageUrl: string;
	pinata: PinataClient;
	onDone: (input: { tokenId: string; imageIpfsUrl: string }) => void;
}) {
	const [state, setState] = useState({
		tokenId: props.tokenId,
		error: "",
		imageUrl: props.imageUrl,
		isUploadingImage: false,
		imageIpfsUrl: "",
	});

	function submit() {
		setState({ ...state, isUploadingImage: true });
		props.pinata
			.uploadFile(
				props.file,
				tokenIdToNftImageFileName(props.file.name, props.tokenId)
			)
			.then((imageIpfsUrl) => {
				setState({
					...state,
					imageIpfsUrl: imageIpfsUrl,
					isUploadingImage: false,
					error: "",
				});

				props.onDone({ tokenId: props.tokenId, imageIpfsUrl });
			})
			.catch((error: Error) =>
				setState({ ...state, error: error.message, isUploadingImage: false })
			);
	}

	return (
		<Card variant="outlined">
			<CardMedia
				component="img"
				image={props.imageUrl}
				alt="NFT"
				sx={cardMediaSx}
			/>
			<>
				<CardContent>
					<Typography>Upload File</Typography>
					<Typography variant="caption">Token Id: {props.tokenId}</Typography>
					<DisplayError error={state.error} />
				</CardContent>
				<CardActions>
					<Button
						size="small"
						color="primary"
						onClick={submit}
						type="button"
						disabled={state.isUploadingImage}
					>
						Upload Image
					</Button>
				</CardActions>
			</>
		</Card>
	);
}

function UploadMetadataIpfsCardStep(props: {
	tokenId: string;
	imageUrl: string;
	pinata: PinataClient;
	imageIpfsUrl: string;
	onDone: (data: { tokenId: string; metadataUrl: MetadataUrl }) => void;
}) {
	const [state, setState] = useState({
		isUploadingMetadata: false,
		metadataUrl: { url: "", hash: "" } as MetadataUrl,
		error: "",
	});

	function uploadMetadataClicked(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		let formData = new FormData(event.currentTarget);
		const metadata: Metadata = {
			name: formData.get("name")?.toString() || "",
			description: formData.get("description")?.toString() || "",
			display: {
				url: props.imageIpfsUrl,
			},
			attributes: [],
		};
		let includeHash = formData.get("includeHash")?.toString();
		setState({ ...state, isUploadingMetadata: true });
		props.pinata
			.uploadJson(metadata, tokenIdToNftMetadataFileName(props.tokenId))
			.then((metadataIpfsUrl) => {
				const metadataUrl = {
					url: metadataIpfsUrl,
					hash: includeHash
						? sha256([Buffer.from(JSON.stringify(metadata))]).toString("hex")
						: "",
				};
				setState({
					...state,
					metadataUrl,
					isUploadingMetadata: false,
					error: "",
				});
				props.onDone({ tokenId: props.tokenId, metadataUrl });
			})
			.catch((error: Error) =>
				setState({ ...state, error: error.message, isUploadingMetadata: false })
			);
	}

	return (
		<Card variant="outlined">
			<CardMedia
				component="img"
				image={props.imageUrl}
				alt="NFT"
				sx={cardMediaSx}
			/>
			<>
				<form onSubmit={(e) => uploadMetadataClicked(e)}>
					<CardContent>
						<Typography>Create Metadata</Typography>
						<Typography variant="caption" component="div">
							Token Id: {props.tokenId}
						</Typography>
						<Link href={props.imageIpfsUrl} variant="caption">
							Image IPFS Url
						</Link>
						<Stack spacing={2}>
							<TextField
								name="name"
								id="name"
								label="Name"
								variant="outlined"
								size="small"
								fullWidth={true}
								required={true}
								defaultValue={`Token ${props.tokenId}`}
							/>
							<TextField
								multiline={true}
								name="description"
								id="description"
								label="Description"
								variant="outlined"
								size="small"
								fullWidth={true}
								required={true}
								defaultValue={`Image for token: ${props.tokenId}`}
							/>
							<FormControlLabel
								control={
									<Checkbox
										defaultChecked
										name="includeHash"
										id="include-hash"
									/>
								}
								label="Include Hash?"
							/>
						</Stack>
						<DisplayError error={state.error} />
					</CardContent>
					<CardActions>
						<Button
							size="small"
							color="primary"
							disabled={state.isUploadingMetadata}
							type="submit"
						>
							Create
						</Button>
					</CardActions>
				</form>
			</>
		</Card>
	);
}

function Cis2BatchItemMetadataPrepare(props: {
	file: File;
	pinataJwtKey: string;
	tokenId: string;
	onDone: (data: { tokenId: string; metadataUrl: MetadataUrl }) => void;
}) {
	const pinata = new PinataClient(props.pinataJwtKey);
	const [state, setState] = useState({
		imageDisplayUrl: URL.createObjectURL(props.file),
		step: Steps.GetTokenId,
		tokenId: props.tokenId,
		imageIpfsUrl: "",
		metadataUrl: { url: "", hash: "" } as MetadataUrl,
	});

	function tokenIdUpdated(tokenId: string) {
		setState({ ...state, tokenId, step: Steps.UploadImage });
	}

	function imageUploaded(tokenId: string, imageIpfsUrl: string) {
		setState({ ...state, tokenId, step: Steps.CreateMetadata, imageIpfsUrl });
	}

	function metadataUploaded(tokenId: string, metadataUrl: MetadataUrl) {
		setState({ ...state, tokenId, step: Steps.Mint, metadataUrl });
		props.onDone({ tokenId, metadataUrl });
	}

	switch (state.step) {
		case Steps.GetTokenId:
			return (
				<GetTokenIdCardStep
					imageUrl={state.imageDisplayUrl}
					tokenId={state.tokenId}
					key={state.tokenId}
					onDone={(data) => tokenIdUpdated(data.tokenId)}
				/>
			);
		case Steps.UploadImage:
			return (
				<UploadImageIpfsCardStep
					file={props.file}
					imageUrl={state.imageDisplayUrl}
					pinata={pinata}
					tokenId={state.tokenId}
					key={state.tokenId}
					onDone={(data) => imageUploaded(data.tokenId, data.imageIpfsUrl)}
				/>
			);
		case Steps.CreateMetadata:
			return (
				<UploadMetadataIpfsCardStep
					pinata={pinata}
					tokenId={state.tokenId}
					imageUrl={state.imageDisplayUrl}
					imageIpfsUrl={state.imageIpfsUrl}
					key={state.tokenId}
					onDone={(data) => metadataUploaded(data.tokenId, data.metadataUrl)}
				/>
			);
		case Steps.Mint:
			return (
				<GetNftMintCardStep
					imageUrl={state.imageDisplayUrl}
					imageIpfsUrl={state.imageIpfsUrl}
					tokenId={state.tokenId}
					metadataUrl={state.metadataUrl}
				/>
			);
		default:
			return <></>;
	}
}

export default Cis2BatchItemMetadataPrepare;
