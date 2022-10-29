import {
	Paper,
	Typography,
	Button,
	TextField,
	ButtonGroup,
} from "@mui/material";
import { useState } from "react";
import { PinataClient } from "../models/PinataClient";

function ConnectPinata(props: {
	onDone: (jwt: string) => void;
	onSkip: () => void;
}) {
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
			<Typography variant="h3" gutterBottom>
				Connect Pinata
			</Typography>
			<form>
				<TextField
					name="pinataJwt"
					id="pinata-jwt"
					label="Pinata JWT"
					required={true}
					error={!!state.error}
					onChange={(e) => setState({ ...state, pinataJwt: e.target.value })}
				/>
				<div>{state.error && <Typography>{state.error}</Typography>}</div>
				<div>{state.processing && <Typography>Connecting..</Typography>}</div>
				<ButtonGroup sx={{padding: "10px"}}>
					<Button
						variant="contained"
						disabled={state.processing}
						onClick={() => onOkClicked()}
					>
						Connect
					</Button>

					<Button
						variant="contained"
						disabled={state.processing}
						onClick={() => props.onSkip()}
					>
						Skip
					</Button>
				</ButtonGroup>
			</form>
		</Paper>
	);
}

export default ConnectPinata;
