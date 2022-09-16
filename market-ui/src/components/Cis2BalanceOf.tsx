import { useState } from "react";
import { TextField, Typography, Button } from "@mui/material";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";

import { balanceOf } from "../models/Cis2Client";

function Cis2BalanceOf(props: {
	provider: WalletApi;
	account: string;
	nftContractAddress: ContractAddress;
	onDone: (tokenId: string, balance: number) => void;
}) {
	const [state, setState] = useState({
		checking: false,
		error: "",
		tokenId: "",
	});

	function checkBalance() {
		let s = { ...state, checking: true };
		setState(s);

		balanceOf(
			props.provider,
			props.account,
			props.nftContractAddress,
			state.tokenId
		)
			.then((balance) => {
				console.log(`balance: ${balance}`);
				if (balance > 0) {
					setState({ ...state, checking: false, error: "" });
					props.onDone(state.tokenId, balance);
				} else {
					setState({ ...state, checking: false, error: "Not enough balance" });
				}
			})
			.catch((err: Error) => {
				s.checking = false;
				s.error = err.message;
				console.error(err);
				setState(s);
			});
	}

	function isValid() {
		return !!state.tokenId;
	}

	function onOkClicked() {
		checkBalance();
	}

	return (
		<>
			<h3>Check Token Balance</h3>
			<form>
				<div>
					<TextField
						id="token-id"
						label="Token Id"
						variant="standard"
						value={state.tokenId}
						onChange={(v) => setState({ ...state, tokenId: v.target.value })}
						disabled={state.checking}
					/>
				</div>
				<div>{state.error && <Typography>{state.error}</Typography>}</div>
				<div>{state.checking && <Typography>Checking..</Typography>}</div>
				<div>
					<Button
						variant="contained"
						disabled={!isValid() || state.checking}
						onClick={() => onOkClicked()}
					>
						Ok
					</Button>
				</div>
			</form>
		</>
	);
}

export default Cis2BalanceOf;