import uno from "astro-uno";
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
//import solid from "@astrojs/solid-js";
import react from "@astrojs/react";
//import preact from "@astrojs/preact"; // this would need installing via npm
import svelte from "@astrojs/svelte";
import vue from "@astrojs/vue";

import unoConfig from "./uno.config";

// https://astro.build/config
export default defineConfig({
  integrations: [
    vue(),
    svelte(),
    // solid(),
    // preact(),
    react(),
    sitemap(),
    uno(unoConfig),
  ],
  site: "https://uwu.network",
});
