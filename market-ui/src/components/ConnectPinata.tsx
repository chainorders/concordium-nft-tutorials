import { Paper, Typography, Button, TextField } from "@mui/material";
import { useState } from "react";
import { PinataClient } from "../models/PinataClient";

function ConnectPinata(props: { onDone: (jwt: string) => void }) {
	const [state, setState] = useState({
		error: "",
		processing: false,
		pinataJwt: "",
	});

	function onOkClicked() {
		var pinata = new PinataClient(state.pinataJwt);
		setState({ ...state, processing: true });
		pinata
			.isJwtValid()
			.then((isValid) => {
				if (!isValid) {
					setState({ ...state, processing: false, error: "Invalid JWT" });
					return;
				}

				props.onDone(state.pinataJwt);
			})
			.catch((error: Error) => {
				setState({ ...state, processing: false, error: error.message });
			});
	}

	return (
		<Paper>
			<h3>Deploy NFT Collection</h3>
			<form>
				<TextField
					name="pinataJwt"
					id="pinata-jwt"
					label="Pinata JWT"
					required={true}
					onChange={(e) => setState({ ...state, pinataJwt: e.target.value })}
				/>
				<div>{state.error && <Typography>{state.error}</Typography>}</div>
				<div>{state.processing && <Typography>Deploying..</Typography>}</div>
				<div>
					<Button
						variant="contained"
						disabled={state.processing}
						onClick={() => onOkClicked()}
					>
						Connect
					</Button>
				</div>
			</form>
		</Paper>
	);
}

export default ConnectPinata;
