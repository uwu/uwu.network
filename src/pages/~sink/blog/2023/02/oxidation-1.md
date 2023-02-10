---
layout: "^layouts/QuietLayout.astro"
title: The Oxidation Pt. 1 - The Reference Dance
description: Rust series post on memory, ownership, and mutability
pubDate: "2023-02-10T19:39:11"
tags: ["RUST", "OXIDATION"]
---

<img src="/sink/quiet_oxidation_banner.svg" class="max-w-200" />

# the_oxidation[1]: The Reference Dance

So, first thing's first, if I'm going to be checking to see if transforms do or do not decrease size,
I'm going to need some way to get the length of an AST node, right?

Well let's look at how a JS implementation of this might look:

```js
const getLength = (ast) =>
  printSync(ast, { minify: true }).code.length;
```

This works, but not only am I not working in JS, this is not fast as it has to send the entire
AST in JSON form over interop, then send a string back over interop, then measure the length.

Let's do better!

## The naïve Rust port

So let's start by adding the JS codegen features we need from SWC
(note the `ecma_codegen`, this is the change I am making to this line):
```toml
[dependencies]
swc_core = { version = "0.59.*", features = ["ecma_plugin_transform", "ecma_codegen"] }
```

Now, we will follow essentially the same process as in JS: ask SWC to stringify our AST,
and then give us the length!

```rs
fn get_length(node: &impl Node) -> usize {
	let srcmap = Rc::new(SourceMap::default());

	let mut emitter = Emitter {
		cm: srcmap,
		comments: None,
		wr: JsWriter::new(srcmap, "\n", /* uhhh help!!!! */, None),
		cfg: Config {
			minify: true,
			..Config::default()
		}
	};

	node.emit_with(&mut emitter).unwrap();

	// ???? what do we return?
}
```

I would like to also note that, see that `&` in `&impl Node`?
That means our function *borrows* `node`.

This means that the caller does not lose ownership of it,
as would happen if we just use `impl Node`,
but as a trade-off we are not allowed to modify node.

Meanwhile, the `&mut` when passing `emitter` to `emit_with`
allows `emit_with` to borrow `emitter` but also modify it - more on ownership later!

*So then!* there are a few issues with this initial implementation.

## The warmup

Firstly, Rust gets annoyed about our repeated use of `srcmap`, so lets touch on the basics of ownership.

When we create the `Rc<SourceMap>`, it becomes owned by `srcmap`.
When we use it in the `Emitter` creation though, it gets *moved*.

This means that `emitter.cm` now owns it, so using it in the `JsWriter` constructor is now invalid!

This is because we can't pass something we don't own any more to someone else.

To solve this, we make use of the ability of the `Rc` type to allow shared references to one resource,
and just clone it, so we don't move it:

```rs
		// ...
		cm: srcmap.clone(),
		// ...
```

## Now, about this writer...

This API takes an implementation of `std::io::Write`, which it uses to put its output into.

This in practice could be any number of things - into a string in memory, to the console,
to a file, to the network, etc.

In our case, we actually just need some way to get the length out, and an efficient way to do this
is to implement it ourselves!

```rs
struct WriteCounter {
	pub written: usize
}

impl Write for WriteCounter {
	fn flush(&mut self) -> Result<()> { Ok(()) }

	fn write(&mut self, buf: &[u8]) -> Result<usize> {
		let len = buf.len();

		self.written += len;

		Ok(len)
	}
}
```

Okay, easy, job done!

Now to just integrate it into our code:
```rs
fn get_length(node: &impl Node) -> usize {
	let srcmap = Rc::new(SourceMap::default());

	let counter = WriteCounter { written: 0 };

	let mut emitter = Emitter {
		cm: srcmap.clone(),
		comments: None,
		wr: JsWriter::new(srcmap, "\n", counter, None),
		cfg: Config {
			minify: true,
			..Config::default()
		}
	};

	node.emit_with(&mut emitter).unwrap();

	counter.written
}
```

Oh, crap, the compiler doesn't like this? Why not????

Well, let's consider the ownership here.
`counter` gets moved into `JsWriter`, and so we don't own it after that line.

Now, when we try to use `counter.written`, it's invalid.

Now, arguably, we still own the `WriteCounter`, as it lives inside `emitter`,
and we do own that!

But not so fast. Unfortunately, the SWC API does not expose this,
the `JsWriter.wr` field which holds our counter is not public.
So we will have to somehow hold a reference ourself.

## Sharing memory... `Rc` perhaps?

So, in Rust, the `Rc` type allows one to share memory.

To understand how it works, let's start off one simpler: `Box`.

`Box` serves to take a value we are holding directly in our hands,
move it into memory somewhere (the heap, to be precise),
and instead just hand us back a number that tells us where it is if we need it.

We still own both the `Box` and value it contains, we just don't have the contained
item directly.

This is useful for many reasons, such as recursive types, but it doesn't help us here,
as only one person can hold the `Box`, and cloning the box also clones the value!

Enter `Rc`. In Rust, by convention, moving objects should never deep copy,
and so the `clone()` method represents explicitly taking that performance hit.

`Rc` is the exception to the rule. When you `clone()` an `Rc`,
you only clone the `Rc` itself, but it still points to the same value!

This is perfect, we can share a value between two places, by putting it in an `Rc`,
and just handing the API a clone of it. Let's try!:

```rs
struct WriteCounter {
	pub written: Rc<usize>
}

impl Write for WriteCounter {
	fn flush(&mut self) -> Result<()> { Ok(()) }

	fn write(&mut self, buf: &[u8]) -> Result<usize> {
		let len = buf.len();

		*self.written += len;

		Ok(len)
	}
}

fn get_length(node: &impl Node) -> usize {
	let srcmap = Rc::new(SourceMap::default());

	let count = Rc::new(0);
	let counter = WriteCounter { written: count.clone() /* keep `count` under our ownership! */ };

	let mut emitter = Emitter {
		cm: srcmap.clone(),
		comments: None,
		wr: JsWriter::new(srcmap, "\n", counter, None),
		cfg: Config {
			minify: true,
			..Config::default()
		}
	};

	node.emit_with(&mut emitter).unwrap();

	// for weird rust reasons, we can't directly return this
	let count = *count
	count
}
```

Oh, this still isn't working?
Well, turns out the values inside `Rc` are *immutable*, which means they are read-only.

## Mutation time

There are a couple of ways around this.

One of them is `Mutex`, which only allows one place to hold a copy of the actual data at once,
but allows reading and writing freely.

The other is `RwLock`, which allows as many places to read as possible, but if you want to write,
nobody else is allowed to be holding either a read or write copy.

*(editing node: apparently there also `RefCell` which may be better suited to this,
but I am new to Rust and do not know, and this code is already written,
so I'll have to investigate later).*

Which I choose here didn't really matter, but I saw something vague about performance somewhere
and went for `RwLock`.

Let's go!:

```rs
struct WriteCounter {
	pub written: RwLock<usize>
}

impl Write for WriteCounter {
	fn flush(&mut self) -> Result<()> { Ok(()) }

	fn write(&mut self, buf: &[u8]) -> Result<usize> {
		let len = buf.len();

		*self.written.write() += len;

		Ok(len)
	}
}

// the get_length() function is basically identical
// except switching Rc::new() for RwLock::new(),
// and switching *count for *count.read(), so not worth including
```

Here, our `write()` implementation opens a writeable reference to written,
deferences it with `*` to go from a reference to the actual value, then increments it.

When the function returns, the writeable reference is *dropped* (goes out of scope),
so the lock is freed up, and others can now request to write.

I didn't include it in the snippet (see comment), but also note
that in `get_length`, we only `read()` not `write()`,
not out of any particular *requirement*, but more just out of convention:
why request high privileges when you can request low privileges?

*WOAH, NO WAY*, our code compiles, runs, and doesn't error!

Oh. Shit. `get_length(astnode)` returns 0. Huh?

## Cloning in plain sight

So, whats up with this?

As it happens, when I encountered this, I attached a debugger to my code and stepped through line by line!

After some inspection of the locals panel I discovered that, while `count` contained the value 0,
`emitter.wr.wr.written` contained the value of, I don't know, 11 or whatever it was.

Hm.

So these `RwLock`s clearly do not point to the same value, so they can't be the same...

Ah! There it is!

Remember earlier, when I said that `clone()` usually also copies the values they point to?
So when we passed `count.clone()` into our struct, so we could hold onto a copy,
it not only copied the `RwLock`, but the `usize` it pointed to as well!

So our counter was happily incrementing its `written` field, then at the end we read
from an entirely different instance that had never even been touched!

## The solution!

Aha, so we need to *share* this `RwLock` between `get_length` and `WriteCounter`...

How do we share memory?

Oh, right, the thing we tried *before* `RwLock`! `Rc` to the rescue!

So the problem with `Rc` was that we couldn't mutate, but could share,
and while `RwLock` could broker out mutation rights, it can't share.

Let's combine powers! As long as both places are holding the same `RwLock`,
it can safely broker out permission to either place to write safely.

So we can just use an `Rc` to allow us to both have the same instance!

So if we put this into our code, we get a final:
```rs
struct WriteCounter {
	pub written: Rc<RwLock<usize>>
}

impl Write for WriteCounter {
	fn flush(&mut self) -> Result<()> { Ok(()) }

	fn write(&mut self, buf: &[u8]) -> Result<usize> {
		let len = buf.len();

		*self.written.write() += len;

		Ok(len)
	}
}

fn get_length(node: &impl Node) -> usize {
	let srcmap = Rc::new(SourceMap::default());

	let count = Rc::new(RwLock::new(0));
	let counter = WriteCounter { written: count.clone() };

	let mut emitter = Emitter {
		cm: srcmap.clone(),
		comments: None,
		wr: JsWriter::new(srcmap, "\n", counter, None),
		cfg: Config {
			minify: true,
			..Config::default()
		}
	};

	node.emit_with(&mut emitter).unwrap();

	let count = *count.read()
	count
}
```

The final thing to note here, which is quite pleasing,
is that `Rc<RwLock<usize>>` is actually quite a nice, pleasing type signature.

It captures both the fact that we are sharing this value, and that we are mutating it,
all to be inferred just by reading the type!

## Concluding thoughts

I saw a video about mistakes Rust beginners make, and it said that overusing `Rc<RefCell<T>>`
is one of the biggest mistakes because you should just restructure your code to not need shared
mutation, but unfortunately my hands are tied here by SWC's API :(

Maybe one day they will make `JsWrite.wr` public...

Well uh, yeah this code now works fine. It does a little dance to get around memory restrictions,
but it sure does output the correct value!

You can find this code in actual real implementation
[here](https://github.com/uwu/paramin/blob/954ebc9/src/measurement.rs#L11-L51)
(when I make the repo public, at least).

Thanks for tuning in, I hope you learned something, and if you have something you want to tell me
to improve my code now or in the future, please do not hesitate to reach out on
[Mastodon](https://noc.social/@yellowsink),
[Twitter](https://twitter.com/cainatkin), Discord, or [by email](mailto:yellowsink@riseup.net)!

Cya next time!  
 -- Yellowsink

[*Previous*](oxidation-0)
~~*Next*~~