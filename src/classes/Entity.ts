import { randomColor } from '../modules/util';
import { Player } from './Player';

export interface AbstractVector {
    x: number,
    y: number
}

let lastEntityIndex = 0;

export class Entity {
    index: number;
    radius = 50;
    shape = 7;
    angle = 0;
    color = randomColor();
    acceleration: AbstractVector = { x: 0, y: 0 };
    velocity: AbstractVector = { x: 0, y: 0 };
    name: string;

    constructor(public pos: AbstractVector, public socket: Player | null = null) {
        this.index = ++lastEntityIndex;
        console.log('New entity', this.index);
        this.name = `Entity ${this.index}`;
    }

    talk(type: string, data: Record<string | symbol, any>) {
        if (!this.socket) return;
        this.socket.send(JSON.stringify({ type, data }));
    }

    get x() { return this.pos.x }
    set x(x: number) { this.pos.x = x }
    get y() { return this.pos.y }
    set y(y: number) { this.pos.y = y }

    get static() {
        const { index, radius, shape, x, y, angle, color, name } = this;
        return { index, radius, shape, x, y, angle, color, name };
    }
}