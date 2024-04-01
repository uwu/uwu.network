---
layout: "^layouts/QuietLayout.astro"
title: "Burst Mode: Accurate or Awful?"
description: An investigation into the EAC modes.
pubDate: "2024-04-01T15:34:00"
tags: ["AUDIO"]
---

# Burst Mode: Accurate or Awful?

Within Exact Audio Copy, there exist two main modes of operation: Burst Mode and Secure Mode.

Secure Mode is very safe. It will, once setup correctly, almost never produce an inaccurate rip as long as the disc is
not damaged beyond the point of saving.

The downside is that it is slow.

Burst mode is the normal way of ripping, and it is *fast*. *Very* fast. On modern drives that feature good
synchronization and built-in caching, it is also generally considered pretty safe.

Is it archival quality?

Well, kinda, yeah.
On its own, I would not accept a burst rip for what it is, but many of the tools built into EAC act as viable
alternatives to Secure Mode for keeping rips trustworthy.

First of all, the Test & Copy mode will read each track *twice*. This is already considered the gold standard for secure
mode rips by some archival trackers, who require seeing the test and copy CRC checksums match.

This works on burst mode too, and if you get the same twice, it is highly unlikely that any errors occurred, because
if they did, the exact same errors would have to have happened at the exact same times and caused the exact same
corrections.
From what I've heard from people, [TODO TEST], it is very rare that you get the same CRC twice in burst mode but a
different one in secure mode.

Second of all, AccurateRip. If the AccurateRip confidence is high (above say, 3), then your rip checksums match other
users with that CD and it is very likely to be perfect.

If these conditions don't really meet, or if you *know* that your CD has scratches, maybe just use secure mode to be
safe.
