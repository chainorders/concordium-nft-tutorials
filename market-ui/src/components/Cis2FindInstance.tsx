import { useState } from "react";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import { Paper, TextField, Typography, Button, Stack } from "@mui/material";

import { ensureSupportsCis2 } from "../models/Cis2Client";
import { getInstanceInfo } from "../models/ConcordiumContractClient";

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
		<Stack component={"form"} spacing={2}>
			<TextField
				id="contract-index"
				label="Contract Index"
				variant="standard"
				value={state.index}
				onChange={(v) => setState({ ...state, index: v.target.value })}
				disabled={state.checking}
			/>
			<TextField
				id="contract-subindex"
				label="Contract Sub Index"
				variant="standard"
				value={state.subIndex}
				onChange={(v) => setState({ ...state, subIndex: v.target.value })}
				disabled={state.checking}
			/>
			{state.error && (
				<Typography component="div" color="error">
					{state.error}
				</Typography>
			)}
			{state.checking && <Typography component="div">Checking..</Typography>}
			<Button
				variant="contained"
				disabled={!isValid() || state.checking}
				onClick={() => onOkClicked()}
				fullWidth
				size="large"
				sx={{ maxWidth: "100px" }}
			>
				Find
			</Button>
		</Stack>
	);
}

export default Cis2FindInstance;
