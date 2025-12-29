---
title: Uploading music to Apple Music
description: From Bandcamp checkout to Apple Music streaming (on Linux!)
pubDate: "2023-08-07T17:33:00"
tags: ["*NIX", "WINE"]
---

# Uploading music to Apple Music

This one is going to smell a lot of my previous post, [*Running iTunes on Linux*](../../2022/12/itunes-linux).

I love [Norwegian electronic artist cYsmix](https://cysmix.com/)'s music,
but some of his older music is not on Apple Music.

From [Voodoism](https://music.apple.com/gb/album/voodooism/864063962) to
[present](https://music.apple.com/us/artist/cysmix/864052992) they all are,
but I liked [Haunted House](https://cysmix.bandcamp.com/album/haunted-house) enough to buy a copy on Bandcamp.
Let's upload it to Apple Music to stream on my phone alongside everything else!

## So what do I need?

You need either the Apple Music app on macOS (...I think? I haven't tried.), or iTunes on macOS or Windows.

Well I run Linux, soooooooooooo Wine it is!

Then you can just move your files in a compatible format (m4a or ALAC) into the automatically add folder,
and iTunes will import it, try to see if it has the music already in Apple's library,
and seeing that it doesn't upload it.

This is a service known as *iTunes Match* and it actually predates Apple Music, though AM includes it for free.

iTunes Match was originally designed to give you free copies on iTunes of music you ripped from your own CDs,
often at higher qualities than you might have got lying around.
Now it just serves to host 3rd party music for you, I guess!

## Let's go!

Firing up iTunes from my app launcher after I installed it in
[my previous blog post on the topic](../../2022/12/itunes-linux), I was met with an error.

"iTunes was not installed correctly. Please reinstall iTunes. Error 7 (Windows error 126)"

I suspected this was a mismatching version of Apple Application Support from messing around with Safari in wine,
so I opened the wine uninstaller, uninstalled Apple Application Support 1.3.0,
and re-ran the [wine-compatible iTunes installer](https://support.apple.com/kb/DL1816), choosing "Repair".

This did not replace AAS, and I got an error that it was missing, with a very clear instruction to uninstall
and reinstall iTunes.

So I did!

And with a running iTunes, bang, first thing I'm asked, "Sign in to iTunes Match".
Yes please!!!!

![A UI telling me that Sign-in is required, to add this computer to iTunes Match, and Apple ID and password boxes.](/sink/quiet_it2_matchsignin.png)

I was quite surprised to see iTunes pick up the Apple TV in the room downstairs just fine.

After some pain trying to sign in (it didn't work), iTunes just crashed.

It would not sign in to the store, with error -50.

I found [a thread](https://discussions.apple.com/thread/250783805) recommending version 12.6.5.3.
I was unsure if it'd work, but I looked.

From there, I stumbled across a [giant list of versions](https://discussions.apple.com/docs/DOC-6562#versions).
The "min build to access accounts" is 12.7.2.58, but it says that 12.6.4.3 (and 12.6.5.3) work too.

I downloaded 12.6.4.3, fully expecting the graphics to be screwed (see my previous blog).

Surprisingly, the graphics worked fine, and there we go!

![A screenshot of iTunes open with a large splash screen featuring a picture of apple music running on a Macbook Pro](/sink/quiet_it2_newertunes.png)
![A dialog telling me that computer authorisation was successful, with an ok button.](/sink/quiet_it2_auth.png)

I decided that now was the time to try uploading, even though my library was empty.

I downloaded Haunted House in ALAC format and dragged it on...

It happily took it, but how to make it upload?

![A screenshot showing Haunted House in my iTunes library with all art and metadata intact.](/sink/quiet_it2_hh.png)

As it wasn't uploading, I removed the files and then tried dragging them onto the iTunes UI.
I had read about an "Upload to iCloud" button, but it wasn't there.

I decided to try the newest iTunes version again. That worked fine, so I stuck with it,
but the real fix was deleting my `iTunes` folder and restarting it.

It started crashing a lot, so I went back.

After some more messing about, I found the secret sauce! File > Library > Update iTunes Music Library!

![A screenshot of the iTunes progress dialog, showing "waiting to upload songs" with a spinner](/sink/quiet_it2_upload.png)

An hour and a half later, it was uploading :)

![A picture of Haunted House in my library, with a big red box drawn around text reading "DOWNLOADED"](/sink/quiet_it2_downloaded.png)

Well that was an hour and a half dubiously spent... Hope to see ya back here soon!

 -- sink
