import { SocketType, Enemy, Player, Entity } from "../classes";
import { clean, room } from "./";
import c from "../config";

export default function handleMessage(ws: SocketType, message: string) {
    const player: any = Entity.instances.get(ws.index);
    if (!player) return;
    const { type, data } = JSON.parse(message); // parse the message's type and data
    switch (type) {
        case "color":
            if (data.color) {
                player.color = data.color; // set the player's color
            };
            break;

        case "keys":
            player.keys = data.keys; // set movement keys
            break;

        case "name":
            player.name = clean(data.name); // set the player's name
            console.log(player.name != "" ? player.name : "An unnamed player", "connected");
            break;

        case "mousemove":
            player.mouse.x = data.x;
            player.mouse.y = data.y; // set the player's mouse positions
            break;

        case "chat":
            if (data.message.startsWith("/") && player.op) {
                let args = data.message.slice(1).split(" ");
                let command = args.shift().toLowerCase();
                switch (command) {
                    case "xp":
                        player.xp = Number(args[0]);
                        break;

                    case "god":
                        player.godmode = !player.godmode;
                        break;

                    case "killme":
                        player.destroy();
                        player.talk("death", {});
                        break;

                    case "kill":
                        let entity = Entity.instances.get(args[0]);
                        if (entity) {
                            if (entity instanceof Player) entity.talk("death", {});
                            entity.destroy();
                        }
                        break;

                    case "purge":
                        switch (args[0]) {
                            case "players":
                                Entity.instances.forEach((entity: Entity) => {
                                    if (entity instanceof Player) {
                                        entity.talk("death", {});
                                        entity.destroy();
                                    }
                                })
                                break;

                            case "bots":
                                Entity.instances.forEach((entity: Entity) => {
                                    if (entity instanceof Enemy) entity.destroy();
                                })
                                break;

                            case "all":
                                Entity.instances.forEach((entity: Entity) => {
                                    if (entity instanceof Player) entity.talk("death", {});
                                    entity.destroy();
                                })
                                break;
                        }
                        break;

                    case "spawnbot":
                        if (args[0]) {
                            for (let i = 0; i < args[0]; i++) {
                                room.spawnEnemy();
                            }
                        } else room.spawnEnemy();
                        break;
                }
                return;
            }
            if (data.message.length <= c.MESSAGE_LIMIT && player.chat.length <= c.CHAT_LIMIT) {
                const message: { message: string, sentAt: number } = {
                    message: clean(data.message),
                    sentAt: Date.now()
                }; // create message object with message and sent time
                player.chat.unshift(message); // push message object to array
                console.log((player.name != "" ? player.name : "Unnamed") + ":", clean(data.message));
            }
            break;

        case "token":
            if (data.token === process.env.TOKEN_1) {
                player.op = true;
            }
            break;

        default:
            console.log("Unknown message type:", type + ".", "Data:", data); // console.log unknown message type
    }
}