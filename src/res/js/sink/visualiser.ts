import "crossani";

function show(x: number, y: number, dur = 250) {
  const elem = document.getElementById(`${x}-${y}`);
  elem.doTransition({
    state: { opacity: "1" },
    ms: 50,
  });
  elem.doTransition({
    reset: true,
    ms: dur - 50,
  });
}

function showArea(x1: number, x2: number, y1: number, y2: number, dur = 250) {
  for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) show(x, y, dur);
}

// await for_(time);
const for_ = (t: number) => new Promise((r) => setTimeout(r, t));

const BPM = 160;
const beats = (n: number) => 1000 * n * (60 / BPM);
const bars = (n: number) => beats(n) * 4;

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

  while (true) {
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

async function BassDrum() {
  // 25ms offset for the animation
  await for_(bars(4) - 25);

  while (true) {
    showArea(0, 2, 0, 0);
    await for_(beats(1));
  }
}

async function Hat() {
  await for_(bars(8) - 25);

  while (true) {
    showArea(3, 5, 0, 0, 130);
    await for_(beats(0.5));
  }
}

async function Snare() {
  await for_(bars(16) + beats(1) - 25);

  while (true) {
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
