import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Box } from '@mui/material';

const DateNavigation = ({ currentDate }) => {
    const prevDate = getPreviousDate(currentDate);
    const nextDate = getNextDate(currentDate);

    return (
        <Box display="flex" justifyContent="space-between" mt={4}>
            <Button
                variant="outlined"
                component={Link}
                to={`/reports/daily/${prevDate}`}
            >
                Previous Day
            </Button>
            <Button
                variant="outlined"
                component={Link}
                to={`/reports/daily/${nextDate}`}
            >
                Next Day
            </Button>
        </Box>
    );
};

// Helper functions to calculate previous and next dates
const getPreviousDate = (currentDate) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - 1);
    return formatDate(date);
}

const getNextDate = (currentDate) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + 1);
    const today = new Date();
    if (date > today) {
        return formatDate(today);
    }
    return formatDate(date);
}

// Utility function to format date as YYYY-MM-DD
const formatDate = (date) => {
    const year = date.getFullYear();
    const month = (`0${(date.getMonth() + 1)}`).slice(-2);
    const day = (`0${date.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
}

export default DateNavigation;