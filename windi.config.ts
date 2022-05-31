import { defineConfig } from "windicss/helpers";
import * as catpuccin from "./catppuccin.json";

export default defineConfig({
  preflight: true, // set false to disable removal of browser default styles
  theme: {
    extend: {
      // setup the theme here
      fontFamily: { // class="font-plex"
          plex: ["IBM Plex Mono", "monospace"],
          inter: ["Inter", "sans-serif"]
      },
      colors: {
          ...catpuccin
      }
    },
  },
  extract: {
    // you *probably* don't want to touch this
    include: ["./src/**/*.{vue,html,jsx,tsx,astro}"],
    exclude: ["node_modules", ".git"],
  },
});