// @ts-ignore
import Bun from "bun";
import c from "./config";
import { Entity, Player } from "./classes";
import { loop, room } from "./modules";

Bun.serve({
  port: c.PORT,
  fetch: (req: Request, server: { upgrade: (req: Request) => any }) => {
    let pathName = new URL(req.url).pathname;
    switch (pathName) {
      case "/":
        if (server.upgrade(req)) return;
        pathName = "/index.html";
        break;
    };
    const file = Bun.file("./public" + pathName);
    return new Response(file);
  },
  websocket: {
    open: (ws: Player) => {
      ws.body = new Entity({
        x: Math.random() * room.width,
        y: Math.random() * room.height
      }, ws);
      room.clients.push(ws);
      const { width, height, clients } = room;
      ws.body.talk("init", { id: ws.body.index, width, height, clients: clients.map(c => c.body.static) });
      console.log(ws.body.name != "" ? ws.body.name : "An unnamed player", "connected, total players:", clients.length);
      for (let i = 0; i < clients.length; i++) {
        room.clients[i].body.talk("playerConnected", { client: ws.body.static });
      }
    },
    message: (ws: Player, message: string) => {
      const { type, data } = JSON.parse(message);
      switch (type) {
        case "color":
          if (data.color) {
            ws.body.color = data.color;
          };
          break;

        case "keys":
          ws.body.keys = data.keys;
          break;

        case "name":
          ws.body.name = data.name;
          break;

        case "mousemove":
          ws.body.mouse.x = data.x;
          ws.body.mouse.y = data.y;
          break;

        case "chat":
          if (data.message.length <= c.MESSAGE_LIMIT && ws.body.chat.length <= c.CHAT_LIMIT) {
            const message: { message: string, sentAt: number } = {
              message: data.message,
              sentAt: Date.now()
            };
            ws.body.chat.unshift(message);
          }
          break;

        default:
          console.log("Unknown message type:", type + ".", "Data:", data);
      }
    },
    close: (ws: Player) => {
      room.removeClient(ws);
      for (let i = 0; i < room.clients.length; i++) {
        room.clients[i].body.talk("playerDisconnected", { client: ws.body.static });
      }
      console.log(ws.body.name != "" ? ws.body.name : "An unnamed player", "disconnected, total players:", room.clients.length);
    }
  }
});

console.log("Server listening on port:", c.PORT)

room.spawnEnemies();

setInterval(loop, 1000 / 60);