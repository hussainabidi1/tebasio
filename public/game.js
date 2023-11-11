const canvas = document.getElementById("canvas");
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

const chatInput = document.getElementById("chat");
const colorInput = document.getElementById("colorInput");

if (window.location != "http://localhost:3000/" && window.location != "https://tebas.surge.sh/") {
  window.location = "https://tebas.surge.sh";
}

let times = [],
  fps,
  players = [],
  bots = [],
  imDead = false,
  color,
  deaths = 0,
  entities = [],
  leaderboard,
  connectToReplit = false;

document.getElementById("playButton").addEventListener("click", function () {
  startGame();
});

document.getElementById("respawnButton").addEventListener("click", function () {
  startGame();
});

colorInput.addEventListener("input", function () {
  if (color !== "#000000") {
    color = colorInput.value;
  }
});

let myId,
  myEntity,
  roomWidth,
  roomHeight,
  socket,
  chatting;

const keys = {
  up: false,
  down: false,
  left: false,
  right: false
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

function drawEntities() {
  for (let i = 0; i < entities.length; i++) {
    if (entities[i][1]) {
      const { pos, radius, angle, shape, color, name, chat, health } = entities[i][1];
      drawShape(pos.x, pos.y, radius, angle, shape, color);
      if (health && health.current >= 0 && health.current < health.max) drawHealth(pos.x, pos.y, health, color, radius);

      if (name) drawText(pos.x, pos.y, name, radius / 2 - 5, radius * 2);
      if (chat && Array.isArray(chat)) {
        for (let i = 0; i < chat.length; i++) {
          drawText(pos.x, pos.y - radius - (i + 1) * (radius / 2.5), chat[i], radius / 2 - 5);
        }
      }
    }
  }
}

function drawPlayers() {
  for (let i = 0; i < players.length; i++) {
    const { pos, radius, angle, shape, color, name, chat, health } = players[i];
    drawShape(pos.x, pos.y, radius, angle, shape, color);
    if (health.current >= 0 && health.current < health.max) {
      drawHealth(pos.x, pos.y, health, color, radius);
    }

    if (name) {
      drawText(pos.x, pos.y, name, radius / 2 - 5, radius * 2);
    }
    if (chat && Array.isArray(chat)) {
      for (let i = 0; i < chat.length; i++) {
        drawText(pos.x, pos.y - radius - (i + 1) * (radius / 2.5), chat[i], radius / 2 - 5);
      }
    }
  }
}

function drawBots() {
  for (let i = 0; i < bots.length; i++) {
    const { pos, radius, angle, shape, color, health } = bots[i];
    drawShape(pos.x, pos.y, radius, angle, shape, color);
    if (health.current >= 0 && health.current < health.max) {
      drawHealth(pos.x, pos.y, health, color, radius);
    }
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
  if (connectToReplit) socket = new WebSocket("wss://tebasio-at.ianwilliams10.repl.co");
  else if (window.location == "http://localhost:3000/") {
    socket = new WebSocket("ws://localhost:3000");
  } else {
    socket = new WebSocket("wss://tebasio-at.ianwilliams10.repl.co");
  }

  socket.open = false;
  socket.onopen = function socketOpen() {
    socket.open = true;
    const username = document.getElementById("usernameInput").value;
    socket.send(JSON.stringify({ type: "name", data: { name: username } }));
    socket.send(JSON.stringify({ type: "color", data: { color } }));
    if (document.getElementById("tokenInput").value) {
      socket.send(JSON.stringify({ type: "token", data: { token: document.getElementById("tokenInput").value } }));
    }
  };
  socket.talk = async (...message) => {
    if (!socket.open) {
      return 1;
    }
    socket.send(message);
  };
  socket.onmessage = async function socketMessage(message) {
    const parsed = JSON.parse(message.data);
    const data = parsed.data;
    switch (parsed.type) {
      case "init":
        const { id, width, height } = data;
        entities = data.entities;
        myEntity = entities.find(e => e[0] == id)[1];
        roomWidth = width;
        roomHeight = height;
        myId = id;
        break;

      case "entities":
        entities = data.entities;
        if (!imDead) myEntity = entities.find(e => e[0] == myId)[1];
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

function createLeaderboard() {
  if (document.getElementById("leaderboard")) document.getElementById("leaderboard").remove();
  leaderboard = document.createElement('div');
  leaderboard.setAttribute("id", "leaderboard");
  leaderboard.style.position = 'absolute';
  leaderboard.style.top = '10px';
  leaderboard.style.right = '10px';
  leaderboard.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
  leaderboard.style.padding = '10px';
  leaderboard.style.borderRadius = '5px';
  document.body.appendChild(leaderboard);
}

function updateLeaderboard() {
  for (let i = 0; i < entities.length; i++) {
    const player = entities[i][1];
    if (player.type === "player") {
      const text = `${player.name === "" ? "Unnamed" : player.name} - ${Math.floor(player.xp)}`;
      const playerRow = document.createElement('div');
      playerRow.style.display = 'flex';
      playerRow.style.alignItems = 'center';
      playerRow.style.marginBottom = '5px';
      if (player.op) playerRow.style.color = "#FF0000";
      playerRow.setAttribute("id", `${player.index}`);

      if (!leaderboard.children.namedItem(`${player.index}`)) {
        leaderboard.appendChild(playerRow); // add player row to leaderboard
      }

      if (leaderboard.children.namedItem(`${player.index}`).textContent !== text) {
        leaderboard.children.namedItem(`${player.index}`).textContent = text; // update leaderboard text
      };
    };
  }
  for (let i = 0; i < leaderboard.children.length; i++) {
    const l = leaderboard.children.item(i);
    let e = entities.find(p => p[1].index === Number(l.id));
    if (!e) {
      l.remove(); // check for dead players and remove from leaderboard
      return;
    }
    if (leaderboard.children.item(i - 1)) {
      if (e[1].xp > entities.find(p => p[1].index === Number(leaderboard.children.item(i - 1).id))[1].xp) {
        leaderboard.insertBefore(leaderboard.children.item(i), leaderboard.children.item(i - 1));
      }
    }
  }
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
    leaderboard.style.display = "none";
    return;
  }
  ctx.save();
  ctx.fillStyle = "rgb(200, 200, 200)";
  ctx.scale(myEntity.fov, myEntity.fov);
  ctx.fillRect(-myEntity.pos.x + (canvas.width / 2 / myEntity.fov), -myEntity.pos.y + (canvas.height / 2 / myEntity.fov), roomWidth, roomHeight);
  drawGrid(myEntity.pos.x, myEntity.pos.y, 32);
  ctx.translate(-myEntity.pos.x + (canvas.width / 2 / myEntity.fov), -myEntity.pos.y + (canvas.height / 2 / myEntity.fov));

  drawEntities();
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
  updateLeaderboard();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  toggleStartScreen();
  initCanvas();
  createLeaderboard();
  socket = initSocket();
  imDead = false;
  document.getElementById("respawnButton").style.display = "none";
  gameLoop();
}

window.addEventListener("keydown", (event) => {
  if (socket && socket.open && !imDead) {
    switch (event.code) {
      case "Enter":
        if (!chatting) {
          chatting = true;
          chatInput.style.display = "block";
          chatInput.focus();
        } else {
          chatting = false;
          chatInput.style.display = "none";
          chat();
        }
        break;

      case "KeyW":
      case "ArrowUp":
        if (!chatting) keys.up = true;
        break;

      case "KeyS":
      case "ArrowDown":
        if (!chatting) keys.down = true;
        break;

      case "KeyD":
      case "ArrowRight":
        if (!chatting) keys.right = true;
        break;

      case "KeyA":
      case "ArrowLeft":
        if (!chatting) keys.left = true;
        break;
    }
    socket.talk(JSON.stringify({ type: "keys", data: { keys } }));
  }
});

window.addEventListener("keyup", (event) => {
  if (socket && !imDead) {
    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        if (!chatting) keys.up = false;
        break;

      case "KeyS":
      case "ArrowDown":
        if (!chatting) keys.down = false;
        break;

      case "KeyD":
      case "ArrowRight":
        if (!chatting) keys.right = false;
        break;

      case "KeyA":
      case "ArrowLeft":
        if (!chatting) keys.left = false;
        break;
    }
    socket.talk(JSON.stringify({ type: "keys", data: { keys } }));
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