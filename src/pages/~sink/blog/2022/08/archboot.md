---
layout: "^layouts/QuietLayout.astro"
title: Arch Boot Issues
description: Fixing a broken arch system
pubDate: "2022-08-27"
physPubDate: "2024-07-26"
tags: ["MIGRATED"]
---

*note: migrated over from my website at https://yellows.ink/archboot*

# Help! My Arch Linux wont boot!

## The problem:
1. You use Arch Linux
2. You updated your packages (`pacman -Syu`, `yay`, etc.)
3. Your pc no longer boots even when you manually select your partition

## A solution:

This solution assumes that:
 - Your system is UEFI (if you're not using a dinosaur it almost certainly is)
 - Your boot directory is missing grub and initramfs images
 - You arent scared to death by a terminal (in fact I assume you have no GUI)

## Before we begin:
If you do not know which partitions are your root and boot partitions, and are
not comfortable finding them on a cli of a live disk, boot into a GParted live
CD/USB and figure out which ones they are.

### Boot into a live environment

If you are the kind of nerdy person who uses Arch Linux you may have a live USB
*just chilling somewhere*. I checked the two USB sticks sat on my desk and found
that one had Arch on and one Artix. Neat.

If you don't, use someone else's PC (or a Windows partition if you have one!)
to download and burn a linux live disk to it. I'm partial to artix-openrc but
you can do whatever you like - if you use something graphical with a desktop
environment you may even get user friendly Wi-Fi setup which will be helpful
later!

Boot into it using your boot menu. You may have to mash keys, but since my pc
wasn't booting it took me into UEFI settings anyway so I could boot it from there.

### (optional) Get your environment comfy

If you will be working on the terminal for all of this (as I do) then you'll
want to promote yourself to root (just don't do anything stupid with it, please).

```sh
sudo su
```

If you are using an environment with no GUI, and if you do not use the QWERTY
keyboard layout, you can switch to your preference now.

I use colemak:

```sh
loadkeys colemak
```

### Connect to the internet

We mainly just need internet to get pacman to play ball, but I suppose you
can use it to look things up if you need to.

If you have plugged your pc in with ethernet, its almost certainly working
out of the box and you can skip this step.

If you have a GUI with a wifi widget on the panel you can probably skip this
and just connect with that.

Anyway - how to connect with raw wpa_supplicant!

First, create a suitable config file:
```sh
nano /etc/wpa_supplicant/wpa_supplicant.conf
```
```
ctrl_interface=/run/wpa_supplicant
update_config=1
```

Now you need to know your interface name. Its probably `wlan0` but you can test
other names by using commands like: `ip link`, `iw dev`, `ls /sys/class/net` etc.

Start wpa_supplicant, substituting in your interface name:
```sh
wpa_supplicant -Bi interfacename -c /etc/wpa_supplicant/wpa_supplicant.conf
```

Finally, its time to connect to the network!
```sh
wpa_cli

> scan
OK
<3>CTRL-EVENT-SCAN-RESULTS
> scan_results
<A LIST OF FOUND WIFI NETWORKS GOES HERE>

> add_network
0
> set_network 0 ssid "MY_NETWORK_NAME"
> set_network 0 psk "A_VERY_SECURE_PASSWORD"
> enable_network 0
<2>CTRL-EVENT-CONNECTED - Connection to <ADDRESS> completed <EXTRA CRAP>

> quit
```

You may `save_config` in `wpa_cli` before you `quit` if you like, but we won't
be shutting this live env down until we're done so its okay.

### Internet Pt. 2 - Obtain an IP address

Now you have a connection you need an IP.

If your live environment uses dhcpcd, then simply:
```sh
dhcpcd
```

-and then WAIT until it finishes. It WILL take a while, just let it run.

It'll spit you back out onto the console when its finished.

If you use dhclient, then:
```sh
dhclient
```

dhclient is in my experience somewhat faster, but also will spit you
back out when its done, just leave it.

Now, run:
```sh
ping google.com
```
a few times until it starts outputting replies at a regular rate. They look a bit like:
```
PING google.com (172.217.16.238) 56(84) bytes of data.
64 bytes from lhr48s28-in-f14.1e100.net (172.217.16.238): icmp_seq=1 ttl=115 time=15.7 ms
64 bytes from lhr48s28-in-f14.1e100.net (172.217.16.238): icmp_seq=2 ttl=115 time=35.3 ms
64 bytes from lhr48s28-in-f14.1e100.net (172.217.16.238): icmp_seq=3 ttl=115 time=86.4 ms
```

### Mounting disks

For this, you'll need to know what drive your system is installed on.
You'll also need to know which partitions are your root and boot partitions.

For me, my root partition was `/dev/nvme0n1p2` and my boot `/dev/nvme0n1p1` (yeah, I know
those look weird compared to the standard sdXX pattern, its what NVMe drives do lol).

Mount these as so:
```sh
mount /dev/nvme0n1p2 /mnt
mount /dev/nvme0n1p1 /mnt/boot
```

Finally chroot in. You may find that the live disk youre using has specific tools for this.

On Arch for example you should use `arch-chroot` and on Artix, `artix-chroot`.

```sh
chroot /mnt
```

### Fixing your machine

We are going to tell pacman to reinstall your kernel. This will replace any missing files
and will also run the mkinitcpio hooks correctly to build initramfs images to the right places.

I use `linux-zen`, so I would substitute `linux` for `linux-zen` here.
You can do the same for your custom kernel, or just leave it as is if you use the stock kernel.

```sh
pacman -S linux
```

Once thats done, we will re-setup grub from scratch.

Pick a sensible name for your bootloader, for example `grub-arch`.

Then get to work!
```sh
grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=SENSIBLE_NAME
grub-mkconfig -o /boot/grub/grub.cfg
```

### Removing unnecessary EFI entries

Run efibootmgr and see the list of entries you get
```sh
efibootmgr

BootCurrent: 0000
Timeout: 2 seconds
BootOrder: 0000,0001,0002
Boot0000* grub-endos    <stuff here>
Boot0001* UEFI: hp v212w PMAP   <stuff here>
Boot0002* UEFI: hp v212w PMAP, Partition 2      <stuff here>
```

Lets cleanup the entries we dont need: 0001 and 0002
```sh
efibootmgr -Bb 0001
efibootmgr -Bb 0002
```

And now you should only have the entry/entries you need:

```sh
efibootmgr

BootCurrent: 0000
Timeout: 2 seconds
BootOrder: 0000
Boot0000* grub-endos    <stuff here>
```


### And violà

Exit out of your chroot (type `exit` until youre out!) and then `reboot`.
GG EZ, enjoy your day :)

P.S. keep a live USB around next time :p
