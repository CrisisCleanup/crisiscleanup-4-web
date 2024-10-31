function isWebSocketAvailable(url: string, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let isConnected = false;

    const connectionTimeout = setTimeout(() => {
      if (!isConnected) {
        ws.close();
        reject(new Error('WebSocket connection timed out.'));
      }
    }, timeout);

    ws.addEventListener('open', function () {
      isConnected = true;
      clearTimeout(connectionTimeout);
      ws.close();
      resolve(true);
    });

    ws.addEventListener('error', function (e) {
      const error = new Error('WebSocket connection failed.');
      clearTimeout(connectionTimeout);
      reject(error);
    });
  });
}

export { isWebSocketAvailable };
