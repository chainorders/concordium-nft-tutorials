import "./App.css";

import { useEffect, useState } from "react";
import {
	detectConcordiumProvider,
	WalletApi,
} from "@concordium/browser-wallet-api-helpers";
import { Box } from "@mui/material";
import { Route, Routes } from "react-router-dom";

import ListNftPage from "./pages/ListNftPage";
import AddNftPage from "./pages/AddNftPage";

import { MARKET_CONTRACT_ADDRESS } from "./Constants";
import BatchMintNftPage from "./pages/BatchMintNftPage";
import ConnectWallet from "./components/ConnectWallet";
import Header from "./components/ui/Header";

function App() {
	const [state, setState] = useState<{
		provider?: WalletApi;
		account?: string;
	}>({});

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

	const pages = [
		{
			path: "/",
			name: "Marketplace",
			component: (
				<ListNftPage
					provider={state.provider!}
					account={state.account!}
					marketContractAddress={MARKET_CONTRACT_ADDRESS}
				/>
			),
		},
		{
			path: "/add",
			name: "Sell NFT",
			component: (
				<AddNftPage
					provider={state.provider!}
					account={state.account!}
					marketContractAddress={MARKET_CONTRACT_ADDRESS}
				/>
			),
		},
		{
			path: "/mint-batch",
			name: "Mint NFT's",
			component: (
				<BatchMintNftPage provider={state.provider!} account={state.account!} />
			),
		},
	];

	return (
		<>
			<Header pages={pages} />
			<Box className="App">
				{isConnected() ? (
					<Routes>
						{pages.map((p) => (
							<Route path={p.path} element={p.component} key={p.name} />
						))}
					</Routes>
				) : (
					<ConnectWallet connect={connect} />
				)}
			</Box>
		</>
	);
}

export default App;
