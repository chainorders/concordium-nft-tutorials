import { useState } from "react";
import { TextField, Typography, Button } from "@mui/material";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import {
	ContractAddress,
	InvokeContractFailedResult,
	RejectReasonTag,
} from "@concordium/web-sdk";

import { balanceOf, isValidTokenId } from "../models/Cis2Client";

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
		setState({ ...state, checking: true });
		balanceOf(
			props.provider,
			props.account,
			props.nftContractAddress,
			state.tokenId
		)
			.then((balance) => {
				if (balance > 0) {
					setState({ ...state, checking: false, error: "" });
					props.onDone(state.tokenId, balance);
				} else {
					setState({ ...state, checking: false, error: "Not enough balance" });
				}
			})
			.catch((err: Error) => {
				if (err.cause) {
					let cause = err.cause as InvokeContractFailedResult;
					if (cause.reason.tag === RejectReasonTag.RejectedReceive) {
						switch (cause.reason.rejectReason) {
							case -42000001:
								setState({
									...state,
									checking: false,
									error: "Token not found",
								});
								return;
							case -42000002:
								setState({
									...state,
									checking: false,
									error: "Insufficient Funds",
								});
								return;
							case -42000003:
								setState({ ...state, checking: false, error: "Unauthorized" });
								return;
						}
					}
				}
				setState({ ...state, checking: false, error: err.message });
			});
	}

	function isValid() {
		return !!state.tokenId && isValidTokenId(state.tokenId);
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
				<div>
					{state.error ? <Typography>{state.error}</Typography> : <></>}
				</div>
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