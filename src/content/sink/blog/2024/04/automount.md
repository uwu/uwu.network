---
title: systemd Drive Auto-Mounting
description: A nicer way to deal with my external SSD
pubDate: "2024-04-08T19:39:00"
tags: ["*NIX"]
---

# systemd Drive Auto-Mounting

For the longest time, I've used external drives for many things at once, and the classical tool for this is the
partition.
Partitions, however have a fatal flaw - if you want to change the balance of size between them, you have to physically
copy all the data around. This can be a slow process even on an SSD!
In addition, manually mounting my drives got annoying.

Here's how I setup something much nicer.

## btrfs and subvolumes

The general idea is to, instead of using partitions, use subvolumes. These are a feature of btrfs and are dynamically
sized. They essentially operate like folders that can be mounted and snapshotted as if individual filesystems.

They're relatively easy to set up with the btrfs command line tools.

I set two of these up on my drive, corresponding to my use cases (`osu-portable` and a vaguely named `usb-ssd`).

## From partitions to the subvolumes

Next, you have to copy all your data. No btrfs magic can make this better for you, they're two separate partitions as it
stands, so you have to copy all your data from the second partition into the subvolume on the first.

This takes a while, and if you don't have enough free space in the first partition to contain the files from the second,
you may have to do this in multiple stages with slow resizes in between. Ugh.

Once all your data is on one partition in subvolumes, you can delete the second partition and fill the disk with your
one big partition.

## fstab

So, I had my old mount points set up in fstab like so:
```
# <file system>   <dir>         <type> <options> <dump> <pass>
LABEL=osuportable /osu-portable btrfs  noauto    0      0
LABEL=usbssd      /ssd          btrfs  noauto    0      0
```

I'd need to change this, so run a subvolume list on the drive and note the IDs:
```sh
sudo btrfs subvolume list /mnt
```
```
ID 256 gen 5571 top level 5 path osu-portable
ID 257 gen 6403 top level 5 path usb-ssd
```

Now, I change the fstab to look like this.
```
# <file system> <dir>         <type> <options>                                                                                                      <dump> <pass>
LABEL=usbssd    /osu-portable btrfs  noauto,nofail,x-systemd.automount,x-systemd.idle-timeout=2,x-systemd.device-timeout=0.1,subvolid=256,nodiscard 0      0
LABEL=usbssd    /ssd          btrfs  noauto,nofail,x-systemd.automount,x-systemd.idle-timeout=2,x-systemd.device-timeout=0.1,subvolid=257,nodiscard 0      0
```

 - `x-systemd.automount` tells systemd to automatically attempt to mount the drive if a program tries to access it.
 - `x-systemd.idle-timeout` is how long the drive should be idle before it unmounts it automatically.
 - `x-systemd.device-timeout` is how long to wait for the drive to be plugged in before erroring on access,
    I set this low because Steam tries to access everything that *looks* mounted many times on start, and if the drive
    is missing then having this at a high value makes it very slow to start.

Then run
```sh
sudo systemctl daemon-reload
sudo systemctl restart local-fs.target
```

## SSD TRIM

One complication here is that this is an SSD, so periodic TRIM commands are generally a good idea to keep it running
ideally.

With btrfs specifically, the kernel will automatically TRIM by default as you use the drive. This is nice, but is a
problem here because 'Continuous Trimming' causes a constant low level of drive activity, which means the drive will
never be idle, and never unmounted by systemd automatically!

The better solution here is to use `fstrim.timer`, included with systemd. It will run TRIM on all connected drives once
per week, which can replace continuous trimming.

The `nodiscard` fstab option disables continuous trim, and periodic trim can be enabled with
```sh
sudo systemctl enable fstrim.timer
```

## Waybar Indicator

Given that my drive may or may not be actually mounted at any point, I wanted a way to know!
So I threw together a custom module for my status bar, waybar.

I wrote this script file:
```sh
#!/usr/bin/bash

if lsblk | grep $1 > /dev/null; then
    echo $2
else
    echo $3
fi
```

and this waybar config:
```json
"custom/ssdmnt": {
	"format": "SSD mount: {} ",
	"exec": "$HOME/.config/waybar/mount.sh /ssd y n 2> /dev/null",
	"interval": 4, // should be >2, see fstab
	"tooltip": false
},
"custom/osumnt": {
	"format": "osu: {} ",
	"exec": "$HOME/.config/waybar/mount.sh /osu-portable y n 2> /dev/null",
	"interval": 4, // should be >2, see fstab
	"tooltip": false
},
```

Now I have an indicator on my status bar that reads `SSD mount: n osu: n`, and will say `y` if those subvolumes mount.

Testing time!

Trying to `ls /ssd` printed `"/ssd": No such device (os error 19)`, and when I plugged my SSD in, not much happened -
but then running the ls succeeded, and caused the SSD mount indicator to flip to `y` for a couple of seconds!

Success!

## Current issues with this setup

My file manager of choice, pcmanfm, does not hold active locks on the open folder, and so if you open a folder on that
drive, it'll mount, but then unmount a couple seconds later and boot you back to `~`.
A possible fix for this is to increase the unmount timeout to something like 30 seconds,
or to try a different file manager.

Having the drive unplugged makes Steam take longer to load as it will try to read from the mount points that *appear* to
be there but *aren't* multiple times before loading.
The best fix for this is just a low `device-timeout`. The default is 90 seconds which is crazy, but at 100ms, it doesn't
take too long to blow through the amount of retries Steam will do.
Steam doesn't just listen to mount state changes, it also listens for USB events, so when you actually plug the drive in
it will automatically update and find all the games, which is a nice touch.

Overall, I'm very happy with this setup, and will be using it as is for the forseeable future.
