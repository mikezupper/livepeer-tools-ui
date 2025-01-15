import React, {useState} from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import {useObservable} from "rxjs-hooks";
import {$supportedModels} from "../../api/DataService.js";
import {getBearerToken, getGatewayUrl} from "./utils.js";

const TextToSpeech = () => {
    const [formState, setFormState] = useState({
        text: "",
        model_id: "",
        description: "",
    });
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [output, setOutput] = useState("");
    const models = useObservable(() => $supportedModels("Text to speech"), []);
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
        const {name, value} = event.target;
        setFormState((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setSuccessMessage("");
        setErrorMessage("");
        setOutput("")

        let errors = [];
        const {text, model_id} = formState;
        if (!text.trim()) errors.push("Please enter a text.");
        if (!model_id.trim()) errors.push("Please enter a model.");

        if (errors.length > 0) {
            setErrorMessage(errors.join("\n"));
            setLoading(false);
            return;
        }

        try {
            let response = await fetch(`${getGatewayUrl()}/text-to-speech`, {
                method: "POST",
                mode: "cors",
                cache: "no-cache",
                body: JSON.stringify(formState),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getBearerToken()}`
                },
            })
            const data = await response.json();

            if (data.error) {
                setErrorMessage("failed generating audio, please try again");
                setLoading(false);
                return;
            }
            const {audio} = data;
            let asset_url = audio.url;
            if (asset_url.startsWith("http") === false)
                asset_url = `${getGatewayUrl()}${audio.url}`;
            setOutput(asset_url);
        } catch (error) {
            console.error("[TextToSpeech] handleSubmit error:", error);
            setErrorMessage("Failed to generate text, please try again.");
            setOutput("")
        } finally {
            setLoading(false);
        }

    };
    return (
        <Box sx={{py: 3}}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Text to Speech
            </Typography>
            <Typography variant="body1" color="textSecondary" gutterBottom>
                Enter your text, select a model, and generate speech output.
            </Typography>
            <Divider sx={{mb: 3}}/>
            <Grid container spacing={3}>
                {/* Input Section */}
                <Grid item xs={12} md={6}>
                    <Card elevation={3} sx={{borderRadius: 2}}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Input Configuration
                            </Typography>
                            {successMessage && (
                                <Typography variant="body2" color="success.main" sx={{mt: 2}}>
                                    {successMessage}
                                </Typography>
                            )}
                            {errorMessage && (
                                <Typography variant="body2" color="error.main" sx={{mt: 2}}>
                                    {errorMessage}
                                </Typography>
                            )}
                            <form onSubmit={handleSubmit}>
                                <TextField
                                    label="Text"
                                    name="text"
                                    value={formState.text}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    multiline
                                    rows={4}
                                    placeholder="Type in your text"
                                    inputProps={{maxLength: 600}}
                                    sx={{my: 2}}
                                />
                                <FormControl fullWidth sx={{mb: 2}}>
                                    <InputLabel>Model</InputLabel>
                                    <Select
                                        name="model_id"
                                        value={formState.model_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        {models.length > 0 ? (
                                            models.map((modelName, index) => (
                                                <MenuItem key={index} value={modelName}
                                                          selected={formState.model_id === modelName}>
                                                    {modelName}
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled>No models available</MenuItem>
                                        )}
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Description"
                                    name="description"
                                    value={formState.description}
                                    onChange={handleChange}
                                    fullWidth
                                    placeholder="E.g., A male speaker delivers a slightly expressive and animated speech with a moderate speed and pitch."
                                    sx={{mb: 2}}
                                />
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    disabled={loading}
                                >
                                    Generate
                                </Button>
                                {loading && <LinearProgress sx={{mt: 2}}/>}
                            </form>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Output Section */}
                <Grid item xs={12} md={6}>
                    <Card elevation={3} sx={{borderRadius: 2}}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Speech Output
                            </Typography>
                            <Box
                                sx={{
                                    mt: 2,
                                    minHeight: 150,
                                    border: "1px dashed #ccc",
                                    padding: 2,
                                    backgroundColor: "#f9f9f9",
                                }}
                            >
                                {output ? (<audio controls>
                                        <source src={output} type="audio/wav"/>
                                        Your browser does not support the audio element.</audio>)
                                    : (<Typography variant="body2" color="textSecondary">Generated speech will appear
                                        here.</Typography>)}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default TextToSpeech;
