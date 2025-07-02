export interface Ball {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  move: "up" | "down" | "no";
}

export interface Points {
  p1Score: number;
  p2Score: number;
  p1ScoreCords: { x: number; y: number };
  p2ScoreCords: { x: number; y: number };
}
