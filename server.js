const express = require('express');
const next = require('next');
const fetch = require('node-fetch');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();

    // Trigger the cron scheduler API route
    fetch(`${process.env.NEXTAUTH_URL}/api/cron/runCron`)
        .then(res => res.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error starting cron jobs:', error));

    // Custom Next.js request handler
    server.all('*', (req, res) => {
        return handle(req, res);
    });

    server.listen(3000, () => {
        console.log('> Ready on ${process.env.NEXTAUTH_URL}');
    });
});
