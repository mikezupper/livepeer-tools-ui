import { useLoaderData } from 'react-router-dom';
import React, {useEffect, useRef, useState} from 'react';
import {
    Grid,
    Typography,
    Box,
    TextField,
    Button, Paper,
} from '@mui/material';
import Chart from 'chart.js/auto';
import moment from 'moment';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import OrchestratorDetails from "./OrchestratorDetails.jsx";
import { API_BASE_URL } from "../config.js";
import {generateColors} from "./chartUtils.js";
import GatewayDetails from "./GatewayDetails.jsx";
import {DataGrid} from "@mui/x-data-grid";

/**
 * Orchestrator Component
 * @returns {JSX.Element} The rendered component.
 */
function Gateway() {
    const { gateway, payouts,payout_params } = useLoaderData();
    let latestPayoutDetails = null;
    if (payouts) {
        const columns = [
            // Text-based column: Left alignment for text
            {
                field: 'name',
                headerName: 'Orchestrator',
                sortable: false,
                flex: 1,
                minWidth: 150, // Added minWidth
                // headerAlign and align are 'left' by default, which is good for text
            },
            // Numeric Columns: Right alignment for numbers and currency
            {
                field: 'total_value',
                headerName: 'Total (ETH)',
                type: 'number',
                sortable: false,
                flex: 1,
                minWidth: 120, // Added minWidth
                headerAlign: 'right', // Align header to the right
                align: 'right', // Align data to the right
                valueFormatter: (params) => `${params?.toFixed(4)}`, // Added safe navigation for consistency
            },
            {
                field: 'total_value_usd',
                headerName: 'Total (USD)',
                type: 'number',
                sortable: false,
                flex: 1,
                minWidth: 120, // Added minWidth
                headerAlign: 'right', // Align header to the right
                align: 'right', // Align data to the right
                valueFormatter: (params) => `$${params?.toFixed(2)}`,
            },
            {
                field: 'fee_cut',
                headerName: 'Commission (%)',
                type: 'number',
                sortable: false,
                flex: 1,
                minWidth: 130, // Added minWidth
                headerAlign: 'right', // Align header to the right
                align: 'right', // Align data to the right
                valueFormatter: (params) => `${(params * 100).toFixed(2)}%`,
            },
            {
                field: 'orch_commission',
                headerName: 'Commission (ETH)',
                type: 'number',
                sortable: false,
                flex: 1,
                minWidth: 150, // Added minWidth
                headerAlign: 'right', // Align header to the right
                align: 'right', // Align data to the right
                valueFormatter: (params) => `${params?.toFixed(4)}`,
            },
            {
                field: 'orch_commission_usd',
                headerName: 'Commission (USD)',
                type: 'number',
                sortable: false,
                flex: 1,
                minWidth: 150, // Added minWidth
                headerAlign: 'right', // Align header to the right
                align: 'right', // Align data to the right
                valueFormatter: (params) => `$${params?.toFixed(2)}`,
            },
            // Date/Time column: You can keep it left or center based on preference. Left is typical.
            {
                field: 'timestamp',
                headerName: 'Date/Time',
                type: 'dateTime',
                sortable: true,
                minWidth: 175, // Changed from maxWidth to minWidth and removed flex:1 to give it a fixed size
                valueFormatter: (params) => moment(params).local().format('YYYY-MM-DD HH:mm:ss'),
                valueGetter: (params) => {
                    return params ? new Date(params) : null;
                },
            },
        ];
        const rows = (payouts || []).map((payout, index) => ({
            id: index,
            ...payout,
        }));

        latestPayoutDetails = (
            <>
                <Typography variant="h6" gutterBottom style={{marginTop: '15px',marginBottom: '15px'}}>Latest Payouts {moment(payout_params.startDate).local().format('YYYY-MM-DD')} - {moment(payout_params.endDate).local().format('YYYY-MM-DD')}</Typography>
                <Paper >
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
                            // rowsPerPageOptions is deprecated, use pageSizeOptions instead
                            pageSizeOptions={[25, 50, { value: -1, label: 'All' }]}
                            initialState={{
                                pagination: { paginationModel: { pageSize: 50 } },
                                sorting: {
                                    sortModel: [
                                        { field: 'timestamp', sort: 'desc' },
                                    ],
                                },
                            }}
                            sx={{
                                flexGrow: 1,
                                // Styles for column headers
                                '& .MuiDataGrid-columnHeaders': {
                                    backgroundColor: '#f5f5f5',
                                },
                                // Style to ensure column header text doesn't wrap to fit content better
                                '& .MuiDataGrid-columnHeaderTitleContainer': {
                                    whiteSpace: 'normal',
                                    lineHeight: '1.2',
                                    padding: '8px', // Added padding for better visual spacing
                                },
                            }}
                        />
                    </Box>
                </Paper>
            </>
        );
    }

    return (
        <Box sx={{ py: 4 }}>
            <Typography
                variant="h4"
                gutterBottom
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}
            >
                <img src={gateway.avatar} height={50} alt="Gateway Avatar" /> {gateway.name}
            </Typography>
            <Button
                variant="contained"
                color="primary"
                target="_blank"
                href={`https://explorer.livepeer.org/accounts/${gateway.eth_address}/history`}
                rel="noopener"
            >
                View on Livepeer
            </Button>
            <Box sx={{ mb: 1, mt:3 }}>
                <Typography variant="subtitle1" color="textPrimary">
                    ETH Address:
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    {gateway.eth_address}
                </Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
                <Typography variant="subtitle1" color="textPrimary">
                    Deposit:
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    {gateway.deposit} ETH
                </Typography>
            </Box>
            <Box>
                <Typography variant="subtitle1" color="textPrimary">
                    Reserve:
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    {gateway.reserve} ETH
                </Typography>
            </Box>
            {latestPayoutDetails}
        </Box>
    );
}

export default Gateway;
