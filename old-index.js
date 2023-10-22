/**
 * DISCLAIMER:
 * WE DON'T SUPPORT THIS VERSION
 * RUN src/index.ts FOR NEW VERSION
 */

console.log(`///
WARNING: THIS VERSION IS NOT SUPPORTED
///`);

const c = {
  ROOM_WIDTH: 1920,
  ROOM_HEIGHT: 1920,
  PORT: 3000,
  BOTS: 1,
  MESSAGE_LIMIT: 50,
  CHAT_LIMIT: 10,
  CHAT_INTERVAL: 5000
};
const clients = new Map();
const keys = new Map();
const mice = new Map();
const bots = new Map();
// TODO: fix this hell ^^^^

const bounce = 100;
const speed = 1.5; // to be removed

const floorRandMax = max => Math.floor(Math.random() * max);

let counter = 0;
function getID() {
  counter++
  return counter;
};

function move(instance) {
  if (keys.get(instance)) {
    const a = keys.get(instance);
    const b = clients.get(instance);
    b.y += b.yVel;
    b.x += b.xVel;
    if (a.KeyW && a.KeyA) {
      b.xVel += speed / 2;
      b.yVel += speed / 2;
    }
    if (a.KeyW && a.KeyD) {
      b.xVel -= speed / 2;
      b.yVel += speed / 2;
    }
    if (a.KeyS && a.KeyA) {
      b.xVel += speed / 2;
      b.yVel -= speed / 2;
    }
    if (a.KeyS && a.KeyD) {
      b.xVel -= speed / 2;
      b.yVel -= speed / 2;
    }
    if (a.KeyW) {
      b.yVel -= speed;
    }
    if (a.KeyS) {
      b.yVel += speed;
    }
    if (a.KeyA) {
      b.xVel -= speed;
    }
    if (a.KeyD) {
      b.xVel += speed;
    }
    console.log(b.xVel, b.yVel);
    b.xVel *= 0.8;
    b.yVel *= 0.8;
  }
}

function turn(instance) {
  if (mice.get(instance)) {
    const a = mice.get(instance);
    const b = clients.get(instance);
    b.angle = -Math.atan2(a.x, a.y);
  }
}

function checkCollision(player1, player2) {
  const dx = Math.abs(player1.y - player2.y);
  const dy = Math.abs(player1.x - player2.x);
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= player1.r + player2.r;
}

function collide(player1, player2) {
  const dx = Math.abs(player1.y - player2.y);
  const dy = Math.abs(player1.x - player2.x);
  const angle = Math.atan2(dx, dy);
  const overlap = player1.r + player2.r - Math.sqrt(dx * dx + dy * dy);
  const moveX = overlap * Math.cos(angle);
  const moveY = overlap * Math.sin(angle);

  player1.x -= moveX / 2;
  player1.y -= moveY / 2;
  player2.x += moveX / 2;
  player2.y += moveY / 2;
}

function stayInRoom(v) {
  if (v.x < 0) {
    v.xVel += Math.abs(v.x) / bounce;
  }
  if (v.x > c.ROOM_WIDTH) {
    v.xVel -= (v.x - c.ROOM_WIDTH) / bounce;
  }
  if (v.y < 0) {
    v.yVel += Math.abs(v.y) / bounce;
  }
  if (v.y > c.ROOM_HEIGHT) {
    v.yVel -= (v.y - c.ROOM_WIDTH) / bounce;
  }
}
function updateBot(instance) {
  const a = bots.get(instance);
  a.x += a.xVel;
  a.y += a.yVel;
  clients.forEach(function (v, k) {
    const dx = v.y - a.y;
    const dy = v.x - a.x;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= 150 && distance > 5) {
      a.goal = true;
      a.angle = Math.atan2(dx, dy);
    }
    else a.goal = false
  })
  if (a.goal) {
    a.xVel += Math.cos(a.angle) * speed;
    a.yVel += Math.sin(a.angle) * speed;
  }
  a.xVel *= 0.8;
  a.yVel *= 0.8;
}

function getRandomHexDigit() {
  const hexDigits = "0123456789ABCDEF";
  return hexDigits[Math.floor(Math.random() * 16)];
}

function generateRandomHexCode() {
  let hexCode = "#";
  for (let i = 0; i < 6; i++) {
    hexCode += getRandomHexDigit();
  }
  return hexCode;
}
Bun.serve({
  port: c.PORT,
  fetch(req, server) {
    let pathName = new URL(req.url).pathname;

    switch (pathName) {
      case "/":
        if (server.upgrade(req)) return;
        pathName = "/index.html";
        break;
    };

    const file = Bun.file("./public" + pathName);
    return new Response(file);
  },
  websocket: {
    open(ws) {
      clients.set(ws, {
        id: getID(),
        x: Math.random() * c.ROOM_WIDTH,
        y: Math.random() * c.ROOM_HEIGHT,
        r: 50,
        angle: 0,
        color: `rgb(${floorRandMax(255)}, ${floorRandMax(255)}, ${floorRandMax(255)}`,
        sides: 7,
        name: "",
        xVel: 0,
        yVel: 0,
        chat: []
      });
      console.log(`Client #${clients.get(ws).id} connected.`);
      ws.send(JSON.stringify({ type: "init", data: { id: clients.get(ws).id, roomWidth: c.ROOM_WIDTH, roomHeight: c.ROOM_HEIGHT } }));
      clients.forEach(function (v, key) {
        ws.send(JSON.stringify({ type: "playerConnected", data: clients.get(key) }));
        key.send(JSON.stringify({ type: "playerConnected", data: clients.get(ws) }));
        bots.forEach(function (v, k) {
          key.send(JSON.stringify({ type: "bots", data: v }));
        })
      })
    },
    message(ws, message) {
      const parsed = JSON.parse(message);
      const data = parsed.data
      switch (parsed.type) {
        case "move":
          keys.set(ws, data.keys);
          break;

        case "mousemove":
          mice.set(ws, { x: data.x, y: data.y });
          break;

        case "name":
          clients.get(ws).name = data.name;
          clients.forEach(function (v, k) {
            k.send(JSON.stringify({ type: "name", data: { id: clients.get(ws).id, name: clients.get(ws).name } }));
            ws.send(JSON.stringify({ type: "name", data: { id: clients.get(k).id, name: clients.get(k).name } }));
          })
          break;

        case "chatMessage":
          const client = clients.get(ws);
          if (data.message.length <= c.MESSAGE_LIMIT && client.chat.length <= c.CHAT_LIMIT) {
            client.chat.unshift({
              message: data.message,
              sentAt: Date.now()
            });
          }
          break;

        default:
          console.log(`${parsed}`);
      }
    },
    close(ws) {
      console.log(`Client #${clients.get(ws).id} disconnected.`);
      clients.forEach(function (v, k) {
        k.send(JSON.stringify({ type: "playerDisconnected", data: { id: clients.get(ws).id } }));
      })
      clients.delete(ws);
    },
  },
  error() {
    return new Response(null, { status: 404 });
  },
});

console.log(`Server listening on port ${c.PORT}`);

for (let i = 0; i < c.BOTS; i++) {
  bots.set(i, {
    id: i,
    x: floorRandMax(c.ROOM_WIDTH),
    y: floorRandMax(c.ROOM_HEIGHT),
    r: 30 + floorRandMax(25),
    angle: floorRandMax(2) * Math.PI / 180,
    sides: 8,
    color: "#FF0000",
    xVel: 0,
    yVel: 0,
    goal: false
  })
}

setInterval(() => {
  clients.forEach(function (v, k) {
    stayInRoom(v);
    move(k);
    turn(k);
    v.chat = v.chat.filter(msg => msg.sentAt + c.CHAT_INTERVAL > Date.now());
    clients.forEach(function (val, key) {
      if (v !== val) {
        if (checkCollision(v, val)) {
          collide(v, val);
        }
      }
      key.send(JSON.stringify({ type: "pos", data: { id: v.id, x: v.x, y: v.y, angle: v.angle, chat: v.chat.map(c => c.message) } }));
    });
  })
  bots.forEach(function (v, k) {
    stayInRoom(v);
    updateBot(k);
    clients.forEach(function (val, key) {
      key.send(JSON.stringify({ type: "bots", data: v }));
    })
  })
}, 1000 / 60)

setInterval(() => {
  bots.forEach(function (v, k) {
    updateBot(k);
    clients.forEach(function (val, key) {
      key.send(JSON.stringify({ type: "bots", data: v }));
    })
  })
}, 1000);