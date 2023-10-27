import { Entity } from "./Entity";

export interface Enemy extends Entity {
  body: Entity
}