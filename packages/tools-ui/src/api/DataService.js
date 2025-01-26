// DataServices.js
import db from '../db.js';
import {
    aiLeaderboardStatsURL,
    aiPerfStatsURL,
    leaderboardStatsURL, livepeerApiBaseUrl, orchDetailsURL,
    perfStatsURL,
    pipelinesURL,
    regionsURL
} from "../config.js";
import { getGatewayUrl } from "../routes/ai/utils.js";
import { from } from "rxjs";
import { map } from "rxjs/operators";
const getFirstLine = (text) => {
    if (!text) return '';
    let firstLine = text.split('\n')[0];
    firstLine = firstLine.replace(/^#/, '').trim();
    return firstLine;
};

async function fetchAndStoreProposals() {
    try {
        const response = await fetch(`${livepeerApiBaseUrl}/proposals`);
        const data = await response.json();

        if (!Array.isArray(data)) {
            console.error("proposals data is not an array.");
            return;
        }
        await db.proposals.clear();
        await db.proposals.bulkPut(data.map(p=>{
            return {
                id: p.proposal_id,
                title: getFirstLine(p.description),
                description: p.description,
                proposerAddress: p.proposer.toLowerCase(),
                proposerName: p.proposer_name,
                proposerAvatar: p.proposer_avatar,
                voteStart: p.vote_start?.toNumber ? p.vote_start.toNumber() : 0,
                voteEnd: p.vote_end?.toNumber ? p.vote_end.toNumber() : 0,
                status: p.status,
                createdAt: p.last_event_timestamp ? new Date(p.last_event_timestamp): null
            }
        }))
    } catch (error) {
        console.error("Error fetching proposal data:", error);
    }
}

async function fetchAndStoreVotes() {
    try {
        const response = await fetch(`${livepeerApiBaseUrl}/votes`);
        const votes = await response.json();

        if (!Array.isArray(votes)) {
            console.error("votes data is not an array.");
            return;
        }
        let v= votes.map(v => {
            const nSupport = v.support;
            let supportMsg = "No";
            switch (nSupport) {
                case 1:
                    supportMsg = "Yes";
                    break;
                case 2:
                    supportMsg = "Abstain";
                    break;
                default:
                    supportMsg = "No";
                    break;
            }
            return {proposalId: v.proposal_id,voterAddress: v.voter,voterName: v.voter_name,voterAvatar:v.voter_avatar, support: supportMsg
                , stakeAmount: v.weight, reason: v.reason,castAt: v.last_event_timestamp ? new Date(v.last_event_timestamp): null}
        });
        // console.log("votes:", v);
        await db.votes.clear();
        await db.votes.bulkPut(v);

    } catch (error) {
        console.error("Error fetching votes data:", error);
    }
}

async function fetchAndStoreOrchestrators() {
    try {
        const response = await fetch(orchDetailsURL);
        const orchestrators = await response.json();

        if (!Array.isArray(orchestrators)) {
            console.error("Orchestrator data is not an array.");
            return;
        }

        for (const orch of orchestrators) {
            const {
                eth_address,
                total_stake,
                reward_cut,
                fee_cut,
                activation_status,
                name,
                service_uri,
                avatar
            } = orch;

            if (!eth_address) continue;

            const orchestrator = {
                eth_address: eth_address.toLowerCase(),
                total_stake: Number(total_stake),
                reward_cut: Number(reward_cut),
                fee_cut: Number(fee_cut),
                activation_status: Boolean(activation_status),
                name: name || '',
                service_uri: service_uri || '',
                avatar: avatar || ''
            };

            await db.orchestrators.put(orchestrator);
        }
    } catch (error) {
        console.error("Error fetching orchestrator data:", error);
    }
}

export async function fetchAndStoreCapabilities() {
    try {
        let gw = getGatewayUrl();
        let url = `${gw}/getOrchestratorAICapabilities`;
        let response = await fetch(url, {
            method: "GET",
            mode: "cors",
        });

        if (!response.ok) {
            throw new Error('[GatewayDataFetcher] fetching Orchestrator AI Capabilities response was not ok');
        }
        let data = await response.json();

        const pipelines = {};

        for (let orchestrator of data.orchestrators) {
            const ethAddress = orchestrator.address;
            const storedOrchestrator = await db.orchestrators.get(ethAddress);
            const storedOrchestratorName = storedOrchestrator?.name || ethAddress

            for (let pipeline of orchestrator.pipelines) {
                const pipelineType = pipeline.type;

                if (!pipelines[pipelineType]) {
                    pipelines[pipelineType] = {
                        name: pipelineType,
                        models: []
                    };
                }

                for (let model of pipeline.models) {
                    const modelName = model.name;
                    const modelStatus = model.status;

                    let pipelineModels = pipelines[pipelineType].models;

                    let modelEntry = pipelineModels.find(m => m.name === modelName);

                    if (!modelEntry) {
                        modelEntry = {
                            name: modelName,
                            Cold: 0,
                            Warm: 0,
                            orchestrators: []
                        };
                        pipelineModels.push(modelEntry);
                    }

                    modelEntry.Cold += modelStatus.Cold;
                    modelEntry.Warm += modelStatus.Warm;

                    modelEntry.orchestrators.push({
                        ethAddress: storedOrchestratorName,
                        warm: modelStatus.Warm
                    });
                }
            }
        }

        await db.capabilities.clear();

        for (let pipelineName in pipelines) {
            await db.capabilities.add({
                name: pipelineName,
                models: pipelines[pipelineName].models
            });
        }

    } catch (error) {
        console.error('[GatewayDataFetcher] Error fetching or storing capabilities:', error);
    }
}

const TURN_OFF_UPDATES = false;

async function periodicUpdate() {
    if (TURN_OFF_UPDATES == false) {
        try {
            await fetchAndStoreOrchestrators();
            await fetchAndStoreProposals();
            await fetchAndStoreVotes();
            await fetchAndStoreCapabilities();
        } catch (error) {
            console.error("Error during periodic update:", error);
        }
    } else {
        console.warn("periodic updates are turned off....");
    }
}

async function initializeData() {
    await periodicUpdate();
}

export default class DataServices {
    static async init() {
        await initializeData();
        setInterval(periodicUpdate, 300000);
    }

    static async fetchData(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        return response.json();
    }

    static async getProposals() {
        const proposals = await db.proposals.toArray();
        for (const proposal of proposals) {
            const votes = await db.votes
                .where('proposalId')
                .equals(proposal.id)
                .toArray();
            votes.sort((a, b) => b.stakeAmount - a.stakeAmount);
            proposal.votes = votes;
            proposal.totalStakeVoted = votes.reduce((accumulator, vote) => {
                return accumulator + vote.stakeAmount;
            }, 0);

            const forStake = votes
                .filter((v) => v.support === 'Yes')
                .reduce((acc, v) => acc + v.stakeAmount, 0);
            const againstStake = votes
                .filter((v) => v.support === 'No')
                .reduce((acc, v) => acc + v.stakeAmount, 0);
            const abstainStake = votes
                .filter((v) => v.support === 'Abstain')
                .reduce((acc, v) => acc + v.stakeAmount, 0);

            const totalVoted = forStake + againstStake + abstainStake;

            const forPct = totalVoted > 0 ? (forStake / totalVoted) * 100 : 0;
            const againstPct = totalVoted > 0 ? (againstStake / totalVoted) * 100 : 0;
            const abstainPct = totalVoted > 0 ? (abstainStake / totalVoted) * 100 : 0;

            proposal.forStake = forStake;
            proposal.againstStake = againstStake;
            proposal.abstainStake = abstainStake;
            proposal.forPct = forPct;
            proposal.againstPct = againstPct;
            proposal.abstainPct = abstainPct;
        }
        proposals.sort((a, b) => b.createdAt - a.createdAt);
        return proposals;
    }

    static async fetchRegions() {
        const response = await fetch(regionsURL);
        if (!response.ok) {
            throw new Error('Failed to fetch regions');
        }
        return response.json();
    }

    static async fetchPipelines() {
        const response = await fetch(pipelinesURL);
        if (!response.ok) {
            throw new Error('Failed to fetch pipelines');
        }
        const data = await response.json();
        return data.pipelines || [];
    }

    static async fetchLeaderboardData({pipeline, model, region, isAIType}) {
        const endpoint = isAIType ? aiLeaderboardStatsURL : leaderboardStatsURL;
        let url = `${endpoint}?`;

        if (region && !region.includes("GLOBAL"))
            url += `region=${region}&`;

        if (isAIType) {
            url += `pipeline=${pipeline}&model=${model}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard data');
        }

        const data = await response.json();

        const orchDetailResponse = await fetch(orchDetailsURL)
        const orchs = await orchDetailResponse.json();
        const orchestrators = new Map(orchs.map(obj => [obj.eth_address, obj]))
        return Object.entries(data).map(([orchestrator, regions], index) => {
            let totalScore = 0;
            let totalSuccessRate = 0;
            let totalRoundTripScore = 0;
            const regionCount = Object.keys(regions).length;

            Object.values(regions).forEach((stats) => {
                totalScore += stats.score;
                totalSuccessRate += stats.success_rate;
                totalRoundTripScore += stats.round_trip_score;
            });

            return {
                id: index,
                orchestrator: orchestrators.get(orchestrator),
                totalScore: (totalScore / regionCount) * 10,
                successRate: (totalSuccessRate / regionCount) * 100,
                latencyScore: (totalRoundTripScore / regionCount) * 10,
            };
        })
    }

    static async fetchStatsData({orchestrator, pipeline, model, isAIType}) {
        const endpoint = isAIType ? aiPerfStatsURL : perfStatsURL;
        let url = `${endpoint}?orchestrator=${orchestrator}`;

        if (isAIType && !(!model || !pipeline)) {
            url += `&pipeline=${pipeline}&model=${model}`;
        }
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch stats data');
        }
        return response.json();
    }
}

export const $supportedModels = (pipelineNameFilter) =>
    from(db.capabilities.toArray()).pipe(
        map((capabilities) =>
            capabilities
                .filter((cap) => cap.name.toLowerCase().includes(pipelineNameFilter.toLowerCase()))
                .flatMap((capability) => capability.models)
                .map((model) => model.name)
        )
    );

export const $networkCapabilities = () =>
    from(db.capabilities.toArray()).pipe(
        map((capabilities) =>
            capabilities.map((capability) => ({
                name: capability.name,
                models: capability.models.map((model) => ({
                    ...model,
                    orchestrators: model.orchestrators.map((orch) => ({
                        ethAddress: orch.ethAddress,
                        warm: orch.warm,
                    })),
                })),
            }))
        )
    );
