import { Button } from "@mui/material";

export default function HeaderButton(props: {
	name: string;
	isSelected: boolean;
	onClick: () => void;
}) {
	return (
		<Button
			variant={props.isSelected ? "outlined" : "contained"}
			key={props.name}
			onClick={() => props.onClick()}
			sx={{
				my: 2,
				color: "white",
				display: "block",
				borderColor: "white",
				borderRadius: "4px",
				":hover": {
					my: 2,
					color: "white",
					display: "block",
					borderColor: "white",
					borderRadius: "4px",
				},
			}}
		>
			{props.name}
		</Button>
	);
}
