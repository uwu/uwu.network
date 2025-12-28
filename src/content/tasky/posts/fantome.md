---
title: Mint Fantôme
description: Or how we bust open the mint packet of docs and nextjs
date: 2025-10-03
published: true
tags: ['re', 'mintlify']
---

:::alert{type="info"}
You can read basil's version here: https://basil.cafe/posts/fantome/
:::

Mintlify is a SaaS startup selling a documentation site generator that allows you to write pretty documentation sites with Markdown and React components. They host the documentation themselves, with a new shifted focus on AI documentation authoring and agents for Slack or your own site. It's worth mentioning that you **cannot build out an generated site**, it must be built by Mintlify and deployed by them (i.e to Vercel).

I don't really use it, but I've kept an eye on it for a while. Though sometime [they did go source-available](https://web.archive.org/web/20220603182655/https://www.reddit.com/r/opensource/comments/v454wi/mintlify_is_open_source) (the usual tactic of using open-source for marketing) with the [“Mintlify Enterprise license"](https://web.archive.org/web/20230224051258/https://github.com/mintlify/mint/blob/main/LICENSE). Less than a year later, they reversed course and privatized all of their code.

My friend [Alyxia](https://alyxia.dev/) was around when this happened, and what remained was the last available snapshot of their source code before it went private.

### The last remains

Alyxia messages me about Mintlify on November 6 2024, as she was running into a prebuild error with ts-node, which was a bit to resolve but we did get it to work, and after some codemods, backporting from fantome extracted sources, we had an working generator that we used for internal work and such.

But, well, before all that, we had to understand how Mintlify actually serves builds for their `mint` CLI.

### Nice organs you got there _decompiles them_

Investigation began on April 2023 on how Mintlify actually serves builds for their `mint` CLI. What we found out was rather, intriguing.

While the actual building and hosting of your documentation is done on Mintlify’s cloud platform, they allow you to preview your docs locally with their CLI, published under the `mint` or `mintlify` npm packages.

The way it works is that they publish part of their monorepo in tarball form to their CDN. The CLI downloads and extracts this tarball, then imports Next.js internals to start a dev server, which allows you to view your docs locally. :sidenote[Their monorepo contains a few packages, some projects, and the compiled version of their Next.js client which is `.next`]

Now, you would expect to just take out the tarball code, and get a free builder right? Not really, Next.js' dev server seems to work just fine when only given only the `.next` folder, but trying to build it fails. In this way, Mintlify can publish their client in such a way that you can only run a local “preview” but can’t actually make a build.

Now, well, of course, it doesn't just end there. You see, Mintlify also happens to ship sourcemaps in their client folder. And if you know anything about sourcemaps, you know you're in for a treat. :sidenote[Sourcemaps are a way to map the original source code to the compiled code, so that you can debug the compiled code.]

Now, running something like [shuji](https://github.com/paazmaya/shuji) on the compiled code, you can get a nicely formatted version of the source code. Now, admittedly, they weren't the best still, some RSC compiled code too, but piecing them all nicely and finishing the puzzle by putting them in a next app, we had a mintlify client to go off the races. Wohoo!

Of course, this is not the end of the story. We still have to play catch-up with their updates to their client builds, so we spent the next ages trying to automate it.

### The hard work begins

Basil worked on a solution to allow us to download the client, building and patching it to work with our local environment. The patcher is a really cool solution, it used a bespoke plaintext patching format and library she made, with support for line-independent patching, minified codemods, and automatic patch generations.

Alyxia herself handled a lot of the infrastructure work, storing updated builds on a repo, writing documentation (using fantome btw!) and her funny endevour on getting the Mintlify Editor they have on their dashboard for standalone use by downloading and storing a static build of it.

Now, everything was in place, buuuuuuuuut:

### Fantome is joever

August 18, Alyxia messages that Mintlify has stopped shipping sourcemaps in their client builds. This is a huge deal, as it means that we have nothing to patch and work with. We knew this would happen anyway, and a big AND, I'm honestly surprised it took them this long (1500 versions later).

Fantôme was dead. The fun was over. A lot of the work on Fantôme was done to keep up with Mintlify's changes, but now it's all pointless.

I've been working on making the old snapshot of the code we have available, a monorepo that we can use for ourselves. But at this point, our energy was drained out and it will be a while before we get anywhere. The spark’s gone.

Will Fantôme ever be open sourced? Probably not. But basil may open source her patching library.
