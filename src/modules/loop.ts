import c from "../config";
import { Player, Enemy, Entity, Turret} from "../classes";
import { room } from "./";

export default () => {
    Entity.instances.forEach((entity) => {
        if (entity instanceof Player || entity instanceof Enemy || entity instanceof Turret) {
            entity.update();
        }
    })
    if (room.bots < c.BOTS) room.spawnEnemy(room.random());
}