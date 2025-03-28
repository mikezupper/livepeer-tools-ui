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
import {useLoaderData, useLocation, useParams} from "react-router-dom";
import SimpleDateInput from './SimpleDateInput';
import DateNavigation from './DateNavigation';
import {DataGrid} from '@mui/x-data-grid';

// Main Component
const PayoutSummaryReport = ({report_type}) => {
    const { date } = useParams();
    const location = useLocation();
    const payoutData = useLoaderData();

    // Get job_type from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const jobType = queryParams.get('job_type') || 'both';
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
        total_orch_commission_eth,
        total_usd,
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
            sortable: false,
        },
        {
            field: 'orch_total_ticket',
            headerName: 'Tickets Won',
            type: 'number',
            flex: 1,
            sortable: true,
        },
        {
            field: 'orch_total_eth',
            headerName: 'Total (ETH)',
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
            headerName: 'Commission (ETH)',
            type: 'number',
            flex: 1,
            sortable: true,
            valueFormatter: (params) => `${params.toFixed(4)}`,
        },
        {
            field: 'orch_total_commission_usd',
            headerName: 'Commission (USD)',
            type: 'number',
            flex: 1,
            sortable: true,
            valueFormatter: (params) => `$${params.toFixed(2)}`,
        },
        {
            field: 'orch_total_commission_percent',
            headerName: 'Commission (%)',
            type: 'number',
            flex: 1,
            sortable: true,
            valueFormatter: (params) => `${params.toFixed(2)}%`,
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
                {report_type} Summary Report: {date} ({jobType === 'both' ? 'All Jobs' : jobType === 'ai' ? 'AI' : 'Transcoding'})
            </Typography>

            <SimpleDateInput initialDate={date}/>

            <Card style={{marginTop: '20px'}}>
                <CardContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}  align={"center"}>
                            <Typography variant="subtitle1" align={"center"}>Number of Winning Tickets</Typography>
                            <Typography variant="h6" align={"center"}>{total_ticket}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle1" align={"center"}>Number of Orchestrators Earned</Typography>
                            <Typography variant="h6" align={"center"}>{total_orchs}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle1" align={"center"}>Transcoding Fees</Typography>
                            <Typography variant="h6" align={"center"}>
                                {total_eth.toFixed(4)} ETH
                            </Typography>
                            <Typography variant="subtitle2" align={"center"}>
                                ${total_usd.toFixed(2)} USD
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle1" align={"center"}>Orch Commission</Typography>
                            <Typography variant="h6" align={"center"}>
                                {total_orch_commission_eth.toFixed(4)} ETH
                            </Typography>
                            <Typography variant="subtitle2" align={"center"}>
                                ${total_orch_commission_usd.toFixed(2)} USD
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Typography variant="h5" gutterBottom style={{marginTop: '30px'}}>
                Orchestrator Payout Details
            </Typography>

            <Paper style={{ width: '100%' }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        flexGrow: 1,
                        minHeight: 0, // Ensures the box can shrink if needed
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

            {/* Optional: Date Navigation Buttons */}
            <DateNavigation currentDate={date}/>
        </Box>
    );
};

export default PayoutSummaryReport;
