import { Entity, Vector } from "./Entity";
import { Health } from "./Health";
import { Player, Enemy } from "./";
import { room, util } from "../modules";
import config from "../config";

export class Boss extends Entity {
    type: string = "boss";
    health: Health = new Health(30000, 30000);
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
    godmode: boolean = false;

    constructor(x: number, y: number) {
        super();
        this.pos = Vector.from({ x, y });
        this.health = new Health(2 * this.radius, 2 * this.radius);
    }

    update() {
        this.moveandcollide();

        // heal
        if (this.health.current < this.health.max) this.health.heal(this.regen / 10);
    }

    moveandcollide() {
        let goal;

        Entity.instances.forEach((e) => {
            if ((e instanceof Player || e instanceof Enemy) && this.index !== e.index) {
                if (e instanceof Player) {
                    const b = e;
                    const dx = b.pos.y - this.pos.y;
                    const dy = b.pos.x - this.pos.x;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= this.radius + 200) {
                        goal = true;
                        this.angle = Math.atan2(dx, dy);
                    }
                    else goal = false
                }

                const dx = Math.abs(this.pos.y - e.pos.y);
                const dy = Math.abs(this.pos.x - e.pos.x);
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= this.radius + e.radius) {
                    const angle = Math.atan2(dx, dy);
                    const overlap = this.radius + e.radius - distance;
                    const moveX = overlap * Math.cos(angle);
                    const moveY = overlap * Math.sin(angle);

                    this.pos.x -= moveX / 2;
                    this.pos.y -= moveY / 2;

                    e.pos.x += moveX / 2;
                    e.pos.y += moveY / 2;

                    if (!this.colliders.includes(e)) this.colliders.push(e.index);
                    if (!e.colliders.includes(this)) e.colliders.push(this.index);

                    if (!this.godmode) this.health.damage(e.damage / 2);
                    if (!e.godmode) e.health.damage(this.damage / 2);
                }
                else if (distance <= this.radius + e.radius + 5) {
                    this.colliders.splice(this.colliders.indexOf(e.index), 1);
                    e.colliders.splice(e.colliders.indexOf(this.index), 1);
                }
            }
        })

        if (goal) {
            this.acceleration.add(Math.cos(this.angle) / 50, Math.sin(this.angle) / 50);
        };

        this.pos.add(this.acceleration);
        this.pos.add(this.velocity);

        this.acceleration.scale(0.9);
        this.velocity.scale(0.9);

        // stay in room
        const vec = new Vector();
        if (this.pos.x < 0) vec.add(-this.pos.x, 0);
        if (this.pos.x > room.width) vec.add(-(this.pos.x - room.width), 0);
        if (this.pos.y < 0) vec.add(0, -this.pos.y);
        if (this.pos.y > room.height) vec.add(0, -(this.pos.y - room.height));
        vec.divide(config.ROOM_BOUNCE);
        this.velocity.add(vec);
    }

    get static() {
        const { index, radius, shape, pos, angle, color, type } = this;
        return {
            index,
            radius,
            shape,
            pos,
            angle,
            color,
            health: this.health.abstract,
            type
        };
    }
}

export interface EnemyType {
    body: Boss

}