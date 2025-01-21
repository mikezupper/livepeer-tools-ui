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
} from "@mui/material";
import { useObservable } from "rxjs-hooks";
import { $supportedModels } from "../../api/DataService.js";
import {getGatewayUrl, getBearerToken, intFields, floatFields} from "./utils.js";
import GeneratedImageCard from "./GenerateImageCard.jsx";

const UpscaleImage = () => {
    const [formState, setFormState] = useState({
        model_id: "",
        safety_check: "false",
        seed: "",
    });
    const [file, setFile] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [outputImages, setOutputImages] = useState([]);
    const [videoOutputs, setVideoOutputs] = useState([]);

    const models = useObservable(() => $supportedModels("Upscale"), []);
    const videoModels = useObservable(() => $supportedModels("Image to Video"), []);

    const handleVideoGenerated = (videoUrl) => {
        setVideoOutputs((prevVideos) => [...prevVideos, videoUrl]);
    };

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setSuccessMessage("");
        setErrorMessage("");
        setOutputImages([]);
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
        setVideoOutputs([]);
        setLoading(true);

        const { model_id, safety_check, seed } = formState;
        const errors = [];

        if (!file || file.size === 0) {
            errors.push("Image must be uploaded.");
        }
        if (!model_id) {
            errors.push("Model ID is required.");
        }

        if (errors.length > 0) {
            setErrorMessage(errors.join("\n"));
            setLoading(false);
            return;
        }
        if(formState.seed === "")
            delete formState.seed;

        const formData = new FormData();
        formData.append("prompt", "not needed");
        formData.append("image", file);
        formData.append("model_id", model_id);
        formData.append("safety_check", safety_check === "true");
        if (seed) {
            formData.append("seed", seed);
        }

        try {
            const response = await fetch(`${getGatewayUrl()}/upscale`, {
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
            console.log("upscale image data ",data);
            if (data.error) {
                setErrorMessage("Failed to generate an upscaled image, please try again.");
            } else {
                setOutputImages(data.images || []);
                setSuccessMessage("Image upscaled successfully!");
            }
        } catch (err) {
            setErrorMessage(`Something went wrong [${err}]`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Grid container spacing={2}>
            {/* Input Section */}
            <Grid item xs={12} md={4}>
                <Card>
                    <CardContent>
                        <Typography variant="h6">Upload your image and click Upscale</Typography>
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
                            <Box mt={2}>
                                <Button variant="contained" component="label">
                                    Choose a file
                                    <input type="file" hidden onChange={handleFileChange} />
                                </Button>
                                <Typography variant="body2" mt={1}>
                                    {file ? file.name : "No file uploaded"}
                                </Typography>
                            </Box>

                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                disabled={loading}
                                sx={{ my: 2 }}
                            >
                                {loading ? "Processing..." : "Upscale Image"}
                            </Button>
                            {loading && <LinearProgress />}

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
                            <FormControl fullWidth sx={{ my: 2 }}>
                                <InputLabel>Safety Check</InputLabel>
                                <Select
                                    name="safety_check"
                                    value={formState.safety_check}
                                    onChange={handleChange}
                                    required
                                >
                                    <MenuItem value="true">True</MenuItem>
                                    <MenuItem value="false">False</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                label="Seed"
                                name="seed"
                                value={formState.seed}
                                onChange={handleChange}
                                fullWidth
                                placeholder="Optional"
                                sx={{ my: 2 }}
                            />
                        </form>
                    </CardContent>
                </Card>
            </Grid>

            {/* Output Section */}
            <Grid item xs={12} md={4}>
                <Card>
                    <CardContent>
                        <Typography variant="h6">Upscaled Images</Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
                            {outputImages && outputImages.length > 0 ? (
                                outputImages.map((img, index) => (
                                    <GeneratedImageCard
                                        key={index}
                                        imageSrc={
                                            img.url.startsWith("http")
                                                ? img.url
                                                : `${getGatewayUrl()}${img.url}`
                                        }
                                        videoModels={videoModels}
                                        onVideoGenerated={handleVideoGenerated}
                                        index={index}
                                    />
                                ))
                            ) : (
                                <Typography variant="body2" color="textSecondary">
                                    Generated Images will appear here.
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
    );
};

export default UpscaleImage;
