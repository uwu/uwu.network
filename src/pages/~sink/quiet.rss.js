import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
	const posts = await getCollection("sink");
	
	return rss({
		title: "Quiet System",
		description: "Yellowsink's blog - code, unix, and ramblings.",
		site: context.site,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: new Date(post.data.pubDate),
			link: `/~sink/blog/${post.id}`,
		})),
	});
}
