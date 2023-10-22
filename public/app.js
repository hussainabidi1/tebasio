const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const chatInput = document.getElementById("chat");
const colorInput = document.getElementById("colorInput");

let lastUpdate = Date.now();
let fps = 0;
let players = [];
let color;
const bots = new Map();
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
  KeyD: false,
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

function drawPlayers() {
  for (let i = 0; i < players.length; i++) {
    const { x, y, radius, angle, shape, color, name, chat, health } = players[i];
    drawShape(x, y, radius, angle, shape, color);

    ctx.roundRect(x - health.max / 2, y + 60, health.max, 10, 5);
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.roundRect(x - health.current / 2 + 2, y + 62, health.current - 4, 8);
    ctx.fill();

    if (name) drawText(x, y, name, 18, radius * 2);
    if (chat && Array.isArray(chat)) {
      for (let i = 0; i < chat.length; i++) {
        drawText(x, y - radius - (i + 1) * 16, chat[i]);
      }
    }
  };
}

function drawBots() {
  bots.forEach(function (val, key) {
    const { x, y, r, angle, sides, color } = val;
    drawShape(x, y, r, angle, sides, color);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.stroke();
  });
}

function drawGrid(x, y, cellSize) {
  ctx.beginPath();
  for (let i = (canvas.width / 2 - x) % cellSize; i < canvas.width; i += cellSize) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
  }

  for (let j = (canvas.height / 2 - y) % cellSize; j < canvas.height; j += cellSize) {
    ctx.moveTo(0, j);
    ctx.lineTo(canvas.width, j);
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
        const { x, y, r, color, sides, angle } = data;
        bots.set(data.id, { x, y, r, angle, color, sides });
        break;

      case "name":
        players[data.id].name = data.name;
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
  ctx.fillStyle = "rgb(180, 180, 180)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function render() {
  clearCanvas();
  if (myId === undefined) {
    ctx.save();
    drawText(canvas.width / 2, canvas.height / 2, "Connecting...", 48);
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.fillStyle = "rgb(220, 220, 220)";
  ctx.fillRect(-myEntity.x + canvas.width / 2, -myEntity.y + (canvas.height / 2), roomWidth, roomHeight);
  drawGrid(myEntity.x, myEntity.y, 32);
  ctx.translate(-myEntity.x + canvas.width / 2, -myEntity.y + (canvas.height / 2));
  //drawBots();
  drawPlayers();
  ctx.restore();
  // Render other game objects here
  drawText(60, 20, `FPS: ${fps}`, 16);
  lastUpdate = Date.now();
  fps = Math.round(1000 / (Date.now() - lastUpdate));
}

function gameLoop() {
  render();

  requestAnimationFrame(gameLoop);
}

function startGame() {
  toggleStartScreen();
  initCanvas();

  socket = initSocket();

  gameLoop();
}

window.addEventListener("keydown", (event) => {
  if (socket) {
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
    if (event.code in keys && !chatting) {
      keys[event.code] = true;
      socket.talk(JSON.stringify({ type: "keys", data: { keys } }));
    }
  }
});

window.addEventListener("keyup", (event) => {
  if (socket) {
    if (event.code in keys) {
      keys[event.code] = false;
      socket.talk(JSON.stringify({ type: "keys", data: { keys } }));
    }
  }
});

window.addEventListener("resize", initCanvas);

canvas.addEventListener("mousemove", (event) => {
  if (socket) {
    socket.talk(JSON.stringify({ type: "mousemove", data: { x: event.clientX - canvas.width / 2, y: event.clientY - canvas.height / 2 } }));
  }
});


window.onload = function () {
  canvas.style.display = "none";
  updateInputPosition();
};