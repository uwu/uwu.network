import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import vue from "@astrojs/vue";
import mdx from "@astrojs/mdx";
import uno from "@unocss/astro";

// https://astro.build/config
export default defineConfig({
	integrations: [vue(), sitemap(), mdx(), uno()],
	site: "https://uwu.network",
});
