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

// 4. Query the ProposalCreated events and store them in IndexedDB.
async function fetchAndStoreProposals() {
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = await getLastProposalProcessedBlock();
    const toBlock = latestBlock;

    const proposalCreatedFilter = governorContract.filters.ProposalCreated();

    const proposalCreatedEvents = await governorContract.queryFilter(proposalCreatedFilter, fromBlock, toBlock);

    for (const event of proposalCreatedEvents) {
        const { proposalId, proposer, description } = event.args;
        if (proposalId === undefined) {
            console.log(`proposal with undefined id`);
            continue;
        }
        const propId = proposalId.toString();

        // Check if proposal already exists
        const existing = await db.proposals.get(propId);
        if (existing) {
            console.log(`Proposal ${propId} already exists. Skipping.`);
            continue;
        }

        // Get the block and extract the timestamp
        // const block = await provider.getBlock(event.blockNumber);
        // const blockTimestamp = block.timestamp;

        // Lookup proposer name from orchestrators
        const orchestrator = await db.orchestrators.get(proposer.toLowerCase());
        const proposerName = orchestrator ? orchestrator.name : '';
        const proposerAvatar = orchestrator ? orchestrator.avatar : '';

        const proposal = {
            id: propId,
            title: getFirstLine(description),
            description,
            proposerAddress: proposer.toLowerCase(),
            proposerName,
            proposerAvatar,
            createdAt: Date.now() //TODO: FIX or REMOVE dates
        };

        await db.proposals.add(proposal);
        console.log(`Stored proposal ${propId}`);
    }

    // Update the last processed block in metadata
    await updateLastProposalProcessedBlock(toBlock + 1);
}

// 5. Query the CastVote events and store them in IndexedDB.
async function fetchAndStoreVotes() {
    console.log(`Fetching votes for proposals`);

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
        console.log("No new VoteCast events found.");
        return;
    }

    console.log(`Fetched ${castVoteEvents.length} VoteCast events.`);

    // // Extract unique block numbers from the events
    // const uniqueBlockNumbers = [...new Set(castVoteEvents.map(event => event.blockNumber))];
    //
    // console.log(`Fetching ${uniqueBlockNumbers.length} unique blocks for timestamps.`);
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
    // console.log("Fetched all necessary block timestamps.");

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
            console.log(`Proposal ${pid} not found. Skipping vote.`);
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

        console.log(`Processed vote for proposal ${pid} by ${voter}`);
    }

    // Bulk add votes to IndexedDB
    if (votesToAdd.length > 0) {
        try {
            await db.votes.bulkAdd(votesToAdd);
            console.log(`Added ${votesToAdd.length} votes to IndexedDB.`);
        } catch (error) {
            console.error("Error adding votes to IndexedDB:", error);
        }
    } else {
        console.log("No votes to add to IndexedDB.");
    }

    // Bulk update proposals' totalStake
    const proposalUpdatePromises = Object.entries(proposalsToUpdate).map(([pid, newTotalStake]) =>
        db.proposals.update(pid, { totalStake: newTotalStake })
    );
    try {
        await Promise.all(proposalUpdatePromises);
        console.log("Updated totalStake for proposals.");
    } catch (error) {
        console.error("Error updating proposals' totalStake:", error);
    }

    // Update the last processed block in metadata
    try {
        await updateLastVoteProcessedBlock(toBlock + 1);
        console.log("Updated last processed vote block.");
    } catch (error) {
        console.error("Error updating last processed vote block:", error);
    }
}


// 7. Fetch and store Orchestrator data
async function fetchAndStoreOrchestrators() {
    console.log(`Fetching orchestrator data from ${orchDetailsURL}`);

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
                console.log("Orchestrator with missing eth_address. Skipping.");
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
            console.log(`Stored/Updated orchestrator ${orchestrator.eth_address}`);
        }

        console.log("Orchestrator data fetch and store completed.");
    } catch (error) {
        console.error("Error fetching orchestrator data:", error);
    }
}
// Periodic update function to fetch new proposals and votes
async function periodicUpdate() {
    try {
        console.log("Starting periodic update...");
        await fetchAndStoreOrchestrators();
        await fetchAndStoreProposals();
        await fetchAndStoreVotes();
        console.log("Periodic update completed.");
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
        console.log(`Retrieved ${proposals.length} proposals from IndexedDB`);

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
        // console.log("DataService - fetchPipelines data", data);
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
        // console.log("DataService fetchLeaderboardData",pipeline,model,region,isAIType);
        const endpoint = isAIType ? aiLeaderboardStatsURL : leaderboardStatsURL;
        let url = `${endpoint}?`;

        if (region && !region.includes("GLOBAL"))
            url += `region=${region}&`;

        if (isAIType) {
            url += `pipeline=${pipeline}&model=${model}`;
        }
        // console.log("DataService fetchLeaderboardData url" ,url);

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
        // console.log("DataService - fetchStatsData data", orchestrator, pipeline, model, isAIType);
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
