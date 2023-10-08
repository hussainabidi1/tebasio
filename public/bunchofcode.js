for (let i = 0; i < 10; i++) {
  composers.set(i, {
    x: canvas.width / 2 * i,
    y: canvas.height / 2 * i
  });
}

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

let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 90,
  color: "#9e6900",
  speed: 5,
};
let composer = {
  x: canvas.width / 6,
  y: canvas.height / 6,
  radius: 70,
  color: "#871800",
  speed: 3.5
};

socket.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  if (players.get(message.id) !== message.message) {
    players.set(message.id, message.message);
  }
});

function move() {
  if (keys.ArrowUp || keys.KeyW) {
    player.y -= player.speed;
  }
  if (keys.ArrowDown || keys.KeyS) {
    player.y += player.speed;
  }
  if (keys.ArrowLeft || keys.KeyA) {
    player.x -= player.speed;
  }
  if (keys.ArrowRight || keys.KeyD) {
    player.x += player.speed;
  }

  if (socket.readyState) {
    socket.send(JSON.stringify({ x: player.x, y: player.y }));
  }
}

function composersRender() {
  for (let i of composers) {
    let pos = i;
    drawShape(pos.x, pos.y, composer.radius, 12, composer.color);
  }
}
const composers = document.getElementById("composers");
