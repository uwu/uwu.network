import WindiCSS from "vite-plugin-windicss";
import { defineConfig } from 'astro/config';
import sitemap from "@astrojs/sitemap";
import solid from "@astrojs/solid-js";
import svelte from "@astrojs/svelte";
import vue from "@astrojs/vue";

// https://astro.build/config
export default defineConfig({
  integrations: [vue(), svelte(), solid(), sitemap()],
  site: "https://uwu.network",
  vite: {
    plugins: WindiCSS()
  }
});