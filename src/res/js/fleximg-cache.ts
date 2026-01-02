import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
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

export function cacheLookup(src: string) {
	return cacheData[src];
}

export function addToCache(src: string, size: Size) {
	cacheData[src] = size;
	mkdirSync(dirname(cachePath), { recursive: true });
	writeFileSync(cachePath, JSON.stringify(cacheData));
}
