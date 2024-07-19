# Use the official Node.js image as the base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Install dependencies and build tools, including curl
RUN apk add --no-cache python3 make g++ bash curl iproute2

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the Next.js application
RUN npm run build

# Copy the start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["/start.sh"]