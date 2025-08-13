---
layout: "^layouts/QuietLayout.astro"
title: The Bits We Don't C
description: The secrets hidden behind your main function.
pubDate: "2024-12-31T22:35:00"
tags: ["*NIX", "LOWLEVEL"]
---

# The Bits We Don't C

I think it's easy to forget just how much a programming language does for us, especially modern ones. You can instantiate a class in Javascript without having to concern yourself with where it's going to live and for how long. But I think its also easy to forget that this is not a new phenomenon. We have been hiding things that our tools do from us for decades and decades.

Today I want to cover the steps that you don't see that make a simple C program work. Specifically, when I write my C program, with an `int main(int argc, char** argv, char** envp)`, where the hell do those arguments come from? Where does the `int` go? Is there anything unexpected hiding behind that main declaration?

Before I start, I want to shout out two other excellent resources. I won't cover the internals of library calls here, as that seems like a very obvious thing to "not see", but this [excellent video by Nir Lichtman](https://www.youtube.com/watch?v=aAuw2EVCBBg) shows how we get from `printf` in our C code, through libc, through the kernel, and into text in our terminal emulator.

In addition, [Matt Godbolt's *The Bits Between the Bits*](https://www.youtube.com/watch?v=dOfucXtyEsU) better motivates some points and also demonstrates in much more detail how the linker scripts play into this, as well as showing part of how dynamic linking works on Linux and related platforms.

While I am solidly on a tangent now, I like shouting out other interesting stuff, so [James McNellis' *Everything You Ever Wanted to Know about DLLs*](https://www.youtube.com/watch?v=JPQWQfDhICA) shows off how exactly dynamic linking works in excruciating detail on Windows.

With the shoutouts done, I also want to mention that I'll be showing off how this looks on musl, mainly because glibc is a bit of a mess.

## Chapter 1: So What About `main`?

The question we opened with was about `main`. Where does `argc`, `argv`, and `env` come from? And where does the `int` return go?

Well, let's start with the return type. Before I go digging into musl source code (I will do that soon), let's just compile a binary and see what it looks like inside.

```c
int main() { return 0; }
```

```shell
musl-gcc ret0.c -o ret0
```

Let's see what this links against:

```shell
ldd ret0
	/lib/ld-musl-x86_64.so.1 (0x7ff9cc541000)
	libc.so => /lib/ld-musl-x86_64.so.1 (0x7ff9cc541000)
```

So as we can see, we link only against `ld-musl-x86_64.so.1`, which is the dynamic linking runtime, and `libc.so`, the C standard library.

And if we disassemble this (I'll be using IDA 9 for this), we see a few functions in our executable: some small mystery subroutines, the familiar `main`, `_start`, `_start_c`, `_init_proc` and `_term_proc`, a dynamic link to `_cxa_finalize` and a couple of dynamic links to `__libc_start_main`.

So, what calls `main`?

IDA identifies `_start` as the main entrypoint, and that *appears* to basically fall through into `_start_c`, which is very odd, but in `_start_c` we get our first clue as to what could be going on:

```asm
; _start_c
proc near
mov     esi, [rdi]      ; argc
lea     rdx, [rdi+8]    ; ubp_av
lea     r8, _term_proc  ; fini
xor     r9d, r9d        ; rtld_fini
lea     rcx, _init_proc ; init
lea     rdi, main       ; main
jmp     ___libc_start_main
endp
```

It is taking the address of `main` right there in that last `lea` instruction, and then passing it into this mysterious `__libc_start_main` function. This is a dynamic link, and as it only links into `libc.so`, it must live there, so let's clone the musl source code and find it! Doing a search finds us this file, which doesn't contain the `__libc_start_main` implementation, but does give very clearly show us where it is called, in `_start_c`!

```c
// musl/crt/crt1.c
#include <features.h>
#include "libc.h"

#define START "_start"

#include "crt_arch.h"

int main();
weak void _init();
weak void _fini();
int __libc_start_main(int (*)(), int, char **,
	void (*)(), void(*)(), void(*)());

hidden void _start_c(long *p)
{
	int argc = p[0];
	char **argv = (void *)(p+1);
	__libc_start_main(main, argc, argv, _init, _fini, 0);
}
```

And, as we look around the source in this area, we also find `crt/x86_64/crti.s` and `crtn.s`, which contain the assembly code for `_init()` and `_fini()`. The definition and contents of those appears to perfectly match `_init_proc` and `_term_proc` in our compiled binary, which IDA recognises as being `init` and `fini`.

Now, we have got the source code for `_start_c`, and this very clearly takes *some mystery pointer `p`*, which must point at a structure like `[argc, argv ptr]`. Keep this mystery argument in your mind, because if this is the real entrypoint called by the OS, then that pointer is a bit of a mystery for later.

Searching more, we can find `src/env/__libc_start_main.c`. What an encouraging name!

```c
// excerpt from __libc_start_main.c
// slightly simplified

int __libc_start_main(mainfnptr *main, int argc, char **argv,
	void (*init_dummy)(), void(*fini_dummy)(), void(*ldso_dummy)())
{
	char **envp = argv+argc+1;

	__init_libc(envp, argv[0]);

	/* Barrier against hoisting application code or anything using ssp
	 * or thread pointer prior to its initialization above. */
	lsm2_fn *stage2 = libc_start_main_stage2;
	__asm__ ( "" : "+r"(stage2) : : "memory" );
	return stage2(main, argc, argv);
}
```

Well, here we can see where `envp` comes from, that mystery pointer from `_start_c` must actually point to something of the form `[argc, argv[0] ptr, argv[1] ptr, ..., envp ptr]`. That makes sense.
Clearly `__init_libc` is hiding some interesting things, again, keep that in your mind and we'll circle back to it.

Now, what is this `libc_start_main_stage2` it's indirectly calling?

```c
// excerpt from __libc_start_main.c
// slightly simplified

static int libc_start_main_stage2(mainfnptr *main, int argc, char **argv)
{
	char **envp = argv+argc+1;
	__libc_start_init();

	/* Pass control to the application */
	exit(main(argc, argv, envp));
	return 0;
}
```

Aha! Here we get our call to `main`!

So to answer the first question we aimed to solve, "where does the `int` go?", here is where! The stage2 init function calls main and passes our return value *directly* into the `exit()` function, which explains how your main's return value becomes the process exit code.
We have also now uncovered the beginnings of the answer to the second question: where the hell do those arguments come from? Unfortunately, I am yet again going to have to kick the can down the road:

## Chapter 2: What calls `_start_c`?

If you've ever worked with C, you should be familiar with `argv`. It is a null-terminated array of pointers to strings, containing the arguments of the process. You are also given `argc`, the length of the array.

We have just seen that `__libc_start_main` creates the `envp` variable, by just assuming that It's immediately after the end of `argv` in memory, and that `argc` and `argv` are found by `_start_c`... by being given a mystery pointer and assuming it points to a structure such as `[argc, argv[0], argv[1], ..., null, envp...]`, but where the hell does this pointer come from, and who sets it up?

Well, it comes from whatever calls `_start_c`. And what is that exactly? Let's disassemble `_start` again, and see. I previously glossed over this and said that it "appears to fall through into `_start_c`", but is that true when we actually try to understand it? Surely it needs to pass an argument to it, as well!

For these code examples, I'm going to statically compile our binary, and analyse that:

```shell
musl-gcc ret0.c -static -o ret0s
```

IDA fails here to figure out where that `call` is going, so we get no symbols or cross-references here, we're on our own!:

```asm
public _start
proc near               ; DATA XREF: LOAD:0000000000400018↑o
xor     rbp, rbp
mov     rdi, rsp
lea     rsi, cs:0
and     rsp, 0FFFFFFFFFFFFFFF0h
call    $+5
endp ; sp-analysis failed
```

It takes the *base pointer*, and clears it out (`xor reg, reg` is a common asm idiom for `reg = 0`).
Then, it copies the stack pointer `rsp` into the register `rdi`, which does have a special meaning on x86, but is just used here as a boring generic register.
Next, it takes the address of the code segment register `cs:0` and stores it in `rsi`.

Next, its bitwise ANDs the stack pointer with `0xFFFFFFFFFFFFFFF0`. This is 64 full bits in which every bit is 1 except the bottom 4 bits. This effectively is zeroing the bottom 4 bits of the stack pointer, which rounds it down to the nearest multiple of 16. In particular, this aligns the pointer to a 16 byte boundary (128 bits, or two quad-words) This is done so that the compiler can easily make 16-byte-aligned stack sizes, and thus SIMD instructions can more often operate on aligned addresses.
As long as the compiler only increases the stack size in multiples of 16, the size of the stack is always a multiple of 16 bytes. Also note that, as the stack grows downwards, rounding the stack pointer down is increasing the stack size, so we don't lose anything already on the stack here.

Finally, it calls a function at... `$+5`. What is `$+5`? Let's consult the Netwise Assembler documentation, Section 3.5 (Expressions)!

> NASM supports two special tokens in expressions, allowing calculations to involve the current assembly position: the `$` and `$$` tokens. `$` evaluates to the assembly position at the beginning of the line containing the expression; so you can code an infinite loop using `JMP $`.

Ah, it's Intel assembly code to say "the location of the current instruction, + 5 bytes".

This call instruction sits at address `.text:000000000040103C`, and if we add 5 to that, we get `.text:0000000000401041`, and looking this up in our binary, we get... THE FIRST INSTRUCTION OF `_start_c`, THERE WE GO!
OK, `_start` calls into `_start_c`, which lives immediately after it. So what about that pointer argument that `_start_c` wants to see? Well, let's put the two functions' assembly next to each other and comment the instructions of `_start`:

```asm
public _start
proc near
xor     rbp, rbp                 ; base pointer = 0
mov     rdi, rsp                 ; rdi = stack pointer
lea     rsi, cs:0                ; rsi = &code segment
and     rsp, 0FFFFFFFFFFFFFFF0h  ; align rsp to short
call    $+5                      ; call _start_c
endp

; int __fastcall start_c(__int64, __int64, __int64, __int64, __int64, __int64, void *)
public _start_c
proc near
mov     esi, [rdi]             ; argc
lea     rdx, [rdi+8]           ; argv
mov     r8, offset _term_proc  ; fini
xor     r9d, r9d               ; ldso
mov     rcx, offset _init_proc ; init
mov     rdi, offset main       ; main
jmp     __libc_start_main
endp
```


Notice that first instruction of `_start_c`: `mov esi, [rdi]`. By analysing the calling convention and the public signature of `__libc_start_main`, IDA has helpfully informed us that `esi` is `argc`.
What's this bracket syntax? Well, in intel assembly, `[reg]` says "the value pointed to by reg", so this is effectively like the C code: `argc = *rdi`.

Next up, `lea rdx, [rdi+8]`. The `lea` instruction gets the address of a value, so this is like the C code `argv = &(*(rdi + 8))`.
Then it does some pretty straightforward stuff: copy the offset to `_term_proc` into `fini`, clear out `ldso`, move the offset to `_init_proc` into `init`, and, now it's done using `rdi` to store the `argc` and `argv` pointers, it can reuse it to store the offset to `main`.

Finally, it's ready to jump into `__libc_start_main`, which is expecting those arguments in those registers, and we're in nice and comfy C code again.
That's ALMOST the last assembly I'll show you, I promise. We're going back to C land :)

And to quickly mop up the detail that I statically linked this binary: with a dynamically linked binary, the `cs:0` would have been a dynamic address that the `ld.so` runtime has to fill in before execution, but nothing else is different. For more about *relocations*, which is how that'd work, watch Matt Godbolt's talk!

## Chapter 3: Where Does `argv` Come From, Though?

Okay, okay, so now we can see that `_start` calls into `_start_c`, but this hasn't answered what we want to know: Where does `argv` come from???

We see that `_start_c` dereferences `rdi` and uses that as `argc`, and revisiting this definition from musl:

```c
hidden void _start_c(long *p)
{
	int argc = p[0]; // <==== this line, right here!
	char **argv = (void *)(p+1);
	__libc_start_main(main, argc, argv, _init, _fini, 0);
}
```

It becomes clear that `rdi` is exactly this `long *p` parameter. So where did `rdi` come from again?
Well, it sets it.... to the stack pointer? That's odd...
And this is the point where we can't just analyse our binary in a vacuum any more. Think about code like so:

```c
int var;
int* ptr = &var;
return ptr; // stops the compiler optimizing the function entirely away
```

If we were to compile this (with `-O1`, to remove a bunch of pointless asm garbage), we get the following assembly:

```asm
test:
	lea     rax, [rsp-4]
	ret
```

Naturally this code is wrong as returning a reference to locals is invalid, but the important part is this `lea`.
We could write this in pseudo-C as `rax = &stack - 4;`, or, a pointer to 4 bytes below the stack pointer. This lines up perfectly with the fact that an `int` is 4 bytes, so we're effectively reaching back 4 bytes from *just after* the int, to the start of it.

So, what does it mean to point directly to the stack pointer, then? The stack pointer points at the last variable on the stack of the previous function, in general.
If `_start` is reading out of `rsp`, it is reading the last variable on the stack at the *very start of the program*.

Only one thing can manipulate the stack before the process actually starts: the operating system.
Linux is putting the contents of `envp` and `argv` anywhere it likes in memory (it could absolutely use the stack for this if it liked), pushing null to the stack, then setting up the `envp` pointer array on the stack, pushing another null, setting up the `argv` pointer array, then pushing the number of arguments to the stack.
This means that when `_start` begins running, it can access them from there. This is almost as if you had code like this, secretly ran by the OS:

```c
// ILLUSTRATIVE PURPOSES ONLY
void _secret_os_entrypoint()
{
	char* envp_null = NULL;
	char*[env_length] envp;
	char* argv_null = NULL;
	char*[arg_length] argv;
	// initalize envp and argv here somehow
	uint64_t argc = arg_length;

	_start();
}
```

And then `_start` reads into the stack to read its caller's local state. Obviously in normal programs, that's a giant no-no, but this isn't really what's happening, and as `_start` knows that it will only ever be called by the OS, who has left the arguments for `main` in this exact configuration, it works out to do it here.

## Chapter 4: So, About that `__init_libc` Call.

Earlier, I told you to take a note of the call to `__init_libc` from `__libc_start_main`. What does this actually *do*? Are there more secrets hiding?

Remember also that the stage 2 init function that actually does the main call executes `__libc_start_init`, too.

Well, now we're starting to hit into territory covered by *The Bits Between the Bits*, but the C runtime is actually doing more than just finding some crumbs left by the operating system, passing them to main, then executing the `sys_exit` syscall.

Let's investigate!

`__init_libc` is actually quite complex, so I'll get `__libc_start_init` done first.

```c
extern weak hidden
	void (*const __init_array_start)(void),
	(*const __init_array_end)(void);

static void dummy(void) {}
weak_alias(dummy, _init); // fun macro

static void libc_start_init(void)
{
	_init();
	uintptr_t a = (uintptr_t)&__init_array_start;
	for (; a<(uintptr_t)&__init_array_end; a+=sizeof(void(*)()))
		(*(void (**)(void))a)();
}

weak_alias(libc_start_init, __libc_start_init);
// I only need to explain this trick once.
```

First of note, `_init` is defined via this weird `weak_alias` macro. This expands to:

```c
extern __typeof(dummy) _init __attribute__((__weak__, __alias__(#dummy)))
```

This defines `_init` as an external symbol, with the same type as `dummy` (`void()`), as a *weak symbol*, which means it can be overwritten by other non-weak definitions, and with an alias that tells the compiler that this `_init` symbol actually refers to `dummy` as a fallback, so if no strong definition of `_init` is given to the linker, then the `_init` call just calls `dummy`.

Next, we see this array of function pointers, where `__init_array_start` is the start of the array, and `__init_array_end` points just after the end of the array, and it calls every function within that array.

Let's just take a second to appreciate the wonder of C syntax that is:

```c
(*(void (**)(void))a)();
```

For a fourth time, I'm going to mention Godbolt's talk; he demonstrates how the linker (`ld`) and compiler are configured to take every function with `__attribute__((constructor))` and place pointers to them in `__init_array_*`, so this is where the C runtime makes good on the compiler's promise to call all your static constructors before `main()`.

Now, back to `__init_libc`, the big one. I'll take this in chunks.

```c
// src/env/__libc_start_main.c

#define AUX_CNT 38
__attribute__((__noinline__))
void __init_libc(char **envp, char *pn)
{
	size_t i, *auxv, aux[AUX_CNT] = { 0 };
	__environ = envp;                       // src/env/__environ.c : __environ
	for (i=0; envp[i]; i++);
	libc.auxv = auxv = (void *)(envp+i+1);
```

So, first thing, it defines an index variable that will be reused a few times, a `size_t* auxv`, and a static array `size_t[38]` called `aux`, and initialises it to zero (in C23 this syntax will be simplified to `= {}`, but this version is valid from C99).

Then, it sets unistd.h's `__environ` variable to `envp`, which is used by functions like `putenv(3)` and `getenv(3)`.

Then, after iterating over `envp`, to set `i` such that `envp[i]` is null, it reads *yet another* mystery provided value from the OS, which contains information about the system and the ELF being executed. Assuming that `auxv` lives directly after the end of the `envp` array, it assigns that to the `auxv` variable, and the `auxv` field of the secret libc state struct:

```c
// src/internal/libc.h
struct __libc {
	char can_do_threads;
	char threaded;
	char secure;
	volatile signed char need_locks;
	int threads_minus_1;
	size_t *auxv;
	struct tls_module *tls_head;
	size_t tls_size, tls_align, tls_cnt;
	size_t page_size;
	struct __locale_struct global_locale;
};

extern hidden struct __libc __libc;
#define libc __libc
```

Next up:

```c
	for (i=0; auxv[i]; i+=2) if (auxv[i]<AUX_CNT) aux[auxv[i]] = auxv[i+1];
	__hwcap = aux[AT_HWCAP];
	if (aux[AT_SYSINFO]) __sysinfo = aux[AT_SYSINFO];
	libc.page_size = aux[AT_PAGESZ];
```

Now, iterate over `auxv`, read it as `[index, value]`, and assign those values into `aux` by index.

`__hwcap` lives, again, in `src/internal/libc.h` and is initialised as one of the values of `aux`, (the `AT_HWCAP` constant and co. are defined in `include/elf.h`), and specifically contains hints about processor capabilities.
You can find man pages for what these constants mean exactly at [getauxval(3)](https://www.man7.org/linux/man-pages/man3/getauxval.3.html).

`__sysinfo`, again in `libc.h`, is a pointer (if exists) to the *global system page*, which contains information such as system call numbers (though, on Linux, we just hardcode those anyway).
The page size is pretty self explanatory. It once again goes into what I will continue to call *the secret libc struct*.

<br/>

```c
	if (!pn) pn = (void*)aux[AT_EXECFN];
	if (!pn) pn = "";
	__progname = __progname_full = pn;
	for (i=0; pn[i]; i++) if (pn[i]=='/') __progname = pn+i+1;
```

`pn` is a pointer argument to the function, and `__libc_start_main` calls it here with the value `argv[0]`, and of course, that is where the program name lives.
If it doesn't already exist, default it to `aux[AT_EXECFN]`, or failing that, an empty string somewhere in the binary (or, a pointer to a null byte). `AT_EXECFN` points to the filename of the executable.

After initialising `__progname_full`, `__progname` is set by splitting the program name over `/` and taking the last segment.

<br/>

```c
	__init_tls(aux);                     // weak defined in libc.h, weak impl in src/env/__init_tls.c, strong in ldso/dynlink.c
	__init_ssp((void *)aux[AT_RANDOM]);  // weak defined in libc.h, strong impl in src/env/__stack_chk_fail.c
```

`__init_tls` initialises *thread-local storage*, which is a kind of analogue of global memory that is specific to each thread. The implementation given in `__init_tls.c` is quite complex, involving mmap syscalls and all sorts of logic, and is kind of out of scope here.

`__init_ssp` takes `AT_RANDOM`, which is an OS-given chunk of 16 random bytes, which, as far as I can tell, is used to initialise the guard value read by pthreads (specifically, it sets the current pthread's `canary` field) to mark the end of a stack allocated for another thread, and prevent going out of bounds.

<br/>

```c
	if (aux[AT_UID]==aux[AT_EUID] && aux[AT_GID]==aux[AT_EGID]
		&& !aux[AT_SECURE]) return;
```

At this point, check `AT_SECURE`, which is defined for processes with `setuid`, `setgid`, or `capabilities(3)`. It can also be defined by a Linux security module. The dynamic linker will remove some env vars if it is set.

Here, if it is *not* set, `uid == euid` and `gid == egid`, we have officially completed libc initialisation, and can proceed to running the `__init_array`.
If we *are* secure, or the euid or egid don't match, we have to keep going.

```c
	struct pollfd pfd[3] = { {.fd=0}, {.fd=1}, {.fd=2} };
	// there is actually an #ifdef here and we could call SYS_ppoll instead
	int r = __syscall(SYS_poll, pfd, 3, 0);
	if (r<0) a_crash();
	for (i=0; i<3; i++) if (pfd[i].revents&POLLNVAL)
		if (__sys_open("/dev/null", O_RDWR)<0)
			a_crash();
	libc.secure = 1;
}
```

So, first thing done here is `poll(2)` on file descriptors 0, 1, 2, which are respectively `stdin`, `stdout`, `stderr`, and with a timeout value of `0` to require an immediate return. The return value is the number of elements of `pfd` where either an event or an error occurred.
This basically works as a way to check if the std streams are in a good state.

If a poll error occurs, we crash.
If any poll result is `POLLNVAL` *(Invalid request: fd not open)*, and we also can't open `/dev/null`, we crash.
Finally, the code sets `libc.secure` to 1, which is pretty self-explanatory. Again, this is the secret libc struct.

Now, we're finally, for realsies, done with `__init_libc`!

## Chapter 5: The Other Side of the Coin

At this point I want to quickly note that the way that module construction and finalisation works is different for dynamic libraries - the functions that call the values of `__init_array` and `__fini_array` used for this are overridden to empty versions by the dynamic linker (this is why they are weak symbols), and it calls them itself. I will continue to shove this under the rug and just deal with the static case.

Anyway, now that we've got a way to start up libc, and a way to start main, and a way to finish main, I wonder if libc does any kind of tearing down anywhere, that would make sense right?

Well, looking at our functions:

```c
/* fake illustrative def */ void _start()
{
	// do magic assembly stuff from chapters 2 and 3
	_start_c(magic);
}

hidden void _start_c(long *p)
{
	// --- cut ---
	__libc_start_main(main, argc, argv, _init, _fini, 0);
}

int __libc_start_main(/* lots of args */)
{
	// --- cut ---
	return stage2(main, argc, argv);
}

static int libc_start_main_stage2(/* lots of args */)
{
	// --- cut ---
	exit(main(argc, argv, envp));
	return 0;
}
```

Well, once stage 2 calls main, it passes the return code to `exit` and *immediately* returns all the way up through to `_start`. So clearly there can't be any teardown... right?

Remember that we've just read init code in which syscalls have been done via `__syscall(...)`, so `exit` clearly is not a raw syscall. Are there secrets hiding in `exit`?

```c
// src/exit/exit.c

static void dummy() {}
/* atexit.c and __stdio_exit.c override these. */
weak_alias(dummy, __funcs_on_exit);
weak_alias(dummy, __stdio_exit);
weak_alias(dummy, _fini);

extern weak hidden void (*const __fini_array_start)(void), (*const __fini_array_end)(void);

static void libc_exit_fini(void)
{
	uintptr_t a = (uintptr_t)&__fini_array_end;
	for (; a>(uintptr_t)&__fini_array_start; a-=sizeof(void(*)()))
		(*(void (**)())(a-sizeof(void(*)())))();
	_fini();
}

weak_alias(libc_exit_fini, __libc_exit_fini);

_Noreturn void exit(int code)
{
	/* Handle potentially concurrent or recursive calls to exit */
	static volatile int exit_lock[1];
	int tid =  __pthread_self()->tid;
	int prev = a_cas(exit_lock, 0, tid);
	if (prev == tid) a_crash();
	else if (prev) for (;;) __sys_pause();

	__funcs_on_exit();
	__libc_exit_fini();
	__stdio_exit();
	_Exit(code);
}
```

Aha! There are!

It first handles some undefined behaviour using some atomics - if we get a recursive exit call (someone called exit in a finalizer), crash, and if we get concurrent ones, just hang.
Then, it calls the teardown functions from `atexit.c`, then `__libc_exit_fini`, and finally the teardown for `__stdio_exit.c`.
`atexit(3)` is a library function that lets you register finalizers at runtime yourself, so this provides that functionality.

I hope that `__libc_exit_fini` should not need further explanation, other than it also calling `_fini`, and that unlike `__init_array`, it iterates backwards.
Then finally it calls into `_Exit`, which actually is just a syscall wrapper:

```c
_Noreturn void _Exit(int ec)
{
	__syscall(SYS_exit_group, ec); // call exit_group(code)
	for (;;) __syscall(SYS_exit, ec); // if that doesn't instantly kill us, call exit(code) until we die
}
```

So there we go! We've traced the libc setup process from `__start` all the way to `__syscall(SYS_exit)`, minus the setup code for TLS and SSP, and minus the implementation of the finalizers for atexit and stdio_exit.

## Conclusion

While this knowledge may not be that useful for everyday usage - you just know that `main` gets given args and env, returns back the exit code, and libc just magically works, even when it has seemingly impossible features such as `atexit(3)`, it does show how much sophistication is behind even "simple" language runtimes, in this case that of C, the standard "most basic" programming language left alive, assembly aside. Nobody is left using Fortran or Pascal, so this is the bare minimum runtime you end up getting on a standard x86-64 Linux machine.

Naturally libraries like uClibc, languages like Zig and Rust, and programs with a custom `_start` compiled with the gcc flag `-nostartfiles` have different runtimes, but that is very few programs; most software in the modern world will be calling the libc initialisation process before anything else, and indeed, libc gets the last laugh.

Another thing worth noting is that, often, statically linked programs will elide parts of this, as compiler engines like LLVM can run highly sophisticated optimisations on the libc code with your own program as a reference (e.g. "hey, `__init_array` is empty, so this loop is elided and then this function call is a noop and oh hey stage2 is literally just `exit(main(...))` now"), but not huge amounts of it, as a lot of it is referenced by other parts of libc and cannot be stripped out. Nonetheless, time has proven that this is a perfectly acceptable overhead, it's really not *that* much code. And its all fast!!! It's not at all heavy computation.

This post is mostly setting up for a part 2 where I dig into the runtime system of [D](https://dlang.org/), a language with a much more sophisticated runtime including automatic initialisation of TLS variables, its own static constructor and static finaliser system, a moving garbage collector and allocator, critical sections and locks, dynamic classes and runtime reflection on them, runtime reflection on modules, efficient dynamic arrays, and exceptions.

However, that post required explaining the C init process as D inits its runtime *after* C does, and you can hook into the C init process from D - instead of a `static this() {}` that runs after the D runtime is ready, you can define a `pragma(crt_constructor) extern(C) void my_constructor() {}` that runs before the D runtime starts (indeed, it goes into `__init_array`!!), and well, I would need to explain the C runtime to explain what `pragma(crt_constructor)` does.

That's about it for what I want to say here, naturally this differs for anything that isn't musl on x86-64 Linux, but that's a common target, and a representative sample of a UNIX-like C init process.

I want to give a quick thanks to [Nax](https://nax.dev/) for proofreading this for me :)

I hope you learned something, and if the second in the series ever gets done, I hope you will join me for that!

  \-- Hazel

