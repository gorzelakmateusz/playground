import { Ball, Paddle, Points } from "./types";

export const canvas = document.getElementById("canvas") as HTMLCanvasElement;
export const ctx = canvas.getContext("2d")!;

export const gamePaused = { value: false };

export const points: Points = {
  p1Score: 0,
  p2Score: 0,
  p1ScoreCords: { x: canvas.width / 3, y: canvas.height / 10 },
  p2ScoreCords: { x: (canvas.width / 3) * 2, y: canvas.height / 10 },
};

const paddleConfig = {
  width: 20,
  height: 100,
  margin: 10,
};

export const paddle1: Paddle = {
  x: paddleConfig.margin,
  y: (canvas.height - paddleConfig.height) / 2,
  width: paddleConfig.width,
  height: paddleConfig.height,
  move: "no",
};

export const paddle2: Paddle = {
  x: canvas.width - paddleConfig.width - paddleConfig.margin,
  y: (canvas.height - paddleConfig.height) / 2,
  width: paddleConfig.width,
  height: paddleConfig.height,
  move: "no",
};

export const ball: Ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 20,
  speedX: 6,
  speedY: 6,
};

export function movePaddle(paddle: Paddle): void {
  const speed = 5;
  if (paddle.move === "up" && paddle.y - speed > 0) {
    paddle.y -= speed;
  } else if (
    paddle.move === "down" &&
    paddle.y + speed < canvas.height - paddle.height
  ) {
    paddle.y += speed;
  }
}
