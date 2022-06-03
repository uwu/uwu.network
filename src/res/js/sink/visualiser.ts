import { bars, beats, FINISHED, for_, inRange, notYet, show, showArea } from "./visualiserDsl";

async function Synths() {
  async function main() {
    show(4, 4);
    await for_(beats(2.5));
    show(5, 5);
    await for_(beats(1.5));
    show(5, 4);
    await for_(beats(2.5));
    show(4, 5);
    await for_(beats(1.5));
    show(4, 4);
    await for_(beats(2.5));
    show(5, 5);
    await for_(beats(1.5));
    show(5, 4);
    await for_(beats(2.5));
  }

  async function trill() {
    show(4, 3);
    await for_(beats(0.5));
    show(5, 3);
    await for_(beats(0.5));
    show(6, 4);
    await for_(beats(0.5));
  }

  await main();
  await trill();

  while (notYet(FINISHED)) {
    await main();
    await trill();
    await main();
    show(4, 5);
    await for_(beats(1.5));
  }
}

async function Bass() {
  async function run(x: number, y: number) {
    for (let i = 0; i < 4; i++) {
      show(x, y);
      await for_(beats(1));
    }
  }

  await for_(bars(8));
  while (notYet(FINISHED)) {
    if (inRange(bars(71), bars(80))) continue;
  
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

async function BassDrum() {
  // 25ms offset for the animation
  await for_(bars(4) - 25);

  while (notYet(FINISHED)) {
    showArea(0, 2, 0, 0);
    await for_(beats(1));
  }
}

async function Hat() {
  await for_(bars(8) - 25);

  while (notYet(FINISHED)) {
    showArea(3, 5, 0, 0, 130);
    await for_(beats(0.5));
  }
}

async function Snare() {
  await for_(bars(16) + beats(1) - 25);

  while (notYet(FINISHED)) {
    showArea(6, 8, 0, 0);
    await for_(beats(2));
  }
}

export default () => {
  Synths();
  Bass();
  BassDrum();
  Hat();
  Snare();
};
