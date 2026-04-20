import React, { useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Tab,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";
import { marked } from "marked";
import { useByocModels } from "./useByocModels.js";
import { createChatCompletion, createChatCompletionStream, createEmbedding, createImageGeneration } from "./api.js";

function OpenAIByoc() {
    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [chatForm, setChatForm] = useState({
        model: "",
        system: "You are a helpful assistant.",
        prompt: "",
        temperature: 0.7,
        max_tokens: 512,
        stream: true,
    });
    const [chatOutput, setChatOutput] = useState("");
    const [chatReasoning, setChatReasoning] = useState("");

    const [imageForm, setImageForm] = useState({
        model: "",
        prompt: "",
        size: "1024x1024",
        n: 1,
    });
    const [imageOutput, setImageOutput] = useState([]);

    const [embeddingForm, setEmbeddingForm] = useState({
        model: "",
        input: "",
    });
    const [embeddingOutput, setEmbeddingOutput] = useState(null);

    const chatModels = useByocModels("openai-chat-completions", setChatForm);
    const imageModels = useByocModels("openai-image-generation", setImageForm);
    const embeddingModels = useByocModels("openai-text-embeddings", setEmbeddingForm);

    const resetMessages = () => {
        setErrorMessage("");
        setSuccessMessage("");
    };

    const handleApiError = (error) => {
        if (error?.status === 401 || error?.status === 403) {
            setErrorMessage("Unauthorized request. Check your configured bearer token.");
            return;
        }
        if (error?.status === 429) {
            setErrorMessage("Rate limited. Please retry shortly.");
            return;
        }
        setErrorMessage(error?.message || "Request failed.");
    };

    const extractText = (value) => {
        if (!value) {
            return "";
        }
        if (typeof value === "string") {
            return value;
        }
        if (Array.isArray(value)) {
            return value
                .map((item) => {
                    if (typeof item === "string") {
                        return item;
                    }
                    if (item?.type === "text" && typeof item?.text === "string") {
                        return item.text;
                    }
                    if (typeof item?.content === "string") {
                        return item.content;
                    }
                    return "";
                })
                .join("");
        }
        if (typeof value?.text === "string") {
            return value.text;
        }
        return "";
    };

    const stripHeaderTokens = (text) =>
        text.replace(/<\|start_header_id\|>assistant<\|end_header_id\|>/g, "");

    const handleChatSubmit = async (event) => {
        event.preventDefault();
        resetMessages();
        setChatOutput("");
        setChatReasoning("");

        if (!chatForm.prompt.trim()) {
            setErrorMessage("Prompt is required.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                model: chatForm.model,
                messages: [
                    { role: "system", content: chatForm.system || "" },
                    { role: "user", content: chatForm.prompt },
                ],
                temperature: Number(chatForm.temperature),
                max_tokens: Number(chatForm.max_tokens),
                stream: chatForm.stream,
            };

            if (chatForm.stream) {
                const stream = await createChatCompletionStream(payload);
                let accumulatedContent = "";
                let accumulatedReasoning = "";

                for await (const chunkData of stream) {
                    const delta = chunkData?.choices?.[0]?.delta;
                    const contentChunk = stripHeaderTokens(extractText(delta?.content));
                    const reasoningChunk = stripHeaderTokens(
                        extractText(delta?.reasoning) || extractText(delta?.reasoning_content)
                    );
                    if (contentChunk) {
                        accumulatedContent += contentChunk;
                        setChatOutput(marked(accumulatedContent));
                    }
                    if (reasoningChunk) {
                        accumulatedReasoning += reasoningChunk;
                        setChatReasoning(accumulatedReasoning);
                    }
                }
            } else {
                const data = await createChatCompletion(payload);
                const message = data?.choices?.[0]?.message;
                const delta = data?.choices?.[0]?.delta;
                const content = stripHeaderTokens(
                    extractText(message?.content) || extractText(delta?.content)
                );
                const reasoning = stripHeaderTokens(
                    extractText(message?.reasoning)
                    || extractText(message?.reasoning_content)
                    || extractText(delta?.reasoning)
                    || extractText(delta?.reasoning_content)
                );
                setChatOutput(marked(content));
                setChatReasoning(reasoning);
            }
            setSuccessMessage("Chat completion generated.");
        } catch (error) {
            handleApiError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageSubmit = async (event) => {
        event.preventDefault();
        resetMessages();
        setImageOutput([]);

        if (!imageForm.prompt.trim()) {
            setErrorMessage("Prompt is required.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                model: imageForm.model,
                prompt: imageForm.prompt,
                size: imageForm.size,
                n: Number(imageForm.n),
                response_format: "b64_json",
            };

            const data = await createImageGeneration(payload);
            const generated = Array.isArray(data?.data) ? data.data : [];
            setImageOutput(generated);
            if (generated.length === 0) {
                setErrorMessage("Image request succeeded but returned no renderable images.");
            } else {
                setSuccessMessage("Image generation completed.");
            }
        } catch (error) {
            handleApiError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEmbeddingSubmit = async (event) => {
        event.preventDefault();
        resetMessages();
        setEmbeddingOutput(null);

        if (!embeddingForm.input.trim()) {
            setErrorMessage("Input text is required.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                model: embeddingForm.model,
                input: embeddingForm.input,
            };

            const data = await createEmbedding(payload);
            // Handle both { data: [{ embedding: [...] }] } and { embedding: [...] } response shapes
            const embeddingObj = data?.data?.[0] ?? (Array.isArray(data?.embedding) ? data : null);
            setEmbeddingOutput(embeddingObj);
            setSuccessMessage("Embedding generated.");
        } catch (error) {
            handleApiError(error);
        } finally {
            setLoading(false);
        }
    };

    const embeddingPreview = useMemo(() => {
        const values = embeddingOutput?.embedding;
        if (!Array.isArray(values)) {
            return "";
        }
        return values.slice(0, 12).map((value) => Number(value).toFixed(5)).join(", ");
    }, [embeddingOutput]);

    return (
        <Box sx={{ py: 3 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                BYOC OpenAI
            </Typography>
            <Typography variant="body1" color="textSecondary" gutterBottom>
                OpenAI-compatible BYOC gateway: chat completions, image generation, and embeddings.
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {successMessage && (
                <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
                    {successMessage}
                </Typography>
            )}
            {errorMessage && (
                <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>
                    {errorMessage}
                </Typography>
            )}

            <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
                <Tab label="Chat" disabled={!chatModels || chatModels.length === 0} />
                <Tab label="Image" disabled={!imageModels || imageModels.length === 0} />
                <Tab label="Embeddings" disabled={!embeddingModels || embeddingModels.length === 0} />
            </Tabs>

            {tab === 0 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={5}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Chat Completions</Typography>
                                <form onSubmit={handleChatSubmit}>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Model</InputLabel>
                                        <Select
                                            value={chatForm.model}
                                            label="Model"
                                            onChange={(e) => setChatForm((prev) => ({ ...prev, model: e.target.value }))}
                                        >
                                            {chatModels && chatModels.length > 0 ? (
                                                chatModels.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)
                                            ) : (
                                                <MenuItem value="" disabled>No models available</MenuItem>
                                            )}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        label="System"
                                        fullWidth
                                        multiline
                                        rows={2}
                                        sx={{ mb: 2 }}
                                        value={chatForm.system}
                                        onChange={(e) => setChatForm((prev) => ({ ...prev, system: e.target.value }))}
                                    />
                                    <TextField
                                        label="Prompt"
                                        fullWidth
                                        required
                                        multiline
                                        rows={5}
                                        sx={{ mb: 2 }}
                                        value={chatForm.prompt}
                                        onChange={(e) => setChatForm((prev) => ({ ...prev, prompt: e.target.value }))}
                                    />
                                    <TextField
                                        label="Temperature"
                                        type="number"
                                        inputProps={{ min: 0, max: 2, step: 0.1 }}
                                        fullWidth
                                        sx={{ mb: 2 }}
                                        value={chatForm.temperature}
                                        onChange={(e) => setChatForm((prev) => ({ ...prev, temperature: e.target.value }))}
                                    />
                                    <TextField
                                        label="Max Tokens"
                                        type="number"
                                        inputProps={{ min: 1 }}
                                        fullWidth
                                        sx={{ mb: 2 }}
                                        value={chatForm.max_tokens}
                                        onChange={(e) => setChatForm((prev) => ({ ...prev, max_tokens: e.target.value }))}
                                    />
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Stream</InputLabel>
                                        <Select
                                            value={chatForm.stream ? "true" : "false"}
                                            label="Stream"
                                            onChange={(e) =>
                                                setChatForm((prev) => ({ ...prev, stream: e.target.value === "true" }))
                                            }
                                        >
                                            <MenuItem value="true">true</MenuItem>
                                            <MenuItem value="false">false</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Button type="submit" variant="contained" fullWidth disabled={loading}>
                                        Submit Chat
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={7}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Response</Typography>
                                {loading && !chatOutput && !chatReasoning && <CircularProgress size={22} />}
                                {chatReasoning && (
                                    <Box
                                        sx={{
                                            mb: 2,
                                            p: 1.5,
                                            borderLeft: 3,
                                            borderColor: "divider",
                                            backgroundColor: "action.hover",
                                            borderRadius: 1,
                                        }}
                                    >
                                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.5 }}>
                                            Thinking
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            component="pre"
                                            sx={{ whiteSpace: "pre-wrap", fontFamily: "inherit", m: 0 }}
                                        >
                                            {chatReasoning}
                                        </Typography>
                                    </Box>
                                )}
                                {chatOutput ? (
                                    <div dangerouslySetInnerHTML={{ __html: chatOutput }} />
                                ) : (
                                    !chatReasoning && !loading && (
                                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                                            No output yet.
                                        </Typography>
                                    )
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {tab === 1 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={5}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Image Generation</Typography>
                                <form onSubmit={handleImageSubmit}>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Model</InputLabel>
                                        <Select
                                            value={imageForm.model}
                                            label="Model"
                                            onChange={(e) => setImageForm((prev) => ({ ...prev, model: e.target.value }))}
                                        >
                                            {imageModels && imageModels.length > 0 ? (
                                                imageModels.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)
                                            ) : (
                                                <MenuItem value="" disabled>No models available</MenuItem>
                                            )}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        label="Prompt"
                                        fullWidth
                                        required
                                        multiline
                                        rows={4}
                                        sx={{ mb: 2 }}
                                        value={imageForm.prompt}
                                        onChange={(e) => setImageForm((prev) => ({ ...prev, prompt: e.target.value }))}
                                    />
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Size</InputLabel>
                                        <Select
                                            value={imageForm.size}
                                            label="Size"
                                            onChange={(e) => setImageForm((prev) => ({ ...prev, size: e.target.value }))}
                                            disabled={loading}
                                        >
                                            <MenuItem value="1024x1024">1024x1024</MenuItem>
                                            <MenuItem value="1024x1792">1024x1792</MenuItem>
                                            <MenuItem value="1792x1024">1792x1024</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        label="Count"
                                        type="number"
                                        inputProps={{ min: 1, max: 4 }}
                                        fullWidth
                                        sx={{ mb: 2 }}
                                        value={imageForm.n}
                                        onChange={(e) => setImageForm((prev) => ({ ...prev, n: e.target.value }))}
                                    />
                                    <Button type="submit" variant="contained" fullWidth disabled={loading}>
                                        Generate Image
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={7}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Images</Typography>
                                {loading && <CircularProgress size={22} />}
                                {!loading && imageOutput.length === 0 && (
                                    <Typography variant="body2">No images yet.</Typography>
                                )}
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                                    {imageOutput.map((item, index) => {
                                        const src = item?.url || (item?.b64_json ? `data:image/png;base64,${item.b64_json}` : "");
                                        if (!src) {
                                            return null;
                                        }
                                        return (
                                            <Box
                                                key={index}
                                                component="img"
                                                src={src}
                                                alt={`Generated ${index + 1}`}
                                                sx={{ width: 220, borderRadius: 1 }}
                                            />
                                        );
                                    })}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {tab === 2 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={5}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Embeddings</Typography>
                                <form onSubmit={handleEmbeddingSubmit}>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Model</InputLabel>
                                        <Select
                                            value={embeddingForm.model}
                                            label="Model"
                                            onChange={(e) => setEmbeddingForm((prev) => ({ ...prev, model: e.target.value }))}
                                        >
                                            {embeddingModels && embeddingModels.length > 0 ? (
                                                embeddingModels.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)
                                            ) : (
                                                <MenuItem value="" disabled>No models available</MenuItem>
                                            )}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        label="Input Text"
                                        fullWidth
                                        required
                                        multiline
                                        rows={6}
                                        sx={{ mb: 2 }}
                                        value={embeddingForm.input}
                                        onChange={(e) => setEmbeddingForm((prev) => ({ ...prev, input: e.target.value }))}
                                    />
                                    <Button type="submit" variant="contained" fullWidth disabled={loading}>
                                        Generate Embedding
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={7}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Embedding Output</Typography>
                                {loading ? <CircularProgress size={22} /> : (
                                    <>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            Dimensions: {embeddingOutput?.embedding?.length || 0}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1, wordBreak: "break-word" }}>
                                            Sample: {embeddingPreview || "No output yet."}
                                        </Typography>
                                        {embeddingOutput && (
                                            <Button
                                                variant="contained"
                                                size="small"
                                                sx={{ mt: 2 }}
                                                onClick={() => {
                                                    const blob = new Blob([JSON.stringify(embeddingOutput, null, 2)], { type: "application/json" });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement("a");
                                                    a.href = url;
                                                    a.download = "embedding.json";
                                                    a.click();
                                                    URL.revokeObjectURL(url);
                                                }}
                                            >
                                                Download JSON
                                            </Button>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}

export default OpenAIByoc;
