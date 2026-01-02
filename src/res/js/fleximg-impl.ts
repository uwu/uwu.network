import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import imageSize from "image-size";
import { imageSizeFromFile } from "image-size/fromFile";
import { dirname, resolve } from "path";
import { env } from "process";
import { fileURLToPath } from "url";

export type Size = Omit<
	ReturnType<typeof import("image-size").imageSize>,
	"images"
>;

const thisModulePath = fileURLToPath(import.meta.url);

export let rootPath = thisModulePath;
while (!existsSync(resolve(rootPath, "package.json")) && rootPath.split("/").length > 1) {
	rootPath = dirname(rootPath);
}

const cachePath = resolve(rootPath, "node_modules/.cache/uwu/img-sizes");

const cacheData: Record<string, Size> = existsSync(cachePath)
	? JSON.parse(readFileSync(cachePath).toString())
	: {};

function addToCache(src: string, size: Size) {
	cacheData[src] = size;
	mkdirSync(dirname(cachePath), { recursive: true });
	writeFileSync(cachePath, JSON.stringify(cacheData));
}

async function getSizeImpl(src: string) {
	// first, look up in cache
	let size = cacheData[src];

	if (!size) {
		let isUrl = !!src.match(/^(http(s?))?:?\/\//);

		if (isUrl && import.meta.env.DEV) {
			console.log(`[FlexImg] caching image ${src}...`);
		}

		size = isUrl
			? imageSize(new Uint8Array(await fetch(src).then(r => r.arrayBuffer()) as ArrayBuffer))
			: await imageSizeFromFile(resolve(rootPath, "public/", src.slice(1)));

		addToCache(src, size);
	}

	return size;
}

// only run one fetch at a time to avoid timeouts
const queue: [string, (s: Size) => void][] = [];

let isRunning = false;
async function run() {
	if (isRunning) return;
	isRunning = true;

	while (queue.length) {
		const [src, res] = queue[0];

		res(await getSizeImpl(src));
		queue.shift();
	}
	isRunning = false;
}

export async function getSize(src: string) {
	return new Promise<Size>((res) => {
		queue.push([src, res]);
		run();
	});
}

