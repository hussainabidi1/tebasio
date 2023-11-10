import { Entity, Vector } from "./Entity";
import { Health } from "./Health";
import { room, util } from "../modules";
import config from "../config";

export class Boss extends Entity {
    health: number = 30000;
    angle: number = 0;
    radius: number = 400;
    shape: number = 19;
    color: string = util.randomColor();
    damage: number = 0.5;
    pos: Vector;
    acceleration: Vector = new Vector();
    velocity: Vector = new Vector();
    colliders: any[] = [];
    name: string = "Shape";
    kills: number = 0;
    regen: number = 1;
    xp: number = this.radius;

    constructor(x: number, y: number) {
        super();
        this.pos = Vector.from({ x, y });
        this.health = new Health(2 * this.radius, 2 * this.radius);
    }

    update() {

        if (this.xp > this.radius) {
            this.radius += 0.1;
            this.health.max = this.radius * 2;
            this.regen += 0.001;
            this.damage = this.health.max / 100;
        }

        let goal;
        for (let i = 0; i < room.clients.length; i++) {
            const b = room.clients[i].body;
            const dx = b.pos.y - this.pos.y;
            const dy = b.pos.x - this.pos.x;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= 300) {
                goal = true;
                this.angle = Math.atan2(dx, dy);
            }
            else goal = false
        };

        if (goal) {
            this.acceleration.add(Math.cos(this.angle) / (this.radius / 25), Math.sin(this.angle) / (this.radius / 25));
        };

        this.pos.add(this.acceleration);
        this.pos.add(this.velocity);
        const t = 0.9;
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

    get static() {
        const { index, radius, shape, pos, angle, color } = this;
        return {
            index,
            radius,
            shape,
            pos,
            angle,
            color,
            health: this.health.abstract
        };
    }
}

export interface EnemyType {
    body: Boss

}