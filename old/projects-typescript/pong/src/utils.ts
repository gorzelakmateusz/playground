import { ctx, canvas } from "./state";

export function clearCanvas(): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
