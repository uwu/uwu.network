---
title: Introducing flora
description: A fast, secure runtime for Discord bots powered by V8 isolates
date: 2026-02-11
published: true
tags: ["rust", "discord", "v8"]
---

[flora](https://flora.uwu.network) is a runtime I've been building that lets you write Discord bots in TypeScript and deploy them per-guild through a single bot instance. Scripts execute inside V8 isolates, so each guild gets its own sandboxed environment without you needing to manage any infrastructure.

### Architecture

The runtime is written in Rust. At its core, it embeds [deno_core](https://docs.rs/deno_core) for the V8 engine, [Serenity](https://github.com/serenity-rs/serenity) for the Discord gateway, and [Axum](https://github.com/tokio-rs/axum) for the HTTP API. When a Discord event arrives, it gets serialized and routed to the corresponding guild's isolate, where your registered handlers execute.

All ops use deno_core's `#[op2]` and `#[op2(fast)]` macro, which leverages V8's [Fast Call API](https://docs.rs/deno_core/latest/deno_core/attr.op2.html) to make the V8-to-Rust boundary nearly negligible — fastcall-compatible ops can execute in under 10 nanoseconds. For complex structs, `#[serde]` passes data as JSON between JS and Rust; for simple scalar values, `#[string]` avoids serde entirely and is fastcall-eligible. Async ops use `#[op2(async)]` with eager polling, resolving immediately when the future is already ready.

Storage is split across three backends: Postgres for deployments and tokens, Redis for sessions and cache, and [sled](https://docs.rs/sled) for a per-guild key-value store that scripts can access directly.

### Runtime orchestration

The runtime manages a configurable pool of worker threads (up to 64), each running its own single-threaded tokio runtime. Guilds are deterministically assigned to workers via a hash of their guild ID, ensuring that a guild's isolate always lives on the same thread. I maintains forks of both [rusty_v8](https://github.com/denoland/rusty_v8) and [deno_core](https://docs.rs/deno_core) that reintroduce V8's Locker/Unlocker API, laying the groundwork for moving isolates between threads in the future.

Each worker owns a `HashMap` of per-guild `JsRuntime` instances. When a deployment arrives, the worker creates or replaces the guild's isolate, loading the SDK bundle and user script. Commands flow through an unbounded `mpsc` channel per worker — deploy, dispatch, broadcast, unload, and shutdown are all message types the main thread can send.

Event dispatch routes guild-scoped events to the assigned worker, while global events like `ready` broadcast to all workers in parallel. To prevent a slow guild from stalling others, droppable events (`messageCreate`, `messageUpdate`) are silently dropped when a worker's backlog exceeds 2,000 pending commands. Workers also run a per-second cron tick that checks all registered cron jobs and dispatches synthetic `__cron:<name>` events through the same path.

### SDK

The TypeScript SDK is available globally inside the runtime — no imports needed. You define prefix commands, slash commands, event handlers, and cron jobs with a minimal API:

```ts
const ping = slash({
  name: "ping",
  description: "Respond with pong",
  run: async (ctx) => {
    await ctx.reply("pong!");
  },
});

createBot({ slashCommands: [ping] });
```

The SDK also exposes a KV store for persistent state, an embed builder, component builders for buttons and containers, and cron scheduling with standard five-field expressions.

### CLI

A companion CLI, also in Rust, handles deployments, log streaming, and KV management against the runtime's HTTP API. Deploying a script to a guild is a single command:

```bash
flora deploy --guild .... src/main.ts
```

### Status

flora is still early and under active development. The codebase and documentation are available at [flora.uwu.network](https://flora.uwu.network).
