import { Buffer } from "buffer/";
import { Theme } from "@emotion/react";
import {
	Button,
	Card,
	CardActions,
	CardContent,
	CardMedia,
	Skeleton,
	SxProps,
	TextField,
	Typography,
} from "@mui/material";
import { FormEvent, useState } from "react";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

import { Metadata, MetadataUrl } from "../models/Cis2Types";
import DisplayError from "./DisplayError";
import GetNftMintCardStep from "./GetNftMintCardStep";
import GetTokenIdCardStep from "./GetTokenIdCardStep";
import LazyNftMetadata from "./LazyNftMetadata";
import { sha256 } from "@concordium/web-sdk";
import { Stack } from "@mui/material";

const cardMediaSx: SxProps<Theme> = { maxHeight: "200px" };

enum Steps {
	GetMetadataUrl,
	GetTokenId,
	MintNft,
}

function TokenImage(props: {
	metadataUrl?: MetadataUrl;
	onMetadataLoaded?: (metadata: Metadata) => void;
}) {
	const loadingTemplate = (
		<Skeleton
			sx={{ ...cardMediaSx, height: "200px" }}
			animation="wave"
			variant="rectangular"
		/>
	);

	if (!props.metadataUrl || !props.metadataUrl.url) {
		return <></>;
	}

	return (
		<LazyNftMetadata
			metadataUrl={props.metadataUrl}
			loadedTemplate={(metadata) => {
				return (
					<CardMedia
						component="img"
						image={metadata.display.url}
						alt="NFT"
						sx={cardMediaSx}
					/>
				);
			}}
			loadingTemplate={() => loadingTemplate}
			errorLoadingTemplate={(error) => (
				<Stack spacing={2}>
					<ErrorOutlineIcon
						sx={{ ...cardMediaSx, width: "100%", mt: "10px" }}
						color="error"
						fontSize="large"
					/>
					<Typography variant="caption">{error}</Typography>
				</Stack>
			)}
			onMetadataLoaded={props.onMetadataLoaded}
		/>
	);
}

function GetMetadataUrlCardStep(props: {
	onDone: (metadataUrl: MetadataUrl, metadata: Metadata) => void;
	onCancel: () => void;
}) {
	const [state, setState] = useState<{
		error?: string;
		metadataUrl?: MetadataUrl;
		metadata?: Metadata;
	}>({});

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const url = formData.get("url")?.toString() || "";

		if (!url) {
			setState({ ...state, error: "Invalid Metadata Url" });
			return;
		}

		const metadataUrl = { url, hash: "" };
		setState({ ...state, metadataUrl, error: "" });
	}

	function onMetadataLoaded(metadata: Metadata) {
		const metadataUrl = {
			url: state.metadataUrl?.url!,
			hash: sha256([Buffer.from(JSON.stringify(metadata))]).toString("hex"),
		};

		setState({ ...state, metadata, metadataUrl });

		props.onDone(metadataUrl, metadata);
	}

	return (
		<Card variant="outlined">
			<TokenImage
				metadataUrl={state.metadataUrl}
				onMetadataLoaded={onMetadataLoaded}
			/>
			<form onSubmit={(e) => submit(e)}>
				<CardContent>
					<Typography gutterBottom component="div">
						Set Metadata Url
					</Typography>
					<TextField
						name="url"
						id="url"
						label="Metadata Url"
						variant="outlined"
						size="small"
						fullWidth={true}
						required={true}
					/>
					<DisplayError error={state.error} />
				</CardContent>
				<CardActions>
					<Button size="small" color="primary" type="submit">
						Ok
					</Button>
					<Button
						size="small"
						color="primary"
						type="button"
						onClick={() => props.onCancel()}
					>
						Cancel
					</Button>
				</CardActions>
			</form>
		</Card>
	);
}

function Cis2BatchItemMetadataAdd(props: {
	index: number;
	tokenId: string;
	onDone: (data: { tokenId: string; metadataUrl: MetadataUrl }) => void;
	onCancel: (index: number) => void;
}) {
	const [state, setState] = useState<{
		step: Steps;
		tokenId: string;
		metadata?: Metadata;
		metadataUrl?: MetadataUrl;
	}>({ step: Steps.GetMetadataUrl, tokenId: props.tokenId });

	function metadataUrlUpdated(metadataUrl: MetadataUrl, metadata: Metadata) {
		setState({ ...state, metadataUrl, metadata, step: Steps.GetTokenId });
	}

	function tokenIdUpdated(tokenId: string) {
		setState({ ...state, tokenId, step: Steps.MintNft });
		props.onDone({
			tokenId,
			metadataUrl: state.metadataUrl!,
		});
	}

	switch (state.step) {
		case Steps.GetMetadataUrl:
			return (
				<GetMetadataUrlCardStep
					key={props.index}
					onDone={metadataUrlUpdated}
					onCancel={() => props.onCancel(props.index)}
				/>
			);
		case Steps.GetTokenId:
			return (
				<GetTokenIdCardStep
					imageUrl={state.metadata?.display.url!}
					tokenId={props.tokenId}
					key={props.index}
					onDone={(data) => tokenIdUpdated(data.tokenId)}
				/>
			);
		case Steps.MintNft:
			return (
				<GetNftMintCardStep
					imageUrl={state.metadata?.display.url!}
					imageIpfsUrl={state.metadata?.display.url!}
					tokenId={state.tokenId}
					metadataUrl={state.metadataUrl!}
				/>
			);
		default:
			return <></>;
	}
}

export default Cis2BatchItemMetadataAdd;
