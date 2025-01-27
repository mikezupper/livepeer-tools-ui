import {useLoaderData} from 'react-router-dom';
import React, {useState} from 'react';
import {
    Grid,
    Typography,
    Box, TextField,
} from '@mui/material';
import GatewayDetails from "./GatewayDetails.jsx";

/**
 *
 * @returns {JSX.Element} The rendered component.
 */
function Gateways() {
    const {gateways} = useLoaderData();
    const [searchTerm, setSearchTerm] = useState("");

    // Filter orchestrators based on the search term
    const filteredGateways = gateways.filter((gw) =>
        gw.name.toLowerCase().includes(searchTerm.toLowerCase()) || gw.eth_address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };
    return (
        <Box sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                All Gateways
            </Typography>
            {/* Introductory text */}
            <Typography variant="body1" sx={{ mb: 2 }}>
                This page displays a list of all gateways. You can browse the list below, or use the search box to
                quickly find an gateway by name or Ethereum address. Simply start typing in the search box, and the list
                will update automatically to match your input.
            </Typography>
            {/* Search box */}
            <TextField
                label="Search by Name or ETH Address"
                variant="outlined"
                fullWidth
                margin="normal"
                placeholder="Type a name or Ethereum address..."
                value={searchTerm}
                onChange={handleSearchChange}
                sx={{ mb: 4 }}
            />
            {/* Filtered list of gateways */}
            {filteredGateways.length > 0 ? (
                <Grid container spacing={4}>
                    {filteredGateways.map(gateway => (
                        <GatewayDetails gateway={gateway} key={gateway.eth_address}/>
                    ))}
                </Grid>
            ) : (
                <Typography variant="body1" sx={{ mt: 4 }}>
                    No gateways match your search. Please try a different name or Ethereum address.
                </Typography>
            )}
        </Box>
    );
}

export default Gateways;
