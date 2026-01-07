/*\
|*| Conway's Game of Life implemented in TypeScript
|*| using just <div>s
|*| written by Hazel Atkinson // Yellowsink 2022
|*| for uwu.network
|*|
|*| Pls credit if you use thanks!!!
|*| hi xirreal here i made some small changes but this is basically the same as before, please credit Hazel not me
\*/

// CONSTANTS
const CONTAINER_ID = "gol",
	ROW_CLASS = "gol-row",
	CELL_CLASS = "gol-cell",
	ACTIVE_CLASS = "gol-on",
	SIMPLE_CLASS = "gol-simple",
	SIMPLE_B_ID = "gol-fade",
	RAND_B_ID = "gol-rand",
	PAUSE_B_ID = "gol-stop",
	CLEAR_B_ID = "gol-clear",
	RAND_THRES = 0.8;

class Grid2D {
	store: boolean[][] = [];
	width: number;
	height: number;
	container?: HTMLElement;

	constructor(width: number, height: number, container?: HTMLElement) {
		this.width = width;
		this.height = height;
		this.container = container;

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
			for (let x = 0; x < this.store[y].length; x++) this.store[y][x] = Math.random() > RAND_THRES;
	}

	copyFrom(grid: Grid2D) {
		// lol
		this.store = grid.store;
	}

	/** creates all cell divs in the container */
	createCells() {
		if (!this.container) return;
		this.container.innerHTML = "";

		for (let y = 0; y < this.height; y++) {
			const rowElem = document.createElement("div");
			this.container.appendChild(rowElem);
			rowElem.className = ROW_CLASS;

			for (let x = 0; x < this.width; x++) {
				const cell = document.createElement("div");
				rowElem.appendChild(cell);
				cell.className = CELL_CLASS;

				cell.onclick = () => {
					this.set(x, y, !this.at(x, y));
					this.render();
				};
			}
		}
	}

	/** Writes the game state to the divs */
	render() {
		if (!this.container) return;

		for (let y = 0; y < this.container.childElementCount; y++) {
			const row = this.container.children[y];

			for (let x = 0; x < row.childElementCount; x++) row.children[x].classList.toggle(ACTIVE_CLASS, this.at(x, y));
		}
	}

	survives(x: number, y: number) {
		let liveNeighbors = 0;

		if (this.at(x - 1, y - 1)) liveNeighbors++;
		if (this.at(x, y - 1)) liveNeighbors++;
		if (this.at(x + 1, y - 1)) liveNeighbors++;
		if (this.at(x - 1, y)) liveNeighbors++;
		if (this.at(x + 1, y)) liveNeighbors++;
		if (this.at(x - 1, y + 1)) liveNeighbors++;
		if (this.at(x, y + 1)) liveNeighbors++;
		if (this.at(x + 1, y + 1)) liveNeighbors++;

		return liveNeighbors === 3 || (liveNeighbors === 2 && this.at(x, y));
	}

	tick() {
		const newGrid = new Grid2D(this.width, this.height);

		for (let y = 0; y < this.height; y++)
			for (let x = 0; x < this.width; x++) {
				newGrid.set(x, y, this.survives(x, y));
			}

		this.copyFrom(newGrid);
	}
}

// these heights are only used to generate cell counts nothing more
export default (cellWidth: number, cellHeight: number) => {
	const container = document.createElement("div");
	container.id = CONTAINER_ID;
	const canvas = document.getElementById(CONTAINER_ID)!;

	canvas.parentNode?.replaceChild(container, canvas);

	const grid = new Grid2D(0, 0, container);

	function makeGrid() {
		const gridWidth = Math.floor(window.innerWidth / cellWidth);
		const gridHeight = Math.floor(window.innerHeight / cellHeight);

		grid.resize(gridWidth, gridHeight);
		grid.createCells();
		grid.render();
	}

	window.addEventListener("resize", makeGrid);
	makeGrid();
	grid.randomize();
	grid.render();

	let tickingPaused = false;

	setInterval(() => {
		if (tickingPaused) return;
		grid.tick();
		grid.render();
	}, 100);

	document.getElementById(SIMPLE_B_ID)!.onclick = () => container.classList.toggle(SIMPLE_CLASS);

	document.getElementById(RAND_B_ID)!.onclick = () => {
		grid.randomize();
		grid.render();
	};

	const pauseButton = document.getElementById(PAUSE_B_ID)!;
	pauseButton.onclick = () => {
		tickingPaused = !tickingPaused;
		pauseButton.innerText = pauseButton.innerText === "play" ? "pause" : "play";
	};

	document.getElementById(CLEAR_B_ID)!.onclick = () => {
		grid.resize(0, 0);
		makeGrid();
	};
};
