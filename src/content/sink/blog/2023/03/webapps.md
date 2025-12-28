---
title: On the performance of web applications
description: Overhead and performance ramblings
pubDate: "2023-03-28T17:43:00"
tags: ["*NIX", "PERF"]
---

# On the performance of web applications

We have finite processing power. But we use
[layer](https://react.dev/)
[upon](https://www.electronjs.org/)
[layer](https://v8.dev)
of (rarely zero-cost) abstraction every day.

Is this acceptable?

## Well, why do we do it?

Using web applications *on the web* has highly obvious advantages:
 - you don't need to install the app
 - it works on anything that has a browser
 - after years of being the only tools in a niche, HTML, CSS, & JS have evolved to be very versatile

Okay, now what about using it on the desktop? Well, other advantages now come to the forefront:
 - little else really does cross platform nearly as well
 - little else does accessibility as well
 - heck, even things that are cross platform might not look consistent - your web app is almost guaranteed to be
 - you already have JS devs for your website, and now they can build your desktop app too

Some very interesting links to cite out to are:
 - [*A Fistful of Megabytes* by fasterthanlime](https://www.youtube.com/watch?v=hnaGZHe8wws)
 - [This tweet by @tsoding](https://twitter.com/tsoding/status/1636036276687192068)

These go over, respectively, why using off-the-shelf and less than perfect performing solutions are so sensible,
and what your computer really is capable of doing processing-wise, when you peel back some overhead
(of course that demo still has plenty, since its a `<canvas>`, but its also executing C so whatever).

## Okay, how much of a performance issue is this?

The way I intend to measure this is to use our good friend [htop](https://htop.dev/)!

In case you've never encountered it, here's an explanation via screenshot form:

![A screenshot of a text listing of running processes on a system. Metrics are highlighted: CPU use, memory use, and priority.](/sink/quiet_htop.png)

Now the obvious metric to focus on is how much %CPU it tends to use over its lifetime,
but this is a continuously changing and unreliable metric.

CPU time doesn't bounce around wildly, it just steadily climbs, so is easier to measure.
It is a pretty good measure of how much time that process has to spend "doing work".

Let's sort and have a look! (paths of processes turned off for ease of reading)

![A list of processes sorted by CPU use. The list starts with Firefox, then VS Code, then Discord, then Java.](/sink/quiet_htop_sorted.png)
![](/sink/quiet_htop_sorted_2.png)

Now this is very raw data, it's not immediately useful, but let's unpick it a bit.

First, you'll notice that Firefox is using a lot of processor time, which makes some sense because I had a lot of tabs
open, had watched a couple of YouTube videos, and had an internet radio open.

Still, a chunk of this really is just rendering web pages.

Well how about the next most hungry processes?
 - `code` - the VS Code which I'm writing this in
 - `Discord` - huh. A known very badly optimized electron app.
 - `node` - the Astro dev server that is building the page I'm writing right now
 - `Xorg` - considering this is rendering my graphical environment, this is perfectly reasonable
 - `java` - this is the spellchecker I'm using in VS Code!
 - `htop` - well it is reading information about all of my system processes every half second, thats expensive!
 - `wezterm-gui` - this has to render all the pretty colours and text, but still quite high, `st` would be way lower.
 - `pipewire-pulse` - it really took this many processes down the list since X11 to hit another realtime media process!
 - `jetbrains-toolbox` - why does essentially a launcher need as much CPU power as my audio server?

I'll stop going down the list now - a lot of the processes below here are pretty unremarkable.

And some are even, in fact, surprising.
OpenTabletDriver is handling inputs from my Wacom tablet *and* running on a bytecode runtime (.NET),
yet is using near nothing.

## What's your point?

Well, look at Discord there. This is a chat application. It is sat doing literally nothing most of the time as no
new messages have arrived, assuming I'm not watching a video or a GIF or something.

Its job is to wait for WebSocket events, then update the page.

And it has taken 4 full minutes to do just that.
For just under double that I may as well go and browse the web actively,
or even write a goddamn blog post in a modern and relatively intelligent editor loaded with plugins and godknowswhat.

The benefit of this realistically being cross-platform consistency
(Oh, what's that, you support screen share? You implement your voice chat in native libraries?
Oh. There goes consistency.)

Sure, it's not a huge issue per se, the app feels... just barely fast enough to not be that noticeable,
but still, is this a trade-off we deserve to face?

## Let's get a reference

Let's try looking at Wolfram Mathematica, a piece of software that does complex math for you.

It has a consistent cross-platform UI with Qt5 and appears to use java for stuff.

I wonder how much CPU time starting it and evaluating a reasonably large notebook takes?

![](/sink/quiet_htop_math.png)

That's... not a lot.

And the bit that did all the work is only the 3rd biggest user of cpu time.

Huh.

## Conclusion

I don't really know, this is just me looking at one metric and making some bold conclusions about the efficiency
of Javascript and web browsers.

Maybe there's something here, maybe not.

Either way, hope to see you back here soon<br/>
 -- Yellowsink
