import WebSocket = require("isomorphic-ws");

export const wsKeepAlive = (ws: WebSocket) => {
  const interval = setInterval(() => {
    ws.send("__ping__");
  }, 2000);
  ws.on("close", () => {
    clearInterval(interval);
  });
};
