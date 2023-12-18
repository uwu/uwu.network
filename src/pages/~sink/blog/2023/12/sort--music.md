---
layout: "^layouts/QuietLayout.astro"
title: Sorting my local music collection
description: How to fix egregious disk overuse
pubDate: "2023-12-16T16:47:00"
tags: ["MUSIC"]
---

# Sorting my local music collection

One of the things that I value a lot in my life is entertainment media,
and I am a big fan of having a convenient copy of things I own.

If I buy a CD, I have bought a right to listen to that, so it is pretty reasonable to have a digital rip of that CD
on my laptop or phone to listen to, given I don't share it, cool, sounds okay.

But I soon run into a problem: digital music takes up (to use a very technical term:) a metric assload of storage.

I have a hard disk I keep full of FLACs but those are gigabytes and gigabytes of data, so for actual use, compression!

I use Opus as it is by far the best compressing audio codec currently, it's awesome, but the real issue is not this,
the real issue is album art.

## The Problem

Having album art on your music is nice. It's very nice, but it causes issues.
One of the files I have has a 3000x3000px PNG album art embedded in it, and this has the unfortunate side effect that
the file, 20MB, has an 11MB album art inside it.

The problems here are egregious redundancy, and files so big that some music players actually struggle to load the files.

## The solution

So here's what I do.
Step 1 is to find the album on Musicbrainz. Make sure that even if your tagging software identifies it as a CD release,
you pick a digital release on MB, so you have the best chance of getting decent album art.

Step 2 is to download the best image you can find, ideally PNG, and drop that into the folder "cover.png" or whatever,
so that players that understand that such as Strawberry can pick it up and show you it.

Step 3 is to compress it down to a smaller JPEG, say, 750px wide, and embed *that* into the files.
Might only take like ~63k.
That could save you 100MB for an album!

Do this for everything, which is tedious, and you win.

I couldn't be bothered to write software to make this easier but you totallllly could.

## Results

It took me a couple hours to crunch through doing all that, but in the end, I've gone from having many broken/nonideal
arts to all being good, and from 7.06GB to 5.2GB (a 26% reduction).
