import DataService from "../api/DataService.js";
import {API_BASE_URL} from "../config.js";
import moment from "moment";

(async () => {
    //console.log("init data services");
    await DataService.init();
})();

//load reference data
export const leaderboardLoader=async () => {
    //console.log(`[index] leaderboardLoader loading...`);
    const regions = await DataService.fetchRegions();
    const pipelines = await DataService.fetchPipelines();
    //console.log(`[index] leaderboardLoader completed.`);
    return {regions, pipelines};
}
export const statsLoader=async () => {
    //console.log(`[index] statsLoader loading...`);
    const pipelines = await DataService.fetchPipelines();
    //console.log(`[index] statsLoader completed.`);
    return {pipelines};
}
export const proposalLoader=async () => {
    //console.log(`[index] proposalLoader loading...`);
    const proposals = await DataService.getProposals();
    // Convert proposals object to an array of [proposalId, proposalData]
    let proposalEntries = Object.values(proposals);
    // Sort by timestamp (descending)
    proposalEntries.sort((a, b) => b.createdAt - a.createdAt);

    //console.log(`[index] proposalLoader completed.`);
    return {proposals,proposalList:proposalEntries};
}

export const gatewaysLoader=async () => {
    //console.log(`[index] gatewayLoader loading...`);
    const gateways = await DataService.fetchData(`${API_BASE_URL}/api/gateways`);
    //console.log(`[index] leaderboardLoader completed.`);
    return {gateways};
}
export const gatewayLoader=async ({params}) => {
    //console.log(`[index] gatewayLoader loading...`,params);
    const { eth_address } = params;
    const gateway = await DataService.fetchData(`${API_BASE_URL}/api/gateway/${eth_address}`);
    //console.log(`[index] gatewayLoader completed.`);
    return {gateway};
}
export const dailyPayoutReportLoader = async ({ params, request }) => {
    //console.log(`[index] dailyPayoutReportLoader loading...`, params);
    const { date } = params;

    // Get job_type from URL
    const url = new URL(request.url);
    const jobType = url.searchParams.get('job_type') || 'both';

    const payoutData = await DataService.fetchData(`${API_BASE_URL}/api/payout/daily/${date}?job_type=${jobType}`);
    //console.log(`[index] dailyPayoutReportLoader completed.`);
    return payoutData;
}
export const weeklyPayoutReportLoader = async ({ params, request }) => {
   // console.log(`[index] weeklyPayoutReportLoader loading...`, params);
    const { date } = params;

    // Get job_type from URL
    const url = new URL(request.url);
    const jobType = url.searchParams.get('job_type') || 'both';

    const payoutData = await DataService.fetchData(`${API_BASE_URL}/api/payout/weekly/${date}?job_type=${jobType}`);
   // console.log(`[index] weeklyPayoutReportLoader completed.`);
    return payoutData;
}
export const monthlyPayoutReportLoader = async ({ params, request }) => {
    //console.log(`[index] monthlyPayoutReportLoader loading...`, params);
    const { date } = params;

    // Get job_type from URL
    const url = new URL(request.url);
    const jobType = url.searchParams.get('job_type') || 'both';

    const payoutData = await DataService.fetchData(`${API_BASE_URL}/api/payout/monthly/${date}?job_type=${jobType}`);
    //console.log(`[index] monthlyPayoutReportLoader completed.`);
    return payoutData;
}
export const orchestratorsLoader=async () => {
    //console.log(`[index] orchestratorLoader loading...`);
    const orchestrators = await DataService.fetchData(`${API_BASE_URL}/api/orchestrator`);
    //console.log(`[index] orchestratorLoader completed.`);
    return {orchestrators};
}
export const orchestratorLoader=async ({params}) => {
    //console.log(`[index] orchestratorLoader loading...`,params);
    const { eth_address } = params;
    const orchestrator = await DataService.fetchData(`${API_BASE_URL}/api/orchestrator/${eth_address}`);
    //console.log(`[index] orchestratorLoader completed.`);
    return {orchestrator};
}
export const topPayoutReportLoader = async ({ params }) => {
    //console.log(`[index] topPayoutReportLoader loading...`, params);
    const startDate = params.startDate || moment().subtract(7, 'days').format('YYYY-MM-DD');
    const endDate = params.endDate || moment().format('YYYY-MM-DD');
    const offset = params.offset || '0';
    const sort = params.sort || 'total';
    const jobType = params.jobType || 'both';

    const body = {
        start: startDate,
        end: endDate,
        offset: parseInt(offset, 10),
        sort,
        jobType,
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/payout/report`, {
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        //console.log(`[index] topPayoutReportLoader completed.`);
        return data;
    } catch (error) {
        console.error(`[index] Error loading top payout report:`, error);
        throw error;
    }
};
