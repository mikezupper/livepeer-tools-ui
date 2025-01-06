import {useLoaderData} from 'react-router-dom';
import React, { useEffect, useRef } from 'react';
import {
    Container,
    Grid,
    Typography,
    Box,
    TextField,
    Button,
} from '@mui/material';
import Chart from 'chart.js/auto';
import moment from 'moment';
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

    return (
        <Box sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                All Orchestrators
            </Typography>
            <Grid container spacing={4}>
                {orchestrators.map((orch,idx) => (
                    <OrchestratorDetails orch={orch} idx={idx+1} key={orch.eth_address}/>
                ))}
            </Grid>

        </Box>
    );
}

export default Orchestrators;
