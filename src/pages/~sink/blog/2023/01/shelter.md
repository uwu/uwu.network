---
layout: "^layouts/QuietLayout.astro"
title: The why behind shelter
description: Why is shelter like it is, instead of like most other client mods?
pubDate: "2023-01-20"
tags: ["MODDING"]
---

# The why behind shelter

shelter is a client modification for Discord, designed in a post-SWC modding scene.

This page is likely to go out of date as the scene progresses, especially the current state of mods
e.g. Vencord.

We (uwu.network / previously The Cumcord Team) hope that shelter should remain constant through this.

## Part 1: the state of client modding

Let's quickly go over the different approaches to modding.

You can skip this part if you know this already :)

### How the scene began

The earliest Discord modifications (DiscordInjections and the like) worked via basic
DOM manipulation - including using jQuery etc!

A [standard DI plugin](https://github.com/noodlebox/DiscordInjections-Plugins/blob/master/CharacterCounter/index.js)
would use a MutationObserver to wait for changes to the document, then apply changes to the DOM via jQuery.

Keep it in mind that this method of plugin development treats Discord as a black box,
and as such most of these plugins should work as-is now,
as long as they don't touch a part of the client that hasn't been overhauled.

### How we moved on

Unfortunately, jQuery and DOM manipulation were janky and primitive in relation to the
latest innovation in the client modding field: **React, patching and Webpack**.

This method was *the* method of making plugins solidly until late 2022, due to its convenience.

Every module in Discord (imagine, every JS file and dependency) is available in the webpack modules,
which client mods are able to extract.

These modules give us direct access to internal Discord code, including modules like React!

These modules are also the single-source-of-truth for this code, and everything else accesses them
by reference, so changes to these modules apply to the entire app.

This means we can monkey-patch these modules and affect the whole app.
As such, standard practice at this time is patching React components to change the UI,
and just fetching any modules we needed by the exported prop names.

A basic plugin can be found [here](https://github.com/sink-cord-archive/cc-plugins/blob/master/plugins/svg-embeds/index.js).

### Why this broke

In September of 2022, Discord moved part of their build pipeline from
[Babel](https://babel.dev/) to [SWC](https://swc.rs/) to improve their build speed.

This also gave a side effect - SWC is better at minifying!
It mangles the exported prop names that we were relying on,
and its JSX compiler just *doesn't include* the `displayName` prop that we used to find
React components.

This means that 90% of the module finding we did broke overnight.

This single event is possibly one of the most significant milestones of the Discord modding community,
as it entirely changed the power dynamic in the scene from BetterDiscord, Powercord, GooseMod, Cumcord, RePlugged, etc.,
to shelter, Vencord, and a couple of smaller clients.

### The new alternative approach

During the latter end of the run of the webpack method, a private client mod known as hh3 was developed.

I know little about, and will share little about this client, but it achieves its patching via regular expressions.

It intercepts incoming webpack chunks and *directly modifies Discord's code*.

This would later be picked up and used as the core method for Vencord, the current biggest client mod.

A basic plugin with this approach can be found [here](https://github.com/Vendicated/Vencord/blob/main/src/plugins/anonymiseFileNames.ts).

Notice the replacement of a discord function via regex, and reference via a global to custom functions.

### shelter's approach

shelter was conceived with a core idea: *why depend so heavily on volatile internals?*
shelter depends on two things: Flux, and the UI of Discord.

Flux is a state management tool that lets us effectively access all client-side state,
and listen to, modify, and influence every event that happens in the app (eg a message is sent, a track happens).

shelter also brings together learning from DiscordInjections and co,
and from experiments in [KaiHax](https://github.com/KaiHax/kaihax/), which is strikingly similar to current Discord:
we have webpack, but no useful prop names etc.

The general modus operandi for a shelter plugin has taken shape as the following options:
 - Wait for a Flux event that suggests a relevant thing is about to happen, then `MutationObserver` the page to allow Discord to render the UI we need
 - Play with the Flux stores to find relevant info and mess with them
 - Play with Flux dispatches to effect how the app behaves
 - Dig around in React Fibers to find useful information
 - Affect the DOM!!!

We also have a stable method of extracting some internals: *exfiltration*.
This method just uses prototype setters to extract basically anything as long as it gets assigned to an object at some point,
and we know what its name on that object will be.

This often leads to more "janky" looking plugins, but the point of this document is to justify it.

## Part 2: why do it this way?

### The drawbacks of regex patching

There are two main issues with doing your patching in this way.

1. Reliance on Discord internals  
    Discord internals can change at any time, and the internal structure of a function is
    even more volatile than exported module signatures!

2. Building for change  
    You need to write your regexes very carefully to ensure that it handles
    any possible minified version of the function.
    You can't expect something that's minified one way now to be minified
    another way tomorrow.

### Why shelter then?

1. These plugins are bulletproof  
    Generally, Discord's main UI does not change a lot.
    Users dislike change, and this would be dev time they could spend
    on a new feature instead.  
    This makes the UI a fairly stable base to use.

2. Flux is important to Discord  
    Discord have made Flux almost impossible to remove from their app at this point.
    In addition, it's clear that they like Flux, as they use it on some unrelated pages.

3. These plugins do much less JS madness  
    You are patching way less, digging through webpack way less, etc.  
    Just DOM apis and chill.

4. *Possible* performance concerns  
    Causing many react elements to go through the internals of a patcher, and
    looping through webpack modules a large number of times are both not ideal.  
    As for regex patching, this is a flat fee paid once, so less of an issue.

5. Flexible load times  
    shelter itself needs to load before Discord, due to its use of exfiltration,
    but plugins can basically load whenever.  
    This leads to better UX.

6. mmmmmmmm solidjs  
    it comfy

## Where to go from here?

I have a few ideas of more that can be added to shelter to improve it.

1. yeah, uh, regex patching!  
    Unfortunately its hard to get around the flexibility of this when needed.
    Worth investigating.  
    It would also be worth taking some leaves out of hh3's book and having some helpers
    to make these replacements easier to write.

2. React patching  
    We could bring back patching of react components by patching `createElement`.

3. i forgot  
    no actually i forgot what i was going to write here im sorry


If you're still here, consider keeping an eye on
[shelter](https://github.com/uwu/shelter),
[uwu.network](https://github.com/uwu),
[my blog](http://localhost:3000/~sink/quiet.rss),
or [me](https://yellows.ink) :)

Hope to see you back soon  
-- Yellowsink