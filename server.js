import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ 
    server,
    path: '/ws'
});

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

app.use(express.static(join(__dirname, 'public')));
app.use(express.json());

// Store connected WebSocket clients and calculation state
const clients = new Set();
let calculationTimer = null;

function startCalculation() {
    if (calculationTimer) {
        return false; // Calculation already running
    }

    // Send STARTING_CALCULATION immediately
    wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify({
                type: 'STARTING_CALCULATION',
                data: { state: 'Starting calculation...' }
            }));
        }
    });

    // Schedule IN_PROGRESS after 2 seconds
    setTimeout(() => {
        wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(JSON.stringify({
                    type: 'IN_PROGRESS_CALCULATION',
                    data: { state: 'Calculation in progress...' }
                }));
            }
        });
    }, 2000);

    // Schedule ALMOST_DONE after 4 seconds
    setTimeout(() => {
        wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(JSON.stringify({
                    type: 'ALMOST_DONE_CALCULATION',
                    data: { state: 'Almost done...' }
                }));
            }
        });
    }, 4000);

    // Schedule SUCCESS after 6 seconds
    calculationTimer = setTimeout(() => {
        wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(JSON.stringify({
                    type: 'CALCULATION_COMPLETE',
                    data: { state: 'SUCCESS' }
                }));
            }
        });
        calculationTimer = null;
    }, 6000);

    return true;
}

function stopCalculation() {
    if (calculationTimer) {
        clearTimeout(calculationTimer);
        calculationTimer = null;

        wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(JSON.stringify({
                    type: 'CALCULATION_STOPPED',
                    data: { state: 'CANCELED' }
                }));
            }
        });
        return true;
    }
    return false;
}

// HTTP endpoints just trigger the WebSocket messages
app.post('/startCalculation', (req, res) => {
    console.log('Start calculation requested');
    const started = startCalculation();
    res.json({ status: started ? 'ok' : 'calculation_already_running' });
});

app.post('/stopCalculation', (req, res) => {
    console.log('Stop calculation requested');
    const stopped = stopCalculation();
    res.json({ status: stopped ? 'ok' : 'no_calculation_running' });
});

// WebSocket connection handling
wss.on('connection', (ws, request) => {
    console.log(`New WebSocket connection from ${request.socket.remoteAddress}`);
    clients.add(ws);
    
    // Send welcome message
    ws.send(JSON.stringify({
        type: 'CONNECTED',
        data: { state: 'WebSocket connection established' }
    }));
    
    ws.on('close', () => {
        console.log('WebSocket connection closed');
        clients.delete(ws);
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
    });
});

const PORT = 3002;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server path: ws://localhost:${PORT}/ws`);
});