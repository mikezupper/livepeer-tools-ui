import React, { useState } from "react";
import {
    Button,
    Card,
    CardContent,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography,
    Box,
    LinearProgress,
    Divider,
} from "@mui/material";
import { useObservable } from "rxjs-hooks";
import { $supportedModels } from "../../api/DataService.js";
import { getGatewayUrl, getBearerToken } from "./utils.js";
import AudioTextCard from "./AudioTextCard";

const AudioToText = () => {
    const [errorMessage, setErrorMessage] = useState("");
    const [selectedModel, setSelectedModel] = useState("");
    const [file, setFile] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [outputText, setOutputText] = useState("");
    const [chunks, setChunks] = useState([]);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setOutputText("");
        setChunks([]);
        setErrorMessage("");
    };

    const handleChange = (event) => {
        setSelectedModel(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsGenerating(true);
        setErrorMessage("");
        setOutputText("");
        setChunks([]);
        setProgress(0);

        const errors = [];

        if (!file || file.size === 0) {
            errors.push("Audio must be uploaded.");
        }
        if (!selectedModel) {
            errors.push("Model ID is required.");
        }

        if (errors.length > 0) {
            setErrorMessage(errors.join("\n"));
            setIsGenerating(false);
            return;
        }

        const formData = new FormData();
        formData.append("audio", file);
        formData.append("model_id", selectedModel);

        try {
            const response = await fetch(`${getGatewayUrl()}/audio-to-text`, {
                method: "POST",
                mode: "cors",
                headers: {
                    Authorization: `Bearer ${getBearerToken()}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (data.error) {
                setErrorMessage("Failed generating text, please try again.");
            } else {
                const { chunks, text } = data;
                setOutputText(text || "No text generated.");
                setChunks(chunks || []);
                createDownloadButton(text);
            }
        } catch (error) {
            console.error("Failed generating audio-to-text output", error);
            setErrorMessage("Failed to generate text, please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const createDownloadButton = (text) => {
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const downloadButton = document.createElement("button");
        downloadButton.innerText = "Download Text";
        downloadButton.onclick = () => {
            const a = document.createElement("a");
            a.href = url;
            a.download = "audio-to-text.txt";
            a.click();
        };
        const outputElement = document.getElementById("audio-to-text-output");
        outputElement.appendChild(downloadButton);
    };

    const pipelineNameFilter = "Audio to text";
    const models = useObservable(() => $supportedModels(pipelineNameFilter), []);

    return (
        <section>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Audio to Text
            </Typography>
            <Typography variant="body1" color="textSecondary" gutterBottom>
                Upload an audio file, select a model, and generate a text transcript.
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2}>
                <Card sx={{ flex: 1, borderRadius: 2, boxShadow: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Upload Audio File
                        </Typography>
                        <form onSubmit={handleSubmit}>
                            {errorMessage && (
                                <Typography variant="body2" color="error" gutterBottom>
                                    {errorMessage}
                                </Typography>
                            )}
                            <Box mt={2}>
                                <Button variant="contained" component="label">
                                    Choose a file
                                    <input type="file" hidden onChange={handleFileChange} />
                                </Button>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    {file ? file.name : "No file uploaded yet"}
                                </Typography>
                            </Box>
                            <Box mt={3}>
                                <FormControl fullWidth>
                                    <InputLabel>Model</InputLabel>
                                    <Select
                                        name="model_id"
                                        value={selectedModel}
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
                            </Box>
                            <Box mt={3} display="flex" alignItems="center" gap={2}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={isGenerating || !file}
                                    fullWidth
                                >
                                    {isGenerating ? "Generating..." : "Generate Text"}
                                </Button>
                                {isGenerating && <CircularProgress size={24} />}
                            </Box>
                            {isGenerating && (
                                <Box mt={3}>
                                    <LinearProgress variant="determinate" value={progress} />
                                </Box>
                            )}
                        </form>
                    </CardContent>
                </Card>
                <Card sx={{ flex: 1, borderRadius: 2, boxShadow: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Output Text
                        </Typography>
                        <Box mt={2}>
                            <Typography
                                variant="body2"
                                sx={{ whiteSpace: "pre-wrap", minHeight: "100px", color: "textSecondary" }}
                                id="audio-to-text-output"
                            >
                                {outputText || "Your generated text will appear here."}
                            </Typography>
                        </Box>
                        <Box mt={3}>
                            {chunks.map((chunk, index) => (
                                <AudioTextCard key={index} timestamp={chunk.timestamp[0]} text={chunk.text} />
                            ))}
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </section>
    );
};

export default AudioToText;
