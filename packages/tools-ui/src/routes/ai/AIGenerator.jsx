import React from "react";
import {
    Box,
    Typography,
    Container,
    Grid,
    Card,
    CardContent,
    Divider,
} from "@mui/material";

function AIGenerator() {
    return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
            {/* Header Section */}
            <Box textAlign="center" sx={{ mb: 6 }}>
                <Typography variant="h2" gutterBottom>
                    AI Generator
                </Typography>
                <Typography variant="h5" color="text.secondary">
                    A Livepeer AI Image and Video Generation Testing Tool
                </Typography>
            </Box>

            {/* Features Section */}
            <Grid container spacing={4}>
                {/* Feature 1 */}
                <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Image Generation
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                                Generate high-quality images from text prompts using advanced AI models. Customize parameters like resolution, number of outputs, and style.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Feature 2 */}
                <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Video Generation
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                                Create captivating videos from static images or sequences, with configurable motion effects and frame rates powered by AI.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Feature 3 */}
                <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Speech Generation
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                                Transform text into realistic speech outputs, choosing from various voice models and tones to suit your needs.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Feature 4 */}
                <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Text Analysis
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                                Analyze and process text data efficiently with AI, offering insights and summaries to enhance your workflow.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Feature 5 */}
                <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Model Customization
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                                Customize AI models with advanced parameter controls for tailored results, including guidance scales and inference steps.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Feature 6 */}
                <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Real-Time Preview
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                                Preview generated content in real time, ensuring you get the desired results before finalizing outputs.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
}

export default AIGenerator;
