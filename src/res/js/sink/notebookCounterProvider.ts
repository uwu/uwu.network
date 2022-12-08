export let count = 1;
let firstOutput = true;

export function resetCount() {
  count = 1;
  firstOutput = true;
}

export function incrIn() {
  firstOutput = true;
  return count++;
}

export function incrOut() {
  if (firstOutput) {
    firstOutput = false;
    return count - 1;
  }

  return count++;
}