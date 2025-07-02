import { paddle1, paddle2, gamePaused } from "./state";

export function initKeyboardControls(): void {
  window.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowUp":
        paddle1.move = "up";
        break;
      case "ArrowDown":
        paddle1.move = "down";
        break;
      case "w":
        paddle2.move = "up";
        break;
      case "s":
        paddle2.move = "down";
        break;
      case "Escape":
        gamePaused.value = !gamePaused.value;
        break;
    }
  });
}
