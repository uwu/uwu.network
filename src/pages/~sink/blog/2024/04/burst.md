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
From what I've heard from people, it is very rare that you get the same CRC twice in burst mode but a
different one in secure mode.

Second of all, AccurateRip. If the AccurateRip confidence is high (above say, 3), then your rip checksums match other
users with that CD and it is very likely to be perfect.

If these conditions don't really meet, or if you *know* that your CD has scratches, maybe just use secure mode to be
safe.

## My tests

I had three CDs that I ripped in Secure Mode and had to hand, and I tested them all.
 - Amon Tobin - Out From Out Where
 - Enter Shikari - Nothing is True and Everything is Possible
 - Burial - Untrue
 - Madeon - Adventure (*)
 - Adam Freeland - Now & Them (*)

2/3 of them returned identical test CRCs when read in Burst Mode.

*Nothing is True and Everything is Possible* returned a "timing problem" and "suspicious position" on the last track
and a mismatching CRC. This would simply prompt me to rerip in Secure Mode.
AccurateRip seemed happy for what it's worth, and the error was RIGHT at the end of the CD.

When I tried AGAIN in secure mode, testing this last track filled up the error correction meter and showed a
"sync error", was not verified as accurate, and returned the same "suspicious position".
I suspect this is just an error with the last track of this disc being hard to read correctly at all.
Indeed, there's a *visible* imperfection on the edge of the written portion of the disc, perhaps a bad pressing?

Disabling overreading into Lead-In and Lead-Out entirely fixed this and the burst CRC matched secure with no errors.
(and removed secure errors)

Untrue reported a timing problem but actually still matched CRCs. I did not re-test after disabling overreading, but it
was off for the next two tests.

\*I didn't fully test Adventure because it was reading *really slowly*, but track 1 matched.

\*Now & Them was a second hand CD, badly scratched, and was ripping so slow I chose to give up on Secure Mode for track
1, only using it for others. The first track would not consistently rip or anything but oh well.

UPDATE: Ripping track 1 of Now & Them in secure mode took 17 minutes and found a read & sync error.

This supports what I mentioned earlier that matching burst CRCs predict matching a secure CRC.

For ripping *good condition* (undamaged and clean) CDs, I will be using burst mode in future, though I suggest using
Secure Mode if you have the time.
