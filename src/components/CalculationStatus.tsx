import React from 'react';
import { Loader2 } from 'lucide-react';

interface CalculationStatusProps {
  status: string | null;
  isLoading: boolean;
}

export const CalculationStatus: React.FC<CalculationStatusProps> = ({ status, isLoading }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'SUCCESS':
        return 'text-green-600';
      case 'FAIL':
        return 'text-red-600';
      case 'CANCELED':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';
    }
  };

  if (!status && !isLoading) return null;

  return (
    <div className="flex items-center gap-2 mt-4">
      {isLoading && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
      <span className={`font-medium ${getStatusColor()}`}>
        {status || 'Processing...'}
      </span>
    </div>
  );
};