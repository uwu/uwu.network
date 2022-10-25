import getRSS from "@astrojs/rss";

export const get = async () => {
  const { body } = await getRSS({
    title: "Quiet System",
    description: "Yellowsink's blog - code, unix, and ramblings.",
    site: new URL("~sink/blog/", import.meta.env.SITE).href,
    items: import.meta.glob("./blog/**/*.md"),
  });

  const headers = new Headers();
  headers.set("Content-Type", "application/rss+xml");

  return new Response(body, { headers });
};
