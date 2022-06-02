/*\
|*| Conway's Game of Life implemented in TypeScript
|*| using just <div>s
|*| written by Cain Atkinson // Yellowsink 2022
|*| for uwu.network
|*|
|*| Pls credit if you use thanks!!!
\*/

// CONSTANTS
const CONTAINER_ID = "gol",
  ROW_CLASS = "gol-row",
  CELL_CLASS = "gol-cell",
  ACTIVE_CLASS = "gol-on",
  RAND_THRES = 0.8;

const container = document.getElementById(CONTAINER_ID);

class Grid2D {
  store: boolean[][] = [];
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.resize(width, height);
  }

  wrapCoords(x: number, y: number) {
    if (x === this.width) x = 0;
    if (y === this.height) y = 0;
    if (x < 0) x = this.width - 1;
    if (y < 0) y = this.height - 1;

    return [x, y];
  }

  at(x: number, y: number) {
    [x, y] = this.wrapCoords(x, y);
    return this.store[y][x];
  }

  set(x: number, y: number, val: boolean) {
    [x, y] = this.wrapCoords(x, y);
    this.store[y][x] = val;
  }

  resize(width: number, height: number) {
    const newGrid: boolean[][] = [];

    for (let y = 0; y < height; y++) {
      const row = new Array(width);
      newGrid[y] = row;

      for (let x = 0; x < width; x++) {
        row[x] = this.store[y]?.[x] ?? false;
      }
    }

    this.store = newGrid;
    this.width = width;
    this.height = height;
  }

  randomize() {
    for (let y = 0; y < this.store.length; y++)
      for (let x = 0; x < this.store[y].length; x++)
        this.store[y][x] = Math.random() > RAND_THRES;
  }

  copyFrom(grid: Grid2D) {
    // lol
    this.store = grid.store;
  }
}

const grid = new Grid2D(0, 0);

/** creates all cell divs in the container */
function createCells() {
  container.innerHTML = "";

  for (let y = 0; y < grid.height; y++) {
    const rowElem = document.createElement("div");
    rowElem.className = ROW_CLASS;
    container.appendChild(rowElem);

    for (let x = 0; x < grid.width; x++) {
      const cell = document.createElement("div");
      cell.className = CELL_CLASS;
      rowElem.appendChild(cell);
    }
  }
}

/** Writes the game state to the divs */
function renderCells() {
  for (let y = 0; y < container.childElementCount; y++) {
    const row = container.children[y];

    for (let x = 0; x < row.childElementCount; x++)
      row.children[x].classList.toggle(ACTIVE_CLASS, grid.at(x, y));
  }
}

function cellSurvives(x: number, y: number) {
  let liveNeighbors = 0;

  if (grid.at(x - 1, y - 1)) liveNeighbors++;
  if (grid.at(x, y - 1)) liveNeighbors++;
  if (grid.at(x + 1, y - 1)) liveNeighbors++;
  if (grid.at(x - 1, y)) liveNeighbors++;
  if (grid.at(x + 1, y)) liveNeighbors++;
  if (grid.at(x - 1, y + 1)) liveNeighbors++;
  if (grid.at(x, y + 1)) liveNeighbors++;
  if (grid.at(x + 1, y + 1)) liveNeighbors++;

  return liveNeighbors === 3 || (liveNeighbors === 2 && grid.at(x, y));
}

function tick() {
  const newGrid = new Grid2D(grid.width, grid.height);

  for (let y = 0; y < grid.height; y++)
    for (let x = 0; x < grid.width; x++) {
      newGrid.set(x, y, cellSurvives(x, y));
    }

  grid.copyFrom(newGrid);
}

// these heights are only used to generate cell counts nothing more
export default (cellWidth: number, cellHeight: number) => {
  function makeGrid() {
    const gridWidth = Math.floor(window.innerWidth / cellWidth);
    const gridHeight = Math.floor(window.innerHeight / cellHeight);

    grid.resize(gridWidth, gridHeight);
    createCells();
    renderCells();
  }

  window.addEventListener("resize", makeGrid);
  makeGrid();
  grid.randomize();
  renderCells();

  setInterval(() => {
    console.time("tick");
    tick();
    console.timeEnd("tick");
    renderCells();
  }, 100);
};
