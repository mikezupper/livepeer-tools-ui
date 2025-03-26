// SimpleDateInput.jsx

import React, { useState } from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import { TextField, Button, Box } from '@mui/material';

const SimpleDateInput = ({initialDate=''}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedDate, setSelectedDate] = useState(initialDate);

    // Extract the report type (daily, weekly, monthly) from the current path
    const getReportType = () => {
        const pathParts = location.pathname.split('/');
        // Find the index of "reports" and get the next part
        const reportsIndex = pathParts.findIndex(part => part === 'reports');
        if (reportsIndex !== -1 && reportsIndex + 1 < pathParts.length) {
            return pathParts[reportsIndex + 1]; // Should be "daily", "weekly", or "monthly"
        }
        return 'daily'; // Default fallback
    };
    const handleChange = (event) => {
        setSelectedDate(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (selectedDate) {
            const reportType = getReportType();
            console.log(`Navigating to ${reportType} date: ${selectedDate}`);
            navigate(`/reports/${reportType}/${selectedDate}`);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} display="flex" alignItems="center" mt={2}>
            <TextField
                label="Select Date"
                type="date"
                value={selectedDate}
                onChange={handleChange}
                InputLabelProps={{
                    shrink: true,
                }}
                required
            />
            <Button type="submit" variant="contained" color="primary" style={{ marginLeft: '10px', height: '56px' }}>
                Go
            </Button>
        </Box>
    );
};

export default SimpleDateInput;
