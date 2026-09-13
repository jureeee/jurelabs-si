// Casovna os za Evente.
//
// Cas je vodoravna os: dogodki stojijo tam, kjer so se zgodili. Nikoli ni v
// dokumentu vec enot, kot jih je vidnih -- dnevi se berejo sproti in enote se
// ob potovanju pojavijo z ene strani ter izginejo na drugi.
//
// Kartica pove toliko, kolikor blizu je kazalec: pika, ime, cela kartica s
// podrobnostmi. Kar bi se prekrivalo, se zdruzi v grucо; gruca pove isto v
// treh stopnjah -- stevilo, sestava, seznam.

const URA = 3600e3;
const ZOOM = [
  { v: "3h", ms: 3 * URA, korak: 30 * 60e3, l: "3 ure" },
  { v: "12h", ms: 12 * URA, korak: 2 * URA, l: "12 ur" },
  { v: "1d", ms: 24 * URA, korak: 4 * URA, l: "1 dan" },
  { v: "3d", ms: 72 * URA, korak: 12 * URA, l: "3 dni" },
  { v: "7d", ms: 168 * URA, korak: 24 * URA, l: "teden" },
];
const ROB = 0.35;
const VISINA_PASU = 52;
const GRUCA_PX = 30;        // blizje od tega na zaslonu -> ista gruca
const D_IME = 250;
const D_POLNA = 130;

// Iskalnik vraca imena zaznav v anglescini; v vmesniku govorimo slovensko.
const ZAZNAVE = { smoking: "Kajenje", vape: "Vaping", masking: "Zakrivanje",
  aggression: "Agresija", gunshot: "Strel", occupancy: "Zasedenost",
  motion: "Gibanje", tamper: "Poseg v napravo" };
const imeZaznave = (x) => ZAZNAVE[String(x || "").toLowerCase()] || x || "";
// slovenscina ima dvojino: 1 zadetek, 2 zadetka, 3 zadetki, 5 zadetkov
const zadetkov = (n) => n + (n % 100 === 1 ? " zadetek" : n % 100 === 2 ? " zadetka"
  : n % 100 === 3 || n % 100 === 4 ? " zadetki" : " zadetkov");

const TIERI = [
  { v: "", l: "Vse stopnje" },
  { v: "alarm", l: "Samo alarmi" },
  { v: "warning", l: "Opozorila in alarmi" },
  { v: "info", l: "Samo indikatorji" },
];

const stanje = {
  sredina: Date.now(),
  zoom: 2,
  dnevi: new Map(),
  vNaisi: new Set(),
  enote: new Map(),
  host: null,
  api: null,
  raf: 0,
  vlecem: null,
  hitrost: 0,
  reduced: false,
  odprta: null,
  mis: null,
  oznaka: null,
  predIskanjem: null,
  let: 0,
  letRok: 0,
  filter: { dev: "", base: "", tier: "" },
  naprave: [],
  plosce: new Map(),
  odjava: null,
};

// Datum sestavimo iz LOKALNIH delov. toISOString() prevede v UTC in polnoc
// po srednjeevropskem casu pristane na prejsnjem dnevu -- os je potem prosila
// za 28. julij, ceprav je gledala 29., in obstala prazna.
const dnevKljuc = (d) => {
  const x = new Date(d);
  return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") +
    "-" + String(x.getDate()).padStart(2, "0");
};
const ura = (t) => new Date(t).toLocaleTimeString("sl", { hour: "2-digit", minute: "2-digit" });
const datum = (t) => new Date(t).toLocaleDateString("sl", { weekday: "short", day: "2-digit", month: "2-digit" });
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function okno() {
  const sirina = ZOOM[stanje.zoom].ms;
  return { od: stanje.sredina - sirina / 2, do: stanje.sredina + sirina / 2, sirina };
}

function trajanje(s) {
  if (!s || s < 60) return "";
  const m = Math.round(s / 60);
  return m < 90 ? m + " min" : (m / 60).toFixed(1).replace(".", ",") + " h";
}

// ---------- podatki ----------
async function poskrbiZaDneve(api) {
  const { od, do: doo, sirina } = okno();
  const zac = new Date(od - sirina * ROB);
  const kon = new Date(doo + sirina * ROB);
  const potrebni = [];
  for (let d = new Date(zac.getFullYear(), zac.getMonth(), zac.getDate());
       d <= kon; d.setDate(d.getDate() + 1)) {
    potrebni.push(dnevKljuc(d));
  }
  const manjkajo = potrebni.filter((k) => !stanje.dnevi.has(k) && !stanje.vNaisi.has(k));
  if (!manjkajo.length) return false;
  manjkajo.forEach((k) => stanje.vNaisi.add(k));
  await Promise.all(manjkajo.map(async (k) => {
    try {
      const d = await api("/api/v2/incidents?date=" + k + "&kind=all");
      stanje.dnevi.set(k, (d.incidents || []).map((i) => ({
        ...i,
        t0: new Date(i.started_at).getTime(),
        t1: new Date(i.ended_at || i.started_at).getTime(),
      })));
    } catch {
      stanje.dnevi.set(k, []);
    } finally {
      stanje.vNaisi.delete(k);
    }
  }));
  osveziIzbire();
  return true;
}

// Filter dela PRED gruco: filtriran pogled se mora zgrucati na novo, ne
// skrivati kartic iz starih gruc.
function vidni() {
  const { od, do: doo, sirina } = okno();
  const a = od - sirina * ROB, b = doo + sirina * ROB;
  const f = stanje.filter;
  const out = [];
  for (const [, seznam] of stanje.dnevi) {
    for (const i of seznam) {
      if (i.t1 < a || i.t0 > b) continue;
      if (f.dev && String(i.device_id) !== f.dev) continue;
      if (f.base && i.base !== f.base) continue;
      if (f.tier === "alarm" && i.tier !== "alarm") continue;
      if (f.tier === "warning" && i.tier === "info") continue;
      if (f.tier === "info" && i.tier !== "info") continue;
      out.push(i);
    }
  }
  return out.sort((x, y) => x.t0 - y.t0);
}

// Ponudbo filtrov sestavimo iz tega, kar je RES v podatkih -- filter ne sme
// ponujati kajenja, ce ga v teh dneh ni bilo.
function osveziIzbire() {
  const baze = new Map(), nap = new Map();
  for (const [, s] of stanje.dnevi) {
    for (const i of s) {
      if (!baze.has(i.base)) baze.set(i.base, i.label || i.base);
      if (!nap.has(String(i.device_id))) nap.set(String(i.device_id), i.device_name);
    }
  }
  stanje.baze = [{ v: "", l: "Vse meritve" },
    ...[...baze].sort((a, b) => a[1].localeCompare(b[1], "sl")).map(([v, l]) => ({ v, l }))];
  stanje.naprave = [...nap].map(([v, l]) => ({ v, l }));
  stanje.izbireSig = stanje.baze.map((b) => b.v).join(",") + "|" + stanje.naprave.length;
}

// ---------- grucenje ----------
// Gruca ni "isti dogodek", ampak "preblizu na zaslonu pri tem zoomu". Zato se
// preracuna ob vsakem premiku: ko priblizas, se gruce razpadejo same.
function gruci(seznam, naPiksel, od) {
  const enote = [];
  let g = null;
  for (const i of seznam) {
    const x = (i.t0 - od) / naPiksel;
    // Blizina se meri do PREJSNJEGA dogodka, sirina gruce pa do njenega
    // ZACETKA. Brez druge omejitve se gruce verizijo: gost niz gibanja bi se
    // spel v eno pilulo cez pol osi in to ni vec "preblizu na zaslonu".
    if (g && x - g.x <= GRUCA_PX && x - g.x0 <= GRUCA_PX * 3) {
      g.items.push(i); g.x = x; continue;
    }
    g = { x0: x, x, items: [i] };
    enote.push(g);
  }
  for (const e of enote) {
    e.x = e.x0;
    e.t0 = e.items[0].t0;
    e.tier = e.items.some((i) => i.tier === "alarm") ? "alarm"
      : e.items.some((i) => i.tier === "warning") ? "warning" : "info";
    e.kljuc = e.items.length === 1
      ? kljucI(e.items[0])
      : "g|" + kljucI(e.items[0]) + "|" + e.items.length;
  }
  return enote;
}

function kljucI(i) { return i.device_id + "|" + i.started_at + "|" + i.base; }

function pasovi(enote, sirinaEnote) {
  const konci = [];
  for (const e of enote) {
    let p = konci.findIndex((k) => e.x > k + 8);
    if (p === -1) { p = konci.length; konci.push(0); }
    konci[p] = e.x + sirinaEnote;
    e.pas = Math.min(p, 3);
  }
}

// ---------- izris enot ----------
function podrobnosti(i) {
  const vrs = [];
  if (i.peak != null) vrs.push(["Vrh", Number(i.peak).toFixed(1) + (i.unit ? " " + i.unit : "")]);
  if (i.threshold != null) vrs.push(["Meja", String(i.threshold) + (i.unit ? " " + i.unit : "")]);
  const t = trajanje(i.duration_s);
  if (t) vrs.push(["Trajanje", t + (i.ongoing ? " · še traja" : "")]);
  if (i.events > 1) vrs.push(["Meritev", String(i.events)]);
  vrs.push(["Naprava", i.device_name || "—"]);
  return '<span class="tl-vrstice">' + vrs.map(([k, v]) =>
    '<span class="tl-vr"><b>' + esc(k) + "</b><i>" + esc(v) + "</i></span>").join("") + "</span>" +
    (i.why ? '<span class="tl-zakaj">' + esc(i.why) + "</span>" : "");
}

function narediKartico(i) {
  const el = document.createElement("button");
  el.className = "tl-k st-pika " + razredTier(i.tier);
  el.type = "button";
  el.innerHTML =
    '<i class="tl-val" aria-hidden="true"></i>' +
    '<span class="tl-pika"></span>' +
    '<span class="tl-vsebina">' +
      '<span class="tl-ime">' + esc(i.label || i.base || "Dogodek") + "</span>" +
      '<span class="tl-cas">' + ura(i.t0) +
        (trajanje(i.duration_s) ? " · " + trajanje(i.duration_s) : "") + "</span>" +
      '<span class="tl-vec">' + podrobnosti(i) + "</span>" +
    "</span>";
  el.addEventListener("pointerenter", () => voda(el));
  el.addEventListener("click", (e) => { e.stopPropagation(); pripni(el); });
  return el;
}

function razredTier(t) { return t === "alarm" ? "alert" : t === "warning" ? "warning" : "info"; }

// Gruca: stevilo -> sestava -> seznam. Osemnajst vrstic ne gre v visino osi,
// zato se seznam odpre kot plavajoca plosca NAD osjo, z lastnim drsenjem.
function narediGruco(e) {
  const el = document.createElement("button");
  el.className = "tl-g st-pika " + razredTier(e.tier);
  el.type = "button";
  el.innerHTML =
    '<i class="tl-val" aria-hidden="true"></i>' +
    '<span class="tl-g-st"></span>' +
    '<span class="tl-g-sestava"></span>';
  el.addEventListener("pointerenter", () => { voda(el); odpriGruco(el); });
  el.addEventListener("click", (ev) => { ev.stopPropagation(); odpriGruco(el, true); });
  return el;
}

function napolniGruco(el, e) {
  const po = new Map();
  for (const i of e.items) po.set(i.label || i.base, (po.get(i.label || i.base) || 0) + 1);
  const sest = [...po].sort((a, b) => b[1] - a[1]);
  el.querySelector(".tl-g-st").textContent = e.items.length > 99 ? "99+" : String(e.items.length);
  el.querySelector(".tl-g-sestava").textContent =
    sest.slice(0, 3).map(([l, n]) => n + "× " + l.toLowerCase()).join(" · ") +
    (sest.length > 3 ? " · +" + (sest.length - 3) : "");
  el._enota = e;
}

function odpriGruco(el, obKliku) {
  const e = el._enota;
  if (!e) return;
  const ze = stanje.plosce.get(e.kljuc);
  if (ze) {
    // Ponoven klik na isto gruco jo pripne oziroma odpne.
    if (obKliku) {
      if (ze.dataset.pin) zapriPlosco(e.kljuc);
      else ze.dataset.pin = "1";
    }
    return;
  }
  if (!obKliku && el._st !== "st-polna") return;
  zapriGruco();                       // nepripete se umaknejo, pripete ostanejo

  const p = document.createElement("div");
  p.className = "tl-g-plosca";
  if (obKliku) p.dataset.pin = "1";
  p.innerHTML = grucaSeznam(e);
  stanje.host.querySelector(".tl-polje").appendChild(p);
  p._lastnik = el;
  p._kljuc = e.kljuc;
  postaviPlosco(p, el);

  p.addEventListener("click", (ev) => {
    if (ev.target.closest(".tl-g-zapri")) { zapriPlosco(e.kljuc); return; }
    if (ev.target.closest(".tl-g-pin")) {
      if (p.dataset.pin) delete p.dataset.pin; else p.dataset.pin = "1";
      p.querySelector(".tl-g-pin").classList.toggle("on", !!p.dataset.pin);
      return;
    }
    const vr = ev.target.closest(".tl-g-vr");
    if (vr) {
      const i = e.items[Number(vr.dataset.n)];
      // Klik na dogodek ga tudi pripne -- odprt opis je pripet po definiciji,
      // sicer bi ga odmik miske pobrisal sredi branja.
      p.dataset.pin = "1";
      obrni(p, grucaPodrobno(i, e), () => oznaciCas(i.t0));
      return;
    }
    if (ev.target.closest(".tl-g-nazaj")) obrni(p, grucaSeznam(e));
  });

  p.addEventListener("pointerleave", () => { if (!p.dataset.pin) zapriPlosco(e.kljuc); });
  el.addEventListener("pointerleave", (ev) => {
    if (p.dataset.pin || p.contains(ev.relatedTarget)) return;
    setTimeout(() => { if (!p.dataset.pin && !p.matches(":hover")) zapriPlosco(e.kljuc); }, 140);
  }, { once: true });

  stanje.plosce.set(e.kljuc, p);
  if (!stanje.reduced) {
    p.animate([{ opacity: 0, transform: "translateY(8px) scale(0.96)", filter: "blur(8px)" },
               { opacity: 1, transform: "none", filter: "blur(0)" }],
      { duration: 380, easing: "cubic-bezier(0.16, 1, 0.22, 1)" });
  }
}

// Plosca stoji ob svoji gruci in se z njo premika: pripeta plosca, ki obvisi
// na mestu, medtem ko os potuje, kaze na napacno tocko.
function postaviPlosco(p, el) {
  const pr = stanje.host.querySelector(".tl-polje").getBoundingClientRect();
  const r = el.getBoundingClientRect();
  p.style.left = Math.min(Math.max(r.left - pr.left - 60, 8),
    Math.max(8, pr.width - 268)).toFixed(0) + "px";
}

function zapriPlosco(kljuc) {
  const p = stanje.plosce.get(kljuc);
  if (!p) return;
  stanje.plosce.delete(kljuc);
  p.remove();
}

// Zapre samo NEPRIPETE plosce; pripete so uporabnikova izbira.
function zapriGruco(vse) {
  for (const [k, p] of [...stanje.plosce]) {
    if (vse || !p.dataset.pin) { stanje.plosce.delete(k); p.remove(); }
  }
}

// Obrat kartice: stara stran odplava, nova prileti z nasprotne strani.
function obrni(p, html, potem) {
  const naprej = !p.dataset.stran;
  const konec = () => {
    p.innerHTML = html;
    p.dataset.stran = naprej ? "opis" : "";
    if (!stanje.reduced) {
      p.animate([
        { opacity: 0, transform: `translateX(${naprej ? 18 : -18}px)`, filter: "blur(7px)" },
        { opacity: 1, transform: "none", filter: "blur(0)" },
      ], { duration: 340, easing: "cubic-bezier(0.16, 1, 0.22, 1)" });
    }
    if (potem) potem();
  };
  if (stanje.reduced) return konec();
  const a = p.animate([
    { opacity: 1, transform: "none", filter: "blur(0)" },
    { opacity: 0, transform: `translateX(${naprej ? -18 : 18}px)`, filter: "blur(7px)" },
  ], { duration: 190, easing: "cubic-bezier(0.5, 0, 0.9, 0.4)" });
  a.onfinish = konec;
  setTimeout(() => { if (p.dataset.stran !== (naprej ? "opis" : "")) konec(); }, 280);
}

function grucaSeznam(e) {
  return '<div class="tl-g-glava">' +
      "<span>" + e.items.length + " dogodkov · " + esc(ura(e.items[0].t0)) + "–" +
        esc(ura(e.items[e.items.length - 1].t0)) + "</span>" +
      '<button class="tl-g-pin" type="button" title="Pripni">' +
        '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.6 1.6l4.8 4.8-1.3 1.3-1.1-.3' +
        '-2.5 2.5.4 2.3-1.2 1.2-3-3-3.1 3.1-.7-.7 3.1-3.1-3-3 1.2-1.2 2.3.4 2.5-2.5-.3-1.1z" ' +
        'fill="currentColor"/></svg></button>' +
      '<button class="tl-g-zapri" type="button" title="Zapri">×</button>' +
    "</div>" +
    '<div class="tl-g-seznam">' + e.items.map((i, n) =>
      '<button class="tl-g-vr ' + razredTier(i.tier) + '" type="button" data-n="' + n + '">' +
        '<span class="tl-pika"></span>' +
        '<span class="tl-g-ime">' + esc(i.label || i.base) + "</span>" +
        '<span class="tl-g-cas">' + esc(ura(i.t0)) + "</span>" +
      "</button>").join("") + "</div>";
}

function grucaPodrobno(i, e) {
  return '<div class="tl-g-glava opis">' +
      '<button class="tl-g-nazaj" type="button" aria-label="Nazaj na seznam">' +
        '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 3.5L5 8l4.5 4.5" ' +
          'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ' +
          'stroke-linejoin="round"/></svg></button>' +
      '<span class="tl-g-naslov ' + razredTier(i.tier) + '">' +
        '<span class="tl-pika"></span>' + esc(i.label || i.base) + "</span>" +
      '<span class="tl-g-cas">' + esc(ura(i.t0)) + "</span>" +
    "</div>" +
    '<div class="tl-g-telo">' + podrobnosti(i) +
      '<div class="tl-g-vrni">' + esc(e.items.length) + " dogodkov v tej točki</div>" +
    "</div>";
}

// Ko odpres opis dogodka, ga os tudi oznaci -- da vidis, katera pika je to.
function oznaciCas(t) {
  for (const [, el] of stanje.enote) el.classList.remove("zadetek");
  for (const [, el] of stanje.enote) {
    if ((el._zacetki || []).some((x) => Math.abs(x - t) <= 1000)) el.classList.add("zadetek");
  }
}


// Voda: obroc se razlije iz enote, ta pa se mehko raztegne.
// Postavitev gre v `translate`, tresljaj v `scale` -- ce bi oboje slo skozi
// `transform`, bi animacija povozila postavitev in enota bi odletela v kot.
function voda(el) {
  if (stanje.reduced) return;
  const val = el.querySelector(".tl-val");
  if (val) {
    val.getAnimations().forEach((a) => a.cancel());
    val.animate([{ scale: "0.2", opacity: 0.5 }, { scale: "1", opacity: 0 }],
      { duration: 760, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
  }
  el.animate([
    { scale: "1 1" },
    { scale: "1.05 0.96", offset: 0.32 },
    { scale: "0.99 1.02", offset: 0.62 },
    { scale: "1 1" },
  ], { duration: 820, easing: "cubic-bezier(0.34, 1.3, 0.5, 1)" });
}

// Pripetih je lahko VEC hkrati. Prej je vsak nov klik zaprl prejsnjega, kar
// pomeni, da dveh dogodkov ni bilo mogoce gledati enega ob drugem -- ravno
// tega, zaradi cesar clovek klika.
function pripni(el) {
  const bil = el.classList.contains("odprt");
  el.classList.toggle("odprt", !bil);
  if (!bil && !stanje.reduced) {
    el.animate([{ scale: "0.97 1.03" }, { scale: "1.01 0.99", offset: 0.55 }, { scale: "1 1" }],
      { duration: 620, easing: "cubic-bezier(0.34, 1.3, 0.5, 1)" });
  }
}

// ---------- blizina kazalca ----------
function blizina() {
  const m = stanje.mis;
  for (const [, el] of stanje.enote) {
    let st = "st-polna";
    if (m) {
      const dx = m.x - (el._x + (el._w || 158) / 2);
      const dy = m.y - (el._y + 20);
      const d = Math.hypot(dx * 0.72, dy * 1.35);
      st = d < D_POLNA ? "st-polna" : d < D_IME ? "st-ime" : "st-pika";
    }
    if (el.classList.contains("odprt")) st = "st-polna";
    if (el._st !== st) {
      el.classList.remove("st-pika", "st-ime", "st-polna");
      el.classList.add(st);
      el._st = st;
      // Ko gruca ni vec pod kazalcem, njena NEPRIPETA plosca odide; pripeta
      // ostane, dokler je uporabnik ne zapre.
      if (st !== "st-polna") {
        const p = stanje.plosce.get(el._kljucEnote);
        if (p && !p.dataset.pin) zapriPlosco(el._kljucEnote);
      }
    }
  }
}

// ---------- izris ----------
function izrisi() {
  const trak = stanje.host && stanje.host.querySelector(".tl-trak");
  if (!trak) return;
  const sirina = trak.clientWidth || 1;
  const { od, sirina: razpon } = okno();
  const naPiksel = razpon / sirina;
  const enote = gruci(vidni(), naPiksel, od);
  pasovi(enote, 168);

  const zivi = new Set();
  let n = 0;
  for (const e of enote) {
    zivi.add(e.kljuc);
    let el = stanje.enote.get(e.kljuc);
    if (!el) {
      el = e.items.length === 1 ? narediKartico(e.items[0]) : narediGruco(e);
      stanje.enote.set(e.kljuc, el);
      trak.appendChild(el);
      if (!stanje.reduced) {
        // enote pridejo ena za drugo, ne vse naenkrat
        el.animate([{ opacity: 0, scale: "0.8", filter: "blur(7px)" },
                    { opacity: 1, scale: "1", filter: "blur(0)" }],
          { duration: 460, delay: Math.min(n, 10) * 26, fill: "backwards",
            easing: "cubic-bezier(0.16, 1, 0.22, 1)" });
        n++;
      }
    }
    if (e.items.length > 1) napolniGruco(el, e);
    el._x = e.x;
    el._zacetki = e.items.map((i) => i.t0);   // za oznacevanje zadetkov
    el._kljucEnote = e.kljuc;
    el._y = e.pas * VISINA_PASU;
    el._w = el.offsetWidth || 158;
    el.style.translate = Math.round(e.x) + "px " + el._y + "px";
  }
  for (const [k, el] of stanje.enote) {
    if (zivi.has(k)) continue;
    stanje.enote.delete(k);
    zapriPlosco(k);
    el.remove();
  }
  // Ponudba filtrov se rodi sele iz podatkov. Ob mountu je se ni bilo, zato
  // orodja prezidamo, ko se ponudba spremeni -- in samo takrat, sicer bi
  // vsak izris zaprl odprt meni pod prstom.
  if (stanje.izbireSig && stanje.izbireSig !== stanje.orodjaSig) postaviOrodja();

  for (const [k, p] of stanje.plosce) {
    const lastnik = stanje.enote.get(k);
    if (lastnik) postaviPlosco(p, lastnik); else zapriPlosco(k);
  }
  blizina();
  narisiOznako(sirina, naPiksel);
  narisiLestvico(sirina, naPiksel);
  const st = stanje.host.querySelector(".tl-stevec");
  if (st) {
    const skupaj = enote.reduce((a, e) => a + e.items.length, 0);
    st.textContent = skupaj + " dogodkov" +
      (enote.length !== skupaj ? " v " + enote.length + " skupinah" : "") +
      " · " + ZOOM[stanje.zoom].l;
  }
}

function narisiLestvico(sirina, naPiksel) {
  const os = stanje.host.querySelector(".tl-os");
  if (!os) return;
  const { od, do: doo } = okno();
  const korak = ZOOM[stanje.zoom].korak;
  let html = "";
  const prvi = Math.ceil(od / korak) * korak;
  for (let t = prvi; t <= doo; t += korak) {
    const x = (t - od) / naPiksel;
    const dan = new Date(t).getHours() === 0;
    html += '<span class="tl-oznaka' + (dan ? " dan" : "") + '" style="left:' +
      x.toFixed(1) + 'px">' + (dan ? datum(t) : ura(t)) + "</span>";
  }
  // sedanjost je posebna crta: pove, kje se os koncа
  const xz = (Date.now() - od) / naPiksel;
  if (xz > 0 && xz < sirina) {
    html += '<span class="tl-zdaj-crta" style="left:' + xz.toFixed(1) + 'px"></span>';
  }
  os.innerHTML = html;
}

function narisiOznako(sirina, naPiksel) {
  const el = stanje.host.querySelector(".tl-okno");
  if (!el) return;
  if (!stanje.oznaka) { el.hidden = true; return; }
  const { od } = okno();
  const x0 = (stanje.oznaka.t0 - od) / naPiksel;
  const x1 = (stanje.oznaka.t1 - od) / naPiksel;
  if (x1 < -40 || x0 > sirina + 40) { el.hidden = true; return; }
  el.hidden = false;
  el.style.left = x0.toFixed(1) + "px";
  el.style.width = Math.max(2, x1 - x0).toFixed(1) + "px";
}

// ---------- premikanje ----------
function premakni(dt) {
  stanje.sredina = Math.min(Date.now() + URA, stanje.sredina + dt);
  zapriGruco();
  planiraj();
}

// Gladko drsenje s koleščkom.
//
// Kolescek pride v sunkih, zato je vsak sunek prej pomenil svoj skok in os se
// je tresla. Zdaj sunki polnijo CILJ, os pa se mu priblizuje po slicicah.
// Prst pri vlecenju ostane izjema: tam mora os slediti ena proti ena, sicer
// se lepi za kazalcem.
function ciljaj(dt) {
  const zgornja = Date.now() + URA;
  stanje.cilj = Math.min(zgornja, (stanje.cilj == null ? stanje.sredina : stanje.cilj) + dt);
  if (stanje.reduced) { stanje.sredina = stanje.cilj; zapriGruco(); planiraj(true); return; }
  zapriGruco();
  if (!stanje.drsim) drsi();
  clearTimeout(stanje.drsRok);
  // ce slicice ne tecejo (zavihek v ozadju), po 200 ms pristani -- prihod je
  // pogodba, gladkost je lepota
  stanje.drsRok = setTimeout(() => {
    if (stanje.cilj != null) { stanje.sredina = stanje.cilj; planiraj(true); }
  }, 200);
}

function drsi() {
  stanje.drsim = requestAnimationFrame(() => {
    const d = (stanje.cilj == null ? stanje.sredina : stanje.cilj) - stanje.sredina;
    if (Math.abs(d) < okno().sirina * 0.0015) {
      stanje.sredina = stanje.cilj == null ? stanje.sredina : stanje.cilj;
      stanje.drsim = 0;
      clearTimeout(stanje.drsRok);
      planiraj(true);
      return;
    }
    stanje.sredina += d * 0.2;
    planiraj(true);
    drsi();
  });
}

function planiraj(takoj) {
  if (takoj) izrisi();
  else if (!stanje.raf) {
    stanje.raf = requestAnimationFrame(() => { stanje.raf = 0; izrisi(); });
  }
  poskrbiZaDneve(stanje.api).then((novo) => { if (novo) izrisi(); });
}

function vztrajnost() {
  if (Math.abs(stanje.hitrost) < 0.4) { stanje.hitrost = 0; return; }
  premakni(stanje.hitrost);
  stanje.hitrost *= 0.94;
  requestAnimationFrame(vztrajnost);
}

// Polet.
//
// Prva izvedba je vsako slicico premaknila sredino in prerisala os. To pomeni
// filtriranje, grucenje in prekljucevanje kljucev sestdesetkrat na sekundo --
// gruce so razpadale in nastajale sproti, elementi so se rojevali in umirali,
// in videti je bilo natanko tako, kot se je racunalo. Zato os zdaj NARISEMO
// ZE NA CILJU in premaknemo z eno samo animacijo traku: brskalnik pelje
// premik po svoje, brez izrisa vmes.
//
// Ce je cilj dalec vec kot poldrugo okno, pan nima smisla -- pri taki hitrosti
// je vmesna pot samo razmaz. Takrat gre za REZ z zabrisom, kot pri kameri.
function poleti(cilj) {
  const polje = stanje.host.querySelector(".tl-polje");
  const sirina = polje.clientWidth || 1;
  const naPiksel = okno().sirina / sirina;
  const dx = (stanje.sredina - cilj) / naPiksel;
  stanje.sredina = cilj;
  planiraj(true);
  if (stanje.reduced || !dx) return;

  const plasti = [".tl-trak", ".tl-os", ".tl-okno"]
    .map((sel) => stanje.host.querySelector(sel)).filter(Boolean);

  // Vsak polet je isti polet -- kratek skok in skok cez dva dneva se morata
  // koncati z istim obcutkom. Pot omejimo na poldrugo sirino zaslona in v
  // razliki dodamo zabris: dalec kot je bil cilj, bolj je vmesna pot razmazana,
  // gib pa je vedno isti in vedno v pravo smer.
  const najvec = sirina * 1.2;
  const vid = Math.max(-najvec, Math.min(najvec, dx));
  const dalec = Math.min(1, (Math.abs(dx) - Math.abs(vid)) / (sirina * 4));
  plasti.forEach((el) => el.animate([
    { translate: vid.toFixed(1) + "px 0", filter: "blur(" + (dalec * 10).toFixed(1) + "px)",
      opacity: dalec > 0.05 ? 0.35 : 1 },
    { translate: "0px 0", filter: "blur(0px)", opacity: 1 },
  ], { duration: 620, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }));
}


// Skok na okno: dneve naloz ZA CILJ, ne za mesto, kjer si. poskrbiZaDneve()
// bere okno iz stanja, zato smo prej pobrali dneve okoli STARE sredine in os
// je pristala na prazni zemlji, ceprav so dogodki tam bili.
async function naOkno(cilj, zoom) {
  const izvor = stanje.sredina;
  if (zoom != null) { stanje.zoom = zoom; osveziGumbe(); }
  stanje.sredina = cilj;
  const cakaj = poskrbiZaDneve(stanje.api);
  stanje.sredina = izvor;          // polet potrebuje izhodisce, da izracuna pot
  // Ce so dnevi ze v roki, polet ne caka nicesar -- skok med zadetkoma mora
  // biti tako hiter kot "Na zdaj".
  if (!stanje.vNaisi.size) { poleti(cilj); await cakaj; izrisi(); return; }
  await cakaj;
  stanje.sredina = izvor;
  poleti(cilj);
}

// ---------- iskanje (paleta cez OS, ne cez zaslon) ----------
function odpriPaleto() {
  if (document.querySelector(".tl-paleta")) return;
  const karta = stanje.host.querySelector(".tl-karta");
  const p = document.createElement("div");
  p.className = "tl-paleta";
  p.innerHTML =
    '<div class="tl-p-okvir">' +
      '<div class="tl-p-vrh">' +
        '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" ' +
          'stroke="currentColor" stroke-width="1.6"/><path d="M11 11l4 4" stroke="currentColor" ' +
          'stroke-width="1.6" stroke-linecap="round"/></svg>' +
        '<input type="text" autocomplete="off" spellcheck="false" ' +
          'placeholder="Vprašaj os — »je kdo kadil ta teden«, »gibanje včeraj popoldne«">' +
        '<span class="tl-p-nav" hidden>' +
          '<button class="tl-p-pusc" type="button" data-smer="-1" title="Prejšnji (←)">‹</button>' +
          '<span class="muted tl-p-stevec"></span>' +
          '<button class="tl-p-pusc" type="button" data-smer="1" title="Naslednji (→)">›</button>' +
        "</span>" +
        '<span class="tl-p-esc">esc</span>' +
      "</div>" +
      '<div class="tl-p-telo"></div>' +
    "</div>";
  document.body.appendChild(p);
  const r = karta.getBoundingClientRect();
  p.style.setProperty("--tl-vrh", Math.max(12, r.top + 46) + "px");
  const vnos = p.querySelector("input");
  predlogi();
  vnos.focus();
  // Zivo iskanje: odgovor pride med tipkanjem, brez Enterja. Os pa se NE
  // premika ob vsaki crki -- to bi bilo vrtoglavo. Enter (ali klik na zadetek)
  // odpelje; tipkanje samo odgovarja.
  vnos.addEventListener("input", () => {
    clearTimeout(stanje.tipkam);
    const q = vnos.value.trim();
    if (q.length < 3) { predlogi(); return; }
    stanje.tipkam = setTimeout(() => {
      stanje.zadnjeVprasanje = vnos.value;
      poisci(vnos.value, true);
    }, 300);
  });
  vnos.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      clearTimeout(stanje.tipkam);
      // Enter na ZE odgovorjeno vprasanje pelje na naslednji zadetek, ne
      // sprasuje istega znova.
      if ((stanje.zadetki || []).length && vnos.value === stanje.zadnjeVprasanje) {
        naslednjiZadetek(e.shiftKey);
      } else {
        stanje.zadnjeVprasanje = vnos.value;
        poisci(vnos.value);
      }
    } else if (e.key === "ArrowRight" && (stanje.zadetki || []).length > 1
               && e.target.selectionStart === e.target.value.length) {
      e.preventDefault(); naslednjiZadetek();
    } else if (e.key === "ArrowLeft" && (stanje.zadetki || []).length > 1
               && e.target.selectionStart === 0) {
      e.preventDefault(); naslednjiZadetek(true);
    } else if (e.key === "Escape") { e.preventDefault(); zapriPaleto(); }
  });
  p.querySelector(".tl-p-esc").addEventListener("click", () => zapriPaleto());
  p.querySelectorAll(".tl-p-pusc").forEach((b) =>
    b.addEventListener("click", () => naslednjiZadetek(b.dataset.smer === "-1")));
  p.addEventListener("pointerdown", (e) => { if (e.target === p) zapriPaleto(); });
  if (!stanje.reduced) {
    p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
    p.querySelector(".tl-p-okvir").animate(
      [{ opacity: 0, transform: "translateY(-10px) scale(0.97)", filter: "blur(8px)" },
       { opacity: 1, transform: "none", filter: "blur(0)" }],
      { duration: 340, easing: "cubic-bezier(0.16, 1, 0.22, 1)" });
  }
}


// Predlogi so vedno vidni: prazno polje brez namiga je zid, ne vabilo.
const PREDLOGI = [
  "kajenje julij",
  "gibanje včeraj popoldne",
  "kdaj je bil zrak najslabši ta teden",
  "vsi alarmi ta mesec",
  "temperatura nad 27",
];

function predlogi() {
  const p = document.querySelector(".tl-paleta");
  if (!p) return;
  const telo = p.querySelector(".tl-p-telo");
  telo.innerHTML =
    '<div class="tl-p-namig">Odgovor se zgodi na osi: obdobje se označi, ' +
      "Enter te odpelje na dogodek.</div>" +
    '<div class="tl-p-nasl">' + PREDLOGI.map((q) =>
      '<button class="tl-cip" type="button" data-q="' + esc(q) + '">' +
      esc(q) + "</button>").join("") + "</div>";
  vezijCipe(telo, p);
}

function vezijCipe(kje, p) {
  kje.querySelectorAll(".tl-cip").forEach((b) =>
    b.addEventListener("click", () => {
      const vnos = p.querySelector("input");
      vnos.value = b.dataset.q;
      stanje.zadnjeVprasanje = b.dataset.q;
      poisci(b.dataset.q);
      vnos.focus();
    }));
}

// Zapiranje iskanja NE vraca pogleda. Prej je Esc os vrgel nazaj na mesto
// pred vprasanjem -- ampak ce si prisel do zadetka, si tja hotel priti in
// zapiranje okna ni prosnja, da to razveljavimo.
function zapriPaleto() {
  const p = document.querySelector(".tl-paleta");
  if (!p) return;
  p.remove();
  stanje.predIskanjem = null;
}

function zoomZaOkno(ms) {
  for (let i = 0; i < ZOOM.length; i++) if (ZOOM[i].ms >= ms * 1.5) return i;
  return ZOOM.length - 1;
}

async function poisci(q, zivo) {
  const p = document.querySelector(".tl-paleta");
  if (!p || !q.trim()) return;
  const telo = p.querySelector(".tl-p-telo");
  if (!stanje.predIskanjem) {
    stanje.predIskanjem = { sredina: stanje.sredina, zoom: stanje.zoom };
  }
  telo.innerHTML = '<div class="tl-p-namig">Sprašujem…</div>';
  for (const [, el] of stanje.enote) el.classList.remove("zadetek");
  let d;
  try {
    d = await stanje.api("/api/v2/search?q=" + encodeURIComponent(q) + "&limit=8");
  } catch {
    telo.innerHTML = '<div class="tl-p-namig">Iskalnik ni odgovoril.</div>';
    return;
  }
  const a = d.answer || {};
  const r = (a.plan && a.plan.range) || d.range || null;
  const t0 = r && Date.parse(r.start), t1 = r && Date.parse(r.end);

  // Odgovor je ze izracunan -- izpisemo ga TAKOJ; nalaganje dni za novo okno
  // tece za tem, sicer bi uporabnik gledal prazno plosco skoraj sekundo.
  const glava = a.headline || (d.results && d.results[0] && d.results[0].title) ||
    "Na to iskalnik nima odgovora.";
  const ver = a.verdict === "yes" ? "da" : a.verdict === "no" ? "ne" : "";
  const nasl = (a.suggested_followups || []).slice(0, 3);
  // VSI zadetki, ne samo zadnji. Iskalnik jih vrne v events[], glava pa
  // imenuje enega -- ce jih je pet, mora uporabnik videti pet vrstic.
  const vsi = (a.events || []).map((e) => ({
    t0: Date.parse(e.started_at), t1: Date.parse(e.ended_at || e.started_at),
    label: imeZaznave(e.kind || e.label), dokazi: e.evidence || [],
    resnost: e.severity || "",
  })).filter((e) => e.t0).sort((x, y) => y.t0 - x.t0);   // najnovejsi prvi

  const seznam = vsi.length > 1 || (vsi.length === 1 && (a.total_events || 0) > 1)
    ? '<div class="tl-p-seznam">' + vsi.map((e, n) =>
        '<button class="tl-p-vr" type="button" data-n="' + n + '">' +
          '<span class="tl-pika ' + (e.resnost === "alarm" ? "alert" : "") + '"></span>' +
          '<span class="tl-p-dan">' + esc(datum(e.t0)) + "</span>" +
          '<span class="tl-p-ura">' + esc(ura(e.t0)) + "</span>" +
          '<span class="tl-p-kaj">' + esc(e.label || "") + "</span>" +
        "</button>").join("") + "</div>"
    : "";

  telo.innerHTML =
    '<div class="tl-p-odg' + (ver ? " v-" + ver : "") + '">' +
      '<span class="tl-p-glava">' + esc(glava) + "</span>" +
      (a.detail ? '<span class="tl-p-vec">' + esc(a.detail) + "</span>" : "") +
      (r ? '<span class="tl-p-okno">' + esc(r.label || "") +
           (vsi.length ? " · " + zadetkov(vsi.length) : "") +
           "</span>" : "") +
      (!seznam && vsi.length === 1 && vsi[0].dokazi.length
        ? '<span class="tl-p-dokazi">' + vsi[0].dokazi.slice(0, 3)
            .map((x) => "<i>" + esc(x) + "</i>").join("") + "</span>" : "") +
    "</div>" +
    seznam +
    (nasl.length ? '<div class="tl-p-nasl">' + nasl.map((f) =>
      '<button class="tl-cip" type="button" data-q="' + esc(f.query) + '">' +
      esc(f.label) + "</button>").join("") + "</div>" : "");

  const nav = p.querySelector(".tl-p-nav");
  if (nav) {
    nav.hidden = vsi.length < 2;
    const st = nav.querySelector(".tl-p-stevec");
    if (st) st.textContent = zadetkov(vsi.length);
  }
  telo.querySelectorAll(".tl-p-vr").forEach((b) =>
    b.addEventListener("click", () => {
      stanje.naZadetku = Number(b.dataset.n) - 1;
      naslednjiZadetek();
    }));
  vezijCipe(telo, p);
  if (!stanje.reduced) {
    telo.animate([{ opacity: 0, transform: "translateY(6px)", filter: "blur(6px)" },
                  { opacity: 1, transform: "none", filter: "blur(0)" }],
      { duration: 300, easing: "cubic-bezier(0.16, 1, 0.22, 1)" });
  }

  // Zadetki so trenutki, ne obdobje. Ce jih iskalnik nasteje, Enter pelje NA
  // DOGODEK -- odgovor »29. 7. ob 15:00 je nekdo kadil« brez tega pove, kje
  // je, in te tja vseeno ne odpelje.
  stanje.zadetki = vsi;
  stanje.naZadetku = -1;

  // Med tipkanjem os MIRUJE: premikati jo ob vsaki crki bi bilo vrtoglavo.
  // Odgovor in seznam zadetkov sta tu, Enter ali klik na vrstico odpelje.
  if (zivo) {
    if (t0 && t1 && t1 > t0) { stanje.oznaka = { t0, t1, label: r.label || "" }; planiraj(true); }
    return;
  }
  if (stanje.zadetki.length) { naslednjiZadetek(); return; }
  if (t0 && t1 && t1 > t0) {
    stanje.oznaka = { t0, t1, label: r.label || "" };
    naOkno((t0 + t1) / 2, zoomZaOkno(t1 - t0));
  }
}

// Enter pelje na naslednji zadetek in se vrti v krogu.
function naslednjiZadetek(nazaj) {
  const z = stanje.zadetki || [];
  if (!z.length) return;
  const n = z.length;
  stanje.naZadetku = ((stanje.naZadetku + (nazaj ? -1 : 1)) % n + n) % n;
  const e = z[stanje.naZadetku];
  const trajanje = Math.max(e.t1 - e.t0, 60e3);
  stanje.oznaka = { t0: e.t0 - trajanje, t1: e.t1 + trajanje, label: e.label || "" };
  naOkno((e.t0 + e.t1) / 2, 0).then(() => oznaciZadetek(e));
  const p = document.querySelector(".tl-paleta");
  if (p) {
    const nav = p.querySelector(".tl-p-nav");
    if (nav) nav.hidden = n < 2;
    const st = p.querySelector(".tl-p-stevec");
    if (st) st.textContent = (stanje.naZadetku + 1) + " / " + n;
    p.querySelectorAll(".tl-p-vr").forEach((b, i) =>
      b.classList.toggle("na-vrsti", i === stanje.naZadetku));
  }
}

// Kartica ob tem trenutku zasveti. Zaznava (kajenje) in incident nista ista
// vrstica v bazi, zato jo iscemo po casu, ne po kljucu.
function oznaciZadetek(e) {
  for (const [, el] of stanje.enote) el.classList.remove("zadetek");
  for (const [, el] of stanje.enote) {
    // Zadetek je lahko SREDI gruce, ne na njenem zacetku -- primerjamo z
    // zacetki vseh dogodkov v enoti, sicer ga gruca pogoltne.
    const zac = el._zacetki || [];
    if (zac.some((t) => Math.abs(t - e.t0) <= 150e3)) {
      el.classList.add("zadetek");
      voda(el);
    }
  }
}

// ---------- orodna vrstica ----------
function osveziGumbe() {
  const h = stanje.host;
  if (!h) return;
  const z = h.querySelector("#tlZoom .dd-btn span");
  if (z) z.textContent = ZOOM[stanje.zoom].l;
}

function postaviOrodja() {
  const h = stanje.host;
  const { dd, setupDD } = stanje.ui;
  const orodja = h.querySelector(".tl-gumbi");
  if (!orodja) return;
  stanje.orodjaSig = stanje.izbireSig || "";
  // Napravo ponudimo SELE, ko jih je vec: en gumb, ki ne more nicesar
  // spremeniti, je samo hrup.
  const vecNaprav = stanje.naprave.length > 1;
  orodja.innerHTML =
    '<button class="btn tl-isci-gumb" type="button" title="Vprašaj os (/)">' +
      '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" ' +
        'stroke="currentColor" stroke-width="1.7"/><path d="M11 11l4 4" stroke="currentColor" ' +
        'stroke-width="1.7" stroke-linecap="round"/></svg>Išči</button>' +
    '<button class="btn tl-nazaj" type="button" title="Nazaj">‹</button>' +
    '<button class="btn tl-zdaj" type="button">Na zdaj</button>' +
    '<button class="btn tl-naprej" type="button" title="Naprej">›</button>' +
    (vecNaprav ? dd("tlDev") : "") + dd("tlBase") + dd("tlTier") + dd("tlZoom");

  if (vecNaprav) {
    setupDD("tlDev", [{ v: "", l: "Vse naprave" }, ...stanje.naprave], stanje.filter.dev,
      (v) => { stanje.filter.dev = v; planiraj(true); });
  }
  setupDD("tlBase", stanje.baze || [{ v: "", l: "Vse meritve" }], stanje.filter.base,
    (v) => { stanje.filter.base = v; zapriGruco(); planiraj(true); });
  setupDD("tlTier", TIERI, stanje.filter.tier,
    (v) => { stanje.filter.tier = v; zapriGruco(); planiraj(true); });
  setupDD("tlZoom", ZOOM.map((z, i) => ({ v: String(i), l: z.l })), String(stanje.zoom),
    (v) => { stanje.zoom = Number(v); zapriGruco(); planiraj(true); });

  h.querySelector(".tl-isci-gumb").addEventListener("click", odpriPaleto);
  // Puscici uporabita ISTI polet kot "Na zdaj" -- korak po osi mora biti gib,
  // ne preskok.
  h.querySelector(".tl-nazaj").addEventListener("click",
    () => { stanje.cilj = null; naOkno(stanje.sredina - okno().sirina * 0.6); });
  h.querySelector(".tl-naprej").addEventListener("click",
    () => { stanje.cilj = null; naOkno(stanje.sredina + okno().sirina * 0.6); });
  h.querySelector(".tl-zdaj").addEventListener("click", () => {
    stanje.cilj = null;
    naOkno(Date.now() - ZOOM[stanje.zoom].ms / 4);
  });
}

export function casovnicaMount(host, opts = {}) {
  stanje.host = host;
  stanje.api = opts.api;
  stanje.ui = { dd: opts.dd, setupDD: opts.setupDD };
  stanje.reduced = !!opts.reduced;
  stanje.sredina = opts.sredina || Date.now() - ZOOM[stanje.zoom].ms / 4;
  stanje.enote.clear();
  stanje.oznaka = null;
  stanje.predIskanjem = null;

  host.innerHTML =
    '<div class="card tl-karta">' +
      '<div class="tl-glava">' +
        "<h3>Časovna os</h3>" +
        '<span class="muted tl-stevec"></span>' +
        '<div class="tl-gumbi"></div>' +
      "</div>" +
      '<div class="tl-polje">' +
        '<div class="tl-okno" hidden></div>' +
        '<div class="tl-trak"></div>' +
        '<div class="tl-crta"></div>' +
        '<div class="tl-os"></div>' +
      "</div>" +
      '<div class="muted tl-namig">Vleci ali zavrti kolešček za potovanje po času · ' +
        "bližje kot si, več kartica pove · <kbd>/</kbd> vprašaj os</div>" +
    "</div>";

  postaviOrodja();

  const polje = host.querySelector(".tl-polje");
  const trak = host.querySelector(".tl-trak");

  polje.addEventListener("wheel", (e) => {
    // Plosca gruce ima svoj drsnik. Ce kolescek zavrtis nad njo, pripada NJEJ
    // -- prej je os pozrla vsak kolescek in seznam desetih dogodkov se ni dal
    // prevrteti.
    const sez = e.target.closest && e.target.closest(".tl-g-seznam");
    if (sez && sez.scrollHeight > sez.clientHeight + 1) {
      const dol = e.deltaY > 0;
      const naRobu = dol
        ? sez.scrollTop + sez.clientHeight >= sez.scrollHeight - 1
        : sez.scrollTop <= 0;
      if (!naRobu) return;              // seznam se lahko premakne -- pusti mu
    }
    e.preventDefault();
    ciljaj((e.deltaX || e.deltaY) * (okno().sirina / (polje.clientWidth || 1)));
  }, { passive: false });

  polje.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".tl-k, .tl-g, .tl-g-plosca")) return;
    stanje.vlecem = { zadnji: e.clientX };
    stanje.hitrost = 0;
    polje.setPointerCapture(e.pointerId);
    polje.classList.add("vlecem");
  });
  polje.addEventListener("pointermove", (e) => {
    const r = trak.getBoundingClientRect();
    stanje.mis = { x: e.clientX - r.left, y: e.clientY - r.top };
    // pointermove brskalnik ze zdruzuje na slicice; dodaten rAF ne bi
    // prihranil nicesar, v zavihku v ozadju pa se sploh ne izvede
    blizina();
    if (!stanje.vlecem) return;
    const naPiksel = okno().sirina / (polje.clientWidth || 1);
    const d = e.clientX - stanje.vlecem.zadnji;
    stanje.vlecem.zadnji = e.clientX;
    stanje.hitrost = -d * naPiksel * 0.9;
    stanje.cilj = null;                     // prst vodi, drsenje ne
    premakni(-d * naPiksel);
  });
  const konec = () => {
    if (!stanje.vlecem) return;
    stanje.vlecem = null;
    polje.classList.remove("vlecem");
    vztrajnost();
  };
  polje.addEventListener("pointerup", konec);
  polje.addEventListener("pointercancel", konec);
  polje.addEventListener("pointerleave", () => { stanje.mis = null; blizina(); });

  const karta = host.querySelector(".tl-karta");
  karta.addEventListener("pointerenter", () => { document.body.dataset.tlNad = "1"; });
  karta.addEventListener("pointerleave", () => { delete document.body.dataset.tlNad; });

  const odpri = () => odpriPaleto();
  document.addEventListener("tl:iskanje", odpri);
  stanje.odjava = () => document.removeEventListener("tl:iskanje", odpri);

  const ro = new ResizeObserver(() => planiraj());
  ro.observe(polje);

  planiraj(true);
  // ko pridejo prvi dnevi, filtri dobijo pravo ponudbo
  poskrbiZaDneve(stanje.api).then(() => { postaviOrodja(); izrisi(); });

  return () => {
    ro.disconnect();
    cancelAnimationFrame(stanje.raf);
    cancelAnimationFrame(stanje.let);
    cancelAnimationFrame(stanje.drsim);
    clearTimeout(stanje.letRok);
    clearTimeout(stanje.drsRok);
    stanje.cilj = null;
    stanje.raf = 0;
    stanje.enote.clear();
    stanje.oznaka = null;
    stanje.predIskanjem = null;
    zapriGruco(true);
    zapriPaleto();
    delete document.body.dataset.tlNad;
    if (stanje.odjava) { stanje.odjava(); stanje.odjava = null; }
  };
}
