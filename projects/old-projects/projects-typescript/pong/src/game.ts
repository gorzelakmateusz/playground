import { ball, paddle1, paddle2, points, canvas, gamePaused } from "./state";
import { movePaddle } from "./state";
import { drawState, drawPauseScreen } from "./draw/draw";

export function updateState(): void {
  ball.x += ball.speedX;
  ball.y += ball.speedY;

  if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
    ball.speedY *= -1;
  }

  if (ball.x + ball.radius > canvas.width) {
    points.p1Score += 1;
    resetBall();
  } else if (ball.x - ball.radius < 0) {
    points.p2Score += 1;
    resetBall();
  }

  const ballInPaddle = (p: typeof paddle1) =>
    ball.x > p.x &&
    ball.x < p.x + p.width &&
    ball.y > p.y &&
    ball.y < p.y + p.height;

  if (ballInPaddle(paddle1) || ballInPaddle(paddle2)) {
    ball.speedX *= -1;
  }

  movePaddle(paddle1);
  movePaddle(paddle2);
}

export function resetBall(): void {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.speedX *= -1;
}

export function updateAndDrawState(): void {
  if (!gamePaused.value) {
    updateState();
    drawState();
  } else {
    drawPauseScreen();
  }
}
