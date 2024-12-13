export const config = {
    // Server ports
    HTTP_PORT: 3002,
    WS_PORT: 3003,

    // WebSocket configuration
    WS_PATH: '/progress',
    WS_RECONNECT_TIMEOUT: 3000, // ms

    // Calculation state transitions
    CALCULATION_STATE_TIMEOUT: 2000, // ms

    // WebSocket message types
    MESSAGE_TYPES: {
        STATE_UPDATE: 'state_update',
        RESPONSE: 'response',
        ERROR: 'error'
    },

    // Calculation states
    STATES: {
        STARTING: 'STARTING_CALCULATION',
        IN_PROGRESS: 'IN_PROGRESS_CALCULATION',
        ALMOST_DONE: 'ALMOST_DONE_CALCULATION',
        SUCCESS: 'SUCCESS',
        FAIL: 'FAIL',
        CANCELED: 'CANCELED'
    },

    // WebSocket actions
    ACTIONS: {
        START: 'start',
        CANCEL: 'cancel'
    }
};
