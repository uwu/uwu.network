import { defineConfig, presetWebFonts, presetWind3, transformerDirectives, transformerVariantGroup } from "unocss";
import { presetRadixColors } from "unocss-preset-radix-colors";
import { theme } from "unocss/preset-wind3";

type DefaultFontFamily = Record<"sans" | "serif" | "mono", string>;
const systemFonts = theme.fontFamily as DefaultFontFamily;
const fontFamily = {
	// tasky's additions
	"system-sans": systemFonts.sans,
	"system-serif": systemFonts.serif,
	sans: ["Geist", "'Geist Fallback'", systemFonts.sans].join(", "),
	serif: [
		"'Source Serif 4 Variable'",
		"'Source Serif 4 Fallback'",
		systemFonts.serif,
	].join(", "),
	mono: ["Monaco", "ui-monospace", "Menlo", systemFonts.mono].join(", "),
	// site-wide
	plex: "IBM Plex Mono, monospace",
	plexsans: "IBM Plex Sans, sans-serif",
	jbmono: "JetBrains Mono, monospace",
};

export default defineConfig({
	theme: {
		fontFamily,
		fontSize: {
			quiet: ["13pt", "17pt"],
		},
		letterSpacing: {
			serif: "-0.015em",
		},
	},
	shortcuts: {
		"font-serif": "font-serif tracking-serif",
	},
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
		presetWind3(),
		presetWebFonts(),
		// tasky
		presetRadixColors({
			prefix: "",
			lightSelector: ".light",
			darkSelector: ".dark",
			colors: [
				// neutral
				"gray",
				// error
				"red",
				// success
				"green",
				// warning
				"yellow",
				"orange",
				// info
				"blue",
				"pink",
			],
			aliases: {
				neutral: "gray",
				info: "blue",
				tip: "green",
				warning: "yellow",
				danger: "red",
			},
		}),
	],
});
