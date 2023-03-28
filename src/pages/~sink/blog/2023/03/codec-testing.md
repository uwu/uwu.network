---
layout: "^layouts/QuietLayout.astro"
title: Can YOU tell audio codecs apart?
description: Audiophiles love to talk about lossless. Here's proof they're usually full of shit.
pubDate: "2023-03-26T19:03:00"
tags: ["COMPRESSION", "AUDIO"]
---

# Can YOU tell audio codecs apart?

Something that audiophiles love to talk about is audio codecs - the tech that stops audio from taking up tons of space.

Most of the time, their claims aren't actually that applicable though, and I aim to prove it here.

## Methodology

I have picked excerpts from three songs that I just had lying around in FLAC format:

 1. Enter Shikari - Take My Country Back
 2. Mord Fustang - Milky Way
 3. Wolfgang Gartner - Illmerica

I hope that this selection should be diverse enough.

I split each audio clip into 6 chunks (not exactly equally, to keep you on your toes, of course!),
and encoded them with the following codecs (not in this order!):

 - MP3 V4 (FFmpeg default)
 - MP3 V0 (highest variable quality)
 - MP3 129 kbps (to test constant rate encoding)
 - Opus 96 kbps (to test the more modern format + 96k is the FFmpeg default)
 - Lossless x2 (I threw it in twice to break up all the compressed formats!)

The lossless clips are clips from the source FLAC files, not re-encoded via anything.

I constructed this all in [Cockos REAPER](https://reaper.fm),
~~and after the fact made sure to re-balance all the levels.~~
*I originally had to do this as encoding changed the levels, but I had to redo due to accidentally deleting my project
file, and it didn't happen the second time, neat!*

Also important to note after you're done is to select all your clips and disable the default small fade in and out.
These fades usually are there to help prevent clicks / pops, and are tiny enough to be unimportant, but here they are
very audible if left on.

Finally (after reencoding the chunks and stitching back together), I balanced the three tracks to roughly the same
volume level, to make it less jarring to listen to them back to back.

## So then, can YOU tell them apart?

Note: you will need a browser that [natively supports FLAC](https://caniuse.com/flac) to try this (it probably does).

Your first job is very simple: listen to this file *and tell me when the codecs switch*.

<audio id="audio-1" class="mb-2" controls preload src="https://f.yellows.ink/quiet_system_codecs.flac" />

That's really dificult, isn't it? Let's try something different.

I'll tell you *when* the codecs switch. You tell me *which codec is which*.

<audio id="audio-2" class="mb-2" controls src="https://f.yellows.ink/quiet_system_codecs.flac" />

Chunk: <span id="chunk-placeholder">Not playing or JS disabled</span>

## Given up?

So as it turns out, these are really close, aren't they? Want to know the answers?

Here ya go.

<audio id="audio-3" class="mb-2" controls src="https://f.yellows.ink/quiet_system_codecs.flac" />

Codec: <span id="codec-placeholder">Not playing or JS disabled</span>

So my aim with this is to prove that there really is nothing in codecs in the modern day, they're all good enough
that it's not an issue.

In case you wanted to critique my method, you can find the project file and audio stems
[here](https://f.yellows.ink/quiet_system_codecs_rpp.zip)
(without the full FLACs of each track, which were omitted, but the lossless parts have wavs supplied anyway.)

Hope to see you back here soon!<br/>
  -- Yellowsink

<script src="^js/quiet_codecs.ts"></script>
