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
import { getGatewayUrl, getBearerToken } from "./utils.js";

const ImageToText = () => {
    const [formState, setFormState] = useState({
        prompt: "",
        model_id: "",
    });
    const [file, setFile] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [generatedText, setGeneratedText] = useState("");

    const models = useObservable(() => $supportedModels("Image to Text"), []);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setGeneratedText(""); // Reset generated text when a new file is uploaded
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormState((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");
        setGeneratedText("");
        setLoading(true);

        const { prompt, model_id } = formState;
        const errors = [];

        if (!file || file.size === 0) {
            errors.push("Image must be uploaded.");
        }
        if (!prompt.trim()) {
            errors.push("Prompt is required.");
        }
        if (!model_id) {
            errors.push("Model ID is required.");
        }

        if (errors.length > 0) {
            setErrorMessage(errors.join("\n"));
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("image", file);
        formData.append("model_id", model_id);

        try {
            const response = await fetch(`${getGatewayUrl()}/image-to-text`, {
                method: "POST",
                mode: "cors",
                headers: {
                    Authorization: `Bearer ${getBearerToken()}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (data.error) {
                setErrorMessage("Failed to generate text, please try again.");
            } else {
                setGeneratedText(data.text || "No text generated.");
                setSuccessMessage("Text generated successfully!");
            }
        } catch (error) {
            console.error("[ImageToText] handleSubmit error:", error);
            setErrorMessage("Failed to generate text, please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ py: 3 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Image to Text
            </Typography>
            <Typography variant="body1" color="textSecondary" gutterBottom>
                Upload an image, provide a prompt, and select a model to extract text.
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
                {/* Input Section */}
                <Grid item xs={12} md={6}>
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
                                    placeholder="Describe the image or desired text output"
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
                                    sx={{mt: 2}}
                                >
                                    Generate
                                </Button>
                                {loading && <LinearProgress sx={{ mt: 2, mb: 2 }} />}
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
                            </form>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Output Section */}
                <Grid item xs={12} md={6}>
                    <Card elevation={3} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6">Output</Typography>
                            <Box
                                id="image-to-text-output"
                                sx={{
                                    mt: 2,
                                    minHeight: 300,
                                    border: "1px dashed #ccc",
                                    padding: 2,
                                    backgroundColor: "#f9f9f9",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {file && (
                                    <Box
                                        component="img"
                                        src={URL.createObjectURL(file)}
                                        alt="Uploaded Preview"
                                        sx={{
                                            maxWidth: "100%",
                                            maxHeight: 200,
                                            mb: 2,
                                            borderRadius: 1,
                                            boxShadow: 1,
                                        }}
                                    />
                                )}
                                <Typography
                                    variant="body2"
                                    color="textSecondary"
                                    sx={{ whiteSpace: "pre-line", textAlign: "center" }}
                                >
                                    {generatedText || "Your generated text will appear here."}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ImageToText;
