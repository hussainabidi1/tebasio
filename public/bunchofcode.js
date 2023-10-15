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