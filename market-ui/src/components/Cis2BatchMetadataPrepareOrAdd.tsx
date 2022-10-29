import { useState } from "react";

import { MetadataUrl } from "../models/Cis2Types";
import Cis2BatchMetadataAdd from "./Cis2BatchMetadataAdd";
import Cis2BatchMetadataPrepare from "./Cis2BatchMetadataPrepare";
import { Container } from "@mui/system";

function Cis2BatchMetadataPrepareOrAdd(props: {
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
		<Container maxWidth="xl" sx={{ mt: "10px" }}>
			{props.files && props.files.length && props.pinataJwt ? (
				<Cis2BatchMetadataPrepare
					files={props.files}
					pinataJwt={props.pinataJwt}
					onDone={onPrepDone}
				/>
			) : (
				<></>
			)}

			<Cis2BatchMetadataAdd
				onDone={onAddDone}
				startingTokenId={props.files?.length || 0}
			/>
		</Container>
	);
}

export default Cis2BatchMetadataPrepareOrAdd;
