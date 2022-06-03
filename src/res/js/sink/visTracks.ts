import {
  bars,
  beats,
  FINISHED,
  for_,
  skipBar,
  skipBars,
  notYet,
  show,
  showArea,
} from "./vis";

export async function Synths() {
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

export async function Bass() {
  async function run(x: number, y: number) {
    for (let i = 0; i < 4; i++) {
      show(x, y);
      await for_(beats(1));
    }
  }

  await for_(bars(8));
  while (notYet(FINISHED)) {
    await skipBars(72, 80)

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
  // 25ms offset for the animation
  await for_(bars(4) - 25);

  while (notYet(FINISHED)) {
    await skipBar(88);
    await skipBar(91);
    await skipBar(104);
    await skipBar(107);
    showArea(0, 2, 0, 0);
    await for_(beats(1));
  }
}

export async function Hat() {
  await for_(bars(8) - 25);

  while (notYet(FINISHED)) {
    await skipBar(88);
    await skipBar(91);
    await skipBar(104);
    showArea(3, 5, 0, 0, 130);
    await for_(beats(0.5));
  }
}

export async function Snare() {
  await for_(bars(16) + beats(1) - 25);

  while (notYet(FINISHED)) {
    await skipBar(88);
    await skipBar(91);
    await skipBar(104);
    await skipBar(107);
    showArea(6, 8, 0, 0);
    await for_(beats(2));
  }
}
