import React from "react";
import {
    Box,
    Typography,
    Container,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
} from "@mui/material";
import { Link } from "react-router-dom";
import { ArrowForward } from "@mui/icons-material";

function Home() {
    return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
            {/* Introduction Section */}
            <Box textAlign="center" sx={{ mb: 6 }}>
                <Typography variant="h2" gutterBottom>
                    Welcome to Livepeer Tools
                </Typography>
                <Typography variant="h5" color="text.secondary">
                    Your all-in-one platform for orchestrator performance, treasury
                    insights, and comprehensive reporting. Empower your Livepeer
                    operations with data-driven tools.
                </Typography>
            </Box>

            {/* Key Features Section */}
            <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
                <Typography variant="h4" gutterBottom>
                    Key Features
                </Typography>
                <Grid container spacing={4} sx={{ mt: 2 }}>
                    {/* Reports */}
                    <Grid item xs={12} sm={6} md={4} lg={3}>
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
                                    Reports
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Generate detailed payout reports in ETH and USD: daily,
                                    weekly, monthly, or custom charts.
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button
                                    size="small"
                                    color="primary"
                                    endIcon={<ArrowForward />}
                                    component={Link}
                                    to="/reports"
                                >
                                    View
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>

                    {/* Orchestrators */}
                    <Grid item xs={12} sm={6} md={4} lg={3}>
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
                                    Orchestrators
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Explore a list of orchestrators with reward and fee cuts,
                                    stake amounts, and quick links to their profiles.
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button
                                    size="small"
                                    color="primary"
                                    endIcon={<ArrowForward />}
                                    component={Link}
                                    to="/orchestrators"
                                >
                                    View
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>

                    {/* Gateways */}
                    <Grid item xs={12} sm={6} md={4} lg={3}>
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
                                    Gateways
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    View details of gateways, including deposit and reserve
                                    amounts, with links to their profiles.
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button
                                    size="small"
                                    color="primary"
                                    endIcon={<ArrowForward />}
                                    component={Link}
                                    to="/gateways"
                                >
                                    View
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>

                    {/* Orchestrator Performance */}
                    <Grid item xs={12} sm={6} md={4} lg={3}>
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
                                    Orchestrator Performance
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Access a leaderboard and performance stats for AI and
                                    transcoding tasks to analyze orchestrator efficiency.
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button
                                    size="small"
                                    color="primary"
                                    endIcon={<ArrowForward />}
                                    component={Link}
                                    to="/performance/leaderboard"
                                >
                                    View
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>

                    {/* Livepeer Treasury Voting History */}
                    <Grid item xs={12} sm={6} md={4} lg={3}>
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
                                    Livepeer Treasury Voting History
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Review all funding requests voted on by Livepeer
                                    stakeholders.
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button
                                    size="small"
                                    color="primary"
                                    endIcon={<ArrowForward />}
                                    component={Link}
                                    to="/vote/history"
                                >
                                    View
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
}

export default Home;
