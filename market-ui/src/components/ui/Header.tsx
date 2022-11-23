import { useState } from "react";
import { useNavigate } from "react-router";
import {
	AppBar,
	Container,
	Toolbar,
	Typography,
	Box,
	IconButton,
	Menu,
	MenuItem,
	Button,
} from "@mui/material";
import AdbIcon from "@mui/icons-material/Adb";
import MenuIcon from "@mui/icons-material/Menu";
import { styled } from "@mui/system";
import { useLocation } from "react-router-dom";

function Header(props: {
	pages: {
		href?: string; path: string; name: string; component: JSX.Element 
}[];
}) {
	const StyledAppBar = styled(AppBar)({
		backgroundImage:
			'url("https://cdn-gpbbj.nitrocdn.com/eWGcFpraIsZGbNFvSyLAtmgXkWlgLXiK/assets/static/optimized/rev-c02a987/wp-content/uploads/2022/07/pexels-andrea-piacquadio-3931501-1-1.png")',
	});

	const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
	const navigate = useNavigate();
	const location = useLocation();
    const title = props.pages.find((p) => p.path === location.pathname)?.name;

	const handleCloseNavMenu = (href?: string) => {
		setAnchorElNav(null);

		if (href) {
			navigate(href);
		}
	};
	const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
		event.preventDefault();
		setAnchorElNav(event.currentTarget);
	};

	return (
		<StyledAppBar position="static">
			<Container maxWidth="xl" sx={{ height: "100%" }}>
				<Toolbar disableGutters>
					<Typography
						variant="h6"
						noWrap
						component="a"
						href="/"
						sx={{
							mr: 2,
							display: { xs: "none", md: "flex" },
							fontFamily: "monospace",
							fontWeight: 700,
							letterSpacing: ".3rem",
							color: "inherit",
							textDecoration: "none",
						}}
					>
						Concordium
					</Typography>

					<Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
						<IconButton
							size="large"
							aria-label="account of current user"
							aria-controls="menu-appbar"
							aria-haspopup="true"
							onClick={handleOpenNavMenu}
							color="inherit"
						>
							<MenuIcon />
						</IconButton>
						<Menu
							id="menu-appbar"
							anchorEl={anchorElNav}
							anchorOrigin={{
								vertical: "bottom",
								horizontal: "left",
							}}
							keepMounted
							transformOrigin={{
								vertical: "top",
								horizontal: "left",
							}}
							open={Boolean(anchorElNav)}
							onClose={() => handleCloseNavMenu()}
							sx={{
								display: { xs: "block", md: "none" },
							}}
						>
							{props.pages.map((page) => (
								<MenuItem
									key={page.name}
									onClick={() => handleCloseNavMenu(page.href || page.path)}
                                    sx={{border: "1px", borderColor: "white"}}
								>
									<Typography textAlign="center">{page.name}</Typography>
								</MenuItem>
							))}
						</Menu>
					</Box>
					<AdbIcon sx={{ display: { xs: "flex", md: "none" }, mr: 1 }} />
					<Typography
						variant="h5"
						noWrap
						component="a"
						href=""
						sx={{
							mr: 2,
							display: { xs: "flex", md: "none" },
							flexGrow: 1,
							fontWeight: 700,
							letterSpacing: ".3rem",
							color: "inherit",
							textDecoration: "none",
						}}
					>
						Concordium
					</Typography>
					<Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
						{props.pages.map((page) => (
							<Button
								key={page.name}
								onClick={() => handleCloseNavMenu(page.href || page.path)}
								sx={{ my: 2, color: "white", display: "block" }}
							>
								{page.name}
							</Button>
						))}
					</Box>
				</Toolbar>
			</Container>
			<Container sx={{ width: "100%" }}>
				<Typography variant="h2" textAlign={"center"}>
					{title}
				</Typography>
			</Container>
		</StyledAppBar>
	);
}

export default Header;
