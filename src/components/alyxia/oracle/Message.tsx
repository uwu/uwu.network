import React from "react";

interface MessageProps {
    name: string;
    side: string;
}
export const Message = ({ name, side, children }: React.PropsWithChildren<MessageProps>) => {
    return (
        <div className={`mesom m${side}`}>
            <img src={`/alyxia/img/oracle/${name}.png`} alt="" />
            <div>
                <b>{name.toUpperCase()}</b> {children}
            </div>
        </div>
    )
}