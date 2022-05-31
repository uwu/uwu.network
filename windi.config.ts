import { defineConfig } from "windicss/helpers";

export default defineConfig({
  preflight: true, // set false to disable removal of browser default styles
  theme: {
    extend: {
      fontFamily: { // class="font-plex"
          plex: ["IBM Plex Mono", "monospace"]
      }
    },
  },
  extract: {
    // you *probably* don't want to touch this
    include: ["./src/**/*.{vue,html,jsx,tsx,astro}"],
    exclude: ["node_modules", ".git"],
  },
});