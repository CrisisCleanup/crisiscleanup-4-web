import { useAuthStore } from '@/hooks/useAuth';

const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const MAX_JITTER_MS = 500;

// 1000 normal, 1001 going away, 1008 policy violation, 4401/4403 app-level auth.
// On these we stop reconnecting; a fresh scope must re-invoke the hook.
const NON_RECOVERABLE_CLOSE_CODES = new Set([1000, 1001, 1008, 4401, 4403]);

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
    if (intentionallyClosed) return;
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
    socket = new WebSocket(
      `${endpoint}${url}?bearer=${authStore.currentAccessToken.value}`,
    );

    socket.addEventListener('message', (e) => {
      try {
        cb(JSON.parse(e.data));
      } catch (error) {
        console.error(`Failed to parse ${name} socket message`, error);
      }
    });

    socket.addEventListener('open', () => {
      attempt = 0;
    });

    socket.addEventListener('error', (e) => {
      console.error(`Socket onError (${name})`, e);
    });

    socket.addEventListener('close', (e) => {
      if (intentionallyClosed) return;
      if (NON_RECOVERABLE_CLOSE_CODES.has(e.code)) return;
      scheduleReconnect();
    });
  }

  const send = (message: Record<any, any>) => {
    socket?.send(JSON.stringify(message));
  };

  function close() {
    intentionallyClosed = true;
    if (reconnectTimer !== undefined) {
      clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
    }
    if (
      socket &&
      socket.readyState !== WebSocket.CLOSED &&
      socket.readyState !== WebSocket.CLOSING
    ) {
      socket.close();
    }
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
