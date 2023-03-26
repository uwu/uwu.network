export {};

const audio1 = document.getElementById("audio-1") as HTMLAudioElement;
const audio2 = document.getElementById("audio-2") as HTMLAudioElement;
const audio3 = document.getElementById("audio-3") as HTMLAudioElement;

const chunkPlaceholder = document.getElementById("chunk-placeholder");
const codecPlaceholder = document.getElementById("codec-placeholder");

audio1.onplay = () => {
  audio2.pause();
  audio3.pause();
};

audio2.onplay = () => {
  audio1.pause();
  audio3.pause();
};

audio3.onplay = () => {
  audio1.pause();
  audio2.pause();
};

audio2.onpause = () => (chunkPlaceholder.textContent = "Not playing");
audio3.onpause = () => (codecPlaceholder.textContent = "Not playing");

const times = [
  0, 2.5, 4.5, 9, 13, 17,
  20, 22.5, 27, 31.5, 35.5, 38,
   40, 43, 45.5, 48.5,53.5, 57,
];

const chunks = [0, 0, 0].flatMap(() => [1, 2, 3, 4, 5, 6]);

const codecs = [0, 0, 0].flatMap(() => [
  "Lossless",
  "MP3 V0",
  "Opus 96 kbps",
  "MP3 192 kbps",
  "Lossless",
  "MP3 V4",
]);

audio2.ontimeupdate = () => {
  let chunkI = -1;
  for (const t of times) {
    if (t <= audio2.currentTime) chunkI++;
    else break;
  }

  chunkPlaceholder.textContent = chunks[chunkI] as any;
};

audio3.ontimeupdate = () => {
  let chunkI = -1;
  for (const t of times) {
    if (t <= audio3.currentTime) chunkI++;
    else break;
  }

  codecPlaceholder.textContent = codecs[chunkI];
};
