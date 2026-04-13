---
title: ProShot Post-Processing
description: Comparing the noise reduction and sharpening modes
pubDate: "2026-04-13T23:31:00"
tags: ["GRAPHICS"]
---

# ProShot Post-Processing

[ProShot](https://play.google.com/store/apps/details?id=com.riseupgames.proshot2) is a third party camera application for android that features much more control over your device's cameras than Google Camera. You can control ISO, shutter speed, focus, white balance and exposure, which lens you're using independently of zoom level, resolution and recording format. If you're shooting video you can choose to record in log or flat. You can easily do exposure bracketing, change codecs and frame rates, and so forth. It has histograms and configurable levels and guides. You can set two custom manual settings profiles to use whenever you wish.

It also has two buttons in its control panel that are somewhat more magic - noise reduction and sharpening. Noise reduction comes in either "min" (-imal? -imum?) or "HQ", and sharpening comes in "+1", "+2", or "+3" (as well as *off* for both).

I... don't really know what to set these to! So I decided to find out how they all look. Obviously the raws don't have this processing, this is just for ProShot's built-in developer to convert it to jpeg. I will say that I generally prefer ProShot's jpegs to Google Camera's. The raws are essentially the same (other than Google Camera seems a little better at picking the best ISO + shutter combo for any given scenario than ProShot on full auto), its just the jpegs that are affected by any funky post processing effects, and that give gcam photos their signature over-sharpened almost midjourney-esque character.

I took a photo of the same scene with each processing level:

- NR off, SHARP off
- NR min, SHARP off
- NR HQ, SHARP off
- NR min, SHARP +1
- NR min, SHARP +2
- NR min, SHARP +3

And I kept the raw for the no NR no sharpening photo, so we have that to look at.

The photos are all the Pixel 9 main back camera, 1/30s shutter speed, f/1.7 aperture, 6.9 mm focal length, 450~460 ISO. I pulled all of them into Darktable for comparison. This would also allow me to view the raw file both completely unprocessed and with a sensible default development processing (including noise reduction), but without a more thorough processing (it certainly won't be a *well*-developed photo!!)

Note I will not be releasing the RAW for this scene, as much as I would love to, as I really cleverly decided to put my keyring in shot, and y'all could easily copy all my keys, and I don't really know of any way to remove that area from the raw without potentially changing the rest of the image. While the developed pictures out of ProShot are JPEGs, I have exported everything you see here as a *lossless* webp so that it doesn't get re-compressed after I do edits for comparison and the like.

## Noise Reduction

Preamble to say that usually I have a nice image container component that I use that will make all the images nicely
layout. In this case I'm choosing not to use that, to allow closer inspection of the images on large screens.
I am, however, going to contain them within the prose margins, so they aren't completely insane on desktop.

Here's the three images:

![](https://hy2.yellows.ink/c0b561eeb.webp)
![](https://hy2.yellows.ink/02344b3f1.webp)
![](https://hy2.yellows.ink/b1d8d76ef.webp)

Now here's a close up of the panda's left eye:
![](https://hy2.yellows.ink/c0e51ce39.webp)

It is a very clear leap from no noise reduction to NR min, when looking at the eye and the brown fur to its left:
![](https://hy2.yellows.ink/3fcfd4450.webp)

The eye has noticeable noise that NR min immediately removes, and it heavily reduces the noise apparent in the brown fur patch to the left too, though the noise certainly remains.
The jump up to HQ noise reduction appears to do not a whole lot by comparison. Looking even really closely at areas such as the dark patch to the top right of the eye, an area with a some flatter non-black colours, the character of the remaining noise looks basically identical. Certainly below the threshold of JPEG compression.
The brown fur to the left of the eye looks maybe a liiiittle less noisy, especially the large circular mass of it immediately next to the eye, but it's barely a difference, and I am FISHING for it at about 8x magnification.

I would suggest that perhaps "HQ" reduction really *does* refer to the reduction being higher quality, rather than more severe.

I tried fishing for a larger difference on the smooth shiny blade of the swiss army knife's scissors. Obviously enabling noise reduction makes a huge difference, but I'm more interested in the difference moving from min to HQ might make:

![](https://hy2.yellows.ink/4c30b2ce0.webp)

![](https://hy2.yellows.ink/9682f057f.webp)

I bid you good luck seeing any appreciable difference here. I even left off the blue line to help you see them riiiiiiight next to each other. The divider is the same shape. I am willing to say that there is no appreciable difference between noise reduction min and HQ.

Therefore, I shall use NR HQ going forward, as "better" noise reduction is more than welcome to me given that it visibly just does not degrade the image any more than it might on min.

## Sharpening

Here's all four images:
![](https://hy2.yellows.ink/02344b3f1.webp)
![](https://hy2.yellows.ink/b5e273d76.webp)
![](https://hy2.yellows.ink/80d9dfb82.webp)
![](https://hy2.yellows.ink/8e1b8c0ee.webp)

Note these all are taken with NR on min, as I didn't want to throw a bunch of noise into the sharpener, that seemed unrealistic and cruel to its algorithms. I'll start with just "SHARP +1".

I chose to use the panda's left ear (well... it'd be his right...) as a test area.

![](https://hy2.yellows.ink/c6a83a094.webp)

Again, the first step really speaks for itself. The result is so much sharper that it makes the unsharpened image look out of focus! And I promise, it is in focus when you look at the raw!
However, it also pulls a lot of noise out of the background that noise reduction had otherwise handily taken care of. Let's look at the pencil sharpener for a good example.

![](https://hy2.yellows.ink/92ed4bd95.webp)

You can see here that sharpening has made the fur look WAY more defined, but notice how much noisier the table and smooth part of the sharpener on the bottom right are than on the bottom left. The highlights on the top rough part look much brighter in the sharpened image though.

I feel as though, if the unsharpened image is a little on the soft side, even just Sharp +1 may be too far the other way. Though again, I remind you that I'm zoomed about 8x in here.

But this makes an interesting comparison. The NR-off image looks a LOT more like the sharpened image than the NR-min image does!

![](https://hy2.yellows.ink/56e19f87f.webp)

So perhaps the noise reduction is actually squashing some sharpness out of the image that was there, and sharpening is bringing it back at the expense of some noise returning too.
Personally, I prefer the smooth wood-grained desk slightly over-noise-reduced than more noisy from the sharpening:

![](https://hy2.yellows.ink/fe674ebc2.webp)

### Higher sharpening settings

Let's sharpen my knife. hehe.

![](https://hy2.yellows.ink/c02802c28.webp)

So the images get no sharper perceptually, but they do get slightly more affected by artefacts. If you're gonna use sharpening, leave her at +1.
Personally I think I'm not even going to have that on. I don't like the sharpening.

## Okay, okay, try the raw

This isn't really a fair test, and is out of scope, but I'm going to try to get the nicest balance between noise reduction and sharpness as I can out of the raw in Darktable, with my VERY beginner photo developing skills. Naturally the colours are FUCKED in my edit.

- Somewhere between 1 and 1.1 on the profiled noise reduction strength feels juuust about the sweet spot to me before sharpening. I want just a bit of 'grain' so avoid it looking compressed, but I want to remove the noise.
- The sharpen module on literally its default settings (radius 2, amount 0.5, threshold 0.5) actually looks really good to me, though again its increased the noise, so let's revisit noise reduction
- More like strength 1.3 now feels just about perfect on denoise (profiled)

And that's it, here's the image I got with just profiled denoise 1.3, default sharpen, and some colour correction to make it not look *absolutely horrendous*.

![](https://hy2.yellows.ink/a2784e915.webp)

You be the judge. And I have some learning to do before I can shoot in raw methinks.

I do think the ProShot sharpening filter actually really helped here on the darker orange area just under the white fur
under the eye, but it's not a huge difference.
