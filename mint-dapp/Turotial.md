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

- Add a component [`Header.tsx`](./src/Header.tsx) with following code

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

- Update the [`App.tsx`](./src/App.tsx) to use the newly created component

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
- Add Env Variables by adding a `.env` file to the root
```
REACT_APP_CONTRACT_NAME="CIS2-Multi"
REACT_APP_MODULE_REF="312f99d6406868e647359ea816e450eac0ecc4281c2665a24936e6793535c9f6"
```
- Add Initialize Component [`InitializeContract.tsx`](./src/InitializeContract.tsx)

```tsx
import { detectConcordiumProvider } from "@concordium/browser-wallet-api-helpers";
import {
	AccountTransactionType,
	CcdAmount,
	InitContractPayload,
	ModuleReference,
} from "@concordium/web-sdk";
import { Button, Link } from "@mui/material";
import { Buffer } from "buffer/";
import { useState } from "react";

export default function InitializeContract() {
	const [hash, setHash] = useState("");

	const initialize = async () => {
		const provider = await detectConcordiumProvider();
		const account = await provider.connect();

		if (!account) {
			alert("Please connect");
		}

		const txnHash = await provider.sendTransaction(
			account!,
			AccountTransactionType.InitContract,
			{
				amount: new CcdAmount(BigInt(0)),
				initName: process.env.REACT_APP_CONTRACT_NAME!,
				moduleRef: new ModuleReference(process.env.REACT_APP_MODULE_REF!),
				param: Buffer.alloc(0),
				maxContractExecutionEnergy: BigInt(9999),
			} as InitContractPayload
		);

		setHash(txnHash);
	};

	return hash ? (
		<Link
			href={`https://dashboard.testnet.concordium.com/lookup/${hash}`}
			target="_blank"
		>
			View Transaction <br />
			{hash}
		</Link>
	) : (
		<Button fullWidth variant="outlined" onClick={initialize}>
			Initialize Contract
		</Button>
	);
}
```

- Update the [`App.tsx`](./src/App.tsx) to add the newly added component

```tsx
import "./App.css";
import Header from "./Header";
import { useState } from "react";
import { Container } from "@mui/material";
import InitializeContract from "./InitializeContract";

export default function App() {
	const [isConnected, setConnected] = useState(false);

	return (
		<div className="App">
			<Header
				onConnected={() => setConnected(true)}
				onDisconnected={() => setConnected(false)}
			/>
			<Container sx={{ mt: 5 }}>
				{isConnected && <InitializeContract />}
			</Container>
		</div>
	);
}
```

### Mint
