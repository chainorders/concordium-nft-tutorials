import "./App.css";

import { useEffect, useState } from "react";
import {
	detectConcordiumProvider,
	WalletApi,
} from "@concordium/browser-wallet-api-helpers";
import {
	AppBar,
	BottomNavigation,
	BottomNavigationAction,
	Box,
	Button,
	Paper,
	Toolbar,
	Typography,
} from "@mui/material";
import { Route, Routes } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";

import ListNftPage from "./pages/ListNftPage";
import AddNftPage from "./pages/AddNftPage";
import MintNftPage from "./pages/MintNftPage";

import { ContractAddress } from "@concordium/web-sdk";
import { MARKET_CONTRACT_ADDRESS } from "./Constants";
import { Container, margin } from "@mui/system";

function ConnectedContent(props: {
	marketContractAddress: ContractAddress;
	provider: WalletApi;
	account: string;
}) {
	return (
		<>
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
	}, [state]);

	function isConnected() {
		return !!state.provider && !!state.account;
	}

	return (
		<Container>
			<AppBar position="static">
				<Toolbar>
					<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
						Concordium Nft Marketplace
					</Typography>
				</Toolbar>
			</AppBar>

			{isConnected() ? (
				<ConnectedContent
					provider={state.provider as WalletApi}
					account={state.account as string}
					marketContractAddress={MARKET_CONTRACT_ADDRESS}
				/>
			) : (
				<Box
					sx={{
						display: "flex",
						flexDirection: { xs: "column", md: "row" },
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Button onClick={() => connect()} sx={{ display: "flex" }}>
						<Typography>Connect Wallet</Typography>
					</Button>
				</Box>
			)}
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
		</Container>
	);
}

export default App;
