import { useLoaderData } from 'react-router-dom';
import React, {useEffect, useRef, useState} from 'react';
import {
    Grid,
    Typography,
    Box,
    TextField,
    Button,
} from '@mui/material';
import Chart from 'chart.js/auto';
import moment from 'moment';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import OrchestratorDetails from "./OrchestratorDetails.jsx";
import { API_BASE_URL } from "../config.js";
import {generateColors} from "./chartUtils.js";
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
