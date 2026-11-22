/* MAGGIE — background music, old-horoscope-site style.
   Browsers don't allow sound until the visitor clicks, taps or presses a key,
   so the music starts on that first interaction. The yellow button toggles it,
   and the choice is remembered on that visitor's browser.

   By default it plays an original MIDI-style loop made here in code.
   To use your own track instead, put the file in /audio and set AUDIO_FILE,
   e.g. const AUDIO_FILE = "audio/theme.mp3";  (only music you have the rights to)
*/
const AUDIO_FILE = null;

(function () {
  const btn = document.querySelector(".sound");
  if (!btn) return;
  const KEY = "maggie-sound";
  const pref = (() => { try { return localStorage.getItem(KEY); } catch (e) { return null; } })();
  const save = v => { try { localStorage.setItem(KEY, v); } catch (e) {} };

  let playing = false, ctx, master, timer, step = 0, nextTime = 0, el;

  // ---------- the synth loop ----------
  const BPM = 96, STEP = 60 / BPM / 4;               // 16th notes
  const n = m => 440 * Math.pow(2, (m - 69) / 12);  // midi -> Hz
  // 4 bars: Am  F  C  G   (one chord per bar, 16 steps each)
  const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
  const BASS = [45, 41, 36, 43];
  // lead melody, one entry per 8th note (0 = rest), 8 per bar
  const LEAD = [
    76, 0, 74, 72, 0, 72, 74, 76,
    77, 0, 76, 74, 72, 0, 69, 0,
    72, 0, 74, 76, 79, 0, 76, 74,
    74, 0, 72, 71, 0, 67, 0, 0,
  ];

  function tone(freq, t, dur, type, vol, opts = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (opts.vibrato) {
      const l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = 5.5; lg.gain.value = freq * 0.006;
      l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + dur + .05);
    }
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + .05);
  }
  function hat(t, vol) {
    const len = 0.04, buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "highpass"; f.frequency.value = 7000; g.gain.value = vol;
    s.buffer = buf; s.connect(f).connect(g).connect(master); s.start(t);
  }
  function schedule(i, t) {
    const bar = Math.floor(i / 16) % 4, s = i % 16;
    const chord = CHORDS[bar];
    // bell arpeggio on every 16th
    tone(n(chord[s % 3] + 12), t, STEP * 1.8, "sine", 0.05);
    // bass on beats 1 and 3
    if (s === 0 || s === 8) tone(n(BASS[bar]), t, STEP * 7, "triangle", 0.16);
    // lead on 8ths
    if (s % 2 === 0) { const m = LEAD[bar * 8 + s / 2]; if (m) tone(n(m), t, STEP * 2.6, "square", 0.035, { vibrato: true }); }
    // hats on off-beats
    if (s % 4 === 2) hat(t, 0.05);
  }
  function tick() {
    while (nextTime < ctx.currentTime + 0.12) { schedule(step, nextTime); nextTime += STEP; step++; }
  }

  // ---------- on / off ----------
  async function start() {
    if (playing) return;
    if (AUDIO_FILE) {
      el = el || Object.assign(new Audio(AUDIO_FILE), { loop: true, volume: 0.5 });
      try { await el.play(); } catch (e) { return; }
    } else {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (!master) { master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination); }
      await ctx.resume();
      nextTime = ctx.currentTime + 0.05;
      timer = setInterval(tick, 25);
    }
    playing = true; update();
  }
  function stop() {
    if (el) el.pause();
    if (timer) clearInterval(timer), timer = null;
    if (ctx) ctx.suspend();
    playing = false; update();
  }
  function update() {
    btn.classList.toggle("on", playing);
    btn.classList.add("started");
    btn.setAttribute("aria-pressed", playing);
    btn.querySelector(".label").textContent = "♪ music";
    document.body.classList.toggle("music", playing);
  }

  // expose for the tracks panel
  window.maggieMusic = { start: () => { start(); save("on"); }, stop: () => { stop(); save("off"); }, isOn: () => playing };

  // no background theme: the button only opens the MAGGIE PICKS list
  btn.querySelector(".label").textContent = "♪ music";
  btn.classList.add("started");
})();

/* ---------- tracks panel (p. 71) ----------
   Each song plays its official 30-second preview right in the panel,
   looked up from Apple's public iTunes Search API when clicked.
   If you later add a Spotify playlist, set PLAYLIST below to embed it as well. */
const PLAYLIST = "";   // e.g. "https://open.spotify.com/playlist/XXXXXXXX"
(function () {
  const pl = document.querySelector(".tp-pl");
  if (pl) { if (PLAYLIST) pl.href = PLAYLIST; else pl.addEventListener("click", e => { e.preventDefault(); pl.textContent = "PLAYLIST COMING SOON"; }); }
  const pop = document.querySelector(".tracks-pop"), btn = document.querySelector(".sound");
  if (!pop || !btn) return;
  const player = pop.querySelector(".tp-player"), audio = pop.querySelector(".tp-audio"), now = pop.querySelector(".tp-now");
  const open = () => { pop.hidden = false; }, close = () => { pop.hidden = true; };
  btn.addEventListener("click", e => { e.stopPropagation(); pop.hidden ? open() : close(); });
  pop.querySelector(".tp-x").addEventListener("click", close);
  pop.addEventListener("click", e => { if (e.target === pop) close(); });
  pop.addEventListener("pointerdown", e => e.stopPropagation());
  addEventListener("keydown", e => { if (e.key === "Escape" && !pop.hidden) close(); });

  // JSONP lookup (the iTunes API supports it, so it works from any static host)
  let n = 0;
  const lookup = q => new Promise((res, rej) => {
    const cb = "maggieIt" + (++n), s = document.createElement("script");
    const t = setTimeout(() => { cleanup(); rej(new Error("timeout")); }, 7000);
    const cleanup = () => { clearTimeout(t); delete window[cb]; s.remove(); };
    window[cb] = d => { cleanup(); res(d); };
    s.src = `https://itunes.apple.com/search?media=music&entity=song&limit=5&term=${encodeURIComponent(q)}&callback=${cb}`;
    s.onerror = () => { cleanup(); rej(new Error("blocked")); };
    document.head.append(s);
  });
  const rows = [...pop.querySelectorAll(".tp-list .tp-row")];
  const playRow = async r => {
    rows.forEach(x => x.classList.remove("now")); r.classList.add("now");
    window.maggieMusic && window.maggieMusic.isOn() && window.maggieMusic.stop();
    player.hidden = false; now.textContent = "loading…";
    const [artist, title] = [...r.querySelectorAll("span")].map(s => s.textContent);
    const spot = `https://open.spotify.com/search/${encodeURIComponent(artist + " " + title)}`;
    try {
      const d = r.dataset.preview ? null : await lookup(`${artist.split(",")[0]} ${title.split(" - ")[0].replace(/\(.*\)/, "")}`);
      if (d) {
        const hit = (d.results || []).find(x => x.previewUrl) ;
        if (!hit) throw new Error("none");
        r.dataset.preview = hit.previewUrl; r.dataset.link = hit.trackViewUrl;
      }
      audio.src = r.dataset.preview; await audio.play();
      now.innerHTML = `now playing: ${title} — ${artist} · preview · <a href="${r.dataset.link}" target="_blank" rel="noopener">full song on Apple Music</a> · <a href="${spot}" target="_blank" rel="noopener">Spotify</a>`;
    } catch (e) {
      now.innerHTML = `couldn't load a preview here · <a href="${spot}" target="_blank" rel="noopener">listen on Spotify</a>`;
    }
  };
  rows.forEach(r => r.addEventListener("click", () => playRow(r)));
  // when a preview ends, go on to the next song
  audio.addEventListener("ended", () => { const i = rows.findIndex(r => r.classList.contains("now")); if (i >= 0 && rows[i + 1]) playRow(rows[i + 1]); });

  const plId = (PLAYLIST.match(/playlist\/([A-Za-z0-9]+)/) || [])[1];
  if (plId) player.insertAdjacentHTML("beforeend", `<iframe src="https://open.spotify.com/embed/playlist/${plId}" style="width:100%;height:152px;border:0;border-radius:12px;margin-top:10px" allow="autoplay; encrypted-media" loading="lazy" title="Spotify playlist"></iframe>`);
})();
