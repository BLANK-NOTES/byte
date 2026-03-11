/* =====================================================
   HABIT TRACKER — Service Worker
   
   HOW UPDATES WORK:
   Every time you push new code, bump the VERSION number
   below by 1. The browser detects the SW changed,
   downloads the new one, clears old caches, and your
   users get the update on their next visit.
   
   Example: "v3" → "v4" → "v5" etc.
===================================================== */

const VERSION = "v3";  // ← bump this every time you deploy changes
const CACHE   = `habit-tracker-${VERSION}`;

// Your GitHub Pages base path — change this if your repo name changes
const BASE    = "/blankwebsite";
const OFFLINE = `${BASE}/monthly.html`;

const PRECACHE = [
  `${BASE}/monthly.html`,
  `${BASE}/auth.html`,
  `${BASE}/journal.html`,
  `${BASE}/leaderboard.html`,
  `${BASE}/settings.html`,
  `${BASE}/social.html`,
  `${BASE}/templates.html`,
  `${BASE}/coach.html`,
  `${BASE}/achievements.html`,
  `${BASE}/profile.html`,
  `${BASE}/stats.html`,
  `${BASE}/upgrade.html`,
  `${BASE}/widget.html`,
  `${BASE}/wrapped.html`,
  `${BASE}/timeline.html`,
  `${BASE}/feed.html`,
  `${BASE}/onboarding.html`,
  `${BASE}/css/reset.css`,
  `${BASE}/css/themes.css`,
  `${BASE}/css/monthly-layout.css`,
  `${BASE}/css/monthly-grid.css`,
  `${BASE}/css/charts.css`,
  `${BASE}/css/monthly-dailystreak.css`,
  `${BASE}/css/mobile-grid-fix.css`,
  `${BASE}/js/monthly.js`,
  `${BASE}/js/ad-popup.js`,
  `${BASE}/habitpremium.js`,
  `${BASE}/habitsecurity.js`,
  `${BASE}/notifications.js`,
  `${BASE}/manifest.json`,
  `${BASE}/icons/icon-192.png`,
  `${BASE}/icons/icon-512.png`,
  `${BASE}/icons/icon-180.png`,
];

/* ── Install: precache all app files ── */
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(
        PRECACHE.map(u => new Request(u, { cache: "reload" }))
      ))
      .then(() => self.skipWaiting())  // activate immediately, don't wait for old tabs to close
      .catch(() => self.skipWaiting()) // don't block install if a file is missing
  );
});

/* ── Activate: remove old caches ── */
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE)   // delete every cache except the current version
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // take control of all open tabs immediately
  );
});

/* ── Fetch: network-first for HTML, cache-first for assets ── */
self.addEventListener("fetch", (e) => {
  const { request } = e;

  // Skip non-GET and cross-origin requests
  if (request.method !== "GET") return;
  if (!request.url.startsWith(self.location.origin)) return;

  // Skip Anthropic API calls (the AI coach) — always needs network
  if (request.url.includes("api.anthropic.com")) return;

  // HTML pages — network first so you always get fresh content when online,
  // but fall back to cached version when offline
  if (request.headers.get("accept")?.includes("text/html")) {
    e.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
          return res;
        })
        .catch(() =>
          caches.match(request)
            .then(r => r || caches.match(OFFLINE))
        )
    );
    return;
  }

  // Static assets (JS, CSS, images) — cache first for speed,
  // network fallback if not cached yet
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (!res || res.status !== 200 || res.type === "opaque") return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(request, clone));
        return res;
      });
    })
  );
});

/* ── Push notifications (unchanged) ── */
self.addEventListener("push", (e) => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || "Habit Reminder", {
      body:    data.body  || "Time to check in on your habits!",
      icon:    data.icon  || `${BASE}/icons/icon-192.png`,
      badge:   data.badge || "",
      tag:     data.tag   || "habit-reminder",
      data:    { url: data.url || OFFLINE },
      actions: [
        { action: "open",    title: "Open App" },
        { action: "dismiss", title: "Dismiss" },
      ],
      requireInteraction: false,
    })
  );
});

/* ── Notification click ── */
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  if (e.action === "dismiss") return;
  const url = e.notification.data?.url || OFFLINE;
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then(list => {
        for (const c of list) {
          if (c.url.includes("monthly.html") && "focus" in c) return c.focus();
        }
        return clients.openWindow(url);
      })
  );
});