// PayoutSummaryReport.jsx

import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Grid,
    Box,
    Paper,
} from '@mui/material';
import {useLoaderData, useParams} from "react-router-dom";
import SimpleDateInput from './SimpleDateInput';
import DateNavigation from './DateNavigation';
import {DataGrid} from '@mui/x-data-grid';

// Main Component
const PayoutSummaryReport = ({report_type}) => {
    const {date} = useParams();
    const payoutData = useLoaderData();

    if (!payoutData) {
        return (
            <Box p={4}>
                <Typography variant="h6" color="error">
                    No payout data available for the selected date.
                </Typography>
                <SimpleDateInput/>
            </Box>
        );
    }

    const {
        total_ticket,
        total_orchs,
        total_eth,
        total_usd,
        total_orch_commission_eth,
        total_orch_commission_usd,
        orch_summaries,
    } = payoutData;

    // Define columns for DataGrid
    const columns = [
        {
            field: 'rank', headerName: 'Rank', flex: 1,
            sortable: true, maxWidth: 56
        },
        {
            field: 'orch', headerName: 'Orchestrator', flex: 1,
            sortable: false
        },
        {
            field: 'orch_total_ticket',
            headerName: 'Tix',
            type: 'number',
            flex: 1,
            sortable: true, maxWidth: 50
        },
        {
            field: 'orch_total_eth',
            headerName: 'Total',
            type: 'number',
            flex: 1,
            sortable: true,
            valueFormatter: (params) => `${params.toFixed(4)}`,
        },
        {
            field: 'orch_total_usd',
            headerName: 'Total (USD)',
            type: 'number',
            flex: 1,
            sortable: true,
            valueFormatter: (params) => `$${params.toFixed(2)}`,
        },
        {
            field: 'orch_total_percent',
            headerName: 'Total (%)',
            type: 'number',
            flex: 1,
            sortable: true,
            valueFormatter: (params) => `${params.toFixed(2)}%`,
        },
        {
            field: 'orch_total_commission_eth',
            headerName: 'Commission',
            type: 'number',
            flex: 1,
            sortable: true,
            valueFormatter: (params) => `${params.toFixed(4)}`,
        },
        {
            field: 'orch_total_commission_percent',
            headerName: 'Commission (%)',
            type: 'number',
            flex: 1,
            sortable: true,
            valueFormatter: (params) => `${params.toFixed(2)}%`,
        },
        {
            field: 'orch_total_commission_usd',
            headerName: 'Commission (USD)',
            type: 'number',
            flex: 1,
            sortable: true,
            valueFormatter: (params) => `$${params.toFixed(2)}`,
        },
    ];

    // Prepare rows for DataGrid, ensuring each row has a unique id
    const rows = orch_summaries.map((orch, index) => ({
        id: index,
        rank: index + 1,
        ...orch,
    }));

    return (
        <Box p={4}>
            <Typography variant="h4" gutterBottom>
                {report_type} Summary Report: {date}
            </Typography>

            <SimpleDateInput initialDate={date} />

            <Grid container spacing={3}>
                {/* Totals Card */}
                <Grid item xs={12} md={4}>
                    <Card style={{ marginTop: '20px' }}>
                        <CardContent>
                            <Typography variant="subtitle1">Number of Winning Tickets</Typography>
                            <Typography variant="h6">{total_ticket}</Typography>
                            <Typography variant="subtitle1" style={{ marginTop: '10px' }}>Number of Orchestrators Earned</Typography>
                            <Typography variant="h6">{total_orchs}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* USD Totals Card */}
                <Grid item xs={12} md={4}>
                    <Card style={{ marginTop: '20px' }}>
                        <CardContent>
                            <Typography variant="subtitle1">Transcoding Fees (USD)</Typography>
                            <Typography variant="h6">${total_usd.toFixed(2)}</Typography>
                            <Typography variant="subtitle1" style={{ marginTop: '10px' }}>Orch Commission (USD)</Typography>
                            <Typography variant="h6">${total_orch_commission_usd.toFixed(2)}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* ETH Totals Card */}
                <Grid item xs={12} md={4}>
                    <Card style={{ marginTop: '20px' }}>
                        <CardContent>
                            <Typography variant="subtitle1">Transcoding Fees (ETH)</Typography>
                            <Typography variant="h6">{total_eth.toFixed(4)} ETH</Typography>
                            <Typography variant="subtitle1" style={{ marginTop: '10px' }}>Orch Commission (ETH)</Typography>
                            <Typography variant="h6">{total_orch_commission_eth.toFixed(4)} ETH</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>



            <Typography variant="h5" gutterBottom style={{ marginTop: '30px' }}>
                Orchestrator Payout Details
            </Typography>

            <Paper style={{ width: '100%' }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        flexGrow: 1,
                        minHeight: 0,
                    }}
                >
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        rowsPerPageOptions={[25, 50, { value: -1, label: 'All' }]}
                        sx={{
                            flexGrow: 1,
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: '#f5f5f5',
                            },
                        }}
                    />
                </Box>
            </Paper>

            <DateNavigation currentDate={date} />
        </Box>
    );
};

export default PayoutSummaryReport;
