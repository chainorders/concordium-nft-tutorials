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