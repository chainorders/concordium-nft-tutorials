import { useEffect, useState } from "react";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";
import IconButton from "@mui/material/IconButton";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CheckIcon from "@mui/icons-material/Check";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import { Typography } from "@mui/material";

import { fetchJson, toLocalstorageKey } from "../models/Utils";
import { TokenListItem } from "../models/MarketplaceTypes";
import { getTokenMetadata } from "../models/Cis2NftClient";
import { Metadata } from "../models/Cis2Types";
import Nft from "./Nft";
import { Cis2ContractInfo } from "../models/ConcordiumContractClient";

function MarketplaceTransfer(props: {
	item: TokenListItem;
	provider: WalletApi;
	account: string;
	marketContractAddress: ContractAddress;
	contractInfo: Cis2ContractInfo;
	onBuyClicked: (token: TokenListItem) => void;
}) {
	const { item, provider, account, contractInfo: cis2ContractInfo } = props;

	let [state, setState] = useState({
		isLoading: true,
		url: "",
		name: "",
		desc: "",
		price: item.price,
		isBought: false,
	});

	useEffect(() => {
		let setStateMetdata = (metadata: Metadata) =>
			setState({
				...state,
				isLoading: false,
				url: metadata.display.url,
				name: metadata.name,
				desc: metadata.description,
				price: item.price,
			});

		let nftJson = localStorage.getItem(toLocalstorageKey(item));
		if (nftJson) {
			setStateMetdata(JSON.parse(nftJson));
		} else {
			getTokenMetadata(
				provider,
				account,
				cis2ContractInfo,
				item.contract,
				item.tokenId
			)
				.then((m) => fetchJson<Metadata>(m.url))
				.then((metadata) => {
					// localStorage.setItem(
					// 	toLocalstorageKey(item),
					// 	JSON.stringify(metadata)
					// );
					setStateMetdata(metadata);
				});
		}
	}, [item]);

	return (
		<ImageListItem
			sx={{ display: state.isBought ? "none" : "" }}
			key={item.tokenId + item.contract.index + item.contract.subindex}
		>
			<Nft
				provider={props.provider}
				account={props.account}
				contractInfo={props.contractInfo}
				contractAddress={item.contract}
				tokenId={item.tokenId}
			/>
			<ImageListItemBar
				title={`Cost: ${state.price} CCD`}
				position="below"
				subtitle={
					<>
						<Typography variant="caption" component={"div"}>
							{state.desc}
						</Typography>
						<Typography variant="caption" component={"div"}>
							{item.contract.index.toString()} /{" "}
							{item.contract.subindex.toString()}
						</Typography>
						{item.owner === props.account && (
							<Typography>Owned by you</Typography>
						)}
					</>
				}
				actionIcon={
					<IconButton
						sx={{ height: "100%" }}
						aria-label={`buy ${item.tokenId}`}
						onClick={() =>
							item.owner !== props.account && props.onBuyClicked(item)
						}
					>
						{state.isBought || item.owner === props.account ? (
							<CheckIcon />
						) : (
							<ShoppingCartIcon />
						)}
					</IconButton>
				}
			/>
		</ImageListItem>
	);
}

export default MarketplaceTransfer;
