import { Entity } from "./Entity";

type NewType = Object;

export default interface Enemy extends NewType {
  body: Entity;
}