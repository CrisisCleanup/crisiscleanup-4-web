import { useAuthStore } from '@/hooks/useAuth';

const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const MAX_JITTER_MS = 500;

// Retrying a rejected connection needs new credentials.
const NON_RECOVERABLE_CLOSE_CODES = new Set([1008, 4401, 4403]);

export function useWebSockets<MessageT extends Record<string, any>>(
  url: string,
  name: string,
  cb: (data: MessageT) => object | void,
) {
  const endpoint = import.meta.env.VITE_APP_API_BASE_URL.replace('http', 'ws');
  const authStore = useAuthStore();

  let socket: WebSocket | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let attempt = 0;
  let intentionallyClosed = false;

  function scheduleReconnect() {
    if (intentionallyClosed || reconnectTimer !== undefined) return;
    const delay =
      Math.min(BASE_RECONNECT_DELAY_MS * 2 ** attempt, MAX_RECONNECT_DELAY_MS) +
      Math.floor(Math.random() * MAX_JITTER_MS);
    attempt += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = undefined;
      connect();
    }, delay);
  }

  function connect() {
    const token = authStore.currentAccessToken.value;
    if (intentionallyClosed || !token) return;
    const connection = new WebSocket(
      `${endpoint}${url}?bearer=${encodeURIComponent(token)}`,
    );
    socket = connection;

    connection.addEventListener('message', (e) => {
      if (socket !== connection || intentionallyClosed) return;
      try {
        cb(JSON.parse(e.data));
      } catch (error) {
        console.error(`Failed to parse ${name} socket message`, error);
      }
    });

    connection.addEventListener('open', () => {
      if (socket !== connection) return;
      attempt = 0;
    });

    connection.addEventListener('error', (e) => {
      if (socket !== connection) return;
      console.error(`Socket onError (${name})`, e);
    });

    connection.addEventListener('close', (e) => {
      if (socket !== connection || intentionallyClosed) return;
      if (NON_RECOVERABLE_CLOSE_CODES.has(e.code)) return;
      scheduleReconnect();
    });
  }

  const send = (message: Record<any, any>) => {
    if (
      intentionallyClosed ||
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      console.error(`Socket send skipped (${name}); socket is not open`);
      return false;
    }

    try {
      socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Socket send failed (${name})`, error);
      return false;
    }
  };

  function disconnect() {
    if (reconnectTimer !== undefined) {
      clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
    }
    const previous = socket;
    socket = undefined;
    if (
      previous &&
      previous.readyState !== WebSocket.CLOSED &&
      previous.readyState !== WebSocket.CLOSING
    ) {
      previous.close();
    }
  }

  const stopWatchingToken = watch(authStore.currentAccessToken, () => {
    if (intentionallyClosed) return;
    disconnect();
    attempt = 0;
    connect();
  });

  function close() {
    intentionallyClosed = true;
    stopWatchingToken();
    disconnect();
  }

  connect();

  if (getCurrentScope()) {
    onScopeDispose(close);
  }

  return {
    socket,
    send,
    close,
  };
}
