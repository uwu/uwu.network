// @ts-check
import { defineConfig, presetWebFonts, presetWind, transformerDirectives, transformerVariantGroup } from "unocss";

export default defineConfig({
  transformers: [
    {
      // unocss does not use the same syntax as windi for
      // < and @ breakpoint variations
      // this transformer makes them work by converting
      // them into uno syntax.
      // can't just implement a variant as it won't work with
      // the variant groups transform that way
      name: "windi-breakpoint-compat",
      enforce: "pre",
      transform(code) {
        const matches = code
          .toString()
          .matchAll(/[<@](?:sm|md|lg|\d*xl)[:-][a-z\()]/g);

        for (const match of matches) {
          if (!match.index) continue;

          code.remove(match.index, match.index + 1);
          const replacement = match[0][0] === "@" ? "at-" : "lt-";
          code.appendLeft(match.index, replacement);
        }
      },
    },
    transformerVariantGroup(),
    transformerDirectives(),
  ],
  presets: [
    presetWind(),
    presetWebFonts({
      provider: "google",
      fonts: {
        pacifico: {
          name: "Pacifico",
          weights: [400],
          italic: true,
        },
      },
    }),
  ],
  theme: {
    fontFamily: {
      plex: "IBM Plex Mono, monospace",
      plexsans: "IBM Plex Sans, sans-serif",
      jbmono: "JetBrains Mono, monospace",
    },
    fontSize: {
      quiet: ["13pt", "17pt"],
    },
  },
});
