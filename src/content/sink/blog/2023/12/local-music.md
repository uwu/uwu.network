---
title: How I consume music
description: The ins and outs of my local music library
pubDate: "2023-12-19T16:01:00"
tags: ["AUDIO"]
---

# How I consume music

This is probably going to be a relatively long post, as I have a lot of ground to cover:
 - General views about audio I hold
 - How I tend to listen to my music and my preferences
 - Hardware and software preferences
 - How I organize my local music library
 - What the process looks like for adding something into it

## General views about audio

This is the obligatory part of a post about audio where I make all the audiophiles angry!

I hold a very scientific view on audio technology, you won't find me buying gold-plated USB cables and network switches.

Lukewarm take #1: for basically every consumer, lossy compression is just fine,
and you really do not need to be carrying FLACs around on your phone.
The only real exceptions to this may be critical listening environments, and environments where you would want to use
24bit audio, which most lossy formats reasonably don't bother with.

AAC does support 24 bit 96kHz as a max, but realistically, if you find 16 bit 44.1kHZ isn't enough
(which, lukewarm take #2: it definitely is), you'll probably end up dragging around FLACs and nothing I write here will
convince you otherwise.

Amplifiers are [unnecessary](https://youtu.be/a3moaaOpYZM) unless your headphones genuinely have power issues
(possible examples include Sennheiser HD600s and Beyerdynamic T1s). You don't need a fancy one.
I make no real claims on fancy DACs but I use the DACs in my laptop, PC, Sony headphones, and KZ AZ09s and don't find
them an issue.

I have experienced noise on my laptop, and I'm 90% sure this is a software issue to do with Pipewire or ALSA as
enabling "Auto-Mute Mode" in alsamixer fixes that just fine.
The KZs have the best DAC of any of my devices as far as I'm aware. No noticeable noise floor at all.

The DAC in my portable CD player (A cheap Arafuna model) has horrid noise, so yes, cheap DACs can be shit, but let's be
real here. The Truthear Shio has two Cirrus Logic CS43198 chips.
This DAC chip costs [£13.98 at Mouser](https://www.mouser.co.uk/ProductDetail/Cirrus-Logic/CS43198-CNZR),
and if I bought 4,000 of them, as a large audio company manufacturing products might, it drops £8.57 per chip.

Obviously that's not all that goes into a product like this, as the Shio retails for $70, but a good DAC is *not*
bank-breaking. Don't let yourself get scammed. The Apple headphone jack dongle is *probably* fine for you.

I like to think about my audio gear in a couple of camps:
 - hi-fi gear with which I care about sound
 - convenience gear that I can use on the daily easier
 - "nice-to-haves" that don't fit either of these

Finally, relatively hot and biased take #3: CDs are the "best" format for physical music. I concede that SACD has better
quality and larger runtime, but who the hell has a SACD player or SACDs?
CD is lossless and as long as you take care of your disc won't really degrade, is perfectly reproducible.
If you care about what scientists have to say about audio, it is basically impossible for a modern mix on vinyl records
to sound better than a CD. Analog has lost, sorry, the past, present, and future is digital audio workstations,
and so digital masters, and so digital delivery medium.

## My preferences

So first, this way of organizing your library hinges hard on your style of listening matching mine:
I am an album listener. My preferred way to listen to music is to put on an album and listen it fully through.

Obviously there are exceptions to this, but if you are the kind of listener who listens to random bits of everything
from everywhere and uses playlists, streaming services are built for people like you, just stick with the least crap
streaming service you can find.

If you are a more classic music listener like this, the kind of person who might have a crate of records or shelf of CDs,
having local music is a nice prospect - you can use software of choosing, keep your music forever with no strings attached,
and you don't need to be online nor deal with DRM.
It's like being able to take your entire shelf of CDs with you in your pocket, like the iPod promised 22 years ago!

Having a streaming service is still nice for easy high quality access to random tracks, or albums you don't have in your
library yet, etc.
They let you legally access any song you want near instantly, so, I still have Apple Music on my phone.
I do not like AM as much as I once did, mainly due to their title-casing and censoring of song titles, but realistically
it's a good service I think.

The software players I like are [strawberry](https://strawberrymusicplayer.org/) on destop and
[poweramp](https://powerampapp.com/) on Android.

The tagger I use is [Musicbrainz Picard](https://picard.musicbrainz.org) and I re-encode files with
[GNOME Sound Converter](https://soundconverter.org/) (yes, a rather boring and basic tool, I know!,
the value is in its batch processing being way easier to do than ffmpeg etc.)

I like Opus the most for audio storage as it's the best compressing format, the only real drawback being that the way
it stores album art makes adding large embedded art very computationally expensive, but that if anything, forces me to
not waste disk space!

My audio hardware consists of:
 - The Sony WH1000-XM4 as my daily driver, EQ'd to fix the bad tuning, as its convenient, has ANC, etc.
 - The Truthear x Crinacle Zero as the wired IEM of my choice, when I want something that sounds good or has no latency,
   and I don't have to worry about bluetooth and battery etc. It is relatively low end but sounds pretty great anyway!
 - The KZ AZ09, a low end bluetooth IEM adapter, which I used to use for listening on my IEMs with my phone.
 - A cheap Arafuna portable CD player: sometimes a man just wants to put a physical disc of polycarbonate into a
   physical piece of machinery, press a physical button, then hear music. That's all I ask.
   The noise floor is horrendous but for involved listening I'm usually listening on my laptop anyway.

## How its organized

First rule: file naming. Every file has a place.
I'm not too OTT about this, but I do have general rules I like to follow.

The non negotiables:
 - `~/Music/<album artist>/<album>/<files>`. The album artist and album name should be as is in the tags.
 - songs should start with two-digit numbers for tracks, or if two discs, one digit disc number, hyphen, track no.
 - Ideally, songs should follow the form `disc-track Artist - Name.opus`, omitting the `Artist - ` part if the artist
   is the same as the album artist for all songs. This is not very *strictly* followed in my case but that is mostly
   because I'm working on writing my own library manager that will enforce this for me, so its not worth the effort
   right now ;)

Next: tags.
 - Tags should come from Musicbrainz with little deviation (some allowable tweaks including removing things like
   "(Deluxe Edition)" from album names). I use Picard for this.
 - Album art should be placed, in the highest available quality, into cover.jpg or cover.png in the album's folder.
 - This should be converted into a JPEG of maximum 750x750 resolution to be embedded in the file,
   which is to prevent problems with players trying to pull 10MB PNGs out of Opus tags
   (*ahem, poweramp freezing for 10 seconds to play a track, ahem*).

Finally:
It's not worth a whole Artist/Album/ structure for a single file, so singles go in `~/Music/[singles]/Artist - Song.opus`,
alone. In this case, embedding a full size album art is fine, but preferably JPEG.

If the file is an MP3 (my library is mixed from before I started using Opus), then there is no technical reason against
large embedded album art other than redundancy, so feel free to dump a 30MB PNG into a single MP3, whatever.

## Adding an album: from start to finish

The following is what the process may look like for adding a new track.

### Step 1: Sources

This bit is mostly irrelevant to someone else wanting to manage their library in a similar way, but I'll include it
for completeness. :)

Generally, there's a few places I might grab music from: Bandcamp, CDs, Soundcloud, etc.

If you're coming from Soundcloud you get an Opus or MP3 file, and I'd just tag that and use it as is.
If you're coming from Bandcamp you'll get FLACs, and I squirrel those away onto a hard drive for safekeeping,
then transcode them (see the next section) ready for my library proper.

There are many ways to rip CDs, but the method I use is the same as that on https://eacguide.github.io, and results in
rip quality deemed suitable for the *exacting* standards of archival trackers.

I use Exact Audio Copy. It works fine under Wine.

1. setup: the first time you use EAC, get a relatively popular CD, and put it into your drive. You should get a popup
   asking you to configure AccurateRip. If this option is presented, do it!
   ![](https://eacguide.github.io/img/eac03.png)
2. setup: in EAC options > Extraction, turn on "fill missing offset samples with silence" and "synchronize between tracks",
   turn off "delete leading and trailing silent blocks", and set "error recovery quality" to high.
   In general, set "on unknown CDs" to "automatically access online metadata database", and turn on "create log files always in english".
   In tools, enable writing an m3u playlist, extended information, turn off UTF8, enable automatically writing a status report,
   enable appending a checksum to the status report, and turn off beginner mode.
   Disable normalize.
   In filename use `%tracknr2% - %title%`, for various artist naming scheme use `%tracknr2% - %artist% - %title%`,
   and disable replacing spaces by underscores.
3. setup: in Drive options > extraction method, click detect read features. If your drive supports Accurate Stream,
   turn it on. Use secure mode. Turn on drive caches audio data, and disable C2 error information.
   Whatever you do, do not use fast mode or burst mode!
   Go into the drive tab and click autodetect read command.
   Go to the offset/speed tab. If you've already done accuraterip config, the top half will be grayed out.
   If it's not, make sure you "use read sample offset correction", not "combined read/write" correction. Get the number
   from [here](http://accuraterip.com/driveoffsets.htm).
   To test if you need "Overread into lead-in and lead-out", and its not grayed out, uncheck "use accuraterip",
   put a popular CD in the drive, click "detect sample offset". If the result says it can overread both,
   or it can overread out with a positive offset, or it can overread in with a negative offset, leave it on, else turn it off.
   Make SURE you turn "use accuraterip" back on again after this check.
   Set speed selection to current and turn on allowing speed reduction.
   In the Gap Detection tab, use Method A and Secure mode. If you get stalls or obviously wrong, try methods B and C,
   and failing that Accurate instead of Secure mode.
4. setup: metadata options. This is not massively important to me as I'll be tagging my files with Picard later,
   but it's nice to set freedb up so you can get basic metadata easily :)
   In Metadata options > freedb enter your email and hit "get active server list". Enable the last option.
5. setup: compression options. Use external program, user defined, `.flac`, `C:\Program Files (x86)\Exact Audio Copy\FLAC\flac.exe`,
   `-8 -V -T "ARTIST=%artist%" -T "TITLE=%title%" -T "ALBUM=%albumtitle%" -T "DATE=%year%" -T "TRACKNUMBER=%tracknr%" -T "GENRE=%genre%" -T "PERFORMER=%albuminterpret%" -T "COMPOSER=%composer%" %haslyrics%--tag-from-file=LYRICS="%lyricsfile%"%haslyrics% -T "ALBUMARTIST=%albumartist%" -T "DISCNUMBER=%cdnumber%" -T "TOTALDISCS=%totalcds%" -T "TOTALTRACKS=%numtracks%" -T "COMMENT=%comment%" %source% -o %dest%`,
   delete wav, high quality, no crc, no ID3, check return code.
   In the ID3 tag tab, turn everything off except write cover to folder, and use a naming scheme of your choice.

6. Insert your CD!
7. Get the metadata from freedb, to save you time.
8. This step is important; go to Action > check "Append Gaps to Previous Track (default)", and then Action > Detect Gaps.
   Then click Action > Create CUE Sheet > "Multiple WAV files with Gaps... (Noncompliant)".
   If you will be sharing your uploading log for piracy reasons, make sure you do not rip into a folder containing your
   username, as manually modifying the log file will cause your files to be untrusted, in fact, never modify the log directly,
   always make a copy and then open that.
9. Action > Test & Copy Selected Tracks > Compressed... and choose your output folder. Leave it to run... and you're ripped!

### Step 2: Encoding

At this step, I compress the files (if FLACs), and put them into a proper directory structure all at once.
I drop the files into GNOME Sound Converter with these settings:
 - Into folder `~/Music`
 - Create subfolders artist/album
 - Same as input but replacing the suffix
 - Opus, Very High
 - Everything else turned off

And let it run

### Step 3: Tagging and Naming

Now for the fun bit. Step 1 is to drag the folder onto Musicbrainz Picard, click the "unclustered files" tab, click
cluster (not necessary but speeds up the auto searching process a lot), then once youve done this for a few files,
grab them all and press Lookup. If that fails to yield good results hit scan.

Now you should have the album listed on the right. If the number of tracks is wrong or you have problems, you can
right click > other versions to pick the release you have, and correct them manually by dragging files and dropping them.

Next, I go album by album, and open the release in my browser, then go to the release group, and check each *digital*
release to find the highest quality album art. I download this to cover.jpg/cover.png in the album folder, convert the
image to a 750x750px JPEG, then, with the album selected, drag that onto the cover art in picard.
Make sure picard is set to *Replace* album art, not *Append* it before you do this.
Then, now you've got all the tags looking good, hit ctrl-s on the album to save all the tags and embed the downscaled
album art. Done!

### Step 4: Getting it everywhere

I have my `~/Music` folder on my pc symlinked from my MEGA cloud storage account, so everything just kind of works:tm:
there, and for my android phone i use a scheduled FolderSync set to always pull from remote, to keep it in check.

## The Future

I am currently working on an audio player and library manager called Powerplay. Once this is complete I plan to make it
the ultimate software for managing a library in this way, hopefully!

Work in progress...
