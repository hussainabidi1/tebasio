import { Entity, Vector } from "./Entity";
import { Health } from "./Health";
import { room, util } from "../modules";
import config from "../config";

interface keys {
    KeyW: boolean,
    KeyS: boolean,
    KeyA: boolean,
    KeyD: boolean
}

export class Player extends Entity {
    radius: number = 50;
    angle: number = 0;
    shape: number = 7;
    damage: number = 1;
    xp: number = this.radius;
    kills: number = 0;
    fov: number = 1;
    pos: Vector;
    acceleration: Vector = new Vector();
    velocity: Vector = new Vector();
    color: string = util.randomColor();
    regen: number = 1;
    health: Health;
    mouse: Vector = new Vector();
    chat: any[] = [];
    keys: keys = { KeyW: false, KeyS: false, KeyA: false, KeyD: false };
    name: string = "";
    colliders: any[] = [];
    op: boolean = false;
    godmode: boolean = false;

    constructor(x: number, y: number, public socket: PlayerType, maxHealth: number) {
        super();
        this.pos = Vector.from({ x, y });
        this.health = new Health(maxHealth, maxHealth);
    }

    update() {
        if (this.xp > this.radius) {
            this.radius += (this.xp - this.radius) / 50;
            this.health.max = this.radius * 2;
            this.regen += 0.001;
            this.damage += 0.0001;
            this.fov *= 0.99975;
        }

        // turn
        this.angle = -Math.atan2(this.mouse.x, this.mouse.y);

        // update chat
        this.chat = this.chat.filter(msg => msg.sentAt + config.CHAT_INTERVAL > Date.now());

        // move
        this.acceleration.add(
            -Number(this.keys.KeyA) + Number(this.keys.KeyD),
            -Number(this.keys.KeyW) + Number(this.keys.KeyS)
        );

        // update position
        const t = 0.9;
        this.pos.add(this.acceleration);
        this.pos.add(this.velocity);

        this.acceleration.scale(t);
        this.velocity.scale(t);

        // stay in room
        const vec = new Vector();
        if (this.pos.x < 0) vec.add(-this.pos.x, 0);
        if (this.pos.x > room.width) vec.add(-(this.pos.x - room.width), 0);
        if (this.pos.y < 0) vec.add(0, -this.pos.y);
        if (this.pos.y > room.height) vec.add(0, -(this.pos.y - room.height));
        vec.divide(config.ROOM_BOUNCE);
        this.velocity.add(vec);

        // heal
        if (this.health.current < this.health.max) this.health.heal(this.regen / 10);
    }

    talk(type: string, data: Record<string | symbol, any>) {
        if (!this.socket) return;
        this.socket.send(JSON.stringify({ type, data }));
    }

    getKillers() {
        let killers: string = "";
        for (let i = 0; i < this.colliders.length; i++) {
            if (!killers[0]) killers += this.colliders[i].name === "" ? "an unnamed player" : this.colliders[i].name;
            else killers += ` and ${this.colliders[i].name === "" ? "an unnamed player" : this.colliders[i].name}`;
        }
        return killers;
    }

    get static() {
        const { index, radius, shape, pos, angle, color, fov } = this;
        return {
            index,
            radius,
            shape,
            pos,
            angle,
            color,
            name: this.name === "" ? undefined : this.name,
            chat: this.chat.map(c => c.message),
            health: this.health.abstract,
            fov
        };
    }
}

export interface PlayerType extends WebSocket {
    body: Player
}