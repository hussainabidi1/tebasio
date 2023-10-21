import c from "../../config";
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
    }
}

const collideLoop = (a: Entity) => {
    for (let i = 0; i < room.clients.length; ++i) {
        if (a !== room.clients[i].body) {
            collide(a, room.clients[i].body);
        }
    }
}

const turn = (a: Entity) => {
    a.angle = -Math.atan2(a.mx, a.my);
}

const move = (a: Entity) => {
    const { keys, velocity } = a;
    if (keys.KeyW) velocity.y -= 1;
    if (keys.KeyS) velocity.y += 1;
    if (keys.KeyA) velocity.x -= 1;
    if (keys.KeyD) velocity.x += 1;

    a.x += velocity.x;
    a.y += velocity.y;

    velocity.x *= 0.9;
    velocity.y *= 0.9;
}

const stayInRoom = (a: Entity) => {
    if (a.x < 0) {
        a.velocity.x += Math.abs(a.x) / 20;
    }
    if (a.x > room.width) {
        a.velocity.x -= (a.x - room.width) / 20;
    }
    if (a.y < 0) {
        a.velocity.y += Math.abs(a.y) / 20;
    }
    if (a.y > room.height) {
        a.velocity.y -= (a.y - room.height) / 20;
    }
}

export default () => {
    const staticEntities = room.clients.map(c => c.body.static);
    for (let i = 0; i < room.clients.length; ++i) {
        const { body } = room.clients[i];
        move(body);
        turn(body);
        collideLoop(body);
        stayInRoom(body);
        body.chat = body.chat.filter(msg => msg.sentAt + c.CHAT_INTERVAL > Date.now());
        body.talk("pos", { clients: staticEntities });
    }
}