import FileUpload from "react-material-file-upload";
import { Typography } from "@mui/material";

function UploadFiles(props: { onDone: (files: File[]) => void }) {
	return (
		<>
			<Typography variant="h3" gutterBottom>
				Upload Image Files
			</Typography>
			<FileUpload
				value={[]}
				onChange={props.onDone}
				multiple={true}
				title={""}
				accept={[".jpg"]}
			/>
		</>
	);
}

export default UploadFiles;
