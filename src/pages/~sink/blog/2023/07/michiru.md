---
layout: "^layouts/QuietLayout.astro"
title: How to make a Michiru
description: The coming together of my server
pubDate: "2023-07-20T00:00:00"
tags: ["*NIX"]
---

# How to make a [Michiru](https://michiru.yellows.ink)

## Why the name?

Well the most important part of anything ever is OBVIOUSLY the name, so why Michiru?

I already have a habit of naming computers after anime characters
(names include natsumi, kurisu, yasuhara, yasuko, and shouko),
so continuing that trend just made sense™️.

So, yeah, my server is named after [Michiru Kagemori from BNA](https://anilist.co/character/153541), I guess.

## What is it hosted on?

A [BuyVM](https://buyvm.net) KVM Slice 1024.

BuyVM is insanely cheap, reliable, has a great management UI, and offers a location in Luxembourg :D

## What OS is it running?

I chose to use [Alpine Linux](https://www.alpinelinux.org/), as it is simple, fast, and small.

I have got on very well with it so far.

## Okay, enough Q&As, let's set up a server!!

After following the Alpine Linux install guides to get set up, I made a user to be in charge of the whole thing,
`services`.

I then installed docker, which is basically as simple as `apk add`, `rc-update`, done.

I chose to run everything inside one docker-compose setup,
because it makes complex networking pretty easy:
I can connect only what's necessary to each other easily.

### Alright, serving some HTML?

Creating our `docker-compose.yml` file, we'll start with [Caddy](https://caddyserver.com/).

```yaml
version: "3"

services:

# --- Caddy ---
  caddy:
    container_name: caddy
    image: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    networks:
      - caddynet
    volumes:
      - ./caddy/Caddyfile:/etc/caddy/Caddyfile
      - ./www:/www
      - ./caddy/data:/data
      - ./caddy/config:/config
    cap_add:
      - NET_ADMIN


networks:
  - caddynet
```

There is a LOT to unpack here, so let's go bit by bit.

`container_name` sets the name of the container used in docker.
Without this compose would pick something kind of annoying.

`image` decides what actually is in the container - caddy here.

`restart: unless-stopped` is useful for a server like this.
If something crashes out, it'll restart the container automatically.

`ports` exposes ports from inside the container to the host.
This is how caddy can respond to requests.
Port 80 is for HTTP, port 443 for HTTPS, and port 443 in UDP mode for HTTP/3.

`networks: ...` adds the container to a network.
Only the containers that are exposing a web service will be added to `caddynet`,
and it keeps caddy from seeing a ton of useless ports.

`volumes` exposes necessary file system mounts to caddy.
The `caddy/data` and `caddy/config` mounts are required,
`Caddyfile` is how we'll configure caddy, and `www` is where we'll put our site.

`cap_add` allows caddy to do administrative action on the network.

Now we need to make a Caddyfile.
```sh
mkdir caddy www
touch caddy/Caddyfile www/index.html
```

Now start editing the Caddyfile:
```nginx
# your domains here
michiru.yellows.ink, 107.189.3.111 {
  encode zstd gzip

  root * /www
  file_server
}
```

`encode zstd gzip` enables response compression on big files,
`root * /www` sets the location of the files, and
`file_server` tells caddy to just serve files.

And now, you can add some html, maybe some css, etc in www/,
and bring up your containers with `docker-compose up -d`.

At this point you have a static site :)

### Adding [qBittorrent](https://www.qbittorrent.org/)

I'll add a container to the `services` in `docker-compose.yml`:

```yaml
  qbottorrent:
    container_name: qbittorrent
    image: cr.hotio.dev/hotio/qbittorrent
    restart: unless-stopped
    networks:
      - caddynet
    volumes:
      - ./qbittorrent/config:/config
      - ./qbittorrent/torrents:/data
```

Now, in the Caddyfile, between the encode line, and root:
```diff
redir /qbittorrent /qbittorrent/ 301
handle_path /qbittorrent/* {
  reverse_proxy * qbittorrent:8080
}
```

The redirect is to handle a missing trailing slash,
and `handle_path` tells caddy to remove the `/qbittorrent` path segment,
and then reverse proxy out to the qb container.

Run `docker-compose up -d` again, login with `admin` and `adminadmin`, then change the password.

I recommend changing the default torrent location to `/data`.

The finishing touch is to tick the box to use an alternate frontend, to use VueTorrent.

It sure would be nice to download the torrent output somehow... Caddy has us covered!

Add the torrent output into caddy's mounts in compose:

```yaml
- ./qbittorrent/torrents:/torrents
```

Add this into your Caddyfile:

```nginx
handle_path /torrents/* {
  basicauth {
    michiru $2a$14$.Z2Go6n5d3435zN31lC0yOGf4xYP49FTpyPzrcicUYNl9Xm8J81RO
  }

  root * /torrents
  file_server browse
}
```

Inside `basicauth` the format is `user passwordhash`.
Generate that big string by running `caddy hash-password` and typing your desired password in.

### [Sonarr](https://sonarr.tv/), [Radarr](https://radarr.video/)

These will want a network of their own:

```yaml
networks:
  - caddynet
  - arrnet
```

And container setups:
```yaml
# --- arr ---

  radarr:
    container_name: radarr
    image: cr.hotio.dev/hotio/radarr
    restart: unless-stopped
    logging:
      driver: json-file
    ports: ["7878:7878"]
    networks:
      - arrnet
      - caddynet
    volumes:
      - ./arr/config/radarr:/config
      - ./arr/data:/data

  sonarr:
    container_name: sonarr
    image: cr.hotio.dev/hotio/sonarr
    restart: unless-stopped
    logging:
      driver: json-file
    ports: ["8989:8989"]
    networks:
      - arrnet
      - caddynet
    volumes:
      - ./arr/config/sonarr:/config
      - ./arr/data:/data

  arr-qbittorrent:
    container_name: arr-qbittorrent
    image: cr.hotio.dev/hotio/qbittorrent
    restart: unless-stopped
    ports: ["8080:8080"] # DANGER, follow the text carefully.
    networks:
      - arrnet
    volumes:
      - ./arr/config/qbittorrent:/config
      - ./arr/data:/data
```

Now start this setup, and login to your server at port 8080.

Don't bother changing the password, but do change the default download location to /data,
and a time limit or ratio limit for seeding.

Now, remove the ports field to un-expose the client. This is important.

Log in to sonarr and radarr on their ports, and set their url bases to `/sonarr` and `/radarr` respectively.

You can remove the ports fields from these two as well now - time to setup caddy.

```nginx
reverse_proxy /sonarr/* sonarr:8989
reverse_proxy /radarr/* radarr:7878

redir /sonarr /sonarr/ 301
redir /radarr /radarr/ 301
```

Okay, now you can go and setup these two on the subpaths (after you restart caddy).

It's worth mentioning at this point that you probably need to explicitly
restart caddy with `docker container restart caddy` after changing the Caddyfile.

Finally, make your file system structure:
```
arr/data
|- torrents
|- media
|  |- movies
|  |- tv
|- usenet
   |- incomplete
   |- complete
      |- movies
      |- tv
```

The only other specific thing here is setting up the download client in sonarr/radarr.

```
host: arr-qbittorrent
port: 8080
use ssl: no
username: admin
password: adminadmin
category: tv (sonarr) / movies (radarr)
remove completed: true
everything else default
```

To expose the output to the world you can use caddy the same as when we exposed
the output of qBittorrent.

### [Komga](https://komga.org/)

Komga is a manga server.

Let's create a container, and expose qBittorrent's output to it:

```yaml
  komga:
    container_name: komga
    image: gotson/komga
    restart: unless-stopped
    networks:
      - caddynet
    volumes:
      - ./komga:/config
      - ./qbittorrent/torrents:/data
```

Make a file `komga/application.yml` with this config:
```yaml
server:
  servlet:
    context-path: /komga
```

and expose it in caddy:
```nginx
reverse_proxy /komga/* komga:25600

redir /komga /komga/ 301
```

Then you just have to setup a library and you're done.

### ~~Calckey~~ [Firefish Social](https://joinfirefish.org/)

I uh, need a fresh coffee before I write this... one sec...

I also need to mess about with the rebranding. Yeah, give me some time,
I'll fill this section soon I promise.

## Conclusion

Anyway, thats how to make a michiru. I guess.

 -- Yellowsink
