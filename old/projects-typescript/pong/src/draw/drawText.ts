export function drawText(
  text: string,
  ctx: CanvasRenderingContext2D,
  color = "black",
  fontSize = "30px",
  fontFamily = "Arial",
  x = 10,
  y = 100,
): void {
  ctx.font = `${fontSize} ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
