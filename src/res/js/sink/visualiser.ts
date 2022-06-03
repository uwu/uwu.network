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

const sleep = (t: number) => new Promise((r) => setTimeout(r, t));

const at = (x: number, y: number) => document.getElementById(`${x}-${y}`);

const show = (x: number, y: number, dur = 250) => {
  at(x, y).doTransition(showState);
  at(x, y).doTransition(hideState(dur));
};

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

export async function Bass() {
  async function run(x: number, y: number) {
    for (let i = 0; i < 4; i++) {
      show(x, y);
      await sleep(375);
    }
  }

  await sleep(12200);
  while (true) {
    await run(8, 7);
    await run(7, 7);
    await run(8, 7);
    await run(7, 7);
    await run(8, 6);
    await run(7, 7);
    await run(8, 7);
    await run(6, 7);
  }
}

export default () => {
  Synths();
  Bass();
}