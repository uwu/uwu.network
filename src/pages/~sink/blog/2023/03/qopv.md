---
layout: "^layouts/QuietLayout.astro"
title: Quite Okay Pixel-Art Video Compression
description: A toy video codec based on QOI
pubDate: "2023-03-01T17:26:20"
tags: ["GRAPHICS"]
---

# Quite Okay Pixel-Art Video Compression

So I was playing around with the [QOI](https://qoiformat.org) image format today, just because, ya know,
data compression is really interesting!

The video I was using test images from is the [No Mana A/V set @ Gravity 2021](https://youtu.be/IMRPKeKBa5A).

Here were my playing around images for reference:

<div class="flex flex-wrap gap-5">
  <img src="/sink/quiet_qopv/test_large.png" class="max-w-384px w-full" />
  <img src="/sink/quiet_qopv/test_large_2.png" class="max-w-384px w-full" />
</div>

## Videos are just moving pictures

Let's go to the pictures...!

Let's start by looking at how one of these pictures might be compressed.
To start with, this video is pixel art at a 192x108px resolution,
deduced by the fact that each pixel takes up 10x10px in a 1080p screenshot.

Let's focus on test image 1. The 1080p screenshot in PNG is 37kb.

So taking a screenshot of the video and downscaling it to this size,
using nearest-neighbour scaling (just picking the closest pixel to use when scaling,
instead of trying to combine or blur pixels together cleanly),
and then encoding this with PNG gives us 18k.

This is a nice improvement, but let's try QOI!

QOI is an image encoding format that is stupidly simple, very very fast,
and compresses pretty well - as it turns out, very well indeed for pixel art.

```sh
$ ffmpeg -i test_small.png test_small.qoi
<output omitted>
$ ls -l test_small*
.rw-r--r--   18k cain  1 Mar 15:51  test_small.png
.rw-r--r--   14k cain  1 Mar 18:09  test_small.qoi
```

Nice! A 4k improvement, which translates to 22.2% improvement!

If we can apply this to a video, we could save big.

And because small videos tend to get crunched to hell by lossy formats,
if we consider that the source videos are 1080p, we have just a chance of winning on size,
while staying lossless.

If you were interested, as I was, about how QOI was compressing these images,
the [QOI visualizer](https://taotao54321.github.io/QoiVisualizer/) shows this:

![](/sink/quiet_qopv/vis_1.png)

As you can see, the main "chunks" being used (QOI images are a series of chunks that define
one or more pixels) are the light and dark grey chunk.

These chunks are for run-length-encoding, in which a pixel is just repeated a set amount of times.
This, one of the true greatest hits classics of compression, is ideal to pixel art like this.

The other main ones in use are the blue diff chunks, to define a small change in colour from the last pixel,
and the yellow index pixel, which refers to a colour we have seen recently, but may be very different from
the previous pixel.

Finally, the red colour chunks, which define new colours.

Something important to keep in mind is that every row of grey pixels counts as a single chunk,
but generates an astounding amount of pixels:

![](/sink/quiet_qopv/vis_2.png)

## Video time; square one

So first off, I downloaded the video with yt-dlp, yielding me a 702MB webm (with VP9).

Now, I'm just encoding video here, so I threw away the audio as a "do it later":tm: thing.

```sh
$ ffmpeg -i No\ Mana\ A⧸V\ Set\ @\ Gravity\ 2021\ \[IMRPKeKBa5A\].webm -c:v copy -an no_mana.webm
$ ffmpeg -i No\ Mana\ A⧸V\ Set\ @\ Gravity\ 2021\ \[IMRPKeKBa5A\].webm -c:a copy no_mana.opus
$ ls -l no_mana*
.rw-r--r--   59M cain  1 Mar 18:25  no_mana.opus
.rw-r--r--  642M cain  1 Mar 18:25  no_mana.webm
```

624M! And here's an image (00:08:08.2):
<img src="/sink/quiet_qopv/no_mana_orig.png" class="max-w-768px w-full" />

Okay, let's see if we can get a better baseline size.
First I'll try a nearest-neighbour downscale to H.264:
```sh
$ ffmpeg -i no_mana.webm -s 192x108 -sws_flags neighbor -sws_dither none no_mana_h264.mp4
$ ls -l no_mana_h264.mp4
.rw-r--r--  138M cain  1 Mar 19:28  no_mana_h264.mp4
```

Okay, so we've hit 138M with default ffmpeg H.264 settings.
Here's an image:
<img src="/sink/quiet_qopv/no_mana_h264.png" class="max-w-768px w-full" />

## Time for QOI

In true spirit of building this on top of QOI, let's try a folder of QOIs!

```sh
$ ffmpeg -i no_mana.webm -s 192x108 -sws_flags neighbor -sws_dither none qoi/%04d.qoi
$ dust -n 0 qoi
893M ┌── qoi│
```

And an image:
<img src="/sink/quiet_qopv/no_mana_smol_orig.png" class="max-w-768px w-full" />

Now as it transpires, no, we won't be winning any size battles then.

However, we might barely get close to the 1080p size!

## Let's write a "new" format, then!

So this is just a folder of QOI files, which isn't ideal.
This means we have something like 110k identical copies of the QOI header.

Also, we can't share the index between frames :(

So, here's how the very official and not scuffed Quite Okay Lossless Video format will work:
```c
qolv_header {
  char     magic[4];   // qolv
  uint32_t width;      // big endian
  uint32_t height;     // big endian
  uint32_t frames;     // big endian
  double   framerate;
  double   lensecs;    // no guarantee to be correct, just metadata
  uint8_t  channels;   // 3 or 4
  uint8_t  colorspace; // 0=srgb, 1=linear rgb
};
```

Followed by treating the entire video as it was one gigantic QOI image.
It's that simple.

I'll basically just encode / decode every frame in sequence,
except the encoder / decoder state is kept between frames,
instead of resetting to `0x000000FF` & an empty index.

So, coding time, we're gonna implement a QOI encoder and we're gonna do it in C#!

To start with, we're going to assume our input is a folder of QOI files, for ease of implementation.

And we'll use QoiSharp to grab bytes from the images. We'll also assume the same size etc for all of them.

Note that I am using LINQ to do this, so it is all lazy. This is good because, unlike calling `ToArray`,
we don't have to store everything in memory.

For the same reason, when we write the encoder we will be writing to a `Stream` that we can just point directly to a file.

So, here's code that decodes a folder of QOI images to pixels:

```csharp
using QoiSharp;

var imageFiles    = Directory.GetFiles(args[0]).OrderBy(f => int.Parse(f.Split("/").Last().Split(".")[0])).ToArray();
var decodedImages = imageFiles.Select(path => QoiDecoder.Decode(File.ReadAllBytes(path)));

var firstImg = decodedImages.First();
var header = new QoiImage(Array.Empty<byte>(), firstImg.Width, firstImg.Height, firstImg.Channels, firstImg.ColorSpace);

var pixels = decodedImages.SelectMany(
  img => img.Data
            .Chunk(3)
            // ARGB
            .Select(pixChunk => pixChunk[2] + (pixChunk[1] << 8) + (pixChunk[0] << 16) + (0xFF << 24))
  );

// test
foreach (var pix in pixels.Take(1000))
	Console.Write($"{pix:X} ");
```

Now, for the encoding part. We're going to have to tweak the QoiSharp encoder here, as it's not designed for what we want.
I'll start by copying the [QoiEncoder](https://github.com/NUlliiON/QoiSharp/blob/main/src/QoiSharp/QoiEncoder.cs) code into our file to play with.

From now on, a lot of code may be presented as diffs.
I will start by changing the function to take the bytes lazily and separate from the `QoiImage` class,
and to take a `Stream` and return void (and remove the return):

```diff
-byte[] Encode(QoiImage image)
+void Encode(QoiImage image, IEnumerable<int> imagePixels, Stream output)
@@ @@
-return bytes[..p];
```

And make the `bytes` array be written to a `StreamWriter` (`bytes` is renamed to `headBytes` too).
Also this will have the wrong header, let's write the correct one:

```diff
+var sw = new StreamWriter(output);
-var headBytes = new byte[QoiCodec.HeaderSize + QoiCodec.Padding.Length + (width * height * channels)];
+var headBytes = new byte[QoiCodec.HeaderSize];
@@ @@
headBytes[13] = colorSpace;
+sw.Write(headBytes);
```

```diff
+var sw = new StreamWriter(output);
-var headBytes = new byte[QoiCodec.HeaderSize + QoiCodec.Padding.Length + (width * height * channels)];

-headBytes[0] = (byte) (QoiCodec.Magic >> 24);
-headBytes[1] = (byte) (QoiCodec.Magic >> 16);
-headBytes[2] = (byte) (QoiCodec.Magic >> 8);
-headBytes[3] = (byte) QoiCodec.Magic;
+sw.Write("qolv");

-headBytes[4] = (byte) (width >> 24);
-headBytes[5] = (byte) (width >> 16);
-headBytes[6] = (byte) (width >> 8);
-headBytes[7] = (byte) width;
+sw.Write(width);

-headBytes[8]  = (byte) (height >> 24);
-headBytes[9]  = (byte) (height >> 16);
-headBytes[10] = (byte) (height >> 8);
-headBytes[11] = (byte) height;
+sw.Write(height);

+sw.Write(imageFiles.Length);
+sw.Write(60.0);
+sw.Write(imageFiles.Length / 60.0);

-headBytes[12] = channels;
+sw.Write(channels);
-headBytes[13] = colorSpace;
+sw.Write(colorSpace);
```

Now, at a lot of points, this code does something like `bytes[p++] = (byte) /* thing */`.
We will go through and replace those with `sr.Write(/* thing */)`.

```diff

```
//TODO