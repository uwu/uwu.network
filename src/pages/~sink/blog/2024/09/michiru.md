---
layout: "^layouts/QuietLayout.astro"
title: The State of Michiru, Sept 2024
description: A thorough coverage of my server.
pubDate: "2024-09-23T01:37:00"
tags: ["*NIX"]
---

# The State of Michiru, Sept 2024

I rent a server from BuyVM, as I have done for about a year now.
Since I [last covered it](../../2023/07/michiru), a lot has changed,
and there's much more I want to talk about publicly, because I'm very proud of how I have everything set up.

I host a lot of services on there for personal use, and have found it to be a worthwhile investment.

This is a really long one, so I'm gonna put a ToC here:

- [Architectural Decisions](#architectural-decisions)
- Infrastructure
  * [Docker Compose](#infrastructure-docker-compose)
  * [Caddy](#infrastructure-caddy)
  * [Headscale](#infrastructure-headscale)
    - [Ouroboros](#ouroboros-headscale-pt-2)
  * [File Browser](#infrastructure-file-browser)
- Services
  * [qBittorrent](#services-qbittorrent)
  * [*arr](#services-arr)
  * [Jellyfin](#services-jellyfin)
  * [SOCKS](#services-socks-proxy)
  * [Hedgedoc](#services-hedgedoc)
  * [Goatcounter](#services-goatcounter)
  * [Monica](#services-monica)
- More Infrastructure
  * [Backups](#infrastructure-backups)
  * [Emails](#infrastructure-email)

## Architectural Decisions

The server has two users configured: `sink`, and `services`.
`sink` is for me to do maintenance when logged in, and has sudo access.
`services` has absolutely no special privileges, other than being in the `docker` group.
`services` owns all the services and media files - which run out of `/home/services`.

`/home/services` contains a docker compose file, and multiple directories for various services running on it.

`/mnt/slab` contains a block storage slab, which is of much higher capacity (512GB vs 40GB) than the server SSD.
It is used for large files.

Each service runs inside a docker container, specified in a `docker-compose.yaml`.
Each service is only networked to containers it needs to be connected to, via docker networks.

The `root` user's SSH access is key-only, not that there are any keys for root.

Two things run under the root user: backups, and emails. See the end for information on those.

## Infrastructure: Docker Compose

Docker compose is responsible for management of the services running. All have a form like the following:
```yml
myservice:
	container_name: myservice
	restart: unless-stopped
	user: "1001:1001"
	environment:
		- PUID=1001
		- PGID=1001
```

Anything else are extras.
When container configurations are listed from this point on, these settings will be implied and not specified.

Containers are organised into groups that need to be networked to each other, and are connected only to those necessary:
```yml
networks:
	calcnet:
	arrnet:
	caddynet:
	hedgenet:
	monicanet:
```

- `calcnet` - unused, previously for connecting Calckey to its DB and Meilisearch instance
- `arrnet` - for all *arr services to connect to each other
- `caddynet` - for all containers with a public web service to connect to Caddy
- `hedgenet` - for Hedgedoc to access its DB
- `monicanet` - for Monica to access its DB

## Infrastructure: Caddy

The first point of contact for your traffic into Michiru is Caddy, the all-singing all-dancing HTTP server that does
everything.

Caddy is responsible for routing traffic to the right place, filtering out disallowed traffic from VPN-only services,
response compression, serving static files with a nice UI, serving static files with a nice UI and authentication,
serving static files without a UI, applying some basic response templating, obtaining SSL certificates, and redirecting
insecure traffic to secure endpoints.

The docker configuration for this looks like the following:

```yml
caddy:
	image: caddy
	ports:
		- "80:80"
		- "443:443"
		- "443:443/udp"
	networks: ["caddynet"]
	volumes:
		- ./caddy/Caddyfile:/etc/caddy/Caddyfile
		- ./www:/www
		- /mnt/slab/arr:/arrdata
		- ./caddy/data:/data
		- ./caddy/config:/config
		- /mnt/slab/torrents:/torrents
	cap_add: ["NET_ADMIN"]
```

This is configured via a Caddyfile, similar to the following, but with some repetition removed:
```caddyfile
(tailscale_guard) {
	# all traffic (v4 and v6) from taiilscale gets sent to this address when inside of docker.
	@public not remote_ip 172.20.0.1
	abort @public
}

michiflare.yellows.ink, michiru.yellows.ink, http://107.189.3.111, http://michiru.hs.yellows.ink, http://michiru {
	encode zstd gzip

	redir /sonarr /sonarr/ 301 # etc

	# route stops caddy from reordering directives, else `templates` would be applied to reverse_proxy responses.
	route {
		reverse_proxy /sonarr/* sonarr:8989 # etc

		# strip off the leading part of the path before reverse proxying
		handle_path /qbittorrent/* {
			reverse_proxy qbittorrent:8080
		}

		handle_path /torrents/* {
			basicauth {
				michiru xxxxxxxxxxxxxxxxxx
			}
			root * /torrents
			file_server browse
		}

		root * /www
		templates
		file_server
	}
}

michiscale.yellows.ink {
	@grpc protocol grpc
	handle @grpc {
		# h2c is HTTP/2 Cleartext
		reverse_proxy h2c://headscale:50433
	}

	redir / /ouroboros/ 301

	reverse_proxy /ouroboros/* ouroboros:8080
	reverse_proxy /register/*  ouroboros:8080

	reverse_proxy headscale:8080
}

# VPN-private service, inaccessible to the public internet
monica.yellows.ink {
	import tailscale_guard
	reverse_proxy monica:80
}
```

Some things I want to point out:
 - Note the redirections to handle lack of trailing slashes
 - All traffic from a tailscale node (on the host) to a docker container goes via `172.20.0.1`.
   Public traffic to caddy in docker is exposed as the *real* IP.
   This allows us to use Caddy as a part of our security strategy.
 - `reverse_proxy /path/* dest` will forward the request unmodified, `handle_path /path/* {}` strips the start off the path sent on.
 - We can match for protocols eg redirect gRPC to a different port.
 - Caddy can play an active part in Ouroboros' interception of some Headscale endpoints.
 - Endpoints that cannot serve secure traffic have an explicit `http://` prefix to tell caddy not to redirect them,
   nor try provisioning certificates for them.
 - The `http://michiru` endpoint is a result of [Tailscale MagicDNS](https://tailscale.com/kb/1081/magicdns)

## Infrastructure: Headscale

A key feature of Michiru is hosting a tailnet for it, my personal devices, and some friends' devices.
Instead of relying on the tailscale.com hosted services, I run [Headscale](https://headscale.net), an open source,
self-hosted control server for the Tailscale protocol and clients.

Michiru uses Headscale to host the network, provide DNS records for private services, and host a DERP server for
firewall circumvention.

The docker configuration looks like the following
```yml
headscale:
	image: headscale/headscale:0.23.0
	ports: [3478:3478] # derp stun port
	command: serve
	volumes:
		- ./headscale/config:/etc/headscale/
	networks: [caddynet]
```

And the configuration file looks like the following, which I'll walk through step by step

```yml
---
server_url: https://michiscale.yellows.ink:443
```

This is the URL that users will set as the coordination/login server URL in their clients.

```yml
listen_addr: 0.0.0.0:8080
metrics_listen_addr: 0.0.0.0:9090
grpc_listen_addr: 0.0.0.0:50443
grpc_allow_insecure: true
```

These are the addresses and ports headscale will listen for connections on.
gRPC must accept insecure connections for ouroboros to work. They are secured by Caddy anyway.

```yml
noise:
	# The Noise private key is used to encrypt the
	# traffic between headscale and Tailscale clients when
	# using the new Noise-based protocol.
	private_key_path: /etc/headscale/noise_private.key
```

Configuration for wireguard stuff, doesn't need tweaking.

```yml
prefixes:
	v6: fd7a:115c:a1e0::/48
	v4: 100.64.0.0/10

	allocation: sequential
```

These prefixes can only be set to these, or more restrictive. These are the ranges Headscale will allocate IPs from.

Sequential allocation means that devices are assigned IPs numerically, counting upwards, by join date.
The other option is random allocation, where each device is given a random IP at join time.

```yml
derp:
	server:
		enabled: true

		region_id: 999

		region_code: mru
		region_name: Michiru DERP

		stun_listen_addr: 0.0.0.0:3478

		private_key_path: /etc/headscale/derp_server_private.key

		automatically_add_embedded_derp_region: true

		ipv4: 107.189.3.111
		ipv6: 2605:6400:30::1

	urls: []
	# - https://controlplane.tailscale.com/derpmap/default
	paths: []
	auto_update_enabled: true
	update_frequency: 24h
```

This section configures the DERP protocol (proxies wireguard traffic over HTTP for firewall circumvention).

The embedded server is enabled, and given a region code that won't overlap with anything.
If it does overlap, the built-in server overrides other options in that region.
It listens on port 3478, as is standard.

It is automatically added to the list sent to clients, and the ips are listed (optional) for increased stability.

The default set of DERP servers is commented out as I had issues connecting to the embedded DERP server with them active,
even when the network was blocking any other options.

```yml
disable_check_updates: false
ephemeral_node_inactivity_timeout: 30m
node_update_check_interval: 10s
```

Some misc stuff related to headscale updates, and checking that nodes are still alive.

```yml
database:
	type: sqlite

	sqlite:
		path: /etc/headscale/db.sqlite
		# https://www.sqlite.org/wal.html
		write_ahead_log: true
```

This section tells Headscale where to find its database, and enables the SQLite write-ahead-log to improve performance.

```yml
acme_url: https://acme-v02.api.letsencrypt.org/directory
acme_email: ""
tls_letsencrypt_hostname: ""
tls_letsencrypt_cache_dir: /etc/headscale/cache
tls_letsencrypt_challenge_type: HTTP-01
tls_letsencrypt_listen: ":http"

tls_cert_path: ""
tls_key_path: ""
```

TLS configuration options. Not used as headscale is proxied through Caddy.

```yml
log:
	format: text # or json
	level: info

policy:
	mode: file
	path: ""
```

Logs are plaintext and at info level, and ACLs are not used.

```yml
dns:
	# Force clients to use this config
	override_local_dns: true

	nameservers:
		global:
			# cf
			- 1.1.1.1
			- 1.0.0.1
			- 2606:4700:4700::1111
			- 2606:4700:4700::1001
			# quad9, my preference for DNS
			- 9.9.9.9
			- 149.112.112.112
			- 2620:fe::fe
			- 2620:fe::9

		split: {}

	search_domains: []

	extra_records:
		- name: monica.yellows.ink
			type: A
			value: 100.64.0.2
		- name: monica.yellows.ink
			type: AAAA
			value: fd7a:115c:a1e0::2

	magic_dns: true

	base_domain: hs.yellows.ink
```

Clients have their nameservers list forced to as follows
 - 100.100.100.100 - the tailscale client built in DNS server
 - Cloudflare 1.1.1.1 servers
 - Quad9 servers

A and AAAA records are injected by 100.100.100.100 for one service with *tailnet-internal* IPs for Michiru.

MagicDNS is enabled, with all devices being given domains such as `hazel-laptop.hs.yellows.ink`.

```yml
unix_socket: /var/run/headscale/headscale.sock
unix_socket_permission: "0770"
```

For the headscale CLI. Used only for administation tasks.

```yml
logtail:
	enabled: false

randomize_client_port: false
```

Some firewalls don't like the default Wireguard port. I don't have issues so w/e.
I don't use the Tailscale logging infrastructure.

Phew! That's a lot of configuration.
And we're not done.

### Ouroboros: Headscale, pt. 2

Headscale does not provide a dashboard, like tailscale.com does. So I wrote my own.

[Ouroboros](https://github.com/yellowsink/ouroboros) is an application that allows network members to:
 - authenticate via GitHub OAuth2 to access a dashboard
 - view, rename, expire, and remove their devices
 - enable and disable routes and exit nodes
 - register new devices

All these things would require manual intervention from a sysadmin without this.

Ouroboros, when used in docker, is configured entirely through environment variables:
```yml
ouroboros:
	image: yellosink/ouroboros:0.3.1 # look mom! my own software! on my server!
	environment:
		- HS_IS_REMOTE=true
		- HS_ADDRESS=michiscale.yellows.ink:443 # going to the container directly doesn't work for some reason, just go to caddy.
		- HS_API_KEY=REDACTED
		- HS_LOGIN_URL=michiscale.yellows.ink
		- GH_CLIENT_ID=REDACTED
		- GH_CLIENT_SECRET=REDACTED
		- 'USER_MAP={ "19270622": "sink", "0000": "REDACTED" }'
	networks: [caddynet]
```

- `HS_IS_REMOTE` tells ouroboros that Headscale is over a network, not directly accessible (I could technically expose a socket to both containers)
- `HS_ADDRESS` is where to find Headscale on the network
- `HS_API_KEY` is an API key
- `HS_LOGIN_URL` is the login URL to be displayed to users
- `GH_CLIENT_ID` is the GitHub OAuth2 Client ID
- `GH_CLIENT_SECRET` is the GitHub OAuth2 Client Secret
- `USER_MAP` is a JSON map of allowed GitHub user IDs to Headscale usernames

And that's it! That's the tailnet.

## Infrastructure: File Browser

The annoyingly generically named [File Browser](https://filebrowser.org/) is an application offering remote file
management, archiving for download, uploading, editing, etc.

It allows for nice user permission configuration, so I can see the services directory and the media drive, but other
users can only see the media drive.

```yml
filebrowser:
	image: filebrowser/filebrowser:v2.30.0-s6
	volumes:
		- ./filebrowser/database.db:/database/filebrowser.db
		- ./filebrowser/config.json:/config/settings.json
		- /mnt/slab:/srv/slab
		- /home/services:/srv/services
	networks: [caddynet]
```

## Services: qBittorrent

One of the things I use Michiru for is as a torrent box. Its location is ideal for this.

I can both use it as a seedbox, and as a more convenient way to torrent something and download it later.

I set up a directory on my media drive, `/mnt/slab/torrents`, and a container like so:

```yml
qbittorrent:
	image: ghcr.io/hotio/qbittorrent
	ports: ["6432:6432"]
	networks: ["caddynet"]
	volumes:
		- ./qbittorrent/config:/config
		- /mnt/slab/torrents:/data
```

And in terms of actual configuration, I set it to use the VueTorrent dashboard, its much nicer.

## Services: *arr

The [*arr family of services](https://wiki.servarr.com/) are great for self hosted media servers.

Sonarr will automatically grab TV Shows from trackers and other sources as they air, Radarr does the same for movies,
Jackett provides many more tracker integrations, and Flaresolverr can solve CAPTCHAs for Jackett.

I create a directory structure on my disk as so:
```
/mnt/slab/arr
  |- media
     |- movies
     |- tv
  |- torrents
     |- movies
     |- tv
  |- usenet
     |- complete
     |- incomplete
```

I have them set in docker as so:

```yml
radarr:
	image: ghcr.io/hotio/radarr
	logging:
		driver: json-file
	networks:
		- arrnet
		- caddynet
	volumes:
		- ./arr/config/radarr:/config
		- /mnt/slab/arr:/data

sonarr:
	image: ghcr.io/hotio/sonarr
	logging:
		driver: json-file
	networks:
		- arrnet
		- caddynet
	volumes:
		- ./arr/config/sonarr:/config
		- /mnt/slab/arr:/data

arr-qbittorrent:
	image: ghcr.io/hotio/qbittorrent
	networks:
		- arrnet
	volumes:
		- ./arr/config/qbittorrent:/config
		- /mnt/slab/arr:/data

jackett:
	image: ghcr.io/hotio/jackett
	networks:
		- arrnet
		- caddynet
	volumes:
		- ./arr/config/jackett:/config

flaresolverr:
	image: ghcr.io/flaresolverr/flaresolverr
	networks:
		- arrnet
```

Now for configuration.

### Sonarr configuration

URL Base: `/sonarr`.

Authentication: forms, enabled.

Date formats configured as I like.

Standard Episode Format: `S{season:00}E{episode:00} - {Series Title}`.

Season Folder Format `S{season:00}`.

I use hardlinks instead of copies.

I have 1337x set up through Jackett:
 - `http://jackett:9117/api/v2.0/indexers/...`
 - categories: TV/SD TV/HD TV/Documentary TV/DVD TV/Divx/Xvid TV/SVCD/VCD TV/Documentary TV/HD TV/HEVC/x265 TV/Cartoons TV/SD
 - anime categories: TV/Anime Anime/Anime Anime/Dual Audio Anime/Subbed
 - anime standard format search off (I don't know if this is right)

And Nyaa.si directly:
 - anime standard format search on

I configure my download client:
 - `arr-qbittorrent`
 - category: tv
 - remove completed

### Radarr configuration

URL Base: /radarr

Authentication: as above.

Use hardlinks.

Standard format: `{Movie Title} ({Release Year}) {Quality Full}`

I have Nyaa set up the same as on sonarr.

Jackett 1337x is the same but with these categories: Movies/\*, Anime/Anime, TV/Anime, Anime/\*

Jackett YTS set up with all non-3D categories.

qBittorrent set up as in sonarr but with category: movies.

### qB configuration

Torrents are paused at ratio of 2 or 480 minutes of seed.

### Jackett configuration

1337x, nyaa, and YTS are setup.

Base path /jackett

External access allowed

Flaresolverr set to `http://flaresolverr:8191`

## Services: Jellyfin

Having media automatically downloaded is nice and all, but I wanna watch it on my phone on the go. How?

Simple: use Jellyfin.

```yml
jellyfin:
	image: ghcr.io/hotio/jellyfin
	networks: ["caddynet"]
	volumes:
		- ./jellyfin:/config
		- /mnt/slab/arr/media:/data
```

I set up a few users, all with transcoding turned off.

I add my libraries,
 - prefer embedded titles
 - allow all embedded subs
 - real time monitoring
 - enable trickplay extraction
 - enable chapter image extraction
 - subtitle downloads in english
 - allow inexact matches for sub downloads

Set up trickplay: non-blocking, low priority, 320 wide, jpeg 70, qscale 15

base url /jellyfin.

don't require https.

allow remote access.

plugins: ani-sync, anilist, audiodb, infusesync, intro skipper, musicbrainz, omdb, open subtitles, playback reporting,
reports, simkl, studio images, tmdb, transcode killer

I authenticate ani-sync with my anilist account and
- only change in plan-to-watch
- automatically set as rewatching


Sign into open subtitles.

## Services: SOCKS Proxy

```yml
microsocks:
	image: heywoodlh/microsocks
	ports: ["1080:1080"]
	command: '-u michiru -P REDACTED'
```

## Services: Hedgedoc

Hedgedoc is a realtime markdown collaboration platform.

```yml
uwuhedgedocdb:
	image: postgres:13.4-alpine
	environment:
		- POSTGRES_USER=hedgedoc
		- POSTGRES_PASSWORD=REDACTED
		- POSTGRES_DB=hedgedoc
	volumes:
		- ./hedgedoc/db:/var/lib/postgresql/data
	networks:
		- hedgenet

uwuhedgedoc:
	image: quay.io/hedgedoc/hedgedoc:1.9.9
	environment:
		- CMD_DB_URL=postgres://hedgedoc:REDACTED@uwuhedgedocdb:5432/hedgedoc
		- CMD_DOMAIN=doc.uwu.network
		- CMD_PROTOCOL_USESSL=true
		- CMD_EMAIL=false
		- CMD_ALLOW_ANONYMOUS=false
		- CMD_TOOBUSY_LAG=1000 # at the default 70 we keep getting "too busy" responses
		- CMD_ALLOW_FREEURL=true
		- CMD_SESSION_SECRET=REDACTED
		- CMD_GITHUB_CLIENTID=REDACTED
		- CMD_GITHUB_CLIENTSECRET=REDACTED
	volumes:
		- ./hedgedoc/uploads:/hedgedoc/public/uploads
	networks:
		- hedgenet
		- caddynet
	depends_on:
		- uwuhedgedocdb
```

## Services: Goatcounter

I run an instance of the privacy friendly analytics service [Goatcounter](https://goatcounter.com) for my blog.

```yml
qsgoatcounter:
	image: joeygennari/goatcounter:latest
	volumes:
		- ./goatcounter/:/home/user/db/
	networks: [caddynet]
```

"Your Site", uwu.network.

"Dashboard viewable by", only logged in users.

"GoatCounter Domain", qsgcount.yellows.ink.

"Ignore IPs", a few of my personal IPs - and 172.26.0.2 for tailnet traffic.

## Services: Monica

Monica is an awesome personal CRM. I love it.

I've had issues with its MariaDB database recently, but hopefully it should clear up.

This is currently the one service in the set that is tailnet-private, to protect it a bit more.

```yml
monica:
	#image: monica:fpm
	image: monica:4.1.2-apache
	depends_on: [monicadb]
	volumes:
		- ./monica:/var/www/html/storage
	environment:
		- APP_KEY=REDACTED
		- APP_URL=https://monica.yellows.ink
		- APP_ENV=production
		#- APP_FORCE_URL=true
		- DB_HOST=monicadb
		- DB_USERNAME=monica
		- DB_PASSWORD=REDACTED
	networks: [caddynet, monicanet]

monicadb:
	image: mariadb:11.4.2 # DO NOT UPGRADE THIS CONTAINER
	volumes:
		- ./monica/mysql:/var/lib/mysql
	environment:
		- MARIADB_RANDOM_ROOT_PASSWORD=true
		- MARIADB_DATABASE=monica
		- MARIADB_USER=monica
		- MARIADB_PASSWORD=REDACTED
	networks: [monicanet]
```

And that's all the services!

## Infrastructure: Backups

After a slight scare with potentially (actually not at all) losing data from Monica, I realised I NEED backups.

I considered BuyVM's $0.50/mo nightly backup service, which holds 7 backups at a time.
This is nice as I don't have to set anything up and can't run out of resources, but is bad because I cannot download
the backups directly, only apply them to my server.

I ended up instead, self-hosting [Restic](https://restic.readthedocs.io/) as my backup solution,
and [ResticProfile](https://creativeprojects.github.io/resticprofile/) as my configuration and scheduling tool.

First, I created a bucket on Backblaze B2, and set its retention policy to only hold the most recent copy of any file.
Next I created an application key that doesn't expire with R/W access to that bucket only. Those are my S3 credentials.

Next, I generated a big password and put it in `/root/restic_password.txt`, and set its perms to `600`.
This encrypts my backup. I also put it in my password manager, so if my entire server dies, I have it.

I created a repository with
```sh
restic -r s3:s3.us-west-004.backblazeb2.com/michibak-services init
```

Then created my `/root/profiles.toml` file:

```toml
version = "1"

[global]
	# see ionice(1)
	ionice = true
	ionice-class = 2 # best-effort
	ionice-level = 6 # 0-7, low number is more priority

	priority = "low" # cpu nice

	# require some headroom before doing anything
	min-memory = 100 # MB

	scheduler = "crond"

[default]
	repository = "s3:s3.us-west-004.backblazeb2.com/michibak-services"
	password-file = "restic_password.txt"
	initialize = false

	# mutex execution, handled by rprofile not restic
	lock = "/tmp/resticprofile-services.lock"

	# generate a status file for inspection later if the log isnt enough
	status-file = "services-status.json"

	[default.env]
		AWS_ACCESS_KEY_ID = "REDACTED"
		AWS_SECRET_ACCESS_KEY = "REDACTED"

	[default.backup]
		verbose = true
		source = [ "/home/services" ]

		schedule = "04:00:00" # every 4am
		schedule-permission = "system"
		schedule-lock-wait = "1h"
		schedule-log = "/root/resticprofile-schedule-services.log"

		# automatically bring down docker services first so databases are flushed et
		run-before = "docker compose -f /home/services/docker-compose.yml stop"
		run-after = "docker compose -f /home/services/docker-compose.yml start"

		# oh no! don't bring docker back up, and send me an email.
		run-after-fail = "/root/email-restic-services-alert.sh"
```

Piece by piece:
 - the `ionice` settings set Restic to have a lower priority for disk access than anything else.
 - the `priority` setting sets Restic to have a lower priority for CPU time than anything else.
 - the `min-memory` setting makes sure I don't OOM.
 - the `scheduler` setting tells ResticProfile that I don't have systemd, and to use crond instead.
 - `repository` tells ResticProfile where to find the files
 - `password-file` contains the encryption passsword
 - `initialize = false` tells it not to try and create a repo if it can't find one for some reason
 - `lock` is a file that ResticProfile uses to ensure only one run active at a time
 - `status-file` is a file containing the last run's status, useful for the email reporting
 - `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are the B2 authentication key details
 - `verbose` prints more information to the command line and therefore log
 - `source` is a list of directores to include
 - `schedule` tells it to run every day at 4am local time (Europe/London)
 - `schedule-permission = "system"` runs Restic as root
 - `schedule-lock-wait = "1h"` tells ResticProfile to wait max 1 hour for a previous session to drop the lock
 - `schedule-log` is where to write the log out to for scheduled runs
 - `run-before` pulls down docker containers gracefully, so databases are flushed etc
 - `run-after` starts all the containers again if everything goes well
 - `run-after-fail` sends an email if anything goes wrong

The email failure script looks like this:

```sh
#!/bin/sh

# email-send.sh args:
# - source name
# - dest name <dest email>
# - subject line
# - extra headers
# - message body

safecat() {
	[ -f "$1" ] && cat "$1"
}

./email-send.sh \
	'Michiru Restic Alerts' \
	'Hazel Atkinson <yellowsink@riseup.net>' \
	'**ERROR** Restic Failure Report' \
	'Content-Type: text/html; charset=ISO-8859-1' \
	"<h1>Restic Failure Report</h1>

	<p>The scheduled Restic backup run <strong><span style='color: red'>failed</span></strong>.
	<p>The contents of the status file are:</p>

	<code>
	<pre>
	$(safecat services-status.json)
	</pre>
	</code>

	<p>And the contents of the log file are:</p>

	<code>
	<pre>
	$(safecat resticprofile-schedule-services.log)
	</pre>
	</code>

	<p>Due to the failure, the docker containers have not been restarted.</p>

	<p>This email was automatically generated at $(date) by <i>Hazel's magic email scripts:tm:</i> on <a href="https://michiru.yellows.ink">Michiru</a>.</p>"
```

This is a busybox ash compatible shell script using my email sender noted below.

Note the `safecat` function that will not cat a file if it doesn't exist.

## Infrastructure: Email

Sending email is a great way to get a status report or alert from a server.

After getting the ports unblocked via BuyVM support, I set my server up to log into mail.riseup.net with my credentials,
and send an email from `michiru@riseup.net`.

The script to do this uses Busybox Sendmail and OpenSSL s_client.

```sh
#!/bin/sh

# super secret, this file should be executable but not readable by anyone else
PASS=REDACTED

# expect the following args:
# - source name
# - dest name <dest email>
# - subject line
# - extra headers
# - message body
SENDNAME="$1"
RECIPIENT="$2"
SUBJECT="$3"
EXTRAHEADS="$4"
BODY="$5"

EMAIL="From: $SENDNAME <michiru@riseup.net>
To: $RECIPIENT
Subject: $SUBJECT
Date: $(date -R)
$EXTRAHEADS

$BODY"

# -H: connection Helper, openssl can perform TLS for us (or STARTTLS if needed)
# -v: print full ESMTP conversation
# -t: pick up recipients from the body
# -f: sender email
# -amPLAIN: default is LOGIN, but that is deprecated in favour of PLAIN
# -au: username
# -ap: password

echo "$EMAIL" | sendmail -H 'openssl s_client -quiet -tls1_3 -connect mail.riseup.net:465' -v -t -f michiru@riseup.net -amPLAIN -auyellowsink -ap"$PASS"
```

This script allows reliably sending email, mainly to myself, from the command line.

## Conclusion

And that is a relatively thorough rundown of how I operate my server, Michiru, as of Sept 2024.

I hope some of you find this interesting or useful, hope to see you back here again soon.

 -- sink
