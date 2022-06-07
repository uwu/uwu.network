import { sleep, setContainerContent, writeContainerContent } from "%js/utils";
import { Howl } from "howler";

export const loaderContent = `
<div class="leading-tight">
    <div class="mb-8">
        <p class="text-4xl italic text-purple-200">UWUNET</p>
        <p class="text-sm">Nobody grew up listening to us. Nobody does still.</p>
    </div>

    <div class="mb-4">
        <p>Phoenix 80386 ROM BIOS PLUS Version 1.10 2714</p>
        <p>Copyright (C) 1985-1989 Phoenix Technologies Ltd.</p>
        <p>All Rights Reserved</p>
    </div>

    <p>19920225151230</p>
</div>
`;

export default function boot() {
    const seekAudio = new Howl({
        src: "/beef/audio/seek.mp3",
        volume: 0.5
    });
    
    sleep(1000).then(() => {
        setContainerContent("bootscreen-container", loaderContent);
        seekAudio.play();
    });

    seekAudio.once("end", () => {
        writeContainerContent("bootscreen-container", `<p class="mt-4">Starting MS-DOS...</p>`);
        sleep(500).then(() => { location.replace(location.origin + "/~beef/about"); });
    })
}