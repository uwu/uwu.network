import getRSS from "@astrojs/rss";

export const get = () =>
  getRSS({
    title: "Quiet System",
    description: "Yellowsink's blog - code, unix, and ramblings.",
    site: new URL("~sink/blog/", import.meta.env.SITE).href,
    items: import.meta.glob(["./blog/**/*.md", "./blog/**/*.mdx"]),
  });
