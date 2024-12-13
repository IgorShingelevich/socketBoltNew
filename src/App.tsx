import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Square } from 'lucide-react';
import { CalculationStatus } from './components/CalculationStatus';

function App() {
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    ws.current = new WebSocket('ws://localhost:3001/progress');

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatus(data.state);
      
      if (['SUCCESS', 'FAIL', 'CANCELED'].includes(data.state)) {
        setIsLoading(false);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
      setIsLoading(false);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsLoading(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const startCalculation = async () => {
    try {
      setIsLoading(true);
      await fetch('http://localhost:3000/startCalculation', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error starting calculation:', error);
      setIsLoading(false);
    }
  };

  const cancelCalculation = async () => {
    try {
      await fetch('http://localhost:3000/stopCalculation', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error canceling calculation:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          WebSocket Training App
        </h1>
        
        <div className="space-y-4">
          <button
            onClick={startCalculation}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-4 h-4" />
            Start Calculation
          </button>
          
          <button
            onClick={cancelCalculation}
            disabled={!isLoading}
            className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Square className="w-4 h-4" />
            Cancel Calculation
          </button>
          
          <CalculationStatus status={status} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

export default App;