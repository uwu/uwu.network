---
layout: "^layouts/QuietLayout.astro"
title: "Livestreaming audio to the browser"
description: How uwu radio's new streaming works.
pubDate: "2025-07-06T18:13:00"
tags: ["AUDIO"]
---

# Livestreaming audio to the browser

uwu.network has been operating [an internet radio service](https://radio.uwu.network) since late 2022, nearly 3 years. In that time something that has remained constant is how we actually deliver the audio to clients, and it's not pretty.

We serve complete MP3 files to the client, who fetches them ahead of time and switches from playing one to the next at times instructed to it by the server. This works, but it's incredibly janky, massively increases client complexity, and is just in general not good.

Recently, the idea was posed that it would be cool to allow people to "go live" via uwu radio, to play a set or something, which gave me a fun challenge... this thing has to support live content. That means REAL streaming.

The problem of getting audio from the client up to the server is the easy part - anything pre-existing in virtual dj software isn't really up to scratch so we'll have a custom streaming app that just works however we want. The hard part is browsers, because we don't control what browsers support.

## Off the shelf solutions: why not?

The two main protocols for doing this that exist already are Nullsoft's SHOUTcast, which supports MP3 and HE-AAC, and Xiph's Icecast, that supports Opus and Vorbis, and MP3 and AAC via the server's SHOUTcast protocol compatibility.

This would be fine for delivery to the client, but actually in practice is kind of ass because these servers do their own encoding, and are picky about what you pass them. And while they do support standard HTTP streaming, these are separate pieces of software that I'd have to deploy alongside uwu radio, which just kind of sucks. I wanted something I could integrate.

## The Game Plan

So, when you use an `<audio>` HTML5 element in a browser (or `new Audio()` and puppeting that with JS), it is clever enough to start playing before the server finishes sending the file. This is good for latency of playback, and is generally supported by pretty much any modern container and codec. We can leverage this if we can send an "audio file" that just never stops coming.

Let's pick a codec and container for this, then!

- MP3 is totally an option, it is one of the only reasonably decent lossy codecs with wide browser support, and the container format is pretty nice to work with, in terms of parsing and splitting frames (more on that later).

- AAC would be nicer still in terms of compression, but unfortunately Firefox can be picky about playing it, and you need to put it in an MPEG 4 container, and MP4 might be the worst container I've ever had the displeasure of working with, it's truly horrible.

- Vorbis is just worse than Opus, but I like the idea of using Opus! It's best-in-class, and works everywhere..... kinda.

  - Okay, container then. Webm is streamable in theory, but being a subset of Mastroska it's kinda heavyweight...

  - What about Ogg? Ogg is, in fact, incredibly simple! Believe it or not, but every Ogg page actually starts with fresh magic bytes already, it's super easy to splice! This looks like the choice.

Okay, so we're going to generate a never-ending ogg opus stream. Seems easy, right? Well... not necessarily. Let's start with the structure of an ogg stream, and then I'll cover a couple of the challenges that complicated this.

## The Ogg Container

Ogg is about as simple as you can make a container. It is only really concerned with two things:

- Splitting your data into smaller chunks.

- Multiplexing many streams

We will only be working with one stream, so we can ignore multiplexing and in fact the complete demuxing code that I've written in R&D for this project just pretends it doesn't exist.

So, let's define how a single stream is muxed into Ogg, and define some important terminology:

In Ogg, there are two series of chunks to be considered - the **logical bitstream** and the **physical bitstream**. The physical bitstream is what goes over the wire, and the logical bitstream is what is seen after demuxing.

The codec data, the **logical** bitstream, is sent to the muxer in **packets**. A packet is the smallest single unit that the codec wants to be sent as a single unit. This may be an Opus frame or similar. If you look at the logical bitstream, packets are the discrete chunks that make it up.

The Ogg **physical** bitstream is made of many **pages**. A page contains some amount of data from one of the streams in the container, contains some position info, a checksum, and any page is a valid starting point of the stream as far as Ogg is concerned (though this may not necessarily be true of the codec within!).

The diagram below shows the difference between the physical and logical bitstream:

![](/sink/quiet_ogg/bitstreams.svg)

Obviously, the packets don't always line up with the pages, so we split them up into **segments**. Segments are chunks of packets that are up to 255 bytes in length. When muxing, you emit 255 byte segments of the packet until you run out, and have one segment that is shorter. Then, during demuxing, you collect up segments until you find one less than 255 bytes in size, at which point you join them up into a packet.

Segments are placed tightly into pages:

![](/sink/quiet_ogg/segments.svg)

In reality, pages can hold up to 255 segments, so the pages in this diagram are undersized. When the last segment in a page has a size of 255 - that is, a packet overflows, the next page has a bit set in the header that marks it as being continued.

## Okay, how do we start streaming this then?

So, for sake of argument let's say we already have uwu radio spitting out an ogg opus stream of the current song somewhere (this is non-trivial, but it's a prerequisite), how do we latch onto it and start streaming to a client?

Well the way I have this implemented is that we connect and start getting bytes thrown at the network request handler, so we need to figure out where the hell the start of an ogg page is. To do this, we leverage the structure of a page:

```d
// note this code is demonstrative only
// it is written for humans to read, not compilers
// note Ogg headers are little-endian

enum PageType : byte {
    Continued     = 0b001,
    StartOfStream = 0b010,
    EndOfStream   = 0b100,
}

struct OggPage {
    ubyte[4] magicBytes, // "OggS"
    ubyte    version_, // 0
    PageType pageType,
    ulong    granulePosition,
    uint     bitstreamSerialNumber,
    uint     crc,
    ubyte    segmentTableLength,
    // contains lengths of each segment
    ubyte[]  segmentTable,
    ubyte[]  segments,
}
```

Notice that each page starts with this "OggS" capture pattern. So, the first step is to read the stream byte by byte until we see this pattern. From then on, we know we are in an ogg page and can emit it to the client.

So what happens if we just align ourselves to the start of a page then throw the pages at a client?

Nothing good, that's for sure. Nothing can play it, and ffmpeg can't recognise the codec in the ogg stream at all.

## Okay, why doesn't our stream work?

If you open our stream in a hex editor, you'll see that the data segment is just full of a bunch of data we can't make much sense of. This checks out, since its literally opus stream data!

If you open a working opus ogg stream though, you'll see a small first page that contains the text "OpusHead" and some small extra data, then a small second page that contains the text "OpusTags" and then some data about the encoder and stuff. Finally the third page has the real opus data in it. What are these for?

Well, there is a spec separate to those for ogg and opus that defines how exactly *opus in ogg* should work, and as well as defining the meaning of the granule position, some details about the opus stream within, etc., it defines these two headers.

An Opus Ogg stream starts with two pages, the identification header and comment header, that contain only the following payloads (note these are entire pages, not just packets, you explicitly have to go onto a new page for each one and before starting the stream!):

```d
// ogg page needs type.StartOfStream set
struct IdHeader {
    ubyte[8] magicBytes, // "OpusHead"
    ubyte    version_, // 1
    ubyte    channelCount,
    ushort   preSkip,
    uint     sampleRate,
    ushort   outputGain,
    ubyte    channelMappingFamily,
    ubyte[]  channelMappingTable
}

struct CommentHeader {
    ubyte[8]      magicBytes, // "OpusTags"
    uint          vendorStringLength,
    char[]        vendorString,
    uint          userCommentLength;
    UserComment[] userComments;
}

struct UserComment {
    uint   strLen;
    char[] str;
}
```

I won't get into the details of the channel mapping table, but let's just say that for our use cases, we only ever use `channelMappingFamily = 0`, which allows for only mono or stereo audio, and allows *entirely omitting* the table. Interested readers should refer to [RFC 7845 section 5.1.1](https://datatracker.ietf.org/doc/html/rfc7845#section-5.1.1).

So, we need to generate these headers to send to the client!

Aaaaaand it doesn't work. We can steal them from an existing stream, but that doesn't work (due to mismatching bitstream serial numbers), or we can generate them ourselves, but then the checksums don't match...

## Side Quest: CRC32 and Serial Numbers

First of all, serial numbers. The bitstream serial number needs to be the same for every page here, so we need to either set the header page's serial numbers to match the stream, or set the stream's to match the header. In uwu radio, we set the serial number of every page to the binary for the ascii "UWUR", because there is one global stream, so why not give it a funny serial number instead of something random?

Next checksums. Ogg uses CRC32, but its a weird CRC32 implementation. This took way too much trial and error to get going, but here's an implementation in C#, specially prepared for you and prod validated :)

```cs
static uint Crc32(Span<byte> page)
{
    uint crc = 0;

    foreach (var b in page)
        crc = (crc << 8) ^ OggCrcLookup[((crc >> 24) & 0xff) ^ b];

    return crc & 0xFFFFFFFF;
}

static uint OggCrcLookupVal(ulong idx)
{
    var r = idx << 24;

    for (var i = 0; i < 8; i++)
    {
        if ((r & 0x80000000) != 0)
            r = (r << 1) ^ 0x04c11db7;
        else
            r <<= 1;
    }

    return (uint) (r & 0xffffffff);
}

static readonly uint[] OggCrcLookup;
```

`OggCrcLookup` contains 256 pre-computed values to speed up calculation. You can either swap `OggCrcLookup[x]` for `OggCrcLookupVal(x)`, or pre-fill the table with `OggCrcLookupVal(0)` up to and including `OggCrcLookupVal(255)`.

Now, to fix the checksum of a page, we set its checksum field to all zeroes, then pass it through this Crc32 function.

This lets us change the checksums of a page on the fly before we send it to the client.

## Putting it all together

Now let's look at the actual code looks like for streaming to a new client:

```cs
async Task StreamToResponse(HttpResponse resp)
{
    resp.Headers.ContentType = "audio/ogg";

    await resp.StartAsync();

    var pipe = new Pipe();

    var writerStream = pipe.Writer.AsStream();
    Fanout.Add(writerStream);

    resp.RegisterForDispose(new Helpers.OnDispose(() => Fanout.Remove(writerStream)));

    const uint serialNumber = 0x55575552; // "UWUR"

    await resp.BodyWriter.WriteAsync(Ogg.BuildOpusIdHeader(serialNumber, 2, 3840, 48000, 0));
    await resp.BodyWriter.WriteAsync(Ogg.BuildOpusCommentHeader(serialNumber));

    await foreach (var page in new Ogg.PageEnumerable(pipe.Reader.AsStream()))
    {
        Ogg.SetSerialNumberAndSum(page, serialNumber);
        await resp.BodyWriter.WriteAsync(page);
    }
}
```

First thing we do is tell the client that we will be sending it `audio/ogg` and then start sending the body stream.

Next, we add a stream to our internal fanout utility and register a removal when the connection dies, which is effectively how we "subscribe" to the Ogg data stream.

We then build an Opus ID header with our serial number, 2 channels, 3840 samples of pre-skip (this is recommended in[RFC 7845 section 4.2](https://datatracker.ietf.org/doc/html/rfc7845#section-4.2)), 48kHz sample rate, and 0 output gain adjustment.

Then a comment header, which is empty and reports a vendor string of "uwu radio ogg muxer".

These, together, look like this:

![](/sink/quiet_ogg/headershex.png)

Then, we use a `PageEnumerable` type that listens to the bytes, aligns itself using the `OggS` capture pattern, and then outputs ogg pages as memory spans. Then, we set the serial number and recalculate the checksum, and forward the page directly to the client.

That's it! And it works beautifully!

Here's a video of it in action!:

<video controls src="https://cdn.hyrule.pics/23b84066f.mp4"></video>

## Drawbacks & Conclusion

The main drawbacks here are syncing up metadata, and macOS/iOS support.

The granule positions in the Ogg stream would be PERFECT for syncing up timing EXACTLY, but sadly HTML5 Audio does not expose the current page's granule position value to us in any way - and this makes sense since its an ogg-specific detail! but it means we can't work off of it, we need to use some other mechanism for it (the start of the stream is a known reference on both the server and client and we can work off of that instead).

The situation with Safari is that it has never supported Ogg containers, not Vorbis, and Opus only in a CAF container, until Safari 18.4, available on iOS/iPadOS 18.4, macOS Sequoia 15.4, and visionOS 2.4. This version added full Ogg support including Vorbis and Opus.

If you're on an older Safari that that, it won't work. Might have to make a follow up on this on how to do this for MP3, or if just shipping `ogv.js` works well enough, I'll give in and do that.



I have learnt a lot in the process of getting this going, it's been fascinating, but it has also been a LOT of work. I think I stand at 15 hours so far, plus an hour and a half on this writeup, and it's not even deployed yet! I'm really looking forward to getting this into prod - you bet I'll be posting on fedi about it when I do - and into getting live stream ingest working so that my good friends here at uwunet can perform live sets over the infrastructure. Hey, perhaps we could also add the ability to dump the ingest to a file for server-side stream recording while we're at it? And there's definitely interest in live-streaming visuals as well......

That'll have to wait for now. I hope you found this as interesting as I do, and maybe useful too! I plan to adapt this into a talk I deliver live, but that's a way off yet and god knows I'll have other candidates for interesting shit by then. I might adapt it and fill in gaps, idk, I'll have to see what life does to me.

Look out for that next year ^ ^, and I hope to see you back here soon

 \-- Hazel
