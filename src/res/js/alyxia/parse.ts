import { TextParser } from "cc-textparser";

interface ColorCommand {
  index: number;
  type: "COLOR";
  color: string;
}

interface UnderlineCommand {
  index: number;
  type: "UNDERLINE";
}

interface MarkupInstruction {
  index: number;
  insert: string;
}

type Command = ColorCommand | UnderlineCommand;

const colorMap = [
  "#ffffff", // white (default)
  "#ff6969", // red
  "#65ff89", // green
  "#ffff00", // yellow (purple in code)
  "#808080", // gray
  "#ff8932", // orange (small font)
  "#00FFFF", // cyan
];

const parser = new TextParser<[Command[]]>();

parser.registerCommand("\\", false, () => "\\");
parser.registerCommand("c", true, (color, index, cmds) =>
  void cmds.push({ index, type: "COLOR", color }));
parser.registerCommand("u", false, (index, cmds) =>
  void cmds.push({ index, type: "UNDERLINE" }));
parser.registerCommand("n", true, (amount) => "<br />".repeat(parseInt(amount)));

export function analyzeColors(cmds: Command[]): MarkupInstruction[] {
  const result = [];
  let span = false;

  for (const cmd of cmds) {
    if (cmd.type !== "COLOR") continue;
    const instruction: MarkupInstruction = {
      index: cmd.index,
      insert: "",
    }

    if (span)
      instruction.insert += "</span>"
    if (cmd.color !== "0") {
      instruction.insert += `<span style="color: ${colorMap[cmd.color] ?? cmd.color}">`;
      span = true;
    } else if (span)
      span = false;

    result.push(instruction);
  }

  if (span)
    result.push({ index: Infinity, insert: "</span>" });

  return result;
}

export function analyzeUnderlines(cmds: Command[]): MarkupInstruction[] {
  const result = [];
  let underlined = false;

  for (const cmd of cmds) {
    if (cmd.type !== "UNDERLINE") continue;
    const instruction: MarkupInstruction = {
      index: cmd.index,
      insert: underlined ? "</u>" : "<u>",
    }

    underlined = !underlined;
    result.push(instruction);
  }

  if (underlined)
    result.push({ index: Infinity, insert: "</u>" });

  return result;
}

export function parse(input: string) {
  const cmds: Command[] = [];
  const parsed = parser.parse(input, cmds);

  let instructions: MarkupInstruction[] = [];
  instructions.push(...analyzeColors(cmds));
  instructions.push(...analyzeUnderlines(cmds));
  instructions = instructions.sort((a, b) => a.index - b.index);

  let result = "";
  let pos = 0;
  for (const instruction of instructions) {
    result += parsed.substring(pos, instruction.index);
    result += instruction.insert
    pos = instruction.index;
  }

  result += parsed.substring(pos);
  return result;
}
