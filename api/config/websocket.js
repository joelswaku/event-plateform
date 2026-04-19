import { WebSocketServer } from "ws";

let wss = null;

export function initWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on("connection", (socket) => {
    socket.isAlive = true;

    socket.on("pong", () => {
      socket.isAlive = true;
    });

    socket.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === "subscribe" && data.eventId) {
          socket.eventId = data.eventId;
        }
      } catch (error) {
        console.error("Invalid WS message:", error.message);
      }
    });
  });

  const interval = setInterval(() => {
    if (!wss) return;

    wss.clients.forEach((socket) => {
      if (socket.isAlive === false) {
        return socket.terminate();
      }

      socket.isAlive = false;
      socket.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  return wss;
}

export function broadcastToEvent(eventId, payload) {
  if (!wss) return;

  const message = JSON.stringify(payload);

  wss.clients.forEach((socket) => {
    if (socket.readyState === 1 && socket.eventId === eventId) {
      socket.send(message);
    }
  });
}