import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Container,
    Grid,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    CircularProgress,
    Snackbar,
    Alert,
} from '@mui/material';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { generateColors } from "./chartUtils.js";
import moment from 'moment';

import { useLoaderData } from "react-router-dom";
import { topPayoutReportLoader } from "../loaders/index.js";

const TopPayoutReport = () => {
    const data = useLoaderData();
    const [startDate, setStartDate] = useState(moment().subtract(7, 'days').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));
    const [offset, setOffset] = useState('0');
    const [sort, setSort] = useState('total');
    const [jobType, setJobType] = useState('both');

    const [payoutData, setPayoutData] = useState(data);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const ethRef = useRef(null);
    const usdRef = useRef(null);
    const chartsRef = useRef({ eth: null, usd: null, tickets: null });

    const ethColors = generateColors(25);
    const usdColors = generateColors(25);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const newData = await topPayoutReportLoader({
                params: { startDate, endDate, offset, sort, jobType },
            });
            setPayoutData(newData);
        } catch (err) {
            console.error('Error fetching payoutData:', err);
            setError(err.message);
            setOpenSnackbar(true);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, offset, sort, jobType]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!payoutData) return;

        // Register ChartDataLabels plugin if needed
        Chart.register(ChartDataLabels);

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest', // Ensures tooltips hover correctly
                axis: 'xy', // Allow hover across both axes
                intersect: false, // Prevent tooltips from requiring direct bar intersection
            },
            plugins: {
                datalabels: { display: false }, // Disable datalabels globally
                legend: { position: 'top' },
                tooltip: {
                    mode: 'index',       // Group items by index
                    intersect: false,    // Trigger tooltip when hovering anywhere along the stack
                    callbacks: {
                        label: function(context) {
                            // Use context.parsed.x for horizontal bars
                            const label = context.dataset.label || '';
                            const value = context.parsed.x;
                            return `${label}: ${parseFloat(value).toFixed(4)}`; // Format to 4 decimal places
                        },
                        footer: function(tooltipItems) {
                            // Calculate total using parsed.x for horizontal bars
                            let total = 0;
                            tooltipItems.forEach((tooltipItem) => {
                                total += tooltipItem.parsed.x || 0;
                            });
                            return `Total: ${total.toFixed(4)}`; // Format to 4 decimal places
                        }
                    },
                    footerFont: { weight: 'bold' }
                }
            },
            scales: { y: { stacked: true, position: "top" } },
            indexAxis: 'y', // Horizontal bars
        };

        // ETH Chart Setup with Stacked "Orch Share" and "Delegates Share"
        if (ethRef.current && payoutData.eth) {
            const ethTakeHome = payoutData.eth.map(entry => entry.take_home_value);
            const ethTotal = payoutData.eth.map(entry => entry.total)
            const ethRest = ethTotal.map((t, idx) => t - ethTakeHome[idx] || 0.00);

            chartsRef.current.eth = new Chart(ethRef.current, {
                type: 'bar',
                data: {
                    labels: payoutData.eth.map(entry => entry.recipient_name),
                    datasets: [
                        {
                            label: 'Orch Share',
                            data: ethTakeHome,
                            backgroundColor: ethColors,
                            borderColor: ethColors.map(color => color.replace('0.6', '1')),
                            borderWidth: 1,
                            stack: 'Stack 0',
                        },
                        {
                            label: 'Delegates Share',
                            data: ethRest,
                            backgroundColor: ethColors.map(color => color.replace('0.6', '0.3')),
                            borderColor: ethColors.map(color => color.replace('0.6', '1')),
                            borderWidth: 1,
                            stack: 'Stack 0',
                        },
                    ],
                },
                options: {
                    ...commonOptions,
                    plugins: {
                        ...commonOptions.plugins,
                        title: { display: true, text: 'ETH Payouts' }
                    },
                },
            });
        }

        // USD Chart Setup with Stacked "Orch Share" and "Rest"
        if (usdRef.current && payoutData.usd) {
            const usdTakeHome = payoutData.usd.map(entry => entry.take_home_value);
            const usdTotal = payoutData.usd.map(entry => entry.total);
            const usdRest = usdTotal.map((t, idx) => t - usdTakeHome[idx] || 0.00);

            chartsRef.current.usd = new Chart(usdRef.current, {
                type: 'bar',
                data: {
                    labels: payoutData.usd.map(entry => entry.recipient_name),
                    datasets: [
                        {
                            label: 'Orch Share',
                            data: usdTakeHome,
                            backgroundColor: usdColors,
                            borderColor: usdColors.map(color => color.replace('0.6', '1')),
                            borderWidth: 1,
                            stack: 'Stack 0',
                        },
                        {
                            label: 'Delegates Share',
                            data: usdRest,
                            backgroundColor: usdColors.map(color => color.replace('0.6', '0.3')),
                            borderColor: usdColors.map(color => color.replace('0.6', '1')),
                            borderWidth: 1,
                            stack: 'Stack 0',
                        },
                    ],
                },
                options: {
                    ...commonOptions,
                    plugins: {
                        ...commonOptions.plugins,
                        title: { display: true, text: 'USD Payouts' }
                    },
                },
            });
        }

        return () => {
            Object.values(chartsRef.current).forEach((chart) => {
                if (chart) chart.destroy();
            });
        };
    }, [payoutData, ethColors, usdColors]);

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setOpenSnackbar(false);
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
            {/* Header */}
            <Typography variant="h4" align="center" gutterBottom>
                Top 25 Payout Report
            </Typography>

            {/* First Row: Date Selection */}
            <Grid container spacing={4} alignItems="center" justifyContent="center">
                {/* Description */}
                <Grid item xs={12} md={6}>
                    <Typography variant="body1" align="center">
                        The default report is a 7 day range. Select a start date or end date to change your chart data.
                    </Typography>
                </Grid>

                {/* Date Inputs */}
                <Grid item xs={12} md={6}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Start Date"
                                type="date"
                                id="start-date"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                fullWidth
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="End Date"
                                type="date"
                                id="end-date"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                fullWidth
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            {/* Spacer */}
            <Box my={4}/>

            {/* Second Row: Group and Sort Selection */}
            <Grid container spacing={4} alignItems="center" justifyContent="center">
                {/* Description */}
                <Grid item xs={12} md={6}>
                    <Typography variant="body1" align="center">
                        Choose which payout group you'd like to view. The default is first 25.
                    </Typography>
                </Grid>

                {/* Group and Sort Selects */}
                <Grid item xs={12} md={6}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel id="group-label">Group</InputLabel>
                                <Select
                                    labelId="group-label"
                                    id="offset"
                                    label="Group"
                                    value={offset}
                                    onChange={(e) => setOffset(e.target.value)}
                                >
                                    <MenuItem value="0">0 - 25</MenuItem>
                                    <MenuItem value="25">26 - 50</MenuItem>
                                    <MenuItem value="50">51 - 75</MenuItem>
                                    <MenuItem value="75">76 - 100</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel id="sort-label">Sort By</InputLabel>
                                <Select
                                    labelId="sort-label"
                                    id="sort"
                                    label="Sort By"
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value)}
                                >
                                    <MenuItem value="total">Total</MenuItem>
                                    <MenuItem value="take_home">Orch Share</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            {/* Spacer */}
            <Box my={4}/>

            {/* Third Row: Job Type Selection */}
            <Grid container spacing={4} alignItems="center" justifyContent="center">
                {/* Description */}
                <Grid item xs={12} md={6}>
                    <Typography variant="body1" align="center">
                        Choose which payout job type you'd like to view. The default is AI and Transcoding.
                    </Typography>
                </Grid>

                {/* Job Type Select */}
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel id="jobType-label">Job Type</InputLabel>
                        <Select
                            labelId="jobType-label"
                            id="jobType"
                            label="Job Type"
                            value={jobType}
                            onChange={(e) => setJobType(e.target.value)}
                        >
                            <MenuItem value="both">Both</MenuItem>
                            <MenuItem value="ai">AI</MenuItem>
                            <MenuItem value="transcoding">Transcoding</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            {/* Spacer */}
            <Box my={4}/>

            {/* Loading Indicator */}
            {loading && (
                <Box display="flex" justifyContent="center" my={2}>
                    <CircularProgress/>
                </Box>
            )}

            {/* Charts */}
            <Grid container spacing={4} justifyContent="center">
                {/* ETH Chart */}
                <Grid item xs={12} md={8}>
                    <Box
                        sx={{
                            width: '100%',
                            height: { xs: '400px', md: '600px' },
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                        }}
                    >
                        <canvas
                            id="eth"
                            ref={ethRef}
                            style={{ width: '100%', height: '100%' }}
                            aria-label="ETH Payouts Chart"
                            role="img"
                        ></canvas>
                    </Box>
                </Grid>

                {/* USD Chart */}
                <Grid item xs={12} md={8}>
                    <Box
                        sx={{
                            width: '100%',
                            height: { xs: '400px', md: '600px' },
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                        }}
                    >
                        <canvas
                            id="usd"
                            ref={usdRef}
                            style={{ width: '100%', height: '100%' }}
                            aria-label="USD Payouts Chart"
                            role="img"
                        ></canvas>
                    </Box>
                </Grid>
            </Grid>

            {/* Error Snackbar */}
            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default TopPayoutReport;
