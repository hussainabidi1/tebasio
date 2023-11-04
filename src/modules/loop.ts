import c from "../config";
import { Player, Enemy } from "../classes";
import room from "./room";

const collide = (a: Player | Enemy, b: Player | Enemy) => {
    const dx = Math.abs(a.pos.y - b.pos.y);
    const dy = Math.abs(a.pos.x - b.pos.x);
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= a.radius + b.radius) {
        const angle = Math.atan2(dx, dy);
        const overlap = a.radius + b.radius - distance;
        const moveX = overlap * Math.cos(angle);
        const moveY = overlap * Math.sin(angle);

        a.pos.x -= moveX / 2;
        a.pos.y -= moveY / 2;

        b.pos.x += moveX / 2;
        b.pos.y += moveY / 2;

        if (!a.colliders.includes(b)) a.colliders.push(b);
        if (!b.colliders.includes(a)) b.colliders.push(a);

        a.health.damage(b.damage / 2);
        b.health.damage(a.damage / 2);
    }
    else if (distance <= a.radius + b.radius + 5) {
        a.colliders.splice(a.colliders.indexOf(b), 1);
        b.colliders.splice(b.colliders.indexOf(a), 1);
    }
}

const collideLoop = (a: Player | Enemy) => {
    for (const client of room.clients) {
        if (a != client.body) {
            collide(a, client.body);
        }
    }
    for (const bot of room.enemies) {
        if (a != bot.body) {
            collide(a, bot.body);
        }
    }
}

export default () => {
    const staticEntities = room.clients.map(c => c.body.static);
    const bots = room.enemies.map(c => c.body.static);
    if (room.enemies.length < c.BOTS) room.spawnEnemy();
    for (let i = 0; i < room.clients.length; ++i) {
        const { body } = room.clients[i];
        body.update();
        collideLoop(body);
        body.talk("pos", { clients: staticEntities });
        body.talk("bots", { bots })
        if (body.health.current <= 0) {
            body.talk("death", {});
            for (let i = 0; i < body.colliders.length; i++) {
                body.colliders[i].xp += body.xp / 2 / body.colliders.length;
                body.colliders[i].kills++;
            }
            body.destroy();
            room.clients.splice(i, 1);
        }
    }
    for (let i = 0; i < room.enemies.length; ++i) {
        const { body } = room.enemies[i];
        body.update();
        collideLoop(body);
        if (body.health.current <= 0) {
            for (let i = 0; i < body.colliders.length; i++) {
                body.colliders[i].xp += body.xp / 3 / body.colliders.length
                body.colliders[i].kills++;
            }
            body.destroy();
            room.enemies.splice(i, 1);
        }
    }
}