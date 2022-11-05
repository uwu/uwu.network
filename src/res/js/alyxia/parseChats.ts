import React from "react";

type Meta = {
    title?: string;
    desc?: string;
}
type Message = {
    name?: string;
    side?: string;
    content?: string;
}

export function parseChat(chat: string) {
    let meta: Meta = {};
    let msgs: Message[] = [];
    let lines = chat.split("\n");
    for (let line of lines) {
        if (line.startsWith("!")) {
            let m = parseMeta(line);
            meta[m.metaName] = m.metaVal;
        } else {
            msgs.push(parseLine(line));
        }
    }
    return { meta, msgs };
}

function parseLine(line: string): Message {
    let parsed = /\[(.)\]\s+(.*?):\s+(.*)/.exec(line)
    switch (parsed[1]) {
        case "L":
            parsed[1] = "left";
            break;
        case "R":
            parsed[1] = "right";
            break;
        default:
            parsed[1] = "left";
            break;
    }
    return {
        side: parsed[1],
        name: parsed[2],
        content: parsed[3]
    };
}

function parseMeta(line: string) {
    let parsed = /(?:!(.*?):\s+(.*))/.exec(line);
    return {
        metaName: parsed[1],
        metaVal: parsed[2]
    }
}