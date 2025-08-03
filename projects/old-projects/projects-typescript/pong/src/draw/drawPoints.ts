import { Points } from "../types";
import { drawText } from "./drawText";
import { ctx } from "../state";

export function drawPoints(points: Points): void {
  drawText(
    points.p1Score.toString(),
    ctx,
    "black",
    "30px",
    "Arial",
    points.p1ScoreCords.x,
    points.p1ScoreCords.y,
  );
  drawText(
    points.p2Score.toString(),
    ctx,
    "black",
    "30px",
    "Arial",
    points.p2ScoreCords.x,
    points.p2ScoreCords.y,
  );
}
