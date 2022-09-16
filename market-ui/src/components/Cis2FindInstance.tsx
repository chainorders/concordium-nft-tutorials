import { useState } from "react";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import { Paper, TextField, Typography, Button } from "@mui/material";

import { getInstanceInfo } from "../models/Utils";
import { ensureSupportsCis2 } from "../models/Cis2Client";

function Cis2FindInstance(props: {
	provider: WalletApi;
	onDone: (address: ContractAddress) => void;
}) {
	let [state, setState] = useState({
		error: "",
		index: "",
		subIndex: "0",
		checking: false,
	});

	function isValid() {
		try {
			return (
				state.index &&
				state.subIndex &&
				BigInt(state.index) >= 0 &&
				BigInt(state.subIndex) >= 0
			);
		} catch (e) {
			return false;
		}
	}

	function onOkClicked() {
		const address = {
			index: BigInt(state.index),
			subindex: BigInt(state.subIndex),
		};
		let s = { ...state };
		s.checking = true;
		setState(s);
		getInstanceInfo(props.provider, address)
			.then((_) => ensureSupportsCis2(props.provider, address))
			.then(() => props.onDone(address))
			.catch((e: Error) => {
				s.error = e.message;
				setState(s);
			})
			.finally(() => {
				s.checking = false;
				setState(s);
			});
	}

	return (
		<Paper>
			<h3>Please Speficy your NFT Collection Contract</h3>
			<form>
				<div>
					<TextField
						id="contract-index"
						label="Contract Index"
						variant="standard"
						value={state.index}
						onChange={(v) => setState({ ...state, index: v.target.value })}
						disabled={state.checking}
					/>
					<br />
					<TextField
						id="contract-subindex"
						label="Contract Sub Index"
						variant="standard"
						value={state.subIndex}
						onChange={(v) => setState({ ...state, subIndex: v.target.value })}
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
		</Paper>
	);
}

export default Cis2FindInstance;