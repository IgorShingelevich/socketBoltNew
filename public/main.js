import { config } from '../config.js';

const startBtn = document.getElementById('startBtn');
const cancelBtn = document.getElementById('cancelBtn');
const spinner = document.getElementById('spinner');
const status = document.getElementById('status');

let ws = null;

function connectWebSocket() {
    ws = new WebSocket(`ws://localhost:${config.WS_PORT}${config.WS_PATH}`);
    
    ws.onopen = () => {
        console.log('Connected to WebSocket');
        status.textContent = 'Connected to WebSocket';
    };
    
    ws.onmessage = (event) => {
        console.log('Received message:', event.data);
        const data = JSON.parse(event.data);
        
        switch(data.type) {
            case config.MESSAGE_TYPES.STATE_UPDATE:
                updateStatus(data.data.state);
                break;
            case config.MESSAGE_TYPES.RESPONSE:
                console.log('Server response:', data.data);
                break;
            case config.MESSAGE_TYPES.ERROR:
                status.textContent = 'Error: ' + data.data.error;
                spinner.style.display = 'none';
                break;
            default:
                console.warn('Unknown message type:', data);
        }
    };
    
    ws.onclose = () => {
        console.log('Disconnected from WebSocket');
        status.textContent = 'Disconnected from WebSocket';
        spinner.style.display = 'none';
        // Try to reconnect after 3 seconds
        setTimeout(connectWebSocket, config.WS_RECONNECT_TIMEOUT);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        status.textContent = 'WebSocket error occurred';
        spinner.style.display = 'none';
    };
}

function updateStatus(state) {
    status.textContent = state;
    
    if (state === config.STATES.STARTING_CALCULATION || 
        state === config.STATES.IN_PROGRESS_CALCULATION || 
        state === config.STATES.ALMOST_DONE_CALCULATION) {
        spinner.style.display = 'inline-block';
    } else {
        spinner.style.display = 'none';
    }
}

async function startCalculation() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        status.textContent = 'WebSocket not connected';
        return;
    }

    ws.send(JSON.stringify({
        action: config.ACTIONS.START,
        timestamp: new Date().toISOString()
    }));
}

async function cancelCalculation() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        status.textContent = 'WebSocket not connected';
        return;
    }

    ws.send(JSON.stringify({
        action: config.ACTIONS.CANCEL,
        timestamp: new Date().toISOString()
    }));
}

startBtn.addEventListener('click', startCalculation);
cancelBtn.addEventListener('click', cancelCalculation);

// Connect to WebSocket when page loads
connectWebSocket();
