import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import site from "☆js/site.config";

export const GET: APIRoute = async (context) => {
	const posts = await getCollection(
		"taskyPosts",
		(post) => post.data.published && !post.data.unlisted,
	);
	return rss({
		title: site.title,
		description: site.description,
		site: context.site ?? "http://localhost:4321/",
		items: posts.map((post) => ({
			...post.data,
			link: `/~tasky/posts/${post.id}/`,
		})),
	});
};
