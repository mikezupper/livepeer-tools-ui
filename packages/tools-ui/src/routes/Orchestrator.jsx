import {useLoaderData, useLocation, useNavigate} from 'react-router-dom';
import React, {useEffect, useRef, useState} from 'react';
import {
    Grid,
    Typography,
    Box,
    TextField,
    Button, Breadcrumbs, Link,
} from '@mui/material';
import Chart from 'chart.js/auto';
import moment from 'moment';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import OrchestratorDetails from "./OrchestratorDetails.jsx";
import { livepeerApiBaseUrl } from "../config.js";
import {generateColors} from "./chartUtils.js";

/**
 * Utility function to build data points from an iterator.
 * @param {Iterator} iterator - The iterator to process.
 * @param {Function} mapFn - The mapping function to apply to each iterator result.
 * @returns {Array} - The array of processed data points.
 */
const buildDatapoints = (iterator, mapFn) => {
    const dataPoints = [];
    let result = iterator.next();
    while (!result.done) {
        dataPoints.push(mapFn(result));
        result = iterator.next();
    }
    return dataPoints;
};


/**
 * Orchestrator Component
 * @returns {JSX.Element} The rendered component.
 */
function Orchestrator() {
    const { orchestrator } = useLoaderData();
    const navigate= useNavigate()

    const location = useLocation();
    const isOnDetailsPage = location.pathname === `/orchestrator/${orchestrator.eth_address}`;

    // Refs for Chart.js canvases
    const payoutsRef = useRef(null);
    const payoutsUsdRef = useRef(null);

    // Chart instances
    const payoutsChartRef = useRef(null);
    const payoutsUsdChartRef = useRef(null);

    // Generate separate colors for each chart
    const backgroundColor = generateColors(25);

    // Calculate last year's start and end dates
    const lastYearStart = moment().subtract(1, 'years').startOf('year').format('YYYY-MM-DD');
    const lastYearEnd = moment().subtract(1, 'years').endOf('year').format('YYYY-MM-DD');

    // State for Reward CSV form
    const [rewardStartDate, setRewardStartDate] = useState(lastYearStart);
    const [rewardEndDate, setRewardEndDate] = useState(lastYearEnd);
    const [isRewardDownloading, setIsRewardDownloading] = useState(false);

    // State for Tickets CSV form
    const [ticketsStartDate, setTicketsStartDate] = useState(lastYearStart);
    const [ticketsEndDate, setTicketsEndDate] = useState(lastYearEnd);
    const [isTicketsDownloading, setIsTicketsDownloading] = useState(false);


    /**
     * Initializes all charts: ETH Payouts, USD Payouts.
     */
    const initializeCharts = () => {
        // Register Chart.js plugins
        Chart.register(ChartDataLabels);

        const config = {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Orch Share',
                        data: [],
                        fill: false,
                        backgroundColor,
                        borderColor: backgroundColor.map(color => color.replace('0.6', '1')),
                        borderWidth: 1,
                        stack: 'Stack 0'
                    },
                    {
                        label: 'Delegates Share',
                        data: [],
                        fill: false,
                        backgroundColor: backgroundColor.map(color => color.replace('0.6', '0.3')),
                        borderColor: backgroundColor.map(color => color.replace('0.6', '1')),
                        borderWidth: 1,
                        stack: 'Stack 0'
                    },
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Payout History'
                    },
                    datalabels: {
                        display: false, // Disable data labels globally
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return label + ': ' + parseFloat(value).toFixed(2);
                            },
                            footer: function(tooltipItems) {
                                let total = 0;
                                tooltipItems.forEach((tooltipItem) => {
                                    total += tooltipItem.parsed.y || 0;
                                });
                                return 'Total: ' + total.toFixed(2);
                            }
                        },
                        footerFont: { weight: 'bold' }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: {
                        stacked: true,
                    },
                }
            },
        };
        // Initialize ETH Payouts Chart
        if (payoutsRef.current) {
            payoutsChartRef.current = new Chart(payoutsRef.current, config);
        }

        // Initialize USD Payouts Chart
        if (payoutsUsdRef.current) {
            payoutsUsdChartRef.current = new Chart(payoutsUsdRef.current, config);
        }
    };

    /**
     * Updates the payouts and payouts USD charts with fetched data.
     * @param {Array} data - The fetched payout data.
     */
    const updatePayoutCharts = (data) => {
        const payouts = payoutsChartRef.current;
        const payoutsUsd = payoutsUsdChartRef.current;

        if (!payouts || !payoutsUsd) return;

        // Maps to aggregate data by month
        const months = new Map();
        const months_usd = new Map();

        const months_take_home = new Map();
        const months_usd_take_home = new Map();

        data.forEach(row => {
            const month = moment(row.last_event_timestamp).format("MMMM YYYY");

            // Initialize maps if month not present
            if (!months.has(month)) {
                months.set(month, 0.0);
                months_usd.set(month, 0.0);
                months_take_home.set(month, 0.0);
                months_usd_take_home.set(month, 0.0);
            }

            // Aggregate total payouts
            months.set(month, parseFloat(row.face_value) + months.get(month));
            months_usd.set(month, parseFloat(row.face_value_usd) + months_usd.get(month));

            // Aggregate Orch Share (take home)
            months_take_home.set(month, parseFloat(row.orch_commission) + months_take_home.get(month));
            months_usd_take_home.set(month, parseFloat(row.orch_commission_usd) + months_usd_take_home.get(month));
        });

        // Build labels and data points
        const labels = buildDatapoints(months.keys(), iterator => iterator.value);
        const dataPointsTotal = buildDatapoints(months.values(), iterator => iterator.value);
        const dataPointsTakeHome = buildDatapoints(months_take_home.values(), iterator => iterator.value);

        const dataPointsUsdTotal = buildDatapoints(months_usd.values(), iterator => iterator.value);
        const dataPointsUsdTakeHome = buildDatapoints(months_usd_take_home.values(), iterator => iterator.value);

        // Calculate differences for "Rest" portion
        const dataPointsDiff = dataPointsTotal.map((totalVal, idx) => {
            const shareVal = dataPointsTakeHome[idx] || 0;
            return totalVal - shareVal;
        });

        const dataPointsUsdDiff = dataPointsUsdTotal.map((totalVal, idx) => {
            const shareVal = dataPointsUsdTakeHome[idx] || 0;
            return totalVal - shareVal;
        });

        // Update ETH Payouts Chart with stacked portions: Orch Share and Rest
        payouts.data.labels = labels;
        payouts.data.datasets[0].data = dataPointsTakeHome;
        payouts.data.datasets[1].data = dataPointsDiff;
        payouts.update();

        // Update USD Payouts Chart similarly
        payoutsUsd.data.labels = labels;
        payoutsUsd.data.datasets[0].data = dataPointsUsdTakeHome;
        payoutsUsd.data.datasets[1].data = dataPointsUsdDiff;
        payoutsUsd.update();
    };

    /**
     * Fetches orchestrator payouts data from the API.
     * @param {string} ethAddress - The Ethereum address of the orchestrator.
     */
    const fetchOrchestratorPayouts = async (ethAddress) => {
        const start = moment().subtract(5, 'years').format('YYYY-MM-DD');
        const end = moment().format('YYYY-MM-DD');
        const offset = 0;
        const sort = "total"; // Adjust as needed
        const jobType = "both"; // Adjust as needed

        try {
            const response = await fetch(`${livepeerApiBaseUrl}/payout/orchestrator/${ethAddress}`, {
                headers: {
                    'Content-Type': "application/json",
                },
                method: "POST",
                body: JSON.stringify({ start, end, offset, eth_address: ethAddress, sort, jobType }),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const json = await response.json();
            updatePayoutCharts(json);
        } catch (error) {
            console.error("Failed to fetch orchestrator payouts:", error);
        }
    };

    // Initialize charts once when component mounts
    useEffect(() => {
        initializeCharts();

        // Cleanup function to destroy charts on unmount
        return () => {
            if (payoutsChartRef.current) payoutsChartRef.current.destroy();
            if (payoutsUsdChartRef.current) payoutsUsdChartRef.current.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch data when orchestrator changes
    useEffect(() => {
        if (orchestrator && orchestrator.eth_address) {
            fetchOrchestratorPayouts(orchestrator.eth_address);
        }
    }, [orchestrator]);

    /**
     * Handles the download of Reward CSV.
     * @param {Event} e - The form submission event.
     */
    const handleRewardDownload = async (e) => {
        e.preventDefault();
        setIsRewardDownloading(true);
        const formData = new URLSearchParams();
        formData.append("start",rewardStartDate)
        formData.append("end",rewardEndDate)
        formData.append("eth_address",orchestrator.eth_address)
        try {
            const response = await fetch(`${livepeerApiBaseUrl}/report/reward/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            // Assuming the server sets the filename in the Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            let fileName = 'rewards.csv';
            if (contentDisposition && contentDisposition.includes('filename=')) {
                fileName = contentDisposition.split('filename=')[1].split(';')[0].replace(/"/g, '');
            }
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Failed to download Reward CSV:", error);
        } finally {
            setIsRewardDownloading(false);
        }
    };

    /**
     * Handles the download of Tickets CSV.
     * @param {Event} e - The form submission event.
     */
    const handleTicketsDownload = async (e) => {
        e.preventDefault();
        setIsTicketsDownloading(true);

        const formData = new URLSearchParams();
        formData.append("start",ticketsStartDate)
        formData.append("end",ticketsEndDate)
        formData.append("eth_address",orchestrator.eth_address)

        try {

            const response = await fetch(`${livepeerApiBaseUrl}/report/ticket/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            // Assuming the server sets the filename in the Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            let fileName = 'tickets.csv';
            if (contentDisposition && contentDisposition.includes('filename=')) {
                fileName = contentDisposition.split('filename=')[1].split(';')[0].replace(/"/g, '');
            }
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Failed to download Tickets CSV:", error);
        } finally {
            setIsTicketsDownloading(false);
        }
    };

    return (
        <Box sx={{ py: 4 }}>
            {/* Breadcrumb for navigating back */}
            {isOnDetailsPage && (
                <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
                    <Link
                        underline="hover"
                        color="inherit"
                        onClick={() => navigate('/orchestrators')} // Navigate to the orchestrator list
                        style={{ cursor: 'pointer' }}
                    >
                        Orchestrator List
                    </Link>
                    <Typography color="textPrimary">{orchestrator.name}</Typography>
                </Breadcrumbs>
            )}
            <Grid container spacing={4}>
                <OrchestratorDetails orch={orchestrator} key={orchestrator.eth_address} />

                <Grid item xs={12} md={4}>
                    <Box
                        sx={{
                            border: '1px solid #ccc',
                            borderRadius: 2,
                            padding: 2,
                            height: '100%',
                        }}
                    >
                        <Typography variant="body1" gutterBottom>
                            Download a CSV file of all your Orchestrator Reward Calls!
                        </Typography>
                        <form onSubmit={handleRewardDownload}>
                            <TextField
                                label="Start Date"
                                type="date"
                                id="reward-start"
                                name="start"
                                value={rewardStartDate}
                                onChange={(e) => setRewardStartDate(e.target.value)}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                fullWidth
                                margin="normal"
                                required
                            />
                            <TextField
                                label="End Date"
                                type="date"
                                id="reward-end"
                                name="end"
                                value={rewardEndDate}
                                onChange={(e) => setRewardEndDate(e.target.value)}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                fullWidth
                                margin="normal"
                                required
                            />
                            <input
                                type="hidden"
                                id="reward-eth_address"
                                name="eth_address"
                                value={orchestrator.eth_address}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                sx={{ mt: 2 }}
                                disabled={isRewardDownloading}
                            >
                                {isRewardDownloading ? 'Downloading...' : 'Download CSV'}
                            </Button>
                        </form>
                    </Box>
                </Grid>

                {/* Third Column: Download Tickets CSV */}
                <Grid item xs={12} md={4}>
                    <Box
                        sx={{
                            border: '1px solid #ccc',
                            borderRadius: 2,
                            padding: 2,
                            height: '100%',
                        }}
                    >
                        <Typography variant="body1" gutterBottom>
                            Download a CSV file of all your Orchestrator Redeemed Tickets!
                        </Typography>
                        <form onSubmit={handleTicketsDownload}>
                            <TextField
                                label="Start Date"
                                type="date"
                                id="tickets-start"
                                name="start"
                                value={ticketsStartDate}
                                onChange={(e) => setTicketsStartDate(e.target.value)}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                fullWidth
                                margin="normal"
                                required
                            />
                            <TextField
                                label="End Date"
                                type="date"
                                id="tickets-end"
                                name="end"
                                value={ticketsEndDate}
                                onChange={(e) => setTicketsEndDate(e.target.value)}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                fullWidth
                                margin="normal"
                                required
                            />
                            <input
                                type="hidden"
                                id="tickets-eth_address"
                                name="eth_address"
                                value={orchestrator.eth_address}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                sx={{ mt: 2 }}
                                disabled={isTicketsDownloading}
                            >
                                {isTicketsDownloading ? 'Downloading...' : 'Download CSV'}
                            </Button>
                        </form>
                    </Box>
                </Grid>

                {/* Charts Section */}
                <Grid container spacing={4} sx={{ mt: 4 }}>
                    {/* ETH Payouts Chart */}
                    <Grid item xs={12}>
                        <canvas ref={payoutsRef}></canvas>
                    </Grid>
                    {/* USD Payouts Chart */}
                    <Grid item xs={12}>
                        <canvas ref={payoutsUsdRef}></canvas>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
}

export default Orchestrator;
