---
layout: "^layouts/QuietLayout.astro"
title: Demystifying ReplayGain
description: A confusing system with patchy support
pubDate: "2024-03-03T16:19:00"
tags: ["AUDIO"]
---

# Demystifying ReplayGain

I was recently using my phone to listen to my collection of local music, and noticed something.
ReplayGain didn't appear to actually be *doing* anything.

I thought little of it until I checked again to try and tweak it and see if I just had it setup wrong, but no, it was,
in fact, [Poweramp](https://powerampapp.com/)'s issue...
but seemingly only with the specific kind of RG tags I had, specifically with Opus.

So let's figure out how this all works, and what the settings mean.

## The basic principle of operation

So, here's how ReplayGain works.
 1. The audio file is analyzed for overall volume level.
 2. The perceptual volume
    ([measurement method](https://wiki.hydrogenaud.io/index.php?title=ReplayGain_specification#Loudness_measurement))
    and peak volume are written to the audio file's metadata tags (ID3, Vorbis comment, etc.)
 3. If the player understands the tags, it will read off the overall volume of the file, and adjust it to a target.
   * This target depends on the player, and the (confusingly named) "preamp" setting changes this target level.
 4. If the player also has a clipping prevention setting, it will make sure not to boost the file to more than 0dB peak.

## Minutae

So, there is more to it than just this, for example, the overall gain is calculated for *both* each track, and the whole
album, and players can choose which to use.
Using album values means the volume between tracks is preserved within an album.

Also, some players have a second "preamp" or "fallback" value for non-RG files.
This is a simple volume adjustment that, if you take the assumption that your files peak at 0dB, lets you make
non-tagged files sound approximately similar level to actually tagged files.

There are also multiple algorithms. Many modern taggers use the EBU-R128 algorithm for calculating loudness, and these
are stored in different tags!

### Tags: ReplayGain spec

| tag | value | format |
|-|-|
| REPLAYGAIN_TRACK_GAIN | The overall volume of this track in dB | (-)x.yy dB |
| REPLAYGAIN_TRACK_PEAK | The peak sample volume of this track, 1.000000 == full scale | x.yyyyyy |
| REPLAYGAIN_ALBUM_GAIN | The overall volume of the whole album in dB | (-)x.yy dB |
| REPLAYGAIN_ALBUM_PEAK | The peak sample volume of the whole album | x.yyyyyy |

### Tags: R128

R128 gain tags are
[a part of *exclusively* the Opus spec](https://datatracker.ietf.org/doc/html/rfc7845#section-5.2.1),
and this is where support gets a lil patchy.
Poweramp does not support REPLAYGAIN_ tags in Opus, only R128_.
[Strawberry](https://www.strawberrymusicplayer.org/) reads both fine.

This technically is *not* ReplayGain, but it works the same way and gets lumped in.

| tag | value | format |
|-|-|
| R128_TRACK_GAIN | The dB shift needed to normalize the track | (-)xxxx |
| R128_ALBUM_GAIN | The dB shift needed to normalize the album | (-)xxxx |

## `rsgain` (Picard) Settings to be Tuned

- Use true peak (`-t`) -
  Basically, due to how audio works, the true peak of the waveform can be higher than the largest stored sample
  in the file. This does extra work to calculate the actual peak volume.
- Target Loudness LUFS (`-l`) -
  The target to attempt to normalize to.
- Clipping Protection (`-c`) -
  If enabled, applies the "don't clip" handling in the actual RG tags instead of at the player,
  good for players that are too dumb to do this on their own, but screws with the numbers.
- Max Peak dB (`-m`) -
  When using clipping protection, what counts as clipping (0dB is the best choice).
- Opus file tag type (`-o`) -
  This setting switches between REPLAYGAIN_ and R128_ tags.
- Always reference Opus R128_ to -23LUFS -
  This forces use of the only target volume loudness allowed by the opus spec, RFC 7845.

## My suggestion

Use Musicbrainz Picard. Set your settings in the ReplayGain 2.0 / rsgain plugin to:
 - calculate album gain/peak ON
 - use true peak ON
 - reference tags OFF
 - target loudness -18LUFS
 - Clipping Protection Disabled
 - Max Peak 0dB
 - Opus Files Write R128_*_GAIN tags
 - Always reference to -23LUFS *depends on your players. Test first.*

### How do I test if I need this last setting?

I don't exactly have a solid method but here's what I did.
I have four files. An MP3 and an Opus file, both with rsgain `-l -18 -o d`.
Then two Opus files `-l -18 -o r` and `-l -18 -o s`.

Recording those out of strawberry into a DAW I get the following results:

| File              | Peak    |
|-------------------|---------|
| MP3               | -22.3dB |
| Opus RG2.0        | -22.8dB |
| Opus R128 -18LUFS | -9.11dB |
| Opus R128 -23LUFS | -9.11dB |

Strawberry just does not seem to understand R128 values properly. That's a shame.

I repeated the experiment with Poweramp and got the following results:

| File              | Peak    |
|-------------------|---------|
| MP3               | -15.0dB |
| Opus RG2.0        | ~~-1.88dB~~ *No RG support* |
| Opus R128 -18LUFS | -10.1dB |
| Opus R128 -23LUFS | -15.0dB |

In conclusion, for Poweramp, use -23LUFS mode.

As I listen to my music most often in Poweramp, this is how I will tag my files.

I will just enable Strawberry's built in R128 normalization instead of using RG.
