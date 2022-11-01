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
  "#ffe430", // yellow (purple in code)
  "#808080", // gray
  "#ff8932", // orange (small font)
];

const parser = new TextParser<[Command[]]>();

parser.registerCommand("\\", false, () => "\\");
parser.registerCommand("c", true, (color, index, cmds) =>
  void cmds.push({ index, type: "COLOR", color }));
parser.registerCommand("u", false, (index, cmds) =>
  void cmds.push({ index, type: "UNDERLINE" }));

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

// takes 0.08ms - 0.25ms time
export function parse(input: string) {
  console.time("parse")
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
console.timeEnd("parse")
  return result;
}

// takes 0.04ms - 0.15ms time
// export function parse(input: string) {
//   const cmds: Command[] = [];
//   const parsed = parser.parse(input, cmds);

//   let result = "";
//   let pos = 0;

//   let span = false;
//   let underlined = false;

//   for (const cmd of cmds) {
//     result += parsed.substring(pos, cmd.index);

//     switch (cmd.type) {
//       case "COLOR":
//         if (span)
//           result += "</span>";
//         if (cmd.color !== "0") {
//           result += `<span style="color: ${colorMap[cmd.color]}">`
//           span = true;
//         } else {
//           if (span)
//             span = false;
//         }
//         break;
//       case "UNDERLINE":
//         result += underlined ? "</u>" : "<u>";
//         underlined = !underlined;
//         pos = cmd.index;
//         break;
//     }

//     pos = cmd.index;
//   }
//   result += parsed.substring(pos);
//   if (span)
//     result += "</span>"

//   return result;
// }
