// @ts-ignore
import Bun from "bun";
import c from "../config.js";
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
            const { width, height, clients} = room;
            ws.body.talk("init", { id: ws.body.index, width, height, clients: clients.map(c => c.body.static) });
            console.log("Client connected, total clients:", clients.length);
            for (let i = 0; i < clients.length; i++) {
                room.clients[i].body.talk("playerConnected", { clients: clients.map(c => c.body.static) });
            }
        },
        message: (ws: Player, message: string) => {
            const { type, data } = JSON.parse(message);
            switch (type) {
                case "name":
                    ws.body.name = data.name;
                    break;
                case 'mousemove':
                    break;
                default:
                    console.log('Unknown message type::', type);
            }
        },
        close: (ws: Player) => {
            room.removeClient(ws);
            console.log("Client disconnected, total clients:", room.clients.length);
        }
    }
});

console.log("Server listening on port:", c.PORT)

setInterval(loop, 1000 / 60);