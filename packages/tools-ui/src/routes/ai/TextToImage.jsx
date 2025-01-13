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
import {floatFields, getBearerToken, getGatewayUrl, intFields, num_between} from "./utils.js";
import GeneratedImageCard from "./GenerateImageCard.jsx";

const TextToImage = () => {
    const models = useObservable(() => $supportedModels("Text to image"), []);
    const videoModels = useObservable(() => $supportedModels("Image to Video"), []);
    const init_state = {
        prompt: "",
        model_id: "",
        negative_prompt: "",
        width: 1024,
        height: 576,
        num_images_per_prompt: 2,
        num_inference_steps: 6,
        guidance_scale: 2,
        safety_check: false,
        seed: undefined,
    };

    const [formState, setFormState] = useState(init_state);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [outputImages, setOutputImages] = useState([]);
    const [videoOutputs, setVideoOutputs] = useState([]); // State to hold generated videos

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");
        setOutputImages([]);
        setVideoOutputs([]);
        setLoading(true);

        let errors = [];
        const { width, height, guidance_scale, num_inference_steps, num_images_per_prompt, prompt } = formState;

        if (!prompt.trim()) errors.push("Please enter a prompt.");
        if (width < 1 || width > 1024) errors.push("Width must be between 1 and 1024.");
        if (height < 1 || height > 1024) errors.push("Height must be between 1 and 1024.");
        if (guidance_scale < 0) errors.push("Guidance scale must be a positive number.");
        if (num_inference_steps <= 1) errors.push("Number of inference steps must be greater than 1.");
        if (num_images_per_prompt > 10) errors.push("Number of images per prompt cannot exceed 10.");

        if (errors.length > 0) {
            setErrorMessage(errors.join("\n"));
            setLoading(false);
            return;
        }
        if(formState.seed === "")
            delete formState.seed;

        try {
            const response = await fetch(`${getGatewayUrl()}/text-to-image`, {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getBearerToken()}`,
                },
                body: JSON.stringify(formState),
            });

            const data = await response.json();

            if (data.error) {
                setErrorMessage("Failed generating an image, please try again.");
            } else {
                setOutputImages(data.images || []);
                setSuccessMessage("Images generated successfully!");
            }
        } catch (error) {
            console.error("[TextToImage] handleSubmit error:", error);
            setErrorMessage("Failed to generate image, please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVideoGenerated = (videoUrl) => {
        setVideoOutputs((prevVideos) => [...prevVideos, videoUrl]);
    };
    return (
        <Box sx={{ py: 3 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Text to Image
            </Typography>
            <Typography variant="body1" color="textSecondary" gutterBottom>
                Enter a prompt, configure the parameters, and generate images.
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
                {/* Input Section */}
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
                                <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>
                                    {errorMessage}
                                </Typography>
                            )}
                            <form onSubmit={handleSubmit}>
                                <TextField
                                    label="Prompt"
                                    name="prompt"
                                    value={formState.prompt}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    multiline
                                    rows={3}
                                    placeholder="Describe the image"
                                    sx={{ my: 2 }}
                                />
                                <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading} sx={{mb:2}}>
                                    Generate
                                </Button>
                                {loading && <LinearProgress sx={{ mb: 2 }} />}

                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>Model</InputLabel>
                                    <Select
                                        name="model_id"
                                        value={formState.model_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        {models.length > 0 ? (
                                            models.map((modelName, index) => (
                                                <MenuItem key={index} value={modelName} selected={modelName === formState.model_id}>
                                                    {modelName}
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled>No models available</MenuItem>
                                        )}
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Negative Prompt"
                                    name="negative_prompt"
                                    value={formState.negative_prompt}
                                    onChange={handleChange}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                />
                                <TextField label="Width" name="width" type="number" value={formState.width} onChange={handleChange} fullWidth required sx={{ mb: 2 }} />
                                <TextField label="Height" name="height" type="number" value={formState.height} onChange={handleChange} fullWidth required sx={{ mb: 2 }} />
                                <TextField
                                    label="# of Images"
                                    name="num_images_per_prompt"
                                    type="number"
                                    value={formState.num_images_per_prompt}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    label="# of Inference Steps"
                                    name="num_inference_steps"
                                    type="number"
                                    value={formState.num_inference_steps}
                                    onChange={handleChange}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    label="Guidance Scale"
                                    name="guidance_scale"
                                    type="number"
                                    value={formState.guidance_scale}
                                    onChange={handleChange}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                />
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>Safety Check</InputLabel>
                                    <Select name="safety_check" value={formState.safety_check} onChange={handleChange} required>
                                        <MenuItem value="false">False</MenuItem>
                                        <MenuItem value="true">True</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Seed"
                                    name="seed"
                                    value={formState.seed}
                                    onChange={handleChange}
                                    fullWidth
                                    placeholder="Optional seed value"
                                    sx={{ mb: 2 }}
                                />
                            </form>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Generated Images Section */}
                <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Generated Images
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
                                {outputImages.length > 0 ? (
                                    outputImages.map((img, index) => (
                                        <GeneratedImageCard
                                            key={index}
                                            imageSrc={img.url.startsWith("http") ? img.url : `${getGatewayUrl()}${img.url}`}
                                            onVideoGenerated={handleVideoGenerated}
                                            videoModels={videoModels}
                                        />
                                    ))
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        Generated images will appear here.
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Generated Videos Section */}
                <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Generated Videos
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
                                {videoOutputs.length > 0 ? (
                                    videoOutputs.map((videoOutput, index) => {
                                        console.log("Video Output Data: ", videoOutput[0]);

                                        if (!videoOutput[0]?.url) {
                                            console.error("Invalid video data:", videoOutput[0]);
                                            return null; // Skip invalid entries
                                        }

                                        return (
                                            <Box
                                                key={index}
                                                component="video"
                                                src={videoOutput[0].url}
                                                controls
                                                autoPlay
                                                sx={{ width: "100%", maxWidth: "300px", mb: 2 }}
                                            />
                                        );
                                    })
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        Generated videos will appear here.
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default TextToImage;
