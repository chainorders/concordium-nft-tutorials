import React, { useEffect, useState } from "react";
import { Metadata, MetadataUrl } from "../models/Cis2Types";
import { fetchJson } from "../models/Utils";

function LazyNftMetadata(props: {
	metadataUrl: MetadataUrl;
	loadingTemplate: () => React.ReactElement;
	loadedTemplate: (metadata: Metadata) => React.ReactElement;
	errorLoadingTemplate: (error: string) => React.ReactElement;
	onMetadataLoaded?: (metadata: Metadata) => void;
}) {
	const [state, setState] = useState<{
		metadata?: Metadata;
		loadingMetdata: boolean;
		error: string;
	}>({ loadingMetdata: false, error: "" });

	useEffect(() => {
		setState({ ...state, loadingMetdata: true });
		fetchJson<Metadata>(props.metadataUrl.url)
			.then((metadata) => {
				setState({ ...state, metadata, loadingMetdata: false });
				props.onMetadataLoaded && props.onMetadataLoaded(metadata);
			})
			.catch((err) => {
				setState({
					...state,
					loadingMetdata: false,
					error: err.message,
				});
			});
	}, [props.metadataUrl.url]);

	if (state.error) {
		return props.errorLoadingTemplate(state.error.toString());
	} else if (state.loadingMetdata) {
		return props.loadingTemplate();
	} else if (state.metadata) {
		return props.loadedTemplate(state.metadata);
	} else {
		return <></>;
	}
}

export default LazyNftMetadata;
