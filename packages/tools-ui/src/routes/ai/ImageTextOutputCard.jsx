import React from "react";
import { Box, Typography, Container } from "@mui/material";

const ImageTextOutputCard = ({ text }) => {
    return (
        <Container maxWidth="sm" sx={{ mt: 5 }}>
            <Box
                sx={{
                    p: 5,
                    backgroundColor: "background.paper",
                    borderRadius: "8px",
                    boxShadow: 3,
                    textAlign: "center",
                }}
            >
                <Typography variant="body1" color="textSecondary">
                    {text}
                </Typography>
            </Box>
        </Container>
    );
};

export default ImageTextOutputCard;
