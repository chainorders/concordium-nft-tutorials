import "./App.css";

import { useEffect, useState } from "react";
import {
	detectConcordiumProvider,
	WalletApi,
} from "@concordium/browser-wallet-api-helpers";
import {
	AppBar,
	Box,
	Container,
	Link,
	Paper,
	Toolbar,
	Typography,
} from "@mui/material";

import MintPage from "./components/Cis2Mint";
import { CIS2_MULTI_CONTRACT_INFO } from "./Constants";
import HeaderButton from "./components/HeaderButton";
import Cis2Init from "./components/Cis2Init";

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
		if (!state.provider || !state.account) {
			connect();
		}

		return () => {
			state.provider?.removeAllListeners();
		};
	}, [state.account]);

	function isConnected() {
		return !!state.provider && !!state.account;
	}

	const isConnectedVar = isConnected();

	return (
		<>
			<AppBar position="static">
				<Container maxWidth="xl" sx={{ height: "100%" }}>
					<Toolbar disableGutters>
						<Typography
							variant="h6"
							noWrap
							component="a"
							sx={{
								mr: 2,
								display: "flex",
								fontFamily: "monospace",
								fontWeight: 700,
								letterSpacing: ".3rem",
								color: "inherit",
								textDecoration: "none",
							}}
						>
							Concordium
						</Typography>
						<Box
							sx={{
								flexGrow: 1,
								display: "flex",
								flexDirection: "row-reverse",
							}}
						>
							<HeaderButton
								name={isConnectedVar ? "Connected" : "Connect"}
								isSelected={isConnectedVar}
								onClick={connect}
							/>
						</Box>
					</Toolbar>
				</Container>
			</AppBar>
			<Box className="App">
				<Paper>
					<MintPage
						key={CIS2_MULTI_CONTRACT_INFO.contractName}
						contractInfo={CIS2_MULTI_CONTRACT_INFO}
						provider={state.provider!}
						account={state.account!}
					/>
				</Paper>
				<Paper>
					<Cis2Init
						account={state.account!}
						provider={state.provider!}
						contractInfo={CIS2_MULTI_CONTRACT_INFO}
						onDone={(contract) =>
							alert(
								`Contract Initialized index: ${contract.index}, subindex: ${contract.subindex}`
							)
						}
					/>
				</Paper>
			</Box>
			<footer className="footer">
				<Typography textAlign={"center"} sx={{ color: "white" }}>
					<Link
						sx={{ color: "white" }}
						href="https://developer.concordium.software/en/mainnet/index.html"
						target={"_blank"}
					>
						Concordium Developer Documentation
					</Link>
				</Typography>
			</footer>
		</>
	);
}

export default App;
