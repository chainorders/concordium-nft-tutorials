import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import { Typography } from "@mui/material";

import MarketplaceList from "../components/MarketplaceList";

function ListNftPage(props: {
	provider: WalletApi;
	marketContractAddress: ContractAddress;
	account: string;
}) {
	return (
		<>
			<Typography variant="h2" gutterBottom>NFT's</Typography>
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
