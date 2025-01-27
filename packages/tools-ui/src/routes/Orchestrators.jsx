import {useLoaderData} from 'react-router-dom';
import React, {useState} from 'react';
import {
    Grid,
    Typography,
    Box,
    TextField,
} from '@mui/material';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import autocolors from 'chartjs-plugin-autocolors';
import OrchestratorDetails from "./OrchestratorDetails.jsx";

// Register Chart.js plugins
Chart.register(ChartDataLabels, autocolors);

/**
 *
 * @returns {JSX.Element} The rendered component.
 */
function Orchestrators() {
    const {orchestrators} = useLoaderData();
    const [searchTerm, setSearchTerm] = useState("");

    // Filter orchestrators based on the search term
    const filteredOrchestrators = orchestrators.filter((orch) =>
        orch.name.toLowerCase().includes(searchTerm.toLowerCase()) || orch.eth_address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };
    return (
        <Box sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                All Orchestrators
            </Typography>
            {/* Introductory text */}
            <Typography variant="body1" sx={{ mb: 2 }}>
                This page displays a list of all orchestrators. You can browse the list below, or use the search box to
                quickly find an orchestrator by name or Ethereum address. Simply start typing in the search box, and the list
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
            {/* Filtered list of orchestrators */}
            {filteredOrchestrators.length > 0 ? (
                <Grid container spacing={4}>
                    {filteredOrchestrators.map((orch, idx) => (
                        <OrchestratorDetails orch={orch} idx={idx + 1} key={orch.eth_address} />
                    ))}
                </Grid>
            ) : (
                <Typography variant="body1" sx={{ mt: 4 }}>
                    No orchestrators match your search. Please try a different name or Ethereum address.
                </Typography>
            )}

        </Box>
    );
}

export default Orchestrators;
