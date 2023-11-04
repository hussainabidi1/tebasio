export interface AbstractVector {
  x: number,
  y: number
}

export class Vector implements AbstractVector {
  constructor(public x = 0, public y = 0) { }

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

export class Entity {
  static instances: Map<number, Entity> = new Map();
  static index: number = 0;

  public index: number;
  constructor() {
    this.index = Entity.index++;
    Entity.instances.set(this.index, this);
  }

  public destroy() {
    Entity.instances.delete(this.index);
  }
}
