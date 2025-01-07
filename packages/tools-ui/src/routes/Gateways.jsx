import {useLoaderData} from 'react-router-dom';
import React from 'react';
import {
    Grid,
    Typography,
    Box,
} from '@mui/material';
import GatewayDetails from "./GatewayDetails.jsx";

/**
 *
 * @returns {JSX.Element} The rendered component.
 */
function Gateways() {
    const {gateways} = useLoaderData();
    return (
        <Box sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                All Gateways
            </Typography>
            <Grid container spacing={4}>
                {gateways.map((gateway) => (
                    <GatewayDetails gateway={gateway} key={gateway.eth_address}/>
                ))}
            </Grid>
        </Box>
    );
}

export default Gateways;
