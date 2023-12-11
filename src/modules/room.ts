import { Room } from "../classes/Room";
import { EnemyType, Enemy, AbstractVector } from "../classes/";

const room = new Room();

room.spawnEnemy = (pos: AbstractVector) => {
    const bot: EnemyType = { body: new Enemy(pos) };
    room.bots++;
}
export { room };