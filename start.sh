#!/bin/sh

# Fetch the public IP address of the server using an external service
SERVER_IP=$(curl -s https://ifconfig.co)

# Print the IP address for debugging
echo "Server IP: $SERVER_IP"

# Ensure there is a newline at the end of the .env file before appending
echo "" >> /app/.env
echo "NEXTAUTH_URL=http://$SERVER_IP:3000" >> /app/.env

# Print the .env file contents for debugging
echo "Updated .env file contents:"
cat /app/.env

# Start Next.js application
npm start &

# Run the callCronAPI.js script
node /app/scripts/callCronAPI.js

# Keep the container running
tail -f /dev/null