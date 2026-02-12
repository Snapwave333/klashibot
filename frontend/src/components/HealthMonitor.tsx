import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useTradingStore } from '../context/TradingContext';

export const HealthMonitor = () => {
  const { health } = useTradingStore();

  // Refs to track previous states for transition detection
  const prevWs = useRef(health.websocket_connected);
  const prevDb = useRef(health.database?.status);
  const prevMcp = useRef(health.mcp?.status);

  useEffect(() => {
    // 1. WebSocket Connection Alert
    if (prevWs.current && !health.websocket_connected) {
      toast.error('Lost connection to Backend!', {
        id: 'ws-loss',
        icon: '🔌',
        duration: 5000,
      });
    }
    prevWs.current = health.websocket_connected;

    // 2. Database/Redis Alert
    if (prevDb.current === 'ok' && health.database?.status === 'error') {
      toast.error(`Database Failure: ${health.database.message}`, {
        id: 'db-fail',
        icon: '💽',
      });
    }
    prevDb.current = health.database?.status;

    // 3. MCP/Kalshi Alert
    if (prevMcp.current === 'ok' && health.mcp?.status === 'error') {
      toast.error('MCP / Kalshi API Disconnected!', {
        id: 'mcp-fail',
        icon: '🌐',
      });
    }
    prevMcp.current = health.mcp?.status;

  }, [health]);

  return null;
};
