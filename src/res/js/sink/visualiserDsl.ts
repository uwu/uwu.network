import "crossani";

export function show(x: number, y: number, dur = 200) {
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

export function showArea(
  x1: number,
  x2: number,
  y1: number,
  y2: number,
  dur = 250
) {
  for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) show(x, y, dur);
}

// await for_(time);
export const for_ = (t: number) => new Promise<void>((r) => setTimeout(r, t));

let start: DOMHighResTimeStamp;
// await until(time)
export function until(t: number) {
  if (!start) start = performance.now();
  return for_(t + performance.now() - start);
}
// while (notYet(time)) {}
export function notYet(t: number) {
  if (!start) start = performance.now();
  return performance.now() - start < t;
}

// if (inRange(time, time)) continue;
export function inRange(tS: number, tE: number) {
  if (!start) start = performance.now();
  return performance.now() - start > tS && performance.now() - start < tE;
}

const BPM = 160;
export const beats = (n: number) => 1000 * n * (60 / BPM);
export const bars = (n: number) => beats(n) * 4;
// while (notYet(FINISHED)) {}
export const FINISHED = bars(164);
