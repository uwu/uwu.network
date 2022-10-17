/*\
|*| Simple raytracer
|*| using just <div>s
|*|
|*| written by xirreal || 2022
|*| for uwu.network
|*|
|*| *Based on Cain Atkinson's Game of Life using only divs!!*
\*/

// CONSTANTS
const CONTAINER_ID = "raytracer",
  ROW_CLASS = "raytracer-row",
  CELL_CLASS = "raytracer-cell",
  PAUSE_B_ID = "raytracer-stop",
  GROUND_B_ID = "raytracer-ground",
  DEPTH_B_ID = "raytracer-bitdepth";

const container = document.getElementById(CONTAINER_ID);

let bitDepth = 6;
let colors = 2 ** bitDepth;
let moving = 0.0;

type float = number;

class vec3 {
  x: float;
  y: float;
  z: float;

  constructor(x: float, y: float, z: float) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  sub(v: vec3) {
    return new vec3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  subf(f: float) {
    return new vec3(this.x - f, this.y - f, this.z - f);
  }

  add(v: vec3) {
    return new vec3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  mul(v: vec3) {
    return new vec3(this.x * v.x, this.y * v.y, this.z * v.z);
  }

  mulf(f: float) {
    return new vec3(this.x * f, this.y * f, this.z * f);
  }

  divf(f: float) {
    return new vec3(this.x / f, this.y / f, this.z / f);
  }

  dot(v: vec3) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  reflect(n: vec3) {
    return this.sub(n.mulf(n.dot(this) * 2.0));
  }

  distance(v: vec3) {
    return Math.sqrt(
      Math.pow(this.x - v.x, 2) +
        Math.pow(this.y - v.y, 2) +
        Math.pow(this.z - v.z, 2)
    );
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize() {
    return this.divf(this.length());
  }
}

function mixf(a: float, b: float, t: float) {
  return a * (1.0 - t) + b * t;
}

function smoothstepf(a: float, b: float, x: float) {
  let t = Math.max(0.0, Math.min(1.0, (x - a) / (b - a)));
  return t * t * (3.0 - 2.0 * t);
}

function step(a: float, b: float) {
  return b < a ? 0.0 : 1.0;
}

class Display {
  pixels: float[][] = [];
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.resize(width, height);
  }

  at(x: number, y: number) {
    return this.pixels[y][x];
  }

  set(x: number, y: number, val: float) {
    this.pixels[y][x] = val;
  }

  resize(width: number, height: number) {
    const newGrid: float[][] = [];

    for (let y = 0; y < height; y++) {
      const row = new Array(width);
      newGrid[y] = row;

      for (let x = 0; x < width; x++) {
        row[x] = this.pixels[y]?.[x] ?? 0.0;
      }
    }

    this.pixels = newGrid;
    this.width = width;
    this.height = height;
  }

  copyFrom(display: Display) {
    this.pixels = display.pixels;
  }
}

const grid = new Display(0, 0);

const upDir = new vec3(0.0, 1.0, 0.0);
const sunDirection = new vec3(-0.5, 0.7, -0.4).normalize();

function raySphereCast(
  rayOrigin: vec3,
  rayDirection: vec3,
  sphereCenter: vec3,
  sphereRadius: float
) {
  const originLocal = rayOrigin.sub(sphereCenter);

  let c = originLocal.dot(originLocal) - sphereRadius * sphereRadius;
  let b = rayDirection.dot(originLocal);
  let d = b * b - c;
  let t = -b - Math.sqrt(Math.abs(d));
  let st = step(0.0, Math.min(t, d));

  return mixf(-1.0, t, st);
}

function rayPlaneCast(
  rayOrigin: vec3,
  rayDirection: vec3,
  planeOrigin: vec3,
  planeNormal: vec3
) {
  let dist =
    planeOrigin.sub(rayOrigin).dot(planeNormal) / rayDirection.dot(planeNormal);
  let st = step(0.0, -rayDirection.dot(planeNormal));
  return mixf(-1.0, dist, st);
}

function groundColor(point: vec3, frameCounter: number, sphereCenter: vec3) {
  return mixf(
    0.0,
    mixf(
      1.0,
      0.6,
      Math.abs(
        Math.floor(point.z - (frameCounter / 10) * moving) + Math.floor(point.x)
      ) % 2.0
    ),
    smoothstepf(16, 0, point.distance(sphereCenter))
  );
}

function background(
  rayOrigin: vec3,
  rayDirection: vec3,
  sphereCenter: vec3,
  frameCounter: number
) {
  let groundDistance = rayPlaneCast(
    rayOrigin,
    rayDirection,
    new vec3(0.0, -1.0, 0.0),
    upDir
  );

  let groundHitPoint = rayOrigin.add(rayDirection.mulf(groundDistance));

  let sky = Math.max(0.0, rayDirection.dot(upDir));
  let sun = Math.pow(Math.max(0.0, rayDirection.dot(sunDirection)), 32) * 1.75;

  let shadow =
    1.0 -
    step(0.0, raySphereCast(groundHitPoint, sunDirection, sphereCenter, 1.0));

  let color = groundColor(groundHitPoint, frameCounter, sphereCenter);

  let ground = step(0.0, groundDistance);

  return sun + sky + ground * color * mixf(0.1, 1.0, shadow);
}

const ditherWeights = [0.25, 0.75, 1.0, 0.5];

function dither(position: vec3, value: float) {
  let x = position.x % 2.0;
  let y = position.y % 2.0;
  let index = x + y * 2;
  let limit = ditherWeights[index];
  return step(limit, value);
}

function raytrace(
  x: number,
  y: number,
  display: Display,
  frameCounter: number
) {
  const UV = new vec3(x / display.width, 1.0 - y / display.height, 0.0)
    .mulf(2.0)
    .subf(1.0)
    .mul(new vec3(display.width / display.height, 1.0, 1.0));

  const rayOrigin = new vec3(0.0, 1.8, -5.0);
  const rayDirection = new vec3(UV.x, UV.y - 0.45, 1.25).normalize();

  const sphereCenter = new vec3(
    0.0,
    Math.sin(frameCounter / 10) * 0.5 + 0.5,
    0.0
  );
  const sphereRadius = 1.0;

  const sphereDist = raySphereCast(
    rayOrigin,
    rayDirection,
    sphereCenter,
    sphereRadius
  );
  const sphereHitPoint = rayOrigin.add(rayDirection.mulf(sphereDist));
  const sphereNormal = sphereHitPoint.sub(sphereCenter).normalize();

  const floor = background(rayOrigin, rayDirection, sphereCenter, frameCounter);

  const reflectedRayDirection = rayDirection.reflect(sphereNormal);

  const reflection = background(
    sphereHitPoint,
    reflectedRayDirection,
    sphereCenter,
    frameCounter
  );

  let isSphere = step(0.0, sphereDist);

  let outColor = mixf(floor, reflection * 0.3, isSphere);
  outColor = Math.floor(outColor * colors) / colors;

  return outColor + dither(new vec3(x, y, 0.0), outColor) / colors;
}

function createCells() {
  container.innerHTML = "";

  for (let y = 0; y < grid.height; y++) {
    const rowElem = document.createElement("div");
    container.appendChild(rowElem);
    rowElem.className = ROW_CLASS;

    for (let x = 0; x < grid.width; x++) {
      const cell = document.createElement("div");
      rowElem.appendChild(cell);
      cell.className = CELL_CLASS;
    }
  }
}

function renderCells(frameCounter: number) {
  for (let y = 0; y < container.childElementCount; y++) {
    const row = container.children[y];

    for (let x = 0; x < row.childElementCount; x++) {
      grid.set(x, y, raytrace(x, y, grid, frameCounter));
      (row.children[x] as HTMLElement).style.backgroundColor = `hsl(0, 0%, ${
        grid.at(x, y) * 100
      }%)`;
    }
  }
}

// these heights are only used to generate cell counts nothing more
export default () => {
  let frameCounter = 0;
  function makeGrid() {
    let cellHeight = 12;
    let cellWidth = 12;

    const gridWidth = Math.floor(window.innerWidth / cellWidth);
    const gridHeight = Math.floor(window.innerHeight / cellHeight);

    grid.resize(gridWidth, gridHeight);

    createCells();
    renderCells(frameCounter);
  }

  window.addEventListener("resize", makeGrid);
  makeGrid();

  let rendering = true;

  const pauseButton = document.getElementById(PAUSE_B_ID);
  pauseButton.onclick = () => {
    rendering = !rendering;
    pauseButton.innerText =
      pauseButton.innerText === "resume" ? "pause" : "resume";
  };

  const groundButton = document.getElementById(GROUND_B_ID);
  groundButton.onclick = () => {
    moving = (moving + 1) % 2;
    groundButton.innerText =
      moving === 1.0 ? "moving ground: true" : "moving ground: false";
  };

  const depthButton = document.getElementById(DEPTH_B_ID);
  depthButton.onclick = () => {
    bitDepth++;
    if (bitDepth == 9) bitDepth = 1;
    colors = 2 ** bitDepth;
    depthButton.innerText = "bitdepth: " + bitDepth;
  };

  setInterval(() => {
    rendering && renderCells(++frameCounter);
  }, 1000 / 24); // => Target 24 fps
};
