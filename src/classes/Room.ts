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
            const heaviness = util.random(3, 4);
            const bot: Enemy = { body: new Entity({ x: util.random(0, this.width), y: util.random(0, this.height) }, null, Math.floor(heaviness * 25), true, heaviness) }
            bot.body.shape = Math.floor(heaviness + 6);
            bot.body.radius = Math.floor(heaviness * 12.5);
            bot.body.name = `Strength ${heaviness.toFixed(1)}`;
            this.enemies.push(bot)
        }
    }

    removeClient(player: Player) {
        this.clients.splice(this.clients.indexOf(player), 1);
    }
}