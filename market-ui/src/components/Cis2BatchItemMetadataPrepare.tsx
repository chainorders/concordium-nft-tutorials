import {
	Button,
	Card,
	CardActionArea,
	CardActions,
	CardContent,
	CardMedia,
	Chip,
	Link,
	SxProps,
	TextField,
	Typography,
} from "@mui/material";
import { FormEvent, useState } from "react";
import { sha256 } from "@concordium/web-sdk";
import { Buffer } from "buffer/";
import { PinataClient } from "../models/PinataClient";
import { Metadata, MetadataUrl } from "../models/Cis2Types";
import { isValidTokenId, mintNft } from "../models/Cis2Client";
import {
	tokenIdToNftImageFileName,
	tokenIdToNftMetadataFileName,
} from "../Constants";
import { Theme } from "@mui/system";

const cardMediaSx: SxProps<Theme> = { maxHeight: "200px" };

enum Steps {
	GetTokenId,
	UploadImage,
	CreateMetadata,
	MintNft,
}

function DisplayError(props: { error: string }) {
	const { error } = props;

	return error ? <Typography fontSize={10}>{error}</Typography> : <></>;
}

function GetTokenIdCardStep(props: {
	imageUrl: string;
	tokenId: string;
	onDone: (data: { tokenId: string }) => void;
}) {
	const [state, setState] = useState({
		tokenId: props.tokenId.toString(),
		error: "",
		imageUrl: props.imageUrl,
	});

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const tokenId = formData.get("tokenId")?.toString() || "";

		if (!tokenId || !isValidTokenId(tokenId)) {
			setState({ ...state, error: "Invalid Token Id" });
			return;
		}

		setState({ ...state, tokenId, error: "" });
		props.onDone({ tokenId });
	}

	return (
		<Card variant="outlined">
			<CardActionArea>
				<CardMedia
					component="img"
					image={state.imageUrl}
					alt="NFT"
					sx={cardMediaSx}
				/>
				<form noValidate autoComplete="off" onSubmit={(e) => submit(e)}>
					<CardContent>
						<Typography gutterBottom component="div">
							Set Token Id
						</Typography>
						<TextField
							defaultValue={props.tokenId}
							name="tokenId"
							id="token-id"
							label="Token Id"
							variant="outlined"
							size="small"
							fullWidth={true}
							required={true}
						/>
						<DisplayError error={state.error} />
					</CardContent>
					<CardActions>
						<Button size="small" color="primary" type="submit">
							Set Token Id
						</Button>
					</CardActions>
				</form>
			</CardActionArea>
		</Card>
	);
}

function GetImageIpfsUrlCardStep(props: {
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
			<CardActionArea>
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
			</CardActionArea>
		</Card>
	);
}

function GetMetadataIpfsUrlCardStep(props: {
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
		setState({ ...state, isUploadingMetadata: true });
		props.pinata
			.uploadJson(metadata, tokenIdToNftMetadataFileName(props.tokenId))
			.then((metadataIpfsUrl) => {
				const metadataUrl = {
					url: metadataIpfsUrl,
					hash: sha256([Buffer.from(JSON.stringify(metadata))]).toString("hex"),
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
			<CardActionArea>
				<CardMedia
					component="img"
					image={props.imageUrl}
					alt="NFT"
					sx={cardMediaSx}
				/>
				<>
					<form
						noValidate
						autoComplete="off"
						onSubmit={(e) => uploadMetadataClicked(e)}
					>
						<CardContent>
							<Typography>Create Metadata</Typography>
							<Typography variant="caption" component="div">
								Token Id: {props.tokenId}
							</Typography>
							<Link href={props.imageIpfsUrl} variant="caption">
								Image IPFS Url
							</Link>
							<TextField
								name="name"
								id="name"
								label="Name"
								variant="outlined"
								size="small"
								fullWidth={true}
								required={true}
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
							/>
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
			</CardActionArea>
		</Card>
	);
}

function GetNftMintCardStep(props: {
	imageUrl: string;
	tokenId: string;
	imageIpfsUrl: string;
	metadataUrl: MetadataUrl;
}) {
	return (
		<Card variant="outlined">
			<CardActionArea>
				<CardMedia
					component="img"
					image={props.imageUrl}
					alt="NFT"
					sx={cardMediaSx}
				/>
				<CardContent>
					<Typography>Ready to be Minted</Typography>
					<Typography variant="caption" component="div">
						Token Id: {props.tokenId}
					</Typography>
					<Link href={props.imageIpfsUrl} variant="caption" component="div">
						Image IPFS Url
					</Link>
					<Link href={props.metadataUrl.url} variant="caption" target="_blank">
						Metadata Url
					</Link>
				</CardContent>
			</CardActionArea>
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
		setState({ ...state, tokenId, step: Steps.MintNft, metadataUrl });
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
				<GetImageIpfsUrlCardStep
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
				<GetMetadataIpfsUrlCardStep
					pinata={pinata}
					tokenId={state.tokenId}
					imageUrl={state.imageDisplayUrl}
					imageIpfsUrl={state.imageIpfsUrl}
					key={state.tokenId}
					onDone={(data) => metadataUploaded(data.tokenId, data.metadataUrl)}
				/>
			);
		case Steps.MintNft:
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
