// DOM Elements
const startBtn = document.getElementById('startBtn');
const cancelBtn = document.getElementById('cancelBtn');
const spinner = document.getElementById('spinner');
const status = document.getElementById('status');

// WebSocket setup
let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

function connectWebSocket() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        status.textContent = 'Failed to connect after multiple attempts';
        return;
    }

    // Close existing connection if any
    if (ws) {
        ws.close();
        ws = null;
    }

    try {
        console.log('Attempting WebSocket connection...');
        ws = new WebSocket('ws://localhost:3002/ws');
        
        ws.onopen = () => {
            console.log('WebSocket Connected');
            status.textContent = 'Connected to WebSocket';
            reconnectAttempts = 0; // Reset attempts on successful connection
        };
        
        ws.onmessage = (event) => {
            console.log('WebSocket message received:', event.data);
            try {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        
        ws.onclose = (event) => {
            console.log('WebSocket Disconnected:', event.code, event.reason);
            status.textContent = 'Disconnected from WebSocket';
            ws = null;
            
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                console.log(`Reconnecting... Attempt ${reconnectAttempts}`);
                setTimeout(connectWebSocket, 3000);
            }
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            status.textContent = 'WebSocket error occurred';
        };
    } catch (error) {
        console.error('Error creating WebSocket:', error);
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            setTimeout(connectWebSocket, 3000);
        }
    }
}

function handleWebSocketMessage(data) {
    console.log('Handling WebSocket message:', data);
    switch(data.type) {
        case 'STARTING_CALCULATION':
            spinner.style.display = 'inline-block';
            status.textContent = data.data.state;
            break;
        case 'IN_PROGRESS_CALCULATION':
        case 'ALMOST_DONE_CALCULATION':
            status.textContent = data.data.state;
            break;
        case 'CALCULATION_STOPPED':
        case 'CALCULATION_COMPLETE':
            spinner.style.display = 'none';
            status.textContent = data.data.state;
            break;
        case 'CONNECTED':
            status.textContent = data.data.state;
            break;
        default:
            console.warn('Unknown message type:', data.type);
    }
}

async function startCalculation() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        status.textContent = 'WebSocket not connected';
        return;
    }

    try {
        const response = await fetch('/startCalculation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error('Failed to start calculation');
    } catch (error) {
        console.error('Error:', error);
        status.textContent = 'Error starting calculation';
        spinner.style.display = 'none';
    }
}

async function cancelCalculation() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        status.textContent = 'WebSocket not connected';
        return;
    }

    try {
        const response = await fetch('/stopCalculation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error('Failed to stop calculation');
    } catch (error) {
        console.error('Error:', error);
        status.textContent = 'Error stopping calculation';
    }
}

// Add event listeners
startBtn.addEventListener('click', startCalculation);
cancelBtn.addEventListener('click', cancelCalculation);

// Initialize WebSocket connection when page loads
connectWebSocket();

// Reconnect WebSocket when page becomes visible again
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && (!ws || ws.readyState !== WebSocket.OPEN)) {
        reconnectAttempts = 0; // Reset attempts when user returns to page
        connectWebSocket();
    }
});
