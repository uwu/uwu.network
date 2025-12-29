---
title: Running iTunes on Linux
description: Despite this being incredibly niche, what if we could run real iTunes on Linux?
pubDate: "2022-12-19"
tags: ["*NIX", "WINE"]
---

# Running iTunes on Linux

I think I am, perhaps, entirely alone in my love for iTunes.
It may be heavy and slow, it may be just plain weird at times, but I love it nonetheless.

It's a solid player, works VERY well with Apple Music, has, out of all the music players I've used
my favourite UI, and feels kind of like a power user's music player in a way.

How can we get this running then?

## "No, too easy. Give him something hard."
(-- Dawn of the Dead)

So of course, naive me went straight to [apple.com/itunes](https://www.apple.com/itunes) and downloaded the
latest 64-bit Windows installer.

I then had to set Wine to emulate Windows 10.

Small issue, the installed iTunes looked like this when launched:

<img src="/sink/quiet_itunes/fail.png" alt="Image of iTunes, broken." style="max-height: 30rem" />

Some research, I found a solution!

## The solution ("older video cards", yeah right)

Turns out, if you have an old GPU, you get told by iTunes to get an old version of it at
[this link](https://support.apple.com/kb/DL1816).

This version of iTunes turned out to be the jackpot!

First make sure your Wine version is Windows 10, then run the installer as usual.

Now iTunes may launch, but it may fail to launch. In that case, you're probably missing `libodbc.so` - but specifically for x32!

It differs per distro, but on Arch I just installed `lib32-unixodbc`,
and for good measure `unixodbc`, and tried again.

Lo and behold, iTunes!

You may now set your Wine ver to Windows 7 if you prefer, by the way.

Your mileage with popups working properly may vary, but that can be played with and fixed up,
and the MiniPlayer actually works almost flawlessly!

It's just a little slow...

<img src="/sink/quiet_itunes/full.png" alt="Image of iTunes, working." style="max-height: 40rem" />
<img src="/sink/quiet_itunes/miniplayer.png" alt="Image of iTunes miniplayer." />
<img src="/sink/quiet_itunes/popups.png" alt="Image of an iTunes popup." />