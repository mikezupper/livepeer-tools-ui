// db.js
import Dexie from 'dexie';
const latestDbName = 'livepeer-tools-db-new';

const db = new Dexie(latestDbName);

db.version(1.0).stores({
    proposals: 'id, title, description, proposerAddress,status,voteStart,voteEnd, createdAt, [voteStart]',
    votes: '++id, proposalId, voterAddress, support, stakeAmount, castAt, reason, params, [proposalId+voterAddress]',
    orchestrators: 'eth_address, total_stake, reward_cut, fee_cut, activation_status, name, service_uri, avatar',
    capabilities: 'name',
    metadata: 'key, value'
});

if (indexedDB.databases) {
    indexedDB.databases()
        .then(databases => {
            const databasesToDelete = databases
                .map(db => db.name)
                .filter(name => name && name !== latestDbName);

            const deletePromises = databasesToDelete.map(name => {
                console.log(`Deleting database: ${name}`);
                return Dexie.delete(name);
            });

            return Promise.all(deletePromises);
        })
        // .then(() => console.log('Old databases deleted successfully.'))
        .catch(error => console.error('Error deleting old databases:', error));
} else {
    console.warn('indexedDB.databases() is not supported in this browser.');
}

export default db;
