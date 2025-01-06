// SimpleDateInput.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Box } from '@mui/material';

const SimpleDateInput = ({initialDate=''}) => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(initialDate);

    const handleChange = (event) => {
        setSelectedDate(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (selectedDate) {
            console.log(`Navigating to date: ${selectedDate}`); // Debugging line
            navigate(`/reports/daily/${selectedDate}`);
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
