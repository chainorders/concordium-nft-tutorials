import { useEffect, useState } from "react";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";
import IconButton from "@mui/material/IconButton";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CheckIcon from "@mui/icons-material/Check";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";

import { fetchJson, toLocalstorageKey } from "../models/Utils";
import { TokenListItem } from "../models/MarketplaceTypes";
import { getTokenMetadata } from "../models/Cis2Client";
import { transfer } from "../models/MarketplaceClient";
import { Metadata } from "../models/Cis2Types";
import Nft from "./Nft";

function MarketplaceTransfer(props: {
	item: TokenListItem;
	provider: WalletApi;
	account: string;
	marketContractAddress: ContractAddress;
}) {
	const { item, provider, account, marketContractAddress } = props;

	let [state, setState] = useState({
		isLoading: true,
		url: "",
		name: "",
		desc: "",
		price: item.price,
		isBought: false,
	});

	const buy = (item: TokenListItem) => {
		transfer(
			provider,
			account,
			marketContractAddress,
			item.contract,
			item.tokenId,
			item.price
		)
			.then((_) => {
				setState({
					...state,
					isBought: true,
				});

				console.info("bought nft : " + item.tokenId.toString());
			})
			.catch((err) => {
				console.error(err);
			});
	};

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
			getTokenMetadata(provider, account, item.contract, item.tokenId)
				.then((m) => fetchJson<Metadata>(m.url))
				.then((metadata) => {
					localStorage.setItem(
						toLocalstorageKey(item),
						JSON.stringify(metadata)
					);
					setStateMetdata(metadata);
				});
		}
	}, [item]);

	return (
		<ImageListItem
			sx={{ display: state.isBought ? "none" : "" }}
			key={item.tokenId + item.contract.index + item.contract.subindex}
		>
			{/* <img src={state.url} srcSet={state.url} alt={state.name} loading="lazy" /> */}
			<Nft
				provider={props.provider}
				account={props.account}
				contractAddress={item.contract}
				tokenId={item.tokenId}
			/>
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

export default MarketplaceTransfer;
