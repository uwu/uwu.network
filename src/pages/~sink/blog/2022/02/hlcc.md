---
layout: "^layouts/QuietLayout.astro"
title: The making of HLCC
description: A compiler for Discord snippets
pubDate: "2022-02-14"
physPubDate: "2024-07-26"
tags: ["MIGRATED"]
---

*note: migrated over from my website at https://yellows.ink/hlcc*

## The making of HLCC

Note you may have a hard time reading this article if you don't know basic Javascript.

### What is HLCC?

HLCC stands for High Level Cord Compiler.
It is meant to make building small little snippets for Discord really really easy.

In the past, you have either had to rely on a client mod, or write your own manual webpack injection logic.

For the sake of demonstration, that looks something like this:

```js
webpackChunkdiscord_app.push([
	[Symbol()],
	{},
	(e) => {
		for (const k in e.c) {
			const m = e.c[k].exports;
			if (m?.default?.getChannel) console.log(m.default);
		}
	},
]);
```

Which prints all modules containing a `getChannel` key to the console.

However, this is not very developer friendly, who may be used to apis like the following:

```js
import { findByPropsAll } from "@mod/modules/webpack";
findByPropsAll("getChannel").forEach(console.log);
```

To solve this, HLCC provides a high level API that can then be converted into the actual call,
and as a bonus be optimised to produce as minifier friendly code as possible.

### A quick example of using HLCC

Here is an example input:

```js
const channelId = "PUT_CHANNEL_ID_HERE";

hlccInject([hlccByProps("getChannel", 1)], (channelModule) =>
	console.log(channelModule.getChannel(channelId).name)
);
```

And the corresponding output:

```js
const channelId = "PUT_CHANNEL_ID_HERE";
{
	const _w = webpackChunkdiscord_app;
	let channelModule;
	_w.push([
		[Symbol()],
		{},
		(e) => {
			let _i0 = 0;
			for (const k in e.c) {
				const m = e.c[k].exports;
				const mDef = m?.default && m.__esModule ? m.default : m;
				if (mDef?.getChannel && _i0++ === 1) channelModule = mDef;
			}
		},
	]);
	_w.pop();
	console.log(channelModule.getChannel(channelId).name);
	void 0;
}
```

Which, if we run in a console in Discord, should give us the name of the channel with that ID.

### Why not a lib and bundler?

The obvious solution to this would be to build a simple library and then run through a bundler.

However, this is limited with how optimisable it can be, even with proper function inlining.

For example, we can build the simplest required tests for module finding, use only a single for loop,
and hoist the user's code outside of the module find, which I have been told should be more performant,
but I haven't tested that claim.

### What's the solution then?

I decided to build a compiler using [SWC](https://swc.rs), because it has many of the features of Babel,
except that Babel is slow and SWC is stupidly fast:

```
λ hyperfine "hlcc tests/snippet.js tests/compiled.js"
Benchmark 1: hlcc tests/snippet.js tests/compiled.js
  Time (mean ± σ):     111.6 ms ±  11.5 ms    [User: 143.8 ms, System: 36.0 ms]
  Range (min … max):    89.2 ms … 134.9 ms    27 runs
```

(note that most of this time is rust <=> js interop)

I can build my injected code in AST form and let SWC do the hard work of parsing & generating compliant JS code for me.

In addition, this means I can be very pedantic about what exactly the user is passing to functions (literals vs expressions),
and I can eliminate the need for imports (though modern bundlers can silently inject imports in the top of files often).

### What's for the future?

I have an optisation I'm very keen to implement, where instead of checking every module and then calling your code,
you assign one callback per module and can then run your code as soon as the module is found.

Then you can simply return early if all the callbacks have been hit once, as we know no further modules will hit.

Of course you can then _optionally_ pass a function to run with all modules as usual,
but if not passed we can remove a lot of hoisting etc.

Some code for that may look something like this:

```js
const channelId = "PUT_CHANNEL_ID_HERE";

hlccInject([
	hlccByProps("getChannel", 1, (m) =>
		console.log(m.getChannel(channelId).name)
	),
]);
```

```js
{
	const _w = webpackChunkdiscord_app;
	_w.push([
		[Symbol()],
		{},
		(e) => {
			let _i0 = 0;
			for (const k in e.c) {
				const m = e.c[k].exports;
				const mDef = m?.default && m.__esModule ? m.default : m;
				if (mDef?.getChannel && _i0++ === 1)
					// IIFE is less code than shadowing in a block with a let or const
					((m) => console.log(m.getChannel(channelId).name))(mDef);
			}
		},
	]);
	_w.pop();
	void 0;
}
```
