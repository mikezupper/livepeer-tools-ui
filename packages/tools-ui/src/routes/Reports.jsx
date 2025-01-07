// src/components/Reports.jsx

import React from "react";
import {
    Grid,
    Typography,
    Box,
    Card,
    CardContent,
    CardActions,
    Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ArrowForward } from "@mui/icons-material";

/**
 *
 * @returns {JSX.Element} The rendered component.
 */
function Reports() {
    const reportsData = [
        {
            title: "Payout Charts",
            description:
                "A set of charts that show the payouts from Livepeer Protocol. The values are displayed in ETH and USD. You can view all the payouts or for a specific time range.",
            link: "/reports/top/payout",
        },
        {
            title: "Daily Payout Report",
            description:
                "A tabular report that shows the payouts from Livepeer Protocol. The values are displayed in ETH and USD. You can view all the payouts for a specific day.",
            link: "/reports/daily",
        },
        {
            title: "Weekly Payout Report",
            description:
                "A tabular report that shows the payouts from Livepeer Protocol. The values are displayed in ETH and USD. You can view all the payouts for a specific week.",
            link: "/reports/weekly",
        },
        {
            title: "Monthly Payout Report",
            description:
                "A tabular report that shows the payouts from Livepeer Protocol. The values are displayed in ETH and USD. You can view all the payouts for a specific month.",
            link: "/reports/monthly",
        }
    ];

    const navigate = useNavigate();

    const handleButtonClick = (link) => {
        navigate(link);
    };

    return (
        <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
            <Typography variant="h4" gutterBottom>
                Reports
            </Typography>
            <Grid container spacing={4}>
                {reportsData.map((report, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                        <Card
                            variant="outlined"
                            sx={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                            }}
                        >
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {report.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {report.description}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button
                                    size="small"
                                    color="primary"
                                    endIcon={<ArrowForward />}
                                    onClick={() => handleButtonClick(report.link)}
                                >
                                    View Report
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

export default Reports;
