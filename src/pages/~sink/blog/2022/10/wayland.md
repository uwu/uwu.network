---
layout: "^layouts/QuietLayout.astro"
title: The Way of the Land, and the 11th cross...
description: The display servers of free unix, and their advantages
pubDate: "2022-10-30"
tags: ["*NIX", "GRAPHICS"]
---

# The Way of the Land, and the 11th cross...

Once upon a time, roughly 1984, the ancient and blessed windowing system was created.
And the stewards saw that it would be open source, and that all was good.

The **X Windowing System** (X11, X.org) started off fairly basic, just black and white, and without
any hardware acceleration.

As time went on though, the appetite for graphics under Linux, BSD, and other free UNIXes grew.
X gained colour, and hardware acceleration from drivers such as Mesa - we had reached **X11** by 1987.

By the time we reach the modern day, X is a complex system with many moving parts.

Nowadays, there is a new challenger, hailing from the year of 2008, who follows the way of the land...

The **Wayland protocol** is a new contender, gaining traction rapidly,
and growing in viability each day.

(alright, I can't keep up this writing style, but It's still fun I guess)

Around 2013, Canonical did Canonical things and decided to make their own display server, **Mir**,
but it was only ever used in Ubuntu, and was compatible with both X11 and Wayland at points over its
life, so it was pretty useless, and eventually they realised this and dropped it.

This is the one and only mention Mir will get here because it is utterly irrelevant.

## The X Windowing System
X is what drives the majority of Linux and BSD GUI systems - and for good reason.

It is mature and stable, it is pretty fast, and supported by basically every GPU driver.

So how does it work?

The main component of the X system that could be referred to as X itself is the *X server*.

This is a process that runs as long as you're using a GUI and renders graphical frames either 
to a TTY or directly to a graphics driver.

Keyboard and mouse inputs go via X (usually via **libinput** etc) but clients can access the I/O directly too.
This is useful for things like games that may care more about where your keys are than what they represent.

Clients are applications that connect to the X Server.
They can render graphics and send it to the server, and have their own window to live inside.

On its own though, X is not hugely useful - you need a *window manager* to decide where windows are,
render their "decorations" (title bars etc), and handle requests by windows to be moved etc.

It's useful to note that the window manager does not talk to clients directly, it basically only talks
to the X server to mediate things.

Another component that just talks to X is the compositor.
In most mainstream cases the compositor comes with your window manager, but outside *desktop environments*
this is less common, and a separate one such as **compton** or **picom** may be used.

The job of the compositor is to take all the windows' graphics and combine them in a pretty way.
This is where transparency, blur, rounded corners, and shadows come from.
They can also do things like enable vsync, if that's what you prefer.
(note that in most cases your GPU driver probably has a better option, such as mesa's `TearFree` setting)

A very important thing to note here is that the compositor is optional, and if it's not running,
X will just composite windows itself, very basically with no effects.

The X compositor is what's known as *active* - this means it has to ask X for all the pixel data,
and then give it back processed, which introduces latency.

This is the architecture that the majority of systems were and still are built around.

## Wayland
The tides are changing in recent years, and Wayland is rapidly picking up speed,
and it works very differently to X.

It boasts higher performance, less jank, and no extraneous moving parts left over from the 80s.

Wayland is a specification that describes how to implement a *Wayland compositor*,
which actually handles all the work.

The reference implementation of a compositor is called **Weston**,
but KDE's **KWin** and GNOME's **Mutter** also support it,
and the **Sway** compositor has created a library called **wlroots** to assist in making your own.

In Wayland, all mouse and keyboard inputs go via the compositor *with no exceptions* - apps don't
get the direct input, they just get what the compositor gives them.

This means that configuring things like keyboard layout tends to be way easier - an obscure X config
that might not apply in some places or a daemon like **IBUS** can be replaced with a few lines in
your e.g. Sway config.

Applications are directly given a buffer of memory to render to by Wayland - the compositor does not
copy the video buffer, which increases performance.

The compositor is an all-in-one package, responsible for the job the X server, X compositor, and X
window manager would all do.
This means there is much less overhead from the parts talking to each other, at the expense of
modularity.

Unlike X, the Wayland compositor is *passive* - it receives data directly from clients and
process it straight from them, which removes the overhead of having to ask the server for all the data.

The compositor will most often allow you to configure a lot of things about your setup in one place,
for example, in Sway's config:
 - You could configure your window manager options and keybinds, usually handled, e.g. **i3**
 - You could configure your keyboard layout, usually handled by the X server and libinput.
 - You could configure your compositing and vsync, usually handled by the compositor.
 - You could configure your display options and layouts, usually handled by **RandR**

Another major benefit of Wayland is driver support - I had massive issues attempting to set up
FreeSync under X, with obscure bugs like (according to ArchWiki) all your connected screens
must run FreeSync/G-Sync or none of them can.

Under Wayland I still had issues, but its vsync implementation is so good and lag-free that it
honestly wasn't an issue.

### A couple interesting cases
Some interesting cases were found when gaming.

Muse Dash always stuttered and struggled running under Proton on X, and tweaks were required
(notably disabling DXVK and setting a framerate limiter).

Under Wayland, however, (after re-enabling DXVK) it runs buttery smooth - just like on Windows,
and no framerate limiting tweaks were needed.

It was also interesting playing with the framerate limiting options in Quaver.
Unlimited could pull around 600fps on my hardware, and the CPU stuck to the same rate.
Vsync just locked both the framerate and CPU tick rate to 144Hz.

But the interesting CAES was WaylandVsync - the framerate still vsynced to 144fps,
but this limit mode was unique in unlocking the CPU tick rate, which could shoot as high as 20,000Hz
during gameplay.

This was a fun curiosity, but arguably improved Quaver's characteristics as a rhythm game - it
could process input at the exact moment it arrived, removing more latency, while still not spending
too much valuable CPU time preparing frames for the GPU.

In addition, the vsync did not lag the game at all, whereas in running osu!framework games under X,
I had experienced cases where enabling vsync tanked the performance as low as 30fps.

Another fun note is that I noticed higher performance in osu!framework games by telling **SDL** to
output to Wayland instead of X via **XWayland** - one scene went from 270fps to ~300.

### Wayland's kryptonite - compatibility!
X is still the primary graphics server in most distributions, so most apps and drivers work to support it.

X compatibility is almost perfect and transparent, and quite performant, via **XWayland** -
which is a fully-blown X server that is built on top of Wayland.

However, some apps still don't work or have bugs, and another issue is that, due to Wayland's isolation of windows,
X screenshot tools can't possibly work, as they are not allowed to see other windows.

This, along with screen sharing and recording, can be mitigated by using the **XDG Desktop Portal** spec.

Another issue is drivers.
Mesa - along with Intel and AMD's proprietary drivers, used one driver API.

Nvidia, however, decided to just make their own instead of cooperating.
They eventually stopped being uncooperative.

Even then, older versions of Nvidia drivers don't work support hardware acceleration in XWayland.

However, app support in Wayland is getting better every day, and is mostly ready for a lot of users' use cases.

The push from both KDE and GNOME supporting it is a major cause for this - both KWin and Mutter now support Nvidia
drivers, and Sway supports Nouveau.

## So, is it worth the switch?
I would say it definitely is.

My whole desktop felt smoother and more responsive - though I will say this was mostly because before I was using
Picom's (pretty damn bad) vsync implementation. I could have got most of the way there by just using `TearFree` instead.

Even then, apps were buttery smooth under Wayland - I hadn't experienced a smooth scroll at 144Hz that looked as
smooth as it did in Windows before this - only full-screen games etc actually achieved smoothness before.

In addition, having all my config in mostly one place was a very welcome change, even if I had to ditch some niceties
of Picom such as rounded corners and background blur.

Another case of consolidation under Wayland is that when not using a Desktop Environment, you have to deal with your
wallpaper yourself - I used **feh** to set my wallpaper under i3.

In Sway you simply set your background in the config.

Wayland has blown me away since trying it again, and I wholeheartedly recommend any somewhat technical Linux user
to at least give it a try.

Even if you uninstall it again afterwards its still a very interesting thing to try, and you may fall in love with it!

While I'm here, another fun note is that **libinput** started as the input handling code of **Weston** - the
reference Wayland implementation, and it was split out, and is now the common way of handling input in X due to its
versatility and device support - though that said, there are still some things that don't use libinput - notably
the LinuxWacom project provides libinput drivers, but only the X-specific drivers allow configuring the tablet.

It's worth noting that multiple distributions of Linux have switched to Wayland as the default:
 - **Fedora** uses Wayland on GNOME since 2016 and KDE since 2021, with X as a fallback if the driver doesn't support it.
 - **Ubuntu** tried Wayland in 2017, but reverted it. Since 2021, it's the default again.
 - **Red Hat Enterprise Linux** uses it since 2019.
 - **Debian** uses it for GNOME since 2019.
 - **Slackware** uses it since 2020.
 - **Manjaro** uses it as the default for GNOME since 2020.

It is natively supported by many application frameworks and toolkits:
 - **Clutter** supports it.
 - **EFL** has almost-complete support.
 - **GTK >=3.20** has full support.
 - **Qt >=5** has full support - which allows writing clients *and compositors!*
 - **SDL >=2.0.2** supports it, and it's the default since 2.0.4
 - **GLFW >=3.2** supports it.
 - **FreeGLUT** has "initial" support (what does this mean?).

Hopefully this post was a useful (or at least interesting) read, and I hope you give Wayland a go ;)

If you use GNOME or maybe KDE on a major distribution, you may even be using it *right now!*

Cya soon I hope

-- Yellowsink