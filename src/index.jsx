import React, {Suspense} from 'react';
import ReactDOM from 'react-dom/client';
import {createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate} from 'react-router-dom';
import App from './App';
import Gateways from './routes/Gateways.jsx';
import DataService from './api/DataService';
import {Box, CircularProgress} from "@mui/material";
import Orchestrators from "./routes/Orchestrators.jsx";
import Reports from "./routes/Reports.jsx";
import Home from "./routes/Home.jsx";
import PayoutSummaryReport from "./routes/PayoutSummaryReport.jsx";
import Typography from "@mui/material/Typography";
import TopPayoutReport from "./routes/TopPayoutReport.jsx";
import Orchestrator from "./routes/Orchestrator.jsx";
import {API_BASE_URL} from "./config.js";
import VotingHistoryList from "./VotingHistoryList.jsx";
import Stats from "./routes/Stats.jsx";
import Leaderboard from "./routes/Leaderboard.jsx";

console.log("init data services")
await DataService.init();

//load reference data
const leaderboardLoader=async () => {
    console.log(`[index] leaderboardLoader loading...`);
    const regions = await DataService.fetchRegions();
    const pipelines = await DataService.fetchPipelines();
    console.log(`[index] leaderboardLoader completed.`);
    return {regions, pipelines};
}

const statsLoader=async () => {
    console.log(`[index] statsLoader loading...`);
    const pipelines = await DataService.fetchPipelines();
    console.log(`[index] statsLoader completed.`);
    return {pipelines};
}

const proposalLoader=async () => {
    console.log(`[index] proposalLoader loading...`);
    const proposals = await DataService.getProposals();
    // Convert proposals object to an array of [proposalId, proposalData]
    let proposalEntries = Object.values(proposals);
    // Sort by timestamp (descending)
    proposalEntries.sort((a, b) => b.createdAt - a.createdAt);

    console.log(`[index] proposalLoader completed.`);
    return {proposals,proposalList:proposalEntries};
}


const gatewayLoader=async () => {
    console.log(`[index] gatewayLoader loading...`);
    const gateways = await DataService.fetchData(`${API_BASE_URL}/api/gateways`);
    console.log(`[index] leaderboardLoader completed.`);
    return {gateways};
}


const dailyPayoutReportLoader=async ({ params }) => {
    console.log(`[index] dailyPayoutReportLoader loading...`,params);
    const { date } = params;
    const payoutData = await DataService.fetchData(`${API_BASE_URL}/api/payout/daily/${date}`);
    console.log(`[index] dailyPayoutReportLoader completed.`);
    return payoutData;
}

const weeklyPayoutReportLoader=async ({ params }) => {
    console.log(`[index] weeklyPayoutReportLoader loading...`,params);
    const { date } = params;
    const payoutData = await DataService.fetchData(`${API_BASE_URL}/api/payout/weekly/${date}`);
    console.log(`[index] weeklyPayoutReportLoader completed.`);
    return payoutData;
}

const monthlyPayoutReportLoader=async ({ params }) => {
    console.log(`[index] monthlyPayoutReportLoader loading...`,params);
    const { date } = params;
    const payoutData = await DataService.fetchData(`${API_BASE_URL}/api/payout/monthly/${date}`);
    console.log(`[index] monthlyPayoutReportLoader completed.`);
    return payoutData;
}
const topPayoutReportLoader=async ({ params }) => {
    console.log(`[index] topPayoutReportLoader loading...`,params);
    // const { date } = params;
    // const payoutData = await DataService.fetchData(`${API_BASE_URL}/api/payout/monthly/${date}`);
    console.log(`[index] topPayoutReportLoader completed.`);
    return [];
}

const orchestratorsLoader=async () => {
    console.log(`[index] orchestratorLoader loading...`);
    const orchestrators = await DataService.fetchData(`${API_BASE_URL}/api/orchestrator`);
    console.log(`[index] orchestratorLoader completed.`);
    return {orchestrators};
}
const orchestratorLoader=async ({params}) => {
    console.log(`[index] orchestratorLoader loading...`,params);
    const { eth_address } = params;
    const orchestrator = await DataService.fetchData(`${API_BASE_URL}/api/orchestrator/${eth_address}`);
    console.log(`[index] orchestratorLoader completed.`);
    return {orchestrator};
}

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
                loader={gatewayLoader}
                hydrateFallbackElement={<CircularProgress />}
            />
            <Route
                index
                path="reports"
                element={<Reports />}
                // loader={gatewayLoader}
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
