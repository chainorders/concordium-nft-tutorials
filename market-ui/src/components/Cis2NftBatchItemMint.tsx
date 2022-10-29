import {
	Card,
	CardContent,
	CardMedia,
	Link,
	Skeleton,
	SxProps,
	Theme,
	Typography,
} from "@mui/material";

import { MetadataUrl } from "../models/Cis2Types";
import LazyNftMetadata from "./LazyNftMetadata";
const cardMediaSx: SxProps<Theme> = { maxHeight: "200px" };

function Cis2NftBatchItemMint(props: {
	tokenId: string;
	metadataUrl: MetadataUrl;
	minting: boolean;
	minted: boolean;
	error: string;
}) {
	var heading = props.minting
		? "Minting"
		: props.minted
		? "Minted"
		: "Ready to be Minted";

	return (
		<Card variant="outlined">
				<LazyNftMetadata
					metadataUrl={props.metadataUrl}
					loadedTemplate={(metadata) => (
						<CardMedia
							component="img"
							image={metadata.display.url}
							alt="NFT"
							sx={cardMediaSx}
						/>
					)}
					loadingTemplate={() => (
						<Skeleton
							sx={{ ...cardMediaSx, height: "200px" }}
							animation="wave"
							variant="rectangular"
						/>
					)}
					errorLoadingTemplate={(error) => <Typography>{error}</Typography>}
				/>
				<CardContent>
					<Typography>{heading}</Typography>
					<Typography variant="caption" component="div">
						Token Id: {props.tokenId}
					</Typography>
					<Link href={props.metadataUrl.url} variant="caption" target="_blank">
						Metadata Url
					</Link>
					{props.error && <Typography>{props.error}</Typography>}
				</CardContent>
		</Card>
	);
}

export default Cis2NftBatchItemMint;
