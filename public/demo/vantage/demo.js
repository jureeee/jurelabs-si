/**
 * Vantage - predstavitvena razlicica.
 *
 * Pravi vmesnik aplikacije govori s strezniskim delom (Flask), ta pa s
 * pravimi IP kamerami prek ONVIF. Na spletni strani ni ne streznika ne kamer,
 * zato ju ta datoteka nadomesti: prestreze fetch in EventSource ter vraca
 * izmisljene podatke. Vmesnik sam je nespremenjen, zgrajen iz izvirne kode.
 *
 * Naslovi kamer so iz obsega 192.0.2.0/24, ki je rezerviran za dokumentacijo
 * in ga v nobenem pravem omrezju ni. Posnetki so staticne slike v mapi cam/.
 */
(() => {
  "use strict";

  const KAMERE = [
    ["Main-Gate", 11, "Axis", "Q6135-LE", false],
    ["Harbor-Pier", 12, "Hikvision", "DS-2DE4425IW", true],
    ["Ski-Lift-2", 13, "Axis", "Q6078-E", true],
    ["North-Ridge", 14, "Dahua", "SD49425XB", true],
    ["Courtyard", 15, "Avigilon", "H5A-BO", false],
    ["Forest-Trail", 16, "Hanwha", "XNP-6400RW", false],
  ];

  const zdaj = () => new Date().toTimeString().slice(0, 8);
  const cakaj = (ms) => new Promise((r) => setTimeout(r, ms));

  const stanje = {
    vrnitev: true,
    zamik: 12,
    zadnjaOsvezitev: zdaj(),
    iskanje: { running: false, progress: { phase: "idle", pct: 0 }, avigilon: [], onvif: [], other: [], last_ts: "", cache_valid: false },
  };

  const kamere = {};
  const zmoznosti = {};
  const statusi = {};
  const napake = {};
  const videno = {};
  for (const [ime, zadnji, proizvajalec, model, ptz] of KAMERE) {
    kamere[ime] = { ip: `192.0.2.${zadnji}`, port: 80, user: "operator", https: zadnji % 2 === 0, has_onvif_pass: true };
    statusi[ime] = "online";
    napake[ime] = "";
    videno[ime] = zdaj();
    zmoznosti[ime] = {
      name: ime, ip: kamere[ime].ip, port: 80, user: "operator", https: kamere[ime].https,
      onvif_ok: true, onvif_status: "ONVIF OK", profiles_ok: true, profiles_count: 2,
      snapshot_ok: true, ptz_ok: ptz, presets_ok: ptz, presets_count: ptz ? 5 : 0, events_ok: zadnji % 3 !== 0,
      device_info: { manufacturer: proizvajalec, model, firmware: `v${8 + (zadnji % 3)}.${zadnji}.2`, serial: `DEMO-${1000 + zadnji * 37}` },
      latency_ms: 18 + zadnji * 3, last_ok_ts: zdaj(), last_error: "", status: "online", last_seen: zdaj(), running: true, cache_age_s: 4,
    };
  }

  const prednastavitve = {
    HOME: Object.keys(kamere).map((camera) => ({ camera, token: "1" })),
    "GATE-OPEN": [{ camera: "Main-Gate", token: "2" }, { camera: "Courtyard", token: "2" }],
    "PIER-WIDE": [{ camera: "Harbor-Pier", token: "3" }],
    "LIFT-TOP": [{ camera: "Ski-Lift-2", token: "2" }, { camera: "North-Ridge", token: "4" }],
    "RIDGE-PAN": [{ camera: "North-Ridge", token: "2" }, { camera: "Ski-Lift-2", token: "3" }],
    "NIGHT-PATROL": Object.keys(kamere).filter((k) => zmoznosti[k].ptz_ok).map((camera) => ({ camera, token: "5" })),
  };

  // --- tok dogodkov --------------------------------------------------------
  const poslusalci = new Set();
  function oddaj(sporocilo) {
    const ev = new MessageEvent("message", { data: JSON.stringify(sporocilo) });
    for (const es of poslusalci) {
      es.onmessage && es.onmessage(ev);
      for (const f of es._poslusalci) f(ev);
    }
  }
  const obvestilo = (msg, level = "info") => oddaj({ type: "toast", msg, level });

  class LaznoEventSource {
    constructor(url) {
      this.url = url;
      this.readyState = 1;
      this.onmessage = null;
      this.onerror = null;
      this.onopen = null;
      this._poslusalci = [];
      poslusalci.add(this);
      setTimeout(() => this.onopen && this.onopen(new Event("open")), 30);
    }
    addEventListener(tip, f) { if (tip === "message") this._poslusalci.push(f); }
    removeEventListener(tip, f) { this._poslusalci = this._poslusalci.filter((x) => x !== f); }
    close() { this.readyState = 2; poslusalci.delete(this); }
  }
  LaznoEventSource.CONNECTING = 0;
  LaznoEventSource.OPEN = 1;
  LaznoEventSource.CLOSED = 2;
  window.EventSource = LaznoEventSource;

  // --- odgovori -------------------------------------------------------------
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
  const besedilo = (t, status = 200) => new Response(t, { status, headers: { "content-type": "text/plain" } });

  const zagon = () => ({
    role: "admin",
    cameras: kamere,
    camera_status: statusi,
    camera_last_error: napake,
    camera_last_seen: videno,
    caps_snapshot: zmoznosti,
    presets: prednastavitve,
    refresh_every: 60,
    return_home_enabled: stanje.vrnitev,
    return_delay: stanje.zamik,
    last_refresh_ts: stanje.zadnjaOsvezitev,
    last_refresh_ok: true,
    refresh_in_progress: false,
    live_runtime: { ok: true, reason: "" },
  });

  let osvezuje = false;
  async function osvezi() {
    if (osvezuje) return;
    osvezuje = true;
    oddaj({ type: "refresh", phase: "start" });
    for (const ime of Object.keys(kamere)) {
      await cakaj(260);
      const z = zmoznosti[ime];
      z.latency_ms = Math.max(9, Math.round(z.latency_ms + (Math.random() - 0.5) * 12));
      z.last_seen = z.last_ok_ts = videno[ime] = zdaj();
      oddaj({ type: "caps", name: ime, caps: { ...z } });
    }
    stanje.zadnjaOsvezitev = zdaj();
    oddaj({ type: "refresh", phase: "end", ok: true, ts: stanje.zadnjaOsvezitev });
    osvezuje = false;
  }

  let vrnitevCasovnik = null;
  function sprozi(ukaz) {
    const seznam = prednastavitve[ukaz] || [];
    oddaj({ cmd: ukaz, count: seznam.length, return_enabled: stanje.vrnitev && ukaz !== "HOME", delay: stanje.zamik });
    obvestilo(`${ukaz} → ${seznam.length} ${seznam.length === 1 ? "camera" : "cameras"}`, "ok");
    clearTimeout(vrnitevCasovnik);
    if (stanje.vrnitev && ukaz !== "HOME") {
      vrnitevCasovnik = setTimeout(() => {
        oddaj({ cmd: "HOME", count: prednastavitve.HOME.length, returned: true });
        obvestilo("Returned to HOME", "info");
      }, stanje.zamik * 1000);
    }
  }

  const NAJDENE = {
    avigilon: [{ ip: "192.0.2.41", port: 443, https: true, type: "avigilon", manufacturer: "Avigilon", model: "H5SL-BO", status: "new" }],
    onvif: [
      { ip: "192.0.2.52", port: 80, https: false, type: "onvif", manufacturer: "Axis", model: "M3086-V", status: "new", xaddr: "http://192.0.2.52/onvif/device_service" },
      { ip: "192.0.2.53", port: 80, https: false, type: "onvif", manufacturer: "Hanwha", model: "QNV-C8083R", status: "new", xaddr: "http://192.0.2.53/onvif/device_service" },
      { ip: "192.0.2.12", port: 80, https: true, type: "onvif", manufacturer: "Hikvision", model: "DS-2DE4425IW", status: "known", note: "Harbor-Pier" },
    ],
    other: [{ ip: "192.0.2.90", ports: [80, 554], type: "rtsp", note: "RTSP only", status: "new" }],
  };

  async function isci() {
    const s = stanje.iskanje;
    if (s.running) return;
    Object.assign(s, { running: true, avigilon: [], onvif: [], other: [], progress: { phase: "wsd", pct: 0 } });
    const faze = ["wsd", "onvif", "avigilon", "ports"];
    for (let i = 1; i <= 20; i++) {
      await cakaj(280);
      if (!s.running) return;
      const pct = i * 5;
      const faza = faze[Math.min(faze.length - 1, Math.floor((i - 1) / 5))];
      if (i === 6) s.onvif = NAJDENE.onvif.slice(0, 2);
      if (i === 11) s.avigilon = NAJDENE.avigilon;
      if (i === 15) s.onvif = NAJDENE.onvif;
      if (i === 18) s.other = NAJDENE.other;
      s.progress = { phase: faza, pct };
      oddaj({ type: "discover", phase: "progress", payload: { phase: faza, pct, counts: { avigilon: s.avigilon.length, onvif: s.onvif.length, other: s.other.length } } });
    }
    s.running = false;
    s.last_ts = zdaj();
    s.cache_valid = true;
    oddaj({ type: "discover", phase: "end", payload: { phase: "done", pct: 100, counts: { avigilon: s.avigilon.length, onvif: s.onvif.length, other: s.other.length } } });
    obvestilo(`Discovery finished: ${s.avigilon.length + s.onvif.length + s.other.length} devices`, "ok");
  }

  function dnevnik() {
    const vrstice = [];
    const ure = Date.now();
    const vzorci = [
      (k) => `INFO  refresh  ${k} caps ok (${zmoznosti[k].latency_ms} ms)`,
      (k) => `INFO  preset   ${k} goto token=1`,
      (k) => `DEBUG onvif    ${k} GetProfiles -> 2 profiles`,
      (k) => `INFO  snapshot ${k} 1920x1080 jpeg`,
      () => "INFO  http     GET /api/bootstrap 200",
    ];
    const imena = Object.keys(kamere);
    for (let i = 60; i > 0; i--) {
      const t = new Date(ure - i * 23000).toISOString().replace("T", " ").slice(0, 19);
      vrstice.push(`${t}  ${vzorci[i % vzorci.length](imena[i % imena.length])}`);
    }
    return vrstice.join("\n");
  }

  function odgovor(pot, url, opts) {
    const metoda = (opts.method || "GET").toUpperCase();
    let m;
    if (pot === "/api/bootstrap") return json(zagon());
    if (pot === "/refresh") { osvezi(); return json({ busy: false }); }
    if ((m = pot.match(/^\/trigger\/(.+)$/))) { sprozi(decodeURIComponent(m[1])); return json({ ok: true }); }
    if (pot === "/toggle") { stanje.vrnitev = !stanje.vrnitev; return json(stanje.vrnitev); }
    if ((m = pot.match(/^\/delay\/(\d+)$/))) { stanje.zamik = Number(m[1]); return besedilo("ok"); }
    if ((m = pot.match(/^\/camdata\/(.+)$/))) return json({ ...kamere[decodeURIComponent(m[1])] });
    if ((m = pot.match(/^\/cam\/([^/]+)\/caps$/))) return json({ ...zmoznosti[decodeURIComponent(m[1])] });
    if ((m = pot.match(/^\/cam\/([^/]+)\/live_test$/))) return json({ ok: true });
    if (pot === "/discover/start") { isci(); return json({ ok: true }); }
    if (pot === "/discover/status") return json(stanje.iskanje);
    if (pot === "/discover/cancel") { stanje.iskanje.running = false; return json({ ok: true, canceling: true }); }
    if (pot === "/discover/add") { obvestilo("Demo: devices can't be added here", "warn"); return json({ ok: false, error: "Demo mode" }); }
    if (pot === "/autoname") return json({ name: `Cam-${(url.searchParams.get("ip") || "").split(".").pop() || "new"}` });
    if (pot === "/savecam" || /^\/delcam\//.test(pot)) { obvestilo("Demo: changes are not saved", "warn"); return besedilo("ok"); }
    if ((m = pot.match(/^\/onvif\/([^/]+)\/device$/))) return json(zmoznosti[decodeURIComponent(m[1])]?.device_info || {});
    if ((m = pot.match(/^\/onvif\/([^/]+)\/profiles$/))) {
      return json({ profiles: [
        { token: "Profile_1", name: "MainStream", encoding: "H.264", resolution: "1920x1080", fps: 25 },
        { token: "Profile_2", name: "SubStream", encoding: "H.264", resolution: "640x360", fps: 15 },
      ] });
    }
    if ((m = pot.match(/^\/onvif\/([^/]+)\/presets$/))) {
      const ime = decodeURIComponent(m[1]);
      if (!zmoznosti[ime]?.presets_ok) return json({ presets: [] });
      return json({ presets: ["HOME", "Wide", "Entrance", "Zoom-In", "Patrol"].map((name, i) => ({ token: String(i + 1), name })) });
    }
    if (/^\/onvif\/[^/]+\/(presets\/(goto|set|remove)|ptz\/(move|stop))$/.test(pot)) return json({ ok: true });
    if (/^\/onvif\/[^/]+\/events\/pull$/.test(pot)) return json({ ok: true, events: [] });
    if (pot === "/logs/rolling") return json({ text: dnevnik() });
    if (pot === "/logs/prefs") return json(metoda === "POST" ? { ok: true } : { log_write_enabled: true, log_read_enabled: true });
    if (pot === "/change-admin-pass" || pot === "/change-global-pass") {
      obvestilo("Demo: passwords can't be changed", "warn");
      return json({ ok: false, error: "Demo mode" });
    }
    if (pot === "/login" || pot === "/logout") return besedilo("ok");
    return undefined;
  }

  const izvirniFetch = window.fetch.bind(window);
  window.fetch = async (vhod, opts = {}) => {
    const naslov = typeof vhod === "string" ? vhod : vhod instanceof URL ? vhod.href : vhod.url;
    const url = new URL(naslov, location.href);
    if (url.origin !== location.origin) return izvirniFetch(vhod, opts);
    // Relativni naslovi se razresijo pod mapo demota; odrezemo jo, da so poti enake strezniskim.
    const pot = url.pathname.replace(/^.*?\/demo\/vantage(?=\/)/, "");
    const odg = odgovor(pot, url, opts);
    if (!odg) return izvirniFetch(vhod, opts);
    await cakaj(60 + Math.random() * 90);
    return odg;
  };

  // Vmesnik je ziv tudi, ko se ga nihce ne dotakne: kamere vsake toliko javijo stanje.
  setInterval(() => {
    const imena = Object.keys(kamere);
    const ime = imena[Math.floor(Math.random() * imena.length)];
    const z = zmoznosti[ime];
    z.latency_ms = Math.max(9, Math.round(z.latency_ms + (Math.random() - 0.5) * 8));
    z.last_seen = videno[ime] = zdaj();
    oddaj({ type: "caps", name: ime, caps: { ...z } });
  }, 7000);
})();
