import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import { Paper } from "@mui/material";

import MarketplaceList from "../components/MarketplaceList";
import { Cis2ContractInfo } from "../models/ConcordiumContractClient";

function ListNftPage(props: {
	provider: WalletApi;
	marketContractAddress: ContractAddress;
	contractInfo: Cis2ContractInfo;
	account: string;
}) {
	return (
		<Paper>
			<MarketplaceList
				provider={props.provider as WalletApi}
				marketContractAddress={props.marketContractAddress}
				account={props.account}
				contractInfo={props.contractInfo}
			/>
		</Paper>
	);
}

export default ListNftPage;
