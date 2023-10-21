import { Entity } from "../classes";
import room from "./room";

const collide = (a: Entity, b: Entity) => {
    const dx = Math.abs(a.y - b.y);
    const dy = Math.abs(a.x - b.x);
    const angle = Math.atan2(dx, dy);
    const overlap = a.radius + b.radius - Math.sqrt(dx * dx + dy * dy);
    const moveX = overlap * Math.cos(angle);
    const moveY = overlap * Math.sin(angle);

    a.x -= moveX / 2;
    b.y -= moveY / 2;
    a.x += moveX / 2;
    b.y += moveY / 2;
}

const collideLoop = (a: Entity) => {
    for (let i = 0; i < room.clients.length; ++i) {
        collide(a, room.clients[i].body)
    }
}

const turn = (a: Entity) => {
    a.angle = -Math.atan2(a.mx, a.my);
}

const move = (a: Entity) => {
    const { keys, velocity } = a;
    if (keys.KeyW) velocity.y -= 2;
    if (keys.KeyS) velocity.y += 2;
    if (keys.KeyA) velocity.x -= 2;
    if (keys.KeyD) velocity.x += 2;

    a.x += velocity.x;
    a.y += velocity.y;

    velocity.x *= 0.8;
    velocity.y *= 0.8;
}

export default () => {
    const staticEntities = room.clients.map(c => c.body.static);
    for (let i = 0; i < room.clients.length; ++i) {
        const { body } = room.clients[i];
        move(body);
        turn(body);
        collideLoop(body);
        body.talk("pos", { clients: staticEntities });
    }
}