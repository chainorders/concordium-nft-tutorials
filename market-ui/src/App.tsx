import "./App.css";

import { useEffect, useState } from "react";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import {
	BottomNavigation,
	BottomNavigationAction,
	Button,
	Paper,
	Typography,
} from "@mui/material";
import { Route, Routes } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";

import ListNftPage from "./pages/ListNftPage";
import AddNftPage from "./pages/AddNftPage";
import MintNftPage from "./pages/MintNftPage";

import { connectWallet, getProvider } from "./models/Utils";
import { ContractAddress } from "@concordium/web-sdk";
import { MARKET_CONTRACT_ADDRESS } from "./Constants";

function ConnectedContent(props: {
	marketContractAddress: ContractAddress;
	provider: WalletApi;
	account: string;
}) {
	return (
		<>
			<h1>Concordium NFT Marketplace</h1>
			<div className="App">
				<Routes>
					<Route
						path="/"
						element={
							<ListNftPage
								provider={props.provider}
								account={props.account}
								marketContractAddress={props.marketContractAddress}
							/>
						}
					/>
					<Route
						path="/add"
						element={
							<AddNftPage
								provider={props.provider}
								account={props.account}
								marketContractAddress={props.marketContractAddress}
							/>
						}
					/>
					<Route
						path="/mint"
						element={
							<MintNftPage provider={props.provider} account={props.account} />
						}
					/>
				</Routes>
				<Paper
					sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
					elevation={3}
				>
					<BottomNavigation showLabels>
						<BottomNavigationAction
							label="Add"
							icon={<AddIcon />}
							title="Adds a NFT to Marketplace Listing"
							href="/add"
						/>
						<BottomNavigationAction
							label="Mint"
							icon={<AddIcon />}
							title="Mints An NFT"
							href="/mint"
						/>
						<BottomNavigationAction
							label="List"
							icon={<AddIcon />}
							title="NFT's List"
							href="/"
						/>
					</BottomNavigation>
				</Paper>
			</div>
		</>
	);
}

function App() {
	const [state, setState] = useState<{
		provider?: WalletApi;
		account?: string;
	}>({});

	function connect() {
		getProvider().then((provider) => {
			connectWallet(provider).then((account) =>
				setState({ ...state, provider, account })
			);
		});
	}

	useEffect(() => {
		if (state.provider && state.account) {
			return;
		}

		connect();
	}, [state]);

	if (state.provider && state.account) {
		return (
			<ConnectedContent
				provider={state.provider}
				account={state.account}
				marketContractAddress={MARKET_CONTRACT_ADDRESS}
			/>
		);
	}

	return (
		<>
			<h1>Concordium NFT Marketplace</h1>
			<Button onClick={() => connect()}>
				<Typography>Connect Wallet</Typography>
			</Button>
		</>
	);
}

export default App;
