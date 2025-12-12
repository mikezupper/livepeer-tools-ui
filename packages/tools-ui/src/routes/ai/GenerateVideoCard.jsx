import React, { useState } from "react";
import {
    Button,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Card,
    CardContent,
    CardMedia,
    Box,
    LinearProgress,
    Collapse,
} from "@mui/material";
import {useObservable} from "rxjs-hooks";
import {$supportedModels} from "../../api/DataService.js";
import {floatFields, intFields} from "./utils.js";

const GenerateVideoCard = () => {
    const models = useObservable(() => $supportedModels("image-to-video"), []);

    const [formState, setFormState] = useState({
        model_id: models[0] ? models[0]: "",
        width: 1024,
        height: 576,
        noise_aug_strength: 0.065,
        motion_bucket_id: 127,
        fps: 8,
    });
    const [progress, setProgress] = useState(0);
    const [advancedOpen, setAdvancedOpen] = useState(false);

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

    const handleGenerate = () => {
        setProgress(0);
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 10;
            });
        }, 500);
    };

    return (
        <Card>
            <CardMedia
                component="img"
                alt="Card Image"
                height="140"
                style={{ backgroundColor: "#e0e0e0" }}
                title="Card Image Placeholder"
            />
            <CardContent>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGenerate}
                    fullWidth
                    sx={{ mb: 2 }}
                >
                    Generate Video
                </Button>
                {progress > 0 && progress < 100 && (
                    <LinearProgress variant="determinate" value={progress} />
                )}
                <Collapse in={advancedOpen}>
                    <Box mt={2}>
                        <Typography variant="h6">Advanced</Typography>
                        <form>
                            <FormControl fullWidth sx={{ my: 2 }}>
                                <InputLabel>Model</InputLabel>
                                <Select
                                    value={formState.model_id}
                                    onChange={handleChange}
                                >
                                    {models.length > 0 ? (
                                        models.map((modelName, index) => (
                                            <MenuItem key={index} value={modelName}  selected={formState.model_id === modelName}>
                                                {modelName}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem disabled>No models available</MenuItem>
                                    )}                                </Select>
                            </FormControl>
                            <TextField
                                label="Width"
                                name="width"
                                value={formState.width}
                                onChange={handleChange}
                                fullWidth
                                sx={{ mb: 2 }}
                                helperText="Default: 1024"
                            />
                            <TextField
                                label="Height"
                                name="height"
                                value={formState.height}
                                onChange={handleChange}
                                fullWidth
                                sx={{ mb: 2 }}
                                helperText="Default: 576"
                            />
                            <TextField
                                label="Noise Aug Strength"
                                name="noise_aug_strength"
                                value={formState.noise_aug_strength}
                                onChange={handleChange}
                                fullWidth
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                label="Motion Bucket ID"
                                name="motion_bucket_id"
                                value={formState.motion_bucket_id}
                                onChange={handleChange}
                                fullWidth
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                label="Frames Per Second"
                                name="fps"
                                value={formState.fps}
                                onChange={handleChange}
                                fullWidth
                                sx={{ mb: 2 }}
                                helperText="Default: 8"
                            />
                        </form>
                    </Box>
                </Collapse>
                <Button
                    variant="text"
                    onClick={() => setAdvancedOpen(!advancedOpen)}
                    fullWidth
                    sx={{ mt: 2 }}
                >
                    {advancedOpen ? "Hide Advanced" : "Show Advanced"}
                </Button>
            </CardContent>
        </Card>
    );
};

export default GenerateVideoCard;
