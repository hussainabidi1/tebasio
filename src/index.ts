// @ts-ignore
import Bun from "bun";
import c from "./config";
import { Player, PlayerType } from "./classes";
import { loop, room, clean, util } from "./modules";

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
    open: (ws: PlayerType) => {
      ws.body = new Player(util.random(0, room.width), util.random(0, room.height), ws, 100); // create new player
      room.clients.push(ws); // add websocket to room clients array
      const { width, height, clients } = room;
      ws.body.talk("init", { id: ws.body.index, width, height, clients: clients.map(c => c.body.static) }); // send init stuff
      for (let i = 0; i < clients.length; i++) {
        room.clients[i].body.talk("playerConnected", { client: ws.body.static }); // send every client the new client object
      }
    },
    message: (ws: PlayerType, message: string) => {
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
          ws.body.name = clean(data.name); // set the player's name
          console.log(ws.body.name != "" ? ws.body.name : "An unnamed player", "connected, total players:", room.clients.length);
          break;

        case "mousemove":
          ws.body.mouse.x = data.x;
          ws.body.mouse.y = data.y; // set the player's mouse positions
          break;

        case "chat":
          if (data.message.startsWith("/") && ws.body.op) {
            let args = data.message.slice(1).split(" ");
            let command = args.shift().toLowerCase();
            switch (command) {
              case "xp":
                ws.body.xp = Number(args[0]);
                break;

              case "god":
                ws.body.godmode = !ws.body.godmode;
                if (ws.body.godmode) {
                  ws.body.health.max = 1e99;
                  ws.body.regen = 1e99;
                }
                else {
                  ws.body.health.max = ws.body.radius * 2;
                  ws.body.health.current = ws.body.radius * 2;
                  ws.body.regen = 1;
                }
                break;

              case "killme":
                ws.body.destroy();
                ws.body.talk("death", {});
                room.clients.splice(room.clients.indexOf(ws), 1);
                break;

              case "kill":
                if (room.clients[args[0]]) {
                  room.clients[args[0]].body.destroy();
                  room.clients[args[0]].body.talk("death", {});
                  room.clients.splice(args[0], 1);
                }
                break;
              
              case "purge":
                switch (args[0]) {
                  case "players":
                    for (let i = 0; i < room.clients.length; i++) {
                      room.clients[i].body.destroy();
                      room.clients[i].body.talk("death", {});
                    }
                    room.clients.splice(0);
                    break;

                  case "bots":
                    for (let i = 0; i < room.enemies.length; i++) {
                      room.enemies[i].body.destroy();
                    }
                    room.enemies.splice(0);
                    break;

                  case "all":
                    for (let i = 0; i < room.clients.length; i++) {
                      room.clients[i].body.destroy();
                      room.clients[i].body.talk("death", {});
                    }
                    room.clients.splice(0);

                    for (let i = 0; i < room.enemies.length; i++) {
                      room.enemies[i].body.destroy();
                    }
                    room.enemies.splice(0);
                    
                    break;
                }
            }
            return;
          }
          if (data.message.length <= c.MESSAGE_LIMIT && ws.body.chat.length <= c.CHAT_LIMIT) {
            const message: { message: string, sentAt: number } = {
              message: clean(data.message),
              sentAt: Date.now()
            }; // create message object with message and sent time
            ws.body.chat.unshift(message); // push message object to array
            console.log((ws.body.name != "" ? ws.body.name : "Unnamed") + ":", clean(data.message));
          }
          break;

        case "token":
          if (data.token === process.env.TOKEN) {
            ws.body.op = true;
          }
          break;

        default:
          console.log("Unknown message type:", type + ".", "Data:", data); // console.log unknown message type
      }
    },
    close: (ws: PlayerType) => {
      room.clients.splice(room.clients.indexOf(ws), 1); // remove player from array
      for (let i = 0; i < room.clients.length; i++) {
        room.clients[i].body.talk("playerDisconnected", { client: ws.body.static }); // send every client removed player
      }
      ws.body.destroy();
      console.log(ws.body.name != "" ? ws.body.name : "An unnamed player", "disconnected, total players:", room.clients.length); // console.log disonnected player
    }
  }
});

console.log("Server listening on port:", c.PORT)

setInterval(loop, 1000 / 60); // start loop