import { Room } from "../classes/Room";
import { EnemyType, Enemy } from "../classes/";
import { util } from "./";

const room = new Room();

room.spawnEnemy = () => {
    const bot: EnemyType = { body: new Enemy(util.random(0, room.width), util.random(0, room.height)) };
    room.bots++;
}
export { room };