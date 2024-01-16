---
layout: "^layouts/QuietLayout.astro"
title: Re-testing MS Office on Linux
description: Has the situation improved from Wine 6.x to 8.21?
pubDate: "2024-01-16T22:38:00"
tags: []
---

# Re-testing MS Office on Linux

Last time I tried to run Microsoft Office on Linux was in the Wine 6.x staging / 5.x stable days, and now I'm running
Wine 8.21 staging, so safe to say it's been a while.

I mostly don't mind since I use Office 365 Online and Libreoffice for everything I need, but I wanted to try just out of
curiosity, so I am.

The most sensible thing would probably be to use Office 2021 / Office 365, however I don't feel like a ~4G download,
so ill just use a convenient copy of Office 2019 Pro+ I have sat around on my hard disk. Should be new enough.

After making a new wine prefix to keep everything in, I set my prefix to Windows 10 and run the installer:
```sh
WINEPREFIX=/home/sink/winepref_off2019 wineboot -i
WINEPREFIX=/home/sink/winepref_off2019 winetricks win10
WINEPREFIX=/home/sink/winepref_off2019 wine Office\ 2019\ ProPlus/Office/Setup64.exe
```

The orange "getting things ready" screen appeared just fine, then it crashed..... oh.

A [wine appdb page](https://appdb.winehq.org/objectManager.php?sClass=version&iId=36804)
said that i must use "a 32 bit prefix and winbind".
Also that I must have a working Gecko.

Starting again then:
```sh
rm -rf winepref_off2019
WINEPREFIX=/home/sink/winepref_off2019 WINEARCH=win32 wineboot -i
WINEPREFIX=/home/sink/winepref_off2019 wine iexplore appdb.winehq.org
WINEPREFIX=/home/sink/winepref_off2019 winetricks win10
WINEPREFIX=/home/sink/winepref_off2019 wine Office\ 2019\ ProPlus/Office/Setup32.exe
```

...same. damn.

So, turns out I didn't actually install "winbind", which is a part of samba (this causes "ntlm_auth" errors).
```sh
pacman -S samba
WINEPREFIX=/home/sink/winepref_off2019 wine Office\ 2019\ ProPlus/Office/Setup32.exe
```

I got a "OfficeClickToRun.exe had to close" wine debugger dialog, but then, wow! The installer started!

![](/sink/quiet_office/inst1.png)

Except it doesn't actually go anywhere, it just sits forever there. Damn.

Tried again and got this, ouch.

![](/sink/quiet_office/inst2.png)

![](/sink/quiet_office/inst2-d.png)

I decided to try the suggestion [here](https://appdb.winehq.org/objectManager.php?sClass=version&iId=33762&iTestingId=109718)
and ran
```sh
WINEPREFIX=/home/sink/winepref_off2019 winetricks msxml6 corefonts cjkfonts
```

This did not help so I tried what was suggested [here](https://appdb.winehq.org/objectManager.php?sClass=version&iId=33762&iTestingId=110806)
```sh
WINEPREFIX=/home/sink/winepref_off2019 winetricks corefonts msxml6 msxml4 vcrun2005 vcrun2008 vcrun2010 vcrun2012 vcrun2013 vcrun2019
```
No dice.

Decided to try [this](https://appdb.winehq.org/objectManager.php?sClass=version&iId=34941), minus the win7 part.
```sh
WINEPREFIX=/home/sink/winepref_off2019 wine reg.exe ADD HKEY_CURRENT_USER\\Software\\Wine\\Direct3D
WINEPREFIX=/home/sink/winepref_off2019 wine reg.exe ADD HKEY_CURRENT_USER\\Software\\Wine\\Direct3D /v MaxVersionGL /t REG_DWORD /d 0x30002
WINEPREFIX=/home/sink/winepref_off2019 winetricks riched20 msxml6
```

Still no!!!

Testing [one more before I give up](https://appdb.winehq.org/objectManager.php?sClass=version&iId=34941&iTestingId=111893)
```sh
WINEPREFIX=/home/sink/winepref_off2019 winetricks riched20 gdiplus msxml6 mspatcha riched30 dotnet20 dotnet40 mfc100 corefonts
```

Nope I give up. Office 2019 still cannot run in Wine 8.21.

Oh, and that wineprefix is now 2.1GB.
A fresh 32bit one measures 502MB.

Damn.
See you here again soon.

 -- sink
