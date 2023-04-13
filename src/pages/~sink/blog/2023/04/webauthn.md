---
layout: "^layouts/QuietLayout.astro"
title: The many faces of WebAuthn
description: The differing experiences of WebAuthn
pubDate: "2023-04-13T11:40:00"
tags: []
---

# The many faces of WebAuthn

[WebAuthn](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
is a technology that allows using secure public-key authentication for a second factor, in web browsers.

It supports storing these credentials in a few places.
On Windows, the *Windows Hello* API is used to store data securely on the operating system, or on a hardware key.

On macOS, relevant APIs are used, including Touch ID,
and on Linux, each implementation can do as it chooses - usually supporting FIDO2
keys and PC Smart Cards.

Mobile devices often tend to include a built-in FIDO2 key, and while your phone will likely let you use a hardware
key anyway, like a [Yubikey](https://www.yubico.com/),
you may be offered to just authenticate with your fingerprint on iOS and Android.

As such, there are very differing user experiences of how using WebAuthn looks and feels on different browsers
and operating systems.

I aim to include a view of all of these, just because I think it's interesting.

I will first test registering and authenticating on [webauthn.io](https://webauthn.io),
as this shows the full signing up and signing in experience.

Second, I will show me authenticating with [Bitwarden](https://bitwarden.com) to show a real world test case,
and to show what signing in without a PIN looks like.

## Windows 10 / Firefox

Under Windows, Firefox uses Windows Hello, so you get a very Windows looking prompt asking you to sign in.
It supports (and requires if it can) setting a PIN,
and while I cannot test it on my pc, should support fingerprints etc.

First up, registering!

Windows asks for my Yubikey's PIN, then to touch my key.

<div class="flex flex-wrap gap-5 children:(max-w-100 w-full)">

  ![](/sink/quiet_webauthn/win_setup.png)

  ![](/sink/quiet_webauthn/win_pin.png)

  ![](/sink/quiet_webauthn/win_touch.png)
</div>

Now, signing in:
<div class="flex flex-wrap gap-5 children:(max-w-100 w-full)">

  ![](/sink/quiet_webauthn/win_pin_signin.png)

  ![](/sink/quiet_webauthn/win_touch_signin.png)
</div>

Finally, this is all I got on Bitwarden:

<img src="/sink/quiet_webauthn/win_signin.png" class="max-w-100 w-full" />

## Windows 10 / Edge

I chose to test Edge as it is Chromium based and comes with Windows.

The UI I was given was basically the same as Chromium under Linux, and interestingly on registering,
it presented me with a QR code to scan (my iPhone did not recognise this code as useful):

<img src="/sink/quiet_webauthn/edge_1.png" class="max-w-100 w-full" />

But after clicking back to see a page almost identical to the first image from Linux Chromium (see below),
but with more Microsoft styling, and choosing to use a hardware key,
I was dropped straight back into Windows Hello, so I didn't bother with any more testing.

<img src="/sink/quiet_webauthn/edge_2.png" class="max-w-100 w-full" />

## Linux / Chromium

Chromium has full WebAuthn support built in, including multiple devices and authenticator PINs.

First - registering:

<div class="flex flex-wrap gap-5 children:(max-w-100 w-full)">

  ![](/sink/quiet_webauthn/chr_register_1.png)

  ![](/sink/quiet_webauthn/chr_register_2.png)

  ![](/sink/quiet_webauthn/chr_register_3.png)

  ![](/sink/quiet_webauthn/chr_register_4.png)
</div>

And signing in:
<div class="flex flex-wrap gap-5 children:(max-w-100 w-full)">

  ![](/sink/quiet_webauthn/chr_signin_1.png)

  ![](/sink/quiet_webauthn/chr_signin_2.png)
</div>

Finally, Bitwarden:

<div class="flex flex-wrap gap-5 children:(max-w-100 w-full)">

  ![](/sink/quiet_webauthn/chr_signin_bw_1.png)

  ![](/sink/quiet_webauthn/chr_signin_bw_2.png)
</div>

## Linux / Firefox

Now, Firefox on Linux and macOS has to use its own implementation of WebAuthn, and it's not really as complete as
some other implementations.

This includes no support for PINs, a more basic UI, and no support for Apple Touch ID.

Here's what registering looks like:

<img src="/sink/quiet_webauthn/ff_register.png" class="max-w-100 w-full" />

And logging in is the same on webauthn.io and Bitwarden due to lack of PIN:

<img src="/sink/quiet_webauthn/ff_signin.png" class="max-w-100 w-full" />

I personally quite like this UI - it follows the browser theme, it's unobtrusive, and, almost uniquely,
requires no extra interaction to use, just touch your key and go!

If your security key requires a PIN though, you will hit issues.

## macOS Ventura / Safari

Time to fire up my macOS virtual machine!:

<img src="/sink/quiet_webauthn/problem.png" class="max-w-100 w-full" />

So I had issues testing Safari, as it has severe rendering bugs (website elements or even entire sites just go white)
in my macOS virtual machine,
so I couldn't test webauthn.io.

I did manage to sign in to Bitwarden blind though!
(Well, I didn't sign in because I didn't pass my key through, but I got the UI up.)

<div class="flex flex-wrap gap-5 children:(max-w-100 w-full)">

  ![](/sink/quiet_webauthn/safari_1.png)

  ![](/sink/quiet_webauthn/safari_2.png)
</div>

## macOS Ventura / Firefox

On macOS, perhaps unsurprisingly, it uses the same UI as on Linux, its own implementation.

I hear that Firefox 113.0 beta improves FIDO2 USB support on Linux and macOS
([source](https://www.phoronix.com/news/Firefox-113-Beta)), so perhaps maybe soon?

<div class="flex flex-wrap gap-5 children:(max-w-100 w-full)">

  ![](/sink/quiet_webauthn/mac_ff_register.png)

  ![](/sink/quiet_webauthn/mac_ff_signin.png)
</div>

## macOS Ventura / Chromium

Interestingly, Chromium also used its own UI under macOS - seems they only share UIs on Windows.

It did, however, prompt to use a passkey (I've never interacted with passkeys before this!),
and offered to turn on Bluetooth before anything else, which was new.

<div class="flex flex-wrap gap-5 children:(max-w-100 w-full)">

  ![](/sink/quiet_webauthn/mac_chrome_passkey_prompt.png)

  ![](/sink/quiet_webauthn/mac_chrome_2_bluetooth.png)

  ![](/sink/quiet_webauthn/mac_chrome_3.png)

  ![](/sink/quiet_webauthn/mac_chrome_4_signin.png)
</div>

## iOS (14)

On iOS, you get a consistent prompt - hold your NFC key near the top of your phone or activate your lightning key,
enter a PIN if necessary, and you're done!

Registering:

<div class="flex flex-wrap gap-5 children:(max-w-100 w-full)">

  ![](/sink/quiet_webauthn/ios_register_1.jpg)

  ![](/sink/quiet_webauthn/ios_register_2.jpg)
</div>

Signing in:
<div class="flex flex-wrap gap-5 children:(max-w-100 w-full)">

  ![](/sink/quiet_webauthn/ios_signin_1.jpg)

  ![](/sink/quiet_webauthn/ios_signin_2.jpg)
</div>

And Bitwarden:
<img src="/sink/quiet_webauthn/ios_signin_bw.jpg" class="max-w-100 w-full" />

# Conclusion
idk there you go that's all of them

This is a really lazy blog post but hopefully it's fine.

Hope to cya back here soon <br/>
-- Yellowsink
