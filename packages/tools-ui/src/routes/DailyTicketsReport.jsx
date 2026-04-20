import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import moment from 'moment';

Chart.register(ChartDataLabels);

import { useLoaderData } from 'react-router-dom';
import { dailyTicketsReportLoader } from '../loaders/index.js';

const MAX_SPAN_DAYS = 730;

const AI_COLOR = 'rgba(75, 192, 192, 1)';
const TRANSCODING_COLOR = 'rgba(153, 102, 255, 1)';

function resolveGranularity(granularity, spanDays) {
    if (granularity !== 'auto') return granularity;
    if (spanDays == null || spanDays <= 90) return 'daily';
    if (spanDays <= 540) return 'weekly';
    return 'monthly';
}

function bucketKey(dateStr, granularity) {
    if (granularity === 'weekly') return moment(dateStr).startOf('isoWeek').format('YYYY-MM-DD');
    if (granularity === 'monthly') return moment(dateStr).format('YYYY-MM');
    return dateStr;
}

function aggregateSeries(series, granularity) {
    if (!series || granularity === 'daily') return series || [];
    const sums = new Map();
    for (const { date, count } of series) {
        const key = bucketKey(date, granularity);
        sums.set(key, (sums.get(key) || 0) + count);
    }
    return Array.from(sums.entries())
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([date, count]) => ({ date, count }));
}

const DailyTicketsReport = () => {
    const initialData = useLoaderData();

    const [startDate, setStartDate] = useState(
        moment().subtract(30, 'days').format('YYYY-MM-DD')
    );
    const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));
    const [jobType, setJobType] = useState('both');
    const [granularity, setGranularity] = useState('auto');

    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    const spanDays = useMemo(() => {
        const s = moment(startDate, 'YYYY-MM-DD', true);
        const e = moment(endDate, 'YYYY-MM-DD', true);
        if (!s.isValid() || !e.isValid() || e.isBefore(s)) return null;
        return e.diff(s, 'days') + 1;
    }, [startDate, endDate]);

    const rangeWarning = useMemo(() => {
        if (spanDays === null) return 'Please select a valid date range (end on or after start).';
        if (spanDays > MAX_SPAN_DAYS) {
            return `Selected range is ${spanDays} days. Please narrow it to ${MAX_SPAN_DAYS} days or fewer before loading.`;
        }
        return null;
    }, [spanDays]);

    const fetchData = useCallback(async () => {
        if (rangeWarning) return;
        setLoading(true);
        setError(null);
        try {
            const result = await dailyTicketsReportLoader({
                params: { startDate, endDate, jobType },
            });
            setData(result);
        } catch (err) {
            console.error('Error fetching daily ticket counts:', err);
            setError(err.message || 'Failed to load daily ticket counts.');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, jobType, rangeWarning]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const effectiveGranularity = useMemo(
        () => resolveGranularity(granularity, spanDays),
        [granularity, spanDays]
    );

    useEffect(() => {
        if (!chartRef.current || !data) return;

        const ai = aggregateSeries(data.ai, effectiveGranularity);
        const transcoding = aggregateSeries(data.transcoding, effectiveGranularity);

        const labels = (ai.length > 0 ? ai : transcoding).map((d) => d.date);

        const datasets = [];
        if (ai.length > 0) {
            datasets.push({
                label: 'AI',
                data: ai.map((d) => d.count),
                borderColor: AI_COLOR,
                backgroundColor: AI_COLOR,
                cubicInterpolationMode: 'monotone',
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 7,
            });
        }
        if (transcoding.length > 0) {
            datasets.push({
                label: 'Transcoding',
                data: transcoding.map((d) => d.count),
                borderColor: TRANSCODING_COLOR,
                backgroundColor: TRANSCODING_COLOR,
                cubicInterpolationMode: 'monotone',
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 7,
            });
        }

        chartInstanceRef.current = new Chart(chartRef.current, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    datalabels: { display: false },
                    legend: { position: 'top' },
                    title: {
                        display: true,
                        text: `Winning Tickets — ${effectiveGranularity === 'daily' ? 'Daily' : effectiveGranularity === 'weekly' ? 'Weekly (ISO week, starts Mon)' : 'Monthly'}`,
                    },
                    tooltip: {
                        callbacks: {
                            footer: (items) => {
                                const total = items.reduce((acc, it) => acc + (it.parsed.y || 0), 0);
                                return `Total: ${total}`;
                            },
                        },
                        footerFont: { weight: 'bold' },
                    },
                },
                scales: {
                    x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: effectiveGranularity === 'daily' ? 'Tickets / day' : effectiveGranularity === 'weekly' ? 'Tickets / week' : 'Tickets / month',
                        },
                    },
                },
            },
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, [data, effectiveGranularity]);

    const handleCloseSnackbar = (_event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbarOpen(false);
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
            <Typography variant="h4" align="center" gutterBottom>
                Daily Winning Tickets Trend
            </Typography>

            <Grid container spacing={4} alignItems="center" justifyContent="center">
                <Grid item xs={12} md={6}>
                    <Typography variant="body1" align="center">
                        Daily count of winning tickets, split by job type. Default range is the last
                        30 days. Maximum span is {MAX_SPAN_DAYS} days.
                    </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Start Date"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="End Date"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            <Box my={3} />

            <Grid container spacing={4} alignItems="center" justifyContent="center">
                <Grid item xs={12} md={6}>
                    <Typography variant="body1" align="center">
                        Choose a job type and granularity. "Auto" picks daily for short ranges,
                        weekly for medium ranges, and monthly for long ranges.
                    </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
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
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel id="granularity-label">Granularity</InputLabel>
                                <Select
                                    labelId="granularity-label"
                                    id="granularity"
                                    label="Granularity"
                                    value={granularity}
                                    onChange={(e) => setGranularity(e.target.value)}
                                >
                                    <MenuItem value="auto">
                                        Auto ({effectiveGranularity})
                                    </MenuItem>
                                    <MenuItem value="daily">Daily</MenuItem>
                                    <MenuItem value="weekly">Weekly</MenuItem>
                                    <MenuItem value="monthly">Monthly</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            <Box my={3} />

            {rangeWarning && (
                <Box display="flex" justifyContent="center" mb={2}>
                    <Alert severity="warning" sx={{ width: '100%', maxWidth: 720 }}>
                        {rangeWarning}
                    </Alert>
                </Box>
            )}

            {loading && (
                <Box display="flex" justifyContent="center" my={2}>
                    <CircularProgress />
                </Box>
            )}

            <Grid container spacing={4} justifyContent="center">
                <Grid item xs={12} md={10}>
                    <Box
                        sx={{
                            width: '100%',
                            height: { xs: '400px', md: '560px' },
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            position: 'relative',
                            p: 1,
                        }}
                    >
                        <canvas
                            ref={chartRef}
                            aria-label="Daily Winning Tickets Chart"
                            role="img"
                        />
                    </Box>
                </Grid>
            </Grid>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity="error"
                    sx={{ width: '100%' }}
                >
                    {error}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default DailyTicketsReport;
