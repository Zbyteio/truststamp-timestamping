const fetch = require('node-fetch');

const callCronAPI = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch('http://localhost:3000/api/cron/cronStart', {
        method: 'GET',
      });
      const data = await response.json();
      console.log('Cron jobs scheduled:', data);
      return;
    } catch (error) {
      console.error('Error calling cron job API, retrying...', error);
      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, delay));
      } else {
        console.error('Max retries reached. Could not call cron job API.');
      }
    }
  }
};

callCronAPI();