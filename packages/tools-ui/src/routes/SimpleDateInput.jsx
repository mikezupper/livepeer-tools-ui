// SimpleDateInput.jsx (updated)
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TextField, Button, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const SimpleDateInput = ({ initialDate = '' }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [jobType, setJobType] = useState('both');

    // Extract the report type (daily, weekly, monthly) from the current path
    const getReportType = () => {
        const pathParts = location.pathname.split('/');
        const reportsIndex = pathParts.findIndex(part => part === 'reports');
        if (reportsIndex !== -1 && reportsIndex + 1 < pathParts.length) {
            return pathParts[reportsIndex + 1]; // Should be "daily", "weekly", or "monthly"
        }
        return 'daily'; // Default fallback
    };

    const handleChange = (event) => {
        setSelectedDate(event.target.value);
    };

    const handleJobTypeChange = (event) => {
        setJobType(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (selectedDate) {
            const reportType = getReportType();
            console.log(`Navigating to ${reportType} date: ${selectedDate}, job type: ${jobType}`);
            navigate(`/reports/${reportType}/${selectedDate}?job_type=${jobType}`);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} display="flex" alignItems="center" mt={2} gap={2}>
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
            <FormControl sx={{ minWidth: 150 }}>
                <InputLabel id="job-type-label">Job Type</InputLabel>
                <Select
                    labelId="job-type-label"
                    id="job-type"
                    value={jobType}
                    label="Job Type"
                    onChange={handleJobTypeChange}
                >
                    <MenuItem value="both">Both</MenuItem>
                    <MenuItem value="ai">AI</MenuItem>
                    <MenuItem value="transcoding">Transcoding</MenuItem>
                </Select>
            </FormControl>
            <Button type="submit" variant="contained" color="primary" sx={{ height: '56px' }}>
                Go
            </Button>
        </Box>
    );
};

export default SimpleDateInput;
