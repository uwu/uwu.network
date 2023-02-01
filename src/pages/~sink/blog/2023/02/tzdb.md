---
layout: "^layouts/QuietLayout.astro"
title: 5 things I learned from TimezoneDB
description: A hard lesson learned in software development
pubDate: "2023-02-01"
tags: []
---

# 5 Things I Learned from TimezoneDB
*A hard lesson learned in software development*

TimezoneDB was a neat idea I had, and I was very excited to build.

It would solve a problem I had, I could feasibly build it on Cloudflare Workers
so that (at the expense of code annoyances) I could run it for a grand total of $0,
and I had a particularly clean API.

## 1: See if your idea exists already

As it turns out, the idea of keeping everyone's timezone in an easy-to-lookup
central database isn't a new idea, and it already exists for Discord!

This is something I should have checked before sinking 11 hours into coding
and documenting.

## 2: The cons of developing in private

The main reason I spent so long developing before this came to my attention is simple,
I write my projects in private git repos,
and only open source when the projects are taking good shape,
or I want to collaborate.

This has the upshot that projects that never take flight (eg OneMath)
can sit in a private repo and not harm anything.

It unfortunately has the downside that until I put out a website for my own TZDB,
the relevant people who ran the existing TimezoneDB
had no chance of finding my repository.

## 3: Your acquaintances are often friendly

The existence of the original TimezoneDB
(especially since it's not particularly publicised),
was bought to my attention by someone who,
while I had not spoken to him in quite a while,
was friendly, we are on good terms,
and was very reasonable etc.

All due respect to him for telling me now, instead of, say,
when mine was finished and operating!

But yeah uh turns out I already knew a guy who wrote the same thing I was making!

## 4: Don't take a failure too hard

You know what? This sucked, and I'm not going to pretend it didn't.

But while having a project go to nothing due to it existing already feels awful,
I had to keep a level head.

This is only my own fault, and hey, these guys have infrastructure
that would be nicer to use (postgres), and they have an already working system,
and I can write the server in a language that isn't Javascript (bonus!).

Take the deep breath you need to be pragmatic,
see if perhaps the effort of finishing your own project is not worth it
in comparison to just joining up,
and also, ya know, duplicate data sources are a pain in the ass.

### 4.5: Have a mental recovery mechanism

Despite the level headedness or whatever,
I still felt pretty annoyed and kind of put out.

Having some way to lift yourself out of the initial
feelings from a failure is always a good thing to have.

What works varies by person, but I'm partial to some
[Senko](https://anilist.co/anime/105914).

### 5: Take a failure as a chance to learn

It's probably >5x better than spending a couple hundred quid on a course.

- I learned a lot about Cloudflare Workers
- I learned how Cloudflare Worker KV works
- I learned a bit more about OAuth2
- Sometimes flashy custom UIs aren't necessary, good ol' Fomantic UI can work fine.
- How to design APIs

Well, hopefully someone else, if they find themselves in a similar place,
might find this useful. Or maybe not ;)

Cya next time  
 -- Yellowsink