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
			View Transaction <br/>{hash}
		</Link>
	) : (
		<Button fullWidth variant="outlined" onClick={initialize}>
			Initialize Contract
		</Button>
	);
}
