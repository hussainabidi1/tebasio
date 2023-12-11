import { Entity, Vector, Health, Enemy } from "./";
import { room, util } from "../modules";
import config from "../config";

interface keys {
    up: boolean,
    down: boolean,
    left: boolean,
    right: boolean
}

export class Player extends Entity {
    type: string = "player";
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
    keys: keys = { up: false, down: false, left: false, right: false };
    name: string = "";
    colliders: any[] = [];
    op: boolean = false;
    godmode: boolean = false;
    coins: number = 0;
    aura: boolean = false;

    constructor(x: number, y: number, public socket: WebSocket, maxHealth: number) {
        super();
        this.pos = Vector.from({ x, y });
        this.health = new Health(maxHealth);
        this.aura = true;
    }

    update() {
        this.die();
        this.move();
        this.collide();
        this.talk("entities", { entities: [...Entity.instances] });

        // update chat
        this.chat = this.chat.filter(msg => msg.sentAt + config.CHAT_INTERVAL > Date.now());
        // heal
        if (this.health.current < this.health.max) this.health.heal(this.regen / 10);
    }

    die() {
        if (this.health.current <= 0) {
            this.talk("death", {});
            for (let i = 0; i < this.colliders.length; i++) {
                const entity: any = Entity.instances.get(this.colliders[i]);
                if (entity) {
                    entity.xp += this.xp / 2 / this.colliders.length;
                    entity.kills++;
                }
            }
            this.destroy();
        }
    }

    collide() {
        Entity.instances.forEach((e) => {
            if ((e instanceof Player || e instanceof Enemy) && this.index !== e.index) {
                const dx = Math.abs(this.pos.y - e.pos.y);
                const dy = Math.abs(this.pos.x - e.pos.x);
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (this.aura && distance <= this.radius * 3 + e.radius) {
                    if (!e.godmode) e.health.damage(this.damage / 2);
                    if (!this.colliders.includes(e.index)) this.colliders.push(e.index);
                    if (!e.colliders.includes(this.index)) e.colliders.push(this.index);
                }
                if (distance <= this.radius + e.radius) {
                    const angle = Math.atan2(dx, dy);
                    const overlap = this.radius + e.radius - distance;
                    const moveX = overlap * Math.cos(angle);
                    const moveY = overlap * Math.sin(angle);

                    this.pos.x -= moveX / 2;
                    this.pos.y -= moveY / 2;

                    e.pos.x += moveX / 2;
                    e.pos.y += moveY / 2;

                    if (!this.godmode) this.health.damage(e.damage / 2);
                }
                else if (distance <= this.radius * 3 + e.radius + 5) {
                    this.colliders.splice(this.colliders.indexOf(e.index), 1);
                    e.colliders.splice(e.colliders.indexOf(this.index), 1);
                }
            }
        })
    }

    move() {
        this.angle = -Math.atan2(this.mouse.x, this.mouse.y);

        // move
        this.acceleration.add(
            -Number(this.keys.left) + Number(this.keys.right),
            -Number(this.keys.up) + Number(this.keys.down)
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
    }

    talk(type: string, data: Record<string | symbol, any>) {
        if (!this.socket) return;
        let seen: any[] = [];
        this.socket.send(JSON.stringify({ type, data }, function (key, val) {
            if (val != null && typeof val == "object") {
                if (seen.indexOf(val) >= 0) {
                    console.log(val);
                    return;
                }
                seen.push(val);
            }
            return val;
        }));
    }

    getKillers() {
        let killers: string = "";
        for (let i = 0; i < this.colliders.length; i++) {
            const killer: any = Entity.instances.get(this.colliders[i]);
            if (!killers[0]) killers += killer.name === "" ? "an unnamed player" : killer.name;
            else killers += ` and ${killer.name === "" ? "an unnamed player" : killer.name}`;
        }
        return killers;
    }
}

export interface SocketType extends WebSocket {
    index: number
}