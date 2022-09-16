import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import { useEffect, useState } from "react";

import NftList from "../components/NftList";
import { TokenListItem } from "../models/TokenListItem";
import { listTokens } from "../models/Utils";

function ListNftPage(props: {
	provider: WalletApi;
	marketContractAddress: ContractAddress;
	account: string;
}) {
	let [state, setState] = useState<{ tokens: TokenListItem[] }>({ tokens: [] });

	useEffect(() => {
		listTokens(props.provider, props.marketContractAddress).then((tokens) =>
			setState({ ...state, tokens })
		);
	}, [props.account]);

	return (
		<>
			<h2>NFT's</h2>
			<div>
				<NftList
					provider={props.provider as WalletApi}
					tokens={state.tokens}
					marketContractAddress={props.marketContractAddress}
				/>
			</div>
		</>
	);
}

export default ListNftPage;
