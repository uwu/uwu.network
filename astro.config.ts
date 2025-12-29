import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import vue from "@astrojs/vue";
import rehypeShiki, { type RehypeShikiOptions } from "@shikijs/rehype";
import {
	transformerMetaHighlight,
	transformerNotationDiff,
	transformerNotationErrorLevel,
} from "@shikijs/transformers";
import unocss from "@unocss/astro";
import compress from "astro-compress";
import icon from "astro-icon";
import purgecss from "astro-purgecss";
import { defineConfig } from "astro/config";
import remarkDirective from "remark-directive";
import type { BuiltinTheme } from "shiki";
import { remarkReadingTime } from "./src/res/js/tasky/remark-rehype/remark-reading-time.ts";
import { remarkSidenotes } from "./src/res/js/tasky/remark-rehype/remark-sidenotes";
// PurgeCSS can't find imported styles on it's own. For now this will fix.
import baseCSS from "./src/res/css/tasky/base.css?raw";
import proseCSS from "./src/res/css/tasky/prose.scss?raw";
import shikiCSS from "./src/res/css/tasky/shiki.css?raw";
import { remarkAlerts } from "./src/res/js/tasky/remark-rehype/remark-alerts";

const shikiThemes: Record<string, BuiltinTheme> = {
	light: "github-light-default",
	dark: "github-dark-dimmed",
};

const styles = [baseCSS, proseCSS, shikiCSS].join("\n");

// https://astro.build/config
export default defineConfig({
	devToolbar: {
		enabled: false,
	},

	markdown: {
		remarkRehype: {},
		syntaxHighlight: "shiki",
		shikiConfig: {
			themes: shikiThemes,
			transformers: [
				// @ts-ignore
				transformerMetaHighlight(),
				// @ts-ignore
				transformerNotationDiff({ matchAlgorithm: "v3" }),
				// @ts-ignore
				transformerNotationErrorLevel({ matchAlgorithm: "v3" }),
			],
		},
		remarkPlugins: [
			remarkReadingTime,
			remarkDirective,
			remarkSidenotes,
			remarkAlerts,
		],
		rehypePlugins: [
			[
				rehypeShiki,
				{
					inline: "tailing-curly-colon",
					themes: shikiThemes,
				} satisfies RehypeShikiOptions,
			],
		],
	},

	integrations: [
		sitemap(),
		icon(),
		mdx(),
		unocss({ injectReset: true }),
		purgecss({
			variables: true,
			keyframes: true,
			fontFace: true,
			safelist: {
				// Don't purge important class names like !bg-none.
				deep: [/!.*/],
			},
			css: [{ raw: styles }],
		}),
		compress({
			SVG: false,
			Image: false,
			CSS: false,
			JavaScript: false,
			HTML: true,
		}),
		vue(),
	],
	site: "https://uwu.network",
});
