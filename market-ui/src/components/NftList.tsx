import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import ImageList from "@mui/material/ImageList";
import Container from "@mui/material/Container";
import { ContractAddress } from "@concordium/web-sdk";

import NftListItem from "./NftListItem";
import { TokenListItem } from "../models/MarketplaceTypes";

function NftList(props: {
	marketContractAddress: ContractAddress;
	tokens: TokenListItem[];
	provider: WalletApi;
	account: string;
}) {
	return (
		<Container maxWidth={"sm"}>
			<ImageList key="nft-image-list">
				{props.tokens.map((t) => (
					<NftListItem
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

export default NftList;
