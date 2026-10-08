/* =====================================================================
   SOUND ENGINE
   Off by default. Nothing plays until the visitor turns sound on.
   All sound is synthesized (no audio files to download).
   ===================================================================== */
(function () {
  let ctx = null, master = null, drone = null, enabled = false;

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }

  function startDrone() {
    if (!ctx || drone) return;
    const out = ctx.createGain(); out.gain.value = 0.06;
    const filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 420; filter.Q.value = 0.7;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 180;
    lfo.connect(lfoGain).connect(filter.frequency);
    const oscs = [55, 55.4, 82.4, 110.2].map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i < 2 ? "sawtooth" : "sine";
      o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = i < 2 ? 0.22 : 0.35;
      o.connect(g).connect(filter);
      o.start();
      return o;
    });
    filter.connect(out).connect(master);
    lfo.start();
    drone = { oscs, lfo, out };
  }

  function ramp(target, time) {
    if (!master) return;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(target, t + time);
  }

  function blip(freq, dur, type, vol) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, from, to, vol) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.2;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.25, t + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(master); src.start(t);
  }

  const api = {
    get enabled() { return enabled; },
    set(on) {
      enabled = !!on;
      if (enabled) { init(); if (!ctx) { enabled = false; return false; } ctx.resume(); startDrone(); ramp(0.9, 1.2); }
      else if (ctx) ramp(0, 0.4);
      document.documentElement.classList.toggle("sound-on", enabled);
      try { localStorage.setItem("wd4u.sound", enabled ? "1" : "0"); } catch (e) {}
      return enabled;
    },
    toggle() { return api.set(!enabled); },
    tick() { blip(1320, 0.06, "sine", 0.05); },
    select() { blip(660, 0.09, "triangle", 0.08); blip(990, 0.12, "sine", 0.05); },
    whoosh() { noise(1.1, 200, 4000, 0.3); },
    chime() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => setTimeout(() => blip(f, 0.9, "sine", 0.07), i * 110)); }
  };
  window.WD4U_Sound = api;
})();
