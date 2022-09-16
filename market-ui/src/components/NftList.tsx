import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import ImageList from "@mui/material/ImageList";
import Container from "@mui/material/Container";
import { TokenListItem } from "../models/TokenListItem";
import NftListItem from "./NftListItem";
import { ContractAddress } from "@concordium/web-sdk";

function NftList(props: {
	marketContractAddress: ContractAddress;
	tokens: TokenListItem[];
	provider: WalletApi;
}) {
	return (
		<Container>
			<ImageList sx={{ width: 500 }} key="nft-image-list">
				{props.tokens.map((t) => (
					<NftListItem
						provider={props.provider}
						marketContractAddress={props.marketContractAddress}
						item={t}
						key={t.tokenId + t.contract.index + t.contract.subIndex}
					/>
				))}
			</ImageList>
		</Container>
	);
}

export default NftList;
