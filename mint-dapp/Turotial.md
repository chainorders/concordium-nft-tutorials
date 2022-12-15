## Perquisites

- yarn
- vscode

## Follow along

- `yarn create react-app mint-dapp --template typescript`
- `cd mint-dapp`
- `code .`
- `yarn start` - will open the browser

### Add Dependencies

- `yarn add @mui/material @emotion/react @mui/icons-material @emotion/styled @concordium/web-sdk @concordium/browser-wallet-api-helpers`

### Connect

- Add a component `Header.tsx` with following code

```tsx
import {
	detectConcordiumProvider,
	WalletApi,
} from "@concordium/browser-wallet-api-helpers";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { useState } from "react";

export default function Header(props: {
	onConnected: (provider: WalletApi, account: string) => void;
	onDisconnected: () => void;
}) {
	const [isConnected, setConnected] = useState(false);

	function connect() {
		detectConcordiumProvider()
			.then((provider) => {
				provider
					.connect()
					.then((account) => {
						setConnected(true);
						props.onConnected(provider, account!);
					})
					.catch((_) => {
						alert("Please allow wallet connection");
						setConnected(false);
					});
				provider.removeAllListeners();
				provider.on("accountDisconnected", () => {
					setConnected(false);
					props.onDisconnected();
				});
				provider.on("accountChanged", (account) => {
					props.onDisconnected();
					props.onConnected(provider, account);
					setConnected(true);
				});
				provider.on("chainChanged", () => {
					props.onDisconnected();
					setConnected(false);
				});
			})
			.catch((_) => {
				console.error(`could not find provider`);
				alert("Please download Concordium Wallet");
			});
	}

	return (
		<AppBar>
			<Toolbar>
				<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
					Concordium NFT Minting
				</Typography>
				<Button color="inherit" onClick={connect} disabled={isConnected}>
					{isConnected ? "Connected" : "Connect"}
				</Button>
			</Toolbar>
		</AppBar>
	);
}
```
and update the `App.tsx` to use the newly created component
```tsx
import "./App.css";
import Header from "./Header";

export default function App() {
	return (
		<div className="App">
			<Header
				onConnected={(_provider, account) => alert(`connected ${account}`)}
				onDisconnected={() => alert("disconnected")}
			/>
		</div>
	);
}
```
### Initialize

### Mint
