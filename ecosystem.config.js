module.exports = {
    apps: [
      {
        name: 'hashify-next',
        script: 'npm',
        args: 'start',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
      },
      {
        name: 'call-cron-api',
        script: './scripts/callCronAPI.js', // Path to your script
        cron_restart: '0 0 * * *', // Cron expression for daily at midnight
        autorestart: false,
        watch: false,
      },
    ],
  };
  