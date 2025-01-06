import React from "react";
import { Box, Typography, Container, Button, Grid, Card, CardContent, CardActions } from "@mui/material";
import { Link } from "react-router-dom";

/**
 * Home component that serves as a professional landing page showcasing the features of Livepeer Tools.
 * @returns {JSX.Element} The rendered Home component.
 */
function Home() {
    return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
            <Box textAlign="center" sx={{ mb: 6 }}>
                <Typography variant="h2" gutterBottom>
                    Welcome to Livepeer Tools
                </Typography>
                <Typography variant="h5" color="text.secondary">
                    Your all-in-one platform for orchestrator performance, treasury insights, and comprehensive reporting. Empower your Livepeer operations with data-driven tools.
                </Typography>
            </Box>

            <Typography variant="h4" gutterBottom>
                Key Features
            </Typography>
            <Grid container spacing={4} sx={{ mt: 4 }}>

                {/* Feature: Reports */}
                <Grid item xs={12} md={6} lg={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                Reports
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Generate detailed payout reports in ETH and USD: daily, weekly, monthly, or custom charts.
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button size="small" component={Link} to="/reports">
                                View
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
                {/* Feature: Orchestrators */}
                <Grid item xs={12} md={6} lg={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                Orchestrators
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Explore a list of orchestrators with reward and fee cuts, stake amounts, and quick links to their profiles.
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button size="small" component={Link} to="/orchestrators">
                                View
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>

                {/* Feature: Gateways */}
                <Grid item xs={12} md={6} lg={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                Gateways
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                View details of gateways, including deposit and reserve amounts, with links to their profiles.
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button size="small" component={Link} to="/gateways">
                                View
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
                {/* Feature: Orchestrator Performance */}
                <Grid item xs={12} md={6} lg={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                Orchestrator Performance
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Access a leaderboard and performance stats for AI and transcoding tasks to analyze orchestrator efficiency.
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button size="small" component={Link} to="/performance/leaderboard">
                                View
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>

                {/* Feature: Livepeer Treasury Voting History */}
                <Grid item xs={12} md={6} lg={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                Livepeer Treasury Voting History
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Review all funding requests voted on by Livepeer stakeholders.
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button size="small" component={Link} to="/vote/history">
                                View
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>

            </Grid>
        </Container>
    );
}

export default Home;
