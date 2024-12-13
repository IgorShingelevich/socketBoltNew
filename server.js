import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// More detailed WebSocket server setup
const wss = new WebSocketServer({ 
    server,
    path: '/ws',
    clientTracking: true
});

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

app.use(express.static(join(__dirname, 'public')));
app.use(express.json());

// Store connected WebSocket clients
const clients = new Set();

// HTTP endpoints
app.post('/startCalculation', (req, res) => {
    console.log('Calculation started via HTTP');
    res.json({ status: 'ok' });
    
    // Broadcast calculation status via WebSocket
    broadcastToAll({
        type: 'STARTING_CALCULATION',
        data: { state: 'Starting calculation...' }
    });

    // Simulate calculation progress
    setTimeout(() => {
        broadcastToAll({
            type: 'IN_PROGRESS_CALCULATION',
            data: { state: 'Calculation in progress...' }
        });
    }, 2000);

    setTimeout(() => {
        broadcastToAll({
            type: 'ALMOST_DONE_CALCULATION',
            data: { state: 'Almost done...' }
        });
    }, 4000);

    // Add completion message
    setTimeout(() => {
        broadcastToAll({
            type: 'CALCULATION_COMPLETE',
            data: { state: 'Calculation complete!' }
        });
    }, 6000);
});

app.post('/stopCalculation', (req, res) => {
    console.log('Calculation stopped via HTTP');
    res.json({ status: 'ok' });
    
    broadcastToAll({
        type: 'CALCULATION_STOPPED',
        data: { state: 'Calculation stopped' }
    });
});

// WebSocket connection handling with detailed logging
wss.on('connection', (ws, request) => {
    console.log(`New WebSocket connection from ${request.socket.remoteAddress}`);
    console.log('Connection URL:', request.url);
    console.log('Current number of clients:', wss.clients.size);
    
    clients.add(ws);
    
    // Send immediate welcome message
    ws.send(JSON.stringify({
        type: 'CONNECTED',
        data: { state: 'WebSocket connection established' }
    }));
    
    ws.on('close', (code, reason) => {
        console.log('WebSocket connection closed:', { code, reason });
        console.log('Remaining clients:', wss.clients.size);
        clients.delete(ws);
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
    });
});

function broadcastToAll(message) {
    console.log('Broadcasting message:', message);
    const messageStr = JSON.stringify(message);
    let successCount = 0;
    
    clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(messageStr);
            successCount++;
        }
    });
    
    console.log(`Message broadcast to ${successCount} clients`);
}

const PORT = 3002;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server path: ws://localhost:${PORT}/ws`);
});