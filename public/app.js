const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let socket;
let players = new Map();
let bots = new Map();

const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  KeyW: false,
  KeyA: false,
  KeyS: false,
  KeyD: false,
};
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
}

function drawPlayers() {
  players.forEach(function(val, key) {
    const { x, y, r, angle, sides, color, name } = val;
    drawShape(x, y, r, angle, sides, color);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#000000";
    if (name) {
      ctx.fillText(name, x - (r / 2), y, r * 2);
    }
  });
}

function drawBots() {
  bots.forEach(function(val, key) {
    const { x, y, r, angle, sides, color } = val;
    drawShape(x, y, r, angle, sides, color);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.stroke();
  });
}

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 100;

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
  ctx.strokeStyle = "#493c4e";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function initCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
const initSocket = () => {
  let socket = new WebSocket("wss://tebasio-at.ianwilliams10.repl.co");
  socket.open = false;
  socket.onopen = function socketOpen() {
    socket.open = true;
    const username = document.getElementById("usernameInput").value;
    socket.send(JSON.stringify({ type: "name", data: { name: username } }))
  };
  socket.talk = async (...message) => {
    if (!socket.open) return 1;
    socket.send(message);
  };
  socket.onmessage = async function socketMessage(message) {
    const parsed = JSON.parse(message.data);
    const data = parsed.data;
    switch (parsed.type) {
      case "pos":
        if (players.get(data.id)) {
          const entity = players.get(data.id);
          entity.x = data.x;
          entity.y = data.y;
          entity.angle = data.angle;
        }
        break;

      case "playerConnected":
        var { x, y, r, color, sides, angle } = data;
        players.set(data.id, { x: x, y: y, r: r, angle: angle, color: color, sides: sides });
        break;

      case "playerDisconnected":
        players.delete(data.id);
        break;

      case "bots":
        var { x, y, r, color, sides, angle } = data;
        bots.set(data.id, { x: x, y: y, r: r, angle: angle, color: color, sides: sides });
        break;

      case "name":
        players.get(data.id).name = data.name;
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

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function toggleStartScreen() {
  document.getElementById("startMenu").style.display = "none";
  canvas.style.display = "block";
}

function render() {
  clearCanvas();
  drawGrid(0, 0, 32);
  drawBots();
  drawPlayers();
  // Render other game objects here
}

function gameLoop() {
  if (socket.open) {
    render();
  }

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
    if (event.code in keys) {
      keys[event.code] = true;
      socket.talk(JSON.stringify({ type: "move", data: { keys } }));
    }
  }
});

window.addEventListener("keyup", (event) => {
  if (socket) {
    if (event.code in keys) {
      keys[event.code] = false;
      socket.talk(JSON.stringify({ type: "move", data: { keys } }));
    }
  }
});

window.addEventListener("resize", initCanvas);
canvas.addEventListener("mousemove", (event) => {
  socket.talk(JSON.stringify({ type: "mousemove", data: { x: event.clientX, y: event.clientY } }));
});

window.onload = function() {
  canvas.style.display = "none";
};