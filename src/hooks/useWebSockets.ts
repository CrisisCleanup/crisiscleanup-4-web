import { useAuthStore } from '@/hooks';

export function useWebSockets(
  url: string,
  name: string,
  cb: (data: Record<string, any>) => object,
) {
  const endpoint = import.meta.env.VITE_APP_API_BASE_URL.replace('http', 'ws');
  let socket: WebSocket | undefined;
  let send;
  const authStore = useAuthStore();

  function connect() {
    socket = new WebSocket(
      `${endpoint}${url}?bearer=${authStore.currentAccessToken.value}`,
    );

    const sendMessage = (message: Record<any, any>) => {
      socket?.send(JSON.stringify(message));
    };

    socket.onmessage = (e) => {
      cb(JSON.parse(e.data));
    };

    socket.addEventListener('open', (e) => {
      // Window.vue.$log.debug(`open connection with ${name} socket`, e);
    });

    socket.onerror = (e) => {
      // Window.vue.$log.error(`error in connection with ${name} socket`, e);
    };

    socket.addEventListener('close', (e) => {
      // Window.vue.$log.error(
      //   `closed connection with ${name} socket. Attempting reconnect in 1 second`,
      //   e,
      // );
      setTimeout(function () {
        const websocket = connect();
        send = websocket.send;
        socket = websocket.socket;
      }, 1000);
    });

    return { socket, send: sendMessage };
  }

  const websocket = connect();
  send = websocket.send;
  socket = websocket.socket;

  return {
    socket,
    send,
  };
}
