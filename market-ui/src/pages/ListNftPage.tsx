import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import { useEffect, useState } from "react";

import NftList from "../components/NftList";
import { list } from "../models/MarketplaceClient";
import { TokenListItem } from "../models/MarketplaceTypes";

function ListNftPage(props: {
	provider: WalletApi;
	marketContractAddress: ContractAddress;
	account: string;
}) {
	let [state, setState] = useState<{ tokens: TokenListItem[] }>({ tokens: [] });

	useEffect(() => {
		list(props.provider, props.marketContractAddress).then((tokens) =>
			setState({ ...state, tokens })
		);
	}, [props.account]);

	return (
		<>
			<h2>NFT's</h2>
			<div>
				<NftList
					provider={props.provider as WalletApi}
					marketContractAddress={props.marketContractAddress}
					account={props.account}
					tokens={state.tokens}
				/>
			</div>
		</>
	);
}

export default ListNftPage;
