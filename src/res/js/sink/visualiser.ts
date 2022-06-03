import type { Transition } from "crossani";
import "crossani";

type Track = [number, number, number][];

const showState: Transition = {
  state: { opacity: "1" },
  ms: 50,
};
const hideState = (dur: number): Transition => ({
  reset: true,
  ms: dur - 50,
});

const sleep = (t: number) => new Promise((r) => setTimeout(r, t));

const at = (x: number, y: number) => document.getElementById(`${x}-${y}`);

const show = (x: number, y: number, dur = 250) => {
  at(x, y).doTransition(showState);
  at(x, y).doTransition(hideState(dur));
};

const SynthTrack: Track = [
  [0, 4, 4],
  [1000, 5, 5],
  [1500, 5, 4],
  [2450, 4, 5],
  [3000, 4, 4],
  [3950, 5, 5],
  [4500, 5, 4],
  // end trill
  [5400, 5, 3],
  [5600, 4, 3],
  [5800, 3, 4],
];

export async function Synths() {
  let lastT = 0;
  const wait = (t: number) => {
    const prom = sleep(t - lastT);
    lastT = t;
    return prom;
  };

  async function main() {
    show(4, 4);
    await sleep(1000);
    show(5, 5);
    await sleep(1500 - 1000);
    show(5, 4);
    await sleep(2450 - 1500);
    show(4, 5);
    await sleep(3000 - 2440);
    show(4, 4);
    await sleep(3950 - 3000);
    show(5, 5);
    await sleep(4500 - 3950);
    show(5, 4);
  }

  async function trill() {
    show(5, 3);
    await sleep(200);
    show(4, 3);
    await sleep(200);
    show(3, 4);
  }

  main();
  await wait(5400);
  trill();
  await wait(6000);
  lastT = 0;

  while (true) {
    main();
    await wait(5400);
    trill();
    await wait(6000);
    main();
    await wait(11500);
    show(4, 5);
    await wait(12000);
    lastT = 0;
  }
}
