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

// Store connected WebSocket clients
const clients = new Set();
let calculationTimer = null;
let currentState = null;
let stateTimers = [];

function clearStateTimers() {
    stateTimers.forEach(timer => clearTimeout(timer));
    stateTimers = [];
}

function broadcastMessage(type, state) {
    console.log(`Broadcasting message - type: ${type}, state: ${state}`);
    currentState = state;
    const message = JSON.stringify({
        type: type,
        data: { state: state }
    });
    
    wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
            console.log('Sending to client:', message);
            client.send(message);
        }
    });
}

function startCalculation() {
    if (calculationTimer) {
        console.log('Calculation already running');
        return false;
    }

    console.log('Starting calculation sequence');
    clearStateTimers();
    
    // Immediate: STARTING_CALCULATION
    broadcastMessage('STARTING_CALCULATION', 'Starting calculation...');
    
    // After 2s: IN_PROGRESS_CALCULATION
    const timer1 = setTimeout(() => {
        console.log('Sending in-progress message');
        broadcastMessage('IN_PROGRESS_CALCULATION', 'Calculation in progress...');
    }, 2000);
    stateTimers.push(timer1);

    // After 4s: ALMOST_DONE_CALCULATION
    const timer2 = setTimeout(() => {
        console.log('Sending almost-done message');
        broadcastMessage('ALMOST_DONE_CALCULATION', 'Almost done...');
    }, 4000);
    stateTimers.push(timer2);

    // After 6s: SUCCESS
    calculationTimer = setTimeout(() => {
        console.log('Sending completion message');
        broadcastMessage('CALCULATION_COMPLETE', 'SUCCESS');
        clearStateTimers();
        calculationTimer = null;
        currentState = null;
    }, 6000);
    stateTimers.push(calculationTimer);

    return true;
}

function stopCalculation() {
    if (!calculationTimer) {
        console.log('No calculation running to stop');
        return false;
    }
    
    console.log('Stopping calculation');
    clearTimeout(calculationTimer);
    clearStateTimers();
    calculationTimer = null;
    broadcastMessage('CALCULATION_STOPPED', 'CANCELED');
    currentState = null;
    return true;
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
    const welcomeMessage = JSON.stringify({
        type: 'CONNECTED',
        data: { state: 'WebSocket connection established' }
    });
    console.log('Sending welcome message:', welcomeMessage);
    ws.send(welcomeMessage);
    
    ws.on('message', (message) => {
        console.log('Received WebSocket message:', message.toString());
    });

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