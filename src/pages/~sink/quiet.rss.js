import getRSS, { pagesGlobToRssItems } from "@astrojs/rss";

export const GET = async () =>
	getRSS({
		title: "Quiet System",
		description: "Yellowsink's blog - code, unix, and ramblings.",
		site: new URL("~sink/blog/", import.meta.env.SITE).href,
		items: await pagesGlobToRssItems(import.meta.glob(["./blog/**/*.md", "./blog/**/*.mdx"])),
	});
