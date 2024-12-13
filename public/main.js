const startBtn = document.getElementById('startBtn');
const cancelBtn = document.getElementById('cancelBtn');
const spinner = document.getElementById('spinner');
const status = document.getElementById('status');

let ws = null;

function connectWebSocket() {
    ws = new WebSocket('ws://localhost:3001/progress');
    
    ws.onopen = () => {
        console.log('Connected to WebSocket');
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        updateStatus(data.state);
    };
    
    ws.onclose = () => {
        console.log('Disconnected from WebSocket');
        // Try to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
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
    try {
        const response = await fetch('/startCalculation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            status.textContent = error.error;
        }
    } catch (error) {
        console.error('Error starting calculation:', error);
        status.textContent = 'Error starting calculation';
    }
}

async function cancelCalculation() {
    try {
        const response = await fetch('/stopCalculation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            status.textContent = error.error;
        }
    } catch (error) {
        console.error('Error canceling calculation:', error);
        status.textContent = 'Error canceling calculation';
    }
}

startBtn.addEventListener('click', startCalculation);
cancelBtn.addEventListener('click', cancelCalculation);

// Connect to WebSocket when page loads
connectWebSocket();
