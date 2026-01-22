// src/hooks/useWebSocket.js
// ═══════════════════════════════════════════════════════════════════════════════
// WEBSOCKET HOOK - Real-time connection management
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';

// Connection states
export const WS_STATE = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
};

// Default configuration
const DEFAULT_CONFIG = {
  reconnect: true,
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  reconnectDelayMax: 30000,
  heartbeatInterval: 30000,
  debug: false,
};

/**
 * useWebSocket - WebSocket connection hook with auto-reconnect
 * 
 * @param {string} url - WebSocket URL
 * @param {object} options - Configuration options
 * @returns {object} WebSocket state and methods
 */
export default function useWebSocket(url, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };
  
  const [state, setState] = useState(WS_STATE.DISCONNECTED);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const messageHandlersRef = useRef(new Map());

  const log = useCallback((...args) => {
    if (config.debug) {
      console.log('[WebSocket]', ...args);
    }
  }, [config.debug]);

  /**
   * Clear all timers
   */
  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  /**
   * Start heartbeat
   */
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
        log('Heartbeat sent');
      }
    }, config.heartbeatInterval);
  }, [config.heartbeatInterval, log]);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (!url) {
      log('No URL provided');
      return;
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    setState(WS_STATE.CONNECTING);
    log('Connecting to', url);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        log('Connected');
        setState(WS_STATE.CONNECTED);
        setError(null);
        reconnectAttemptsRef.current = 0;
        startHeartbeat();
        
        // Call onOpen handler if provided
        options.onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          log('Received:', data.type || 'message');
          
          // Handle pong (heartbeat response)
          if (data.type === 'pong') {
            return;
          }

          setLastMessage(data);

          // Call type-specific handlers
          if (data.type && messageHandlersRef.current.has(data.type)) {
            messageHandlersRef.current.get(data.type).forEach(handler => {
              try {
                handler(data);
              } catch (e) {
                console.error('[WebSocket] Handler error:', e);
              }
            });
          }

          // Call general onMessage handler
          options.onMessage?.(data);
        } catch (e) {
          log('Failed to parse message:', e);
          // Non-JSON message
          setLastMessage({ raw: event.data });
          options.onMessage?.({ raw: event.data });
        }
      };

      ws.onerror = (event) => {
        log('Error:', event);
        setError(event);
        setState(WS_STATE.ERROR);
        options.onError?.(event);
      };

      ws.onclose = (event) => {
        log('Closed:', event.code, event.reason);
        clearTimers();
        
        const wasConnected = state === WS_STATE.CONNECTED;
        setState(WS_STATE.DISCONNECTED);
        
        options.onClose?.(event);

        // Attempt reconnect if enabled and not manually closed
        if (config.reconnect && event.code !== 1000 && wasConnected) {
          attemptReconnect();
        }
      };

    } catch (e) {
      log('Connection error:', e);
      setError(e);
      setState(WS_STATE.ERROR);
    }
  }, [url, config.reconnect, options, startHeartbeat, clearTimers, log, state]);

  /**
   * Attempt reconnection with exponential backoff
   */
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= config.reconnectAttempts) {
      log('Max reconnect attempts reached');
      setState(WS_STATE.DISCONNECTED);
      return;
    }

    reconnectAttemptsRef.current++;
    setState(WS_STATE.RECONNECTING);

    // Exponential backoff
    const delay = Math.min(
      config.reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1),
      config.reconnectDelayMax
    );

    log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${config.reconnectAttempts})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [config.reconnectAttempts, config.reconnectDelay, config.reconnectDelayMax, connect, log]);

  /**
   * Disconnect WebSocket
   */
  const disconnect = useCallback(() => {
    log('Disconnecting');
    clearTimers();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    
    setState(WS_STATE.DISCONNECTED);
  }, [clearTimers, log]);

  /**
   * Send message
   */
  const send = useCallback((data) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      log('Cannot send - not connected');
      return false;
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      wsRef.current.send(message);
      log('Sent:', data.type || 'message');
      return true;
    } catch (e) {
      log('Send error:', e);
      return false;
    }
  }, [log]);

  /**
   * Send typed message
   */
  const sendMessage = useCallback((type, payload = {}) => {
    return send({ type, ...payload, timestamp: Date.now() });
  }, [send]);

  /**
   * Subscribe to message type
   */
  const subscribe = useCallback((type, handler) => {
    if (!messageHandlersRef.current.has(type)) {
      messageHandlersRef.current.set(type, new Set());
    }
    messageHandlersRef.current.get(type).add(handler);
    
    // Return unsubscribe function
    return () => {
      messageHandlersRef.current.get(type)?.delete(handler);
    };
  }, []);

  /**
   * Unsubscribe from message type
   */
  const unsubscribe = useCallback((type, handler) => {
    if (handler) {
      messageHandlersRef.current.get(type)?.delete(handler);
    } else {
      messageHandlersRef.current.delete(type);
    }
  }, []);

  // Auto-connect on mount if URL provided
  useEffect(() => {
    if (url && options.autoConnect !== false) {
      connect();
    }

    return () => {
      clearTimers();
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmount');
      }
    };
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // State
    state,
    isConnected: state === WS_STATE.CONNECTED,
    isConnecting: state === WS_STATE.CONNECTING,
    isReconnecting: state === WS_STATE.RECONNECTING,
    lastMessage,
    error,
    
    // Methods
    connect,
    disconnect,
    send,
    sendMessage,
    subscribe,
    unsubscribe,
    
    // Constants
    WS_STATE,
  };
}

/**
 * useWebSocketSubscription - Subscribe to specific message types
 * Convenience hook for subscribing to WebSocket messages
 * 
 * @param {object} ws - WebSocket instance from useWebSocket
 * @param {string} type - Message type to subscribe to
 * @param {function} handler - Handler function
 * @param {Array} deps - Dependencies for handler
 */
export function useWebSocketSubscription(ws, type, handler, deps = []) {
  useEffect(() => {
    if (!ws || !type || !handler) return;
    
    const unsubscribe = ws.subscribe(type, handler);
    return unsubscribe;
  }, [ws, type, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Create WebSocket URL from current location
 * @param {string} path - WebSocket path
 * @returns {string} Full WebSocket URL
 */
export function createWebSocketUrl(path = '/ws') {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}${path}`;
}

/**
 * Get WebSocket URL from environment or construct from current location
 * @param {string} envKey - Environment variable key
 * @param {string} defaultPath - Default path if env not set
 * @returns {string} WebSocket URL
 */
export function getWebSocketUrl(envKey = 'VITE_WS_URL', defaultPath = '/ws') {
  const envUrl = import.meta?.env?.[envKey];
  if (envUrl) return envUrl;
  return createWebSocketUrl(defaultPath);
}
