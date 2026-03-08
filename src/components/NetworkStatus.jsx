
import React from 'react';
import { WifiOff } from 'lucide-react';
import useOnlineStatus from '../hooks/useOnlineStatus';

const NetworkStatus = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm">
      <WifiOff size={16} />
      <span>You are currently offline. Using cached data.</span>
    </div>
  );
};

export default NetworkStatus;
