import c from "../config";
import { Player, Enemy, Entity } from "../classes";
import { room } from "./";

let frames: number = 0;

export default () => {
    const now = performance.now();
    Entity.instances.forEach((entity) => {
        if (entity instanceof Player || entity instanceof Enemy) {
            entity.update();
        }
    })
    if (room.bots < c.BOTS) room.spawnEnemy();
    if (frames < 30) {
        frames++;
        return;
    }
    frames = 0;
    console.log(performance.now() - now, "ms");
}