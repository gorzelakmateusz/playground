import { clearCanvas } from "../utils";
import { drawPaddle } from "./drawPaddle";
import { drawBall } from "./drawBall";
import { drawPoints } from "./drawPoints";
import { paddle1, paddle2, ball, points, ctx, canvas } from "../state";
import { drawText } from "./drawText";

export function drawState(): void {
  clearCanvas();
  drawPaddle(paddle1);
  drawPaddle(paddle2);
  drawBall(ball);
  drawPoints(points);
}

export function drawPauseScreen(): void {
  drawState();
  drawText(
    "Paused",
    ctx,
    "red",
    "40px",
    "Arial",
    canvas.width / 2 - 50,
    canvas.height / 2,
  );
}
