import FileUpload from "react-material-file-upload";

function UploadFiles(props: { onDone: (files: File[]) => void }) {
	return (
		<FileUpload
			value={[]}
			onChange={props.onDone}
			multiple={true}
			title={""}
			accept={[".jpg"]}
		/>
	);
}

export default UploadFiles;
