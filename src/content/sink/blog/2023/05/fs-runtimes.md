---
title: What's the fastest F# runtime?
description: Perf testing the many F# runtimes
pubDate: "2023-05-13T12:05:00"
tags: ["PERF"]
---

# What's the ~~fastest~~ _best_ F# runtime?

F# is a language with many ways to run. It runs natively on .NET, but this isn't the only way.

Firstly, .NET 7 introduced NativeAOT, which replaces runtime JIT compilation (RyuJIT) with LLVM optimized native code.

Second, there is a project called [Fable](https://fable.io).
It was designed to let you use F# with Javascript on the web, but has since grown to support more languages.

So here will be my runtimes:

- .NET 7
- .NET 7 NativeAOT
- Fable 4.x -> JS -> Deno (V8), Bun (JSCore), GraalJS, Firefox (Gecko)
- Fable 4.x -> Dart
- Fable 4.x -> Python
- Fable 4.x -> Rust

## My suspicions going in

My suspicion was that Javascript is so well optimized by now, that it could beat the .NET runtime.

I also expected that (if it worked) Rust would perform pretty well, and Python would be awful.

## Setting up

I threw together [my benchmarks](https://github.com/yellowsink/qs-fsharp-benchmarks),
ported from [here](https://programming-language-benchmarks.vercel.app),
and a runner that was generic over its I/O primitives:

```fsharp
// .NET runtime
open System.Diagnostics
open benchmarks

Runner.runAll
	Stopwatch.StartNew
	(fun sw ->
		sw.Stop()
		sw.Elapsed.TotalMilliseconds)
	ignore
	(printfn "%s")
```

And then just had to bind it to all runtimes!:

```fsharp
// dart, rust
// should work in JS and Python fine too but hey I can do those its fine :p
open System
open benchmarks

[<EntryPoint>]
let main _ =
	Runner.runAll
		(fun() -> DateTime.Now.Ticks)
		(fun sw -> float (DateTime.Now.Ticks - sw) / 10_000.)
		ignore
		(printfn "%s")

	0
```

```fsharp
// JS
open Browser.Performance
open benchmarks

Runner.runAll
	performance.now
	(fun sw -> performance.now() - sw)
	ignore
	(printfn "%s")
```

```fsharp
// Python
open Fable.Python.Time
open benchmarks

let timer = time.monotonic >> (*) 1000.

Runner.runAll
	timer
	(fun sw -> timer() - sw)
	ignore
	(printfn "%s")
```

## Problems I faced

So first, I went to compile to python, but it failed! Why?

Well, my benchmarks had filenames beginning with numbers,
and you can't have that in python because it'll try parse it as a float.
Thats kind of silly.

Anyway, after changing those names, Python compiled!

Not that it worked, CPython was too slow, and PyPy complained that my bigint
was too long to stringify.

What about Rust? Well Rust did not work OOTB, because my benchmarks
were in a module called `core`, which was shadowing Rust's `core` module.

One rename later, Rust... didn't work. Not surprising, Rust is a complex
language that would be hard to compile to, but there were just missing types and stuff.

Dart? Well Dart doesn't support F# string formatting,
so I can't use `$""` strings if I want that to work.
BigInt doesn't work though.

However: JS worked perfectly. First try.

Fable to dart, rust, and python are too unusable to be a genuine way of running F#, so let's focus on JS & .NET.

## System

Every attempt was made to run these benchmarks on the quietest, most consistent possible system.
They were all ran in the linux console with minimal system services running.

For the firefox benchmark, this was less possible, but the
[minimal possible graphical environment](https://github.com/ValveSoftware/gamescope) was used.

My system is an Asus M409DA (Ryzen 3500U) running Arch Linux.

Versions:

|            |                        |
| ---------- | ---------------------- |
| .NET       | 7.0.103                |
| Deno       | 1.33.0 (V8 11.4.183.1) |
| Bun        | 0.5.9                  |
| GraalVM CE | 22.3.2 (JDK 17.0.7)    |
| Firefox    | 114.0b2                |

## Results

<div class="overflow-x-auto children:w-max mb-2">

| Runtime    | binarytrees (ms) | edigits (ms) | fannkuch-redux (ms) | binarytrees (%) | edigits (%) | fannkuch-redux (%) |
| ---------- | ---------------: | -----------: | ------------------: | --------------: | ----------: | -----------------: |
| .NET 7     |              6.4 |         16.5 |                 2.6 |               0 |           0 |                  0 |
| NativeAOT  |              3.9 |         13.8 |                 2.4 |              39 |          16 |                  8 |
| JS Deno    |              4.3 |          3.7 |                 3.3 |              33 |          78 |                -27 |
| JS Bun     |              3.9 |          7.3 |                26.7 |              39 |          56 |               -927 |
| JS Graal   |             23.8 |         11.7 |                 8.4 |            -272 |          29 |               -223 |
| JS Firefox |              8.8 |         40.0 |                 9.5 |           -37.5 |        -142 |               -265 |
</div>

The results here indicate that NativeAOT is faster across the board,
but that using a JS runtime can _situationally_ beat even that.

The results are close for tasks such as memory allocation and calculation,
but `edigits` makes heavy use of bigint math, which is significantly more efficiently
implemented in Javascript engines (except Gecko) than it is in .NET.

It is safe to say that Fable remains most useful for its Javascript output than for performance.
This may change with Dart and Rust target, but that remains to be seen.

It is worth noting that concessions apply to these all - .NET 7 runs all F# code flawlessly,
NativeAOT cannot reflect at runtime,
and the Fable targets can't properly use non-fable libraries.

So basically, the fastest way to run F# is to use the official toolchain with NativeAOT,
and JITted .NET is probably good enough if that won't work.

Thanks, hope to see ya back here soon<br/>
-- Yellowsink
