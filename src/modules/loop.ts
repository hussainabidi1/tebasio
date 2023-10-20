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

const move = () => {
    // .......
}

const collideLoop = (a: Entity) => {
    for (let i = 0; i < room.clients.length; ++i) {
        collide(a, room.clients[i].body)
    }
}

export default () => {
    const staticEntities = room.clients.map(c => c.body.static);
    for (let i = 0; i < room.clients.length; ++i) {
        const { body } = room.clients[i];
        body.talk('pos', { clients: staticEntities });
        collideLoop(body)
    }
}