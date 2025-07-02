import { Paddle } from "../types";
import { ctx } from "../state";

export function drawPaddle(paddle: Paddle, color = "black"): void {
  ctx.fillStyle = color;
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}
