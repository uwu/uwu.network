// @ts-check
import { defineConfig, presetWind } from "unocss";
import variantGroups from "@unocss/transformer-variant-group";

export default defineConfig({
  transformers: [
    variantGroups()
  ],
  presets: [
    presetWind(),
  ],
  theme: {
    fontFamily: {
      plex: "IBM Plex Mono, monospace",
      inter: "Inter, sans-serif",
    },
  },
  configFile: false
});
