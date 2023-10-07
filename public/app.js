const canvas = document.getElementById("canvas");

const ctx = canvas.getContext("2d");
let socket, mouseX, mouseY;
let players = new Map();

const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  KeyW: false,
  KeyA: false,
  KeyS: false,
  KeyD: false
};

function drawShape(x, y, r, angle, sides, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const vertexAngle = angle + (i * (Math.PI * 2) / sides);
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
    drawShape(val.x, val.y, val.r, val.angle, 7, val.color);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.stroke();
  })
}
//Enemies












const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 100;
const sides = 8; // A stop sign has 8 sides

function drawStopSign() {
  ctx.beginPath();
  ctx.moveTo(centerX + radius * Math.cos(0), centerY + radius * Math.sin(0));
  for (let i = 1; i <= sides; i++) {
    const angle = (i * 2 * Math.PI) / sides;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    ctx.lineTo(x, y);
  }

  ctx.closePath();

  // Fill the stop sign with red color
  ctx.fillStyle = "#FF0000";
  ctx.fill();

  // Draw a white border
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 5;
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
          players.get(data.id).x = data.x;
          players.get(data.id).y = data.y;
          players.get(data.id).angle = data.angle;
        }
        break;

      case "playerConnected":
        const { x, y, r, color, sides, angle } = data;
        players.set(data.id, { x: x, y: y, r: r, angle: angle, color: color, sides: sides });
        break;

      case "playerDisconnected":
        players.delete(data.id);
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

function update() {
  // WHY
}

function render() {
  clearCanvas();
  drawPlayers();
  drawStopSign();

  // Render other game objects here
}

function gameLoop() {
  if (socket.open) {
    update();
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

window.addEventListener("keydown", event => {
  if (event.code in keys) {
    keys[event.code] = true;
    socket.talk(JSON.stringify({ type: "move", data: { keys } }));
  }
});

window.addEventListener("keyup", event => {
  if (event.code in keys) {
    keys[event.code] = false;
    socket.talk(JSON.stringify({ type: "move", data: { keys } }));
  }
});

window.addEventListener("resize", initCanvas);

canvas.addEventListener('mousemove', (event) => {
  socket.talk(JSON.stringify({ type: "mousemove", data: { x: event.clientX, y: event.clientY } }));
});

window.onload = function() {
  canvas.style.display = "none";
}