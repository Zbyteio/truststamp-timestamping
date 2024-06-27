const fetch = require('node-fetch');

const callCronAPI = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/cron/cronStart', {
      method: 'GET',
    });
    const data = await response.json();
    console.log('Cron jobs scheduled:', data);
  } catch (error) {
    console.error('Error calling cron job API:', error);
  }
};

callCronAPI();