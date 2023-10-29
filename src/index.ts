// @ts-ignore
import Bun from "bun";
import c from "./config";
import { Entity, Player } from "./classes";
import { loop, room } from "./modules";

const Filter = require("bad-words");
const filter = new Filter();

Bun.serve({ // web server
  port: c.PORT,
  fetch: (req: Request, server: { upgrade: (req: Request) => any }) => {
    let pathName = new URL(req.url).pathname;
    switch (pathName) {
      case "/":
        if (server.upgrade(req)) return;
        pathName = "/index.html"; // return index.html on domain access
        break;
    };
    const file = Bun.file("./public" + pathName);
    return new Response(file); // return fetched file
  },
  websocket: {
    open: (ws: Player) => {
      ws.body = new Entity({ // create new player as property of websocket
        x: Math.random() * room.width,
        y: Math.random() * room.height
      }, ws);
      room.clients.push(ws); // add websocket to room clients array
      const { width, height, clients } = room;
      ws.body.talk("init", { id: ws.body.index, width, height, clients: clients.map(c => c.body.static) }); // send init stuff
      for (let i = 0; i < clients.length; i++) {
        room.clients[i].body.talk("playerConnected", { client: ws.body.static }); // send every client the new client object
      }
    },
    message: (ws: Player, message: string) => {
      const { type, data } = JSON.parse(message); // parse the message's type and data
      switch (type) {
        case "color":
          if (data.color) {
            ws.body.color = data.color; // set the player's color
          };
          break;

        case "keys":
          ws.body.keys = data.keys; // set movement keys
          break;

        case "name":
          ws.body.name = filter.clean(data.name); // set the player's name
          console.log(ws.body.name != "" ? ws.body.name : "An unnamed player", "connected, total players:", room.clients.length);
          break;

        case "mousemove":
          ws.body.mouse.x = data.x;
          ws.body.mouse.y = data.y; // set the player's mouse positions
          break;

        case "chat":
          if (data.message.length <= c.MESSAGE_LIMIT && ws.body.chat.length <= c.CHAT_LIMIT) {
            const message: { message: string, sentAt: number } = {
              message: filter.clean(data.message),
              sentAt: Date.now()
            }; // create message object with message and sent time
            ws.body.chat.unshift(message); // push message object to array
            console.log((ws.body.name != "" ? ws.body.name : "Unnamed") + ":", data.message);
          }
          break;

        default:
          console.log("Unknown message type:", type + ".", "Data:", data); // console.log unknown message type
      }
    },
    close: (ws: Player) => {
      room.removeClient(ws); // remove player from array
      for (let i = 0; i < room.clients.length; i++) {
        room.clients[i].body.talk("playerDisconnected", { client: ws.body.static }); // send every client removed player
      }
      console.log(ws.body.name != "" ? ws.body.name : "An unnamed player", "disconnected, total players:", room.clients.length); // console.log disonnected player
    }
  }
});

console.log("Server listening on port:", c.PORT)

setInterval(loop, 1000 / 60); // start loop