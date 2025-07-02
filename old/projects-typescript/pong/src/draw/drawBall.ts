import { Ball } from "../types";
import { ctx } from "../state";

export function drawBall(ball: Ball, color = "black"): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.fill();
}
