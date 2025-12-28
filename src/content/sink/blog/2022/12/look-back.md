---
title: A look back on 2022
description: It's been a hell of a year for me, as well as a weird one.
pubDate: "2022-12-31"
tags: []
---

# A look back on 2022

2022 was weird for me.

On the one hand, I got a metric crapton done and achieved a lot,
both project-wise and personally.

On the other hand, the year felt like it went *even faster* than 2021 did somehow,
and feels as though I've gone backwards a long way.

Either way, I thought it'd be fun to put together a look back on the year,
in a simple timeline sorta deal :p

## Jan 1: [work] lazpack

First project of the new year!!: lazpack.

lazpack was intended to be a package manager for custom gamemodes in osu!lazer.

It was very literally a start to the year, the repo being created on dec 31,
and the first code coming together on jan 1.

It has been abandoned since jan 15 :p

## Jan 6: [work] websmack

[websmack](https://github.com/Cumcord/websmack) is a library to grab modules from
[Webpack](https://webpack.js.org/) at runtime, and if you so wish, piss about with them and break stuff!

The Cumcord discord modification would later move to websmack for its webpack modules APIs.

It remains a maintained, highly tree-shakeable webpack module finder.

## Jan 10: [work] cc-tools

A bunch of tools to make writing plugins for the Cumcord discord modification
easier.

They were small, aggressively tree-shakeable, and useful.

Possibly the largest usefulness-size ratio I've achieved on any code to date!

## Feb 1: [work] HLCC

HLCC was my first foray into compilers, even if just JS.

It compiled easy to read code into compact snippets that stole
webpack modules at runtime, and let you do shenanigans with them.

It was aimed at Discord.

## Feb 14: [work] website reimplementation lands

I rewrite my website from being in [Solid](https://www.solidjs.com/)
to [Astro](https://astro.build/).

This was when astro was very beta and very buggy,
but it was a good bet and I think it is better for my use case overall.

Astro continues to be my goto website building tool, and in fact,
the page you're looking at right now is part of
[one massive astro project](https://github.com/uwu/uwu.network).

## Feb 23: [work] discord theming plugin

Cumstain, a themer for the Cumcord discord modification, is released.

It is an immensely complex plugin with many many hours of dev work.

Around it, a whole theme infrastructure took form.

As far as I know, it was one of the most popular CC plugins made.

## Mar 12: [work] KaiHax

KaiHax is a client mod for the Chinese Discord alternative KOOK,
then called Kaiheila.

It is effectively dead, but still works just fine!

Currently, it just features some developer APIs, and an English translation of the UI
(that took over 2 and a half hours of just writing constants in a JSON by the way,
not to mention the specific targeted things).

## Apr 8: [work] solid-reactor

Driven by the 2022 SolidHack hackathon, I threw together a compiler from
React code to Solid code.

It works fairly well, and if I remember correctly,
someone said some nice things about it when they did the stream.

[Play with it here](https://reactor-webui.vercel.app/)

## Apr 10: [work] emitkit

Writing [SWC](https://swc.rs) transforms isn't the nicest thing in the world.

After starting on HLCC, I threw together Emitkit to let me share some of the
tooling with solid-reactor.

It is now, as far as I know, the easiest way to make transforms for SWC.

## Apr 17: [work] spitroast split out

[spitroast](https://github.com/Cumcord/spitroast) is split out from the Cumcord discord modification.

It remains a maintained, compact, and easy to use javascript monkey-patcher.

## Apr 29: [work] crossani

Around an idea dreamt up by [Alyxia](https://alyxia.dev/),
I built an animation framework.

It uses CSS transitions to do the heavy lifting and has some decent
add-on packages for springs, FLIP, etc.

## May 16 → Jun 28: [personal] GCSE exams

British school system stuff uh yeah uh
[here](https://en.wikipedia.org/wiki/General_Certificate_of_Secondary_Education).

Also meant low-to-no productivity during this period.

## Jun 28: [personal] finish secondary school

At this point in time I was 15, and school is out!

Time for a horridly long summer break and productivity (mostly on mingine)
to fly through the roof!

## May 21: [work] webfps

Born out of the CrossAni animation framework,
webfps is a framerate counter for browsers.

It is written in JS and places a little popup in the page that
displays how many frames are being rendered by your browser each second.

It is immensely useful for debugging performance issues and animation frameworks,
despite its simplicity!

## May 22 → Jul 9: [work] temporary lead of CC

Temporarily leads the Cumcord discord modification.

Work gets done but shit also breaks a lot.

Where this came from originally:
![](/sink/quiet_to_ys.png)

## May 31: [personal] uwu.network forms

uwu.network is a developer collective that I am a part of,
formed of ex-cumcord team members, and just cool people we know.

We work together on code, hang out, and just generally have a blast :)

## Jul 11: [work] mingine

mingine is a teeny tiny physics engine for .NET and the web,
as well as a compact web game engine.

It aims to have a comfortable UI, tiny size, and decent performance.

It was also a huge blast to write the physics, and, like,
c'mon simulating physics is the best pastime for a complete utter nerd.

Haha ball bouncy it bounce boing boing hahha the ball be bouncing off the floor

## Aug 2: [work] simple monaco components

Using the monaco code editor is a bit of a pain in the ass.

These [components](https://github.com/uwu/simple-monaco) make it quite easy!

## Aug 28: I buy a domain!

I buy the [yellows.ink](https://yellows.ink) domain!

## Sep 5: [personal] college begins

Hooooooly shit this is big.

I start going to college and at this point, the time goes at, like, 3x speed or something, it's insane.

I get a lot of work done in my free time at college, even if I really should have been studying-

## Sep 25: [work] file host

I setup a file host for me and my friends.

My first play around with serverless.

## Oct 3: [work] HTTP proxy

Pretty self explanatory. A very janky proxy.

Does its job to let me browse GitHub at college.

## Sep 27: about a hundred hours of my work fly down the drain

On this day, the mildly popular discord client modification *Cumcord* dies.

This causes all the work on CC itself, as well as the entire ecosystem to become unusable.

Despite this huge news, it was kind of a relief - maintenance was becoming a pain!

I suggest you read [link's blog post](https://cumcord.com/an-exercise-in-futility),
and if you're in the Discord server, the announcements follow from
[here](https://discord.com/channels/824921608560181258/824923929138954241/1024255149016895528).

I say a hundred hours of my work, but countless more work from other highly talented people
including link, kasi, maisy, alyxia, cynthia, etc also die at this point.

The day after, shelter would be announced.

## Oct 24: [personal] Quiet System

Quiet System is my blog, which you're looking at literally right now!!!

It [all started](https://uwu.network/~sink/blog/2022/10/chunky-bacon) on the 24th October.

## Nov 12: [work] shelter releases

After an insane 6 week development period starting on sep 30, shelter finally releases publicly.

## Nov 17: [work] uwu radio releases

uwu radio lets you listen to a constant stream of music picked from the tastes of uwu.network members.

Everyone hears the same music all synchronised, just like real radio!

## Nov 21 → unreleased: [work] 予定 / yotei

予定 is a process scheduler and supervisor for *NIX systems.

It is built to be as simple as possible - the most important design goal
is 0% CPU usage when idle.

This used up a lot of "study" time that I definitely "studied" in.

## Dec 12: [personal] my mental state flies off a cliff :D

Not going to go into too much detail here but suffice it to say,
drifting away from IRLs slowly + extreme burnout.

Broke out of it quickly enough.

## random things that just sorta happened over the year

I suck at osu! now despite my best efforts, as well, so that's fun.
Perhaps it should stay as a reminder of lockdown...

I have grown increasingly detached from the Hololive community,
which saddens me. + god damn I miss rinnscribbles I hope they're doing alright...

## Dec 31: you are (were?) here

Well uh, I'm not sure really who this is targeted at, felt nice to look back though.

A lot has happened, and I'm glad for everyone who has brightened my year,
be it on Twitter, on Discord, or IRL.

Also shoutouts to all of my IRLs, you made the last 3 years a fucking blast for me,
and for that I am forever grateful.

Love you all.

-- Yellowsink.
