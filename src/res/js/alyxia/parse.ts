import { TextParser } from "cc-textparser";

interface ColorCommand {
  index: number;
  color: string;
}

const colorMap = [
  "#ffffff", // white (default)
  "#ff6969", // red
  "#65ff89", // green
  "#ffe430", // yellow (purple in code)
  "#808080", // gray
  "#ff8932", // orange (small font)
];

const parser = new TextParser<[ColorCommand[]]>();

parser.registerCommand("c", true, (color, index, colors) =>
  void colors.push({ index, color }));

export function parse(input: string) {
  const colors: ColorCommand[] = [];
  const parsed = parser.parse(input, colors);
  
  let result = "";
  let pos = 0;
  let inside = false;
  for (const cmd of colors) {
    result += parsed.substring(pos, cmd.index);
    if (inside)
      result += "</span>";
    if (cmd.color !== "0") {
      result += `<span style="color: ${colorMap[cmd.color]}">`
      inside = true;
    } else {
      if (inside)
        inside = false;
    }
    pos = cmd.index;
  }
  result += parsed.substring(pos);
  if (inside)
    result += "</span>"

  return result;
}
