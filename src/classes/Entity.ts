import { Player } from "./Player";
import { Health } from "./Health";
import { util, room } from "../modules";
import config from "../config";

export interface AbstractVector {
  x: number,
  y: number
}

export class Vector implements AbstractVector {
  constructor(public x = 0, public y = 0) { }

  add(x: number, y: number): void;
  add(v: AbstractVector): void;
  add(a: number | AbstractVector, b?: number) {
    if (a instanceof Vector) {
      this.x += a.x;
      this.y += a.y;
    } else if (typeof a == 'number' && b !== undefined) {
      this.x += a;
      this.y += b;
    }
  }

  scale(s: number) {
    this.x *= s;
    this.y *= s;
  }

  divide(s: number) {
    this.x /= s;
    this.y /= s;
  }

  copy() {
    return new Vector(this.x, this.y);
  }

  static from(v: AbstractVector) {
    return new Vector(v.x, v.y);
  }
}

let lastEntityIndex = 0;

export class Entity {
  index: number;
  radius = 50;
  shape = 7;
  angle = 0;
  health: Health;
  color = util.randomColor();
  pos: Vector;
  mouse = new Vector();
  acceleration = new Vector();
  velocity = new Vector();
  name: string;
  chat: any[] = [];
  keys = { KeyW: false, KeyS: false, KeyA: false, KeyD: false };

  constructor(pos: AbstractVector = { x: util.random(0, room.width), y: util.random(0, room.height) }, public socket: Player | null = null, maxHealth = 100) {
    this.index = ++lastEntityIndex;
    this.name = "";
    this.pos = Vector.from(pos);
    this.health = new Health(maxHealth, maxHealth);
  }

  update() {
    // turn
    this.angle = -Math.atan2(this.mouse.x, this.mouse.y);

    // update chat
    this.chat = this.chat.filter(msg => msg.sentAt + config.CHAT_INTERVAL > Date.now());

    // update position
    this.pos.add(this.acceleration);
    this.pos.add(this.velocity);
    const t = 0.9;
    this.acceleration.scale(t);
    this.velocity.scale(t);

    // move
    this.acceleration.add(
      -Number(this.keys.KeyA) + Number(this.keys.KeyD),
      -Number(this.keys.KeyW) + Number(this.keys.KeyS)
    );

    // stay in room
    const vec = new Vector();
    if (this.x < 0) vec.add(-this.x, 0);
    if (this.x > room.width) vec.add(-(this.x - room.width), 0);
    if (this.y < 0) vec.add(0, -this.y);
    if (this.y > room.height) vec.add(0, -(this.y - room.height));
    vec.divide(config.ROOM_BOUNCE);
    this.velocity.add(vec);

    // heal
    if (this.health.current < this.health.max) this.health.heal(0.1);
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
    const { index, radius, shape, x, y, angle, color } = this;
    return {
      index,
      radius,
      shape,
      x, y,
      angle,
      color,
      name: this.name === "" ? undefined : this.name,
      chat: this.chat.map(c => c.message),
      health: this.health.abstract
    };
  }

  get isDead() {
    return this.health.current <= 0;
  }
}
