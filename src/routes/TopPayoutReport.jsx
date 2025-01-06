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
import moment from 'moment';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {generateColors} from "./chartUtils.js";
import {API_BASE_URL} from "../config.js";

/**
 * TopPayoutReport Component
 * Renders a report with interactive charts for ETH, USD, and Tickets payouts.
 * Utilizes Material-UI for layout and styling, and Chart.js for data visualization.
 */
const TopPayoutReport = () => {
    // State variables for form inputs
    const [startDate, setStartDate] = useState(moment().subtract(7, 'days').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));
    const [offset, setOffset] = useState('0');
    const [sort, setSort] = useState('total');
    const [jobType, setJobType] = useState('both');

    // Refs for canvas elements
    const ethRef = useRef(null);
    const usdRef = useRef(null);
    const ticketsRef = useRef(null);

    // Chart instances stored in refs
    const chartsRef = useRef({
        eth: null,
        usd: null,
        tickets: null,
    });

    // State for loading and error
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Snackbar state
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const ethColors = generateColors(25); // Assuming top 25 entries
    const usdColors = generateColors(25);
    const ticketsColors = ['rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)']; // Two distinct colors

    /**
     * Fetches payout data from the API and updates the charts.
     */
    const fetchAndUpdateCharts = useCallback(
        async () => {
            setLoading(true);
            const body = { start: startDate, end: endDate, offset: parseInt(offset), sort, jobType };
            try {
                const response = await fetch(`${API_BASE_URL}/api/payout/report`, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    method: 'POST',
                    body: JSON.stringify(body),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const json = await response.json();
                updateCharts(json);
            } catch (error) {
                console.error('Error fetching payout report:', error);
                setError(error.message);
                setOpenSnackbar(true);
            } finally {
                setLoading(false);
            }
        },
        [startDate, endDate, offset, sort, jobType]
    );

    /**
     * Initializes all charts on component mount.
     */
    useEffect(() => {
        // Register Chart.js plugins
        Chart.register(ChartDataLabels);

        // Common chart options
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false, // Allows the chart to fill its container
            plugins: {
                datalabels: {
                    display: false, // Disable data labels
                },
                legend: {
                    position: 'bottom',
                },
            },
            scales: {
                y: {
                    stacked: true,
                    position: "top",
                    // beginAtZero: true,
                }
            },
            indexAxis: 'y', // Makes the chart horizontal
        };

        // Initialize ETH Chart
        if (ethRef.current) {
            chartsRef.current.eth = new Chart(ethRef.current, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'ETH Total',
                            data: [],
                            backgroundColor: ethColors,
                            borderColor: ethColors.map(color => color.replace('0.6', '1')),
                            borderWidth: 1,
                        },
                        {
                            label: 'Orch Share',
                            data: [],
                            backgroundColor: ethColors.map(color => color.replace('0.6', '0.3')), // Lighter color
                            borderColor: ethColors.map(color => color.replace('0.6', '1')),
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    ...commonOptions,
                    plugins: {
                        ...commonOptions.plugins,
                        title: {
                            display: true,
                            text: 'ETH Payouts',
                        },
                    },
                },
            });
        }

        // Initialize USD Chart
        if (usdRef.current) {
            chartsRef.current.usd = new Chart(usdRef.current, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'USD Total',
                            data: [],
                            backgroundColor: usdColors,
                            borderColor: usdColors.map(color => color.replace('0.6', '1')),
                            borderWidth: 1,
                        },
                        {
                            label: 'Orch Share',
                            data: [],
                            backgroundColor: usdColors.map(color => color.replace('0.6', '0.3')), // Lighter color
                            borderColor: usdColors.map(color => color.replace('0.6', '1')),
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    ...commonOptions,
                    plugins: {
                        ...commonOptions.plugins,
                        title: {
                            display: true,
                            text: 'USD Payouts',
                        },
                    },
                },
            });
        }

        // Initialize Tickets Chart
        if (ticketsRef.current) {
            chartsRef.current.tickets = new Chart(ticketsRef.current, {
                type: 'bar',
                data: {
                    labels: ['USD', '# of Tickets'],
                    datasets: [
                        {
                            label: '# of Payouts',
                            data: [0, 0],
                            backgroundColor: ticketsColors,
                            borderColor: ticketsColors.map(color => color.replace('0.6', '1')),
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    ...commonOptions,
                    plugins: {
                        ...commonOptions.plugins,
                        title: {
                            display: true,
                            text: 'Tickets Payouts',
                        },
                    },
                    indexAxis: 'y', // Makes the chart horizontal
                },
            });
        }

        // Fetch initial data
        fetchAndUpdateCharts();

        // Cleanup function to destroy charts on unmount
        return () => {
            Object.values(chartsRef.current).forEach((chart) => {
                if (chart) chart.destroy();
            });
        };
    }, [fetchAndUpdateCharts, ethColors, usdColors, ticketsColors]);

    /**
     * Fetches and updates charts whenever form inputs change.
     */
    useEffect(() => {
        fetchAndUpdateCharts();
    }, [fetchAndUpdateCharts]);

    /**
     * Updates all charts with the fetched JSON data.
     * @param {Object} json - The JSON data returned from the API.
     */
    const updateCharts = (json) => {
        // Update USD Chart
        if (chartsRef.current.usd) {
            chartsRef.current.usd.data.labels = json.usd.map((entry) => entry.recipient_name);
            chartsRef.current.usd.data.datasets[0].data = json.usd.map((entry) => entry.value);
            chartsRef.current.usd.data.datasets[1].data = json.usd.map((entry) => entry.take_home_value);
            chartsRef.current.usd.update();
        }

        // Update ETH Chart
        if (chartsRef.current.eth) {
            chartsRef.current.eth.data.labels = json.eth.map((entry) => entry.recipient_name);
            chartsRef.current.eth.data.datasets[0].data = json.eth.map((entry) => entry.value);
            chartsRef.current.eth.data.datasets[1].data = json.eth.map((entry) => entry.take_home_value);
            chartsRef.current.eth.update();
        }

        // Update Tickets Chart
        if (chartsRef.current.tickets) {
            chartsRef.current.tickets.data.datasets[0].data = [
                json.usd.length > 0 ? json.usd[0].value : 0,
                json.tickets.length > 0 ? json.tickets[0].value : 0,
            ];
            chartsRef.current.tickets.data.datasets[0].label = `ETH ${
                json.eth.length > 0 ? json.eth[0].value : 0
            } Total`;
            chartsRef.current.tickets.update();
        }
    };

    /**
     * Handles closing the Snackbar.
     * @param {Object} event - The event source of the callback.
     * @param {string} reason - The reason for the callback.
     */
    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
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
                            height: {xs: '400px', md: '600px'}, // Responsive height
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
                            style={{width: '100%', height: '100%'}}
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
                            height: {xs: '400px', md: '600px'}, // Responsive height
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
                            style={{width: '100%', height: '100%'}}
                            aria-label="USD Payouts Chart"
                            role="img"
                        ></canvas>
                    </Box>
                </Grid>

                {/* Tickets Chart */}
                <Grid item xs={12} md={8}>
                    <Box
                        sx={{
                            width: '100%',
                            height: {xs: '400px', md: '600px'}, // Responsive height
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                        }}
                    >
                        <canvas
                            id="tickets"
                            ref={ticketsRef}
                            style={{width: '100%', height: '100%'}}
                            aria-label="Tickets Payouts Chart"
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
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
            >
                <Alert onClose={handleCloseSnackbar} severity="error" sx={{width: '100%'}}>
                    {error}
                </Alert>
            </Snackbar>
        </Container>)
}

export default TopPayoutReport;
