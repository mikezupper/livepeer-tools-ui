// src/routes/ai/AILayout.jsx
import * as React from "react";
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Tabs,
    Tab,
    Menu,
    MenuItem,
    useTheme,
} from "@mui/material";
import { Link as RouterLink, Outlet } from "react-router-dom";

// Top-level menu icons
import ImageIcon from "@mui/icons-material/Image";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import LanguageIcon from "@mui/icons-material/Language";
import NetworkCheckIcon from "@mui/icons-material/NetworkCheck";
import SettingsIcon from "@mui/icons-material/Settings";

// Unique icons for Image Tasks submenu
import CreateIcon from "@mui/icons-material/Create";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import ZoomInIcon from "@mui/icons-material/ZoomIn";

// Unique icons for Audio Tasks submenu
import SubtitlesIcon from "@mui/icons-material/Subtitles";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";

export default function AILayout() {
    const theme = useTheme();

    // State for submenu expansion
    const [anchorElImage, setAnchorElImage] = React.useState(null);
    const openImage = Boolean(anchorElImage);
    const [anchorElAudio, setAnchorElAudio] = React.useState(null);
    const openAudio = Boolean(anchorElAudio);

    // Tab state
    const [selectedTab, setSelectedTab] = React.useState(0);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
    };

    // Handlers for submenus
    const handleImageClick = (event) => {
        setAnchorElImage(event.currentTarget);
    };
    const handleImageClose = () => {
        setAnchorElImage(null);
    };

    const handleAudioClick = (event) => {
        setAnchorElAudio(event.currentTarget);
    };
    const handleAudioClose = () => {
        setAnchorElAudio(null);
    };

    // Menu items with potential children for submenus
    const aiMenuItems = [
        {
            text: "Image Tasks",
            icon: <ImageIcon />,
            path: "image",
            children: [
                { text: "Text To Image", icon: <CreateIcon />, path: "text-to-image" },
                { text: "Image to Image", icon: <PhotoCameraIcon />, path: "image-to-image" },
                { text: "Image to Video", icon: <VideoLibraryIcon />, path: "image-to-video" },
                { text: "Image to Text", icon: <TextFieldsIcon />, path: "image-to-text" },
                { text: "Upscale", icon: <ZoomInIcon />, path: "upscale" },
            ],
        },
        {
            text: "Audio Tasks",
            icon: <AudiotrackIcon />,
            path: "audio",
            children: [
                { text: "Audio to Text", icon: <SubtitlesIcon />, path: "audio-to-text" },
                { text: "Text to Speech", icon: <RecordVoiceOverIcon />, path: "text-to-speech" },
            ],
        },
        { text: "SAM-2", icon: <TravelExploreIcon />, path: "segment-anything-2" },
        { text: "LLM", icon: <LanguageIcon />, path: "llm" },
        { text: "Capabilities", icon: <NetworkCheckIcon />, path: "network-capabilities" },
        { text: "Settings", icon: <SettingsIcon />, path: "settings" },
    ];

    return (
        <Box sx={{ display: "flex", flexDirection: "column" }}>
            <AppBar position="static" sx={{ bgcolor: theme.palette.primary.main }}>
                <Toolbar>
                    <Tabs
                        value={selectedTab}
                        onChange={handleTabChange}
                        textColor="inherit"
                        indicatorColor="secondary"
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ flexGrow: 1 }}
                    >
                        {aiMenuItems.map((item, index) => {
                            if (item.children) {
                                const isImage = item.text === "Image Tasks";
                                const anchorEl = isImage ? anchorElImage : anchorElAudio;
                                const open = isImage ? openImage : openAudio;
                                const handleClick = isImage ? handleImageClick : handleAudioClick;
                                const handleClose = isImage ? handleImageClose : handleAudioClose;

                                return (
                                    <React.Fragment key={item.text}>
                                        <Tab
                                            icon={item.icon}
                                            label={item.text}
                                            onClick={handleClick}
                                            sx={{ display: "flex", alignItems: "center" }}
                                        />
                                        <Menu
                                            anchorEl={anchorEl}
                                            open={open}
                                            onClose={handleClose}
                                            anchorOrigin={{
                                                vertical: "bottom",
                                                horizontal: "left",
                                            }}
                                            transformOrigin={{
                                                vertical: "top",
                                                horizontal: "left",
                                            }}
                                        >
                                            {item.children.map((child) => (
                                                <MenuItem
                                                    key={child.text}
                                                    component={RouterLink}
                                                    to={child.path}
                                                    onClick={handleClose}
                                                    sx={{ display: "flex", alignItems: "center" }}
                                                >
                                                    {child.icon}
                                                    {child.text}
                                                </MenuItem>
                                            ))}
                                        </Menu>
                                    </React.Fragment>
                                );
                            }
                            return (
                                <Tab
                                    key={item.text}
                                    icon={item.icon}
                                    label={item.text}
                                    component={RouterLink}
                                    to={item.path}
                                />
                            );
                        })}
                    </Tabs>
                </Toolbar>
            </AppBar>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Outlet />
            </Box>
        </Box>
    );
}
