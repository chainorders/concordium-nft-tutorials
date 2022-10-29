import { useState, useEffect } from "react";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import ImageList from "@mui/material/ImageList";
import Container from "@mui/material/Container";
import { ContractAddress } from "@concordium/web-sdk";

import MarketplaceTransfer from "./MarketplaceTransfer";
import { TokenListItem } from "../models/MarketplaceTypes";
import { list } from "../models/MarketplaceClient";

function MarketplaceList(props: {
	marketContractAddress: ContractAddress;
	provider: WalletApi;
	account: string;
}) {
	let [state, setState] = useState<{ tokens: TokenListItem[] }>({ tokens: [] });

	useEffect(() => {
		list(props.provider, props.marketContractAddress).then((tokens) =>
			setState({ ...state, tokens })
		);
	}, [props.account]);

	return (
		<Container maxWidth={"md"}>
			<ImageList key="nft-image-list" cols={3}>
				{state.tokens.map((t) => (
					<MarketplaceTransfer
						provider={props.provider}
						account={props.account}
						marketContractAddress={props.marketContractAddress}
						item={t}
						key={t.tokenId + t.contract.index + t.contract.subindex}
					/>
				))}
			</ImageList>
		</Container>
	);
}

export default MarketplaceList;
