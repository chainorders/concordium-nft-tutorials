import { MouseEventHandler, useEffect, useState } from "react";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";
import IconButton from "@mui/material/IconButton";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CheckIcon from "@mui/icons-material/Check";

import { TokenListItem } from "../models/TokenListItem";
import { Metadata } from "../models/Types";
import { MarketplaceClient } from "../models/MarketPlaceContractClient";
import {
	ensureValidOutcome,
	loadNft,
	toLocalstorageKey,
} from "../models/Utils";
import { ContractAddress } from "@concordium/web-sdk";

function NftListItem(props: {
	item: TokenListItem;
	provider: WalletApi;
	marketContractAddress: ContractAddress;
}) {
	const { item, provider } = props;

	let [state, setState] = useState({
		isLoading: true,
		url: "",
		name: "",
		desc: "",
		price: item.price,
		isBought: false,
	});

	const buy = (item: TokenListItem) => {
		MarketplaceClient.transfer(props.marketContractAddress, item, provider)
			.then((o) => ensureValidOutcome(o))
			.then((_) => {
				setState({
					...state,
					isBought: true,
				});

				console.log("bought nft : " + item.tokenId.toString());
			})
			.catch((err) => {
				console.error(err);
			});
	};

	useEffect(() => {
		let nftJson = localStorage.getItem(toLocalstorageKey(item));
		if (nftJson) {
			let metadata: Metadata = JSON.parse(nftJson);
			setState({
				...state,
				isLoading: false,
				url: metadata.display.url,
				// url: "https://source.unsplash.com/user/c_v_r/100x100",
				// url: "https://picsum.photos/200/300",
				name: metadata.name,
				desc: metadata.description,
				price: item.price,
			});
		} else {
			loadNft(provider, item).then((metadata) => {
				localStorage.setItem(toLocalstorageKey(item), JSON.stringify(metadata));
				setState({
					...state,
					isLoading: false,
					url: metadata.display.url,
					// url: "https://picsum.photos/200/300",
					name: metadata.name,
					desc: metadata.description,
					price: item.price,
				});
			});
		}
	}, [item]);

	return (
		<ImageListItem
			key={item.tokenId + item.contract.index + item.contract.subIndex}
		>
			<img src={state.url} srcSet={state.url} alt={state.name} loading="lazy" />
			<ImageListItemBar
				title={`Cost: ${state.price} CCD`}
				subtitle={state.desc}
				actionIcon={
					<IconButton
						sx={{ color: "rgba(255, 255, 255, 0.54)" }}
						aria-label={`info about ${item.tokenId}`}
						onClick={() => buy(item)}
					>
						{state.isBought ? <CheckIcon /> : <ShoppingCartIcon />}
					</IconButton>
				}
			/>
		</ImageListItem>
	);
}

export default NftListItem;
