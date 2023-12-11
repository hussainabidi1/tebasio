import { Entity, Health, Vector, Player, Enemy } from "./";
import { util } from "../modules";

export class Turret extends Entity {
    type: string = "turret";
    pos: Vector;
    shape: number = 0;
    radius: number;
    angle: number;
    damage: number = 1;
    color: string | undefined;
    colliders: Array<number> = [];
    health: Health;
    life: number = 200;
    counter: number = 0;
    invis: boolean = false;
    godmode: boolean = false;

    constructor(public parent: number) {
        super();
        const p: any = Entity.instances.get(parent);
        this.pos = Vector.from(p.pos);
        this.radius = p.radius / 2;
        this.angle = p.angle;
        this.color = util.offsetColor(p.color);
        this.health = new Health(p.health.max / 2);
    }

    update() {
        this.collide();
        this.die();
    }

    die() {
        this.counter++;
        if (this.counter >= this.life) {
            this.destroy();
            this.counter = 0;
            return;
        }
        if (this.health.current <= 0) {
            for (let i = 0; i < this.colliders.length; i++) {
                const entity: any = Entity.instances.get(this.colliders[i]);
                if (entity) {
                    entity.xp += 20 / this.colliders.length;
                    if (entity instanceof Player) entity.coins += 5;
                }
            }
            this.destroy();
        }
    }

    collide() {
        Entity.instances.forEach((e) => {
            if ((e instanceof Player || e instanceof Enemy || e instanceof Turret) && this.index !== e.index && this.parent !== e.index) {
                const dx = Math.abs(this.pos.y - e.pos.y);
                const dy = Math.abs(this.pos.x - e.pos.x);
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= this.radius + e.radius) {
                    const angle = Math.atan2(dx, dy);
                    const overlap = this.radius + e.radius - distance;
                    const moveX = overlap * Math.cos(angle);
                    const moveY = overlap * Math.sin(angle);

                    e.pos.x += moveX / 2.5;
                    e.pos.y += moveY / 2.5;

                    if (!this.colliders.includes(e.index)) this.colliders.push(e.index);
                    if (!e.colliders.includes(this.parent)) e.colliders.push(this.parent);
                    if (e instanceof Turret && e.parent !== this.parent) {
                        this.health.damage(e.damage);
                        e.health.damage(this.damage);
                    }
                    else if (!(e instanceof Turret)) {
                        this.health.damage(e.damage);
                        e.health.damage(this.damage);
                    }
                }
                else if (distance <= this.radius + e.radius + 5) {
                    this.colliders.splice(this.colliders.indexOf(e.index), 1);
                    e.colliders.splice(e.colliders.indexOf(this.index), 1);
                }
            }
        });
    }
}

export class Block extends Turret {
    shape: number = 5;
    life: number = 500;
    damage: number = 0.75;

    constructor(parent: number) {
        super(parent);
        const p: any = Entity.instances.get(parent);
        this.radius = p.radius / 1.25;
    }
}

export class Landmine extends Turret {
    shape: number = 4;
    life: number = 250;
    damage: number = 1.25;

    constructor(parent: number) {
        super(parent);
        this.invis = true;
    }
}
