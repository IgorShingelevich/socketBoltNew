import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

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
});

app.post('/stopCalculation', (req, res) => {
    console.log('Calculation stopped via HTTP');
    res.json({ status: 'ok' });
    
    broadcastToAll({
        type: 'CALCULATION_STOPPED',
        data: { state: 'Calculation stopped' }
    });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    clients.add(ws);
    
    ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
        clients.delete(ws);
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
    });
});

function broadcastToAll(message) {
    const messageStr = JSON.stringify(message);
    clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(messageStr);
        }
    });
}

const PORT = 3002;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});