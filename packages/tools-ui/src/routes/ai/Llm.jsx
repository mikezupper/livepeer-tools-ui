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
    CircularProgress,
    Box,
    Divider,
} from "@mui/material";
import { useObservable } from "rxjs-hooks";
import { $supportedModels } from "../../api/DataService.js";
import { marked } from "marked";
import {getGatewayUrl, getBearerToken, intFields, floatFields} from "./utils.js";

const Llm = () => {
    const [formState, setFormState] = useState({
        system: "",
        prompt: "",
        model_id: "",
        max_tokens: 256,
        stream: true,
    });
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [output, setOutput] = useState("");
    const models = useObservable(() => $supportedModels("Llm"), []);
    // Update the model_id once models are loaded
    React.useEffect(() => {
        if (models.length > 0 && !formState.model_id) {
            setFormState((prevState) => ({
                ...prevState,
                model_id: models[0],
            }));
        }
    }, [models]);
    const handleChange = (event) => {
        const { name, value } = event.target;
     //   console.log("handleChange ",formState.stream === "true",name, value,formState)
        setFormState((prevState) => ({
            ...prevState,
            [name]: name === "stream"
                ? value === "true"
                : intFields.includes(name)
                    ? (value && parseInt(value, 10))
                    : floatFields.includes(name)
                        ? (value && parseFloat(value))
                        : value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");
        setOutput("");
    //console.log("onSubmit ",formState.stream,formState)
        const payload = {
            model: formState.model_id,
            messages: [
                {
                    role: "system",
                    content: formState.system || "",
                },
                {
                    role: "user",
                    content: formState.prompt,
                },
            ],
            max_tokens: parseInt(formState.max_tokens, 10),
            stream: formState.stream,
        };

        try {
            const response = await fetch(`${getGatewayUrl()}/llm`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getBearerToken()}`,
                    Accept: formState.stream? "text/event-stream" : "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (response.status === 429) {
                throw new Error("Too many requests. Please try again shortly.");
            }
            if (response.status !== 200) {
                throw new Error("Failed processing your AI request.");
            }
            if (formState.stream) {
                if (!response.body) {
                    throw new Error("ReadableStream not supported in this browser.");
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                let accumulatedContent = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    let lines = buffer.split("\n");
                    buffer = lines.pop();

                    for (let line of lines) {
                        line = line.trim();
                        if (!line.startsWith("data:")) continue;
                        const dataStr = line.slice(5).trim();
                        if (dataStr === "[DONE]") continue;

                        try {
                            const parsed = JSON.parse(dataStr);
                            const choices = parsed?.choices;
                            if (choices && choices[0]?.delta?.content) {
                                let content = choices[0].delta.content.replace(
                                    /<\|start_header_id\|>assistant<\|end_header_id\|>/g,
                                    ""
                                );
                                accumulatedContent += content;
                            }
                        } catch (e) {
                            console.error("Error parsing SSE data", e);
                        }
                    }

                    const cleanedOutput = accumulatedContent.replace(
                        /<\|start_header_id\|>assistant<\|end_header_id\|>/g,
                        ""
                    );
                    setOutput(marked(cleanedOutput));
                }
            } else {
                if (!response.ok) {
                    throw new Error("Failed to fetch the response.");
                }

                const responseData = await response.json();
                const choices = responseData?.choices;

                if (choices && choices[0]) {
                    let content = choices[0].message?.content || choices[0]?.delta?.content;

                    if (!content) {
                        throw new Error("Invalid response format.");
                    }
                    const cleanedOutput = content.replace(
                        /<\|start_header_id\|>assistant<\|end_header_id\|>/g,
                        ""
                    );
                    setOutput(marked(cleanedOutput));
                } else {
                    throw new Error("Invalid response format.");
                }
            }

            setLoading(false);
            setSuccessMessage("Request successful!");
        } catch (err) {
            // console.error("Failed generating LLM output", err);
            setErrorMessage(`Something went wrong [${err }]`);
            setLoading(false);
        }

        setTimeout(() => {
            setSuccessMessage("");
            setErrorMessage("");
        }, 5000);
    };

   // console.log("LLM ",formState.stream,formState)
    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Card elevation={3} sx={{ borderRadius: 2 }}>
                    <CardContent>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Ask an LLM
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            Enter your message and parameters to interact with the LLM.
                        </Typography>
                        <Divider sx={{ my: 2 }} />
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
                        <form onSubmit={handleSubmit}>
                            <TextField
                                label="System Message"
                                name="system"
                                value={formState.system}
                                onChange={handleChange}
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="Enter system message"
                                sx={{ mb: 3 }}
                            />
                            <TextField
                                label="Prompt"
                                name="prompt"
                                value={formState.prompt}
                                onChange={handleChange}
                                fullWidth
                                required
                                multiline
                                rows={4}
                                placeholder="Type in your prompt"
                                sx={{ mb: 3 }}
                            />
                            <Box sx={{ position: "relative", mb: 3 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    disabled={loading}
                                >
                                    {loading ? "Loading..." : "Ask"}
                                </Button>
                                {loading && (
                                    <CircularProgress
                                        size={24}
                                        sx={{
                                            color: "white",
                                            position: "absolute",
                                            top: "50%",
                                            left: "50%",
                                            marginTop: "-12px",
                                            marginLeft: "-12px",
                                        }}
                                    />
                                )}
                            </Box>

                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <InputLabel>Model</InputLabel>
                                <Select
                                    name="model_id"
                                    value={formState.model_id}
                                    onChange={handleChange}
                                    required
                                >
                                    {models && models.length > 0 ? (
                                        models.map((modelName, index) => (
                                            <MenuItem key={index} value={modelName}>
                                                {modelName}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem disabled value="">
                                            No models available
                                        </MenuItem>
                                    )}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Max Tokens"
                                name="max_tokens"
                                value={formState.max_tokens}
                                onChange={handleChange}
                                type="number"
                                fullWidth
                                required
                                sx={{ mb: 3 }}
                            />
                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <InputLabel>Stream</InputLabel>
                                <Select
                                    name="stream"
                                    value={formState.stream}
                                    onChange={handleChange}
                                    required
                                >
                                    <MenuItem value={"true"}>
                                        true
                                    </MenuItem>
                                    <MenuItem value={"false"}>
                                        false
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </form>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={6}>
                <Card elevation={3} sx={{ borderRadius: 2 }}>
                    <CardContent>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Output
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            {output ? (
                                <div dangerouslySetInnerHTML={{ __html: output }} />
                            ) : (
                                <Typography variant="body2" color="textSecondary">
                                    No output yet
                                </Typography>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

export default Llm;
