import FileUpload from "react-material-file-upload";

function UploadFiles(props: { onDone: (files: File[]) => void }) {
	return (
		<FileUpload
			value={[]}
			onChange={props.onDone}
			multiple={true}
			title={"Upload NFT images"}
			accept={[".jpg"]}
		/>
	);
}

export default UploadFiles;
