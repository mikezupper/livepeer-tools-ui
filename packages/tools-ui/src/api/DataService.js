// DataServices.js
import { Contract, JsonRpcProvider } from "ethers";
import Bottleneck from 'bottleneck';
import db from '../db.js';
import {governorABI} from "../abi.js";
import {
    aiLeaderboardStatsURL,
    aiPerfStatsURL,
    leaderboardStatsURL, orchDetailsURL,
    perfStatsURL,
    pipelinesURL,
    regionsURL
} from "../config.js";
import {getGatewayUrl} from "../routes/ai/utils.js";
import {from} from "rxjs";
import {map} from "rxjs/operators";

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
// Optional: Handle failed jobs
limiter.on('failed', async (error, jobInfo) => {
    if (error.status === 429) { // Assuming error.status holds the HTTP status code
        const retryAfter = error.headers?.['retry-after'] ? parseInt(error.headers['retry-after']) * 1000 : 1000;
        console.warn(`Rate limited. Retrying after ${retryAfter} ms`);
        return retryAfter; // Retry after the specified delay
    }
    return null; // Do not retry for other errors
});

// Create a wrapped version of getBlock with rate limiting
const limitedGetBlock = limiter.wrap(provider.getBlock.bind(provider));

// Initial fromBlock (you might want to store this persistently)
const firstTreasuryProposal = 162890764;

// Instead, create functions to get and set last processed blocks
const LAST_PROPOSAL_BLOCK_KEY = 'lastProposalProcessedBlock';
const LAST_VOTE_BLOCK_KEY = 'lastVoteProcessedBlock';

/**
 * Retrieves the last processed proposal block from metadata.
 * If not present, initializes it with `firstTreasuryProposal`.
 */
async function getLastProposalProcessedBlock() {
    let block = await getMetadata(LAST_PROPOSAL_BLOCK_KEY);
    if (block === null) {
        block = firstTreasuryProposal;
        await setMetadata(LAST_PROPOSAL_BLOCK_KEY, block);
    }
    return block;
}

/**
 * Updates the last processed proposal block in metadata.
 * @param {number} block
 */
async function updateLastProposalProcessedBlock(block) {
    await setMetadata(LAST_PROPOSAL_BLOCK_KEY, block);
}

/**
 * Retrieves the last processed vote block from metadata.
 * If not present, initializes it with `firstTreasuryProposal`.
 */
async function getLastVoteProcessedBlock() {
    let block = await getMetadata(LAST_VOTE_BLOCK_KEY);
    if (block === null) {
        block = firstTreasuryProposal;
        await setMetadata(LAST_VOTE_BLOCK_KEY, block);
    }
    return block;
}

/**
 * Updates the last processed vote block in metadata.
 * @param {number} block
 */
async function updateLastVoteProcessedBlock(block) {
    await setMetadata(LAST_VOTE_BLOCK_KEY, block);
}


// Helper function to convert wei to eth
const weiToEth = (wei) => {
    return Number(wei) / 1e18;
};

// Helper function to extract and clean the first line
const getFirstLine = (text) => {
    if (!text) return '';
    let firstLine = text.split('\n')[0];
    firstLine = firstLine.replace(/^#/, '').trim();
    return firstLine;
};

// 4. Query the relevant events (ProposalCreated, etc.) and store/update them in IndexedDB.
//    Then, call refreshProposalState(proposalId) to get the final state from on-chain.
async function fetchAndStoreProposals() {
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = await getLastProposalProcessedBlock();
    const toBlock = latestBlock;

    //
    // 1) Handle ProposalCreated events
    //
    const proposalCreatedFilter = governorContract.filters.ProposalCreated();
    const proposalCreatedEvents = await governorContract.queryFilter(proposalCreatedFilter, fromBlock, toBlock);

    for (const event of proposalCreatedEvents) {
        const { proposalId, proposer, description, voteStart, voteEnd } = event.args;
        if (proposalId === undefined) {
            //console.log(`ProposalCreated event with undefined proposalId`);
            continue;
        }
        const propId = proposalId.toString();

        // Check if this proposal is already in the DB
        const existing = await db.proposals.get(propId);

        // Lookup proposer name/avatar from orchestrators
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
                createdAt: Date.now(), // or block.timestamp
            };
            await db.proposals.add(proposal);
            //console.log(`Stored new proposal ${propId} with status 'Created'`);
        } else {
            await db.proposals.update(propId, {
                status: 'Created',
                voteStart: voteStart?.toNumber ? voteStart.toNumber() : existing.voteStart,
                voteEnd: voteEnd?.toNumber ? voteEnd.toNumber() : existing.voteEnd,
            });
            //console.log(`Updated existing proposal ${propId} to status 'Created'`);
        }

        // **Option B**: Immediately refresh on-chain state for this proposal
        await refreshProposalState(propId);
    }

    //
    // 2) Handle ProposalCanceled events
    //
    const proposalCanceledFilter = governorContract.filters.ProposalCanceled();
    const proposalCanceledEvents = await governorContract.queryFilter(proposalCanceledFilter, fromBlock, toBlock);

    for (const event of proposalCanceledEvents) {
        const { proposalId } = event.args;
        const propId = proposalId.toString();

        const existing = await db.proposals.get(propId);
        if (!existing) {
            //console.log(`ProposalCanceled event for ${propId} not found in DB. Skipping.`);
            continue;
        }

        await db.proposals.update(propId, { status: 'Canceled' });
        //console.log(`Proposal ${propId} updated to status 'Canceled'`);

        // **Option B**: Refresh from on-chain state (though we already know it’s Canceled)
        await refreshProposalState(propId);
    }

    //
    // 3) Handle ProposalExecuted events
    //
    const proposalExecutedFilter = governorContract.filters.ProposalExecuted();
    const proposalExecutedEvents = await governorContract.queryFilter(proposalExecutedFilter, fromBlock, toBlock);

    for (const event of proposalExecutedEvents) {
        const { proposalId } = event.args;
        const propId = proposalId.toString();

        // Check if proposal exists
        const existing = await db.proposals.get(propId);
        if (!existing) {
            //console.log(`ProposalExecuted event for ${propId} not found in DB. Skipping.`);
            continue;
        }

        // Update the status to 'Executed'
        await db.proposals.update(propId, { status: 'Executed' });
        //console.log(`Proposal ${propId} updated to status 'Executed'`);

        // Refresh from on-chain state (will confirm it’s "Executed")
        await refreshProposalState(propId);
    }

    // 6) re-check the status for all "active-ish" proposals
    //    (e.g., those with status 'Created', 'Active', 'Queued', 'Succeeded')
    //    This ensures we pick up any changes from "not enough votes" or "vote ended" -> Defeated.
    const activeStatuses = ['Created', 'Active', 'Queued', 'Succeeded', 'Pending'];
    const potentiallyChangedProposals = await db.proposals
        .where('status')
        .anyOf(activeStatuses)
        .toArray();

    for (const proposal of potentiallyChangedProposals) {
        await refreshProposalState(proposal.id);
    }

    //
    // Finally, update the last processed block in metadata
    //
    await updateLastProposalProcessedBlock(toBlock + 1);
    //console.log(`fetchAndStoreProposals complete. Processed up to block ${toBlock}.`);
}

// 5. Query the CastVote events and store them in IndexedDB.
async function fetchAndStoreVotes() {
    //console.log(`Fetching votes for proposals`);

    const latestBlock = await provider.getBlockNumber();
    const fromBlock = await getLastVoteProcessedBlock();
    const toBlock = latestBlock;

    const castVoteFilter = governorContract.filters.VoteCast();

    // Fetch all VoteCast events in the specified block range
    let castVoteEvents;
    try {
        castVoteEvents = await governorContract.queryFilter(castVoteFilter, fromBlock, toBlock);
    } catch (error) {
        console.error("Error fetching VoteCast events:", error);
        return;
    }

    if (castVoteEvents.length === 0) {
        //console.log("No new VoteCast events found.");
        return;
    }

    //console.log(`Fetched ${castVoteEvents.length} VoteCast events.`);

    // // Extract unique block numbers from the events
    // const uniqueBlockNumbers = [...new Set(castVoteEvents.map(event => event.blockNumber))];
    //
    // //console.log(`Fetching ${uniqueBlockNumbers.length} unique blocks for timestamps.`);
    //
    // // Fetch all unique blocks with rate limiting
    // let blocks;
    // try {
    //     const blockPromises = uniqueBlockNumbers.map(blockNumber => limitedGetBlock(blockNumber));
    //     blocks = await Promise.all(blockPromises);
    // } catch (error) {
    //     console.error("Error fetching blocks:", error);
    //     return;
    // }
    //
    // // Create a mapping from block number to timestamp
    // const blockTimestampMap = {};
    // blocks.forEach(block => {
    //     if (block) {
    //         blockTimestampMap[block.number] = block.timestamp;
    //     }
    // });
    //
    // //console.log("Fetched all necessary block timestamps.");

    // Prepare batch operations for IndexedDB
    const votesToAdd = [];
    const proposalsToUpdate = {};

    // To reduce database calls, fetch all relevant orchestrators in advance
    const voterAddresses = castVoteEvents.map(event => event.args.voter.toLowerCase());
    const uniqueVoterAddresses = [...new Set(voterAddresses)];
    const orchestrators = await db.orchestrators
        .where('eth_address')
        .anyOf(uniqueVoterAddresses)
        .toArray();
    const orchestratorMap = {};
    orchestrators.forEach(orch => {
        orchestratorMap[orch.eth_address] = orch;
    });

    for (const event of castVoteEvents) {
        const { voter, proposalId, support, weight } = event.args;

        const pid = proposalId.toString();

        // Optionally, verify that the proposal exists
        const proposalExists = await db.proposals.get(pid);
        if (!proposalExists) {
            //console.log(`Proposal ${pid} not found. Skipping vote.`);
            continue;
        }

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

        // // Get the timestamp from the blockTimestampMap
        // const blockTimestamp = blockTimestampMap[event.blockNumber];
        // if (!blockTimestamp) {
        //     console.warn(`Timestamp not found for block ${event.blockNumber}. Skipping vote.`);
        //     continue;
        // }

        // Retrieve orchestrator details from the map
        const voterAddress = voter.toLowerCase();
        const orchestrator = orchestratorMap[voterAddress];
        const voterName = orchestrator ? orchestrator.name : '';
        const voterAvatar = orchestrator ? orchestrator.avatar : '';
        const vote = {
            proposalId: pid,
            voterAddress: voterAddress,
            voterName,
            voterAvatar,
            support: supportMsg,
            stakeAmount: weiToEth(weight),
            castAt: Date.now() // TODO: fix or remove date logic
        };

        votesToAdd.push(vote);

        // Accumulate total stake updates
        if (!proposalsToUpdate[pid]) {
            proposalsToUpdate[pid] = (proposalExists.totalStake || 0) + vote.stakeAmount;
        } else {
            proposalsToUpdate[pid] += vote.stakeAmount;
        }

        //console.log(`Processed vote for proposal ${pid} by ${voter}`);
    }

    // Bulk add votes to IndexedDB
    if (votesToAdd.length > 0) {
        try {
            await db.votes.bulkAdd(votesToAdd);
            //console.log(`Added ${votesToAdd.length} votes to IndexedDB.`);
        } catch (error) {
            console.error("Error adding votes to IndexedDB:", error);
        }
    } else {
        //console.log("No votes to add to IndexedDB.");
    }

    // Bulk update proposals' totalStake
    const proposalUpdatePromises = Object.entries(proposalsToUpdate).map(([pid, newTotalStake]) =>
        db.proposals.update(pid, { totalStake: newTotalStake })
    );
    try {
        await Promise.all(proposalUpdatePromises);
        //console.log("Updated totalStake for proposals.");
    } catch (error) {
        console.error("Error updating proposals' totalStake:", error);
    }

    // Update the last processed block in metadata
    try {
        await updateLastVoteProcessedBlock(toBlock + 1);
        //console.log("Updated last processed vote block.");
    } catch (error) {
        console.error("Error updating last processed vote block:", error);
    }
}

// 7. Fetch and store Orchestrator data
async function fetchAndStoreOrchestrators() {
    //console.log(`Fetching orchestrator data from ${orchDetailsURL}`);

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

            if (!eth_address) {
                //console.log("Orchestrator with missing eth_address. Skipping.");
                continue;
            }

            const orchestrator = {
                eth_address: eth_address.toLowerCase(), // Normalize address
                total_stake: Number(total_stake),
                reward_cut: Number(reward_cut),
                fee_cut: Number(fee_cut),
                activation_status: Boolean(activation_status),
                name: name || '',
                service_uri: service_uri || '',
                avatar: avatar || ''
            };

            // Upsert orchestrator data
            await db.orchestrators.put(orchestrator);
            //console.log(`Stored/Updated orchestrator ${orchestrator.eth_address}`);
        }

        //console.log("Orchestrator data fetch and store completed.");
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

            // Get the orchestrator's name from the database if available
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

        // Now, clear the capabilities database and store the new data
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

// Periodic update function to fetch new proposals and votes
async function periodicUpdate() {
    try {
        //console.log("Starting periodic update...");
        await fetchAndStoreOrchestrators();
        await fetchAndStoreProposals();
        await fetchAndStoreVotes();
        await fetchAndStoreCapabilities();
        //console.log("Periodic update completed.");
    } catch (error) {
        console.error("Error during periodic update:", error);
    }
}

// Helper function to initialize the database with existing data
async function initializeData() {
    await periodicUpdate();
}

// 6. Query the data from Dexie
export default class DataServices {
    // Initialize the data on first load
    static async init() {
        await initializeData();

        // Set up periodic updates every 5 minutes (300,000 ms)
        setInterval(periodicUpdate, 300000);
    }

    /**
     * Fetches the data
     * @returns {Promise<Object[]>} A promise that resolves to an array of regions.
     * @throws {Error} If the request fails.
     */
    static async fetchData(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        return response.json();
    }

    // Get all proposals
    static async getProposals() {
        const proposals = await db.proposals.toArray();
        //console.log(`Retrieved ${proposals.length} proposals from IndexedDB`);

        // For each proposal, get associated votes
        for (const proposal of proposals) {
            const votes = await db.votes
                .where('proposalId')
                .equals(proposal.id)
                .toArray();

            // Sort votes by stakeAmount descending
            votes.sort((a, b) => b.stakeAmount - a.stakeAmount);

            proposal.votes = votes;
            // Sum up the stakeAmount from all votes
            proposal.totalStakeVoted = votes.reduce((accumulator, vote) => {
                return accumulator + vote.stakeAmount;
            }, 0);

            // 1) Sum stake by support
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

            // 2) Compute percentages (handle division by zero if there are no votes)
            const forPct = totalVoted > 0 ? (forStake / totalVoted) * 100 : 0;
            const againstPct = totalVoted > 0 ? (againstStake / totalVoted) * 100 : 0;
            const abstainPct = totalVoted > 0 ? (abstainStake / totalVoted) * 100 : 0;

            // 3) Attach them to the proposal object
            //    (you can store these however you like, e.g., in a nested object)
            proposal.forStake = forStake;         // e.g., 6_341_000
            proposal.againstStake = againstStake; // e.g., 175_000
            proposal.abstainStake = abstainStake; // e.g., 0
            proposal.forPct = forPct;             // e.g., 97.3144
            proposal.againstPct = againstPct;     // e.g., 2.6856
            proposal.abstainPct = abstainPct;     // e.g., 0
        }
        proposals.sort((a, b) => b.createdAt - a.createdAt);

        return proposals;
    }

    /**
     * Fetches the list of regions from the API.
     * @returns {Promise<Object[]>} A promise that resolves to an array of regions.
     * @throws {Error} If the request fails.
     */
    static async fetchRegions() {
        const response = await fetch(regionsURL);
        if (!response.ok) {
            throw new Error('Failed to fetch regions');
        }
        return response.json();
    }

    /**
     * Fetches the list of pipelines and models from the API.
     * @returns {Promise<Object[]>} A promise that resolves to an array of pipelines with models.
     * @throws {Error} If the request fails.
     */
    static async fetchPipelines() {
        const response = await fetch(pipelinesURL);
        if (!response.ok) {
            throw new Error('Failed to fetch pipelines');
        }
        const data = await response.json();
        // //console.log("DataService - fetchPipelines data", data);
        return data.pipelines || [];
    }

    /**
     * Fetches leaderboard data based on pipeline, model, and region.
     * @param {Object} params - The parameters for the API call.
     * @param {string} params.pipeline - The selected pipeline.
     * @param {string} params.model - The selected model.
     * @param {string} params.region - The selected region.
     * @param {boolean} params.isAIType - Whether the AI type is true (both pipeline and model selected).
     * @returns {Promise<Object>} A promise that resolves to the leaderboard data.
     * @throws {Error} If the request fails.
     */
    static async fetchLeaderboardData({pipeline, model, region, isAIType}) {
        // //console.log("DataService fetchLeaderboardData",pipeline,model,region,isAIType);
        const endpoint = isAIType ? aiLeaderboardStatsURL : leaderboardStatsURL;
        let url = `${endpoint}?`;

        if (region && !region.includes("GLOBAL"))
            url += `region=${region}&`;

        if (isAIType) {
            url += `pipeline=${pipeline}&model=${model}`;
        }
        // //console.log("DataService fetchLeaderboardData url" ,url);

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

    /**
     * Fetches stats data based on orchestrator address, pipeline, and model.
     * @param {Object} params - The parameters for the API call.
     * @param {string} params.orchestrator - The orchestrator Ethereum address.
     * @param {string} params.pipeline - The selected pipeline.
     * @param {string} params.model - The selected model.
     * @param {boolean} params.isAIType - Whether the AI type is true (both pipeline and model selected).
     * @returns {Promise<Object>} A promise that resolves to the stats data.
     * @throws {Error} If the request fails.
     */
    static async fetchStatsData({orchestrator, pipeline, model, isAIType}) {
        // //console.log("DataService - fetchStatsData data", orchestrator, pipeline, model, isAIType);
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
                    .filter((cap) =>cap.name.toLowerCase().includes(pipelineNameFilter.toLowerCase()))
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
/**
 * Retrieves a metadata value by key.
 * @param {string} key
 * @param {any} defaultValue - Value to return if key does not exist.
 * @returns {Promise<any>}
 */
async function getMetadata(key, defaultValue = null) {
    const entry = await db.metadata.get(key);
    return entry ? entry.value : defaultValue;
}

/**
 * Sets a metadata value by key.
 * @param {string} key
 * @param {any} value
 * @returns {Promise<void>}
 */
async function setMetadata(key, value) {
    await db.metadata.put({ key, value });
}

/**
 * Maps the numeric state enum to a string.
 */
function mapStateValueToStatus(stateValue) {
    //console.log("mapStateValueToStatus",stateValue);
    switch (stateValue) {
        case 0n:
            return 'Pending';
        case 1n:
            return 'Active';
        case 2n:
            return 'Canceled';
        case 3n:
            return 'Defeated'; // <-- if it fails to pass
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

/**
 * Calls governorContract.state(proposalId) to refresh the status in DB.
 * This is how we detect "Defeated" or any final on-chain state.
 */
async function refreshProposalState(proposalId) {
    try {
        const stateValue = await governorContract.state(proposalId);
        const newStatus = mapStateValueToStatus(stateValue);
        // //console.log("refreshProposalState",proposalId,stateValue,newStatus);

        await db.proposals.update(proposalId.toString(), { status: newStatus });
        //console.log(`Proposal ${proposalId} updated to status: ${newStatus}`);
    } catch (error) {
        console.error(`Error refreshing proposal state for ID ${proposalId}:`, error);
    }
}
