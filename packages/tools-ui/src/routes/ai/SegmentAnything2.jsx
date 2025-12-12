import React, { useState, useRef, useEffect } from "react";
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
    Box,
    Checkbox,
    FormControlLabel,
    LinearProgress,
} from "@mui/material";
import { useObservable } from "rxjs-hooks";
import { $supportedModels } from "../../api/DataService.js";
import { Stage, Layer, Image as KonvaImage, Rect, Circle } from "react-konva";
import useImage from "use-image";
import {floatFields, getBearerToken, getGatewayUrl, intFields} from "./utils.js";

const MaskedImageCanvas = ({ maskData, imageFile }) => {
    const canvasRef = useRef(null);
    const desiredOutputWidth = 500; // Maximum display width for output images

    useEffect(() => {
        if (!imageFile || !maskData) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const reader = new FileReader();

        reader.onload = function (event) {
            const img = new Image();
            img.src = event.target.result;

            img.onload = function () {
                const width = img.width;
                const height = img.height;
                canvas.width = width;
                canvas.height = height;

                // Draw the image on the canvas
                ctx.drawImage(img, 0, 0, width, height);
                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;

                // Apply transparent red tint based on the mask data
                for (let y = 0; y < maskData.length; y++) {
                    for (let x = 0; x < maskData[0].length; x++) {
                        const pixelIndex = (y * width + x) * 4;
                        const maskValue = maskData[y][x];
                        if (maskValue > 0.5) {
                            const originalRed = data[pixelIndex];
                            const originalGreen = data[pixelIndex + 1];
                            const originalBlue = data[pixelIndex + 2];
                            const redTint = 255;
                            const alpha = 0.4;

                            data[pixelIndex] = originalRed * (1 - alpha) + redTint * alpha;
                            data[pixelIndex + 1] = originalGreen * (1 - alpha);
                            data[pixelIndex + 2] = originalBlue * (1 - alpha);
                            data[pixelIndex + 3] = 255;
                        }
                    }
                }
                ctx.putImageData(imageData, 0, 0);
            };
        };

        reader.readAsDataURL(imageFile);
    }, [maskData, imageFile]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                margin: "10px 0",
                maxWidth: desiredOutputWidth + "px", // Limit maximum width
                width: "100%",                        // Responsive width scaling
                height: "auto",                       // Maintain aspect ratio
            }}
        />
    );
};

const SegmentAnything2 = () => {
    const [formState, setFormState] = useState({
        model_id: "",
        usePoint: false,
        point_coords: "",
        point_labels: "",
        box: "",
        mask_input: "",
        multimask_output: "true",
        return_logits: "false",
        normalize_coords: "true",
        safety_check: "false",
        seed: "",
    });
    const [file, setFile] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const models = useObservable(() =>$supportedModels("segment-anything-2"),[]);
// Update the model_id once models are loaded
    React.useEffect(() => {
        if (models.length > 0 && !formState.model_id) {
            setFormState((prevState) => ({
                ...prevState,
                model_id: models[0],
            }));
        }
    }, [models]);
    const [imageURL, setImageURL] = useState(null);
    const [image] = useImage(imageURL);
    const [rectProps, setRectProps] = useState(null);
    const [point, setPoint] = useState(null);
    const [startCoords, setStartCoords] = useState(null);
    const [outputMasks, setOutputMasks] = useState([]);

    // Define desired preview width
    const desiredWidth = 500;
    let scaleFactor = 1;
    let stageWidth = 0;
    let stageHeight = 0;

    if (image) {
        if (image.width > desiredWidth) {
            scaleFactor = desiredWidth / image.width;
            stageWidth = desiredWidth;
            stageHeight = image.height * scaleFactor;
        } else {
            stageWidth = image.width;
            stageHeight = image.height;
        }
    }

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImageURL(e.target.result);
                setRectProps(null);
                setPoint(null);
                setFormState((prev) => ({
                    ...prev,
                    box: "",
                    point_coords: "",
                    point_labels: "",
                }));
                setOutputMasks([]);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const adjustPointerPosition = (e) => {
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        if (pos) {
            return {
                x: pos.x / scaleFactor,
                y: pos.y / scaleFactor,
            };
        }
        return null;
    };

    const handleStageMouseDown = (e) => {
        if (!formState.usePoint) {
            const pointerPosition = adjustPointerPosition(e);
            if (pointerPosition) {
                setStartCoords({ x: pointerPosition.x, y: pointerPosition.y });
                setRectProps(null);
            }
        }
    };

    const handleStageMouseUp = (e) => {
        if (!formState.usePoint && startCoords) {
            const pointerPosition = adjustPointerPosition(e);
            if (pointerPosition) {
                const { x: endX, y: endY } = pointerPosition;
                const newRect = {
                    x: startCoords.x,
                    y: startCoords.y,
                    width: endX - startCoords.x,
                    height: endY - startCoords.y,
                    stroke: "red",
                    strokeWidth: 2,
                };
                setRectProps(newRect);
                const boxCoords = `[${startCoords.x.toFixed(2)}, ${startCoords.y.toFixed(
                    2
                )}, ${endX.toFixed(2)}, ${endY.toFixed(2)}]`;
                setFormState((prev) => ({
                    ...prev,
                    box: boxCoords,
                }));
            }
        }
    };

    const handleStageClick = (e) => {
        if (formState.usePoint) {
            const pointerPosition = adjustPointerPosition(e);
            if (pointerPosition) {
                const { x, y } = pointerPosition;
                setPoint({ x, y, radius: 5, fill: "red" });
                setFormState((prev) => ({
                    ...prev,
                    point_coords: `[[${x.toFixed(2)},${y.toFixed(2)}]]`,
                    point_labels: "[0]",
                }));
            }
        }
    };

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormState((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
            point_coords:
                type === "checkbox" && name === "usePoint" ? "" : prev.point_coords,
            point_labels:
                type === "checkbox" && name === "usePoint" ? "" : prev.point_labels,
            box: type === "checkbox" && name === "usePoint" ? "" : prev.box,
            [name]: intFields.includes(name)
                ? (value && parseInt(value, 10))
                : floatFields.includes(name)
                    ? (value && parseFloat(value))
                    : value,
        }));

        setRectProps(null);
        setPoint(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setErrorMessage("");
        setOutputMasks([]);

        const errors = [];
        if (!file) {
            errors.push("image must be uploaded");
        }
        if (errors.length > 0) {
            setErrorMessage("Errors occurred:\n" + errors.join("\n"));
            setLoading(false);
            return;
        }

        let safety_check = formState.safety_check === "true";
        let multimask_output = formState.multimask_output === "true";
        let return_logits = formState.return_logits === "true";
        let normalize_coords = formState.normalize_coords === "true";

        let body = new FormData();
        body.append("image", file);
        body.append("model_id", formState.model_id);
        if (formState.point_coords !== "") {
            body.append("point_coords", formState.point_coords);
        }
        if (formState.point_labels !== "") {
            body.append("point_labels", formState.point_labels);
        }
        if (formState.box !== "") {
            body.append("box", formState.box);
        }
        if (formState.mask_input !== "") {
            body.append("mask_input", formState.mask_input);
        }

        body.append("multimask_output", multimask_output);
        body.append("return_logits", return_logits);
        body.append("normalize_coords", normalize_coords);
        body.append("safety_check", safety_check);
        if(formState.seed === "")
            delete formState.seed;

        if (formState.seed && formState.seed !== "") {
            body.append("seed", formState.seed);
        }

        try {
            const response = await fetch(`${getGatewayUrl()}/segment-anything-2`, {
                method: "POST",
                mode: "cors",
                cache: "no-cache",
                headers: {
                    Authorization: `Bearer ${getBearerToken()}`,
                },
                body,
            });
            if (response.status === 429) {
                throw new Error("Too many requests. Please try again shortly.");
            }
            if (response.status !== 200) {
                throw new Error("Failed processing your AI request.");
            }
            const data = await response.json();
            // console.log("[SegmentAnything2] RESPONSE ", data);

            if (data.error) {
                setErrorMessage("Failed generating an image, please try again");
            } else {
                const masks = JSON.parse(data.masks);
                const scores = JSON.parse(data.scores);
                const threshold = 0.17;
                const filteredMasks = masks.filter((mask, index) => scores[index] >= threshold);
                const topN = 10;
                const topMasks = filteredMasks.slice(0, topN);

                setOutputMasks(topMasks);
            }
        } catch (err) {
            setErrorMessage(`Something went wrong [${err }]`);
        } finally {
            setLoading(false);
        }

        setTimeout(() => {
            setErrorMessage("");
        }, 5000);
    };

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <Card>
                    <CardContent>
                        <Typography variant="h6">Upload your image and click Segment Anything 2</Typography>
                        <Box mt={2}>
                            <Typography variant="body2">
                                <p>To segment an image:</p>
                                <ol>
                                    <li>First upload your image.</li>
                                    <li>Draw a "box" around the section of the uploaded image you would like to segment.</li>
                                    <li>
                                        If you don't want to draw a box, check the "Use Point" checkbox. This changes drawing a box to selecting a dot anywhere on the image to segment.
                                    </li>
                                    <li>
                                        Once you have selected a section of the image (either a box or point), click the "Segment Anything 2" button.
                                    </li>
                                    <li>Your original image will be displayed with the selected region highlighted.</li>
                                </ol>
                            </Typography>
                        </Box>
                        {errorMessage && (
                            <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>
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
                                sx={{ mb: 2, mt: 2 }}
                                disabled={loading}
                            >
                                {loading ? "Processing..." : "Segment Anything 2"}
                            </Button>
                            {loading && <LinearProgress sx={{ mb: 2, mt: 2 }} />}
                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel>Model</InputLabel>
                                <Select
                                    name="model_id"
                                    value={formState.model_id}
                                    onChange={handleChange}
                                    required
                                >
                                    {models.map((modelName, index) => (
                                        <MenuItem key={index} value={modelName}>
                                            {modelName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Box mt={2}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name="usePoint"
                                            checked={formState.usePoint}
                                            onChange={handleChange}
                                        />
                                    }
                                    label="Use Point"
                                />
                            </Box>

                            {formState.usePoint ? (
                                <>
                                    <TextField
                                        label="Point Coordinates"
                                        name="point_coords"
                                        value={formState.point_coords}
                                        onChange={handleChange}
                                        fullWidth
                                        sx={{ mt: 2 }}
                                    />
                                    <TextField
                                        label="Point Labels"
                                        name="point_labels"
                                        value={formState.point_labels}
                                        onChange={handleChange}
                                        fullWidth
                                        sx={{ mt: 2 }}
                                    />
                                </>
                            ) : (
                                <TextField
                                    label="Box"
                                    name="box"
                                    value={formState.box}
                                    onChange={handleChange}
                                    fullWidth
                                    sx={{ mt: 2 }}
                                />
                            )}
                            <TextField
                                label="Mask Input"
                                name="mask_input"
                                value={formState.mask_input}
                                onChange={handleChange}
                                fullWidth
                                sx={{ my: 2 }}
                            />
                            <FormControl fullWidth sx={{ my: 2 }}>
                                <InputLabel>Multimask Output</InputLabel>
                                <Select
                                    name="multimask_output"
                                    value={formState.multimask_output}
                                    onChange={handleChange}
                                    required
                                >
                                    <MenuItem value="true">True</MenuItem>
                                    <MenuItem value="false">False</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth sx={{ my: 2 }}>
                                <InputLabel>Return Logits</InputLabel>
                                <Select
                                    name="return_logits"
                                    value={formState.return_logits}
                                    onChange={handleChange}
                                    required
                                >
                                    <MenuItem value="true">True</MenuItem>
                                    <MenuItem value="false">False</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth sx={{ my: 2 }}>
                                <InputLabel>Normalize Coords</InputLabel>
                                <Select
                                    name="normalize_coords"
                                    value={formState.normalize_coords}
                                    onChange={handleChange}
                                    required
                                >
                                    <MenuItem value="true">True</MenuItem>
                                    <MenuItem value="false">False</MenuItem>
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
                                sx={{ my: 2 }}
                            />
                        </form>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={6}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Your Uploaded Image
                        </Typography>
                        {image && (
                            <Stage
                                width={stageWidth}
                                height={stageHeight}
                                scaleX={scaleFactor}
                                scaleY={scaleFactor}
                                onMouseDown={handleStageMouseDown}
                                onMouseUp={handleStageMouseUp}
                                onClick={handleStageClick}
                            >
                                <Layer>
                                    <KonvaImage image={image} />
                                    {rectProps && <Rect {...rectProps} />}
                                    {point && <Circle {...point} />}
                                </Layer>
                            </Stage>
                        )}
                    </CardContent>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Your Selected Image Output
                        </Typography>
                        {outputMasks.length > 0 ? (
                            outputMasks.map((mask, index) => (
                                <MaskedImageCanvas key={index} maskData={mask} imageFile={file} />
                            ))
                        ) : (
                            <Typography variant="body2">
                                No segmented outputs yet.
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

export default SegmentAnything2;
