// DataServices.js
import { Contract, JsonRpcProvider } from "ethers";
import Bottleneck from 'bottleneck';
import db from '../db.js';
import { governorABI } from "../abi.js";
import {
    aiLeaderboardStatsURL,
    aiPerfStatsURL,
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

const limitedGetBlock = limiter.wrap(provider.getBlock.bind(provider));

const firstTreasuryProposal = 162890764;
const LAST_PROPOSAL_BLOCK_KEY = 'lastProposalProcessedBlock';
const LAST_VOTE_BLOCK_KEY = 'lastVoteProcessedBlock';

async function getLastProposalProcessedBlock() {
    let block = await getMetadata(LAST_PROPOSAL_BLOCK_KEY);
    if (block === null) {
        block = firstTreasuryProposal;
        await setMetadata(LAST_PROPOSAL_BLOCK_KEY, block);
    }
    return block;
}

async function updateLastProposalProcessedBlock(block) {
    await setMetadata(LAST_PROPOSAL_BLOCK_KEY, block);
}

async function getLastVoteProcessedBlock() {
    let block = await getMetadata(LAST_VOTE_BLOCK_KEY);
    if (block === null) {
        block = firstTreasuryProposal;
        await setMetadata(LAST_VOTE_BLOCK_KEY, block);
    }
    return block;
}

async function updateLastVoteProcessedBlock(block) {
    await setMetadata(LAST_VOTE_BLOCK_KEY, block);
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
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = await getLastProposalProcessedBlock();
    const toBlock = latestBlock;

    const proposalCreatedFilter = governorContract.filters.ProposalCreated();
    const proposalCreatedEvents = await governorContract.queryFilter(proposalCreatedFilter, fromBlock, toBlock);

    for (const event of proposalCreatedEvents) {
        const { proposalId, proposer, description, voteStart, voteEnd } = event.args;
        if (proposalId === undefined) continue;
        const propId = proposalId.toString();

        const existing = await db.proposals.get(propId);
        const orchestrator = await db.orchestrators.get(proposer.toLowerCase());
        const proposerName = orchestrator ? orchestrator.name : '';
        const proposerAvatar = orchestrator ? orchestrator.avatar : '';

        if (!existing) {
            const proposal = {
                id: propId,
                title: getFirstLine(description),
                description,
                proposerAddress: proposer.toLowerCase(),
                proposerName,
                proposerAvatar,
                voteStart: voteStart?.toNumber ? voteStart.toNumber() : 0,
                voteEnd: voteEnd?.toNumber ? voteEnd.toNumber() : 0,
                status: 'Created',
                createdAt: Date.now(),
            };
            await db.proposals.add(proposal);
        } else {
            await db.proposals.update(propId, {
                status: 'Created',
                voteStart: voteStart?.toNumber ? voteStart.toNumber() : existing.voteStart,
                voteEnd: voteEnd?.toNumber ? voteEnd.toNumber() : existing.voteEnd,
            });
        }
        await refreshProposalState(propId);
    }

    const proposalCanceledFilter = governorContract.filters.ProposalCanceled();
    const proposalCanceledEvents = await governorContract.queryFilter(proposalCanceledFilter, fromBlock, toBlock);
    for (const event of proposalCanceledEvents) {
        const { proposalId } = event.args;
        const propId = proposalId.toString();
        const existing = await db.proposals.get(propId);
        if (!existing) continue;
        await db.proposals.update(propId, { status: 'Canceled' });
        await refreshProposalState(propId);
    }

    const proposalExecutedFilter = governorContract.filters.ProposalExecuted();
    const proposalExecutedEvents = await governorContract.queryFilter(proposalExecutedFilter, fromBlock, toBlock);
    for (const event of proposalExecutedEvents) {
        const { proposalId } = event.args;
        const propId = proposalId.toString();
        const existing = await db.proposals.get(propId);
        if (!existing) continue;
        await db.proposals.update(propId, { status: 'Executed' });
        await refreshProposalState(propId);
    }

    const activeStatuses = ['Created', 'Active', 'Queued', 'Succeeded', 'Pending'];
    const potentiallyChangedProposals = await db.proposals
        .where('status')
        .anyOf(activeStatuses)
        .toArray();

    for (const proposal of potentiallyChangedProposals) {
        await refreshProposalState(proposal.id);
    }

    await updateLastProposalProcessedBlock(toBlock + 1);
}

async function fetchAndStoreVotes() {
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = await getLastVoteProcessedBlock();
    const toBlock = latestBlock;

    // Fetch VoteCast events
    const castVoteFilter = governorContract.filters.VoteCast();
    let castVoteEvents = [];
    try {
        castVoteEvents = await governorContract.queryFilter(castVoteFilter, fromBlock, toBlock);
    } catch (error) {
        console.error("Error fetching VoteCast events:", error);
        return;
    }

    // Fetch VoteCastWithParams events
    const voteCastWithParamsFilter = governorContract.filters.VoteCastWithParams();
    let voteCastWithParamsEvents = [];
    try {
        voteCastWithParamsEvents = await governorContract.queryFilter(voteCastWithParamsFilter, fromBlock, toBlock);
    } catch (error) {
        console.error("Error fetching VoteCastWithParams events:", error);
    }

    // Combine both event types
    const allEvents = [...castVoteEvents, ...voteCastWithParamsEvents];

    if (allEvents.length === 0) return;

    const votesToAdd = [];
    const proposalsToUpdate = {};

    const voterAddresses = allEvents.map(event => event.args.voter.toLowerCase());
    const uniqueVoterAddresses = [...new Set(voterAddresses)];
    const orchestrators = await db.orchestrators
        .where('eth_address')
        .anyOf(uniqueVoterAddresses)
        .toArray();
    const orchestratorMap = {};
    orchestrators.forEach(orch => {
        orchestratorMap[orch.eth_address] = orch;
    });

    for (const event of allEvents) {
        const { voter, proposalId, support, weight } = event.args;
        const reason = event.args.reason || '';
        const params = event.args.params ? event.args.params.toString() : null;

        const pid = proposalId.toString();
        const proposalExists = await db.proposals.get(pid);
        if (!proposalExists) continue;

        const nSupport = Number(support);
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

        const voterAddress = voter.toLowerCase();
        const orchestrator = orchestratorMap[voterAddress];
        const voterName = orchestrator ? orchestrator.name : '';
        const voterAvatar = orchestrator ? orchestrator.avatar : '';

        const vote = {
            proposalId: pid,
            voterAddress,
            voterName,
            voterAvatar,
            support: supportMsg,
            stakeAmount: weiToEth(weight),
            castAt: Date.now(),
            reason,
            params
        };

        votesToAdd.push(vote);

        if (!proposalsToUpdate[pid]) {
            proposalsToUpdate[pid] = (proposalExists.totalStake || 0) + vote.stakeAmount;
        } else {
            proposalsToUpdate[pid] += vote.stakeAmount;
        }
    }

    if (votesToAdd.length > 0) {
        try {
            await db.votes.bulkAdd(votesToAdd);
        } catch (error) {
            console.error("Error adding votes to IndexedDB:", error);
        }
    }

    const proposalUpdatePromises = Object.entries(proposalsToUpdate).map(([pid, newTotalStake]) =>
        db.proposals.update(pid, { totalStake: newTotalStake })
    );
    try {
        await Promise.all(proposalUpdatePromises);
    } catch (error) {
        console.error("Error updating proposals' totalStake:", error);
    }

    try {
        await updateLastVoteProcessedBlock(toBlock + 1);
    } catch (error) {
        console.error("Error updating last processed vote block:", error);
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
