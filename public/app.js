const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let socket;
let players = new Map();
let bots = new Map();

var playButton = document.getElementById("playButton").addEventListener("click", function() {
  startGame();
});
var loadingText = document.getElementById("loadingScreen").style.display = "none"

let myId;
let me;

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

function getMyEntity() {
  if (players.has(myId)) return players.get(myId);
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
function drawDecoration() {
  drawShape(100, 100, 50, 0, 7, "#FF0000");
  drawShape(200, 200, 80, 0, 5, "#00FF00");
  drawShape(300, 300, 120, 0, 9, "#0000FF");
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
function drawBumbleBee() {
  ctx.beginPath();
  ctx.fillStyle = "#FFD700";
  ctx.arc(400, 300, 100, 0, 2 * Math.PI); // head
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = "#000000";
  ctx.arc(350, 270, 30, 0, 2 * Math.PI); // left eye
  ctx.arc(450, 270, 30, 0, 2 * Math.PI); // right eye
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = "#000000";
  ctx.moveTo(400, 330); // mouth
  ctx.quadraticCurveTo(390, 350, 400, 360);
  ctx.quadraticCurveTo(410, 350, 400, 330);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = "#FFD700";
  ctx.moveTo(370, 330); // left wing
  ctx.quadraticCurveTo(340, 260, 300, 240);
  ctx.quadraticCurveTo(310, 330, 370, 330);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = "#FFD700";
  ctx.moveTo(430, 330); // right wing
  ctx.quadraticCurveTo(460, 260, 500, 240);
  ctx.quadraticCurveTo(490, 330, 430, 330);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = "#000000";
  ctx.moveTo(400, 400); // body
  ctx.lineTo(400, 500);
  ctx.lineTo(300, 550);
  ctx.lineTo(400, 600);
  ctx.lineTo(500, 550);
  ctx.lineTo(400, 500);
  ctx.fill();
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

// Custom code added to draw a green tridecagon


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
      case "init":
        myId = data.id;
        break;

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

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function toggleStartScreen() {
  document.getElementById("startMenu").style.display = "none";
  var loadingText = document.getElementById("loadingScreen").style.display = "block";
  wait(0.5);
  var loadingText = document.getElementById("loadingScreen").style.display = "none";
  canvas.style.display = "block";
}

function render() {
  me = getMyEntity();
  clearCanvas();
  ctx.save();
  drawGrid(me.x, me.y, 32);
  ctx.translate(-me.x + canvas.width / 2, -me.y + (canvas.height / 2));
  drawBots();
  drawPlayers();
  // Call the function to draw the character
  // Render other game objects here
  ctx.restore();
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
  socket.talk(JSON.stringify({ type: "mousemove", data: { x: event.clientX - canvas.width / 2, y: event.clientY - canvas.height / 2 } }));
});

let isFiring = false;

window.addEventListener("keydown", event => {
  if (event.code === "Space") {
    isFiring = true;
    fireBullet();
  }
});

window.addEventListener("keyup", event => {
  if (event.code === "Space") {
    isFiring = false;
  }
});

function fireBullet() {
  if (isFiring) {
    createBullet()
    setTimeout(fireBullet, 100); // Adjust the delay between bullets as needed
  }
}

function createBullet(x, y, angle) {
  const bullet = {
    x: x,
    y: y,
    radius: 5,
    speed: 10,
    angle: angle,
    update() {
      this.x += this.speed * Math.cos(this.angle);
      this.y += this.speed * Math.sin(this.angle);
    },
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#FF0000";
      ctx.fill();
      ctx.closePath();
    }
  };

  return bullet;
}

window.onload = function() {
  canvas.style.display = "none";
};
