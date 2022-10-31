---
layout: "^layouts/QuietLayout.astro"
title: Two "beginner" 3D printers
description: My experience with the XYZ Da Vinci nano and Creality Ender 3 V2
pubDate: "2022-10-31"
tags: ["3DPRINT"]
---

# Two "beginner" 3D printers

For quite a while now, I have been using 3D printers. My first machine was the XYZ Da Vinci nano, a machine designed specifically for people new to it.

Many parts of the machine reflect this design decision - it comes preassembled, it has no heated bed to improve kid-friendliness, and has an enclosure and door to stop you touching things you aren't meant to.

After I recently upgraded to an Ender 3 V2, which is also quite a common machine for people to start with, I wanted to share my thoughts on both the printers, and which might actually be a better choice.

## The Da Vinci nano

The main draw of this printer is its ease of setup and all-in-one package design.

XYZ are happy to provide everything you need end-to-end, including a pre-assembled printer, a (disappointingly small) spool of their own filament in the box, and their own software.

The software itself is a sub-par slicer, and quite annoying, but props must be given for being suitably hand-holding in how to load and unload filament, etc.

A special note goes out to levelling the bed in this printer - you just tell the slicer to level it, it uses a very clever mechanism to extend a probe, it probes the bed a bit, and then retracts it using the same mechanism and tells you on your pc exactly how much to turn each of 3 dials. Very easy to use for a beginner.

Recent versions of the software, while sometimes adding features such as the very cool indeed cellular infill which I haven't seen elsewhere, often removed options that could be useful for tweaking your printer.

The lack of a heated bed makes it safer machine, it is a huge detriment to it - as it causes huge bed adhesion issues from trying to print onto cold glass.

The machine itself is disappointingly loud, with a not great fan and stepper motors that could be heard downstairs while the machine was printing. It also lacks an on-machine display which means all monitoring and adjustment must be done via a computer. Not ideal.

Its also pretty small, only 120x120x120mm - though due to the inherent slowness of FDM printing this is reasonable for beginners who likely won't want to spend tens of hours printing anyway.

I do appreciate that the firmware retracts after filament loads and prints for you to prevent ooze, which along with the guided filament loading makes the process a lot easier - also, retracting after a print means its safe to pull filament straight out of a cold machine (YOU SHOULD NOT DO THIS REGULARLY THOUGH), whereas with the Ender, you are likely to come back to a cold machine and have to heat the print head up to ~190C before you can pull that filament out safely.

### The big issue

This printer is fatally locked down.

You are only allowed to use their filaments with a DRM chip on - while those chips *do* allow you to see how much filament you have left and let the printer warn you if you don't have any loaded, they are primarily a DRM measure.

You can buy 3rd party NFC tags off ebay to combat this... except the latest firmware update breaks this. In addition, if you downgrade your firmware from this latest version, you could very well break the NFC module to it starts bricking your (even legit) tags. (Ask me how I know!)

Also, until the most recent firmware, you HAD to use their own software.

Some software such as Simplify3D worked with older Da Vinci 1.0 AIO models, but not this one.

If you want to use your own filament, XYZ are happy to *sell* you the privilege... for $50... THATS EXTORTIONATE.

AND these literal NFC tags use online DRM to lock themselves to only ONE printer *ever* before it will work. Absolutely unforgivable.

## The Ender 3 V2

The Ender 3 is one of the lowest priced still decent printers available today. It's massively popular and honestly pretty good.

Building it myself (with my dad) took a couple hours, which isn't bad, and I definitely enjoyed the process.

Having the heated bed is a huge upgrade over the original, as you can get a much better stick, and if you accidentally get a part glued on there, you can heat it up to about 70C and it will come off way easier.

An on-device screen is super useful, as being able to see where things are and control temps, positions, etc directly is incredibly helpful, and its also nice for it to not give a care in the world about what filament I put in it.

It has been pretty easy to use for me, working with minor tweaks OOTB with Cura (which is actually Creality's recommended slicer!).

I don't really have any complains so far - other than some under-retraction issues that I can play with in my slicer, and some loud fans.

The steppers are entirely silent and the actual part fan is really quiet, its nice.

You are expected, however, to be comfortable around a 3D printer, i.e. to know how to bed-level and how to load filament.

I found that the Ender's default suggestion that PLA should print at a bed temp of 60C is reasonable, but I modified the preset to change it to 50C on my printer - this is because Cura's profile asks for 50C, which has worked great for me, so I see no reason to overshoot it in the preheat preset.

## Thoughts

The Ender 3 V2 is way cheaper than the Da Vinci nano still, so for the extra flexibility, its 100% worth it.

XYZ still claw some lead in the user friendliness of their software, but its not worth it for how much they lock you in and try to pull money out of you.

No matter what printer you go for, I hope you get your money's-worth out of it, at least.

Happy printing!

-- Yellowsink
