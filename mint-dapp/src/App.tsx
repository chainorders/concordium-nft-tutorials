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
