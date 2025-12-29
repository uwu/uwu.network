---
title: "The Bits We Don't See, Part 2: D"
description: The initialisation and finalisation steps of the D runtime uncovered.
pubDate: "2025-01-02T14:41:00"
tags: ["*NIX", "LOWLEVEL", "D"]
---

# The Bits We Don't See, Part 2: D

I recently wrote an article digging into [how the C runtime starts and finishes execution](https://uwu.network/~sink/blog/2024/12/bits-dont-c), and as a big fan of the D programming language, I figured it would make sense to move along to *its* runtime, which is quite a bit more sophisticated than the C runtime. D programs have full access to libc, link against libc, and so indeed the C runtime starts up before the D runtime does, and closes down after the D runtime. This means that everything in the last article applies here too!

Now, to keep things simple, I'm going to continue to use musl libc, and I will be focusing on LDC, the LLVM based D compiler, as it is the most commonly used D compiler in production (GDC is near-irrelevant and DMD is mostly used for the development loop, it does not have particularly great output). As I can't simply call `musl-gcc` for this, I have moved everything into an Alpine Linux container for the code samples, so that is all being done on a *real* musl system.

Let's start with two questions to guide the exploration:

- What calls `main`? (again)

- What calls module constructors

  - Keep in mind that D module constructors run AFTER the D runtime is initialised.

  - You can create a function such as:
    ```d
    pragma(crt_constructor) extern (C) void myfn() {}
    ```

    to hook into the same libc `__init_array` as we've already seen, the same as `__attribute__((constructor))` in GNU C.

## Ch 1: Getting Off The Ground

It is worth mentioning is that D allows many possible signatures for main:

```d
void main();
int main();
noreturn main();
void main(string[] args);
int main(string[] args);
noreturn main(string[] args);
```

All of these compile, but you can only have one.

Now, compiling a basic program, which we will then put into IDA:

```d
void main() {}
```

```sh
ldc2 basic_test.d -of basic_test
```

We see that there are more links this time:

```sh
ldd basic_test
	/lib/ld-musl-x86_64.so.1 (0x787defc91000)
	libdruntime-ldc-shared.so.103 => /usr/lib/libdruntime-ldc-shared.so.103 (0x787defb46000)
	libgcc_s.so.1 => /usr/lib/libgcc_s.so.1 (0x787defb22000)
	libc.musl-x86_64.so.1 => /lib/ld-musl-x86_64.so.1 (0x787defc91000)
	libunwind.so.1 => /usr/lib/libunwind.so.1 (0x787defb13000)
```

We have the dynamic linking runtime, `libdruntime-ldc`, which has a promising name, `libgcc_s`, libc, and libunwind. `libgcc_s` just contains some helper functions that the compiler uses, and [libunwind](https://github.com/libunwind/libunwind) is a common library for providing exceptions.

![](https://i.yellows.ink/b59511002.png)

Here is the full list of symbols. I have highlighted the functions we know from last time in green. The most interesting new ones we can see are `_Dmain` and `_d_run_main`, they sound very promising. In addition, there is `_d_dso_registry`, which starts with a D, and `rt.dso.register_dso()` and its `unregister_dso` friend sounds interesting as I know that D has a module called `rt` that is used by the compiler.

Can we first unpick what some of these other functions do, to rule them out? Well doing an internet search for `register_tm_clones` returns the *GNU Transactional Memory library*, which is apparently a C++ feature, so that makes sense. `__do_global_dtors_aux` appears to be a C++ compiler counterpart of the libc constructors system we saw before, again from some searching.

What about `frame_dummy`, `__register_frame_info`, and `__deregister_frame_info`? Mentions of frames *sounds* like something libunwind might be concerned with, and if I check:

```sh
nm -gD /usr/lib/libunwind.so
# --- cut ---
0000000000008d30 T __deregister_frame_info
# --- cut ---
0000000000008bd0 T __register_frame_info
# ...
```

`frame_dummy` is unaccounted for, which appears to come from `crtbegin.o` in the GCC distribution.

## Ch 2: From `main` to `_Dmain`

Now, what about the ones that look more promising, say, `main`? This is, after all, where we get dropped by libc once we are ready to go:

```asm
main proc near

var_10= qword ptr -10h
var_4= dword ptr -4

; __unwind {
push    rbp
mov     rbp, rsp
sub     rsp, 10h
mov     [rbp+var_4], edi
mov     [rbp+var_10], rsi
mov     edi, [rbp+var_4]
mov     rsi, [rbp+var_10]
lea     rdx, _Dmain
call    __d_run_main
add     rsp, 10h
pop     rbp
retn
; } // starts at 11B0
main endp
```

Clearly here we can see that we call into `__d_run_main`, in a similar looking manner to `__libc_start_main`. I wonder if we can find this in the D runtime!

```sh
git clone https://github.com/ldc-developers/ldc --depth 1
```

After some searching around, I found `runtime/druntime/src/core/internal/entrypoint.d`, which contains a large template. Before I'll include it here I'll remove some Windows-specific and Solaris-specific sections:

```d
/**
A template containing C main and any call(s) to initialize druntime and
call D main.  Any module containing a D main function declaration will
cause the compiler to generate a `mixin _d_cmain();` statement to inject
this code into the module.
*/
template _d_cmain()
{
	extern(C)
	{
		int _Dmain(char[][] args);

		int _d_run_main(int argc, char** argv, void* mainFunc);

		int main(int argc, char** argv)
		{
			pragma(LDC_profile_instr, false);
			return _d_run_main(argc, argv, &_Dmain);
		}
	}
}
```

This appears to line up with what we see: we have `_Dmain`, which is defined as `int function(char[][])`. If we ignore const/immutable attributes, this is equivalent to `int function(string[])`. This sure *looks like* our D program's main function, and the name would appear to support that. Indeed, if we look at the assembly:

```asm
_Dmain proc near
; __unwind {
push    rbp
mov     rbp, rsp
xor     eax, eax
pop     rbp
retn
; } // starts at 11A0
_Dmain endp
```

`_Dmain` is basically an empty function, which is what we expect. In particular, this pushes the base pointer onto the stack and increases the stack size, sets the return value (`eax`) to zero, then pops the pointer back off the stack again. This is essentially a nothing function, minus optimisations that would allow the compiler to remove the stack ops and just generate `xor eax,eax; ret`.

As the helpfully placed comment above the entrypoint template explains, this code is referenced via a `mixin` in your code, so your module like this:

```d
void main()
{
	// do some stuff
}
```

Is effectively rewritten to:

```d
void _Dmain()
{
	// do some stuff
}

{
	int _Dmain(string[]);
	int _d_run_main(int argc, char** argv, void* mainFunc);

	int main(int argc, char** argv) => _d_run_main(argc, argv, &_Dmain);
}
```

What about the fact that we are just returning `void` here? And we don't take an argument!

Ignoring the argument actually works exactly the same as it does in C: as arguments are pushed by either placing them in registers, or by pushing them onto the stack, the function being called can just *not* read further up the stack, or *not* read out of those registers, so nothing actually breaks if you try to pass too many arguments to a function. You only get issues when you don't pass enough.

As for the return type, this seems a bit of a mystery as, reading the D spec, part 7.2: *"`void` has no value"*. As `_Dmain` is not `extern (C)`, the compiler is not required to use any calling convention, either, `extern (D)` functions may use whatever calling convention the compiler feels like that day, so its not like void functions are just defined to return zero either. However, the spec, part 20.20 says: *"If `main` returns `void`, the OS will receive a zero value on success"*, so calling conventions aside, the compiler is *forced* to generate a zero here, as that is the semantics of the main function.

As a sanity check, let's see what happens if we create a void function that *isn't* `_Dmain` (I'm passing `-O1` here to remove the stack instructions).

```d
void test() {}
void main() {}
```

```asm
void example.test():
	ret

_Dmain:
	xor     eax, eax
	ret
```

Bingo! For `_Dmain`, LDC inserts a zero return even though we have specified `void`, whereas for any other `void` function with D linkage, it doesn't bother, it just leaves `eax` undefined.

Alright then, time to investigate `_d_run_main` then, I guess. Searching for that symbol, we find `runtime/druntime/src/rt/dmain2.d`, and within it (again, I've removed anything that isn't specific to Linux, for simplicity):

```d
struct CArgs
{
	int argc;
	char** argv;
}

__gshared CArgs _cArgs;

/// Type of the D main() function (`_Dmain`).
private alias extern(C) int function(char[][] args) MainFunc;

/**
 * Sets up the D char[][] command-line args, initializes druntime,
 * runs embedded unittests and then runs the given D main() function,
 * optionally catching and printing any unhandled exceptions.
 */
extern (C) int _d_run_main(int argc, char** argv, MainFunc mainFunc)
{
	// Set up _cArgs and array of D char[] slices, then forward to _d_run_main2

	// Remember the original C argc/argv
	_cArgs.argc = argc;
	_cArgs.argv = argv;

	// Allocate args[] on the stack
	char[][] args = (cast(char[]*) alloca(argc * (char[]).sizeof))[0 .. argc];

	size_t totalArgsLength = 0;
	foreach (i, ref arg; args)
	{
		arg = argv[i][0 .. strlen(argv[i])];
		totalArgsLength += arg.length;
	}

	return _d_run_main2(args, totalArgsLength, mainFunc);
}
```

Now, while this is a minor detail, the first thing I notice here is that the function pointer for `_Dmain` here has `extern (C)`. This is interesting, as the main function does not, in fact, have C linkage, but we've already seen that it gets special treatment by the compiler, so clearly LDC makes sure that that will work. Next up, similar to in libc, we see the pattern of taking the `argc`/`argv` values and storing them globally for later.

Now, the runtime creates a copy of the `argv` more appropriate for use in a D program. The `char[]` type, which is just a non-immutable version of `string`, consists of a pointer and a length, and it's essentially allocating an array on the stack such as `char[][argc] args`. The only reason `alloca` is needed is that we cannot simply define a dynamic array on the stack like that. `alloca` is a somewhat hacky C function that dynamically allocates memory on the stack. This is almost never a good idea, but is perfect here as it just needs to put some pointers on the stack, and knows how many we need, right there in `argc`.

After converting each element of `argv` from a sentinel terminated `char*` to a `char[]` fat pointer with a length, and pushing them into `args`, it calls a stage 2 function, just like in libc, so let's move onto that. This stage 2 function is here because Windows has an entirely separate `_d_wrun_main`, which needs to do a bunch of Unicode stuff with the arguments. I am again omitting code for non-Linux platforms, in this case both FreeBSD and Windows require extra inline assembly to enable 80-bit floating point registers for the D `real` type, and Windows has different debugging-related setup. I am going to, just like `__init_libc` before, take this function in chunks.

```d
private extern (C) int _d_run_main2(char[][] args, size_t totalArgsLength, MainFunc mainFunc)
{
	int result;

	/* Create a copy of args[] on the stack to be used for main, so that rt_args()
	 * cannot be modified by the user.
	 * Note that when this function returns, _d_args will refer to garbage.
	 */
	{
		_d_args = cast(string[]) args;
		auto buff = cast(char[]*) alloca(args.length * (char[]).sizeof + totalArgsLength);

		char[][] argsCopy = buff[0 .. args.length];
		auto argBuff = cast(char*) (buff + args.length);
		size_t j = 0;
		import rt.config : rt_cmdline_enabled;
		bool parseOpts = rt_cmdline_enabled!();
		foreach (arg; args)
		{
			// Do not pass Druntime options to the program
			if (parseOpts && arg.length >= 6 && arg[0 .. 6] == "--DRT-")
				continue;
			// https://issues.dlang.org/show_bug.cgi?id=20459
			if (arg == "--")
				parseOpts = false;
			argsCopy[j++] = (argBuff[0 .. arg.length] = arg[]);
			argBuff += arg.length;
		}
		args = argsCopy[0..j];
	}
```

If I give you a sneak preview of the end of this function: `return result; }`, then it's clear that `result` is simply the exit code, which will go back through `main` to libc.

This helpfully commented block makes it clear what exactly this is meant to do in macro terms: if somebody modifies their `args` from `_Dmain`, which points into the original `argv`, then the D runtime will no longer have an accurate copy of the arguments, so it wants a copy. `_d_args` is where it stores that. After allocating enough space to copy all of the arguments, and copying them into `argsCopy`, minus any `--DRT-*` options, unless they come after a `--`, the `args` parameter (which will later go to `main`) is set to be the copy. This does double-duty in giving the runtime an incorruptible copy of the arguments, and in stripping the D runtime arguments from those passed to the code.

```d
	auto useExceptionTrap = parseExceptionOptions();

	void tryExec(scope void delegate() dg)
	{
		if (useExceptionTrap)
			try
			{
				dg();
			}
			catch (Throwable t)
			{
				_d_print_throwable(t);
				result = EXIT_FAILURE;
			}
		else dg();
	}
```

Here, the runtime parses the value of `--DRT-trapExceptions`, or falls back to `true`. Then we get a local function that will call a delegate, and given `trapExceptions` is on, catches any throwables and passes them to `_d_print_throwable`. This is what provides the stack trace at the top level when an exception escapes `_Dmain`!

```d
	void runAll()
	{
		if (rt_init())
		{
			auto utResult = runModuleUnitTests();
			assert(utResult.passed <= utResult.executed);
			if (utResult.passed == utResult.executed)
			{
				if (utResult.summarize)
				{
					if (utResult.passed == 0)
						.fprintf(.stderr, "No unittests run\n");
					else
						.fprintf(.stderr, "%d modules passed unittests\n",
								 cast(int)utResult.passed);
				}
				if (utResult.runMain)
					tryExec({ result = mainFunc(args); });
				else
					result = EXIT_SUCCESS;
			}
			else
			{
				if (utResult.summarize)
					.fprintf(.stderr, "%d/%d modules FAILED unittests\n",
							 cast(int)(utResult.executed - utResult.passed),
							 cast(int)utResult.executed);
				result = EXIT_FAILURE;
			}
		}
		else
			result = EXIT_FAILURE;

		if (!rt_term())
			result = (result == EXIT_SUCCESS) ? EXIT_FAILURE : result;
	}

	tryExec(&runAll);
```

Now, this is a big chunk, but we can get through it. This entire chunk runs inside that `tryExec` function we saw before, so this is all living inside a catch block. The first thing done is to call `rt_init`, which sounds as though it might be doing yet more interesting things. I'll circle back to it later. If that returns true, presumably a success value, we then move onto running unit tests. `runModuleUnitTests` lives in `core.runtime`, and as it is a full test harness, it is pretty large, however if no modules contain any unit tests, then most of the complex stuff gets bailed right out of.

If no unit tests failed (# tests passed = # tests executed), then it can print the unit test result. If the test harness signals that the main function should be ran, then here, right here, it starts *another* `tryExec` wrapper to call `_Dmain(args)`. If tests fail, an error is printed and we fail. We also see now that in a `rt_init` failure case, we get a failure too.

Now that the program has finished executing, `rt_term` is called, which, again, I'm sure hides some interesting secrets, and we can move on.

```d
	// Issue 10344: flush stdout and return nonzero on failure
	if (.fflush(.stdout) != 0)
	{
		.fprintf(.stderr, "Failed to flush stdout: %s\n", .strerror(.errno));
		if (result == 0)
		{
			result = EXIT_FAILURE;
		}
	}

	return result;
}
```

Ah, so all that's left to do is to flush the output stream, and return all the way back up the stack into libc. Cool! Now we've gotten all the way from `main` down to `_Dmain`.

## Ch 3: What's Inside `rt_init`?

`rt_init` *also* lives right here in `dmain2.d`, and if we look, there's an interesting comment right above it:

```d
/**********************************************
 * Initialize druntime.
 * If a C program wishes to call D code, and there's no D main(), then it
 * must call rt_init() and rt_term().
 */
```

So given that any C code that wishes to call into D code must call this, we can assume that `rt_init` is the central entrypoint of the D runtime - not the entrypoint for D programs, with argument setup and the like, but the entrypoint for all the features provided by the runtime to be usable.

```d
private shared size_t _initCount;

extern (C) int rt_init()
{
	if (atomicOp!"+="(_initCount, 1) > 1) return 1;

	_d_monitor_staticctor();
	_d_critical_init();
```

The `_initCount` value given here is provided so that if multiple C threads attempted to concurrently init different instances of the D runtime, they would detect as such and the later calls to rt_init just no-op and return success.

`_d_monitor_staticctor` lives in `rt/monitor_.d`, and will call `pthread_mutexattr_init` and `pthread_mutexattr_settype(..., PTHREAD_MUTEX_RECURSIVE)`, to setup posix threads' mutexes, then call `pthread_mutex_init()` on `__gshared Mutex _gmtx`. Then, similarly, `_d_critical_init`  from `rt/critical_.d` calls `pthread_mutex_init` on its `shared D_CRITICAL_SECTION gcs`'s `.mtx`. Between these two functions, the runtime has set locks up for `synchronized` blocks and methods.

```d
	try
	{
		initSections();
		// this initializes mono time before anything else to allow usage
		// in other druntime systems.
		_d_initMonoTime();
```

`initSections` comes from a different place depending on the OS, but here its `rt/sections_elf_shared.d`. On BSD, this sets up a reference to `_d_dso_registry`, but on Linux `initSections` is empty. `_d_initMonoTime` in `core.time` initialises the `core.time.MonoTimeImpl`, so that the runtime has access to the system clock as early as possible:

```d
// Linux
enum ClockType
{
	normal = 0,
	bootTime = 1,
	coarse = 2,
	precise = 3,
	processCPUTime = 4,
	raw = 5,
	second = 6,
	threadCPUTime = 7,
}

private immutable long[__traits(allMembers, ClockType).length] _ticksPerSecond;

extern(C) void _d_initMonoTime() @nogc nothrow
{
	// we can't just init `_ticksPerSecond` from a static this(){} as we need monotime available earlier.
	// so we use a cast here to remove the `immutable`, to be able to actually initialize it
	auto tps = cast(long[])_ticksPerSecond[];

	timespec ts;
	foreach (i, typeStr; __traits(allMembers, ClockType))
		static if (typeStr != "second")
		{
			enum clockArg = _posixClock(__traits(getMember, ClockType, typeStr));
			if (clock_getres(clockArg, &ts) == 0)
			{
				// ensure we are only writing immutable data once
				if (tps[i] != 0)
					// should only be called once
					assert(0);

				// For some reason, on some systems, clock_getres returns
				// a resolution which is clearly wrong:
				//  - it's a millisecond or worse, but the time is updated
				//    much more frequently than that.
				//  - it's negative
				//  - it's zero
				// In such cases, we'll just use nanosecond resolution.
				tps[i] = ts.tv_sec != 0 || ts.tv_nsec <= 0 || ts.tv_nsec >= 1000
					? 1_000_000_000L : 1_000_000_000L / ts.tv_nsec;
			}
		}
}
```

Here, for each kind of clock, other than "second", `clock_getres` is used to ask the operating system for the number of ticks that happen each second, and writes that into the array. For all clocks other than second, that will later be used by the normal clock functions to convert the values returned by the operating system clock into a `core.time.Duration` value.

Continuing down `rt_init`, we get to `thread_init`, in `core.thread.osthread`:

```d
		thread_init();
		// TODO: fixme - calls GC.addRange -> Initializes GC
		initStaticDataGC();
		rt_moduleCtor();
		rt_moduleTlsCtor();
		return 1;
	}
```

I don't particularly feel like digging into exactly how the D threading system works in detail, but the gist of this is that it initialises some locks, sets up a bunch of signal handlers, and sets `Thread.sm_main` to the currently executing thread.

`initStaticDataGC` from `rt.memory` is actually quite simple: it takes the global sections listed in the ELF from `rt.sections`, and calls `GC.addRange` on each one, so that the garbage collector is aware of them. `addRange` tells the GC that a section of non-stack memory exists, so that it can scan that range for pointers during the mark phase. Without this, objects could be collected while still referenced, and in this case, it adds the parts of the memory space that global variables live in.

`rt_moduleCtor` and `rt_moduleTlsCtor` live in `rt/minfo.d` and simply loop over each section, and call the module constructors on them. These are the functions that you would define like so:

```d
void main()
{
	// called by runAll in _d_run_main2
}

static this()
{
	// called by rt_moduleCtor, from rt_init, from runAll!
}
```

At this point, success is declared, unless an error is thrown!:

```d
	catch (Throwable t)
	{
		atomicStore!(MemoryOrder.raw)(_initCount, 0);
		_d_print_throwable(t);
	}
	_d_critical_term();
	_d_monitor_staticdtor();
	return 0;
```

Errors are printed in exactly the same way as we saw in `tryExec` before us, and before returning from `rt_init`, the critical sections and monitors are shut back down, as the runtime will not be started, and failure is returned.

With that, the entire init process of the D runtime is covered! All we have left to cover are any static constructors that are pulled in by imports from core and stdlib modules, and the shutdown process.

## Ch 4: The `rt_term`'s Yin to `rt_init`'s Yang

```d
extern (C) int rt_term()
{
	if (atomicLoad!(MemoryOrder.raw)(_initCount) == 0) return 0; // was never initialized
	if (atomicOp!"-="(_initCount, 1)) return 1;

	try
	{
		rt_moduleTlsDtor();
		thread_joinAll();
		rt_moduleDtor();
		gc_term();
		thread_term();
		return 1;
	}
	catch (Throwable t)
	{
		_d_print_throwable(t);
	}
	finally
	{
		finiSections();
		_d_critical_term();
		_d_monitor_staticdtor();
	}
	return 0;
}
```

Oops, no chapter introduction this time, how rude of me. Anyhow, aside from decrementing the init count, this function essentially reads like a who's who of "things that need stopping", so we can just run down them one by one.

- `rt_moduleTlsDtor` calls all the static TLS Destructors for modules - that is, destructors that require the thread system to be ready. It does this in reverse.
- `thread_joinAll` requires that the all threads are waited for by the runtime before it is allowed to exit.
- `rt_moduleDtor` runs all the remaining static module destructors in reverse.
- `gc_term` terminates the Garbage Collector, but what does that actually mean? Well, when reading its source in `core.internal.gc.proxy`, it becomes clear that, depending on the `--DRT-gcopt=cleanup:` option. When it's `collect` (the default), it runs destructors and deallocates memory for all objects (literally a `GC.collect()` call). When it's `finalize`, all live objects are finalised, but no memory is released to the OS because, well, your program is going to exit in a second anyway. When it's `none`, the GC just doesn't bother collecting anything. It then resets to its default state.
- `thread_term` cleans up all the locks and stuff from before.
- `finiSections` cleans up data that was read out of the ELF file.

Then all that is left is to clean up the critical sections like before, and we can exit.

### OK, But what the Hell is a TLS Constructor?

We see in the runtime that there is a distinction between `rt_moduleCtor` and `rt_moduleTlsCtor`. What exactly is this difference? My first clue as I started to look around the codebase was that I saw some modules with a `shared static this()`. Could the `shared`-ness of the constructor be the difference? Let's test!:

```d
import core.stdc.stdio : puts;

pragma(crt_constructor) extern(C) void cctor() { puts("crt_constructor"); }

void main() { puts("main"); }

       static this() { puts("standard ctor 1"); }
shared static this() { puts("shared   ctor 1"); }
       static this() { puts("standard ctor 2"); }
shared static this() { puts("shared   ctor 2"); }
```

```sh
ldc2 cons_test.d -of cons_test
./cons_test
crt_constructor
shared   ctor 1
shared   ctor 2
standard ctor 1
standard ctor 2
main
```

Aha! `static this()` gets called AFTER `shared static this()`, consistently. This must be the difference! It makes some sense as well. A `shared static this()` runs once, globally, and as such its stack and state lives in the `__gshared` global space of the address space. That can just be ran early. Meanwhile, a normal `static this()` runs once per thread, and so its stack and state needs to live in the thread-local-storage section of the executable, in line with the rules of the D language, which explains why they need the thread system initialised first. Then it makes sense that they must be destructed in the other order `static ~this()` on termination, by the same rationale as walking the array in reverse.

## Bonus Chapter: Some Static Constructors

Now that we've seen `rt_moduleCtor`, which interestingly works by parsing the executable file, and not by having the linker create a magic `__init_array` for us, we can take a look at some modules in the D runtime and standard library that use these to initialise themselves. I'll also look for any modules that use `pragma(crt_constructor)` to hook into libc's `__init_array`.

- Over in `core.runtime`, a shared static constructor is used to set the trace handler. Some windows specific constructors are also used.

- In `std.socket`, pointers to some OS functions are taken.

- In `core.cpuid`, a crt constructor sets all the cpuid global values.

- In `core.memory`, a crt constructor gets the system page size.

- In `core.time : TickDuration`, a crt constructor gets the monotime resolution.

- In `core.internal.gc.impl.conservative.gc`, a crt constructor registers the conservative and precise gc impls.

- In `core.internal.gc.impl.manual.gc`, similar happens for the manual gc.

- In `rt.dso`, `_d_dso_registry` is passed some global data from a crt constructor.

  `rt.dso` is a module linked into all D dynamic shared objects (.so/.dylib/.dll), and registers the library to the D runtime, so that module constructors and the like can be read out of it. There is a matching crt destructor to deregister it, in cases of dynamic library unloading.

  This is the only crt destructor in the D runtime.

- In `core.thread.threadbase`, a shared static destructor cleans some stuff up.

- In `rt.cover`, a shared static destructor writes the final code coverage analysis results to disk.

- In `rt.lifetime`, a static destructor clears out the thread GC cache.

- In `rt.profilegc`, a static destructor moves thread specific stats into global ones,
  and a shared static destructor writes the stats to stdout.

- In `rt.trace`, a bunch of stacks and stuff are cleaned up both locally and globally.

- In `std.concurrency`, a static destructor cleans up thread local state.

- In `std.parallelism`, a shared static destructor kills all daemon (backgrounded) threads.

## Conclusion

My end goal here is actually to evaluate the feasibility of replacing some D code using an `extern(C) int main()` with the D runtime disabled (`-betterC`) with a full D system on [a relatively restrictive target platform](https://i.yellows.ink/ccb2792ac.jpeg). The things that jump out to me are:

- This isn't actually too complex. The use of `alloca` is a little unusual but that's about it.
- I'd need `libunwind` working, as the runtime relies on exceptions.
- I need thread-local storage, and threading in general, unless I feel like commenting the entirety of `core.thread` out, which is an option, but not a very good one.
- Module destructors and constructors, as well as the GC understanding global variables, depend on being able to read the ELF file content.
- The garbage collector doesn't actually have any initialisation code!!! It just kind of works immediately, serving allocation requests via `GC.malloc` and co, and via the [D `rt` hooks](https://wiki.dlang.org/Runtime_Hooks) that provide the implementations of `new`, `~`, associative arrays, and the like.

I very much hope you learned something, and if you have any other languages you think might have interesting init routines, feel free to let me know on [the fediverse](https://lethallava.land/@sink) or [email](mailto:yellowsink@riseup.net).

Thanks for reading! :)

​	\-- Hazel
