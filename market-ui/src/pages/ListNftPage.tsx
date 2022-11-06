import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import { Typography, Paper } from "@mui/material";

import MarketplaceList from "../components/MarketplaceList";

function ListNftPage(props: {
	provider: WalletApi;
	marketContractAddress: ContractAddress;
	account: string;
}) {
	return (
		<Paper>
			<MarketplaceList
				provider={props.provider as WalletApi}
				marketContractAddress={props.marketContractAddress}
				account={props.account}
			/>
		</Paper>
	);
}

export default ListNftPage;
