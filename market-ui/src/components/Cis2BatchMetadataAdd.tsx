import { Button, Grid, Typography } from "@mui/material";
import { useState } from "react";
import { MetadataUrl } from "../models/Cis2Types";
import Cis2BatchItemMetadataAdd from "./Cis2BatchItemMetadataAdd";

const toTokenId = (integer: number) => integer.toString(16).padStart(8, "0");

function Cis2BatchMetadataAdd(props: {
	onDone: (tokens: { [tokenId: string]: MetadataUrl }) => void;
	startingTokenId: number;
}) {
	const [state, setState] = useState<{
		error: string;
		tokens: { tokenId: string; metadataUrl: MetadataUrl }[];
	}>({
		error: "",
		tokens: [],
	});

	function onMetadataPrepared(
		index: number,
		tokenId: string,
		metadataUrl: MetadataUrl
	) {
		let tokens = [...state.tokens];
		tokens[index] = { tokenId, metadataUrl };
		setState({ ...state, tokens });
	}

	function onAdd() {
		let tokens = [...state.tokens];
		tokens.push({
			tokenId: toTokenId(tokens.length + 1 + props.startingTokenId),
			metadataUrl: {
				url: "",
				hash: "",
			},
		});

		setState({ ...state, tokens });
	}

	function onRemove(index: number) {
		let tokens = [...state.tokens];
		tokens.splice(index, 1);

		setState({ ...state, tokens });
	}

	function onDone() {
		setState({ ...state, error: "" });
		const anyInValidForm = state.tokens.findIndex(
			(t) => !t.metadataUrl.url || !t.tokenId
		);

		if (anyInValidForm > -1) {
			setState({ ...state, error: "Invalid Values. Please check again" });
			return;
		}

		var ret: { [tokenId: string]: MetadataUrl } = {};
		state.tokens.forEach((t) => (ret[t.tokenId] = t.metadataUrl));

		props.onDone(ret);
	}

	return (
		<>
			{state.error && (
				<div>
					<Typography>{state.error}</Typography>
				</div>
			)}
			{/* <Typography>Total no of files : {state.preparedFilesCount}</Typography> */}
			<Grid container spacing={2}>
				{state.tokens.map((token, index) => (
					<Grid item xs={4} key={index.toString()}>
						<Cis2BatchItemMetadataAdd
							index={index}
							tokenId={token.tokenId}
							onDone={(data) =>
								onMetadataPrepared(index, data.tokenId, data.metadataUrl)
							}
							onCancel={(index: number) => onRemove(index)}
						/>
					</Grid>
				))}
				<Grid item xs={12} key="-1">
					<Button onClick={() => onAdd()}>Add</Button>
				</Grid>
			</Grid>
			<br />
			<Button onClick={() => onDone()}>Done</Button>
		</>
	);
}

export default Cis2BatchMetadataAdd;
