---
layout: "^layouts/QuietLayout.astro"
title: The Oxidation Pt. 0 - Intro
description: Welcome to a series of blog posts on Rust.
pubDate: "2023-02-10T17:26:20"
tags: ["RUST", "OXIDATION"]
---

<img src="/sink/quiet_oxidation_banner.svg" class="max-w-200" />

# the_oxidation[0]: Intro

Hey, welcome!

In this series I will document the process of me, as a monkey brain
who only uses managed memory languages, learning [the Rust programming language](https://www.rust-lang.org/).

## Why are you doing this?

Well, I have wanted to build a JS minifier to beat everyone else's for a very long time,
and I finally decided that screw it, I'm gonna do it!

For performance reasons (what I plan to do is going to require stringifiying craptons of JS),
I chose [SWC](https://swc.rs) to be my parser, AST, and emitter. Also, I'm familiar with it.

## Tell me more about this project

So of course, if I'm going to write a series of blog posts about something,
I'm going to need to tell you about what I'm actually making!

I am going to be making a minifier for JavaScript that can apply two main types of transformation:
transforms that can always/heuristically be applied,
as is the standard for current tools,
and transforms that we try, see if it improves things, then if necessary bail out.

This will involve essentially having a great big pile of things to try,
the proverbial *"throw enough mud at the wall, some of it will stick"*,
and hopefully getting a small bundle at the end of it.

## What sort of thing do you expect to cover?

I expect a lot of the posts here will talk about either something inherent to Rust,
or more about how I solved a particular problem.

All of these will be about a problem I have solved or worked around,
or something new that I learned incidentally related to Rust or this project.

I already actually have the first blog post lined up to write,
about early lessons in ownership, and weaving my way around the borrow checker!

## Coolio, but blog posts are inconvenient, I wanna binge read!

I'll shove next and previous links at the bottom of each post in this series, hows about that ;)

Hopefully you find this series interesting, and I hope to see you back here soon!  
 -- Yellowsink

~~*Previous*~~
[*Next*](oxidation-1)