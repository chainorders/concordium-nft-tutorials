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

- Update [`.env`](./.env) file with schema value (`REACT_APP_CONTRACT_SCHEMA`)
- Add [`Mint.tsx`](./src/Mint.tsx) Component

```tsx
import { detectConcordiumProvider } from "@concordium/browser-wallet-api-helpers";
import {
	AccountTransactionType,
	CcdAmount,
	serializeUpdateContractParameters,
	UpdateContractPayload,
} from "@concordium/web-sdk";
import { Button, Link, Stack, TextField, Typography } from "@mui/material";
import { FormEvent, useState } from "react";
import { Buffer } from "buffer/";

export default function Mint() {
	let [state, setState] = useState({
		checking: false,
		error: "",
		hash: "",
	});

	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setState({ ...state, error: "", checking: true, hash: "" });
		const formData = new FormData(event.currentTarget);

		var formValues = {
			index: BigInt(formData.get("contractIndex")?.toString() || "-1"),
			subindex: BigInt(formData.get("contractSubindex")?.toString() || "-1"),
			metadataUrl: formData.get("metadataUrl")?.toString() || "",
			tokenId: formData.get("tokenId")?.toString() || "",
			quantity: parseInt(formData.get("quantity")?.toString() || "-1"),
		};

		if (!(formValues.index >= 0)) {
			setState({ ...state, error: "Invalid Contract Index" });
			return;
		}

		if (!(formValues.subindex >= 0)) {
			setState({ ...state, error: "Invalid Contract Subindex" });
			return;
		}

		if (!(formValues.quantity >= 0)) {
			setState({ ...state, error: "Invalid Quantity" });
			return;
		}

		if (!formValues.metadataUrl) {
			setState({ ...state, error: "Invalid Metadata Url" });
			return;
		}

		if (!formValues.tokenId) {
			setState({ ...state, error: "Invalid Token Id" });
			return;
		}

		const provider = await detectConcordiumProvider();
		const account = await provider.connect();

		if (!account) {
			alert("Please connect");
		}

		const address = { index: formValues.index, subindex: formValues.subindex };
		const paramJson = {
			owner: {
				Account: [account],
			},
			tokens: [
				[
					formValues.tokenId,
					[
						{
							url: formValues.metadataUrl,
							hash: "",
						},
						formValues.quantity.toString(),
					],
				],
			],
		};

		try {
			const schemaBuffer = Buffer.from(
				process.env.REACT_APP_CONTRACT_SCHEMA!,
				"base64"
			);
			const serializedParams = serializeUpdateContractParameters(
				process.env.REACT_APP_CONTRACT_NAME!,
				"mint",
				paramJson,
				schemaBuffer
			);
			const txnHash = await provider.sendTransaction(
				account!,
				AccountTransactionType.Update,
				{
					address,
					message: serializedParams,
					receiveName: `${process.env.REACT_APP_CONTRACT_NAME!}.mint`,
					amount: new CcdAmount(BigInt(0)),
					maxContractExecutionEnergy: BigInt(9999),
				} as UpdateContractPayload,
				paramJson,
				process.env.REACT_APP_CONTRACT_SCHEMA!
			);

			setState({ checking: false, error: "", hash: txnHash });
		} catch (error: any) {
			setState({ checking: false, error: error.message || error, hash: "" });
		}
	};

	return (
		<Stack
			component={"form"}
			spacing={2}
			onSubmit={submit}
			autoComplete={"true"}
		>
			<TextField
				id="contract-index"
				name="contractIndex"
				label="Contract Index"
				variant="standard"
				type={"number"}
				disabled={state.checking}
			/>
			<TextField
				id="contract-subindex"
				name="contractSubindex"
				label="Contract Sub Index"
				variant="standard"
				type={"number"}
				disabled={state.checking}
				value={0}
			/>
			<TextField
				id="metadata-url"
				name="metadataUrl"
				label="Metadata Url"
				variant="standard"
				disabled={state.checking}
			/>
			<TextField
				id="token-id"
				name="tokenId"
				label="Token Id"
				variant="standard"
				disabled={state.checking}
				defaultValue="01"
			/>
			<TextField
				id="quantity"
				name="quantity"
				label="Token Quantity"
				variant="standard"
				type="number"
				disabled={state.checking}
				defaultValue="1"
			/>
			{state.error && (
				<Typography component="div" color="error">
					{state.error}
				</Typography>
			)}
			{state.checking && <Typography component="div">Checking..</Typography>}
			{state.hash && (
				<Link
					href={`https://dashboard.testnet.concordium.com/lookup/${state.hash}`}
					target="_blank"
				>
					View Transaction <br />
					{state.hash}
				</Link>
			)}
			<Button
				type="submit"
				variant="contained"
				fullWidth
				size="large"
				disabled={state.checking}
			>
				Mint
			</Button>
		</Stack>
	);
}
```
- Update [`App.tsx`](./src/App.tsx) with the newly added component
```tsx
import "./App.css";
import Header from "./Header";
import { useState } from "react";
import { Container } from "@mui/material";
import InitializeContract from "./InitializeContract";
import Mint from "./Mint";

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
				{isConnected && <Mint />}
			</Container>
		</div>
	);
}
```