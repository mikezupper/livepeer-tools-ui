import React, { useState } from "react";
import {
    TextField,
    Button,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Card,
    CardContent,
    LinearProgress,
    Box,
    Divider,
} from "@mui/material";
import { useObservable } from "rxjs-hooks";
import { $supportedModels } from "../../api/DataService.js";
import {floatFields, getBearerToken, getGatewayUrl, intFields} from "./utils.js";

const ImageToVideo = () => {
    const [formState, setFormState] = useState({
        model_id: "",
        width: 1024,
        height: 576,
        fps: 4,
        motion_bucket_id: 127,
        noise_aug_strength: 0.002,
        seed: "",
    });
    const [file, setFile] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const models = useObservable(() => $supportedModels("Image to Video"), []);
    // Update the model_id once models are loaded
    React.useEffect(() => {
        if (models.length > 0 && !formState.model_id) {
            setFormState((prevState) => ({
                ...prevState,
                model_id: models[0],
            }));
        }
    }, [models]);
    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormState((prevState) => ({
            ...prevState,
            [name]: intFields.includes(name)
                ? (value && parseInt(value, 10))
                : floatFields.includes(name)
                    ? (value && parseFloat(value))
                    : value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");
        setLoading(true);

        const {
            model_id,
            width,
            height,
            fps,
            motion_bucket_id,
            noise_aug_strength,
            seed,
        } = formState;

        let errors = [];

        if (!file || file.size === 0) errors.push("Image must be uploaded.");
        if (!model_id) errors.push("Model ID is required.");
        if (isNaN(width) || width < 1 || width > 1024) errors.push("Width must be between 1 and 1024.");
        if (isNaN(height) || height < 1 || height > 1024) errors.push("Height must be between 1 and 1024.");
        if (isNaN(fps)) errors.push("FPS must be a number.");
        if (isNaN(motion_bucket_id)) errors.push("Motion Bucket ID must be a number.");
        if (isNaN(noise_aug_strength)) errors.push("Noise Augmentation Strength must be a number.");

        if (errors.length > 0) {
            setErrorMessage(errors.join("\n"));
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("image", file);
        formData.append("model_id", model_id);
        formData.append("width", width);
        formData.append("height", height);
        formData.append("fps", fps);
        formData.append("motion_bucket_id", motion_bucket_id);
        formData.append("noise_aug_strength", noise_aug_strength);
        if (seed) formData.append("seed", seed);

        try {
            const response = await fetch(`${getGatewayUrl()}/image-to-video`, {
                method: "POST",
                mode: "cors",
                headers: {
                    Authorization: `Bearer ${getBearerToken()}`,
                },
                body: formData,
            });
            if (response.status === 429) {
                throw new Error("Too many requests. Please try again shortly.");
            }
            if (response.status !== 200) {
                throw new Error("Failed processing your AI request.");
            }
            const data = await response.json();

            if (data.error) {
                setErrorMessage("Failed to generate video, please try again.");
            } else {
                const videoUrl = data?.images[0]?.url;
                setSuccessMessage("Video generated successfully!");
                const outputElement = document.getElementById("image-to-video-output");
                const videoElement = document.createElement("video");
                videoElement.src = videoUrl.startsWith("http") ? videoUrl : `${getGatewayUrl()}${videoUrl}`;
                videoElement.type = "video/mp4";
                videoElement.autoplay = true;
                videoElement.controls = true;
                outputElement.prepend(videoElement);
            }
        } catch (err) {
            setErrorMessage(`Something went wrong [${err}]`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ py: 3 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Image to Video
            </Typography>
            <Typography variant="body1" color="textSecondary" gutterBottom>
                Upload an image, configure the video parameters, and generate a video.
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Input Configuration
                            </Typography>
                            {successMessage && (
                                <Typography variant="body2" color="success.main" sx={{ mt: 2 }}>
                                    {successMessage}
                                </Typography>
                            )}
                            {errorMessage && (
                                <Typography variant="body2" color="error.main" sx={{ mt: 2, whiteSpace: "pre-line" }}>
                                    {errorMessage}
                                </Typography>
                            )}
                            <form onSubmit={handleSubmit}>
                                <Button variant="contained" component="label">
                                    Upload Image
                                    <input type="file" hidden onChange={handleFileChange} />
                                </Button>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    {file ? file.name : "No file uploaded"}
                                </Typography>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    disabled={loading}
                                    sx={{mt:2}}
                                >
                                    Generate
                                </Button>
                                {loading && <LinearProgress sx={{ mb:2,mt: 2 }} />}

                                <FormControl fullWidth sx={{ my: 2 }}>
                                    <InputLabel>Model</InputLabel>
                                    <Select
                                        name="model_id"
                                        value={formState.model_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        {models.length > 0 ? (
                                            models.map((modelName, index) => (
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
                                    onChange={handleChange}
                                    type="number"
                                    fullWidth
                                    required
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    label="Height"
                                    name="height"
                                    value={formState.height}
                                    onChange={handleChange}
                                    type="number"
                                    fullWidth
                                    required
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    label="Frames per Second"
                                    name="fps"
                                    value={formState.fps}
                                    onChange={handleChange}
                                    type="number"
                                    fullWidth
                                    required
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    label="Motion Bucket ID"
                                    name="motion_bucket_id"
                                    value={formState.motion_bucket_id}
                                    onChange={handleChange}
                                    type="number"
                                    fullWidth
                                    required
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    label="Noise Augmentation Strength"
                                    name="noise_aug_strength"
                                    value={formState.noise_aug_strength}
                                    onChange={handleChange}
                                    type="number"
                                    fullWidth
                                    required
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    label="Seed"
                                    name="seed"
                                    value={formState.seed}
                                    onChange={handleChange}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                />

                            </form>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={8}>
                    <Card elevation={3} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Video Output
                            </Typography>
                            <Box
                                id="image-to-video-output"
                                sx={{
                                    mt: 2,
                                    minHeight: 300,
                                    border: "1px dashed #ccc",
                                    padding: 2,
                                    backgroundColor: "#f9f9f9",
                                }}
                            >
                                <Typography variant="body2" color="textSecondary">
                                    Your generated video will appear here.
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ImageToVideo;
