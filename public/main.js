import { config } from '../config.js';

const startBtn = document.getElementById('startBtn');
const cancelBtn = document.getElementById('cancelBtn');
const spinner = document.getElementById('spinner');
const status = document.getElementById('status');

// WebSocket setup
let ws = null;

function connectWebSocket() {
    ws = new WebSocket(`ws://localhost:3002`);
    
    ws.onopen = () => {
        console.log('WebSocket Connected');
    };
    
    ws.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        const data = JSON.parse(event.data);
        
        // Update UI based on calculation state
        switch(data.type) {
            case 'STARTING_CALCULATION':
            case 'IN_PROGRESS_CALCULATION':
            case 'ALMOST_DONE_CALCULATION':
            case 'CALCULATION_STOPPED':
                status.textContent = data.data.state;
                break;
            default:
                console.warn('Unknown message type:', data.type);
        }
    };
    
    ws.onclose = () => {
        console.log('WebSocket Disconnected');
        // Try to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
    };
}

async function startCalculation() {
    spinner.style.display = 'block';
    status.textContent = 'Starting calculation...';
    
    try {
        const response = await fetch('/startCalculation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to start calculation');
        }
    } catch (error) {
        console.error('Error:', error);
        status.textContent = 'Error starting calculation';
        spinner.style.display = 'none';
    }
}

async function cancelCalculation() {
    try {
        const response = await fetch('/stopCalculation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to stop calculation');
        }
    } catch (error) {
        console.error('Error:', error);
        status.textContent = 'Error stopping calculation';
    }
}

startBtn.addEventListener('click', startCalculation);
cancelBtn.addEventListener('click', cancelCalculation);

// Connect WebSocket when page loads
connectWebSocket();
