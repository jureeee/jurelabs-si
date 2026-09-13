/**
 * Trace Space - predstavitvena razlicica.
 *
 * Pravi vmesnik bere podatke s streznika, ta pa jih dobi od senzorjev HALO. Na
 * spletni strani ni ne enega ne drugega, zato ta datoteka prestreze fetch in
 * vraca vnaprej posnete odgovore. Posneti so iz pravega streznika Trace Space,
 * ki je tekel na IZMISLJENI bazi: stavba, prostori in meritve niso resnicni.
 *
 * Demo je posnetek enega trenutka - srede ob 10:52, sredi pouka. Ura brskalnika
 * zato tece od tega trenutka naprej, da so "danes", "pred 30 s" in grafi med
 * sabo usklajeni.
 *
 * Odgovori so v paketih (api/*.bin, gzip), nalozijo se sele, ko jih pogled
 * potrebuje. Kadar natancne kombinacije parametrov ni, vzamemo najblizjo.
 */
(() => {
  "use strict";

  const DEMO_ZDAJ = "2026-09-09T10:52:30";

  // --- ura -------------------------------------------------------------------
  const PravaUra = Date;
  const V = PravaUra.parse(DEMO_ZDAJ);
  const Z = PravaUra.now();
  class DemoUra extends PravaUra {
    constructor(...a) {
      if (a.length === 0) super(V + (PravaUra.now() - Z));
      else super(...a);
    }
    static now() { return V + (PravaUra.now() - Z); }
  }
  DemoUra.parse = PravaUra.parse;
  DemoUra.UTC = PravaUra.UTC;
  window.Date = DemoUra;

  // --- paketi ----------------------------------------------------------------
  const koren = new URL(".", document.currentScript ? document.currentScript.src : location.href);
  const izvirniFetch = window.fetch.bind(window);

  // Paketi so stisnjeni z gzip. Nekateri strezniki jih posljejo z glavo
  // Content-Encoding in brskalnik jih razpakira sam - zato gledamo prve bajte,
  // ne koncnice.
  async function razpakiraj(pot) {
    const r = await izvirniFetch(new URL(pot, koren));
    if (!r.ok) throw new Error("ni paketa " + pot);
    const bajti = new Uint8Array(await r.arrayBuffer());
    if (bajti[0] === 0x1f && bajti[1] === 0x8b) {
      const tok = new Blob([bajti]).stream().pipeThrough(new DecompressionStream("gzip"));
      return JSON.parse(await new Response(tok).text());
    }
    return JSON.parse(new TextDecoder().decode(bajti));
  }

  let indeks = null;
  const nalozi = () => (indeks ??= razpakiraj("api/indeks.bin"));
  const paketi = new Map();
  const paket = (ime) => {
    if (!paketi.has(ime)) paketi.set(ime, razpakiraj(`api/${ime}.bin`));
    return paketi.get(ime);
  };

  // Enako kot na strani snemalnika: pot + urejeni parametri brez 't'.
  function kljuc(pot, iskalni) {
    const par = [...iskalni.entries()].filter(([k]) => k !== "t")
      .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0));
    const q = new URLSearchParams(par).toString();
    return pot + (q ? "?" + q : "");
  }

  const CASOVNI = new Set(["ts", "end", "start"]);

  /** Najblizji posnet odgovor za isto pot: ujemanje parametrov, nato cas. */
  function najblizji(ind, pot, iskalni) {
    const zeleni = Object.fromEntries([...iskalni.entries()].filter(([k]) => k !== "t"));
    let najboljsi = null;
    let tocke = -Infinity;
    for (const k of Object.keys(ind)) {
      if (!k.startsWith(pot) || (k.length > pot.length && k[pot.length] !== "?")) continue;
      const imajo = Object.fromEntries(new URLSearchParams(k.slice(pot.length + 1)).entries());
      let t = 0;
      for (const [ime, vr] of Object.entries(zeleni)) {
        if (!(ime in imajo)) { t -= CASOVNI.has(ime) ? 1 : 3; continue; }
        if (imajo[ime] === vr) { t += 10; continue; }
        if (CASOVNI.has(ime)) {
          const razlika = Math.abs(PravaUra.parse(imajo[ime]) - PravaUra.parse(vr)) / 3600000;
          t += Number.isFinite(razlika) ? 8 - Math.min(8, razlika / 6) : 0;
        } else if (ime === "q") {
          const a = new Set(vr.toLowerCase().split(/\s+/));
          t += [...imajo[ime].toLowerCase().split(/\s+/)].filter((b) => a.has(b)).length * 3;
        } else {
          t -= 4;
        }
      }
      for (const ime of Object.keys(imajo)) if (!(ime in zeleni)) t -= CASOVNI.has(ime) ? 2 : 3;
      if (t > tocke) { tocke = t; najboljsi = k; }
    }
    return najboljsi;
  }

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

  async function odgovor(url, metoda) {
    const pot = url.pathname.replace(/^.*?\/demo\/trace-space(?=\/)/, "");
    if (metoda !== "GET") {
      return json({ ok: false, error: "Predstavitvena različica — spremembe se ne shranijo." }, 403);
    }
    const ind = await nalozi();
    let k = kljuc(pot, url.searchParams);
    if (!(k in ind)) k = najblizji(ind, pot, url.searchParams);
    if (!k) return json({ error: "V predstavitveni različici ni na voljo." }, 404);
    const vsebina = await paket(ind[k]);
    return json(vsebina[k]);
  }

  window.fetch = async (vhod, opts = {}) => {
    const naslov = typeof vhod === "string" ? vhod : vhod instanceof URL ? vhod.href : vhod.url;
    const url = new URL(naslov, location.href);
    const metoda = String(opts.method || (vhod instanceof Request ? vhod.method : "GET")).toUpperCase();
    if (url.origin === location.origin && /\/api\//.test(url.pathname)) {
      try {
        return await odgovor(url, metoda);
      } catch (e) {
        return json({ error: String(e && e.message || e) }, 500);
      }
    }
    return izvirniFetch(vhod, opts);
  };
})();
