import c from "../config";
import { EnemyType, Enemy } from "./Enemy";
import { PlayerType } from "./Player";

export class Room {
    width = c.ROOM_WIDTH;
    height = c.ROOM_HEIGHT;

    clients: Array<PlayerType> = [];
    enemies: Array<EnemyType> = [];
    
    spawnEnemy() {}
}