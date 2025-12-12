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
import GeneratedImageCard from "./GenerateImageCard.jsx";

const ImageToImage = () => {
    const [formState, setFormState] = useState({
        prompt: "",
        model_id: "",
        negative_prompt: "",
        strength: 1,
        num_inference_steps: 10,
        num_images_per_prompt: 2,
        guidance_scale: 1,
        safety_check: "false",
        seed: "",
    });
    const [file, setFile] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [outputImages, setOutputImages] = useState([]);
    const [videoOutputs, setVideoOutputs] = useState([]);

    const models = useObservable(() => $supportedModels("image-to-image"), []);
    const videoModels = useObservable(() => $supportedModels("image-to-video"), []);
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
        setOutputImages([]);
        setVideoOutputs([]);
        setLoading(true);

        let errors = [];
        const {
            prompt,
            model_id,
            negative_prompt,
            strength,
            num_inference_steps,
            num_images_per_prompt,
            guidance_scale,
            safety_check,
            seed,
        } = formState;

        if (!file) errors.push("Image must be uploaded.");
        if (!prompt.trim()) errors.push("Please enter a prompt.");
        if (isNaN(num_inference_steps) || num_inference_steps <= 1) {
            errors.push("Number of inference steps must be greater than 1.");
        }
        if (isNaN(guidance_scale)) errors.push("Guidance scale must be a number.");
        if (isNaN(strength) || strength <= 0) errors.push("Strength must be a positive number.");
        if (isNaN(num_images_per_prompt) || num_images_per_prompt > 10) {
            errors.push("Number of images per prompt cannot exceed 10.");
        }

        if (errors.length > 0) {
            setErrorMessage(errors.join("\n"));
            setLoading(false);
            return;
        }
        if(formState.seed === "")
            delete formState.seed;

        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("negative_prompt", negative_prompt);
        formData.append("image", file);
        formData.append("model_id", model_id);
        formData.append("guidance_scale", guidance_scale);
        formData.append("strength", strength);
        formData.append("num_images_per_prompt", num_images_per_prompt);
        formData.append("num_inference_steps", num_inference_steps);
        formData.append("safety_check", safety_check === "true");
        if (seed) {
            formData.append("seed", seed);
        }

        try {
            const response = await fetch(`${getGatewayUrl()}/image-to-image`, {
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
                setErrorMessage("Failed generating an image, please try again.");
            } else {
                setOutputImages(data.images || []);
                setSuccessMessage("Images generated successfully!");
            }
        } catch (err) {
            // console.error("[ImageToImage] handleSubmit error:", error);
            setErrorMessage(`Something went wrong [${err }]`);
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
                Image to Image
            </Typography>
            <Typography variant="body1" color="textSecondary" gutterBottom>
                Provide the necessary inputs, upload an image, and click "Generate" to create new images.
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
                                <Typography variant="body2" color="error.main" sx={{ mt: 2, whiteSpace: "pre-line" }}>
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
                                    placeholder="Describe your image"
                                    sx={{ my: 2 }}
                                />
                                <Box>
                                    <Button variant="contained" component="label">
                                        Upload Image
                                        <input type="file" hidden onChange={handleFileChange} />
                                    </Button>
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        {file ? file.name : "No file uploaded"}
                                    </Typography>
                                </Box>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    disabled={loading}
                                    sx={{ mb: 2 }}
                                >
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
                                    label="Negative Prompt"
                                    name="negative_prompt"
                                    value={formState.negative_prompt}
                                    onChange={handleChange}
                                    fullWidth
                                    placeholder="Describe what to avoid"
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    label="Strength"
                                    name="strength"
                                    value={formState.strength}
                                    onChange={handleChange}
                                    type="number"
                                    fullWidth
                                    required
                                    sx={{ my: 2 }}
                                />
                                <TextField
                                    label="# of Inference Steps"
                                    name="num_inference_steps"
                                    value={formState.num_inference_steps}
                                    onChange={handleChange}
                                    type="number"
                                    fullWidth
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    label="# of Images"
                                    name="num_images_per_prompt"
                                    value={formState.num_images_per_prompt}
                                    onChange={handleChange}
                                    type="number"
                                    fullWidth
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    label="Guidance Scale"
                                    name="guidance_scale"
                                    value={formState.guidance_scale}
                                    onChange={handleChange}
                                    type="number"
                                    fullWidth
                                    sx={{ mb: 2 }}
                                />
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>Safety Check</InputLabel>
                                    <Select
                                        name="safety_check"
                                        value={formState.safety_check}
                                        onChange={handleChange}
                                        required
                                    >
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
                                    videoOutputs.map((videoOutput, index) => (
                                        <Box
                                            key={index}
                                            component="video"
                                            src={videoOutput[0].url}
                                            controls
                                            autoPlay
                                            sx={{ width: "100%", maxWidth: "300px", mb: 2 }}
                                        />
                                    ))
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

export default ImageToImage;
