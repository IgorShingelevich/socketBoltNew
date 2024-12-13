const express = require('express');
const WebSocket = require('ws');
const { createServer } = require('http');
const path = require('path');
const fs = require('fs');

const app = express();
const server = createServer(app);
const HTTP_PORT = 3000;
const WS_PORT = 3001;

// Initialize WebSocket Server on separate port
const wss = new WebSocket.Server({ port: WS_PORT, path: '/progress' });

app.use(express.json());
app.use(express.static(__dirname));

// Explicitly handle root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

let calculationState = null;
let stateTimeout = null;

const states = {
  STARTING: 'STARTING_CALCULATION',
  IN_PROGRESS: 'IN_PROGRESS_CALCULATION',
  ALMOST_DONE: 'ALMOST_DONE_CALCULATION',
  SUCCESS: 'SUCCESS',
  FAIL: 'FAIL',
  CANCELED: 'CANCELED'
};

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');

  // Send current state if exists
  if (calculationState) {
    ws.send(JSON.stringify({ state: calculationState }));
  }

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function clearCalculation() {
  calculationState = null;
  if (stateTimeout) {
    clearTimeout(stateTimeout);
    stateTimeout = null;
  }
}

function broadcastState(state) {
  calculationState = state;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ state }));
    }
  });
}

app.post('/startCalculation', (req, res) => {
  if (calculationState) {
    return res.status(400).json({ error: 'Calculation already running' });
  }

  calculationState = states.STARTING;
  broadcastState(states.STARTING);

  // Simulate state transitions
  stateTimeout = setTimeout(() => {
    broadcastState(states.IN_PROGRESS);
    
    stateTimeout = setTimeout(() => {
      broadcastState(states.ALMOST_DONE);
      
      stateTimeout = setTimeout(() => {
        broadcastState(states.SUCCESS);
        clearCalculation();
      }, 2000);
    }, 2000);
  }, 2000);

  res.json({ status: 'Calculation started' });
});

app.post('/stopCalculation', (req, res) => {
  if (!calculationState) {
    return res.status(400).json({ error: 'No calculation running' });
  }

  clearCalculation();
  broadcastState(states.CANCELED);
  res.json({ status: 'Calculation canceled' });
});

// Start HTTP server
server.listen(HTTP_PORT, () => {
  console.log(`HTTP Server running on port ${HTTP_PORT}`);
  console.log(`WebSocket Server running on port ${WS_PORT}`);
});