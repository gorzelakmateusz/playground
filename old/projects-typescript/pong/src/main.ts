import { initKeyboardControls } from "./input";
import { updateAndDrawState } from "./game";

const stateUpdateInterval = 20;

initKeyboardControls();
setInterval(updateAndDrawState, stateUpdateInterval);
