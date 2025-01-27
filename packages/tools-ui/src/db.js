// db.js
import Dexie from 'dexie';
const latestDbName = 'lp-tools-db';

const db = new Dexie(latestDbName);

db.version(1.0).stores({
    proposals: 'id, title, description, proposerAddress,proposerName,proposerAvatar,voteStart,voteEnd,status, createdAt',
    votes: '++id, proposalId, voterAddress, support, stakeAmount, castAt, reason, params',
    // payouts: 'transaction_id,eth_address,timestamp,total_tokens,orch_tokens,reward_cut,txn_fee,txn_fee_usd,lpt_price,eth_price,total_value_usd',
    orchestrators: 'eth_address, total_stake, reward_cut, fee_cut, activation_status, name, service_uri, avatar, last_event_timestamp, [total_stake+activation_status]',
    gateways: 'eth_address, deposit, reserve, name, avatar, [deposit+reserve]',
    capabilities: 'name',
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
