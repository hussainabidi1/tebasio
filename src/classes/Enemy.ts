import { Entity, Player, Vector, Health, AbstractVector } from "./";
import { room, util } from "../modules";
import config from "../config";

export class Enemy extends Entity {
    type: string;
    health: Health;
    angle: number = 0;
    radius: number = util.random(40, 70);
    shape: number = util.floorRandom(7, 25);
    color: string = util.randomColor();
    damage: number = 1;
    speed: number = this.radius / 25;
    pos: Vector;
    acceleration: Vector = new Vector();
    velocity: Vector = new Vector();
    colliders: any[] = [];
    name: string = "";
    kills: number = 0;
    regen: number = 1;
    xp: number = this.radius;
    godmode: boolean = false;
    types: string[] = ["aurabot", "rammerbot"];
    aura: boolean = false;

    constructor(pos: AbstractVector) {
        super();
        this.pos = Vector.from(pos);
        this.health = new Health(2 * this.radius);
        this.type = this.types[util.floorRandom(0, this.types.length)];
        switch (this.type) {
            case "aurabot":
                this.shape = 3;
                this.name = "Aura Bot";
                this.aura = true;
                break;

            case "rammerbot":
                this.shape = 10;
                this.name = "Rammer Bot";
                break;
        }
    }

    update() {
        this.moveandcollide();
        this.die();

        // heal
        if (this.health.current < this.health.max) this.health.heal(this.regen / 10);
    }

    die() {
        if (this.health.current <= 0) {
            for (let i = 0; i < this.colliders.length; i++) {
                const killer: any = Entity.instances.get(this.colliders[i]);
                if (killer) {
                    killer.xp += this.xp / 2 / this.colliders.length;
                    killer.kills++;
                    killer.coins += 10;
                }
            }
            this.destroy();
            room.bots--;
        }
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
                if (this.aura && distance <= this.radius * 3 + e.radius) {
                    if (!e.godmode) e.health.damage(this.damage / 2);
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

                    if (!this.colliders.includes(e.index)) this.colliders.push(e.index);
                    if (!e.colliders.includes(this.index)) e.colliders.push(this.index);

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
            this.acceleration.add(Math.cos(this.angle) / this.speed, Math.sin(this.angle) / this.speed);
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
}

export interface EnemyType {
    body: Enemy
}