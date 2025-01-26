import DataService from "../api/DataService.js";

import moment from "moment";
import {livepeerApiBaseUrl} from "../config.js";

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
    const gateways = await DataService.fetchData(`${livepeerApiBaseUrl}/gateways`);
    //console.log(`[index] leaderboardLoader completed.`);
    return {gateways};
}
export const gatewayLoader=async ({params}) => {
    //console.log(`[index] gatewayLoader loading...`,params);
    const { eth_address } = params;
    const gateway = await DataService.fetchData(`${livepeerApiBaseUrl}/gateway/${eth_address}`);
    //console.log(`[index] gatewayLoader completed.`);
    return {gateway};
}
export const dailyPayoutReportLoader=async ({ params }) => {
    //console.log(`[index] dailyPayoutReportLoader loading...`,params);
    const { date } = params;
    const payoutData = await DataService.fetchData(`${livepeerApiBaseUrl}/payout/daily/${date}`);
    //console.log(`[index] dailyPayoutReportLoader completed.`);
    return payoutData;
}
export const weeklyPayoutReportLoader=async ({ params }) => {
    //console.log(`[index] weeklyPayoutReportLoader loading...`,params);
    const { date } = params;
    const payoutData = await DataService.fetchData(`${livepeerApiBaseUrl}/payout/weekly/${date}`);
    //console.log(`[index] weeklyPayoutReportLoader completed.`);
    return payoutData;
}
export const monthlyPayoutReportLoader=async ({ params }) => {
    //console.log(`[index] monthlyPayoutReportLoader loading...`,params);
    const { date } = params;
    const payoutData = await DataService.fetchData(`${livepeerApiBaseUrl}/payout/monthly/${date}`);
    //console.log(`[index] monthlyPayoutReportLoader completed.`);
    return payoutData;
}
export const orchestratorsLoader=async () => {
    //console.log(`[index] orchestratorLoader loading...`);
    const orchestrators = await DataService.fetchData(`${livepeerApiBaseUrl}/orchestrator`);
    //console.log(`[index] orchestratorLoader completed.`);
    return {orchestrators};
}
export const orchestratorLoader=async ({params}) => {
    //console.log(`[index] orchestratorLoader loading...`,params);
    const { eth_address } = params;
    const orchestrator = await DataService.fetchData(`${livepeerApiBaseUrl}/orchestrator/${eth_address}`);
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
        const response = await fetch(`${livepeerApiBaseUrl}/payout/report`, {
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
