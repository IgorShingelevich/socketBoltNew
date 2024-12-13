FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Expose ports for both HTTP and WebSocket
EXPOSE 3002 3003

# Start the application
CMD ["node", "server.js"]
