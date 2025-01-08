import React, {Suspense} from 'react';
import ReactDOM from 'react-dom/client';
import {createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate} from 'react-router-dom';
import App from './App';
import Gateways from './routes/Gateways.jsx';
import {Box, CircularProgress} from "@mui/material";
import Orchestrators from "./routes/Orchestrators.jsx";
import Reports from "./routes/Reports.jsx";
import Home from "./routes/Home.jsx";
import PayoutSummaryReport from "./routes/PayoutSummaryReport.jsx";
import Typography from "@mui/material/Typography";
import TopPayoutReport from "./routes/TopPayoutReport.jsx";
import Orchestrator from "./routes/Orchestrator.jsx";
import VotingHistoryList from "./routes/VotingHistoryList.jsx";
import Stats from "./routes/Stats.jsx";
import Leaderboard from "./routes/Leaderboard.jsx";
import {
    dailyPayoutReportLoader, gatewayLoader,
    gatewaysLoader, leaderboardLoader, monthlyPayoutReportLoader,
    orchestratorLoader,
    orchestratorsLoader, proposalLoader, statsLoader, topPayoutReportLoader,
    weeklyPayoutReportLoader
} from "./loaders/index.js";
import Gateway from "./routes/Gateway.jsx";
import AILayout from "./routes/ai/AILayout.jsx";
import AIGenerator from "./routes/ai/AIGenerator.jsx";
import TextToImage from "./routes/ai/TextToImage.jsx";
import TextToSpeech from "./routes/ai/TextToSpeech.jsx";
import ImageToImage from "./routes/ai/ImageToImage.jsx";
import ImageToText from "./routes/ai/ImageToText.jsx";
import UpscaleImage from "./routes/ai/UpscaleImage.jsx";
import ImageToVideo from "./routes/ai/ImageToVideo.jsx";
import AudioToText from "./routes/ai/AudioToText.jsx";
import SegmentAnything2 from "./routes/ai/SegmentAnything2.jsx";
import Llm from "./routes/ai/Llm.jsx";
import NetworkCapabilities from "./routes/ai/NetworkCapabilities.jsx";
import Settings from "./routes/ai/Settings.jsx";
const currentDate = new Date().toISOString().split('T')[0];
const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path="/" element={<App />}>
            <Route
                index
                element={<Home />}
                hydrateFallbackElement={<CircularProgress />}
            />
            <Route
                index
                path="orchestrators"
                element={<Orchestrators />}
                loader={orchestratorsLoader}
                hydrateFallbackElement={<CircularProgress />}
            />
            <Route
                index
                path="orchestrator/:eth_address"
                element={<Orchestrator />}
                loader={orchestratorLoader}
                hydrateFallbackElement={<CircularProgress />}
            />
            <Route
                index
                path="gateways"
                element={<Gateways />}
                loader={gatewaysLoader}
                hydrateFallbackElement={<CircularProgress />}
            />
            <Route
                index
                path="broadcasters"
                element={<Gateways />}
                loader={gatewaysLoader}
                hydrateFallbackElement={<CircularProgress />}
            />
            <Route
                index
                path="broadcaster/:eth_address"
                element={<Gateway />}
                loader={gatewayLoader}
                hydrateFallbackElement={<CircularProgress />}
            />
            <Route
                index
                path="gateway/:eth_address"
                element={<Gateway />}
                loader={gatewayLoader}
                hydrateFallbackElement={<CircularProgress />}
            />
            <Route
                index
                path="reports"
                element={<Reports />}
                hydrateFallbackElement={<CircularProgress />}
            />
            <Route
                path="reports/daily"
                element={<Navigate to={`/reports/daily/${currentDate}`} replace />}
                hydrateFallbackElement={<CircularProgress />}
            />
            <Route
                path="reports/weekly"
                element={<Navigate to={`/reports/monthly/${currentDate}`} replace />}
                hydrateFallbackElement={<CircularProgress />}
                />
            <Route
                path="reports/monthly"
                element={<Navigate to={`/reports/monthly/${currentDate}`} replace />}
                hydrateFallbackElement={<CircularProgress />}
            />

            <Route
                index
                path="reports/daily/:date"
                element={<PayoutSummaryReport report_type={`Daily`}/>}
                loader={dailyPayoutReportLoader}
                hydrateFallbackElement={<CircularProgress />}
            />
            <Route
                index
                path="reports/weekly/:date"
                element={<PayoutSummaryReport report_type={`Weekly`}/>}
                loader={weeklyPayoutReportLoader}
                hydrateFallbackElement={<CircularProgress />}
            />

            <Route
                index
                path="reports/monthly/:date"
                element={<PayoutSummaryReport report_type={`Monthly`}/>}
                loader={monthlyPayoutReportLoader}
                hydrateFallbackElement={<CircularProgress />}
            />
            <Route
                index
                path="reports/top/payout"
                element={<TopPayoutReport/>}
                loader={topPayoutReportLoader}
                hydrateFallbackElement={<CircularProgress />}
            />

            <Route
                index
                path   ="vote/history"
                element={<VotingHistoryList />}
                loader={proposalLoader}
                hydrateFallbackElement={<CircularProgress />}
            />

            <Route
                path="performance/leaderboard"
                element={<Leaderboard />}
                loader={leaderboardLoader}
                hydrateFallbackElement={<CircularProgress />}
            />
            <Route
                path="performance/stats"
                element={<Stats />}
                loader={statsLoader}
                hydrateFallbackElement={<CircularProgress />}
            />
            <Route path="ai" element={<AILayout />}>
                <Route path="generator" element={<AIGenerator />} />
                <Route path="text-to-image" element={<TextToImage />} />
                <Route path="image-to-image" element={<ImageToImage />} />
                <Route path="image-to-video" element={<ImageToVideo />} />
                <Route path="image-to-text" element={<ImageToText />} />
                <Route path="upscale" element={<UpscaleImage />} />
                <Route path="llm" element={<Llm />} />
                <Route path="settings" element={<Settings />} />
                <Route path="network-capabilities" element={<NetworkCapabilities />} />
                <Route path="segment-anything-2" element={<SegmentAnything2 />} />
                <Route path="audio-to-text" element={<AudioToText />} />
                <Route path="text-to-speech" element={<TextToSpeech />} />
            </Route>
            {/* Catch-all route for undefined paths */}
            <Route
                path="*"
                element={
                    <Box p={4}>
                        <Typography variant="h4">404 - Not Found</Typography>
                        <Typography variant="body1">
                            The page you are looking for does not exist.
                        </Typography>
                    </Box>
                }>
            </Route>
        </Route>
    )
);
ReactDOM.createRoot(document.getElementById('root')).render(<RouterProvider router={router} />);
