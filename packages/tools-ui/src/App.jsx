// src/App.js
import React, { useState, useEffect } from "react";
import {
    AppBar,
    Box,
    CssBaseline,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Container,
    createTheme,
    ThemeProvider,
    useMediaQuery,
    useTheme
} from "@mui/material";
import { Link, Outlet } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import GroupsIcon from "@mui/icons-material/Groups";
import { Assessment, Memory, NetworkCheck, Webhook } from "@mui/icons-material";
import HowToVoteIcon from "@mui/icons-material/HowToVote";

const theme = createTheme({
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 960,
            lg: 1280,
            xl: 1920,
            "2xl": 2560,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                outlined: {
                    color: "white",
                    borderColor: "white",
                    "&:hover": {
                        borderColor: "lightgray",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                },
            },
        },
    },
});

function App() {
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

    // Keep drawer open by default on non-mobile, closed on mobile
    const [drawerOpen, setDrawerOpen] = useState(!isMobile);

    useEffect(() => {
        setDrawerOpen(!isMobile);
    }, [isMobile]);

    const toggleDrawer = () => {
        setDrawerOpen(!drawerOpen);
    };

    const menuItems = [
        { text: "Home", icon: <HomeIcon />, path: "/" },
        { text: "Orchestrators", icon: <GroupsIcon />, path: "/orchestrators" },
        { text: "Gateways", icon: <Webhook />, path: "/gateways" },
        { text: "Reports", icon: <Assessment />, path: "/reports" },
        { text: "Performance", icon: <NetworkCheck />, path: "/performance/leaderboard" },
        { text: "Treasury Voting", icon: <HowToVoteIcon />, path: "/vote/history" },
        { text: "AI Generator", icon: <Memory />, path: "/ai/generator" },
    ];

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: "flex" }}>
                {/* AppBar */}
                <AppBar
                    position="fixed"
                    sx={{
                        ml: !isMobile && drawerOpen ? "250px" : 0,
                        width: !isMobile && drawerOpen ? `calc(100% - 250px)` : "100%",
                        transition: muiTheme.transitions.create(["margin", "width"], {
                            easing: muiTheme.transitions.easing.sharp,
                            duration: muiTheme.transitions.duration.leavingScreen,
                        }),
                    }}
                >
                    <Toolbar>
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            onClick={toggleDrawer}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            Livepeer Tools by Livepeer.Cloud SPE
                        </Typography>
                    </Toolbar>
                </AppBar>

                {/* Drawer */}
                <Drawer
                    variant={isMobile ? "temporary" : "persistent"}
                    open={drawerOpen}
                    onClose={toggleDrawer}
                    sx={{
                        "& .MuiDrawer-paper": {
                            width: 250,
                            boxSizing: "border-box",
                        },
                    }}
                >
                    <Box
                        role="presentation"
                        onClick={isMobile ? toggleDrawer : undefined}
                        onKeyDown={isMobile ? toggleDrawer : undefined}
                    >
                        <List>
                            {menuItems.map((item, index) => (
                                <ListItem key={index} component={Link} to={item.path}>
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Drawer>

                {/* Main Content */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        mt: 8, // margin-top to account for AppBar height
                        transition: muiTheme.transitions.create("margin", {
                            easing: muiTheme.transitions.easing.sharp,
                            duration: muiTheme.transitions.duration.leavingScreen,
                        }),
                        ml: !isMobile && drawerOpen ? "250px" : 0,
                    }}
                >
                    <Container sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
                        <Outlet />
                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default App;
