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
