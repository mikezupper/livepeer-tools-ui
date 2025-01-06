import React, { useState } from "react";
import {
    AppBar,
    Box,
    Collapse,
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
    Stack
} from "@mui/material";
import { Link, Outlet } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import HomeIcon from "@mui/icons-material/Home";
import GroupsIcon from "@mui/icons-material/Groups";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import {Assessment, NetworkCheck, Webhook} from "@mui/icons-material";

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
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [reportsOpen, setReportsOpen] = useState(false);

    const toggleDrawer = () => setDrawerOpen(!drawerOpen);
    const toggleReports = () => setReportsOpen(!reportsOpen);

    const menuItems = [
        { text: "Home", icon: <HomeIcon />, path: "/" },
        { text: "Orchestrators", icon: <GroupsIcon />, path: "/orchestrators" },
        { text: "Gateways", icon: <Webhook />, path: "/gateways" },
        { text: "Reports", icon: <Assessment />, path: "/reports" },
        { text: "Performance", icon: <NetworkCheck />, path: "/performance/leaderboard" },
    ];

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: "flex" }}>
                {/* AppBar */}
                <AppBar position="fixed">
                    <Toolbar>
                        <IconButton edge="start" color="inherit" aria-label="menu" onClick={toggleDrawer}>
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            Livepeer Tools by Livepeer.Cloud SPE
                        </Typography>
                    </Toolbar>
                </AppBar>

                {/* Drawer */}
                <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer}>
                    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer} onKeyDown={toggleDrawer}>
                        <List>
                            {/* Main Menu Items */}
                            {menuItems.map((item, index) => (
                                <ListItem key={index} component={Link} to={item.path} button>
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Drawer>

                {/* Main Content */}
                <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
                    <Container sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
                        <Outlet />
                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default App;
