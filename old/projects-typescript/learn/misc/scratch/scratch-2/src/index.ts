console.log("test");

enum Direction {
  UP = "UP",
  DOWN = "DOWN",
  LEFT = "LEFT",
  RIGHT = "RIGHT",
}

function printDirection(direction: Direction) {
  console.log(direction);
}
console.log(Direction.UP);
console.log(Direction.DOWN);
console.log(Direction.LEFT);
console.log(Direction.RIGHT);

type test = string | number;

const a: test = "hello";
const b: test = 123;
