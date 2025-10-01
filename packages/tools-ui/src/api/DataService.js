// DataServices.js
import { Contract, JsonRpcProvider } from "ethers";
import Bottleneck from 'bottleneck';
import db from '../db.js';
import { governorABI } from "../abi.js";
import {
    aiLeaderboardStatsURL,
    aiPerfStatsURL, API_BASE_URL,
    leaderboardStatsURL, orchDetailsURL,
    perfStatsURL,
    pipelinesURL,
    regionsURL
} from "../config.js";
import { getGatewayUrl } from "../routes/ai/utils.js";
import { from } from "rxjs";
import { map } from "rxjs/operators";

const ARBITRUM_RPC_URL = "https://arb1.arbitrum.io/rpc";
if (!ARBITRUM_RPC_URL) {
    throw new Error("Please set your ARBITRUM_RPC_URL in the .env file");
}

const provider = new JsonRpcProvider(ARBITRUM_RPC_URL);
const GOVERNOR_ADDRESS = "0xcFE4E2879B786C3aa075813F0E364bb5acCb6aa0";
const governorContract = new Contract(GOVERNOR_ADDRESS, governorABI, provider);

// Initialize Bottleneck with desired rate limits
const limiter = new Bottleneck({
    reservoir: 10, // Number of requests that can be sent in the current interval
    reservoirRefreshAmount: 10, // Number of requests to add at each interval
    reservoirRefreshInterval: 1000, // Interval duration in milliseconds (1000 ms = 1 second)
    maxConcurrent: 5, // Maximum number of concurrent requests
    minTime: 100, // Minimum time between requests in milliseconds
});

limiter.on('failed', async (error, jobInfo) => {
    if (error.status === 429) {
        const retryAfter = error.headers?.['retry-after'] ? parseInt(error.headers['retry-after']) * 1000 : 1000;
        console.warn(`Rate limited. Retrying after ${retryAfter} ms`);
        return retryAfter;
    }
    return null;
});

async function httpGetJSON(url) {
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json();
}
function supportToLabel(support) {
    const n = Number(support);
    if (n === 1) return "Yes";
    if (n === 2) return "Abstain";
    return "No";
}

function toInt(nLike) {
    if (nLike == null) return 0;
    const n = typeof nLike === 'string' ? parseInt(nLike, 10) : Number(nLike);
    return Number.isFinite(n) ? n : 0;
}

const weiToEth = (wei) => {
    return Number(wei) / 1e18;
};

const getFirstLine = (text) => {
    if (!text) return '';
    let firstLine = text.split('\n')[0];
    firstLine = firstLine.replace(/^#/, '').trim();
    return firstLine;
};


async function fetchAndStoreProposals() {
    let proposals = [];
    try {
        proposals = await httpGetJSON(`${API_BASE_URL}/api/treasury/proposals`);
        if (!Array.isArray(proposals)) {
            console.warn("Unexpected proposals response shape; expected an array");
            proposals = [];
        }
    } catch (err) {
        console.error("Failed to fetch proposals:", err);
        return;
    }

    // Upsert proposals into IndexedDB
    for (const p of proposals) {
        const propId = String(p.proposal_id);
        const existing = await db.proposals.get(propId);

        // We don't get proposer address/name/avatar from this API; leave blanks or keep existing values.
        const baseFields = {
            id: propId,
            title: getFirstLine(p.description || ""),
            description: p.description || "",
            proposerAddress: existing?.proposerAddress || "",
            proposerName:    existing?.proposerName    || "",
            proposerAvatar:  existing?.proposerAvatar  || "",
            voteStart: toInt(p.vote_start),
            voteEnd:   toInt(p.vote_end),
        };

        if (!existing) {
            await db.proposals.add({
                ...baseFields,
                status: 'Created',
                // createdAt: Date.now(),
                totalStake: 0,
            });
        } else {
            await db.proposals.update(propId, {
                ...baseFields,
            });
        }

        // IMPORTANT: still compute truth from chain
        try {
            await refreshProposalState(propId);
        } catch (e) {
            console.warn(`refreshProposalState failed for ${propId}:`, e);
        }
    }

    // For safety, re-check any active proposals for state drift
    const activeStatuses = ['Created', 'Active', 'Queued', 'Succeeded', 'Pending'];
    const potentiallyChanged = await db.proposals
        .where('status')
        .anyOf(activeStatuses)
        .toArray();

    for (const proposal of potentiallyChanged) {
        try {
            await refreshProposalState(proposal.id);
        } catch (e) {
            console.warn(`refreshProposalState failed for ${proposal.id}:`, e);
        }
    }
}

async function fetchAndStoreVotes() {
    let votes = [];
    try {
        votes = await httpGetJSON(`${API_BASE_URL}/api/treasury/votes`);
        if (!Array.isArray(votes)) {
            console.warn("Unexpected votes response shape; expected an array");
            votes = [];
        }
    } catch (err) {
        console.error("Failed to fetch votes:", err);
        return;
    }

    if (votes.length === 0) return;

    // Build orchestrator lookup for voter enrichment
    const voterAddresses = [...new Set(votes.map(v => String(v.voter).toLowerCase()))];
    const knownOrchestrators = await db.orchestrators
        .where('eth_address')
        .anyOf(voterAddresses)
        .toArray();
    const orchByAddr = {};
    knownOrchestrators.forEach(orch => { orchByAddr[orch.eth_address] = orch; });

    // Prepare bulk inserts and per-proposal totals
    const votesToAdd = [];
    const totalByProposal = new Map();

    // Optional: if your db.votes has a compound index like ["proposalId+voterAddress"], we can de-dupe
    // cheaply by checking for existing records before adding. We'll try best-effort here.
    const existingByKey = {};
    try {
        // Load existing keys for quick duplicate checks
        const existing = await db.votes
            .where('proposalId')
            .anyOf([...new Set(votes.map(v => String(v.proposal_id)))])
            .toArray();
        for (const e of existing) {
            existingByKey[`${e.proposalId}::${e.voterAddress}`] = true;
        }
    } catch {
        // If the index isn't available, we'll rely on bulkAdd error handling.
    }

    for (const raw of votes) {
        const pid = String(raw.proposal_id);
        const proposalExists = await db.proposals.get(pid);
        if (!proposalExists) continue; // ignore votes for unknown proposals

        const voterAddress = String(raw.voter).toLowerCase();
        const orch = orchByAddr[voterAddress];

        // De-dup per (proposalId, voterAddress); adjust if you want multiple votes per voter
        const key = `${pid}::${voterAddress}`;
        if (existingByKey[key]) continue;

        const stakeAmount = Number(raw.weight) || 0;

        const vote = {
            proposalId: pid,
            voterAddress,
            voterName:   orch?.name   || '',
            voterAvatar: orch?.avatar || '',
            support: supportToLabel(raw.support),
            stakeAmount,
            castAt: Date.now(), // API doesn’t expose a timestamp; keep local time for now
            reason: raw.reason || '',
            params: null,
        };
        votesToAdd.push(vote);

        totalByProposal.set(pid, (totalByProposal.get(pid) || (proposalExists.totalStake || 0)) + stakeAmount);
    }

    if (votesToAdd.length > 0) {
        try {
            await db.votes.bulkAdd(votesToAdd);
        } catch (error) {
            // If we hit constraint issues (duplicates), try a slower path:
            console.warn("bulkAdd failed (likely duplicates). Falling back to put()-per-row:", error);
            for (const v of votesToAdd) {
                try { await db.votes.put(v); } catch (e) { /* ignore dup */ }
            }
        }
    }

    // Update per-proposal totalStake
    const updatePromises = [];
    for (const [pid, newTotal] of totalByProposal.entries()) {
        updatePromises.push(db.proposals.update(pid, { totalStake: newTotal }));
    }
    try {
        await Promise.all(updatePromises);
    } catch (error) {
        console.error("Error updating proposals' totalStake:", error);
    }

    // NOTE: No block cursor update here—these were API-derived votes.
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
        const proposals = await db.proposals.orderBy('voteStart').reverse().toArray();
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
            // Calculate for percentages based on total votes including abstains
            const forPct = totalVoted > 0 ? (forStake / totalVoted) * 100 : 0;
            const againstPct = totalVoted > 0 ? (againstStake / totalVoted) * 100 : 0;
            const abstainPct = totalVoted > 0 ? (abstainStake / totalVoted) * 100 : 0;

            // Add a new property for the correct total support calculation (excluding abstain)
            const totalForAgainst = forStake + againstStake;
            const totalSupportPct = totalForAgainst > 0 ? (forStake / totalForAgainst) * 100 : 0;

            proposal.forStake = forStake;
            proposal.againstStake = againstStake;
            proposal.abstainStake = abstainStake;
            proposal.forPct = forPct;
            proposal.againstPct = againstPct;
            proposal.abstainPct = abstainPct;
            proposal.totalSupportPct = totalSupportPct;
        }
        // proposals.sort((a, b) => b.vote_start - a.vote_start);
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

async function getMetadata(key, defaultValue = null) {
    const entry = await db.metadata.get(key);
    return entry ? entry.value : defaultValue;
}

async function setMetadata(key, value) {
    await db.metadata.put({ key, value });
}

function mapStateValueToStatus(stateValue) {
    switch (stateValue) {
        case 0n:
            return 'Pending';
        case 1n:
            return 'Active';
        case 2n:
            return 'Canceled';
        case 3n:
            return 'Defeated';
        case 4n:
            return 'Succeeded';
        case 5n:
            return 'Queued';
        case 6n:
            return 'Expired';
        case 7n:
            return 'Executed';
        default:
            return 'Unknown';
    }
}

async function refreshProposalState(proposalId) {
    try {
        const stateValue = await governorContract.state(proposalId);
        const newStatus = mapStateValueToStatus(stateValue);
        await db.proposals.update(proposalId.toString(), { status: newStatus });
    } catch (error) {
        console.error(`Error refreshing proposal state for ID ${proposalId}:`, error);
    }
}
