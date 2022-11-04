import React from "react";

type Message = {
    name?: string;
    side?: string;
    content?: string;
}

export function parseChat(chat: string) {
    let msgs = [];
    let lines = chat.split("\n");
    for (let line of lines) {
        msgs.push(parseLine(line));
    }
    return msgs;
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