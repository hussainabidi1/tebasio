import c from "../config";
import { Entity } from "../classes";
import room from "./room";

const collide = (a: Entity, b: Entity) => {
    const dx = Math.abs(a.y - b.y);
    const dy = Math.abs(a.x - b.x);
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= a.radius + b.radius) {
        const angle = Math.atan2(dx, dy);
        const overlap = a.radius + b.radius - distance;
        const moveX = overlap * Math.cos(angle);
        const moveY = overlap * Math.sin(angle);

        a.x -= moveX / 2;
        a.y -= moveY / 2;

        b.x += moveX / 2;
        b.y += moveY / 2;

        if (a.health.current >= 0) a.health.damage(0.5);
        if (b.health.current >= 0) b.health.damage(0.5);
    }
}

const collideLoop = (a: Entity) => {
    for (const client of room.clients) {
        if (a != client.body) {
            collide(a, client.body);
        }
    }
}

export default () => {
    const staticEntities = room.clients.map(c => c.body.static);
    for (let i = 0; i < room.clients.length; ++i) {
        const { body } = room.clients[i];
        body.update();
        collideLoop(body);
        body.talk("pos", { clients: staticEntities });
    }
}