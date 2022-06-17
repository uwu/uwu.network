import WindiCSS from "vite-plugin-windicss";
import { defineConfig } from 'astro/config';
import sitemap from "@astrojs/sitemap";
//import solid from "@astrojs/solid-js";
import react from "@astrojs/react";
//import preact from "@astrojs/preact"; // this would need installing via npm
import svelte from "@astrojs/svelte";
import vue from "@astrojs/vue";

// https://astro.build/config
export default defineConfig({
  integrations: [vue(), svelte(), /* solid(), */ /* preact(), */ react(), sitemap()],
  site: "https://uwu.network",
  vite: {
    plugins: WindiCSS()
  }
});