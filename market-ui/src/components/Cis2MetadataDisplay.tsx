import { useState, useEffect } from "react";
import { Container, Typography, Box, Chip } from "@mui/material";

import { Metadata, MetadataUrl } from "../models/Cis2Types";
import { fetchJson } from "../models/Utils";

function Cis2MetadataDisplay(props: { metadata: MetadataUrl }) {
	const [state, setState] = useState<{
		metadata?: Metadata;
		loadingMetdata: boolean;
		error: string;
	}>({ loadingMetdata: false, error: "" });

	useEffect(() => {
		setState({ ...state, loadingMetdata: true });
		fetchJson<Metadata>(props.metadata.url)
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

export default Cis2MetadataDisplay;