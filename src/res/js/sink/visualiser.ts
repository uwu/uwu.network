import type { Transition } from "crossani";
import "crossani";

const showState: Transition = {
  state: { opacity: "1" },
  ms: 50,
};
const hideState = (dur: number): Transition => ({
  reset: true,
  ms: dur - 50,
});

const for_ = (t: number) => new Promise((r) => setTimeout(r, t));

const at = (x: number, y: number) => document.getElementById(`${x}-${y}`);

function show(x: number, y: number, dur = 250) {
  at(x, y).doTransition(showState);
  at(x, y).doTransition(hideState(dur));
}

function showArea(x1: number, x2: number, y1: number, y2: number, dur = 250) {
  for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) show(x, y, dur);
}

const BPM = 160;
const beatDivision = (div: number) => 1000 * ((60 / BPM) / (div / 2));

export async function Synths() {
  let lastT = 0;
  const until = (t: number) => {
    const prom = for_(t - lastT);
    lastT = t;
    return prom;
  };

  async function main() {
    show(4, 4);
    await for_(1000);
    show(5, 5);
    await for_(1500 - 1000);
    show(5, 4);
    await for_(2450 - 1500);
    show(4, 5);
    await for_(3000 - 2440);
    show(4, 4);
    await for_(3950 - 3000);
    show(5, 5);
    await for_(4500 - 3950);
    show(5, 4);
  }

  async function trill() {
    show(4, 3);
    await for_(200);
    show(5, 3);
    await for_(200);
    show(6, 4);
  }

  main();
  await until(5400);
  trill();
  await until(6000);
  lastT = 0;

  while (true) {
    main();
    await until(5400);
    trill();
    await until(6000);
    main();
    await until(11500);
    show(4, 5);
    await until(12000);
    lastT = 0;
  }
}

export async function Bass() {
  async function run(x: number, y: number) {
    for (let i = 0; i < 4; i++) {
      show(x, y);
      await for_(375);
    }
  }

  await for_(12200);
  while (true) {
    await run(7, 7);
    await run(6, 7);
    await run(7, 7);
    await run(6, 7);
    await run(7, 6);
    await run(6, 7);
    await run(7, 7);
    await run(5, 7);
  }
}

export async function BassDrum() {
  // actually starts at 6000 but animation moment
  await for_(6000 - 25);

  while (true) {
    showArea(0, 2, 0, 0)
    await for_(beatDivision(2));
  }
}

export async function Hat() {
  await for_(12000 - 25);

  while (true) {
    showArea(3, 5, 0, 0, 130);
    await for_(beatDivision(4));
  }
}

export default () => {
  Synths();
  Bass();
  BassDrum();
  Hat();
};
