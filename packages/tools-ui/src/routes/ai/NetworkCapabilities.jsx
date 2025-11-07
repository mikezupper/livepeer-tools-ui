// src/routes/ai/NetworkCapabilities.jsx
import React from "react";
import {
    Typography,
    Card,
    CardContent,
    Button,
    Grid,
    Box,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useObservable } from "rxjs-hooks";
import {$networkCapabilities, fetchAndStoreCapabilities} from "../../api/DataService.js";

const NetworkCapabilities = () => {
    const networkCapabilities = useObservable(() => $networkCapabilities(), []);

    const handleRefresh = async () => {
        console.log("Refreshing network capabilities...");
        try {
            await fetchAndStoreCapabilities(); // Ensure this function is exposed in your service
            console.log("Capabilities refreshed");
        } catch (error) {
            console.error("Error refreshing capabilities:", error);
        }
    };

    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Card elevation={3} sx={{ borderRadius: 2 }}>
                    <CardContent>
                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                            pb={1}
                            sx={{ borderBottom: "1px solid #e0e0e0" }}
                        >
                            <Typography variant="h5" fontWeight="bold">
                                Network Capabilities
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                size="medium"
                                onClick={handleRefresh}
                                sx={{ textTransform: "capitalize" }}
                            >
                                Refresh
                            </Button>
                        </Box>
                        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                            Livepeer AI Pipelines Loaded
                        </Typography>
                        {networkCapabilities.length > 0 ? (
                            networkCapabilities.map((pipeline, pipelineIndex) => (
                                <Card
                                    key={pipelineIndex}
                                    elevation={2}
                                    sx={{ my: 2, borderLeft: "5px solid #3f51b5", borderRadius: 2 }}
                                >
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            fontWeight="bold"
                                            color="primary"
                                            sx={{ mb: 1 }}
                                        >
                                            {pipeline.name}
                                        </Typography>
                                        <Divider sx={{ my: 1 }} />
                                        {pipeline.models.map((model, modelIndex) => (
                                            <Accordion key={modelIndex} elevation={0} sx={{ mb: 1 }}>
                                                <AccordionSummary
                                                    expandIcon={<ExpandMoreIcon />}
                                                    sx={{
                                                        backgroundColor: "#f9f9f9",
                                                        borderBottom: "1px solid #e0e0e0",
                                                    }}
                                                >
                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                        {model.name}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="textSecondary"
                                                        sx={{ ml: 2 }}
                                                    >
                                                        Cold: {model.Cold}, Warm: {model.Warm}
                                                    </Typography>
                                                </AccordionSummary>
                                                <AccordionDetails>
                                                    {model.orchestrators.map((orchestrator, orchestratorIndex) => (
                                                        <Typography
                                                            key={orchestratorIndex}
                                                            variant="body2"
                                                            sx={{
                                                                color: orchestrator.warm
                                                                    ? "warning.main"
                                                                    : "info.main",
                                                                mb: 1,
                                                            }}
                                                        >
                                                            {orchestrator.ethAddress} -{" "}
                                                            {orchestrator.warm ? "Warm" : "Cold"}
                                                        </Typography>
                                                    ))}
                                                </AccordionDetails>
                                            </Accordion>
                                        ))}
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Typography
                                variant="body2"
                                color="textSecondary"
                                sx={{ mt: 2, textAlign: "center" }}
                            >
                                No capabilities available.
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

export default NetworkCapabilities;
