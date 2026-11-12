import React, { useState, useEffect } from 'react';
import { explorerService } from '../services/api';
import { Activity, CheckCircle2, AlertCircle } from 'lucide-react';

export default function NetworkStatusPill() {
  const [health, setHealth] = useState({ status: 'CHECKING', channel: 'medichain-channel' });

  useEffect(() => {
    let isMounted = true;
    const fetchHealth = async () => {
      try {
        const res = await explorerService.getHealth();
        if (isMounted) {
          setHealth(res.data.health || { status: 'ONLINE' });
        }
      } catch (e) {
        if (isMounted) {
          setHealth({ status: 'OFFLINE', error: 'Fabric peer unreachable' });
        }
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const isOnline = health.status === 'ONLINE';

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/5 border border-slate-200/80 text-xs">
      <span className="relative flex h-2 w-2">
        {isOnline ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        )}
      </span>
      <span className="font-medium text-slate-700">Fabric 2.5:</span>
      <span className={isOnline ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
        {isOnline ? 'medichain-channel' : 'Offline'}
      </span>
    </div>
  );
}

