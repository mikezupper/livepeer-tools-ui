import { useLoaderData } from 'react-router-dom';
import React from 'react';
import {
    Grid,
    Typography,
    Box,
} from '@mui/material';
import GatewayDetails from "./GatewayDetails.jsx";

/**
 * Orchestrator Component
 * @returns {JSX.Element} The rendered component.
 */
function Gateway() {
    const { gateway } = useLoaderData();

    return (
        <Box sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                Gateway
            </Typography>
            <Grid container spacing={4}>
                <GatewayDetails gateway={gateway} key={gateway.eth_address} />
            </Grid>
        </Box>
    );
}

export default Gateway;
