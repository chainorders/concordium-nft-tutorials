import { useState } from "react";
import { Typography, Grid } from "@mui/material";

import { MetadataUrl } from "../models/Cis2Types";
import Cis2BatchItemMetadataPrepare from "./Cis2BatchItemMetadataPrepare";

function Cis2NftBatchMetadataPrepare(props: {
	files: File[];
	pinataJwt: string;
	onDone: (tokens: { [tokenId: string]: MetadataUrl }) => void;
}) {
	let filesMap: {
		[filename: string]: {
			file: File;
			tokenId?: string;
			metadataUrl?: MetadataUrl;
		};
	} = {};
	props.files.forEach((file) => (filesMap[file.name] = { file }));

	const [state, setState] = useState({
		files: filesMap,
		error: "",
		filesCount: props.files.length,
		preparedFilesCount: 0,
	});

	function onMetadataPrepared(
		filename: string,
		tokenId: string,
		metadataUrl: MetadataUrl
	) {
		const newState = {
			files: {
				...state.files,
				[filename]: {
					...state.files[filename],
					tokenId,
					metadataUrl,
				},
			},
		};

		var preparedFilesCount = Object.values(newState.files).filter(
			(f) => f.tokenId && f.metadataUrl
		).length;

		setState({ ...state, ...newState, preparedFilesCount });

		if (preparedFilesCount === props.files.length) {
			var ret: { [tokenId: string]: MetadataUrl } = {};
			Object.values(newState.files).forEach(
				(f) => (ret[f.tokenId as string] = f.metadataUrl as MetadataUrl)
			);

			props.onDone(ret);
		}
	}

	const toTokenId = (integer: number) => integer.toString(16).padStart(8, "0");

	return (
		<>
			{state.error && (
				<div>
					<Typography>{state.error}</Typography>
				</div>
			)}
			<Typography>
				Total no of files : {state.preparedFilesCount} / {props.files.length}
			</Typography>
			<Grid container spacing={2} padding="10px">
				{props.files.map((file, index) => (
					<Grid item xs={4} key={file.name}>
						<Cis2BatchItemMetadataPrepare
							file={file}
							tokenId={toTokenId(index + 1)}
							pinataJwtKey={props.pinataJwt}
							onDone={(data) =>
								onMetadataPrepared(file.name, data.tokenId, data.metadataUrl)
							}
						/>
					</Grid>
				))}
			</Grid>
		</>
	);
}

export default Cis2NftBatchMetadataPrepare;
