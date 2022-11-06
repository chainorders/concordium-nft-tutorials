import { useState } from "react";

import { MetadataUrl } from "../models/Cis2Types";
import Cis2BatchMetadataAdd from "./Cis2BatchMetadataAdd";
import Cis2NftBatchMetadataPrepare from "./Cis2NftBatchMetadataPrepare";
import { Stack, Typography } from "@mui/material";

function Cis2NftBatchMetadataPrepareOrAdd(props: {
	files?: File[];
	pinataJwt?: string;
	onDone: (tokens: { [tokenId: string]: MetadataUrl }) => void;
}) {
	const [state, setState] = useState({
		isPrepDone: props.files && props.files.length ? false : true,
		isAddDone: false,
		tokens: {},
	});

	function onPrepDone(tokens: { [tokenId: string]: MetadataUrl }) {
		const tokensCombined = { ...state.tokens, ...tokens };

		setState({
			...state,
			isPrepDone: true,
			tokens: tokensCombined,
		});

		if (state.isAddDone) {
			props.onDone(tokensCombined);
		}
	}

	function onAddDone(tokens: { [tokenId: string]: MetadataUrl }) {
		const tokensCombined = { ...state.tokens, ...tokens };
		setState({
			...state,
			isAddDone: true,
			tokens: tokensCombined,
		});

		if (state.isPrepDone) {
			props.onDone(tokensCombined);
		}
	}

	return (
		<Stack>
			{props.files && props.files.length && props.pinataJwt ? (
				<Cis2NftBatchMetadataPrepare
					files={props.files}
					pinataJwt={props.pinataJwt}
					onDone={onPrepDone}
				/>
			) : (
				<Typography variant="body1" component="div" gutterBottom>
					No uploaded Files
				</Typography>
			)}

			<Cis2BatchMetadataAdd
				onDone={onAddDone}
				startingTokenId={props.files?.length || 0}
			/>
		</Stack>
	);
}

export default Cis2NftBatchMetadataPrepareOrAdd;
