---
layout: "^layouts/QuietLayout.astro"
title: Hosting your own DNS for fun (but not profit)
description: A convenient workaround, and a more self controlled network infrastructure.
pubDate: "2024-10-03T16:27:00"
tags: ["*NIX"]
---

# Hosting your own DNS for fun (but not profit)

I like to use non-mainstream DNS resolvers in my day-to-day life. Generally, I use [Quad9](https://quad9.net/), and on
the very off chance that that doesn't resolve what I want,
fallback to [1.1.1.1](https://developers.cloudflare.com/1.1.1.1/).

I had this set automatically on all of my devices via my Tailscale server, which was working pretty well.

## The issue with Tailscale

I recently moved into university, and is common for more locked down networks, only one DNS server is allowed:
their own DNS server obtained via DHCP.
What happens if you try to use any others? Simple! Get firewalled!

Common DNS resolvers have their <abbr title="DNS-over-HTTP">DoH</abbr> domains blocked, so that won't work,
and ports 53 (DNS, DNS-over-TCP) and 853 (DNS-over-TLS) are blocked.

Tailscale requires using custom DNS - while on Android I can disable it, on Linux I need to have non-DHCP DNS servers.

So I can pick between using Tailscale or having internet. Not good.

### Tangent: What about DNS-over-QUIC?

The relatively new QUIC and HTTP/3 protocols are, in fact, allowed on this network, so, is DNS-over-QUIC allowed?

DoQ is relatively new and unsupported - Quad9 doesn't offer it, but AdGuard do!
I installed the [q](https://github.com/natesales/q) client to try it, and...
```sh
$ q yellows.ink @dns.adguard.com
# hangs until timeout

$ q yellows.ink @quic://dns.adguard.com
yellows.ink. 5m A 104.21.36.236
yellows.ink. 5m A 172.67.200.208
yellows.ink. 5m AAAA 2606:4700:3031::6815:24ec
yellows.ink. 5m AAAA 2606:4700:3032::ac43:c8d0
yellows.ink. 24h NS decker.ns.cloudflare.com.
yellows.ink. 24h NS sneh.ns.cloudflare.com.
yellows.ink. 5m MX 14 route2.mx.cloudflare.net.
yellows.ink. 5m MX 51 route3.mx.cloudflare.net.
yellows.ink. 5m MX 84 route1.mx.cloudflare.net.
yellows.ink. 5m TXT "openpgp4fpr:69508A81E697A65220C2E707DB78982E597E772A"
yellows.ink. 5m TXT "v=spf1 include:_spf.mx.cloudflare.net include:_spf.riseup.net ~all"
```

So DoQ does work on this network, but I wouldn't expect that to last forever. It also won't work on most systems!

## How can I get around the firewall?

So, I can't send requests to DNS over the public internet aside from the DHCP one, but what if I ran my own server?
Then I could use DNS-over-HTTP(S) on my own server! Right?

Well, this is true, but I found an even better way on accident!
When my system starts up, it will use the default DHCP DNS resolver to get an address for `michiscale.yellows.ink`
(I could put this in my `/etc/hosts` if I really wanted an airtight system), then connects to my Tailscale network.

I now have an encrypted and impenetrable VPN tunnel alive to my server...
and I can access any port I want on that server transparently...
so if I point my system DNS resolver to the Tailscale IP, it will transparently use classical UDP DNS to my own server,
but via an encrypted and secure WireGuard tunnel away from any sniffing! Nice!

Works perfectly. I can inject records if I want, but Headscale let me do that anyway, so I'm just forwarding requests
to 9.9.9.9 or failing that 1.1.1.1.

## Picking a DNS server

I had a couple choices for DNS servers to try.

First up was [CoreDNS](https://coredns.io/), they're very modular and seem very Caddy-inspired,
but their Docker container ships with basically none of the plugins which makes it near useless. Aw. That's Out.

Next up I tried [Technitium](https://technitium.com/),
which looked great but just I could not get the dashboard serving.
If I can't get into the dashboard, I can't make it work, so that had to go out.

BIND9 looked very intimidating, but next I decided to try [Hickory DNS](https://github.com/hickory-dns/hickory-dns/).

Hickory does not have *amazing* docs, but I managed to get it working 🎉, and it's running in prod now.

We'll get to hickory again later, but first, I have to cover a tangent:

### Tangent: The SOA Record

Of the many DNS record types, SOA might be one of the least common to encounter, but is important.
The *start of authority* record is used to announce information about your server and zones to the world.

It has the following structure
- `@` - name of the zone, @ refers to the previous record in BIND zone files.
- `IN` - the zone class (type), `IN` stands for "internet".
- `SOA` - the record type!
- TTL - time to live for this record
- `dns.mydomain.net.` - the `MNAME`, the primary nameserver for your zone - this should be your DNS server!
  * this is there so that other DNS servers can talk to you, to propagate updates.
- `admin.mydomain.net.` - the `RNAME`, which is, unexpectedly, an *email address*.
  The first `.` is substituted for the `@`, so e.g. my zone RNAME is `michiru.riseup.net`,
  which doesn't exist as a domain, but `michiru@riseup.net` does!
- serial number - if a downstream DNS server sees the serial number increase, it assumes the zone changed and refreshes.
- refresh time - number of seconds after which downstream DNS servers should query the SOA to detect serial increases.
  * recommendation: 86400 (24h)
- retry time - number of seconds after which downstream DNS servers should retry a request to you if it fails
  * recommendation: 7200 92h
- expire time - number of seconds after which downstream DNS servers should stop answering with your records if you are
  not responding to requests.
  * recommendation: 3600000 (1000h)
- minimum TTL - authoritative servers take the min(SOA TTL, minimum TTL)
  as the SOA's TTL when replying with negative answers.
  * recommendation: 172800 (2d)

Sample in BIND9 zone syntax:
```
$TTL 3D
@               IN      SOA     michiru.yellows.ink. michiru.riseup.net. (
                                199609203       ; Serial
                                28800   ; Refresh
                                7200    ; Retry
                                604800  ; Expire
                                86400)  ; Minimum TTL
```

## Setting up Hickory

Hickory runs off two things: a `named.toml` file, and a set of zone files (the standard format for DNS record storage).

First, I set up a docker container:
```yml
  hickory:
    container_name: hickory
    image: hickorydns/hickory-dns:latest
    restart: unless-stopped
    ports:
      - "53:53/tcp"
      - "53:53/udp"
    volumes:
      - ./hickorydns/named.toml:/etc/named.toml:ro
      - ./hickorydns/default:/var/named/default:ro
```

Then, created my named.toml based off an example:
```toml
## Default zones, these should be present on all nameservers, except in rare
##  configuration cases
[[zones]]
zone = "localhost"
zone_type = "Primary"
file = "default/localhost.zone"

[[zones]]
zone = "0.0.127.in-addr.arpa"
zone_type = "Primary"
file = "default/127.0.0.1.zone"

[[zones]]
zone = "0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa"
zone_type = "Primary"
file = "default/ipv6_1.zone"

[[zones]]
zone = "255.in-addr.arpa"
zone_type = "Primary"
file = "default/255.zone"

[[zones]]
zone = "0.in-addr.arpa"
zone_type = "Primary"
file = "default/0.zone"

[[zones]]
## zone: this is the ORIGIN of the zone, aka the base name, '.' is implied on the end
##  specifying something other than '.' here, will restrict this forwarder to only queries
##  where the search name is a subzone of the name, e.g. if zone is "example.com.", then
##  queries for "www.example.com" or "example.com" would be forwarded.
zone="."
zone_type = "Forward" # primary, secondary, hint, forward

stores = { type = "forward", name_servers = [{ socket_addr = "9.9.9.9:53", protocol = "tcp", trust_negative_responses = false },
                                             { socket_addr = "1.1.1.1:53", protocol = "tcp", trust_negative_responses = false }] }
```


Configuration gets more complex the more features you enable and if you want to be an authoritative server, but I am
just forwarding so its not tooo complex.

Next up, all those `default/xxxx.zone` files? Yeah, those aren't built in, so let's create them!

I'll use my SOA record as previously discussed, and create the following files, based on
[these examples](https://github.com/hickory-dns/hickory-dns/tree/182afa8/tests/test-data/test_configs/default):

`0.zone` and `255.zone`:
```
$TTL 3D
@               IN      SOA     michiru.yellows.ink. michiru.riseup.net. (
                                199609203       ; Serial
                                28800   ; Refresh
                                7200    ; Retry
                                604800  ; Expire
                                86400)  ; Minimum TTL
                        NS      michiru.yellows.ink.
```

`127.0.0.1.zone` and `ipv6_1.zone`:
```
$TTL 3D
@               IN      SOA     michiru.yellows.ink. michiru.riseup.net. (
                                199609203       ; Serial
                                28800   ; Refresh
                                7200    ; Retry
                                604800  ; Expire
                                86400)  ; Minimum TTL
                        NS      michiru.yellows.ink.

1                       PTR     localhost.
```

`localhost.zone`:
```
$TTL 3D
@               IN      SOA     michiru.yellows.ink. michiru.riseup.net. (
                                199609203       ; Serial
                                28800   ; Refresh
                                7200    ; Retry
                                604800  ; Expire
                                86400)  ; Minimum TTL
                        NS      michiru.yellows.ink.

localhost.              A        127.0.0.1
                        AAAA     ::1
```

Now, I'm done, and can set it up in Headscale's `config.yaml`:
```yaml
# abridged!

dns:
  # Whether to prefer using Headscale provided DNS or use local.
  override_local_dns: true

  # List of DNS servers to expose to clients.
  nameservers:
    global:
        # my server's IP *INSIDE OF TAILSCALE*
        - 100.64.0.2
        - fd7a:115c:a1e0::2
```

Done!

```sh
λ dig +short yellows.ink @michiru # directly specify 100.64.0.2
172.67.200.208
104.21.36.236

λ dig +short yellows.ink # uses 100.100.100.100, the tailscale node local dns server
172.67.200.208
104.21.36.236

λ dig +short yellows.ink @1.1.1.1
;; communications error to 1.1.1.1#53: timed out
^C%
```

Thanks for reading, hope this is helpful to some of you, and I hope to see you back here soon :)

 -- sink
