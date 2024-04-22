// to be clear:
//  - goatcounter is a privacy friendly analytics solution
//  - this applies ONLY to /~sink/blog
//  - i have discussed this with fellow uwu members to ensure nobody has any objections
//  - if you complain about this, simply don't read my blog, fuck off

/*
 * This code is modified from software released under the ISC license: https://opensource.org/licenses/ISC
 * originally available at https://github.com/arp242/goatcounter/blob/84cec37/public/count.js
 *
 * Copyright © Martin Tournoij <martin@arp242.net>
 * Permission to use, copy, modify, and/or distribute this software for any purpose
 * with or without fee is hereby granted, provided that the above copyright notice
 * and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
 * FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
 * OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
 * TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
 * THIS SOFTWARE.
 *
 * Modifications to this file by Hazel Atkinson 2024, released under public domain - only original ISC terms apply.
 */

// GoatCounter: https://www.goatcounter.com

const GC_NO_ONLOAD = false; // default
const GC_NO_EVENTS = false; // default
const GC_ALLOW_LOCAL = false; // default
const GC_ALLOW_FRAME = false; // default
const GC_ENDPOINT = "https://qsgcount.yellows.ink/count";

const enc = encodeURIComponent;

// Get all data we're going to send off to the counter endpoint.
const get_data = vars => {
  const data = {
    p: /*vars.path === undefined ? goatcounter.path :*/ vars.path,
    r: /*vars.referrer === undefined ? goatcounter.referrer :*/ vars.referrer,
    t: /*vars.title === undefined ? goatcounter.title :*/ vars.title,
    e: !!(vars.event /*|| goatcounter.event*/),
    s: [
      window.screen.width,
      window.screen.height,
      window.devicePixelRatio || 1,
    ],
    b: is_bot(),
    q: location.search,
  };

  let rcb, pcb, tcb; // Save callbacks to apply later.
  if (typeof data.r === "function") rcb = data.r;
  if (typeof data.t === "function") tcb = data.t;
  if (typeof data.p === "function") pcb = data.p;

  const is_empty = (v) =>
    v === null || v === undefined || typeof v === "function";

  if (is_empty(data.r)) data.r = document.referrer;
  if (is_empty(data.t)) data.t = document.title;
  if (is_empty(data.p)) data.p = get_path();

  if (rcb) data.r = rcb(data.r);
  if (tcb) data.t = tcb(data.t);
  if (pcb) data.p = pcb(data.p);
  return data;
};

// See if this looks like a bot; there is some additional filtering on the
// backend, but these properties can't be fetched from there.
const is_bot = () => {
  // Headless browsers are probably a bot.
  const w = window, d = document
  if (w.callPhantom || w._phantom || w.phantom)
    return 150
  if (w.__nightmare)
    return 151
  if (d.__selenium_unwrapped || d.__webdriver_evaluate || d.__driver_evaluate)
    return 152
  if (navigator.webdriver)
    return 153
  return 0
};

// Object to urlencoded string, starting with a ?.
const urlencode = obj => {
  const p = []
  for (const k in obj)
    if (obj[k] !== '' && obj[k] !== null && obj[k] !== undefined && obj[k] !== false)
      p.push(enc(k) + '=' + enc(obj[k]))
  return '?' + p.join('&')
};

// Show a warning in the console.
const warn = msg => console.warn('goatcounter: ' + msg);

// Get current path.
const get_path = () => {
  let loc = location,
      c = document.querySelector('link[rel="canonical"][href]');
  if (c) {  // May be relative or point to different domain.
    const a = document.createElement('a');
    a.href = c.href
    if (a.hostname.replace(/^www\./, '') === location.hostname.replace(/^www\./, ''))
      loc = a
  }
  return (loc.pathname + loc.search) || '/'
}

// Run function after DOM is loaded.
const on_load = f => {
  if (document.body === null)
    document.addEventListener('DOMContentLoaded', function () {
      f()
    }, false)
  else
    f()
};

// Filter some requests that we (probably) don't want to count.
export const filter = () => {
  if ('visibilityState' in document && document.visibilityState === 'prerender')
    return 'visibilityState'
  if (!GC_ALLOW_FRAME && location !== parent.location)
    return 'frame'
  if (!GC_ALLOW_LOCAL && location.hostname.match(/(localhost$|^127\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^192\.168\.|^0\.0\.0\.0$)/))
    return 'localhost'
  if (!GC_ALLOW_LOCAL && location.protocol === 'file:')
    return 'localfile'
  if (localStorage && localStorage.getItem('skipgc') === 't')
    return 'disabled with #toggle-goatcounter'
  return false
}

// Get URL to send to GoatCounter.
export const url = vars => {
  const data = get_data(vars || {});
  if (data.p === null)  // null from user callback.
    return
  data.rnd = Math.random().toString(36).substr(2, 5)  // Browsers don't always listen to Cache-Control.

  const endpoint = GC_ENDPOINT;
  if (!endpoint)
    return warn('no endpoint found')

  return endpoint + urlencode(data)
}

// Count a hit.
export const count = vars => {
  const f = filter();
  if (f)
    return warn('not counting because of: ' + f)
  const _url = url(vars);
  if (!_url)
    return warn('not counting because path callback returned null')
  //navigator.sendBeacon(_url)
  // get around ublock origin
  fetch(_url, {method: "POST"});
}

// Get a query parameter.
export const get_query = name => {
  const s = location.search.substr(1).split('&');
  for (let i = 0; i < s.length; i++)
    if (s[i].toLowerCase().indexOf(name.toLowerCase() + '=') === 0)
      return s[i].substr(name.length + 1)
}

// Track click events.
export const bind_events = () => {
  const send = elem => () => {
    count({
      event: true,
      path: (elem.dataset.goatcounterClick || elem.name || elem.id || ''),
      title: (elem.dataset.goatcounterTitle || elem.title || (elem.innerHTML || '').substr(0, 200) || ''),
      referrer: (elem.dataset.goatcounterReferrer || elem.dataset.goatcounterReferral || ''),
    })
  };

  Array.prototype.slice.call(document.querySelectorAll("*[data-goatcounter-click]")).forEach(function(elem) {
    if (elem.dataset.goatcounterBound)
      return
    const f = send(elem);
    elem.addEventListener('click', f, false)
    elem.addEventListener('auxclick', f, false)  // Middle click.
    elem.dataset.goatcounterBound = 'true'
  })
}

// Add a "visitor counter" frame or image.
export const visit_count = function(opt) {
  on_load(function() {
    opt        = opt        || {}
    opt.type   = opt.type   || 'html'
    opt.append = opt.append || 'body'
    opt.path   = opt.path   || get_path()
    opt.attr   = opt.attr   || {width: '200', height: (opt.no_branding ? '60' : '80')}

    opt.attr['src'] = GC_ENDPOINT + 'er/' + enc(opt.path) + '.' + enc(opt.type) + '?'
    if (opt.no_branding) opt.attr['src'] += '&no_branding=1'
    if (opt.style)       opt.attr['src'] += '&style=' + enc(opt.style)
    if (opt.start)       opt.attr['src'] += '&start=' + enc(opt.start)
    if (opt.end)         opt.attr['src'] += '&end='   + enc(opt.end)

    const tag = {png: 'img', svg: 'img', html: 'iframe'}[opt.type];
    if (!tag)
      return warn('visit_count: unknown type: ' + opt.type)

    if (opt.type === 'html') {
      opt.attr['frameborder'] = '0'
      opt.attr['scrolling']   = 'no'
    }

    const d = document.createElement(tag);
    for (const k in opt.attr)
      d.setAttribute(k, opt.attr[k])

    const p = document.querySelector(opt.append);
    if (!p)
      return warn('visit_count: append not found: ' + opt.append)
    p.appendChild(d)
  })
}

// directly fetches the visitor count -- sink
export const fetchVisitCountAsync = () =>
    fetch(`${GC_ENDPOINT}er/${encodeURIComponent(location.pathname)}.json`)
        .then(r => r.json())
        .then(j => j.count);

// Make it easy to skip your own views.
if (location.hash === '#toggle-goatcounter') {
  if (localStorage.getItem('skipgc') === 't') {
    localStorage.removeItem('skipgc', 't')
    alert('GoatCounter tracking is now ENABLED in this browser.')
  }
  else {
    localStorage.setItem('skipgc', 't')
    alert('GoatCounter tracking is now DISABLED in this browser until ' + location + ' is loaded again.')
  }
}

if (!GC_NO_ONLOAD)
  on_load(function() {
    // 1. Page is visible, count request.
    // 2. Page is not yet visible; wait until it switches to 'visible' and count.
    // See #487
    if (!('visibilityState' in document) || document.visibilityState === 'visible')
      count()
    else {
      const f = () => {
        if (document.visibilityState !== 'visible')
          return
        document.removeEventListener('visibilitychange', f)
        count()
      };
      document.addEventListener('visibilitychange', f)
    }

    if (!GC_NO_EVENTS)
      bind_events()
  })
