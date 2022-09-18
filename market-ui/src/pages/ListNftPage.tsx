import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";

import MarketplaceList from "../components/MarketplaceList";

function ListNftPage(props: {
	provider: WalletApi;
	marketContractAddress: ContractAddress;
	account: string;
}) {
	return (
		<>
			<h2>NFT's</h2>
			<div>
				<MarketplaceList
					provider={props.provider as WalletApi}
					marketContractAddress={props.marketContractAddress}
					account={props.account}
				/>
			</div>
		</>
	);
}

export default ListNftPage;
