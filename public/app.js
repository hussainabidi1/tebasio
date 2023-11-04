const canvas = document.getElementById("canvas");
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

const chatInput = document.getElementById("chat");
const colorInput = document.getElementById("colorInput");

if (window.location != "http://localhost:3000/" && window.location != "https://tebas.surge.sh/") window.location = "https://tebas.surge.sh";

let times = [];
let fps;
let players = [];
let bots = [];
let icosagon = [];
let imDead = false;
let color;
let deaths = 0;

document.getElementById("playButton").addEventListener("click", function () {
  startGame();
});

colorInput.addEventListener("input", function () {
  if (color !== "#000000") color = colorInput.value;
});

let myId,
  myEntity,
  roomWidth,
  roomHeight,
  socket,
  chatting;

const keys = {
  KeyW: false,
  KeyA: false,
  KeyS: false,
  KeyD: false
};

function chat() {
  if (chatInput.value && typeof chatInput.value == "string") {
    socket.send(JSON.stringify({ type: "chat", data: { message: chatInput.value } }));
    chatInput.value = "";
  }
}

function updateInputPosition() {
  const { width, height } = canvas;
  chatInput.style.left = `${width / 2 - chatInput.getBoundingClientRect().width - 100}px`;
  chatInput.style.top = `${height / 2 + 100}px`;
}

function drawShape(x, y, r, angle, sides, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const vertexAngle = angle + (i * (Math.PI * 2)) / sides;
    const x1 = x + r * Math.cos(vertexAngle);
    const y1 = y + r * Math.sin(vertexAngle);
    if (i === 0) {
      ctx.moveTo(x1, y1);
    } else {
      ctx.lineTo(x1, y1);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
  ctx.clip();
  ctx.stroke();
  ctx.restore();
}

function drawText(x, y, text, resolution = 16, maxWidth = undefined) {
  ctx.save();
  ctx.font = `${resolution}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeText(text, x, y, maxWidth);
  ctx.fillStyle = "black";
  ctx.fillText(text, x, y, maxWidth);
  ctx.restore();
}

function drawHealth(x, y, health, color, radius) {
  ctx.beginPath();
  ctx.fillStyle = "grey";
  ctx.roundRect(x - health.max / 2, y + radius + 10, health.max, 10, 5);
  ctx.fill();
  ctx.closePath();
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.roundRect(x - health.max / 2 + 1, y + radius + 11, health.current - 2 > 0 ? health.current - 2 : 0, 8, 5);
  ctx.fill();
  ctx.closePath();
}

function drawPlayers() {
  for (let i = 0; i < players.length; i++) {
    const { pos, radius, angle, shape, color, name, chat, health } = players[i];
    drawShape(pos.x, pos.y, radius, angle, shape, color);
    if (health.current >= 0 && health.current < health.max) drawHealth(pos.x, pos.y, health, color, radius);

    if (name) drawText(pos.x, pos.y, name, radius / 2 - 5, radius * 2);
    if (chat && Array.isArray(chat)) {
      for (let i = 0; i < chat.length; i++) {
        drawText(pos.x, pos.y - radius - (i + 1) * (radius / 2.5), chat[i], radius / 2 - 5);
      }
    }
  };
}

function drawBots() {
  for (let i = 0; i < bots.length; i++) {
    const { pos, radius, angle, shape, color, health } = bots[i];
    drawShape(pos.x, pos.y, radius, angle, shape, color);
    if (health.current >= 0 && health.current < health.max) drawHealth(pos.x, pos.y, health, color, radius);
  };
}
function drawIcosagon() {
  for (let i = 0; i < icosagon.length; i++) {
    const { x, y, radius, angle, shape, color, name, health } = icosagon[i];
    drawShape(x, y, radius, angle, shape, color);
    if (health.current >= 0 && health.current <
      health.max) drawHealth(x, y, 0, health, color);
    if (name) drawText(x, y, name, 18, radius * 2);
  }
}
function drawGrid(x, y, cellSize) {
  ctx.beginPath();
  for (let i = (canvas.width / 2 / myEntity.fov - x) % cellSize; i < canvas.width / myEntity.fov; i += cellSize) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height / myEntity.fov);
  }

  for (let j = (canvas.height / 2 / myEntity.fov - y) % cellSize; j < canvas.height / myEntity.fov; j += cellSize) {
    ctx.moveTo(0, j);
    ctx.lineTo(canvas.width / myEntity.fov, j);
  }
  ctx.closePath();


  ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 1.5;

  ctx.stroke();
}

function initCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  updateInputPosition();
}

const initSocket = () => {
  let socket;
  if (window.location == "http://localhost:3000/") socket = new WebSocket("ws://localhost:3000");
  else socket = new WebSocket("wss://tebasio-at.ianwilliams10.repl.co");

  socket.open = false;
  socket.onopen = function socketOpen() {
    socket.open = true;
    const username = document.getElementById("usernameInput").value;
    socket.send(JSON.stringify({ type: "name", data: { name: username } }))
    socket.send(JSON.stringify({ type: "color", data: { color } }))
    if (document.getElementById("tokenInput").value) socket.send(JSON.stringify({ type: "token", data: { token: document.getElementById("tokenInput").value } }));
  };
  socket.talk = async (...message) => {
    if (!socket.open) return 1;
    socket.send(message);
  };
  socket.onmessage = async function socketMessage(message) {
    const parsed = JSON.parse(message.data);
    const data = parsed.data;
    switch (parsed.type) {
      case "init": {
        const { clients, id, width, height } = data;
        myEntity = clients.find(p => p.index == id);
        players = clients;
        roomWidth = width;
        roomHeight = height;
        myId = id;
      } break;

      case "pos": {
        const { clients } = data;
        myEntity = clients.find(p => p.index == myId);
        players = clients;
      } break;

      case "playerConnected":
        players.push(data.client);
        break;

      case "playerDisconnected":
        players.splice(players.indexOf(data.client));
        break;

      case "bots":
        bots = data.bots;
        break;

      case "icosagon":
        icosagon = data.icosagon;
        break;

      case "name":
        players[data.id].name = data.name;
        break;

      case "death":
        imDead = true;
        deaths++;
        break;

      default:
        console.log(parsed);
        break;
    }
  };
  socket.onclose = () => {
    socket.open = false;
  };

  return socket;
};

function toggleStartScreen() {
  document.getElementById("startMenu").style.display = "none";
  canvas.style.display = "block";
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgb(160, 160, 160)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function render() {
  clearCanvas();
  if (!myId && !imDead) {
    ctx.save();
    drawText(canvas.width / 2, canvas.height / 2, "Connecting...", 48);
    ctx.restore();
    return;
  }
  if (!socket.open && myId) {
    ctx.save();
    drawText(canvas.width / 2, canvas.height / 2, "Disconnected.", 48);
    ctx.restore();
    return;
  }
  if (imDead) {
    myId = null;
    drawText(canvas.width / 2, canvas.height / 2, "You died!", 48);
    document.getElementById("respawnButton").style.display = "block";
    return;
  }
  ctx.save();
  ctx.fillStyle = "rgb(200, 200, 200)";
  ctx.scale(myEntity.fov, myEntity.fov);
  ctx.fillRect(-myEntity.pos.x + (canvas.width / 2 / myEntity.fov), -myEntity.pos.y + (canvas.height / 2 / myEntity.fov), roomWidth, roomHeight);
  drawGrid(myEntity.pos.x, myEntity.pos.y, 32);
  ctx.translate(-myEntity.pos.x + (canvas.width / 2 / myEntity.fov), -myEntity.pos.y + (canvas.height / 2 / myEntity.fov));
  drawBots();
  drawPlayers();
  drawIcosagon();
  // Render other game objects here
  ctx.restore();
  // fps stuff
  const now = performance.now();
  while (times.length > 0 && times[0] <= now - 1000) {
    times.shift();
  }
  times.push(now);
  fps = Math.floor(times.length / (deaths + 1));
  drawText(60, 20, `FPS: ${fps}`, 16);
}

function gameLoop() {
  render();

  requestAnimationFrame(gameLoop);
}

function startGame() {
  toggleStartScreen();
  initCanvas();
  socket = initSocket();
  imDead = false;
  document.getElementById("respawnButton").style.display = "none";
  times = [];

  gameLoop();
}

window.addEventListener("keydown", (event) => {
  if (socket && socket.open && !imDead) {
    if (event.code === "Enter") {
      if (!chatting) {
        chatting = true;
        chatInput.style.display = "block";
        chatInput.focus();
      } else {
        chatting = false;
        chatInput.style.display = "none";
        chat();
      }
    }
    if (event.code in keys && !chatting && !imDead) {
      keys[event.code] = true;
      socket.talk(JSON.stringify({ type: "keys", data: { keys } }));
    }
  }
});

window.addEventListener("keyup", (event) => {
  if (socket && !imDead) {
    if (event.code in keys) {
      keys[event.code] = false;
      socket.talk(JSON.stringify({ type: "keys", data: { keys } }));
    }
  }
});

window.addEventListener("resize", initCanvas);

canvas.addEventListener("mousemove", (event) => {
  if (socket && !imDead) {
    socket.talk(JSON.stringify({ type: "mousemove", data: { x: event.clientX - canvas.width / 2, y: event.clientY - canvas.height / 2 } }));
  }
});


window.onload = function () {
  canvas.style.display = "none";
  updateInputPosition();
};