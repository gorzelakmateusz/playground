// maze-solver.ts

// --- Maze Structure ---

/**
 * Represents a single cell in the maze.
 */
interface Cell {
  x: number;
  y: number;
  visited: boolean;
  walls: {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
  };
}

/**
 * Type defining a maze as a 2D array of cells.
 */
type Maze = Cell[][];

/**
 * Represents a point (coordinates) within the maze.
 */
interface Point {
  x: number;
  y: number;
}

// --- Maze Generation Class (DFS Algorithm) ---

/**
 * Class responsible for generating a maze using the Depth-First Search (DFS) algorithm.
 */
class MazeGenerator {
  private width: number;
  private height: number;
  private maze: Maze;

  constructor(width: number, height: number) {
    if (width <= 0 || height <= 0) {
      throw new Error("Maze dimensions must be positive.");
    }
    this.width = width;
    this.height = height;
    this.maze = this.initializeMaze();
  }

  /**
   * Initializes the maze by creating a grid of cells with all walls intact.
   * @returns The initialized maze.
   */
  private initializeMaze(): Maze {
    const maze: Maze = [];
    for (let y = 0; y < this.height; y++) {
      maze[y] = [];
      for (let x = 0; x < this.width; x++) {
        maze[y][x] = {
          x,
          y,
          visited: false,
          walls: {
            top: true,
            bottom: true,
            left: true,
            right: true,
          },
        };
      }
    }
    return maze;
  }

  /**
   * Generates the maze using the DFS algorithm.
   * It starts from a random cell, explores unvisited neighbors, and knocks down walls
   * to create paths. It uses a stack to backtrack when a dead end is reached.
   * @returns The generated maze.
   */
  public generate(): Maze {
    const stack: Cell[] = [];
    const startCell = this.maze[0][0]; // Start from the top-left corner
    startCell.visited = true;
    stack.push(startCell);

    while (stack.length > 0) {
      const currentCell = stack.pop()!;
      const neighbors = this.getUnvisitedNeighbors(currentCell);

      if (neighbors.length > 0) {
        stack.push(currentCell); // Push current cell back to stack to explore other paths later
        const randomNeighbor =
          neighbors[Math.floor(Math.random() * neighbors.length)];

        this.removeWall(currentCell, randomNeighbor);
        randomNeighbor.visited = true;
        stack.push(randomNeighbor);
      }
    }
    return this.maze;
  }

  /**
   * Retrieves a list of unvisited neighbors for a given cell.
   * Neighbors are cells directly adjacent (up, down, left, right).
   * @param cell The cell for which to find neighbors.
   * @returns An array of unvisited neighbor cells.
   */
  private getUnvisitedNeighbors(cell: Cell): Cell[] {
    const neighbors: Cell[] = [];
    const { x, y } = cell;

    // Check top neighbor
    if (y > 0 && !this.maze[y - 1][x].visited)
      neighbors.push(this.maze[y - 1][x]);
    // Check bottom neighbor
    if (y < this.height - 1 && !this.maze[y + 1][x].visited)
      neighbors.push(this.maze[y + 1][x]);
    // Check left neighbor
    if (x > 0 && !this.maze[y][x - 1].visited)
      neighbors.push(this.maze[y][x - 1]);
    // Check right neighbor
    if (x < this.width - 1 && !this.maze[y][x + 1].visited)
      neighbors.push(this.maze[y][x + 1]);

    return neighbors;
  }

  /**
   * Removes the wall between two adjacent cells.
   * This creates a path connecting the two cells.
   * @param cell1 The first cell.
   * @param cell2 The second cell.
   */
  private removeWall(cell1: Cell, cell2: Cell): void {
    const dx = cell1.x - cell2.x;
    const dy = cell1.y - cell2.y;

    if (dx === 1) {
      // cell1 is to the right of cell2
      cell1.walls.left = false;
      cell2.walls.right = false;
    } else if (dx === -1) {
      // cell1 is to the left of cell2
      cell1.walls.right = false;
      cell2.walls.left = false;
    }

    if (dy === 1) {
      // cell1 is below cell2
      cell1.walls.top = false;
      cell2.walls.bottom = false;
    } else if (dy === -1) {
      // cell1 is above cell2
      cell1.walls.bottom = false;
      cell2.walls.top = false;
    }
  }

  /**
   * Returns the current state of the generated maze.
   * @returns The current maze.
   */
  public getMaze(): Maze {
    return this.maze;
  }
}

// --- Maze Exit Management Class ---

/**
 * Class responsible for managing exits in a maze (adding, removing, counting).
 */
class MazeExitManager {
  private maze: Maze;
  private width: number;
  private height: number;

  constructor(maze: Maze) {
    this.maze = maze;
    this.height = maze.length;
    this.width = maze[0].length;
  }

  /**
   * Calculates the maximum possible number of exits from the maze.
   * Any cell on the maze boundary with an open wall leading outwards can be an exit.
   * @returns The maximum number of possible exits.
   */
  public calculateMaxPossibleExits(): number {
    let exits = 0;
    // Top boundary
    for (let x = 0; x < this.width; x++) {
      if (!this.maze[0][x].walls.top) {
        exits++;
      }
    }
    // Bottom boundary
    for (let x = 0; x < this.width; x++) {
      if (!this.maze[this.height - 1][x].walls.bottom) {
        exits++;
      }
    }
    // Left boundary (excluding corners to avoid double-counting)
    for (let y = 1; y < this.height - 1; y++) {
      if (!this.maze[y][0].walls.left) {
        exits++;
      }
    }
    // Right boundary (excluding corners)
    for (let y = 1; y < this.height - 1; y++) {
      if (!this.maze[y][this.width - 1].walls.right) {
        exits++;
      }
    }
    return exits;
  }

  /**
   * Creates a copy of the maze and adds exactly one random exit to it.
   * All existing exits are removed first to ensure only one new exit is present.
   * @returns The maze with a single exit.
   */
  public createMazeWithOneExit(): Maze {
    const newMaze = this.deepCopyMaze(this.maze); // Deep copy of the maze

    // First, remove all existing exits to start with a clean slate
    this.removeAllExits(newMaze);

    // Choose a random edge (0: top, 1: bottom, 2: left, 3: right)
    const edge = Math.floor(Math.random() * 4);
    let exitX: number, exitY: number;

    switch (edge) {
      case 0: // Top
        exitX = Math.floor(Math.random() * this.width);
        exitY = 0;
        newMaze[exitY][exitX].walls.top = false;
        break;
      case 1: // Bottom
        exitX = Math.floor(Math.random() * this.width);
        exitY = this.height - 1;
        newMaze[exitY][exitX].walls.bottom = false;
        break;
      case 2: // Left
        exitX = 0;
        exitY = Math.floor(Math.random() * this.height);
        newMaze[exitY][exitX].walls.left = false;
        break;
      case 3: // Right
        exitX = this.width - 1;
        exitY = Math.floor(Math.random() * this.height);
        newMaze[exitY][exitX].walls.right = false;
        break;
    }
    return newMaze;
  }

  /**
   * Creates a copy of the maze and adds a specified number of random exits to it.
   * All existing exits are removed first.
   * @param numberOfExits The number of exits to add.
   * @returns The maze with multiple exits.
   */
  public createMazeWithMultipleExits(numberOfExits: number): Maze {
    if (numberOfExits < 0) {
      console.warn("Number of exits cannot be negative. Setting to 0.");
      numberOfExits = 0;
    }

    const newMaze = this.deepCopyMaze(this.maze); // Deep copy of the maze
    this.removeAllExits(newMaze); // Remove existing exits

    const potentialExits: Point[] = [];
    // Add all boundary cells as potential exit points
    for (let x = 0; x < this.width; x++) {
      potentialExits.push({ x, y: 0 }); // Top
      potentialExits.push({ x, y: this.height - 1 }); // Bottom
    }
    for (let y = 1; y < this.height - 1; y++) {
      potentialExits.push({ x: 0, y }); // Left
      potentialExits.push({ x: this.width - 1, y }); // Right
    }

    // Select random unique points on the boundary
    const chosenExits: Point[] = [];
    while (chosenExits.length < numberOfExits && potentialExits.length > 0) {
      const randomIndex = Math.floor(Math.random() * potentialExits.length);
      const exitPoint = potentialExits.splice(randomIndex, 1)[0]; // Remove and get element
      chosenExits.push(exitPoint);
    }

    chosenExits.forEach((exitPoint) => {
      const cell = newMaze[exitPoint.y][exitPoint.x];
      // Open the appropriate wall based on the exit point's boundary position
      if (exitPoint.y === 0) cell.walls.top = false;
      else if (exitPoint.y === this.height - 1) cell.walls.bottom = false;
      else if (exitPoint.x === 0) cell.walls.left = false;
      else if (exitPoint.x === this.width - 1) cell.walls.right = false;
    });

    return newMaze;
  }

  /**
   * Removes all exits from the maze by closing walls on its boundaries.
   * @param maze The maze from which exits should be removed.
   */
  private removeAllExits(maze: Maze): void {
    for (let x = 0; x < this.width; x++) {
      maze[0][x].walls.top = true;
      maze[this.height - 1][x].walls.bottom = true;
    }
    for (let y = 0; y < this.height; y++) {
      maze[y][0].walls.left = true;
      maze[y][this.width - 1].walls.right = true;
    }
  }

  /**
   * Creates a deep copy of a given maze.
   * This is necessary to modify mazes independently without affecting original structures.
   * @param maze The original maze to copy.
   * @returns A deep copy of the maze.
   */
  private deepCopyMaze(maze: Maze): Maze {
    return JSON.parse(JSON.stringify(maze));
  }

  /**
   * Returns the current state of the maze managed by the exit manager.
   * @returns The current maze.
   */
  public getMaze(): Maze {
    return this.maze;
  }
}

// --- Maze Solving Class (BFS Algorithm) ---

/**
 * Class responsible for finding the shortest path in a maze using the Breadth-First Search (BFS) algorithm.
 */
class MazeSolver {
  private maze: Maze;
  private width: number;
  private height: number;

  constructor(maze: Maze) {
    this.maze = maze;
    this.height = maze.length;
    this.width = maze[0].length;
  }

  /**
   * Finds the shortest path between two points in the maze using the BFS algorithm.
   * BFS guarantees the shortest path in an unweighted graph like a maze.
   * @param start The starting point.
   * @param end The destination point.
   * @returns An array of points representing the shortest path, or null if no path exists.
   */
  public findShortestPath(start: Point, end: Point): Point[] | null {
    if (
      start.x < 0 ||
      start.x >= this.width ||
      start.y < 0 ||
      start.y >= this.height ||
      end.x < 0 ||
      end.x >= this.width ||
      end.y < 0 ||
      end.y >= this.height
    ) {
      console.error("Start or end point is out of maze bounds.");
      return null;
    }

    const queue: { point: Point; path: Point[] }[] = [];
    // 'visited' array to keep track of visited cells and prevent infinite loops/reprocessing
    const visited: boolean[][] = Array.from({ length: this.height }, () =>
      Array(this.width).fill(false),
    );

    queue.push({ point: start, path: [start] });
    visited[start.y][start.x] = true;

    while (queue.length > 0) {
      const { point: current, path } = queue.shift()!;

      if (current.x === end.x && current.y === end.y) {
        return path; // Destination reached
      }

      const neighbors = this.getPassableNeighbors(current);
      for (const neighbor of neighbors) {
        if (!visited[neighbor.y][neighbor.x]) {
          visited[neighbor.y][neighbor.x] = true;
          queue.push({ point: neighbor, path: [...path, neighbor] });
        }
      }
    }
    return null; // No path found
  }

  /**
   * Retrieves a list of neighbors that can be moved to from a given cell (i.e., no wall exists between them).
   * @param cell The point (coordinates) of the current cell.
   * @returns An array of points that are passable neighbors.
   */
  private getPassableNeighbors(cell: Point): Point[] {
    const neighbors: Point[] = [];
    const { x, y } = cell;
    const currentCell = this.maze[y][x];

    // Check top
    if (y > 0 && !currentCell.walls.top) {
      neighbors.push({ x, y: y - 1 });
    }
    // Check bottom
    if (y < this.height - 1 && !currentCell.walls.bottom) {
      neighbors.push({ x, y: y + 1 });
    }
    // Check left
    if (x > 0 && !currentCell.walls.left) {
      neighbors.push({ x: x - 1, y });
    }
    // Check right
    if (x < this.width - 1 && !currentCell.walls.right) {
      neighbors.push({ x: x + 1, y });
    }

    return neighbors;
  }

  /**
   * Finds all existing exits in the maze (cells on the boundary with open walls).
   * Useful when you need to find a path to "any" exit.
   * @returns An array of points representing the exits.
   */
  public findAllExits(): Point[] {
    const exits: Point[] = [];
    // Top boundary
    for (let x = 0; x < this.width; x++) {
      if (!this.maze[0][x].walls.top) {
        exits.push({ x, y: 0 });
      }
    }
    // Bottom boundary
    for (let x = 0; x < this.width; x++) {
      if (!this.maze[this.height - 1][x].walls.bottom) {
        exits.push({ x, y: this.height - 1 });
      }
    }
    // Left boundary (excluding corners)
    for (let y = 1; y < this.height - 1; y++) {
      if (!this.maze[y][0].walls.left) {
        exits.push({ x: 0, y });
      }
    }
    // Right boundary (excluding corners)
    for (let y = 1; y < this.height - 1; y++) {
      if (!this.maze[y][this.width - 1].walls.right) {
        exits.push({ x: this.width - 1, y });
      }
    }
    return exits;
  }
}

// --- Utility function for Maze Visualization ---

/**
 * Helper function to print the maze to the console.
 * It can optionally highlight a path within the maze using asterisks.
 * @param maze The maze to print.
 * @param path An optional array of points representing a path to highlight.
 */
function printMaze(maze: Maze, path: Point[] = []): void {
  const height = maze.length;
  const width = maze[0].length;

  // Create a Set for quick path lookup
  const pathSet = new Set<string>();
  path.forEach((p) => pathSet.add(`${p.x},${p.y}`));

  // Top border
  let topBorder = "┌";
  for (let x = 0; x < width; x++) {
    topBorder += "───";
    if (x < width - 1) topBorder += "┬";
  }
  topBorder += "┐";
  console.log(topBorder);

  for (let y = 0; y < height; y++) {
    let row1 = "│"; // Vertical walls and cell content
    let row2 = "├"; // Horizontal walls (bottom)

    for (let x = 0; x < width; x++) {
      const cell = maze[y][x];
      const isPath = pathSet.has(`${x},${y}`);

      // Cell content
      row1 += isPath ? " * " : "   ";

      // Right wall
      if (cell.walls.right) {
        row1 += "│";
      } else {
        row1 += " ";
      }

      // Bottom wall for row2
      if (cell.walls.bottom) {
        row2 += "───";
      } else {
        row2 += "   ";
      }

      // Separator for bottom walls (connecting horizontal lines)
      if (x < width - 1) {
        // If both current cell and right cell have bottom walls
        if (cell.walls.bottom && maze[y][x + 1].walls.bottom) {
          row2 += "┼";
        }
        // If only current cell has bottom wall (or right cell has top wall removed)
        else if (cell.walls.bottom) {
          row2 += "┴";
        }
        // If only right cell has bottom wall (or current cell has top wall removed)
        else if (maze[y][x + 1].walls.bottom) {
          row2 += "┬";
        }
        // No bottom walls between them
        else {
          row2 += " ";
        }
      }
    }
    console.log(row1);
    if (y < height - 1) {
      console.log(row2 + "┤");
    }
  }
  // Bottom border
  let bottomBorder = "└";
  for (let x = 0; x < width; x++) {
    bottomBorder += "───";
    if (x < width - 1) bottomBorder += "┴";
  }
  bottomBorder += "┘";
  console.log(bottomBorder);
}

// --- USAGE EXAMPLE ---

const mazeWidth = 15;
const mazeHeight = 10;

console.log("--- Generating a basic maze ---");
const generator = new MazeGenerator(mazeWidth, mazeHeight);
const generatedMaze = generator.generate();
printMaze(generatedMaze);

const exitManager = new MazeExitManager(generatedMaze);

console.log("\n--- Maze with one exit ---");
const mazeWithOneExit = exitManager.createMazeWithOneExit();
printMaze(mazeWithOneExit);

console.log(
  "\nMaximum possible exits:",
  exitManager.calculateMaxPossibleExits(),
);

console.log("\n--- Maze with multiple exits (e.g., 3) ---");
const mazeWithMultipleExits = exitManager.createMazeWithMultipleExits(3);
printMaze(mazeWithMultipleExits);

console.log("\n--- Finding the shortest path ---");
const solver = new MazeSolver(mazeWithOneExit); // Use the maze with one exit for this example

const startPoint: Point = { x: 0, y: 0 }; // Start point (top-left corner)
const exits = solver.findAllExits();
let endPoint: Point | null = null;

if (exits.length > 0) {
  endPoint = exits[0]; // Take the first found exit as the destination point
  console.log(`Start point: (${startPoint.x}, ${startPoint.y})`);
  console.log(`End point (exit): (${endPoint.x}, ${endPoint.y})`);

  const shortestPath = solver.findShortestPath(startPoint, endPoint);

  if (shortestPath) {
    console.log("\nShortest path found (marked with asterisks):");
    printMaze(mazeWithOneExit, shortestPath);
    console.log("Path length:", shortestPath.length - 1, "steps"); // -1 because length includes start point
  } else {
    console.log("No path found between the selected points.");
  }
} else {
  console.log("No exits found in the maze, cannot find a path.");
}
