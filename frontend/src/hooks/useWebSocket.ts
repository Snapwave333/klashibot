import { useEffect, useState, useCallback, useRef } from 'react';

type ConnectionState = 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';

interface UseWebSocketOptions {
  url: string;
  onMessage: (data: any) => void;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
}

interface UseWebSocketReturn {
  ws: WebSocket | null;
  connectionState: ConnectionState;
  send: (data: any) => void;
}

export function useWebSocket({
  url,
  onMessage,
  reconnectDelay = 1000,
  maxReconnectDelay = 30000,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('CONNECTING');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    try {
      const websocket = new WebSocket(url);

      websocket.onopen = () => {
        console.log('WebSocket connected');
        setConnectionState('CONNECTED');
        setWs(websocket);
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
      };

      websocket.onmessage = (event) => {
        try {
          if (!event.data) {
            console.warn('WebSocket: Received empty message');
            return;
          }
          const data = JSON.parse(event.data);
          if (typeof onMessage === 'function') {
            onMessage(data);
          } else {
            console.error('WebSocket: onMessage is not a function');
          }
        } catch (error) {
          console.error('WebSocket: Failed to parse message:', {
            error: error instanceof Error ? error.message : String(error),
            rawData: event.data?.substring(0, 100), // Log first 100 chars for debugging
          });
        }
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionState('DISCONNECTED');
        setWs(null);

        // Implement exponential backoff for reconnection
        reconnectAttemptsRef.current += 1;
        const delay = Math.min(
          reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1),
          maxReconnectDelay
        );

        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
        setConnectionState('RECONNECTING');

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', {
          error,
          url,
          readyState: websocket.readyState,
          timestamp: new Date().toISOString(),
        });
        // Set connection state to reflect error
        setConnectionState('DISCONNECTED');
      };

      return websocket;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionState('DISCONNECTED');
      return null;
    }
  }, [url, onMessage, reconnectDelay, maxReconnectDelay]);

  useEffect(() => {
    let websocket: WebSocket | null = null;

    // Cleanup function to close previous connection
    const cleanup = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (websocket) {
        websocket.close();
      }
    };

    websocket = connect();

    return cleanup;
  }, [connect]);

  const send = useCallback(
    (data: any) => {
      try {
        if (!ws) {
          console.warn('WebSocket: Cannot send - websocket instance is null');
          return;
        }

        if (ws.readyState === WebSocket.CONNECTING) {
          console.warn('WebSocket: Cannot send - still connecting');
          return;
        }

        if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
          console.warn('WebSocket: Cannot send - connection is closing/closed');
          return;
        }

        if (ws.readyState === WebSocket.OPEN) {
          const message = JSON.stringify(data, null, 2);
          ws.send(message);
          console.info('[WebSocket] Message sent successfully');
        }
      } catch (error) {
        console.error('WebSocket: Failed to send message:', {
          error: error instanceof Error ? error.message : String(error),
          readyState: ws?.readyState,
          data: typeof data === 'object' ? JSON.stringify(data, null, 2).substring(0, 100) : data,
        });
      }
    },
    [ws]
  );

  return { ws, connectionState, send };
}
