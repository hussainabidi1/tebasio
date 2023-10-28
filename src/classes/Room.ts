import c from "../config";
import { Entity } from "./Entity";
import Enemy from "./Enemy";
import { Player } from "./Player";
import { util } from "../modules/"

export class Room {
    width = c.ROOM_WIDTH;
    height = c.ROOM_HEIGHT;

    clients: Array<Player> = [];
    enemies: Array<Enemy> = [];

    spawnEnemies() {
        for (let i = 0; i < c.BOTS; i++) {
            const bot: Enemy = { body: new Entity({ x: util.random(0, this.width), y: util.random(0, this.height) }, null, 50) }
            bot.body.shape = 9;
            bot.body.radius = 40;
            this.enemies.push(bot)
        }
    }

    removeClient(player: Player) {
        this.clients.splice(this.clients.indexOf(player), 1);
    }
}