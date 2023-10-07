const port = 3000;
const clients = new Map();
const keys = new Map();
const mice = new Map();
let mouseX, mouseY;

let counter = 0;
function getID() {
  counter++
  return counter;
};

function move(instance) {
  if (keys.get(instance)) {
    const a = keys.get(instance);
    const b = clients.get(instance);
    if (a.ArrowUp || a.KeyW) {
      b.y -= 5;
    };
    if (a.ArrowDown || a.KeyS) {
      b.y += 5;
    };
    if (a.ArrowLeft || a.KeyA) {
      b.x -= 5;
    };
    if (a.ArrowRight || a.KeyD) {
      b.x += 5;
    };
  }
}

function turn(instance) {
  if (mice.get(instance)) {
    const a = mice.get(instance);
    const b = clients.get(instance);
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    b.angle = Math.atan2(dy, dx);
  }
}

function getRandomHexDigit() {
  const hexDigits = "0123456789ABCDEF";
  return hexDigits[Math.floor(Math.random() * 16)];
}

function generateRandomHexCode() {
  let hexCode = '#';
  for (let i = 0; i < 6; i++) {
    hexCode += getRandomHexDigit();
  }
  return hexCode;
}
Bun.serve({
  port: port,
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
      clients.set(ws, { id: getID(), x: 500, y: 500, r: 50, angle: 0, color: generateRandomHexCode(), sides: 7 });
      console.log(`Client #${clients.get(ws).id} connected.`);
      clients.forEach(function(v, key) {
        ws.send(JSON.stringify({ type: "playerConnected", data: clients.get(key) }));
        key.send(JSON.stringify({ type: "playerConnected", data: clients.get(ws) }));
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
          mice.set(ws, {x: data.x, y: data.y});
          break;

        default:
          console.log(parsed);
      }
    },
    close(ws) {
      console.log(`Client #${clients.get(ws).id} disconnected.`);
      clients.forEach(function(v, k) {
        k.send(JSON.stringify({ type: "playerDisconnected", data: { id: clients.get(ws).id } }));
      })
      clients.delete(ws);
    },
  },
  error() {
    return new Response(null, { status: 404 });
  },
});

console.log(`Server listening on port ${port}`);

setInterval(() => {
  clients.forEach(function(v, k) {
    move(k);
    turn(k);
    clients.forEach(function(val, key) {
      key.send(JSON.stringify({ type: "pos", data: { id: v.id, x: v.x, y: v.y, angle: v.angle } }));
    });
  })
}, 1000 / 60)