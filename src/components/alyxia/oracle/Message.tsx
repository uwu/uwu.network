import React from "react";

interface MessageProps {
    name: string;
    side: string;
    text: string;
}
export const Message = ({ name, side, text }: MessageProps) => {
    return (
        <div className={`mesom m${side}`}>
            <img src={`/alyxia/img/oracle/${name}.png`} alt="" />
            <div>
                <b>{name.toUpperCase()}</b> <p>{text}</p>
            </div>
        </div>
    )
}