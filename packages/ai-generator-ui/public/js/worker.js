// Web Worker code (worker.js)
// This would be in a separate file
self.addEventListener('message', async (event) => {
    if (event.data.type === 'FETCH_DATA') {
        try {
            const response = await fetch('https://lpc-leaderboard-serverless.vercel.app/api/pipelines   ');
            const data = await response.json();
            self.postMessage({ type: 'UPDATE_DATA', data });
        } catch (error) {
            console.error('Error fetching data:', error);
            self.postMessage({ type: 'ERROR', error: error.message });
        }
    }
});
