import { Entity } from "./Entity";

export interface Player extends WebSocket {
    body: Entity
}