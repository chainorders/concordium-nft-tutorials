import "./App.css";

import { useEffect, useState } from "react";
import {
	detectConcordiumProvider,
	WalletApi,
} from "@concordium/browser-wallet-api-helpers";
import { Box } from "@mui/material";
import { Route, Routes, useParams, Navigate, useNavigate } from "react-router-dom";

import ListNftPage from "./pages/ListNftPage";
import AddNftPage from "./pages/AddNftPage";

import {
	CIS2_MULTI_CONTRACT_INFO,
	MARKETPLACE_CONTRACT_INFO,
	MARKET_CONTRACT_ADDRESS,
} from "./Constants";
import MintNftPage from "./pages/MintNftPage";
import ConnectWallet from "./components/ConnectWallet";
import Header from "./components/ui/Header";
import { ContractAddress } from "@concordium/web-sdk";
import ContractFindInstanceOrInit from "./components/ContractFindInstanceOrInit";

function App() {
	let marketplaceContractAddress: ContractAddress | undefined =
		MARKET_CONTRACT_ADDRESS;
	const params = useParams();
	const navigate = useNavigate();
	if (params.index && params.subindex) {
		marketplaceContractAddress = {
			index: BigInt(params.index),
			subindex: BigInt(params.subindex),
		};
	}

	const [state, setState] = useState<{
		provider?: WalletApi;
		account?: string;
		marketplaceContractAddress?: ContractAddress;
	}>({
		marketplaceContractAddress,
	});

	function connect() {
		detectConcordiumProvider()
			.then((provider) => {
				provider
					.getMostRecentlySelectedAccount()
					.then((account) =>
						!!account ? Promise.resolve(account) : provider.connect()
					)
					.then((account) => {
						setState({ ...state, provider, account });
					})
					.catch((_) => {
						alert("Please allow wallet connection");
					});
				provider.on("accountDisconnected", () => {
					setState({ ...state, account: undefined });
				});
				provider.on("accountChanged", (account) => {
					setState({ ...state, account });
				});
				provider.on("chainChanged", () => {
					setState({ ...state, account: undefined, provider: undefined });
				});
			})
			.catch((_) => {
				console.error(`could not find provider`);
				alert("Please download Concordium Wallet");
			});
	}

	useEffect(() => {
		if (state.provider && state.account) {
			return;
		}

		connect();
		return () => {
			state.provider?.removeAllListeners();
		};
	}, [state.account]);

	function isConnected() {
		return !!state.provider && !!state.account;
	}

	function onMarketplaceContractChanged(
		marketplaceContractAddress: ContractAddress
	) {
		setState({ ...state, marketplaceContractAddress });
		navigate("/");
	}

	let pages = new Array<{
		path: string;
		href?: string;
		name: string;
		component: JSX.Element;
	}>();

	if (state.marketplaceContractAddress) {
		pages.push({
			path: "/buy/:index/:subindex",
			href: `/buy/${state.marketplaceContractAddress.index.toString()}/${state.marketplaceContractAddress.subindex.toString()}`,
			name: "Buy",
			component: (
				<ListNftPage
					provider={state.provider!}
					account={state.account!}
					marketContractAddress={state.marketplaceContractAddress!}
					contractInfo={CIS2_MULTI_CONTRACT_INFO}
				/>
			),
		});

		pages.push({
			path: "/sell/:index/:subindex",
			href: `/sell/${state.marketplaceContractAddress.index.toString()}/${state.marketplaceContractAddress.subindex.toString()}`,
			name: "Sell",
			component: (
				<AddNftPage
					provider={state.provider!}
					account={state.account!}
					marketContractAddress={state.marketplaceContractAddress!}
					contractInfo={CIS2_MULTI_CONTRACT_INFO}
				/>
			),
		});
	}

	pages.push({
		path: "/mint-multi-batch",
		name: "Mint",
		component: (
			<MintNftPage
				key={CIS2_MULTI_CONTRACT_INFO.contractName}
				contractInfo={CIS2_MULTI_CONTRACT_INFO}
				provider={state.provider!}
				account={state.account!}
			/>
		),
	});

	pages.push({
		path: "/marketplace-init-or-add",
		name: "Create Marketplace",
		component: (
			<ContractFindInstanceOrInit
				provider={state.provider!}
				account={state.account!}
				contractInfo={MARKETPLACE_CONTRACT_INFO}
				onDone={(address) => onMarketplaceContractChanged(address)}
			/>
		),
	});

	return (
		<>
			<Header pages={pages} />
			<Box className="App">
				{isConnected() ? (
					<Routes>
						{pages.map((p) => (
							<Route path={p.path} element={p.component} key={p.name} />
						))}
						<Route
							path="/"
							element={
								state.marketplaceContractAddress ? (
									<Navigate
										replace
										to={`/buy/${state.marketplaceContractAddress.index.toString()}/${state.marketplaceContractAddress.subindex.toString()}`}
									/>
								) : (
									<Navigate replace to={"/marketplace-init-or-add"} />
								)
							}
						/>
					</Routes>
				) : (
					<ConnectWallet connect={connect} />
				)}
			</Box>
		</>
	);
}

export default App;
