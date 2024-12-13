const startBtn = document.getElementById('startBtn');
const cancelBtn = document.getElementById('cancelBtn');
const spinner = document.getElementById('spinner');
const status = document.getElementById('status');

let ws = null;

function connectWebSocket() {
    ws = new WebSocket('ws://localhost:3003/progress');
    
    ws.onopen = () => {
        console.log('Connected to WebSocket');
        status.textContent = 'Connected to WebSocket';
    };
    
    ws.onmessage = (event) => {
        console.log('Received message:', event.data);
        const data = JSON.parse(event.data);
        
        switch(data.type) {
            case 'state_update':
                updateStatus(data.data.state);
                break;
            case 'response':
                console.log('Server response:', data.data);
                break;
            case 'error':
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
        setTimeout(connectWebSocket, 3000);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        status.textContent = 'WebSocket error occurred';
        spinner.style.display = 'none';
    };
}

function updateStatus(state) {
    status.textContent = state;
    
    if (state === 'STARTING_CALCULATION' || 
        state === 'IN_PROGRESS_CALCULATION' || 
        state === 'ALMOST_DONE_CALCULATION') {
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
        action: 'start',
        timestamp: new Date().toISOString()
    }));
}

async function cancelCalculation() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        status.textContent = 'WebSocket not connected';
        return;
    }

    ws.send(JSON.stringify({
        action: 'cancel',
        timestamp: new Date().toISOString()
    }));
}

startBtn.addEventListener('click', startCalculation);
cancelBtn.addEventListener('click', cancelCalculation);

// Connect to WebSocket when page loads
connectWebSocket();
