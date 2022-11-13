import {
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	SelectChangeEvent,
} from "@mui/material";
import { useState } from "react";
import { CIS2_NFT_CONTRACT_INFO, CIS2_MULTI_CONTRACT_INFO } from "../Constants";

export default function ContractSelect(props: { contractName?: string }) {
	const contractNames = [
		CIS2_NFT_CONTRACT_INFO.contractName,
		CIS2_MULTI_CONTRACT_INFO.contractName,
	];
	const [contractName, setContractName] = useState(props.contractName || contractNames[0]);
	const handleChange = (event: SelectChangeEvent) => {
		const contractName = props.contractName || (event.target.value as string);
		setContractName(contractName);
	};
	return (
		<FormControl fullWidth>
			<InputLabel id="contract-select-label">Contract Type</InputLabel>
			<Select
				labelId="contract-select-label"
				id="contract-select"
				name="contractName"
				label="Contract Type"
				value={contractName}
				required
				onChange={handleChange}
                disabled={!!props.contractName}
			>
				{contractNames.map((name) => (
					<MenuItem value={name} key={name}>{name}</MenuItem>
				))}
			</Select>
		</FormControl>
	);
}
