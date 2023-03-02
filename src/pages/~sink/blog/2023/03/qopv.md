---
layout: "^layouts/QuietLayout.astro"
title: Quite Okay Pixel-Art Video Compression
description: A toy video codec based on QOI
pubDate: "2023-03-02T18:49:05"
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

We will also omit the 8-byte end tag (`0x0000000000000001`) between frames,
and just include it at the end of the video stream.

## Let's write some code

So, coding time, we're gonna implement a QOLV encoder and we're gonna do it in C#!

To start with, we're going to assume our input is a folder of QOI files, for ease of implementation.

And we'll use QoiSharp to grab bytes from the images. We'll also assume the same size etc for all of them.

Note that I am using LINQ to do this, so it is all lazy. This is good because, unlike calling `ToArray`,
we don't have to store everything in memory.

For the same reason, when we write the encoder we will be writing to a `Stream` that we can just point directly to a file.

So, here's code that decodes a folder of QOI images to pixels:

```csharp
using QoiSharp;

var imageFiles = Directory.GetFiles(args[0])
                   .OrderBy(f => int.Parse(f.Split("/").Last().Split(".")[0]))
                   .ToArray();
var decodedImages =
  imageFiles.Select(path => QoiDecoder.Decode(File.ReadAllBytes(path)));

var firstImg = decodedImages.First();
var header = new QoiImage(Array.Empty<byte>(),
                          firstImg.Width,
                          firstImg.Height,
                          firstImg.Channels,
                          firstImg.ColorSpace);

// ARGB
uint ArgbFromChunk(IReadOnlyList<byte> chunk)
    => chunk[2] + ((uint) chunk[1] << 8) + ((uint) chunk[0] << 16) + ((uint) 0xFF << 24);

var pixels =
  decodedImages.SelectMany(img => img.Data.Chunk(3).Select(ArgbFromChunk));
```

Now, for the encoding part. We're going to have to tweak
[the QoiSharp encoder](https://github.com/NUlliiON/QoiSharp/blob/61d9218/src/QoiSharp/QoiEncoder.cs#L17-L172)
here, as it's not designed for what we want, but it's a good base to work off of.

Let's make a new class in another file, just to clean things up a little:

```csharp
using QoiSharp;

namespace qolv_encoder;

public static class Encoder
{
    public static void Encode(Stream output,
                              IEnumerable<int> pixels,
                              QoiImage metadata,
                              uint fCount,
                              double fRate)
    {
    }

    // QOLV decoder left as an exercise to the reader
    public static (IEnumerable<int>, QoiImage, uint, double) Decode(Stream input)
        => throw new NotImplementedException();
}
```

Let's also write some quick helper functions to make things easier:
```csharp
public static void WriteUInt(this Stream s, uint v) => s.Write(
  new[]
  {
      (byte) (v >> 24), (byte) (v >> 16), (byte) (v >> 8), (byte) (v)
  });

public static void WriteInt(this    Stream s, int    v) => s.WriteUInt((uint) v);
public static void WriteDouble(this Stream s, double v) => s.WriteUInt((uint) BitConverter.DoubleToUInt64Bits(v));
```

The first thing the original encoder does is a load of error checking, which we will skip and just #YOLO it.

The next thing it does is write the header, so let's do that!

```csharp
// output.Write(new byte[] { 0x71, 0x6F, 0x6C, 0x76 });
output.Write("qolv"u8);
output.WriteInt(metadata.Width);
output.WriteInt(metadata.Height);
output.WriteUInt(fCount);
output.WriteDouble(fRate);
output.WriteDouble(fCount / fRate);
output.WriteInt((int) metadata.Channels);
output.WriteInt((int) metadata.ColorSpace);
```

And C# syntax I didn't know existed until now - yeah, you can use `"str"u8` to get a byte array!

Now, we need some basic state, and the original code does some fancy stuff to loop over 3/4 at once, but we've already handled that!:
```csharp
byte prevR = 0, prevG = 0, prevB = 0, prevA = 255;
var run = 0;

foreach (var pixel in pixels)
{
    var a = (byte) (pixel >> 24);
    var r = (byte) (pixel >> 16);
    var g = (byte) (pixel >> 8);
    var b = (byte) pixel;
```

Now, we process run-length-encoding:
```csharp
    if ((a, r, g, b) == (prevA, prevR, prevG, prevB))
    {
        run++;
        if (run == 62)
        {
            output.WriteByte((byte) (QoiCodec.Run | (run - 1)));
            run = 0;
        }
    }
    else
    {
        if (run > 0)
        {
            output.WriteByte((byte) (QoiCodec.Run | (run - 1)));
            run = 0;
        }
```

Then, we need to implement indexing:
```csharp
        var idxPos = QoiCodec.CalculateHashTableIndex(r, g, b, a);

        if ((a, r, g, b) == (index[idxPos], index[idxPos + 1], index[idxPos + 2], index[idxPos + 3]))
            output.WriteByte((byte) (QoiCodec.Index | (idxPos / 4)));
        else
        {
            index[idxPos]     = a;
            index[idxPos + 1] = r;
            index[idxPos + 2] = g;
            index[idxPos + 3] = b;
```

And now the diffing chunks:
```csharp
            if (a == prevA)
            {
                int vr = r = prevR;
                int vg = g = prevG;
                int vb = b = prevB;

                var vgr = vr - vg;
                var vgb = vb - vg;

                if (vr is > -3 and < 2 && vg is > -3 and < 2 && vb is > -3 and < 2)
                    output.WriteByte((byte) (QoiCodec.Diff | (vr + 2) << 4 | (vg + 2) << 2 | (vb + 2)));
                else if (vgr is > -9 and < 8 && vg is > -33 and < 32 && vgb is > -9 and < 8)
                    output.Write(
                        new[]
                        {
                            (byte) (QoiCodec.Luma  | (vg  + 32)),
                            (byte) ((vgr + 8) << 4 | (vgb + 8))
                        });
                else output.Write(new[] { QoiCodec.Rgb, r, g, b });
            }
            else output.Write(new[] { QoiCodec.Rgba, r, g, b, a });
```

And just some finishing touches:
```csharp
        }
    }

    prevA = a;
    prevR = r;
    prevG = g;
    prevB = b;
}

// write terminator
output.Write(QoiCodec.Padding);
```

## Wew, thats a lotta code

...well, quite modest for being an entire ~~image~~ video encoding format.

Let's take a quick break, here, have a picture of two of my cats:

<img src="/sink/quiet_qopv/izzy_and_pebbles.jpg" class="max-w-100 w-full" />

Now, let's hook this puppy up! (back to `Program.cs`, where we were reading files):

```csharp
using var stream = File.Create(args[1]);

var sw = System.Diagnostics.Stopwatch.StartNew();

qolv_encoder.Encoder.Encode(stream, pixels, header, (uint) imageFiles.Length, 60);

sw.Stop();

Console.WriteLine($"Encoded {imageFiles.Length} frames in {sw.Elapsed.TotalSeconds} seconds");
```

Now let's try it!

Note that when running this, the memory usage stayed basically constant at roughly 122MB,
which shows that the use of `IEnumerable` and `Stream`, even if reducing performance,
is having the intended RAM use effect, as opposed to loading an entire video into RAM.

```sh
$ dotnet run ../qoi ../out.qolv
Encoded 109574 frames in 274.900761 seconds
```

This works out to a very fun 398.59 fps, for essentially decoding and re-encoding QOI.

Now, the proof is in the pudding...
```sh
$ ls -l out.qolv
.rw-r--r--  588M cain  2 Mar 17:45  ../out.qolv
```

Holy crap, we beat the 1080p webm, and its lossless!

## What about audio tho

IDK use [QOA](https://qoaformat.org/).

## H.264 supports lossless right?

Well, yes, H.264 does support lossless!
Let's encode a video and extract a few frames:

```sh
$ ffmpeg -i No\ Mana\ A⧸V\ Set\ @\ Gravity\ 2021\ \[IMRPKeKBa5A\].webm -s 192x108 -sws_flags neighbor -sws_dither none -crf 0 no_mana_lossless.mp4
$ ffmpeg -i no_mana_lossless.mp4 no_mana_lossless_1.png
$ ffmpeg -i no_mana_lossless.mp4 -ss 0:10 no_mana_lossless_2.png
$ ffmpeg -i no_mana_lossless.mp4 -ss 0:30 no_mana_lossless_3.png
$ ls -l no_mana_lossless.mp4
.rw-r--r-- 426M cain  2 Mar 19:03 no_mana_lossless.mp4
```

<div class="flex flex-wrap gap-5">
  <img src="/sink/quiet_qopv/h264_lossless_1.png" class="max-w-384px w-full" />
  <img src="/sink/quiet_qopv/h264_lossless_2.png" class="max-w-384px w-full" />
  <img src="/sink/quiet_qopv/h264_lossless_3.png" class="max-w-384px w-full" />
</div>

Now, this looks fine, and weighs in smaller than QOLV!

However, what's the catch? Well simply, here's what it looks like in VLC:

<div class="flex flex-wrap gap-5">
  <img src="/sink/quiet_qopv/vlc_1.png" class="max-w-384px w-full" />
  <img src="/sink/quiet_qopv/vlc_2.png" class="max-w-384px w-full" />
</div>

Yikes.

## Conclusion

So yeah, there's a lossless compressed format that appears to work well for pixel art.

If you want to download a copy of the file, [here you go](https://f.yellows.ink/quiet_system_no_mana.qolv).

This is utterly useless, but see you back here soon!  
  -- Yellowsink