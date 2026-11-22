/* MAGGIE — music player that keeps playing while you explore.

   Every page loads this file. The ♪ music button opens the MAGGIE PICKS list.
   When a song starts, the window turns into a "shell": the page you were on is
   reloaded inside a full-screen frame and the player lives outside it, so moving
   between pages no longer stops the music. The address bar and tab title follow
   the page inside the frame.

   Songs play their official 30-second previews (Apple's public iTunes Search
   API); each one links to the full song on Apple Music and Spotify.
   To change the songs, edit the TRACKS list below: one ["ARTIST", "TITLE"] per
   song. The Music page and the ♪ panel both update from it.
   Paste the Spotify playlist link below for the "GO TO PLAYLIST" pill. */
const PLAYLIST = "";   // e.g. "https://open.spotify.com/playlist/XXXXXXXX"

(function () {
  const TRACKS = [
    ["JULIO IGLESIAS", "POBRE DIABLO"], ["JULIO IGLESIAS", "CON LA MISMA PIEDRA"], ["GRACE JONES", "SLAVE TO THE RHYTHM"],
    ["DES'REE, TIN TIN OUT", "YOU GOTTA BE - TIN TIN OUT REMIX"], ["NEW ORDER", "THE PERFECT KISS"], ["P.M DOWN", "PAPER DOLL"],
    ["BRYAN FERRY", "DON'T STOP THE DANCE"], ["CARPENTERS", "YESTERDAY ONCE MORE"], ["GRACE JONES", "PULL UP TO THE BUMPER"],
    ["BRITNEY SPEARS", "BOYS (THE CO-ED REMIX)"], ["EVERYTHING BUT THE GIRL", "WRONG"], ["SOHO", "HIPPYCHICK"],
    ["CIBO MATTO", "APPLE"], ["STRANGE CARGO, WILLIAM ORBIT", "MILLION TOWN"], ["PET SHOP BOYS", "WHAT HAVE I DONE TO DESERVE THIS"],
    ["SEAL, WILLIAM ORBIT", "CRAZY - WILLIAM ORBIT MIX"], ["THE KLF", "3AM ETERNAL"], ["EVERYTHING BUT THE GIRL", "MISSING"],
    ["SEAL", "KILLER - 2022 REMASTER"], ["LEONARD COHEN", "LOVER, LOVER, LOVER"], ["R.E.M", "IMITATION OF LIFE"],
    ["CHANEL BEADS", "JBL IN THE FIREPLACE"],
  ];

  // full songs: files in the site's music/ folder (on your own computer only).
  // track number (from 0) → file name. Anything missing plays the 30-second preview.
  const FILES = {
    5: "PM Dawn - Paper Doll.mp3", 9: "Boys (The Co-Ed Remix) (Remastered).mp3",
    10: "Everything But The Girl - Wrong (Official Video).mp3", 11: "Soho - Hippychick.mp3",
    12: "Apple (2006 Remaster).mp3", 13: "William Orbit - Million Town.mp3",
    14: "What Have I Done to Deserve This (with Dusty Springfield) (2001 Remaster).mp3",
    15: "Crazy (William Orbit Mix).mp3", 16: "3am Eternal - The KLF 1991.mp3", 17: "Missing.mp3",
    18: "Killer (2022 Remaster).mp3", 19: "Leonard Cohen - Lover, Lover, Lover (Audio).mp3",
    20: "R.E.M. - Imitation Of Life.mp3", 21: "JBL in the Fireplace.mp3",
  };
  const BASE = new URL(document.body.dataset.root || "", location.href).href;

  // the Music page's list is built from TRACKS, so this is the only list to edit
  const esc = t => t.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  document.querySelectorAll("ol[data-tracklist]").forEach(ol => {
    ol.innerHTML = TRACKS.map(([a, t], i) =>
      `<li data-track="${i}" tabindex="0" role="button" aria-label="Play ${esc(t)} by ${esc(a)}"><b>${esc(a)}</b><span>${esc(t)}</span><i aria-hidden="true">▶</i></li>`).join("");
  });

  // rows on a page (music page, panel) that play a track
  const wireRows = (scope, player) => scope.querySelectorAll("[data-track]").forEach(el => {
    el.addEventListener("click", e => { e.preventDefault(); player.play(+el.dataset.track); });
    el.addEventListener("keydown", e => { if (e.key === "Enter") player.play(+el.dataset.track); });
  });

  // ---------- inside the shell's frame: hand everything to the outer window ----------
  if (window.name === "maggie-shell") {   // only our own player frame, not any frame the site is shown in
    document.documentElement.classList.add("framed");
    const send = m => window.parent.postMessage(Object.assign({ maggie: 1 }, m), "*");
    window.maggiePlayer = { play: i => send({ type: "play", i }) };
    wireRows(document, window.maggiePlayer);
    addEventListener("message", e => {
      if (e.data && e.data.maggie && e.data.type === "now")
        document.querySelectorAll("[data-track]").forEach(r => r.classList.toggle("now", +r.dataset.track === e.data.i));
    });
    send({ type: "hello", title: document.title, href: location.href });
    return;
  }

  // ---------- outer window: the real player ----------
  const audio = new Audio();
  const cache = {};
  let idx = -1, shell = null;

  const btn = document.createElement("button");
  const ICON = {
    play: '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 1.5 8.5 5 2.5 8.5z"/></svg>',
    pause: '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="2" y="1.5" width="2.2" height="7"/><rect x="5.8" y="1.5" width="2.2" height="7"/></svg>',
    next: '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1 1.5 5 5 1 8.5zM5 1.5 9 5 5 8.5z"/></svg>'
  };
  btn.className = "sound"; btn.type = "button"; btn.innerHTML = '<span class="dot" aria-hidden="true">♪</span><span class="label">music</span>';

  const pop = document.createElement("div");
  pop.className = "tracks-pop"; pop.hidden = true; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "MAGGIE picks");
  pop.innerHTML = `<div class="tp-win">
    <header class="tp-pills"><span>TOP TRACKS</span><span>NOVEMBER</span><span>MAGGIE PICKS</span><button type="button" class="tp-x" aria-label="Close">✕</button></header>
    <ol class="tp-list">${TRACKS.map((t, i) => `<li><button type="button" class="tp-row" data-track="${i}"><span>${t[0]}</span><span>${t[1]}</span></button></li>`).join("")}</ol>
    <footer class="tp-pills tp-foot"><a class="tp-pl" href="${PLAYLIST || "#"}" target="_blank" rel="noopener">GO TO PLAYLIST</a><span>MAGGIE PICKS</span></footer>
  </div>`;

  const bar = document.createElement("div");
  bar.className = "np-bar"; bar.hidden = true;
  bar.innerHTML = `<button type="button" class="np-pp" aria-label="Pause">${ICON.pause}</button><button type="button" class="np-next" aria-label="Next song">${ICON.next}</button><span class="np-t"></span>`;

  document.body.append(pop, bar, btn);

  const openPanel = () => { pop.hidden = false; }, closePanel = () => { pop.hidden = true; };
  btn.addEventListener("click", e => { e.stopPropagation(); pop.hidden ? openPanel() : closePanel(); });
  pop.querySelector(".tp-x").addEventListener("click", closePanel);
  pop.addEventListener("click", e => { if (e.target === pop) closePanel(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !pop.hidden) closePanel(); });
  const pl = pop.querySelector(".tp-pl");
  if (!PLAYLIST) pl.addEventListener("click", e => { e.preventDefault(); pl.textContent = "PLAYLIST COMING SOON"; });

  // iTunes lookup (JSONP, so it works from any static host)
  let n = 0;
  const lookup = q => new Promise((res, rej) => {
    const cb = "maggieIt" + (++n), s = document.createElement("script");
    const t = setTimeout(() => { done(); rej(new Error("timeout")); }, 7000);
    const done = () => { clearTimeout(t); delete window[cb]; s.remove(); };
    window[cb] = d => { done(); res(d); };
    s.onerror = () => { done(); rej(new Error("blocked")); };
    s.src = `https://itunes.apple.com/search?media=music&entity=song&limit=5&term=${encodeURIComponent(q)}&callback=${cb}`;
    document.head.append(s);
  });

  const markRows = d => d.querySelectorAll("[data-track]").forEach(r => r.classList.toggle("now", +r.dataset.track === idx));
  const markAll = () => { markRows(document); shell && shell.contentWindow && shell.contentWindow.postMessage({ maggie: 1, type: "now", i: idx }, "*"); };
  const label = html => { bar.querySelector(".np-t").innerHTML = html; bar.hidden = false; };

  // turn this window into the shell: the current page reloads inside a frame
  const enterShell = () => {
    if (shell) return;
    const url = location.href;
    shell = document.createElement("iframe");
    shell.className = "shell-frame"; shell.title = "MAGGIE"; shell.name = "maggie-shell"; shell.src = url;
    [...document.body.children].forEach(el => { if (![pop, bar, btn].includes(el)) el.remove(); });
    document.body.className = "shell"; document.body.removeAttribute("style");
    document.body.prepend(shell);
  };

  const setPP = on => { const b = bar.querySelector(".np-pp"); b.innerHTML = on ? ICON.pause : ICON.play; b.setAttribute("aria-label", on ? "Pause" : "Play"); };
  const play = async i => {
    idx = (i + TRACKS.length) % TRACKS.length;
    markAll();
    enterShell();
    const [artist, title] = TRACKS[idx];
    const spot = `https://open.spotify.com/search/${encodeURIComponent(artist + " " + title)}`;
    label(`loading… ${title}`);
    const mine = idx;
    if (FILES[idx]) {
      try {
        audio.src = new URL("music/" + encodeURIComponent(FILES[idx]), BASE).href; await audio.play();
        setPP(true);
        label(`<b>${title}</b> — ${artist} · <a href="${spot}" target="_blank" rel="noopener">Spotify</a>`);
        return;
      } catch (e) { if (mine !== idx) return; }   // file not here (e.g. the hosted site): use the preview
    }
    try {
      if (!cache[idx]) {
        const d = await lookup(`${artist.split(",")[0]} ${title.split(" - ")[0].replace(/\(.*\)/, "")}`);
        const hit = (d.results || []).find(x => x.previewUrl);
        if (!hit) throw new Error("none");
        cache[idx] = { src: hit.previewUrl, link: hit.trackViewUrl };
      }
      audio.src = cache[idx].src; await audio.play();
      setPP(true);
      label(`<b>${title}</b> — ${artist} · preview · <a href="${cache[idx].link}" target="_blank" rel="noopener">Apple Music</a> · <a href="${spot}" target="_blank" rel="noopener">Spotify</a>`);
    } catch (e) {
      setPP(false);
      label(`<b>${title}</b> — ${artist} · no preview here · <a href="${spot}" target="_blank" rel="noopener">listen on Spotify</a>`);
    }
  };

  audio.addEventListener("ended", () => play(idx + 1));
  bar.querySelector(".np-next").addEventListener("click", () => play(idx + 1));
  bar.querySelector(".np-pp").addEventListener("click", () => {
    if (audio.paused) { audio.play(); setPP(true); } else { audio.pause(); setPP(false); }
  });

  // messages from the page inside the frame
  addEventListener("message", e => {
    const d = e.data;
    if (!d || !d.maggie || !shell || e.source !== shell.contentWindow) return;
    if (d.type === "play") play(+d.i);
    if (d.type === "hello") {
      document.title = d.title;
      try { if (d.href !== location.href) history.replaceState(null, "", d.href); } catch (err) {}
      markAll();
    }
  });

  window.maggiePlayer = { play, markRows, open: openPanel };
  wireRows(pop, window.maggiePlayer);
  pop.addEventListener("click", e => { if (e.target.closest(".tp-row")) setTimeout(closePanel, 150); });
  wireRows(document, window.maggiePlayer);
})();
