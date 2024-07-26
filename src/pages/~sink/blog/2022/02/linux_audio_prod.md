---
layout: "^layouts/QuietLayout.astro"
title: Linux Audio Production
description: A "state of the art" for making music on Linux
pubDate: "2022-02-14"
physPubDate: "2024-07-26"
tags: ["MIGRATED"]
---

*note: migrated over from my website at https://yellows.ink/linux_audio_prod*

## The state of digital music production on Linux

### The setup

<table>
  <tbody>
    <tr>
      <td>Distro</td>
      <td>EndeavourOS rolling</td>
    </tr>
    <tr>
      <td>Linux Kernel</td>
      <td>linux-zen 5.15.6-zen2-1-zen</td>
    </tr>
    <tr>
      <td>ALSA versions</td>
      <td>
        alsa-card-profiles 1:0.3.40-1
        <br />
        alsa-firmware 1.2.4-2
        <br />
        alsa-lib 1.2.5.1-3
        <br />
        alsa-plugins 1:1.2.5-2
        <br />
        alsa-topology-conf 1.2.5.1-1
        <br />
        alsa-ucm-conf 1.2.5.1-1
        <br />
        alsa-utils 1.2.5.1-1
        <br />
        lib32-alsa-lib 1.2.5.1-1
        <br />
        lib32-alsa-plugins 1.2.5-1
      </td>
    </tr>
    <tr>
      <td>Pipewire versions</td>
      <td>
        gst-plugin-pipewire 1:0.3.40-1
        <br />
        pipewire 1:0.3.40-1
        <br />
        pipewire-alsa 1:0.3.40-1
        <br />
        pipewire-jack 1:0.3.40-1
        <br />
        pipewire-pulse 1:0.3.40-1
        <br />
        wireplumber 0.4.5-2
      </td>
    </tr>
    <tr>
      <td>Wine versions</td>
      <td>
        wine-gecko 2.47.2-2
        <br />
        wine-mono 7.0.0-1
        <br />
        wine-staging 6.22-1
      </td>
    </tr>
  </tbody>
</table>

### Setting up audio apps - The natives

There are two native Linux audio applications I decided to try. The first
of these was LMMS, which is honestly too unusable for me, but otherwise
fine

The second of these was REAPER. This integrated perfectly fine with
Pipewire through ALSA, JACK, and PulseAudio. REAPER works beautifully, is
nice and fast, and pretty light. It also happens to be pretty much the
most powerful DAW available - [have you ever seen a REAPER power-user???](https://www.youtube.com/watch?v=H-Gs-o39C5o)

REAPER had one drawback for me though - aside from me personally not
finding it as "musical" as some others like FL or Reason - it failed to
find any of my VST plugins.

Had I got some Linux VSTs, this would work absolutely fine - indeed REAPER
has the widest plugin format support of any other software I tested,
however _Windows_ VSTs under Wine did not display (reasonably).

Also to note is that LMMS theoretically can load Windows VSTs - the
VeSTige plugin should be able to load a Windows VST given the path to the
dll, however it didn't work for me, and last time I'd tried it, the UI had
been very very buggy anyway.

### Setting up audio apps - The Windows DAWs

Every DAW I tried installed and launched out of the box on Wine, which was
a nice surprise. In addition I encountered no issues with audio playback
quality - No xruns whatsoever. In addition, both Reason and FL were
capable of loading and using VSTs fine.

iZotope RX 8 installed, however insta-crashes on launch. This also causes
the RX VSTs to fail to load in other hosts.

### REAPER on Wine

REAPER runs fine under Wine, and only has one minor graphical issue (the
scrollbars cant decide if they should look REAPER-ey or Windows-ey, and
settle on glitching between the two).

Audio playback works, and performance is good. VST plugins, however
crashed it. Hence I did not test further. Anyway, if you're using REAPER,
you should probably just use the Linux build and wrestle with a bridge
such as LinVST.

### Reason 12

I have long had a soft spot for Reason, since I started using it a few
years back (on Reason 10 Lite). So I was excited to find that the latest
version installs fine on Wine and loads up too.

There are a few issues, though: first, you cannot click the menu bar. This
can be worked around, though, by pressing alt once, then down once. You
can now use the arrows to navigate the menu, and the mouse mostly works
too.

More annoyingly, lots of text in the UI is white on a white background.
The best you can do to partially fix this is enable either the Blue or
Dark theme.

I encountered no issues with VST support, however (presumably due to the
DRM encrypting project files (maybe? - dont quote me on this!)), not only
could I not save projects, I could not save presets either.

Importing MIDI worked, but each track took a very long time to import,
before showing an error box that an assertion failed (that could
thankfully be safely ignored).

The HD makeover new in version 12 still looks just as stunning under
Linux, though with some details like the spinning fan on the back of the
Redrum lagging performance a little.

I wondered if I could get around the issues with the Reason DAW and still
make use of its rack in other DAWs, but the VST3 Reason Rack Plugin
crashes instantly.

### FL Studio 20

FL Studio is a frightfully popular DAW with a nice UI, an unconventional
pattern-based workflow, a nice light engine, and quite the dedicated
community. Oh, and it can drive Razer Chroma devices too so your keyboard
can vibe out to your tunes.

FL Studio works pretty much perfectly, if a little heavier. When you boot
it up for the first time, you are dropped straight into the demo project
(created with only built in plugins) and it works great. The mixer is
responsive, animations are oh so fluid, and the playlist snaps
satisfyingly along at 60fps as the playhead advances.

~~There is only one single issue that stops the FL experience being
literally identical to on Windows - the main window's handling of mouse
events. While FL can be resized fully under Windows, on Linux, it doesn't
seem to grasp the idea that it can be smaller than your entire screen.~~

UPDATE: I went back into FL to do some testing while writing this, and it
turns out that FL just thinks its maximised. Hit the titlebar button to
make it windowed and it works literally flawlessly - identical to on
Windows. You may wish to use a WM not a DE to make it automatically nice
and big despite being windowed.

### Ableton Live

I didn't try Live. According to Wine appdb it works fine, if much heavier
like FL and minor glitches. So yeah.

### Conclusion

In conclusion, audio production on Linux is painfully close to being
really really great, but for that to happen I think we need one of the
following three to happen:

- (Most likely) Some effort from the team at Cockos: working windows VST
  bridging in REAPER would make using it a very viable choice, and running
  natively on Linux means it will outperform DAWs on any other OS 90% of
  the time, plus it can take full advantage of Pipewire (likely indirectly
  via JACK), for fun routing and low latency.

- (Pretty unlikely) Some effort from the Wine team: somehow make FL and
  Ableton use the full extent of your CPU - reduce DSP overhead somehow

- (Comically unlikely) A huge effort from the KVM/QEMU devs and Linux
  Kernel contributors, and possibly Microsoft: make Windows KVMs have
  usable performance. Yeah that's not happening.
