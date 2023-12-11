import c from "../config";
import { util } from "../modules";
import { AbstractVector } from "./";

export class Room {
    width = c.ROOM_WIDTH;
    height = c.ROOM_HEIGHT;

    bots: number = 0;

    spawnEnemy(pos: AbstractVector) { }

    random() {
        return { x: util.floorRandom(0, this.width), y: util.floorRandom(0, this.height) };
    }
}