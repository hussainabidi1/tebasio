import c from "../config";
import { Player } from "./Player";

export class Room {
    width = c.ROOM_WIDTH;
    height = c.ROOM_HEIGHT;

    clients: Array<Player> = [];

    removeClient(player: Player) {
        this.clients.splice(this.clients.indexOf(player), 1);
    }
}