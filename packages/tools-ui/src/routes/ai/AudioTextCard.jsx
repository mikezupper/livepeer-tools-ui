import React from "react";
import { Chip, Box, Typography } from "@mui/material";

const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    // Pad single digit minutes and seconds with a leading zero
    const paddedMinutes = minutes.toString().padStart(2, "0");
    const paddedSeconds = remainingSeconds.toString().padStart(2, "0");

    return `${paddedMinutes}:${paddedSeconds}`;
};

const AudioTextCard = ({ timestamp, text }) => {
    return (
        <Box display="flex" alignItems="center" gap={2} sx={{ py: 1, px: 2, backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
            <Chip label={formatTime(timestamp)} color="primary" />
            <Typography variant="body1" color="textSecondary">
                {text}
            </Typography>
        </Box>
    );
};

export default AudioTextCard;
