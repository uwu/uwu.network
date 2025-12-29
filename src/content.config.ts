import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const sink = defineCollection({
	loader: glob({
		pattern: "**/*.{md,mdx}",
		base: "./src/content/sink/blog",
	}),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.string(), // TODO: convert to zod date
		tags: z.array(z.string()).optional().default([]),
		physPubDate: z.string().optional(),
	}),
});

const taskyPosts = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/tasky/posts" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		published: z.boolean().default(false),
		unlisted: z.boolean().default(false),
		tags: z.string().array().default([]),
		date: z.coerce.date(),
		sup: z.string().optional(),
	}),
});

const taskyMicro = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/tasky/micro" }),
	schema: z.object({
		status: z
			.object({
				icon: z.string().optional(),
				text: z.string().optional(),
				color: z.enum(["gray", "red", "green", "yellow", "orange", "blue"]),
			})
			.optional(),
		date: z.coerce.date(),
	}),
});

export const collections = { sink, taskyPosts, taskyMicro };
