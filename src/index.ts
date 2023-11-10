import Bun from "bun";
import c from "./config";
import { Entity, Player, SocketType } from "./classes";
import { loop, room, util, handleMessage } from "./modules";

Bun.serve({ // web server
  port: c.PORT,
  fetch: async (req: Request, server: { upgrade: (req: Request) => any }) => {
    let pathName = new URL(req.url).pathname;
    switch (pathName) {
      case "/":
        if (server.upgrade(req)) return;
        pathName = "/index.html"; // return index.html on domain access
        break;
    }
    const file = await Bun.file("./public" + pathName);
    return new Response(file); // return fetched file
  },
  websocket: {
    open: (ws: SocketType) => {
      const player = new Player(util.random(0, room.width), util.random(0, room.height), ws, 100); // create new player
      ws.index = player.index;
      const { width, height } = room;
      player.talk("init", { id: player.index, width, height, entities: [...Entity.instances] }); // send init stuff
      Entity.instances.forEach((entity: Entity) => {
        if (entity instanceof Player) {
          entity.talk("playerConnected", { client: player.static }); // send every client the new client object
        }
      })
    },
    message: (ws: SocketType, message: string) => {
      handleMessage(ws, message);
    },
    close: (ws: SocketType) => {
      const player: any = Entity.instances.get(ws.index);
      if (player instanceof Player) {
        Entity.instances.forEach((entity) => {
          if (entity instanceof Player) {
            entity.talk("playerDisconnected", { client: player.static }); // send every client removed player
          }
        })
        player.destroy();
        console.log(player.name != "" ? player.name : "An unnamed player", "disconnected"); // console.log disonnected player
      }
    }
  }
});

console.log("Server listening on port:", c.PORT);

setInterval(loop, 1000 / 60); // start loop