import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const { HTTP_PORT, WS_PORT, WS_PATH, STATES, CALCULATION_STATE_TIMEOUT, MESSAGE_TYPES } = config;

// Initialize WebSocket Server on separate port
const wss = new WebSocketServer({ port: WS_PORT, path: WS_PATH });

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Explicitly handle root route
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

let calculationState = null;
let stateTimeout = null;
const connectedClients = new Set();

function clearCalculation() {
  calculationState = null;
  if (stateTimeout) {
    clearTimeout(stateTimeout);
    stateTimeout = null;
  }
}

function startCalculationProcess() {
  if (calculationState) {
    return false;
  }

  // Start the calculation process
  calculationState = STATES.STARTING;
  broadcastState(STATES.STARTING);

  // State transition: STARTING -> IN_PROGRESS
  stateTimeout = setTimeout(() => {
    broadcastState(STATES.IN_PROGRESS);
    
    // State transition: IN_PROGRESS -> ALMOST_DONE
    stateTimeout = setTimeout(() => {
      broadcastState(STATES.ALMOST_DONE);
      
      // State transition: ALMOST_DONE -> SUCCESS
      stateTimeout = setTimeout(() => {
        broadcastState(STATES.SUCCESS);
        clearCalculation();
      }, CALCULATION_STATE_TIMEOUT);
    }, CALCULATION_STATE_TIMEOUT);
  }, CALCULATION_STATE_TIMEOUT);

  return true;
}

function cancelCalculationProcess() {
  if (!calculationState) {
    return false;
  }

  clearCalculation();
  broadcastState(STATES.CANCELED);
  return true;
}

function broadcastState(state) {
  calculationState = state;
  console.log(`Broadcasting state: ${state}`);
  const message = JSON.stringify({
    type: MESSAGE_TYPES.STATE_UPDATE,
    data: {
      state: state,
      timestamp: new Date().toISOString()
    }
  });
  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  connectedClients.add(ws);
  console.log(`Total connected clients: ${connectedClients.size}`);

  // Send current state if exists
  if (calculationState) {
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.STATE_UPDATE,
      data: {
        state: calculationState,
        timestamp: new Date().toISOString()
      }
    }));
  }

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received WebSocket message:', data);
      
      switch(data.action) {
        case 'start':
          if (startCalculationProcess()) {
            ws.send(JSON.stringify({
              type: MESSAGE_TYPES.RESPONSE,
              data: {
                status: 'started',
                timestamp: new Date().toISOString()
              }
            }));
          } else {
            ws.send(JSON.stringify({
              type: MESSAGE_TYPES.ERROR,
              data: {
                error: 'Calculation already running',
                timestamp: new Date().toISOString()
              }
            }));
          }
          break;
          
        case 'cancel':
          if (cancelCalculationProcess()) {
            ws.send(JSON.stringify({
              type: MESSAGE_TYPES.RESPONSE,
              data: {
                status: 'canceled',
                timestamp: new Date().toISOString()
              }
            }));
          } else {
            ws.send(JSON.stringify({
              type: MESSAGE_TYPES.ERROR,
              data: {
                error: 'No calculation running',
                timestamp: new Date().toISOString()
              }
            }));
          }
          break;
          
        default:
          ws.send(JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            data: {
              error: 'Unknown action',
              timestamp: new Date().toISOString()
            }
          }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: MESSAGE_TYPES.ERROR,
        data: {
          error: 'Invalid message format',
          timestamp: new Date().toISOString()
        }
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
    connectedClients.delete(ws);
    console.log(`Total connected clients: ${connectedClients.size}`);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    connectedClients.delete(ws);
    console.log(`Total connected clients: ${connectedClients.size}`);
  });
});

// HTTP endpoints (now just proxying to WebSocket handlers)
app.post('/startCalculation', (req, res) => {
  if (startCalculationProcess()) {
    res.json({ status: 'Calculation started' });
  } else {
    res.status(400).json({ error: 'Calculation already running' });
  }
});

app.post('/stopCalculation', (req, res) => {
  if (cancelCalculationProcess()) {
    res.json({ status: 'Calculation canceled' });
  } else {
    res.status(400).json({ error: 'No calculation running' });
  }
});

// Start HTTP server
server.listen(HTTP_PORT, () => {
  console.log(`HTTP Server running on port ${HTTP_PORT}`);
  console.log(`WebSocket Server running on port ${WS_PORT}`);
});