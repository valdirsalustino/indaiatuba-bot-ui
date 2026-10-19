import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const RealtimeContext = createContext({
    subscribe: () => () => {},
    connectionEpoch: 0,
    isConnected: false,
});

const PING_INTERVAL_MS = 25000;
const BASE_BACKOFF_MS = 1500;
const MAX_BACKOFF_MS = 30000;

/**
 * Owns the single authenticated WebSocket connection for the tenant session and
 * dispatches incoming `{ update, composite_id, data }` events to registered subscribers.
 *
 * Security:
 * - Before opening the socket, exchanges the bearer JWT for a single-use short-lived
 *   ticket via `POST /{tenant}/ws-ticket`, avoiding JWT leakage in URLs/logs.
 * - Reconnects with exponential backoff + jitter on disconnect.
 * - Increments `connectionEpoch` on every successful reconnection so views can
 *   catch up on missed state.
 */
export function RealtimeProvider({ token, apiBaseUrl, websocketUrl, onAuthFailure, children }) {
    const subscribersRef = useRef(new Map());
    const [connectionEpoch, setConnectionEpoch] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const onAuthFailureRef = useRef(onAuthFailure);

    useEffect(() => {
        onAuthFailureRef.current = onAuthFailure;
    }, [onAuthFailure]);

    const subscribe = useCallback((updateType, handler) => {
        const map = subscribersRef.current;
        if (!map.has(updateType)) {
            map.set(updateType, new Set());
        }
        const set = map.get(updateType);
        set.add(handler);
        return () => {
            set.delete(handler);
            if (set.size === 0) {
                map.delete(updateType);
            }
        };
    }, []);

    useEffect(() => {
        if (!token || !websocketUrl || !apiBaseUrl) {
            setIsConnected(false);
            return;
        }

        let ws = null;
        let reconnectTimeout = null;
        let pingInterval = null;
        let cancelled = false;
        let attempt = 0;

        const clearTimers = () => {
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = null;
            }
            if (pingInterval) {
                clearInterval(pingInterval);
                pingInterval = null;
            }
        };

        const scheduleReconnect = () => {
            if (cancelled) return;
            const expDelay = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * Math.pow(2, attempt));
            const jitter = Math.floor(Math.random() * 500);
            attempt += 1;
            reconnectTimeout = setTimeout(connect, expDelay + jitter);
        };

        const dispatch = (payload) => {
            if (!payload || !payload.update) return;
            const handlers = subscribersRef.current.get(payload.update);
            if (handlers) {
                handlers.forEach((fn) => {
                    try {
                        fn(payload);
                    } catch (err) {
                        console.error(`Error in realtime subscriber for '${payload.update}':`, err);
                    }
                });
            }
            const wildcardHandlers = subscribersRef.current.get('*');
            if (wildcardHandlers) {
                wildcardHandlers.forEach((fn) => {
                    try {
                        fn(payload);
                    } catch (err) {
                        console.error('Error in wildcard realtime subscriber:', err);
                    }
                });
            }
        };

        const connect = async () => {
            if (cancelled) return;
            const currentToken = localStorage.getItem('admin_token') || token;
            if (!currentToken) return;

            let ticket = null;
            try {
                const res = await fetch(`${apiBaseUrl}/ws-ticket`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${currentToken}` },
                });
                if (res.status === 401) {
                    if (onAuthFailureRef.current) onAuthFailureRef.current();
                    return;
                }
                if (!res.ok) {
                    throw new Error(`Failed to obtain WS ticket (status ${res.status})`);
                }
                const body = await res.json();
                ticket = body.ticket;
            } catch (err) {
                console.warn('Could not obtain WebSocket ticket, scheduling retry:', err);
                scheduleReconnect();
                return;
            }

            if (cancelled || !ticket) return;

            const separator = websocketUrl.includes('?') ? '&' : '?';
            ws = new WebSocket(`${websocketUrl}${separator}ticket=${encodeURIComponent(ticket)}`);

            ws.onopen = () => {
                if (cancelled) {
                    ws.close();
                    return;
                }
                attempt = 0;
                setIsConnected(true);
                setConnectionEpoch((prev) => prev + 1);
                pingInterval = setInterval(() => {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send('ping');
                    }
                }, PING_INTERVAL_MS);
            };

            ws.onmessage = (event) => {
                if (event.data === 'pong') return;
                try {
                    const data = JSON.parse(event.data);
                    dispatch(data);
                } catch (e) {
                    console.error('Error parsing websocket message', e);
                }
            };

            ws.onclose = () => {
                setIsConnected(false);
                if (pingInterval) {
                    clearInterval(pingInterval);
                    pingInterval = null;
                }
                if (!cancelled) {
                    scheduleReconnect();
                }
            };

            ws.onerror = (err) => {
                console.error('WebSocket encountered an error:', err);
                if (ws) ws.close();
            };
        };

        connect();

        return () => {
            cancelled = true;
            clearTimers();
            if (ws) {
                ws.close();
            }
        };
    }, [token, apiBaseUrl, websocketUrl]);

    return (
        <RealtimeContext.Provider value={{ subscribe, connectionEpoch, isConnected }}>
            {children}
        </RealtimeContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRealtime() {
    return useContext(RealtimeContext);
}

/**
 * Subscribes a callback to one or more realtime `update` types for the lifetime of the component.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useRealtimeSubscription(updateTypes, handler) {
    const { subscribe } = useRealtime();
    const handlerRef = useRef(handler);

    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
        const types = Array.isArray(updateTypes) ? updateTypes : [updateTypes];
        const unsubscribes = types.map((type) =>
            subscribe(type, (payload) => handlerRef.current(payload))
        );
        return () => {
            unsubscribes.forEach((unsub) => unsub());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subscribe, Array.isArray(updateTypes) ? updateTypes.join('|') : updateTypes]);
}
