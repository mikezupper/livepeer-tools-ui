import React, { useState } from "react";
import {
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Divider,
} from "@mui/material";
import { getGatewayUrl, setGatewayUrl } from "./utils.js";
import { fetchAndStoreCapabilities } from "../../api/DataService.js";

const Settings = () => {
  const [gateway, setGateway] = useState(getGatewayUrl());
  const [useCustomGateway, setUseCustomGateway] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (event) => {
    setGateway(event.target.value);
  };

  const handleCheckboxChange = (event) => {
    setUseCustomGateway(event.target.checked);
    if (!event.target.checked) {
      setGateway("https://dream-gateway.livepeer.cloud");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!gateway) {
      setErrorMessage("Gateway URL is required.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      setGatewayUrl(gateway);
      await fetchAndStoreCapabilities();
      setSuccessMessage("Settings saved successfully!");
    } catch (error) {
      setErrorMessage("Failed to fetch capabilities. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Settings
              </Typography>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                Configure your gateway settings below.
              </Typography>
              <Divider sx={{ my: 2 }} />
              {successMessage && (
                  <Typography
                      variant="body2"
                      color="success.main"
                      sx={{ mb: 2 }}
                      role="alert"
                      id="settings-success"
                  >
                    {successMessage}
                  </Typography>
              )}
              {errorMessage && (
                  <Typography
                      variant="body2"
                      color="error.main"
                      sx={{ mb: 2 }}
                      role="alert"
                      id="settings-errors"
                  >
                    {errorMessage}
                  </Typography>
              )}
              <form onSubmit={handleSubmit}>
                <Box mb={3}>
                  <FormControl fullWidth disabled={useCustomGateway}>
                    <InputLabel>Gateway</InputLabel>
                    <Select
                        name="gateway"
                        value={gateway}
                        onChange={handleInputChange}
                        required
                        aria-label="Select Gateway"
                    >
                      <MenuItem value="https://dream-gateway.livepeer.cloud">
                        dream-gateway.livepeer.cloud
                      </MenuItem>
                      <MenuItem value="https://dream-gateway-us-west.livepeer.cloud">
                        dream-gateway-us-west.livepeer.cloud
                      </MenuItem>
                      <MenuItem value="https://dream-gateway-us-east.livepeer.cloud">
                        dream-gateway-us-east.livepeer.cloud
                      </MenuItem>
                      <MenuItem value="https://dream-gateway-eu-central.livepeer.cloud">
                        dream-gateway-eu-central.livepeer.cloud
                      </MenuItem>
                    </Select>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Default: https://dream-gateway.livepeer.cloud - The recommended
                      gateway closest to your region.
                    </Typography>
                  </FormControl>
                </Box>
                <FormControlLabel
                    control={
                      <Checkbox
                          checked={useCustomGateway}
                          onChange={handleCheckboxChange}
                          aria-label="Use Custom Gateway"
                      />
                    }
                    label="Use Custom Gateway URL"
                />
                {useCustomGateway && (
                    <Box mt={2}>
                      <TextField
                          label="Custom Gateway URL"
                          name="gateway"
                          value={gateway}
                          onChange={handleInputChange}
                          fullWidth
                          required
                          helperText="Enter a custom gateway URL"
                      />
                    </Box>
                )}
                <Box mt={3}>
                  <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      disabled={loading}
                      aria-label="Save Settings"
                  >
                    {loading ? (
                        <CircularProgress size={24} sx={{ color: "white" }} />
                    ) : (
                        "Save Settings"
                    )}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
  );
};

export default Settings;
