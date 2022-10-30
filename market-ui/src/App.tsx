import "./App.css";

import { useEffect, useState } from "react";
import {
	detectConcordiumProvider,
	WalletApi,
} from "@concordium/browser-wallet-api-helpers";
import {
	AppBar,
	Avatar,
	BottomNavigation,
	BottomNavigationAction,
	Box,
	Button,
	IconButton,
	Menu,
	MenuItem,
	Paper,
	Toolbar,
	Tooltip,
	Typography,
} from "@mui/material";
import { Container } from "@mui/system";
import { Route, Routes, useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import StoreIcon from "@mui/icons-material/Store";
import AdbIcon from "@mui/icons-material/Adb";
import MenuIcon from "@mui/icons-material/Menu";

import ListNftPage from "./pages/ListNftPage";
import AddNftPage from "./pages/AddNftPage";
import MintNftPage from "./pages/MintNftPage";

import { ContractAddress } from "@concordium/web-sdk";
import { MARKET_CONTRACT_ADDRESS } from "./Constants";
import BatchMintNftPage from "./pages/BatchMintNftPage";
import ConnectWallet from "./components/ConnectWallet";

function App() {
	const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
	const [state, setState] = useState<{
		provider?: WalletApi;
		account?: string;
	}>({});
	const navigate = useNavigate();
	const handleCloseNavMenu = (href?: string) => {
		setAnchorElNav(null);

		if (href) {
			navigate(href);
		}
	};
	const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
		event.preventDefault();
		setAnchorElNav(event.currentTarget);
	};
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
			name: "Add",
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
			name: "Mint",
			component: (
				<BatchMintNftPage provider={state.provider!} account={state.account!} />
			),
		},
	];

	return (
		<>
			<AppBar position="static">
				<Container maxWidth="xl">
					<Toolbar disableGutters>
						<AdbIcon sx={{ display: { xs: "none", md: "flex" }, mr: 1 }} />
						<Typography
							variant="h6"
							noWrap
							component="a"
							href="/"
							sx={{
								mr: 2,
								display: { xs: "none", md: "flex" },
								fontFamily: "monospace",
								fontWeight: 700,
								letterSpacing: ".3rem",
								color: "inherit",
								textDecoration: "none",
							}}
						>
							Concordium
						</Typography>

						<Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
							<IconButton
								size="large"
								aria-label="account of current user"
								aria-controls="menu-appbar"
								aria-haspopup="true"
								onClick={handleOpenNavMenu}
								color="inherit"
							>
								<MenuIcon />
							</IconButton>
							<Menu
								id="menu-appbar"
								anchorEl={anchorElNav}
								anchorOrigin={{
									vertical: "bottom",
									horizontal: "left",
								}}
								keepMounted
								transformOrigin={{
									vertical: "top",
									horizontal: "left",
								}}
								open={Boolean(anchorElNav)}
								onClose={() => handleCloseNavMenu()}
								sx={{
									display: { xs: "block", md: "none" },
								}}
							>
								{pages.map((page) => (
									<MenuItem
										key={page.name}
										onClick={() => handleCloseNavMenu(page.path)}
									>
										<Typography textAlign="center">{page.name}</Typography>
									</MenuItem>
								))}
							</Menu>
						</Box>
						<AdbIcon sx={{ display: { xs: "flex", md: "none" }, mr: 1 }} />
						<Typography
							variant="h5"
							noWrap
							component="a"
							href=""
							sx={{
								mr: 2,
								display: { xs: "flex", md: "none" },
								flexGrow: 1,
								fontWeight: 700,
								letterSpacing: ".3rem",
								color: "inherit",
								textDecoration: "none",
							}}
						>
							Concordium
						</Typography>
						<Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
							{pages.map((page) => (
								<Button
									key={page.name}
									onClick={() => handleCloseNavMenu(page.path)}
									sx={{ my: 2, color: "white", display: "block" }}
								>
									{page.name}
								</Button>
							))}
						</Box>
					</Toolbar>
				</Container>
			</AppBar>
			
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
