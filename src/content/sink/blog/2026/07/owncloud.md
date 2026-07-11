---
title: Giving Up on Self-Hosted Storage
description: Sometimes the best course of action is just giving Google £15
pubDate: "2026-07-11T14:42:00"
tags: []
---

# Giving Up on Self-Hosted Storage

For the past few years, I've been self hosting [ownCloud Infinite Scale](https://owncloud.com/). A non-corporate cloud service appeals to me and self hosting is a really nice way to achieve that. I had also previously been using a hosted Nextcloud server, so the move felt convenient at the time.
This would also save me money - I could point it at Backblaze B2 for blob storage, and pay only $6/TB-month, billed pay-as-you-go.

Unfortunately, all I had available to host it was Michiru, my BuyVM KVM slice. And more importantly, I did not realise that ownCloud and Nextcloud both require rather a lot of resources.
For reasons beyond my understanding, my ownCloud Infinite Scale server would use hundreds of megabytes of RAM, as much as I could possibly give it, and would also pin my server to 100% CPU use. Many times it caused an OOM.

For a piece of software that is primarily designed to just ferry data about over the network, this seemed absurd, and none of the alternatives are any better.

ownCloud Classic is more heavy than oCIS, Nextcloud is an oC Classic fork with all the same performance issues, Seafile is dogshit, and Oxicloud is written by Claude.
The solution I therefore landed on was to just do it myself, and reimplement an ownCloud-like server in Rust, and do so in such a way that I could reuse their syncing apps.

Unfortunately, this is a LOT of work, and I did not get far enough in after a year of the project existing to be able to use it, due to just generally being really quite busy, and I was getting impatient of my server being really slow all the time, so I began to investigate alternatives.

The first solution I looked at was iDrive Photos, but you could only upload to their photo storage service from mobile, and their apps are kinda shit. $0.25/month for 100GB of cloud storage is a pretty sweet deal though. Then pCloud. pCloud is kind of an awesome service, their apps and website are really nice and its very professionally made. It also supports a VFS on Linux using FUSE which is pretty much unique to it. They also sell lifetime storage plans, which is a nice selling point. Even so, their pricing isn't overly competitive for smaller quantities because I do not need 500GB of storage, I only use about 50-60GB.

I felt somewhat unsure on where to go, but evaluating all the options led me to one place: Just Buy Google Drive. I paid £12.99 for a year of 100GB of storage, renewing at £15.99, and that's really rather competitive pricing. Let's compare!

For this, I am paying £1.08/mo for 100GB of storage, which is £10.83/TB-month. This is much more than the £4.47/TB-month Backblaze B2 costs, but let's consider real world usage.
My ownCloud server is looking after 37GB of data, but due to rather poor implementation, the storage bucket backing it is... 83.9GB. This is going to cost me £0.37/month, much less than £1.08.
So there are real savings to this - though of course this is assuming you consider the hosting of ownCloud free, which I basically am since I already rent the server it runs on.

And consider what happens when this scales up, if I was actually using all 100GB of my drive storage I'd still just be paying a pound a month. If I stored 100GB in ownCloud, assuming the same amplification rate to Backblaze, that would be 100 * 83.9 / 37 = 226GB's worth which is £1.01.
Oh.

Realistically all the savings I get from being able to use a cheap block storage provider is just gained from being pay-as-you-go, as the actual price difference is eliminated by ownCloud IS storing more data than it should be.

And even underutilising it as I am, I will happily pay 70p per month to have my cloud storage actually be fast, convenient, and to free up space on my server to host more interesting stuff. Perhaps my friends could stop paying for hosting for our Factorio server if Michiru has enough spare power for it now.

I need you to understand that when Michiru is hosting oCIS, her CPU use is pinned, she spends something like 100-200MB/s of disk read just swapping constantly, and uses all her RAM.
Without oCIS running she can sit with an idle disk and only 20% CPU use on average. That's a HUGE difference! Not to mention that the RAM headroom helps everything keep running smoothly when an expensive operation such as me uploading photos to my portfolio (thumbnail generation) or flaresolverr waking up a headless chromium briefly need to briefly use much more resources than they do at idle.

As for how I'm going to actually make it all work, I'm using [Insync](https://insynchq.com). They provide a cross platform sync client that won't explode if you point two instances of it at the same folder from your Linux and Windows dual boots, and support selective syncing so that I can keep my separately synced oCIS spaces intact, as selectively synced folders in Drive.

Finally, I just need to move over the shared links, of which I have a fair few. This is a luxury of having self hosted my storage this whole time, in fairness, as I can now just redirect all those links since I control the domain.
Sadly the ownCloud IS database format is absolutely CURSED, and I couldn't make heads or tails of doing this in bulk, but there is a page in the UI that will just tell me all the folders I' ve shared. Cool! I can then just set all these up as redirects in Caddy.
