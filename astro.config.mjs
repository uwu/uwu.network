import uno from "astro-uno";
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
//import solid from "@astrojs/solid-js";
import react from "@astrojs/react";
//import preact from "@astrojs/preact"; // this would need installing via npm
import svelte from "@astrojs/svelte";
import vue from "@astrojs/vue";
import mdx from "@astrojs/mdx";
import unoConfig from "./uno.config";

// https://astro.build/config
export default defineConfig({
  legacy: {
    astroFlavoredMarkdown: true,
  },
  integrations: [vue(), svelte(), react(), sitemap(), uno(unoConfig), mdx()],
  site: "https://uwu.network",
});
