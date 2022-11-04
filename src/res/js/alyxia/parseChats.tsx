import React from "react";

export function parseChat(chat: string) {
    let lines = chat.split("\n");
    for (let line of lines) {
        parseLine(line);
    }
    return (
        <h1>a</h1>
    )
}

function parseLine(line: string) {
    let res = /\[(.)\]\s+(.*?):\s+(.*)/.exec(line)
}