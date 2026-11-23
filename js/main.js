/* MAGGIE — shared script.
   The issue's running order lives here once. Every page gets the
   same text navigation and prev/next links from it. To add a feature:
   add a line below, make features/<slug>.html, and add a post to index.html. */

const FEATURES = [
  { slug: "march-to-april",       title: "march to april",               page: 4,  cat: "journal" },
  { slug: "koons",                title: "thoughts on porcelain series", page: 14, cat: "review" },
  { slug: "journal-entries",      title: "Journal Entries",              page: 24, cat: "journal" },
  { slug: "new-orleans",          title: "New Orleans, Louisiana",       page: 30, cat: "photos" },
  { slug: "car-talks",            title: "car talks: SZN1 Thoughts",     page: 32, cat: "conversation" },
  { slug: "cheers",               title: "cheers",                       page: 40, cat: "journal" },
  { slug: "generational-cursive", title: "Deepfakes of Culture",         page: 58, cat: "essay" },
  { slug: "horoscopes",           title: "Horoscopes",                   page: 66, cat: "horoscopes" },
  { slug: "editors-note",         title: "Dating Apps and Middle School",page: 74, cat: "conversation" },
];
const CATS = [
  ["review", "Reviews"], ["journal", "Journal"], ["photos", "Photos"],
  ["conversation", "Conversations"], ["music", "Music"], ["essay", "Essays"],
  ["horoscopes", "Horoscopes"],
];

(function () {
  const body = document.body;
  const root = body.dataset.root || "";            // "../" on feature pages
  const slug = body.dataset.feature || null;
  const i = FEATURES.findIndex(f => f.slug === slug);
  const href = f => `${root}features/${f.slug}.html`;
  const isHome = body.classList.contains("home");

  // ---- text navigation (same on every page) ----
  const nav = document.createElement("header");
  nav.className = "nav";
  nav.innerHTML = `
    <div class="nav-row">
      <a class="nav-logo" href="${root}index.html">MAGGIE</a>
      <a href="${root}about.html">About</a>
      <a href="mailto:info@meanwhilegettingmeaner.com" title="info@meanwhilegettingmeaner.com">Contact</a>
      <span class="clock" aria-hidden="true"></span>
    </div>
    <div class="nav-row cats">
      ${CATS.map(([k, label]) => `<a href="${k === "music" ? root + "music.html" : root + "index.html#" + k}" data-cat="${k}">${label}</a>`).join("")}
    </div>`;
  (document.querySelector(".nav-slot") || body).prepend(nav);

  // ---- tones: each yellow button or tag gets its own colour/style on every visit ----
  // flat = tags (plain colours only); full = buttons and circles (adds chrome, bevel, dashed, rings)
  const TONES = {
    flat: [1, 2, 3, 5, 6, 7, 8, 9],
    full: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
  };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  window.maggieTone = () => {
    [["a.hl-y, .info h2 span, .foot-grid > div:nth-of-type(3) h3", "flat"]]
      .forEach(([sel, kind]) => document.querySelectorAll(sel).forEach(el => {
        if (!el.dataset.tone) { const t = pick(TONES[kind]); if (t !== 1) el.dataset.tone = t; else el.dataset.tone = "1"; }
      }));
  };
  maggieTone();

  // ---- buttons: every pill button on the site wears one of these styles, a new one on each visit ----
  const BTN_N = 30;
  // only Shop, Order by email and the footer Sign up get the colourful looks; each takes a different one
  const BTN_SEL = ".order, .foot-form button";
  const used = new Set();
  window.maggieButtons = () => document.querySelectorAll(BTN_SEL).forEach(b => {
    if (b.dataset.btn) return;
    [...b.childNodes].forEach(n => { if (n.nodeType === 3 && n.textContent.trim()) { const s = document.createElement("span"); s.className = "bl"; s.textContent = n.textContent.trim(); n.replaceWith(s); } });
    b.querySelectorAll(":scope > span:not(.dot):not(.bl)").forEach(s => s.classList.add("bl"));
    let v; do { v = 1 + Math.floor(Math.random() * BTN_N); } while (used.has(v));
    used.add(v); b.dataset.btn = v;
  });
  maggieButtons();
  // the Shop box goes maximal: its own wilder set, a new one each visit
  const shop = document.querySelector(".sc-shop");
  if (shop) shop.dataset.shop = 1 + Math.floor(Math.random() * 24);
  addEventListener("DOMContentLoaded", maggieButtons);
  addEventListener("load", maggieButtons);
  addEventListener("DOMContentLoaded", maggieTone);
  addEventListener("load", maggieTone);

  // ---- size menu: 40 / 60 / 80 / 100 scales the content (not the top bar, menu or footer).
  // 80 is the normal size and the default for newcomers. Home has it in the top bar; every
  // other page gets the same control at the right end of the menu. The choice carries across pages.
  let sz = document.querySelector(".sc-sz select");
  if (!sz) {
    const ctl = document.createElement("label");
    ctl.className = "size-ctl"; ctl.title = "Content size";
    ctl.innerHTML = `<select aria-label="Content size">${[40, 60, 80, 100].map(v => `<option value="${v}"${v === 80 ? " selected" : ""}>${v}</option>`).join("")}</select><i aria-hidden="true">▾</i>`;
    nav.querySelector(".nav-row").appendChild(ctl);
    sz = ctl.querySelector("select");
  }
  const setSize = v => document.documentElement.style.setProperty("--page-zoom", (v / 80).toFixed(3));
  try { const saved = localStorage.getItem("maggie-size"); if (["40", "60", "80", "100"].includes(saved)) sz.value = saved; } catch (e) {}
  setSize(+sz.value);
  sz.addEventListener("change", () => { setSize(+sz.value); try { localStorage.setItem("maggie-size", sz.value); } catch (e) {} });

  // dateline: today's date + the weather where the visitor is.
  // Location comes from the browser's time zone (e.g. America/Los_Angeles → Los Angeles),
  // so nobody gets a location-permission prompt. Weather from open-meteo.com (free, no key).
  // Falls back to Los Angeles, where Issue 1 was printed.
  const clock = nav.querySelector(".clock");
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  clock.textContent = today;
  (async () => {
    const WX = { 0: "clear", 1: "mostly clear", 2: "partly cloudy", 3: "overcast", 45: "fog", 48: "fog",
      51: "drizzle", 53: "drizzle", 55: "drizzle", 61: "rain", 63: "rain", 65: "heavy rain", 66: "freezing rain", 67: "freezing rain",
      71: "snow", 73: "snow", 75: "heavy snow", 77: "snow", 80: "showers", 81: "showers", 82: "heavy showers",
      85: "snow showers", 86: "snow showers", 95: "thunderstorm", 96: "thunderstorm", 99: "thunderstorm" };
    let place = { name: "Los Angeles", lat: 34.0522, lon: -118.2437 };
    try {
      const city = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").split("/").pop().replace(/_/g, " ");
      if (city && city !== "UTC") {
        const g = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(city)}`)).json();
        if (g.results && g.results[0]) place = { name: g.results[0].name, lat: g.results[0].latitude, lon: g.results[0].longitude };
      }
    } catch (e) { /* keep Los Angeles */ }
    try {
      const f = navigator.language === "en-US" ? "fahrenheit" : "celsius";
      const w = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&current=temperature_2m,weather_code&temperature_unit=${f}`)).json();
      const t = Math.round(w.current.temperature_2m), code = w.current.weather_code;
      clock.textContent = `${today} · ${place.name} ${t}°${f === "fahrenheit" ? "F" : "C"}, ${WX[code] || ""}`;
    } catch (e) { /* weather unavailable: date only */ }
  })();

  // current feature gets underlined in the category row
  const pageLink = { about: "about.html", masthead: "masthead.html" }[body.dataset.page];
  if (pageLink) nav.querySelector(`.nav-row:first-child a[href$="${pageLink}"]`)?.classList.add("on");
  if (body.dataset.page === "music") nav.querySelector('[data-cat="music"]')?.classList.add("on");
  if (i >= 0) nav.querySelector(`[data-cat="${FEATURES[i].cat}"]`)?.classList.add("on");

  // ---- home: category filter on #hash ----
  if (isHome) {
    const posts = [...document.querySelectorAll(".post")];
    const apply = () => {
      const k = location.hash.slice(1);
      const valid = k !== "music" && CATS.some(c => c[0] === k);
      posts.forEach(p => p.hidden = valid && (p.dataset.sec || p.dataset.cat) !== k);
      nav.querySelectorAll("[data-cat]").forEach(a => a.classList.toggle("on", a.dataset.cat === k));
      const note = document.querySelector(".filter-note");
      if (note) {
        note.hidden = !valid;
        if (valid) note.querySelector("b").textContent = CATS.find(c => c[0] === k)[1];
      }
      if (valid) window.scrollTo({ top: 0 });
    };
    // links into the stream from the same page shouldn't reload
    nav.querySelectorAll("a[data-cat]:not([data-cat=music])").forEach(a => a.setAttribute("href", "#" + a.dataset.cat));
    window.addEventListener("hashchange", apply);
    apply();
  }

  // ---- site footer (same on every page) ----
  // Placeholders marked "todo" are for the site requirements you add later.
  const foot = document.createElement("footer");
  foot.className = "site-foot";
  foot.innerHTML = `
    <div class="foot-grid">
      <a class="foot-logo" href="${root}index.html">MAGGIE</a>
      <div><h3>Print</h3><p>Issue 1, risograph<br><a href="mailto:info@meanwhilegettingmeaner.com">Get a copy</a></p></div>
      <div><h3>Newsletter</h3>
        <form class="foot-form" data-todo="connect to a newsletter service">
          <label class="sr" for="nl">Email</label>
          <input id="nl" type="email" placeholder="your email" required>
          <button class="fx-gel" type="submit">Sign up</button>
        </form>
      </div>
      <div><h3>Contact</h3><p><a href="mailto:info@meanwhilegettingmeaner.com">info@meanwhilegettingmeaner.com</a><br><a href="#" data-todo="instagram link">Instagram</a></p></div>
    </div>
    <div class="foot-legal">
      <span>© 2026 MAGGIE</span>
      <a href="${root}privacy.html">Privacy</a>
      <a href="${root}terms.html">Terms</a>
      <a href="${root}stockists.html">Stockists</a>
    </div>`;
  body.append(foot);
  foot.querySelector("form").addEventListener("submit", e => {
    e.preventDefault();
    e.target.innerHTML = "<p>Thanks — sign-up isn't connected yet.</p>";
  });

  // ---- home: entry animations ----
  // Desktop: they play on hover. Touch screens: they play as an entry scrolls into view.
  if (isHome) {
    // capsules for the Koons entry, like the word gaps in the print layout
    document.querySelectorAll('.post[data-cat="review"] h2 a').forEach(a => {
      let n = 0;
      a.innerHTML = a.textContent.split(" ").map(w => (++n % 3 === 0 ? `<span class="gap" aria-hidden="true"></span> ` : "") + w).join(" ");
    });
    // --- cheers entry: random layout switching + pop-up email typography ---
    const inbox = document.querySelector("#post-inbox");
    if (inbox) {
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      let v = 1;
      const img = inbox.querySelector("figure img");
      const EMAILS = ["img/pg22.jpg", "img/pg23.jpg", "img/pg24.jpg", "img/pg25.jpg", "img/pg26.jpg", "img/pg27.jpg", "img/pg28.jpg"];
      EMAILS.forEach(s => { const i = new Image(); i.src = s; });   // preload so swaps are instant
      img.alt = "Designed emails from cheers";
      if (!still) setInterval(() => {
        let n; do { n = 1 + Math.floor(Math.random() * 4); } while (n === v);
        v = n; inbox.dataset.v = v;
        // swap the email shown, too
        let p; do { p = EMAILS[Math.floor(Math.random() * EMAILS.length)]; } while (p === img.getAttribute("src"));
        img.src = p;
      }, 1800 + Math.random() * 900);

      // real cut-outs of the type from the cheers emails (pp. 40–46) — nothing generated
      const CUTS = ["sunset","the-sun","the-core","the-moon","life","333","bazooka","kaboom","malibu","pick-me","omg",
        "teachers-pet","fatass","war","lmao","muahah","aha","hahaha","hmuaha","hahaha-strike","hahah-red","love-you","baddie","funky"];
      CUTS.forEach(c => { const i = new Image(); i.src = `img/cut/${c}.png`; });
      const box = document.createElement("div"); box.className = "chaos"; box.setAttribute("aria-hidden", "true");
      inbox.append(box);
      let timer;
      const burst = () => {
        box.innerHTML = "";
        const pick = CUTS.slice().sort(() => Math.random() - .5).slice(0, 14);
        pick.forEach((c, k) => {
          const s = document.createElement("img"); s.src = `img/cut/${c}.png`; s.alt = "";
          const edge = Math.random();
          const x = edge < .55 ? 50 + Math.random() * 38 : Math.random() * 80;
          const y = edge < .55 ? Math.random() * 90 : (Math.random() < .5 ? Math.random() * 8 : 86 + Math.random() * 8);
          s.style.cssText = `left:${x}%;top:${y}%;--w:${70 + Math.random() * 130}px;--r:${(Math.random() * 12 - 6).toFixed(1)}deg;--d:${(k * 0.06).toFixed(2)}s`;
          box.append(s);
        });
      };
      const on = () => { burst(); clearInterval(timer); timer = setInterval(burst, 2600); };
      const off = () => { clearInterval(timer); box.innerHTML = ""; };
      inbox.addEventListener("mouseenter", on); inbox.addEventListener("mouseleave", off);
      new MutationObserver(() => inbox.classList.contains("is-on") ? on() : off()).observe(inbox, { attributes: true, attributeFilter: ["class"] });
    }

    // --- Deepfakes entry: the deck plays as a slide show ---
    const deck = document.querySelector("#post-essay .mac8");
    if (deck) {
      const sl = deck.querySelector(".mac8-slide"), num = deck.querySelector(".mac8-n"), mode = deck.querySelector(".mac8-mode");
      const post = deck.closest(".post"); let n = 1;
      for (let i = 2; i <= 13; i++) { const im = new Image(); im.src = `img/gvc/slide${i}.jpg`; }
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) setInterval(() => {
        if (post.matches(":hover") || post.classList.contains("is-on")) return;
        n = n % 13 + 1; sl.src = `img/gvc/slide${n}.jpg`; num.textContent = n;
      }, 2600);
      const sync = () => { mode.textContent = (post.matches(":hover") || post.classList.contains("is-on")) ? "Slide Sorter" : "Slide Show"; };
      post.addEventListener("mouseenter", sync); post.addEventListener("mouseleave", () => setTimeout(sync, 0));
    }

    // --- daily horoscope box: a different version on every visit ---
    const hb = document.querySelector(".daily-box");
    if (hb) { const V = [1, 1, 6, 7, 8, 9, 10, 11, 2, 3, 4, 5]; hb.dataset.v = V[Math.floor(Math.random() * V.length)]; }

    // --- horoscope entry: the four weekly pages (pp. 67–70); hover moves to the next week ---
    const hs = document.querySelector(".post.hs");
    if (hs) {
      const WEEKS = [["3/2", 67, "tile-horo1", "#d9d2ff", ["It's been difficult for you to pay attention to things other than your home and family. There will be frustrations in your natural sense of self-control.", "These frustrations will see their beginnings in deep truths relating to your family or home life. Beware of difficulties relating to lingering problems in your home life.", "The current hold-ups are signs that it’s time to do things differently. Every challenge will force you to discover a new path."]], ["3/22", 68, "tile-horo2", "#9a9a9a", ["You have a desire for indulgence in your romantic or creative life. You may notice a feeling of frustration. Much of your anxiety stems from your deep-seated sense of empathy. Listen to your pragmatic side.", "Be patient with your relationship to art and music or the harsh realities of your love life. Do you use pleasure as a sedative or as a luxury?", "You will have to do something that you don’t normally do or that you’ve never done before. Do it—even if you struggle."]], ["4/5", 69, "tile-horo3", "#ffbf5a", ["You've been analyzing your home and family. There will be frustrations in the way you articulate yourself.", "These frustrations will see their beginnings in your subconscious in conjunction with your family or home life. Beware of difficulties relating to the traumas and complexes left over from childhood.", "The current hold-ups are signs that it’s time to do things differently. Every challenge will force you to discover."]], ["4/12", 70, "tile-horo4", "#fff27a", ["You have a desire for indulgence in your day-to-day. You will notice frictionless movement in your romantic or creative life. Get lost in passion.", "This acceleration will see its beginnings in your career or social life where they meet with your day-to-day. A surprising event will quickly change the people you talk to every day.", "This situation will move incredibly quickly. Be ready."]]];
      let w = Math.floor(Math.random() * WEEKS.length), p = 0, timer;
      const frame = () => {
        const ps = WEEKS[w][4];
        hs.querySelector(".hs-body").innerHTML = `<div class="hs-frame"><p class="hs-oct"><span>${ps[p]}</span></p></div><p class="hs-dots" aria-hidden="true">${ps.map((_, i) => i === p ? "●" : "○").join(" ")}</p>`;
      };
      const show = () => {
        const [wk, pg, tile, glow] = WEEKS[w];
        hs.style.setProperty("--tile", `url(../img/${tile}.jpg)`); hs.style.setProperty("--glow", glow);
        hs.querySelector(".hs-t").textContent = `Your weekly horoscope (week of ${wk})`;
        hs.querySelector(".hs-n").textContent = pg;
        hs.querySelector(".hs-badge").classList.toggle("l", pg % 2 === 0);
        frame();
      };
      show();
      const fade = fn => { hs.classList.add("flip"); setTimeout(() => { fn(); hs.classList.remove("flip"); }, 220); };
      // one paragraph per frame: the frame steps through the paragraphs, then on to the next week
      const step = () => fade(() => { p++; if (p >= WEEKS[w][4].length) { p = 0; w = (w + 1) % WEEKS.length; show(); } else frame(); });
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) timer = setInterval(step, 4200);
      hs.addEventListener("mouseenter", () => { step(); clearInterval(timer); timer = setInterval(step, 2400); });
      hs.addEventListener("mouseleave", () => { clearInterval(timer); timer = setInterval(step, 4200); });
    }

    // --- journal: one spot that keeps changing from one writing to the next (pp. 24–29) ---
    const jr = document.querySelector(".post.jr-one");
    if (jr) {
      const J = [
        ["chika", "Chika's Reply to my post", 24, "March 13, 2026", "tile-journal1", "Hey u Defne. Ig life is hard rn for both of us but that’s life I guess i try to think that way but it’s hard it is really hard to just exist man I’m proud of you. I luv u."],
        ["computer", "Ilovemycomputer.", 25, "March 28, 2026", "tile-journal1", "this is what i do when i can electromagnetically feel that my software is getting tired. i lower the brightness of my screen and just take some selfies of myself for my computer so it can feel that their user needs them"],
        ["statement", "Personal Statement from Highschool", 26, "January 19, 2022", "tile-journal2", "...The flow of information has been faster, more global, and more visual from the beginning of the century to the present."],
        ["bbq", "Dallas Texas BBQ", 27, "March 4, 2026", "tile-journal2", "16 oz slushie margarita, blue icy color with a plastic palm tree as a straw. I heard all the club kids went to this exact dallas barbeque when chelsea was still chelsea."],
        ["tiffany", "On Tiffany Trump's Short Lasted Music Career", 28, "March 18, 2026", "tile-journal3", "It showed up on my feed one day where i learned about Tiffany Trump’s music career."],
      ];
      let k = 0, t;
      const set = () => {
        const [id, title, pg, date, tile, ex] = J[k];
        jr.style.setProperty("--tile", `url(../img/${tile}.jpg)`);
        jr.querySelector(".meta").innerHTML = `<a href="#journal" class="hl hl-y tag">Journal</a> / p. ${pg}`;
        jr.querySelector("h2.dp a").href = jr.querySelector(".jr-more").href = `features/journal-entries.html#j-${id}`;
        jr.querySelector("h2.dp span").textContent = title;
        jr.querySelector(".jr-txt span").textContent = ex;
        const f = jr.querySelectorAll(".jr-foot .dp > span"); f[1].textContent = pg; f[2].textContent = date;
      };
      const next = () => { jr.classList.add("swap"); setTimeout(() => { k = (k + 1) % J.length; set(); jr.classList.remove("swap"); }, 350); };
      set();
      const go = ms => { clearInterval(t); if (!matchMedia("(prefers-reduced-motion: reduce)").matches) t = setInterval(next, ms); };
      go(5200);
      jr.addEventListener("mouseenter", () => { next(); go(3000); });
      jr.addEventListener("mouseleave", () => go(5200));
    }

    // --- newsletter forms (not connected yet: see data-todo on the form) ---
    document.querySelectorAll("form.nl").forEach(f => f.addEventListener("submit", e => {
      e.preventDefault();
      f.innerHTML = '<p class="thanks">Thank you. Sign-up isn\'t connected yet.</p>';
      if (f.closest(".nl-pop")) setTimeout(closePop, 1600);
    }));
    document.querySelector(".nl-splash")?.addEventListener("pointerdown", e => e.stopPropagation());

    // --- newsletter pop-up: once per visit, shortly after entering ---
    const pop = document.querySelector(".nl-pop");
    let popSeen = false; try { popSeen = sessionStorage.getItem("maggie-pop") === "1"; } catch (e) {}
    const closePop = () => { if (!pop) return; pop.hidden = true; try { sessionStorage.setItem("maggie-pop", "1"); } catch (e) {} };
    function openPop() { if (!pop || popSeen) return; popSeen = true; pop.hidden = false; setTimeout(() => pop.querySelector("input")?.focus(), 300); }
    if (pop) {
      pop.querySelector(".nlp-no").addEventListener("click", closePop);
      pop.addEventListener("click", e => { if (e.target === pop) closePop(); });
      addEventListener("keydown", e => { if (e.key === "Escape" && !pop.hidden) closePop(); });
      pop.addEventListener("pointerdown", e => e.stopPropagation());   // don't count as the music click
    }

    // --- opening splash (once per visit) + frame videos in the wallpaper ---
    const splash = document.querySelector(".splash");
    if (splash) {
      let seen = false; try { seen = sessionStorage.getItem("maggie-entered") === "1"; } catch (e) {}
      const close = () => {
        splash.classList.add("gone");
        try { sessionStorage.setItem("maggie-entered", "1"); } catch (e) {}
        setTimeout(() => { const v = splash.querySelector("video"); v && v.pause(); }, 900);
        setTimeout(openPop, 1400);
      };
      const inPlayer = window.name === "maggie-shell"; // page reloaded inside the music player: no splash, no repeat pop-up
      if (inPlayer) { splash.classList.add("gone"); splash.querySelector("video")?.pause(); }
      else if (seen) { splash.classList.add("gone"); splash.querySelector("video")?.pause(); setTimeout(openPop, 1400); }
      splash.querySelector(".enter").addEventListener("click", close);
    }
    const playWall = () => {
      document.querySelectorAll(".wall-layer video").forEach(v => {
        const on = v.parentElement.dataset.cat === body.dataset.now;
        if (on && v.paused && !matchMedia("(prefers-reduced-motion: reduce)").matches) { v.preload = "auto"; v.play().catch(() => {}); }
        if (!on && !v.paused) v.pause();
      });
    };
    new MutationObserver(playWall).observe(body, { attributes: true, attributeFilter: ["data-now"] });

    // --- New Orleans video on home: plays while the cursor is over it (tap on phones) ---
    const nv = document.querySelector(".nola-vid video");
    if (nv) {
      nv.addEventListener("pointerenter", e => { if (e.pointerType !== "touch") nv.play().catch(() => {}); });
      nv.addEventListener("pointerleave", e => { if (e.pointerType !== "touch") nv.pause(); });
      nv.addEventListener("click", () => { location.href = "features/new-orleans.html"; });
      nv.addEventListener("touchend", e => { e.preventDefault(); nv.paused ? nv.play().catch(() => {}) : nv.pause(); });
    }

    // --- Space Center background: glyph rows set with the current feature's pictures ---
    const GL = {
      diary: ["march-kapoor","march-flavin1","march-liberty","march-street","march-flavin2","march-corpse1","march-monkey","march-nj","march-gaultier"],
      review: ["koons1","koons2","koons3","koons4"],
      // "t:" = a line of text from the issue instead of a picture
      journal: ["t:i love my computer.", "t:my computer loves me.", "t:i want more i want more", "t:you were born to mold", "t:not to sit still like a fine china!", "t:I luv u.", "t:wrinkly defne chan", "t:peace I love you always", "t:even the dust in the air is waiting for you"],
      photos: ["nola5","nola6","nola7"],
      conversation: ["cartalk-runway","cartalk-2","cartalk-3","cartalk-4","cartalk-5","cartalk-6","cartalk-7"],
      inbox: ["cut/sunset","cut/the-sun","cut/life","cut/333","cut/bazooka","cut/muahah","cut/hahaha","cut/love-you","cut/baddie","cut/teachers-pet","cut/lmao","cut/aha"],
      essay: ["gvc/thumb1", "t:Deepfakes of Culture", "gvc/thumb2", "t:a deepfake of 80s culture", "gvc/thumb3", "t:chrome, grid patterns", "gvc/thumb5",
        "t:Global Village Coffeehouse", "gvc/thumb6", "t:flannelette", "gvc/thumb7", "t:we must take a stance", "gvc/thumb9", "t:nostalgia means continuity", "gvc/thumb11", "t:Memphis style"],
      horoscopes: ["t:Listen to your pragmatic side.", "t:Get lost in passion.", "t:Be ready.", "t:Do it—even if you struggle.", "t:a sedative or a luxury?",
        "t:deep truths", "t:Every challenge", "t:frictionless movement", "t:This situation will move incredibly quickly."],
      "editors-note": ["t:Hinge, as in unhinged", "t:talking sideways", "t:age range, gender preference, repeat", "t:matchmaking aunt", "t:Instagram mutuals were the Tinder",
        "t:no swiping and no menu", "t:the soft light of someone's story", "t:hyper-manipulation", "t:you survive by language"],
    };
    const glyphs = document.querySelector(".sc-glyphs"), cur = document.querySelector(".sc-cur");
    const setGlyphs = cat => {
      if (!glyphs) return;
      const list = GL[cat] || [], rows = list.length ? Math.ceil(glyphs.clientHeight / 88) + 1 : 0;
      glyphs.classList.remove("on"); glyphs.innerHTML = "";
      let n = 0, idx = Math.floor(Math.random() * list.length);
      const W = glyphs.clientWidth;
      const sh = document.querySelector(".sheet")?.getBoundingClientRect();
      const L = sh ? Math.max(0, sh.left - 20) : W * .2, R = sh ? Math.min(W, sh.right + 20) : W * .8;
      const pickX = () => {
        const sides = [];
        if (L > 110) sides.push([0, L - 90]);
        if (W - R > 110) sides.push([R, W - 90]);
        if (!sides.length || Math.random() < .12) return Math.random() * (W - 90);
        const s = sides[Math.floor(Math.random() * sides.length)];
        return s[0] + Math.random() * (s[1] - s[0]);
      };
      for (let r = 0; r < rows; r++) {
        if (Math.random() < .3) continue;                       // leave some baselines empty
        const row = document.createElement("div"); row.className = "row"; row.style.top = (r * 88) + "px";
        const count = 1 + Math.floor(Math.random() * 3);   // sparse: a few per line
        const slots = [];
        for (let k = 0; k < count; k++) {
          let x, tries = 0;
          do { x = pickX(); tries++; } while (slots.some(s => Math.abs(s - x) < 110) && tries < 20);
          slots.push(x);
          const name = list[idx++ % list.length];
          let im;
          if (name.startsWith("t:")) {
            im = document.createElement("span"); im.className = "gt"; im.textContent = name.slice(2);
            im.style.cssText = `position:absolute;left:${x}px;bottom:14px;font-size:${14 + Math.random() * 12}px;--d:${(n++ * 0.02).toFixed(3)}s`;
          } else {
            im = document.createElement("img"); im.alt = "";
            im.src = `img/${name}.${name.startsWith("cut/") ? "png" : "jpg"}`;
            im.style.cssText = `position:absolute;left:${x}px;bottom:14px;--h:${30 + Math.random() * 44}px;--d:${(n++ * 0.02).toFixed(3)}s`;
          }
          row.append(im);
        }
        glyphs.append(row);
      }
      // lines of text: keep each one whole inside its margin (shrink it if the margin is narrow)
      glyphs.querySelectorAll(".gt").forEach(t => {
        const x = parseFloat(t.style.left), right = x >= R;
        const lo = right ? R : 0, hi = right ? W - 10 : (x < L ? L : W - 10);
        let fs = parseFloat(t.style.fontSize);
        while (t.offsetWidth > hi - lo && fs > 11) { fs -= 1; t.style.fontSize = fs + "px"; }
        t.style.left = Math.max(lo, Math.min(x, hi - t.offsetWidth)) + "px";
        if (t.offsetWidth > hi - lo) t.remove();                 // still too long for this margin
      });
      // nothing overlaps on the same line
      glyphs.querySelectorAll(".row").forEach(row => {
        const kept = [];
        [...row.children].forEach(el => {
          const a = el.getBoundingClientRect();
          if (kept.some(b => a.left < b.right + 12 && b.left < a.right + 12)) el.remove(); else kept.push(a);
        });
      });
      requestAnimationFrame(() => requestAnimationFrame(() => glyphs.classList.add("on")));
      const f = FEATURES.find(f => f.cat === cat);
      
    };
    // a post can ask for its own background set (data-glyph), e.g. the editor's note inside Conversations
    const glyphKey = () => body.dataset.glyph || body.dataset.now;
    new MutationObserver(() => setGlyphs(glyphKey())).observe(body, { attributes: true, attributeFilter: ["data-now", "data-glyph"] });
    setGlyphs(glyphKey() || "cover");
    let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => setGlyphs(glyphKey()), 200); });

    // --- margins: which feature is in the middle of the screen ---
    const posts = [...document.querySelectorAll(".post")];
    const railLinks = [...document.querySelectorAll(".rail a")];
    const meter = document.querySelector(".meter i");
    const here = document.querySelector(".here-p");
    const spy = () => {
      const mid = innerHeight * 0.45;
      let cur = null;
      posts.forEach(p => { if (!p.hidden && p.getBoundingClientRect().top < mid) cur = p; });
      const cat = cur ? cur.dataset.cat : "cover";
      const gk = (cur && cur.dataset.glyph) || "";
      if ((body.dataset.glyph || "") !== gk) { if (gk) body.dataset.glyph = gk; else delete body.dataset.glyph; }
      if (body.dataset.now !== cat) {
        body.dataset.now = cat;
        railLinks.forEach(a => a.classList.toggle("now", a.dataset.cat === cat));
        const f = FEATURES.find(f => f.cat === cat);
        if (here) here.textContent = f ? `p. ${f.page} — ${f.title}` : "the start of Issue 1";
      }
      if (meter) {
        const max = document.documentElement.scrollHeight - innerHeight;
        meter.style.height = (max > 0 ? Math.min(100, scrollY / max * 100) : 0) + "%";
      }
    };
    addEventListener("scroll", spy, { passive: true }); addEventListener("resize", spy); spy();

    railLinks.forEach(a => a.addEventListener("click", e => {
      e.preventDefault();
      const t = document.getElementById(a.getAttribute("href").slice(1));
      if (location.hash) history.replaceState(null, "", location.pathname), posts.forEach(p => p.hidden = false);
      t && t.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }));

    // --- daily horoscope + now playing: lines from the issue, one per day ---
    const LINES = [
      "You have a desire for indulgence in your romantic or creative life.",
      "Much of your anxiety stems from your deep-seated sense of empathy. Listen to your pragmatic side.",
      "Be patient with your relationship to art and music.",
      "Do you use pleasure as a sedative or as a luxury?",
      "You will have to do something that you don’t normally do or that you’ve never done before. Do it—even if you struggle.",
      "The current hold-ups are signs that it’s time to do things differently.",
      "Every challenge will force you to discover a new path.",
      "Get lost in passion. Few things move more quickly than when you are motivated by something so good.",
      "A surprising event will quickly change the people you talk to every day.",
      "This situation will move incredibly quickly. Be ready.",
      "There will be frustrations in the way you articulate yourself.",
      "You will notice frictionless movement in your romantic or creative life.",
    ];
    const TRACKS = [
      ["JULIO IGLESIAS", "POBRE DIABLO"], ["GRACE JONES", "SLAVE TO THE RHYTHM"], ["NEW ORDER", "THE PERFECT KISS"],
      ["P.M DOWN", "PAPER DOLL"], ["BRYAN FERRY", "DON'T STOP THE DANCE"], ["CARPENTERS", "YESTERDAY ONCE MORE"],
      ["EVERYTHING BUT THE GIRL", "WRONG"], ["SOHO", "HIPPYCHICK"], ["CIBO MATTO", "APPLE"], ["PET SHOP BOYS", "WHAT HAVE I DONE TO DESERVE THIS"],
      ["THE KLF", "3AM ETERNAL"], ["LEONARD COHEN", "LOVER, LOVER, LOVER"], ["R.E.M", "IMITATION OF LIFE"], ["CHANEL BEADS", "JBL IN THE FIREPLACE"],
    ];
    const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
    const d = document.querySelector(".daily"), tr = document.querySelector(".track");
    if (d) d.textContent = LINES[day % LINES.length];
    if (tr) { const t = TRACKS[day % TRACKS.length]; tr.innerHTML = `<b>${t[1]}</b><br>${t[0]}`; }

    if (matchMedia("(hover: none)").matches && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle("is-on", e.isIntersecting)),
        { rootMargin: "-35% 0px -35% 0px" });
      document.querySelectorAll(".post").forEach(p => io.observe(p));
    }
  }
})();
