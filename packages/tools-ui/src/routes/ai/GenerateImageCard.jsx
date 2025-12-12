import React, { useState } from "react";
import {
    Card,
    CardMedia,
    CardContent,
    Typography,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Collapse,
    LinearProgress,
    Dialog,
    DialogContent,
    Box,
} from "@mui/material";
import { getBearerToken, getGatewayUrl } from "./utils.js";

const GeneratedImageCard = ({ imageSrc,onVideoGenerated,videoModels }) => {
    const [formState, setFormState] = useState({
        model_id: videoModels[0] ? videoModels[0]: '',
        width: 1024,
        height: 576,
        noise_aug_strength: 0.065,
        motion_bucket_id: 127,
        fps: 8,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false); // Dialog state for full image

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormState((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleGenerateVideo = async () => {
        if (!imageSrc) return;

        if(!formState.model_id) {
            console.warn("handleGenerateVideo model_id is null!!!");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(imageSrc);
            const blob = await response.blob();
            const filename = imageSrc.substring(imageSrc.lastIndexOf("/") + 1);
            const file = new File([blob], filename);

            const formData = new FormData();
            Object.entries(formState).forEach(([key, value]) => {
                formData.append(key, value);
            });
            formData.append("image", file);

            const resp = await fetch(`${getGatewayUrl()}/image-to-video`, {
                method: "POST",
                mode: "cors",
                cache: "no-cache",
                headers: {
                    Authorization: `Bearer ${getBearerToken()}`,
                },
                body: formData,
            });

            const data = await resp.json();
            if(data?.error){
                console.log("error occurrec generating video");
                setIsLoading(false);
                return;
            }

            onVideoGenerated(data.images)

        } catch (error) {
            console.error("[GeneratedImageCard::handleGenerateVideo]", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDialogOpen = () => {
        setIsDialogOpen(true);
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
    };
// console.log("Generated ImageCard", imageSrc,onVideoGenerated,videoModels);
    return (
        <>
            <Card>
                <CardMedia
                    component="img"
                    height="140"
                    image={imageSrc}
                    alt="Generated thumbnail"
                    onClick={handleDialogOpen} // Open dialog on click
                    sx={{ cursor: "pointer" }}
                />
                <CardContent>
                    <Typography variant="h6">Generate Video</Typography>
                    {isLoading && <LinearProgress sx={{ mt: 2 }} />}
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleGenerateVideo}
                        sx={{ my: 2 }}
                        disabled={isLoading}
                    >
                        {isLoading ? "Generating..." : "Generate Video"}
                    </Button>
                    <Typography
                        variant="body2"
                        color="textSecondary"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        sx={{ cursor: "pointer", mt: 1 }}
                    >
                        Advanced Options
                    </Typography>
                    <Collapse in={showAdvanced}>
                        <form>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Model</InputLabel>
                                <Select
                                    name="model_id"
                                    value={formState.model_id}
                                    onChange={handleInputChange}
                                    required
                                >
                                    {videoModels.length > 0 ? (
                                        videoModels.map((modelName, index) => (
                                            <MenuItem key={index} value={modelName}>
                                                {modelName}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem disabled>No models available</MenuItem>
                                    )}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Width"
                                name="width"
                                value={formState.width}
                                onChange={handleInputChange}
                                fullWidth
                                sx={{ my: 2 }}
                            />
                            <TextField
                                label="Height"
                                name="height"
                                value={formState.height}
                                onChange={handleInputChange}
                                fullWidth
                                sx={{ my: 2 }}
                            />
                            <TextField
                                label="Noise Aug Strength"
                                name="noise_aug_strength"
                                value={formState.noise_aug_strength}
                                onChange={handleInputChange}
                                fullWidth
                                sx={{ my: 2 }}
                            />
                            <TextField
                                label="Motion Bucket Id"
                                name="motion_bucket_id"
                                value={formState.motion_bucket_id}
                                onChange={handleInputChange}
                                fullWidth
                                sx={{ my: 2 }}
                            />
                            <TextField
                                label="Frames Per Second"
                                name="fps"
                                value={formState.fps}
                                onChange={handleInputChange}
                                fullWidth
                                sx={{ my: 2 }}
                            />
                        </form>
                    </Collapse>
                </CardContent>
            </Card>

            {/* Dialog for full image */}
            <Dialog open={isDialogOpen} onClose={handleDialogClose} maxWidth="lg">
                <DialogContent>
                    <Box
                        component="img"
                        src={imageSrc}
                        alt="Full-size image"
                        sx={{
                            width: "100%",
                            height: "auto",
                            maxHeight: "90vh",
                            objectFit: "contain",
                        }}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default GeneratedImageCard;
