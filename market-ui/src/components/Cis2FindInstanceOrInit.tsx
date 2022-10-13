import { Divider } from "@mui/material";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";

import Cis2Init from "./Cis2Init";
import Cis2FindInstance from "./Cis2FindInstance";

function Cis2FindInstanceOrInit(props: {
	provider: WalletApi;
	account: string;
	onDone: (address: ContractAddress) => void;
}) {
	return (
		<>
			<Cis2Init {...props} />
			<Divider />
			<Cis2FindInstance provider={props.provider} onDone={props.onDone} />
		</>
	);
}

export default Cis2FindInstanceOrInit;