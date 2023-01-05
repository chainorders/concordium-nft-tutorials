import { TextField, TextFieldProps, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import { useState } from "react";
import { default as axios } from "axios";
import FileUpload from "react-material-file-upload";

const uploadFile = async (file: File, fileName: string): Promise<string> => {
	const data = new FormData();
	data.append("file", file);
	data.append("pinataMetadata", JSON.stringify({ name: fileName }));

	const response = await axios({
		method: "post",
		url: `https://api.pinata.cloud/pinning/pinFileToIPFS`,
		headers: {
			Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT!}`,
		},
		data: data,
	});

	return `${process.env.REACT_APP_GATEWAY_URL!}/${response.data.IpfsHash}`;
};

export default function MetadataUrlInput(
	props: { onChange?: (name?: string, value?: string) => void } & Omit<
		TextFieldProps,
		"onChange"
	>
) {
	const [state, setState] = useState({
		value: props.value as string | undefined,
		disabled: props.disabled,
		error: "",
	});

	const onInputChanged = (value?: string) => {
		props.onChange && props.onChange(props.name, value);
		setState({ ...state, error: "", disabled: false, value });
	};

	const onFileChanged = (files: File[]) => {
		setState({ ...state, disabled: true });
		uploadFile(files[0], files[0].name)
			.then((url) => {
				props.onChange && props.onChange(props.name, url);
				setState({ ...state, error: "", disabled: false, value: url });
			})
			.catch((err) =>
				setState({ error: err.message, disabled: false, value: undefined })
			);
	};
	return (
		<Stack>
			<Stack>
				{!state.value && (
					<FileUpload
						value={[]}
						onChange={onFileChanged}
						multiple={false}
						title={"Metadata URL will be update automatically"}
						accept={[".json"]}
						disabled={state.disabled}
					/>
				)}
				{state.value && <TextField
					{...props}
					value={state.value}
					disabled={state.disabled}
					onChange={(e) => onInputChanged(e.target.value)}
				/>}
			</Stack>
			{state.error && <Typography>{state.error}</Typography>}
		</Stack>
	);
}
