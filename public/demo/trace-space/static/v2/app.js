// HALO Dashboard v3 — role-based SPA, brez zunanjih odvisnosti.
// Bere izključno /api/v2/* (Scope iz seje) + /api/auth/*.

// ---------- helpers ----------
// Isti ?v= kot ga je dobil app.js -- brez tega bi brskalnik lenil s
// predpomnjenim vizitka.js, ceprav smo povisali razlicico.
const ASSET_V = new URL(import.meta.url).search || "";
// razlicica vmesnika je ista kot cache-bust; zapisemo jo na <html>, da jo
// vidi tudi vizitka (in da je v razvijalskih orodjih takoj vidno, kaj tece)
document.documentElement.dataset.ver = ASSET_V.replace(/^\?v=/, "") || "v2";
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

async function apiGet(path) {
  const r = await fetch(path, { credentials: "same-origin" });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error || r.status), { status: r.status, data: d });
  return d;
}
async function apiSend(method, path, body) {
  const r = await fetch(path, {
    method, credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error || r.status), { status: r.status, data: d });
  return d;
}

const num = (v, dp = 1) =>
  v === null || v === undefined || v === "" || Number.isNaN(Number(v))
    ? "—"
    : Number(v).toLocaleString("sl", { maximumFractionDigits: dp });

function timeAgo(iso) {
  if (!iso) return "—";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `pred ${Math.round(s)} s`;
  if (s < 3600) return `pred ${Math.round(s / 60)} min`;
  if (s < 86400) return `pred ${Math.round(s / 3600)} h`;
  return `pred ${Math.round(s / 86400)} dni`;
}
const clock = (iso) => (iso ? new Date(iso).toLocaleTimeString("sl", { hour: "2-digit", minute: "2-digit" }) : "—");
const clockSec = (iso) => (iso ? new Date(iso).toLocaleTimeString("sl",
  { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "\u2014");
const dateTime = (iso) => (iso ? new Date(iso).toLocaleString("sl", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—");

const ICON = {
  search: '<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16.6 16.6L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  info: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 11v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="7.8" r="1.05" fill="currentColor"/>',
  bell: '<path d="M12 4.2c-4.2 0-7.6 2.8-7.6 6.3 0 1.9 1 3.6 2.6 4.7l-.7 3.2 3.3-1.7c.7.2 1.5.3 2.4.3 4.2 0 7.6-2.8 7.6-6.5S16.2 4.2 12 4.2z" fill="currentColor"/>',
  status: '<path d="M3 12l2-2 3 5 4-9 3 6 2-3h2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  events: '<rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 9h8M8 13h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  trends: '<path d="M4 15l4-4 3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 7h3v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  reports: '<path d="M6 3h9l4 4v14H6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 12h7M9 16h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  fleet: '<circle cx="7" cy="7" r="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="17" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 7h7v7" fill="none" stroke="currentColor" stroke-width="2"/>',
  diag: '<circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  settings: '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  logout: '<path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2M17 12H9M17 12l-3-3M17 12l-3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  audit: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
};
const icon = (n) => `<svg viewBox="0 0 24 24">${ICON[n] || ""}</svg>`;

const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Hover mikrointerakcije: ob prehodu na interaktiven element nežen squish +
// zelo subtilen ripple (enkrat na vstop, ne ob vsakem premiku miške).
if (!REDUCED) {
  const HOVER_SEL = ".nav-item, .btn, .dd-btn, .chip, .dd-opt, .icon-btn, .ai-hl.go, .viz-btn, .viz-link, .viz-close, #svgEdge";
  let lastHover = null;
  document.addEventListener("mouseover", (e) => {
    const t = e.target.closest ? e.target.closest(HOVER_SEL) : null;
    if (t === lastHover) return;
    lastHover = t;
    if (!t) return;
    t.classList.remove("hv-squish"); void t.offsetWidth; t.classList.add("hv-squish");
    const r = t.getBoundingClientRect();
    const d = Math.min(Math.max(r.width, r.height) * 1.05, 260); // kapa za velike cone (npr. #svgEdge)
    const sp = document.createElement("span");
    sp.className = "ripple";
    sp.style.width = sp.style.height = d + "px";
    sp.style.left = (e.clientX - r.left - d / 2) + "px";
    sp.style.top = (e.clientY - r.top - d / 2) + "px";
    t.appendChild(sp);
    sp.addEventListener("animationend", () => sp.remove());
  });
}

// Ko se stevilka zamenja, nova pride iz zamegljenosti -- oko takoj vidi,
// KATERA vrednost se je premaknila, brez da bi kaj poskocilo.
function blurIn(el) {
  if (!el || REDUCED || PREFS.motion === "off") return;
  el.animate(
    [{ filter: "blur(7px)", opacity: 0.12, transform: "translateY(-3px)" },
     { filter: "blur(0px)", opacity: 1, transform: "none" }],
    { duration: 380, easing: "cubic-bezier(0.16, 1, 0.22, 1)" });
}
// Stisk (squish) ploscice pove, da je vrednost stopila v opozorilo ali alarm.
function squish(el) {
  if (!el || REDUCED || PREFS.motion === "off") return;
  el.animate(
    [{ transform: "scale(1, 1)" },
     { transform: "scale(0.962, 1.070)", offset: 0.26 },
     { transform: "scale(1.018, 0.976)", offset: 0.54 },
     { transform: "scale(0.996, 1.006)", offset: 0.79 },
     { transform: "none" }],
    { duration: 620, easing: "cubic-bezier(0.16, 1, 0.22, 1)" });
}

// Kartica se ob VSTOPU miske enkrat rahlo stisne in umiri. Squish, ne dvig:
// dvig premakne celo postavitev in je videti cenen, stisk pa deluje kot da
// ima predmet maso. Vrednosti so komaj zaznavne (do 0,75 %), ker gre za velike
// ploskve -- pri karticah je ze en odstotek prevec.
const CARD_HOVER_SCALE = 0.988;
// Velikost drzi ANIMACIJA (fill: forwards), ne :hover v CSS. Prej sta se
// borila: ob odhodu miske smo animacijo prekinili, kar element trenutno vrze
// na izhodiscno velikost -- prehod v CSS se ne sprozi, ker ni spremembe
// sloga, in videti je bilo kot preskok.
function cardSquish(el) {
  if (!el || REDUCED || PREFS.motion === "off") return;
  // Zacnemo tam, kjer element TRENUTNO je -- ce mis hitro vstopi in izstopi,
  // bi zacetek pri 100 % pomenil preskok sredi vracanja.
  const cur = getComputedStyle(el).transform;
  if (el._sqOut) { try { el._sqOut.cancel(); } catch {} el._sqOut = null; }
  if (el._sq) { try { el._sq.cancel(); } catch {} }
  // ENA deformacija, ki se umiri: stisk gre v eno smer in se od tam sprosti
  el._sq = el.animate([
    { transform: cur && cur !== "none" ? cur : "scale(1, 1)",
      easing: "cubic-bezier(0.40, 0, 0.55, 1)" },
    { transform: "scale(0.976, 1.017)", offset: 0.38,
      easing: "cubic-bezier(0.20, 0.85, 0.30, 1)" },
    { transform: `scale(${CARD_HOVER_SCALE}, ${CARD_HOVER_SCALE})` },
  ], { duration: 880, fill: "forwards" });
}
// Vrnitev je SVOJA animacija iz trenutne velikosti nazaj -- zato je gladka
// tudi, ce mis odide sredi stiska.
function cardRelease(el) {
  if (!el || (!el._sq && !el._sqOut)) return;
  const cur = getComputedStyle(el).transform;
  if (el._sq) { try { el._sq.cancel(); } catch {} el._sq = null; }
  if (el._sqOut) { try { el._sqOut.cancel(); } catch {} el._sqOut = null; }
  if (REDUCED || PREFS.motion === "off") return;
  el._sqOut = el.animate(
    [{ transform: cur && cur !== "none" ? cur : "scale(1, 1)" }, { transform: "none" }],
    { duration: 520, easing: "cubic-bezier(0.25, 0.8, 0.30, 1)", fill: "forwards" });
  el._sqOut.onfinish = () => {
    try { el._sqOut.cancel(); } catch {}
    el._sqOut = null;
  };
}
document.addEventListener("mouseover", (e) => {
  const t = e.target;
  const c = t && t.nodeType === 1 ? t.closest(".card") : null;
  if (!c) return;
  // samo ob vstopu na kartico, ne ob vsakem prehodu med njenimi otroki
  if (e.relatedTarget && c.contains(e.relatedTarget)) return;
  cardSquish(c);
});
document.addEventListener("mouseout", (e) => {
  const t = e.target;
  const c = t && t.nodeType === 1 ? t.closest(".card") : null;
  if (!c || (e.relatedTarget && c.contains(e.relatedTarget))) return;
  cardRelease(c);
});

function pop(el) { if (!el || REDUCED) return; el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }

// Svetloba pod kazalcem: mehka luc potuje z misko, rob elementa pod njo pa
// zasveti tam, kjer je kazalec. Vse tece v ISTEM pointermove kot parallax in
// je omejeno na eno sliko -- dodaten poslusalec bi bil cista poraba.
// .ai-sum je izvzet: kartica povzetka ima svoj, bogatejsi odziv na misko,
// .lit::after pa bi ji prepisal plast mehurjev (oba uporabljata ::after).
const LIT_SEL = ".card:not(.ai-sum), .mini, .stat, .btn, .dd-btn, .nav-item, .chip, " +
  ".icon-btn, .notif-item, .health-banner";
let _lit = null;
function cursorLight(x, y, target) {
  const g = document.getElementById("cursorGlow");
  if (g) g.style.transform = "translate3d(" + Math.round(x - 260) + "px," +
    Math.round(y - 260) + "px, 0)";
  const el = target && target.nodeType === 1 ? target.closest(LIT_SEL) : null;
  if (el !== _lit) {
    if (_lit) _lit.classList.remove("lit");
    _lit = el;
    if (el) el.classList.add("lit");
  }
  if (el) {
    const b = el.getBoundingClientRect();
    el.style.setProperty("--mx", Math.round(x - b.left) + "px");
    el.style.setProperty("--my", Math.round(y - b.top) + "px");
  }
}
// Preliv na kartici povzetka: mehurji se odzovejo na MISKO, ne vrtijo se.
// Med premikanjem nabreknejo in barva se poglobi, ko se ustavis, splahne, ob
// odhodu pa se vse vrne v izhodisce. Vse prehode zgladi CSS (900 ms), zato
// tu samo nastavljamo ciljne vrednosti -- brez zanke po slikah.
let _aiIdle = 0;
const aiSet = (card, x, y, sc, glow, sqx, sqy, spread) => {
  card.style.setProperty("--ai-spread", spread || "0px");
  card.style.setProperty("--ai-x", x);
  card.style.setProperty("--ai-y", y);
  card.style.setProperty("--ai-sc", sc);
  card.style.setProperty("--ai-glow", glow);
  card.style.setProperty("--ai-sqx", sqx || "1");
  card.style.setProperty("--ai-sqy", sqy || "1");
};
document.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse" || REDUCED || PREFS.motion === "off") return;
  const t = e.target;
  const card = t && t.nodeType === 1 ? t.closest(".ai-sum") : null;
  if (!card) return;
  const b = card.getBoundingClientRect();
  const nx = Math.max(-1, Math.min(1, (e.clientX - (b.left + b.width / 2)) / (b.width / 2)));
  const ny = Math.max(-1, Math.min(1, (e.clientY - (b.top + b.height / 2)) / (b.height / 2)));
  // blizje robu = mocnejsi stisk (mehur se ob steno splosci, ne ubezi ven)
  const rob = Math.max(Math.abs(nx), Math.abs(ny));
  const sqx = (1 - 0.07 * rob).toFixed(3), sqy = (1 + 0.06 * rob).toFixed(3);
  const X = (nx * 10).toFixed(1) + "px", Y = (ny * 7).toFixed(1) + "px";
  aiSet(card, X, Y, "1", "1", "1", "1", "16px");
  clearTimeout(_aiIdle);
  _aiIdle = setTimeout(() =>                      // miruje: barva rahlo splahne
    aiSet(card, X, Y, "1", "0.4", "1", "1", "8px"), 320);
}, { passive: true });
document.addEventListener("pointerout", (e) => {
  const t = e.target;
  const card = t && t.nodeType === 1 ? t.closest(".ai-sum") : null;
  if (!card) return;
  if (e.relatedTarget && card.contains(e.relatedTarget)) return;   // se vedno znotraj
  clearTimeout(_aiIdle);
  aiSet(card, "0px", "0px", "1", "0", "1", "1", "0px");
}, { passive: true });

function dropLight() {
  if (_lit) { _lit.classList.remove("lit"); _lit = null; }
}
document.addEventListener("pointerleave", () => { dropLight(); dustStop(); });
document.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") dropLight(); });

// Parallax sence: senca kartic se rahlo premakne stran od kazalca (globina).
let _plxRaf = 0, _lightAt = 0;
document.addEventListener("pointermove", (e) => {
  if (REDUCED || PREFS.motion === "off") return;
  if (e.pointerType !== "mouse") return;      // na dotik svetloba nima smisla
  // Svetloba je poceni (en rect + tri lastnosti), zato tece takoj in je
  // omejena le s casom; ne visi na animacijski sliki, da ne obtici, kadar
  // brskalnik slik ne rise (npr. zavihek v ozadju).
  const t = performance.now();
  if (PREFS.cursorLight !== "off" && t - _lightAt > 16) {
    _lightAt = t;
    cursorLight(e.clientX, e.clientY, e.target);
  }
  // prah samo nad tem, kar je mogoce pritisniti -- tu si zapomnimo le, KJE je
  // kazalec; oddajanje tece samo od sebe (glej dustStart)
  const nadCim = e.target && e.target.nodeType === 1 ? e.target.closest(PRAH_SEL) : null;
  if (nadCim) { _dustAt = { x: e.clientX, y: e.clientY }; dustStart(); }
  else dustStop();
  if (_plxRaf) return;
  _plxRaf = requestAnimationFrame(() => {
    _plxRaf = 0;
    document.querySelectorAll(".card").forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.bottom < -40 || b.top > innerHeight + 40) return;
      const dx = (e.clientX - (b.left + b.width / 2)) / Math.max(1, innerWidth);
      const dy = (e.clientY - (b.top + b.height / 2)) / Math.max(1, innerHeight);
      el.style.setProperty("--shx", (-dx * 16).toFixed(1) + "px");
      el.style.setProperty("--shy", (-dy * 12 + 5).toFixed(1) + "px");
    });
  });
}, { passive: true });


// ---------- Preklop pogleda z drsenjem ----------
// Drsenje preklopi pogled SAMO, kadar drsenja nihče drug ne potrebuje:
// stran je na robu (ali sploh ni daljša od zaslona), kazalec ni nad grafom
// (tam je kolešček zoom), nad odprtim menijem, modalom ali katerokoli
// površino, ki se še lahko premakne v tisto smer.
// .tl-polje je casovna os: tam kolescek potuje po casu, ne med pogledi
const SCROLL_NAV_GUARD = "svg.linechart, .dd-menu, .dd, #svgDock, .modal-back, .tl-polje, input, textarea, select";
let _navAccum = 0, _navLast = 0;

function innerCanScroll(el, dy) {
  let n = el;
  while (n && n !== document.body && n !== document.documentElement) {
    if (n.nodeType === 1 && n.scrollHeight > n.clientHeight + 1) {
      const oy = getComputedStyle(n).overflowY;
      if (oy === "auto" || oy === "scroll") {
        if (dy > 0 && n.scrollTop + n.clientHeight < n.scrollHeight - 1) return true;
        if (dy < 0 && n.scrollTop > 1) return true;
      }
    }
    n = n.parentElement;
  }
  return false;
}

window.addEventListener("wheel", (e) => {
  if (PREFS.scrollNav === "off") return;
  if (!document.querySelector(".shell")) return;          // login zaslon
  if (document.querySelector(".modal-back")) return;      // odprt modal bere uporabnik
  const t = e.target;
  if (t && t.closest && t.closest(SCROLL_NAV_GUARD)) return;
  const dy = e.deltaY;
  if (!dy) return;
  if (innerCanScroll(t, dy)) return;                      // notranja površina ima prednost

  const doc = document.scrollingElement || document.documentElement;
  const atBottom = doc.scrollTop + doc.clientHeight >= doc.scrollHeight - 2;
  const atTop = doc.scrollTop <= 1;
  if (dy > 0 && !atBottom) return;                        // stran se še lahko premakne
  if (dy < 0 && !atTop) return;

  const now = performance.now();
  if (now - _navLast < 900) { e.preventDefault(); return; }   // med prehodom miruj
  if (Math.sign(dy) !== Math.sign(_navAccum)) _navAccum = 0;
  _navAccum += dy;
  if (Math.abs(_navAccum) < 140) return;                  // zahtevaj namen, ne odrgnjenja

  const list = navList();
  const idx = list.findIndex((n) => n[0] === S.view);
  const next = idx + (dy > 0 ? 1 : -1);
  if (idx < 0 || next < 0 || next >= list.length) { _navAccum = 0; return; }
  e.preventDefault();
  _navAccum = 0; _navLast = now;
  location.hash = "#/" + list[next][0];
}, { passive: false });

// ---------- Toast obvestila ----------
function toastHost() {
  let h = document.getElementById("toasts");
  if (!h) { h = document.createElement("div"); h.id = "toasts"; document.body.appendChild(h); }
  return h;
}
function toast(kind, title, text, onClick) {
  const t = document.createElement("div");
  t.className = "toast " + kind;
  t.innerHTML = `<span class="tdot"></span><div><b>${esc(title)}</b><span>${esc(text || "")}</span></div>`;
  toastHost().appendChild(t);
  const kill = () => { t.classList.add("out"); setTimeout(() => t.remove(), 360); };
  t.addEventListener("click", () => { kill(); if (onClick) onClick(); });
  setTimeout(kill, 9000);
  if (PREFS.alerts === "sound") beep(kind === "alarm");
}
// kratek dvojni ton prek WebAudio (brez zunanje datoteke)
function beep(urgent) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const play = (freq, at, dur) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      g.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + at); o.stop(ctx.currentTime + at + dur + 0.02);
    };
    play(880, 0, 0.18);
    if (urgent) play(1180, 0.22, 0.2);
    setTimeout(() => ctx.close(), 1200);
  } catch { /* zvok ni na voljo */ }
}

// Odpiranje in zapiranje okna. Kljucne odlocitve:
//  - okno pride IZ ZAMEGLJENOSTI in gre ob zapiranju NAZAJ vanjo; prej se ob
//    zapiranju ni zgodilo nic (back.remove() takoj), zato je bilo sunkovito
//  - blur tece na oknu, dokler je se prazno; tezka vsebina se vanj naloadi
//    sele potem, sicer brskalnik zamegljuje velik, ravnokar sestavljen DOM
//    in animacija se zatika
//  - ozadje ima svoj, daljsi prehod, da se scena umiri postopoma
const MODAL_IN = 560, MODAL_OUT = 300;

function openModal(inner, origin) {
  const back = document.createElement("div");
  back.className = "modal-back";
  back.innerHTML = `<div class="modal">${inner}</div>`;
  document.body.appendChild(back);
  const m = back.querySelector(".modal");
  const zivo = !REDUCED && PREFS.motion !== "off";

  if (zivo) {
    m.style.willChange = "transform, filter, opacity";
    void back.offsetWidth;                     // vsili preracun pred prehodom
    back.classList.add("open");
    let od = { transform: "scale(0.94) translateY(14px)" };
    // ce vemo, KAJ je bilo kliknjeno, okno zraste iz njega
    if (origin && origin.getBoundingClientRect) {
      const o = origin.getBoundingClientRect(), r = m.getBoundingClientRect();
      if (o.width && r.width) {
        const sx = Math.max(0.25, o.width / r.width);
        const sy = Math.max(0.08, o.height / r.height);
        const dx = (o.left + o.width / 2) - (r.left + r.width / 2);
        const dy = (o.top + o.height / 2) - (r.top + r.height / 2);
        od = { transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) ` +
          `scale(${sx.toFixed(3)}, ${sy.toFixed(3)})` };
      }
    }
    const a = m.animate([
      { ...od, opacity: 0, filter: "blur(18px)" },
      { opacity: 1, offset: 0.42, filter: "blur(5px)" },
      { transform: "none", opacity: 1, filter: "blur(0px)" },
    ], { duration: MODAL_IN, easing: "cubic-bezier(0.16, 1, 0.22, 1)", fill: "backwards" });
    const pocisti = () => { m.style.willChange = ""; try { a.cancel(); } catch {} };
    a.onfinish = pocisti;
    setTimeout(pocisti, MODAL_IN + 220);
  } else {
    back.classList.add("open");
  }

  let zapiram = false;
  const close = () => {
    if (zapiram) return;
    zapiram = true;
    hideChartTip();            // oblacek zivi v <body> in bi ostal viseti
    document.removeEventListener("keydown", onKey);
    if (!zivo) { back.remove(); return; }
    back.classList.remove("open");            // ozadje zbledi
    m.style.willChange = "transform, filter, opacity";
    const a = m.animate([
      { transform: "none", opacity: 1, filter: "blur(0px)" },
      { transform: "scale(0.965) translateY(8px)", opacity: 0, filter: "blur(14px)" },
    ], { duration: MODAL_OUT, easing: "cubic-bezier(0.5, 0, 0.9, 0.4)", fill: "forwards" });
    a.onfinish = () => back.remove();
    setTimeout(() => back.remove(), MODAL_OUT + 160);   // varovalka
  };
  const onKey = (ev) => { if (ev.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  back.addEventListener("click", (ev) => {
    if (ev.target === back || ev.target.classList.contains("close")) close();
  });
  return { back, close };
}

// Klik na "govoreč" element (alarm/status, naprava) -> podroben opis.
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-detail]");
  if (!el) return;
  pop(el);
  if (el.dataset.detail === "status") {
    // ob aktivnem alarmu takoj pokaži, kaj se dogaja
    const o = S.overview, st = o?.status || {};
    if (st.level === "alert" && o?.devices?.length) {
      const dev = o.devices.find((x) => x.status?.level === "alert") || o.devices[0];
      const since = new Date(Date.now() - 15 * 60000);
      openIncidentDetail({ s: localISO(since), e: localISO(new Date()),
                           d: dev.device_id, b: "", l: "Aktiven alarm" });
    } else openStatusDetail();
  }
  else if (el.dataset.detail === "device") openDeviceDetail(el.dataset.name);
  else if (el.dataset.detail === "alarms") openAlarmsDetail();
});

// ---------- Namizno okno ----------
// V namizni aplikaciji je okno brez sistemskega okvirja, ker je bila
// belo-siva Windows vrstica edini del zaslona, ki ni bil nas. Vrhnjo vrstico
// zato narisemo sami: ista glava kot v brskalniku, samo da se okno za njo
// vlece in ima na desni tri gumbe.
function namiznoOkno() {
  if (!window.pywebview) return;
  document.documentElement.dataset.namizje = "1";
  const glava = document.querySelector(".topbar");
  if (!glava || glava.querySelector(".ok-gumbi")) return;
  glava.classList.add("pywebview-drag-region");

  const gumb = (razred, oznaka, pot) =>
    '<button class="ok-g ' + razred + '" type="button" title="' + oznaka + '" ' +
    'aria-label="' + oznaka + '"><svg viewBox="0 0 12 12" fill="none" ' +
    'stroke="currentColor" stroke-width="1.2">' + pot + "</svg></button>";

  const el = document.createElement("div");
  el.className = "ok-gumbi";
  el.innerHTML =
    gumb("min", "Pomanjšaj", '<path d="M2.5 6h7"/>') +
    gumb("max", "Povečaj", '<rect x="2.6" y="2.6" width="6.8" height="6.8" rx="1"/>') +
    gumb("close", "Zapri", '<path d="M3 3l6 6M9 3l-6 6"/>');
  glava.appendChild(el);

  const klic = (ime) => {
    const api = window.pywebview && window.pywebview.api;
    if (api && typeof api[ime] === "function") api[ime]();
  };
  el.querySelector(".min").addEventListener("click", () => klic("pomanjsaj"));
  el.querySelector(".max").addEventListener("click", () => klic("povecaj"));
  el.querySelector(".close").addEventListener("click", () => klic("zapri"));
}

// pywebview vstavi svoj most sele, ko je stran nalozena; ce ga se ni, ga
// pocakamo, sicer bi okno ostalo brez gumbov.
if (window.pywebview) namiznoOkno();
else addEventListener("pywebviewready", namiznoOkno);

// ---------- Desni klik in namigi v nasem jeziku ----------
// Sistemski meni in crni sistemski oblacek sta edini mesti, kjer je plosca
// nenadoma izgledala kot brskalnik. Oboje zamenjamo s svojim -- isto steklo,
// isti robovi, isto gibanje kot povsod drugje.

let CTX = null;

function ctxZapri() {
  if (!CTX) return;
  const m = CTX; CTX = null;
  m.classList.remove("open");
  setTimeout(() => m.remove(), 200);
  removeEventListener("pointerdown", ctxIzven, true);
  removeEventListener("keydown", ctxTipka, true);
  removeEventListener("scroll", ctxZapri, true);
  removeEventListener("resize", ctxZapri);
}
const ctxIzven = (e) => { if (CTX && !CTX.contains(e.target)) ctxZapri(); };
const ctxTipka = (e) => { if (e.key === "Escape") ctxZapri(); };

// Kaj ponuditi, je odvisno od tega, na cem stojis -- meni z desetimi
// vklopljenimi ukazi, od katerih jih devet ne dela nicesar, je slabsi od
// sistemskega.
function ctxUkazi(t) {
  const izbor = String(getSelection() || "").trim();
  const a = t.closest && t.closest("a[href]");
  const polje = t.closest && t.closest("input, textarea, [contenteditable]");
  const slika = t.closest && t.closest("img, canvas");
  const vrstica = t.closest && t.closest("tr[data-id], .ev-bar, .notif-item");
  const out = [];

  // 1) urejanje -- isti ukazi kot v sistemskem meniju
  if (polje) {
    const jeVnos = polje.tagName === "INPUT" || polje.tagName === "TEXTAREA";
    out.push(["Izreži", () => { document.execCommand("cut"); }, "Ctrl X"]);
    out.push(["Kopiraj", () => { document.execCommand("copy"); }, "Ctrl C"]);
    out.push(["Prilepi", async () => {
      // Brskalnik lahko dovoljenje za branje odlozisca zavrne; takrat povemo,
      // kaj naj naredi, namesto da se ne zgodi nic.
      try {
        const besedilo = await navigator.clipboard.readText();
        polje.focus();
        if (jeVnos) {
          const a1 = polje.selectionStart ?? polje.value.length;
          const a2 = polje.selectionEnd ?? a1;
          polje.value = polje.value.slice(0, a1) + besedilo + polje.value.slice(a2);
          polje.setSelectionRange(a1 + besedilo.length, a1 + besedilo.length);
          polje.dispatchEvent(new Event("input", { bubbles: true }));
        } else { document.execCommand("insertText", false, besedilo); }
      } catch {
        toast("warning", "Lepljenje", "Brskalnik ni dovolil branja odložišča — uporabi Ctrl+V.");
      }
    }, "Ctrl V"]);
    out.push(["Izberi vse", () => { polje.focus(); document.execCommand("selectAll"); }, "Ctrl A"]);
    out.push(null);
  } else {
    if (izbor) out.push(["Kopiraj besedilo", () => navigator.clipboard?.writeText(izbor), "Ctrl C"]);
    out.push(["Izberi vse", () => {
      const s2 = getSelection(), r2 = document.createRange();
      r2.selectNodeContents(document.getElementById("main") || document.body);
      s2.removeAllRanges(); s2.addRange(r2);
    }, "Ctrl A"]);
  }
  if (a) {
    out.push(["Odpri povezavo v novem zavihku", () => window.open(a.href, "_blank", "noopener")]);
    out.push(["Kopiraj naslov povezave", () => navigator.clipboard?.writeText(a.href)]);
  }
  if (slika) {
    out.push(["Shrani sliko", () => ctxShraniSliko(slika)]);
  }
  if (vrstica) {
    const bes = vrstica.textContent.replace(/\s+/g, " ").trim();
    out.push(["Kopiraj vrstico", () => navigator.clipboard?.writeText(bes)]);
  }
  out.push(null);

  // 2) orodja plosce
  out.push(["Iskanje", () => openSearch(), "Ctrl K"]);
  out.push(["Obvestila", () => openNotifications(), "O"]);
  out.push(["Osveži podatke", () => { loadOverview(); renderView(); }, "R"]);
  out.push(null);

  // 3) navigacija in okno
  out.push(["Nazaj", () => history.back(), "Alt ←"]);
  out.push(["Naprej", () => history.forward(), "Alt →"]);
  out.push(["Ponovno naloži stran", () => location.reload(), "F5"]);
  out.push(["Natisni", () => window.print(), "Ctrl P"]);
  out.push(null);
  out.push(["Zamenjaj temo", preklopiTemo, "D"]);
  out.push(["Vizitka", () => document.querySelector(".viz-btn")?.click(), "V"]);
  out.push(["Seznam bližnjic", () => odpriBliznjice(), "?"]);
  // Preveri element odpre razvijalska orodja, tega stran ne sme in ne more
  // sprozit -- edina pot je brskalnikov meni, zato nanj opozorimo.
  out.push(["Brskalnikov meni (Preveri element)", () => toast("info", "Brskalnikov meni",
    "Drži Shift in klikni z desno tipko — takrat se odpre meni brskalnika."), "⇧ desni klik"]);
  return out;
}

// Sliko shranimo tako, kot bi jo brskalnik: canvas pretvorimo v datoteko,
// <img> pa prenesemo z njegovega naslova.
function ctxShraniSliko(el) {
  try {
    const ime = "halo-" + new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const a = document.createElement("a");
    a.download = ime + ".png";
    a.href = el.tagName === "CANVAS" ? el.toDataURL("image/png") : el.src;
    document.body.appendChild(a); a.click(); a.remove();
  } catch { toast("warning", "Shranjevanje", "Te slike ni bilo mogoče shraniti."); }
}

function ctxOdpri(x, y, t) {
  ctxZapri();
  // Dve locnici zapored ali locnica na koncu sta ostanek sestavljanja, ne
  // namen -- pospravimo ju, sicer je v meniju prazna vrsta.
  const ukazi = ctxUkazi(t).filter((u, i, a) =>
    u !== null || (i > 0 && a[i - 1] !== null && a.slice(i + 1).some((x2) => x2 !== null)));
  const m = document.createElement("div");
  m.className = "ctx-menu";
  m.setAttribute("role", "menu");
  m.innerHTML = ukazi.map((u, i) => u === null
    ? '<div class="ctx-sep"></div>'
    : '<button class="ctx-item" type="button" data-i="' + i + '">' +
      "<span>" + esc(u[0]) + "</span>" +
      (u[2] ? '<kbd>' + esc(u[2]) + "</kbd>" : "") + "</button>").join("");
  document.body.appendChild(m);
  const r = m.getBoundingClientRect();
  m.style.left = Math.round(Math.min(x, innerWidth - r.width - 8)) + "px";
  m.style.top = Math.round(Math.min(y, innerHeight - r.height - 8)) + "px";
  m.style.transformOrigin =
    (y > innerHeight - r.height - 8 ? "bottom " : "top ") +
    (x > innerWidth - r.width - 8 ? "right" : "left");
  void m.offsetWidth;
  m.classList.add("open");
  m.querySelectorAll(".ctx-item").forEach((b) => b.addEventListener("click", () => {
    const u = ukazi[Number(b.dataset.i)];
    ctxZapri();
    try { u[1](); } catch {}
  }));
  CTX = m;
  addEventListener("pointerdown", ctxIzven, true);
  addEventListener("keydown", ctxTipka, true);
  addEventListener("scroll", ctxZapri, true);
  addEventListener("resize", ctxZapri);
}

document.addEventListener("contextmenu", (e) => {
  // Shift + desni klik pusti sistemski meni -- vedno mora obstajati pot do
  // brskalnikovih ukazov (preveri element, shrani sliko ...).
  if (e.shiftKey) return;
  e.preventDefault();
  ctxOdpri(e.clientX, e.clientY, e.target);
});

// Namig: sistemski title je crn sistemski okvir, ki se pojavi cez sekundo in
// ne pripada nicemur na strani. Atribut zato ob hoverju odstranimo (in ga ob
// odhodu vrnemo), besedilo pa pokazemo v svojem oblacku.
let TIP = null, tipCakalec = 0, tipEl = null;

function tipSkrij() {
  clearTimeout(tipCakalec);
  if (tipEl && tipEl.dataset.tipShran != null) {
    tipEl.setAttribute("title", tipEl.dataset.tipShran);
    delete tipEl.dataset.tipShran;
  }
  tipEl = null;
  if (!TIP) return;
  const t = TIP; TIP = null;
  t.classList.remove("on");
  setTimeout(() => t.remove(), 180);
}

function tipPokazi(el, besedilo) {
  const t = document.createElement("div");
  t.className = "app-tip";
  t.textContent = besedilo;
  document.body.appendChild(t);
  const r = el.getBoundingClientRect(), tr = t.getBoundingClientRect();
  let x = r.left + r.width / 2 - tr.width / 2;
  let y = r.top - tr.height - 9;
  if (y < 8) y = r.bottom + 9;                       // ce zgoraj ni prostora
  t.style.left = Math.round(Math.max(8, Math.min(x, innerWidth - tr.width - 8))) + "px";
  t.style.top = Math.round(y) + "px";
  void t.offsetWidth;
  t.classList.add("on");
  TIP = t;
}

document.addEventListener("pointerover", (e) => {
  const el = e.target && e.target.closest ? e.target.closest("[title]") : null;
  if (!el || el === tipEl) return;
  tipSkrij();
  const besedilo = el.getAttribute("title");
  if (!besedilo) return;
  tipEl = el;
  el.dataset.tipShran = besedilo;
  el.removeAttribute("title");          // sistemski oblacek naj molci
  tipCakalec = setTimeout(() => {
    if (tipEl === el && el.isConnected) tipPokazi(el, besedilo);
  }, 380);
});
document.addEventListener("pointerout", (e) => {
  // Skrijemo samo, ce je kazalec res zapustil element -- ne, ce je zdrsnil na
  // njegovega otroka. Primerjati je treba, KAM je sel (relatedTarget), ne
  // kje je bil; s tem sem se prvic ujel in namig ni izginil nikoli.
  if (!tipEl) return;
  const kam = e.relatedTarget;
  if (kam && tipEl.contains(kam)) return;
  tipSkrij();
});
addEventListener("scroll", tipSkrij, true);
document.addEventListener("pointerdown", tipSkrij, true);

// Bleščice ob kliku (Nastavitve -> Bleščice): majhne iskrice okoli kazalca.
const SPARKLE_COLORS = ["var(--accent)", "#f5c84c", "#ffffff"];
function spawnSparkles(x, y, count) {
  const n = count || (9 + Math.floor(Math.random() * 4));
  for (let i = 0; i < n; i++) {
    const s = document.createElement("i");
    s.className = "sparkle";
    const ang = Math.random() * 2 * Math.PI;
    const dist = 16 + Math.random() * 36;
    s.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(1) + "px");
    s.style.setProperty("--dy", (Math.sin(ang) * dist).toFixed(1) + "px");
    s.style.setProperty("--rot", (Math.random() * 260 - 130).toFixed(0) + "deg");
    s.style.setProperty("--s", (5 + Math.random() * 6).toFixed(1) + "px");
    s.style.left = (x + Math.random() * 12 - 6) + "px";
    s.style.top = (y + Math.random() * 12 - 6) + "px";
    s.style.color = SPARKLE_COLORS[i % SPARKLE_COLORS.length];
    s.style.animationDelay = Math.floor(Math.random() * 80) + "ms";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 950);
  }
}
// Zvezdni prah pod kazalcem: ko je kazalec nad necim, kar je mogoce
// pritisniti, se za njim vlecejo drobne, skoraj bele iskrice. Tise in manjse
// od tistih ob kliku -- te povedo "zgodilo se je", prah pa "to je zivo".
const PRAH_SEL = ".nav-item, .btn, .dd-btn, .dd-opt, .chip, .icon-btn, .ai-hl.go, " +
  ".cmdk-row, .notif-item, [data-detail], tr[data-id], tr[data-inc], .tm-seg, " +
  ".viz-btn, .viz-link, .epr, #svgEdge";
// Barve so v CSS (razredi d1..d3), ker se morajo prilagoditi temi: bela na
// svetli podlagi je nevidna -- prav to je bila napaka prve razlicice.
const PRAH_CLS = ["d1", "d2", "d3"];
let _prahAt = 0;
// Prah se sipa, DOKLER je kazalec nad elementom -- tudi ce miruje. Oddajanje
// je na casovniku, ne na premikih miske.
let _dustAt = null, _dustTimer = 0, _dustFps = 0, _dustSlow = 0, _dustOff = false;
function dustStart() {
  if (_dustTimer || _dustOff || REDUCED || PREFS.motion === "off" || PREFS.dust === "off") return;
  _dustTimer = setInterval(() => {
    if (!_dustAt || document.hidden) return;
    spawnDust(_dustAt.x, _dustAt.y, 1 + (Math.random() < 0.5 ? 1 : 0));
  }, 110);
  dustWatch();
}
// Ob spremembi nastavitve pozabimo prejsnji izklop zaradi hitrosti in
// sistemsko obvestilo, sicer bi prah ostal ugasnjen do osvezitve strani.
function dustReset() {
  _dustOff = false;
  _dustSlow = 0;
  NOTIF.notices = NOTIF.notices.filter((n) => n.title !== "Zvezdni prah izklopljen");
  paintNotif();
  if (PREFS.dust === "off") dustStop();
}

function dustStop() {
  _dustAt = null;
  if (_dustTimer) { clearInterval(_dustTimer); _dustTimer = 0; }
  if (_dustFps) { cancelAnimationFrame(_dustFps); _dustFps = 0; }
}
// Varovalka: ce stran zaradi prahu zacne zaostajati, ga ugasnemo in to
// povemo -- lepsa stran, ki se zatika, je slabsa od mirne strani.
function dustWatch() {
  // "Vedno vklopljen" pomeni prav to: hitrosti ne merimo in prahu ne ugasnemo
  if (PREFS.dust === "always" || _dustFps) return;
  let zadnji = performance.now(), slik = 0, okno = zadnji;
  const korak = (now) => {
    slik++;
    if (now - okno >= 1000) {
      const fps = (slik * 1000) / (now - okno);
      slik = 0; okno = now;
      if (fps < 32) {
        _dustSlow++;
        if (_dustSlow >= 2) {          // dve zaporedni sekundi, ne en sunek
          _dustOff = true;
          dustStop();
          pushNotice("Zvezdni prah izklopljen",
            "Stran je zaradi njega zaostajala (" + Math.round(fps) +
            " sličic na sekundo). V nastavitvah ga lahko znova vklopiš.");
          return;
        }
      } else _dustSlow = 0;
    }
    zadnji = now;
    _dustFps = requestAnimationFrame(korak);
  };
  _dustFps = requestAnimationFrame(korak);
}

function spawnDust(x, y, n) {
  for (let i = 0; i < (n || 2); i++) {
    const s = document.createElement("i");
    s.className = "sparkle dust " + PRAH_CLS[i % PRAH_CLS.length];
    const ang = Math.random() * 2 * Math.PI;
    const dist = 12 + Math.random() * 22;
    s.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(1) + "px");
    s.style.setProperty("--dy", (Math.sin(ang) * dist - 5).toFixed(1) + "px");
    s.style.setProperty("--rot", (Math.random() * 140 - 70).toFixed(0) + "deg");
    s.style.setProperty("--s", (9 + Math.random() * 7).toFixed(1) + "px");
    s.style.left = (x + Math.random() * 8 - 4) + "px";
    s.style.top = (y + Math.random() * 8 - 4) + "px";
    s.style.animationDelay = Math.floor(Math.random() * 60) + "ms";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1100);
  }
}

document.addEventListener("click", (e) => {
  if (PREFS.sparkle !== "on" || REDUCED || PREFS.motion === "off") return;
  if (!e.target.closest(".nav-item, .btn, .dd-btn, .dd-opt, .chip, .icon-btn, .ai-hl.go, [data-detail], tr[data-id], #svgEdge")) return;
  spawnSparkles(e.clientX, e.clientY);
});

// ---------- state ----------
const S = {
  session: null, role: "staff", user: null,
  view: "status", location: "", orgs: [], activeOrg: "fleet",
  overview: null, pollTimer: null,
};

const NAV = {
  customer: [
    ["status", "Status", "status"], ["events", "Eventi", "events"],
    ["trends", "Trendi", "trends"], ["reports", "Poročila", "reports"],
  ],
  staff: [
    ["status", "Status", "status"], ["events", "Eventi", "events"],
    ["trends", "Trendi", "trends"], ["reports", "Poročila", "reports"],
    ["_sep", "", ""],
    ["fleet", "Fleet", "fleet"], ["diagnostics", "Diagnostika", "diag"],
    ["audit", "Audit", "audit"], ["settings", "Nastavitve", "settings"],
  ],
};

// ---------- Nastavitve (prefs) ----------
const ACCENTS = {
  blue: { c: "#5a8fe6", s: "rgba(90,143,230,.13)" },
  indigo: { c: "#7b7fe0", s: "rgba(123,127,224,.14)" },
  lavender: { c: "#9782e8", s: "rgba(151,130,232,.14)" },
  rose: { c: "#e37ba8", s: "rgba(227,123,168,.14)" },
  coral: { c: "#ef8b74", s: "rgba(239,139,116,.15)" },
  apricot: { c: "#e8934a", s: "rgba(232,147,74,.14)" },
  mint: { c: "#48ae83", s: "rgba(72,174,131,.14)" },
  sage: { c: "#86a97b", s: "rgba(134,169,123,.15)" },
  graphite: { c: "#7c8598", s: "rgba(124,133,152,.15)" },
};
// Super barve: mocnejse palete, ki pobarvajo OZADJE in poudarek, stekla in
// besedila pa pustijo pri miru -- zato plosca ostane berljiva. Privzeto so
// izklopljene, ker je nadzorna plosca orodje in ne plakat.
// l = svetla (ozadje), d = temna (globina), a = poudarek.
const PALETE = {
  slate:    { l: "#E5E4E2", d: "#0A0A0A", a: "#536878", n: "Alabaster · Onyx · Blue Slate" },
  wine:     { l: "#F0E5DE", d: "#6F1D1B", a: "#8A6F62", n: "Linen · Dark Wine · Ash Grey" },
  apricot:  { l: "#FFDAB9", d: "#0B130E", a: "#9932CC", n: "Apricot Glow · Obsidian · Vivid Violet" },
  lavender2:{ l: "#E6E6FA", d: "#240A24", a: "#9932CC", n: "Lavender · Midnight · Blue Violet" },
  snow:     { l: "#FAFBFD", d: "#3B3663", a: "#8E82C7", n: "Bright Snow · Inferno · Periwinkle" },
  gold:     { l: "#FFD700", d: "#800020", a: "#B8481A", n: "Gold · Burgundy · Crimson Carrot" },
};
const PALETA_OPTS = Object.entries(PALETE).map(([v, p]) => ({ v, l: p.n }));
const SUPER_OPTS = [{ v: "off", l: "Izklopljeno" }, { v: "on", l: "Vklopljeno" }];

const PREF_DEFAULTS = { theme: "light", accent: "blue", motion: "full", density: "comfortable", home: "status", poll: "10", svgStream: "handle", sparkle: "off", cursorLight: "on", dust: "on", alerts: "visual", scrollNav: "on", superColors: "off", paleta: "slate" };
let PREFS = loadPrefs();
function loadPrefs() {
  try { return { ...PREF_DEFAULTS, ...JSON.parse(localStorage.getItem("halo-prefs") || "{}") }; }
  catch { return { ...PREF_DEFAULTS }; }
}
function savePrefs() { try { localStorage.setItem("halo-prefs", JSON.stringify(PREFS)); } catch {} }
let _mqDark = null;
function resolveTheme() {
  if (PREFS.theme === "auto") {
    if (!_mqDark) _mqDark = window.matchMedia("(prefers-color-scheme: dark)");
    return _mqDark.matches ? "dark" : "light";
  }
  return PREFS.theme;
}
function hexAlfa(hex, a) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function applyPrefs() {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme();
  // Super barve prevzamejo poudarek in ozadje; alarmne barve ostanejo svoje,
  // sicer rdeca ne bi vec pomenila alarma.
  const sc = PREFS.superColors === "on" ? PALETE[PREFS.paleta] : null;
  if (sc) {
    root.dataset.super = PREFS.paleta;
    root.style.setProperty("--sc-l", sc.l);
    root.style.setProperty("--sc-d", sc.d);
    root.style.setProperty("--sc-a", sc.a);
    root.style.setProperty("--accent", sc.a);
    root.style.setProperty("--accent-soft", hexAlfa(sc.a, 0.14));
  } else {
    delete root.dataset.super;
    const a = ACCENTS[PREFS.accent] || ACCENTS.blue;
    root.style.setProperty("--accent", a.c);
    root.style.setProperty("--accent-soft", a.s);
  }
  if (document.body) {
    document.body.classList.toggle("dense", PREFS.density === "compact");
    document.body.classList.toggle("no-anim", PREFS.motion === "off");
    const lightOn = PREFS.cursorLight !== "off" && !REDUCED && PREFS.motion !== "off";
    if (lightOn && !document.getElementById("cursorGlow")) {
      const g = document.createElement("div");
      g.id = "cursorGlow";
      document.body.appendChild(g);
    }
    document.body.classList.toggle("glow-on", lightOn);
    if (!lightOn) dropLight();
  }
  if (PREFS.theme === "auto" && _mqDark && !_mqDark._bound) {
    _mqDark._bound = true;
    _mqDark.addEventListener("change", () => { if (PREFS.theme === "auto") document.documentElement.dataset.theme = resolveTheme(); });
  }
  applySvgMode();
}

// Val čez CEL zaslon: obroč potuje iz točke navzven, bližnji elementi rahlo
// "dihnejo" z zamikom po oddaljenosti od izvora (subtilno, nemoteče).
function pageRipple(x, y) {
  if (REDUCED || PREFS.motion === "off") return;
  const r = document.createElement("div");
  r.className = "page-ripple";
  r.style.left = x + "px"; r.style.top = y + "px";
  document.body.appendChild(r);
  r.addEventListener("animationend", () => r.remove());
  const els = [...document.querySelectorAll(
    ".card, .health-banner, .nav-item, .device-row, .table-wrap, .btn, .dd-btn, .chip"
  )].slice(0, 60);
  const SPEED = 1.9; // px/ms — usklajeno s počasnejšim (cinematic) valom
  for (const el of els) {
    const b = el.getBoundingClientRect();
    if (!b.width || b.bottom < 0 || b.top > innerHeight) continue;
    const d = Math.hypot(b.left + b.width / 2 - x, b.top + b.height / 2 - y);
    setTimeout(() => {
      // ista squish animacija kot ob hoverju, ko val "zadene" element
      el.classList.remove("hv-squish"); void el.offsetWidth; el.classList.add("hv-squish");
    }, d / SPEED);
  }
}

// ---------- SVG stream dock (slide-in iz levega roba, BREZ gumba) ----------
let _svgTimer = null, _svgDock = null, _svgEdge = null;
function initSvgDock() {
  if (_svgDock) { applySvgMode(); return; }
  const dock = document.createElement("div");
  dock.id = "svgDock";
  dock.innerHTML = `<div class="svg-panel"><img class="svg-img" alt="HALO SVG prikaz"></div>`;
  document.body.appendChild(dock);
  _svgDock = dock;
  const svgImg = dock.querySelector(".svg-img");
  svgImg.addEventListener("load", () => fitSvgToContent(svgImg));
  window.addEventListener("resize", applySvgCrop);
  // nevidna občutljiva cona ob DESNEM robu (clean UI, ni gumba)
  const edge = document.createElement("div");
  edge.id = "svgEdge";
  edge.setAttribute("aria-label", "HALO prikaz");
  document.body.appendChild(edge);
  _svgEdge = edge;
  const outsideClose = (ev) => {
    if (PREFS.svgStream === "always") return;
    if (_svgDock.contains(ev.target) || _svgEdge.contains(ev.target)) return;
    // kontrole (topbar z dropdowni, odprt meni, modal) niso "klik stran" —
    // metriko/obdobje lahko menjaš, SVG ostane odprt
    if (ev.target.closest && ev.target.closest(".topbar, .dd-menu, .modal-back, .sidebar")) return;
    setSvgOpen(false);
    document.removeEventListener("click", outsideClose);
  };
  edge.addEventListener("click", (e) => {
    pageRipple(e.clientX, e.clientY);
    if (PREFS.svgStream === "always") return;
    const willOpen = !dock.classList.contains("open");
    setSvgOpen(willOpen);
    if (willOpen) setTimeout(() => document.addEventListener("click", outsideClose), 0);
    else document.removeEventListener("click", outsideClose);
  });
  applySvgMode();
}
// Odpiranje/zapiranje kot celota: panel + skrčenje menija (body.svg-open ->
// icon-rail sidebar, vsebina zdrsne levo; fullscreen split pogled).
function setSvgOpen(open) {
  if (!_svgDock) return;
  _svgDock.classList.toggle("open", !!open);
  document.body.classList.toggle("svg-open", !!open);
  syncSvgRefresh();
}

function applySvgMode() {
  if (!_svgDock) return;
  const m = PREFS.svgStream || "handle";
  _svgDock.dataset.mode = m;
  if (_svgEdge) _svgEdge.style.display = m === "off" ? "none" : "block";
  if (m === "always") setSvgOpen(true);
  else if (m === "off") setSvgOpen(false);
  else setSvgOpen(_svgDock.classList.contains("open"));
}
function syncSvgRefresh() {
  const visible = _svgDock && PREFS.svgStream !== "off" &&
    (_svgDock.classList.contains("open") || PREFS.svgStream === "always");
  if (_svgTimer) { clearInterval(_svgTimer); _svgTimer = null; }
  const img = _svgDock && _svgDock.querySelector(".svg-img");
  if (visible && img) {
    const refresh = () => { img.src = "halo-svg.svg?t=" + Date.now(); };
    refresh();
    _svgTimer = setInterval(() => { if (!document.hidden) refresh(); }, 5000);
  }
}

// Samodejno zazna vodoravne meje vsebine SVG-ja (ne-beli stolpci) in obreže
// bele robove točno tam. Rezultat (fL/fR) shrani in ga uveljavi applySvgCrop.
let _svgFL = 0, _svgFR = 1;
function fitSvgToContent(img) {
  try {
    const W = 480, H = 360;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);
    const d = ctx.getImageData(0, 0, W, H).data;
    const colHasInk = (x) => {
      for (let y = 0; y < H; y += 2) {
        const i = (y * W + x) * 4;
        if (d[i] < 240 || d[i + 1] < 240 || d[i + 2] < 240) return true;
      }
      return false;
    };
    let L = 0, R = W - 1;
    while (L < W && !colHasInk(L)) L++;
    while (R > L && !colHasInk(R)) R--;
    if (R <= L) return; // vse belo -> pusti fallback
    const pad = Math.round(W * 0.012);
    _svgFL = Math.max(0, L - pad) / W;
    _svgFR = Math.min(W - 1, R + pad + 1) / W;
    applySvgCrop();
  } catch (e) { /* taint/naklada napaka -> fallback CSS */ }
}
function applySvgCrop() {
  if (!_svgDock) return;
  const panel = _svgDock.querySelector(".svg-panel"), img = _svgDock.querySelector(".svg-img");
  if (!panel || !img) return;
  // slika je height:100vh, width:auto -> njena render širina:
  const imgW = img.getBoundingClientRect().width || (window.innerHeight * (img.naturalWidth / img.naturalHeight || 4 / 3));
  if (!imgW || _svgFR <= _svgFL) return;
  const panelW = (_svgFR - _svgFL) * imgW;
  panel.style.width = panelW.toFixed(1) + "px";
  img.style.left = (-_svgFL * imgW).toFixed(1) + "px";
  img.style.transform = "none";
  // vsebina se ob odprtju umakne točno za širino panela
  document.body.style.setProperty("--svg-panel-w", panelW.toFixed(0) + "px");
}
function restartPoll() {
  if (S.pollTimer) clearInterval(S.pollTimer);
  // poll teče v vseh pogledih, da alarme ujamemo tudi izven Statusa
  S.pollTimer = setInterval(() => { if (!document.hidden) loadOverview(true); }, (Number(PREFS.poll) || 10) * 1000);
}

// ---------- boot ----------
init();
async function init() {
  applyPrefs();
  await loadMetricRegistry();
  try {
    S.session = await apiGet("/api/auth/session");
  } catch {
    S.session = { authenticated: false, enforced: false, user: null };
  }
  if (S.session.enforced && !S.session.authenticated) return renderLogin();
  S.user = S.session.user;
  // enforcement off -> interni staff pogled; sicer po vlogi uporabnika
  S.role = !S.session.enforced || (S.user && S.user.is_staff) ? "staff" : "customer";
  if (S.role === "staff") {
    try { S.orgs = (await apiGet("/api/v2/orgs")).orgs; } catch { S.orgs = []; }
  }
  renderShell();
  initSvgDock();
  window.addEventListener("hashchange", routeFromHash);
  routeFromHash();
  restartPoll();
}

const navList = () => NAV[S.role].filter((n) => n[0] !== "_sep");

function routeFromHash() {
  const v = (location.hash.replace("#/", "") || PREFS.home || "status").split("?")[0];
  const list = navList();
  const allowed = list.map((n) => n[0]);
  const next = allowed.includes(v) ? v : "status";
  const from = list.findIndex((n) => n[0] === S.view);
  const to = list.findIndex((n) => n[0] === next);
  const changed = next !== S.view;
  S.view = next;
  if (S.trendTimer) { clearInterval(S.trendTimer); S.trendTimer = null; }
  S.onMeritev = null;
  renderActiveNav();
  const m = document.getElementById("main");
  if (!m || !changed || from < 0 || to < 0 || REDUCED || PREFS.motion === "off") return renderView();
  const smer = to > from ? 1 : -1;
  // Smer vstopa je odvisna od tega, KAM v meniju gres: navzdol po meniju
  // vsebina prileti od spodaj, navzgor pa od zgoraj. Tako se premik ujema s
  // tem, kar si kliknil, in stran deluje kot en dolg trak, ne kot menjava
  // diapozitivov.
  m.style.setProperty("--vstop", (smer > 0 ? 14 : -14) + "px");
  ozadjeZaniha(smer);
  prehodPogleda(smer);
  renderView();
}

// Prehod kot vrtiljak: vmesni pogledi prefrčijo mimo (1→4 pokaže 2 in 3),
// vsi potujejo v isto smer, ob izhodu se raztegnejo in zablurajo.
let _carToken = 0;
function carouselTo(from, to, list) {
  const token = ++_carToken;
  const dir = to > from ? 1 : -1;                     // 1 = navzdol po meniju
  const between = [];
  for (let i = from + dir; i !== to; i += dir) between.push(list[i]);
  const skip = between.slice(0, 3);                   // največ 3 vmesni

  const m = document.getElementById("main");
  const host = document.querySelector(".content") || m;
  const box = host.getBoundingClientRect();
  document.getElementById("carousel")?.remove();
  const layer = document.createElement("div");
  layer.id = "carousel";
  Object.assign(layer.style, {
    left: box.left + "px", top: box.top + "px",
    width: box.width + "px", height: Math.max(260, Math.min(box.height, innerHeight - box.top)) + "px",
  });
  document.body.appendChild(layer);

  const D = Math.min(560, Math.max(240, box.height * 0.55));   // pot v px
  const OUT = skip.length ? 200 : 150;
  const STEP = 110;
  const IN = skip.length ? 700 : 600;
  const EASE_OUT = "cubic-bezier(0.7, 0, 0.84, 0)";             // expo-in: pospešuje ven
  const EASE_IN = "cubic-bezier(0.16, 1, 0.22, 1)";             // expo-out: dolg, počasen zaključek

  // squash & stretch: kar se hitro giblje, se v smeri gibanja raztegne in
  // po širini rahlo stisne — brez tega je gibanje leseno
  const outFrames = [
    { transform: "translateY(0) scaleY(1) scaleX(1)", filter: "blur(0px)", opacity: 1 },
    { transform: `translateY(${-D * dir * 0.22}px) scaleY(1.07) scaleX(0.994)`, filter: "blur(7px)", opacity: 0.55, offset: 0.45 },
    { transform: `translateY(${-D * dir}px) scaleY(1.2) scaleX(0.984)`, filter: "blur(22px)", opacity: 0 },
  ];
  const outAnim = m.animate(outFrames, { duration: OUT, easing: EASE_OUT, fill: "forwards" });

  skip.forEach(([, label, ic], k) => {
    const s = document.createElement("div");
    s.className = "car-slide";
    s.innerHTML = `<div class="car-card">${icon(ic)}<span>${esc(label)}</span></div>`;
    layer.appendChild(s);
    s.animate([
      { transform: `translateY(${D * dir}px) scaleY(1.2) scaleX(0.984)`, filter: "blur(14px)", opacity: 0 },
      { transform: "translateY(0) scaleY(1) scaleX(1)", filter: "blur(1px)", opacity: 0.92, offset: 0.5 },
      { transform: `translateY(${-D * dir}px) scaleY(1.2) scaleX(0.984)`, filter: "blur(14px)", opacity: 0 },
    ], { duration: 300, delay: 80 + k * STEP, easing: "cubic-bezier(0.4,0,0.6,1)", fill: "both" });
  });

  const swapAt = OUT + skip.length * STEP * 0.55;
  setTimeout(() => {
    if (token !== _carToken) return;
    S._carousel = true;                                // observer naj ne doda še fadeUp
    renderView();
    S._carousel = false;
    outAnim.cancel();
    // fill:"backwards" -> po koncu se element vrne v naravno stanje in ne
    // more obviseti zamaknjen/nevidn, tudi če animacijo kaj prekine
    m.animate([
      // hitro na začetku (raztegnjeno), nato dolgo, počasno umirjanje;
      // ob pristanku squish namesto odboja — cilja nikoli ne prekorači
      { transform: `translateY(${D * dir}px) scaleY(1.2) scaleX(0.984)`, filter: "blur(20px)", opacity: 0 },
      { transform: `translateY(${D * dir * 0.1}px) scaleY(1.05) scaleX(0.995)`, filter: "blur(4px)", opacity: 0.9, offset: 0.42 },
      { transform: `translateY(0px) scaleY(0.972) scaleX(1.008)`, filter: "blur(0px)", opacity: 1, offset: 0.6 },
      { transform: `translateY(0px) scaleY(0.994) scaleX(1.002)`, filter: "blur(0px)", opacity: 1, offset: 0.78 },
      { transform: "translateY(0) scaleY(1) scaleX(1)", filter: "blur(0px)", opacity: 1 },
    ], { duration: IN, easing: EASE_IN, fill: "backwards" });
    setTimeout(() => {
      if (token !== _carToken) return;
      layer.remove();
      m.getAnimations().forEach((a) => a.cancel());    // varovalka
    }, IN + 80);
  }, swapAt);
}

// Menjava pogleda: stara vsebina odplava, nova pride z nasprotne strani.
// Vrtiljak je vozil skozi vmesne poglede in je bil zato dolg in nemiren --
// ta prehod traja tretjino casa in ne pokaze nicesar, cesar nisi izbral.
let _izhodAnim = null;
function prehodPogleda(smer) {
  const m = document.getElementById("main");
  if (!m) return;
  const D = 22 * smer;
  _izhodAnim = m.animate([
    { opacity: 1, transform: "translateY(0)", filter: "blur(0px)" },
    { opacity: 0, transform: `translateY(${-D}px)`, filter: "blur(12px)" },
  ], { duration: 340, easing: "cubic-bezier(0.5, 0, 0.9, 0.4)", fill: "forwards" });
  // "forwards" pusti pogled na prosojnosti 0; odpovemo ga takoj, ko pride nova
  // vsebina (spodaj v opazovalcu), in za vsak primer se po roku -- brez tega
  // ostane stran videti prazna, ceprav je izrisana.
  const a = _izhodAnim;
  setTimeout(() => { if (_izhodAnim === a) izhodKonec(); }, 700);
}
function izhodKonec() {
  if (!_izhodAnim) return;
  try { _izhodAnim.cancel(); } catch {}
  _izhodAnim = null;
}

// Ozadje ob menjavi zaniha: barvni plasti se rahlo premakneta in zavrtita.
// Gradientov ne animiramo (med vrednostmi ne interpolirajo, samo preskocijo)
// -- premikamo ploskev, ki jih nosi. Zato je stalno povecana za 8 %, sicer bi
// se ob premiku pokazal rob.
let _ozadjeFaza = 0;
function ozadjeZaniha(smer) {
  const bg = document.querySelector(".bg-stage");
  if (!bg || REDUCED || PREFS.motion === "off") return;
  // Vrtenje je bilo napacno: ploskev je zavrtelo toliko, da se je pokazal
  // njen rob kot ostra bela crta. Zdaj samo diha (scale) in rahlo zdrsne
  // navzgor ali navzdol -- gradienta se premakneta, roba pa ni od kod.
  _ozadjeFaza += smer;
  const odY = Math.max(-26, Math.min(26, _ozadjeFaza * 9));
  const konec = `scale(1.06) translateY(${odY.toFixed(1)}px)`;
  bg.animate([
    { transform: bg.dataset.tr || "scale(1.06)" },
    { transform: `scale(1.13) translateY(${(odY * 0.5).toFixed(1)}px)`, offset: 0.42 },
    { transform: konec },
  ], { duration: 2200, easing: "cubic-bezier(0.16, 1, 0.22, 1)", fill: "forwards" });
  bg.dataset.tr = konec;
}

// ---------- shell ----------
function renderShell() {
  const items = NAV[S.role]
    .map(([id, label, ic]) =>
      id === "_sep" ? '<div class="nav-sep"></div>'
        : `<button class="nav-item" data-view="${id}">${icon(ic)}<span>${label}</span></button>`
    ).join("");
  // Vizitka je vedno na dnu menija; ob prijavi je nad njo se identiteta.
  const foot = `<div class="nav-foot">` +
    (S.session.enforced
      ? `${esc(S.user?.email || "")}<br><button class="nav-item" id="logoutBtn" style="padding:6px 8px;margin:6px 0 10px">${icon("logout")}<span>Odjava</span></button>`
      : "") +
    `<div id="vizitkaHost"></div></div>`;
  document.getElementById("app").innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        ${items}
        ${foot}
      </aside>
      <div class="main">
        <header class="topbar">
          <h1 id="viewTitle">Status</h1>
          <div class="spacer"></div>
          <div id="topControls"></div>
          <button class="icon-btn search-btn" id="searchBtn" type="button"
                  title="Iskanje (Ctrl+K)" aria-label="Iskanje">${icon("search")}<span
                  class="sb-label">Išči<kbd>Ctrl K</kbd></span></button>
          <button class="icon-btn" id="notifBtn" type="button" title="Obvestila"
                  aria-label="Obvestila">${icon("bell")}<span class="notif-badge"
                  id="notifBadge" hidden></span></button>
        </header>
        <div class="content" id="main"></div>
      </div>
    </div>`;
  document.getElementById("app").removeAttribute("aria-busy");
  $(".sidebar").addEventListener("click", (e) => {
    const b = e.target.closest(".nav-item[data-view]");
    if (b) location.hash = "#/" + b.dataset.view;
  });
  // Vizitka se nalozi sele ob prvem izrisu menija: nosi tri animacije, ki
  // jih nadzorna plosca pri delu ne potrebuje.
  import("./vizitka.js" + ASSET_V)
    .then((m) => m.mountVizitka(document.getElementById("vizitkaHost"), {
      reduced: () => REDUCED || PREFS.motion === "off",
      opro: oProgramu,
    }))
    .catch(() => {});
  namiznoOkno();          // v namizni aplikaciji glava nosi tudi gumbe okna
  document.getElementById("searchBtn").addEventListener("click", openSearch);
  const nb = document.getElementById("notifBtn");
  nb.addEventListener("click", openNotifications);
  // Predogled ob ikoni: kaj je novega, ne da bi karkoli odpiral.
  nb.addEventListener("pointerenter", () => notifPeek(nb));
  nb.addEventListener("pointerleave", () => notifPeekHide());
  loadNotifications(true);
  const lb = document.getElementById("logoutBtn");
  if (lb) lb.addEventListener("click", async () => { await apiSend("POST", "/api/auth/logout"); location.reload(); });

  // Vstopna animacija ob menjavi pogleda: stagger indeksi na direktnih otrocih.
  // Žive posodobitve istega pogleda (poll, filtri) se NE re-animirajo — gibanje
  // označuje menjavo konteksta, ne osveževanja podatkov. Skeleton ne "porabi"
  // animacije, da pravi izris še vedno vstopi mehko.
  new MutationObserver(() => {
    const m = main();
    m.classList.remove("nalaga");
    const isSkeleton = m.firstElementChild && m.firstElementChild.classList.contains("nalaganje");
    // Izhodna animacija drzi pogled na prosojnosti 0; odpovemo jo, ko pride
    // PRAVA vsebina -- ne ze ob kolesu, sicer se izhod sploh ne vidi.
    if (!isSkeleton) izhodKonec();
    // skeleton -> vsebina: mehak crossfade namesto preskoka
    if (!isSkeleton && m.dataset.wasSkeleton === "1") {
      m.dataset.wasSkeleton = "0";
      m.classList.remove("crossfade"); void m.offsetWidth; m.classList.add("crossfade");
    }
    if (isSkeleton) m.dataset.wasSkeleton = "1";
    if (!isSkeleton && m.dataset.view === S.view) return;
    if (!isSkeleton) m.dataset.view = S.view;
    // Vstop stopnicimo po KARTICAH in ne po neposrednih otrocih. Status ima
    // sedem otrok in je izgledal ziv, Trendi in Porocila pa dva, zato je bil
    // tam ucinek komaj viden. Mreza kartic zato prispeva vsako kartico
    // posebej.
    const enote = [];
    [...m.children].forEach((c) => {
      if (c.classList.contains("grid") && c.children.length > 1) enote.push(...c.children);
      else enote.push(c);
    });
    m.querySelectorAll(".vstop").forEach((e) => e.classList.remove("vstop"));
    enote.forEach((e, i) => {
      e.style.setProperty("--i", Math.min(i, 10));
      e.classList.add("vstop");
    });
    m.classList.remove("view-enter");
    void m.offsetWidth;
    m.classList.add("view-enter");
  }).observe(document.getElementById("main"), { childList: true });
}

// Kljucni podatki o programu -- pisejo se na vizitko, ne v svoje okno.
// Vizitka je edino mesto, kjer je ta drobni tisk na svojem mestu.
function oProgramu() {
  const napr = (S.overview && S.overview.devices) || [];
  const vrstice = [
    ["Program", "Trace Space"],
    ["Naprava", "Avigilon HALO Smart Sensor"],
    ["Namen", "nadzor kakovosti zraka in varnostnih dogodkov"],
    ["Različica vmesnika", document.documentElement.dataset.ver || "v2"],
    ["Način", S.session.enforced ? "s prijavo" : "interni (brez prijave)"],
    ["Meritve", "vsakih 15 sekund"],
  ];
  // Pregled je nalozen samo, ce si bil ze na Statusu. Vrstice s pomisljajem
  // ne povedo nic, zato jih raje ni.
  if (napr.length) {
    vrstice.push(["Naprav v sistemu", String(napr.length)]);
    const zadnji = napr[0] && (napr[0].last_seen || napr[0].ts);
    if (zadnji) vrstice.push(["Zadnji signal", timeAgo(zadnji)]);
  }
  return vrstice;
}

function renderActiveNav() {
  document.querySelectorAll(".nav-item[data-view]").forEach((b) =>
    b.classList.toggle("active", b.dataset.view === S.view));
  const titles = { status: "Status", events: "Eventi", trends: "Trendi", reports: "Poročila", fleet: "Fleet", diagnostics: "Diagnostika", audit: "Audit log", settings: "Nastavitve" };
  const t = document.getElementById("viewTitle");
  if (t) t.textContent = titles[S.view] || "HALO";
}

function topControls(html) { document.getElementById("topControls").innerHTML = html || ""; }
function main() { return document.getElementById("main"); }
// Skeleton je za PRVI obisk pogleda, ko res ni kaj pokazati. Ob vsakem
// naslednjem obisku stara vsebina ostane in se samo rahlo zamegli -- prej je
// vsaka menjava izgledala, kot da se plosca nalaga od zacetka.
// Med nalaganjem se RISE MERITEV: vrsta blokovnih znakov, ki tece cez zaslon
// kot sled na grafu, s svetlejso konico spredaj. Vrteci se kolo je znak
// katerekoli aplikacije; to je znak TE aplikacije -- plosca, ki meri, med
// cakanjem nariše meritev. Skeleton smo opustili ze prej, ker je posnemal
// postavitev, ki je se ni bilo.
// Val je iz PIK, ne iz blokov: brajeve celice se polnijo od spodaj navzgor,
// zato vsak stolpec izgleda kot kupcek pik in ne kot stolpec grafa.
const NAL_ZNAKI = "⣀⣤⣶⣿";
const NAL_SIRINA = 34;
let _nalTimer = 0;

function nalagalnikTece(el) {
  clearInterval(_nalTimer);
  if (REDUCED || PREFS.motion === "off") {
    el.textContent = NAL_ZNAKI[1].repeat(NAL_SIRINA);
    return;
  }
  let t = 0;
  const risi = () => {
    if (!el.isConnected) { clearInterval(_nalTimer); return; }
    const glava = t % (NAL_SIRINA + 10);            // konica potuje cez rob
    let vrstica = "";
    for (let x = 0; x < NAL_SIRINA; x++) {
      // dve valovanji razlicnih dolzin -- sled ni pravilna in zato ni videti
      // kot animacija, ampak kot meritev
      const v = Math.sin((x + t) * 0.34) * 0.5 + Math.sin((x - t) * 0.17) * 0.32;
      const i = Math.round((v + 0.82) / 1.64 * (NAL_ZNAKI.length - 1));
      // pred konico sledi se ni -- prazno mesto, ne nizka pika
      vrstica += x > glava ? " "
        : NAL_ZNAKI[Math.max(0, Math.min(NAL_ZNAKI.length - 1, i))];
    }
    el.textContent = vrstica;
    el.dataset.glava = String(Math.min(glava, NAL_SIRINA));
    t++;
  };
  risi();
  _nalTimer = setInterval(risi, 90);      // 11 slicic na sekundo: risba, ne film
}

function spin() {
  const m = main();
  m.classList.remove("nalaga");
  m.innerHTML =
    '<div class="nalaganje">' +
      '<pre class="nal-trak" aria-hidden="true"></pre>' +
      '<span>Nalagam…</span>' +
    "</div>";
  nalagalnikTece(m.querySelector(".nal-trak"));
  if (REDUCED || PREFS.motion === "off") return;
  m.firstElementChild.animate(
    [{ opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)" }],
    { duration: 420, easing: "cubic-bezier(0.16, 1, 0.22, 1)", fill: "backwards", delay: 120 });
}

function fail(e) {
  const offline = e && (e.status === undefined || e.status === 0);
  main().innerHTML = `<div class="error-state">
    <b>${offline ? "Ni povezave s strežnikom" : "Napaka pri nalaganju"}</b>
    <span class="muted">${esc(e.message || e)} — poskusi osvežiti pogled.</span>
  </div>`;
}

// ---------- Apple-like dropdown (frosted meni, spring odpiranje) ----------
function dd(id) { return `<div class="dd" id="${id}"></div>`; }

function setupDD(id, options, value, onChange) {
  const root = document.getElementById(id);
  if (!root) return;
  const cur = options.find((o) => String(o.v) === String(value)) || options[0];
  root.innerHTML = `
    <button class="dd-btn" type="button" aria-haspopup="listbox">
      <span>${esc(cur ? cur.l : "—")}</span>
      <svg class="chev" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>`;
  const btn = root.querySelector(".dd-btn");
  let menu = null;

  const onDoc = (e) => {
    if (root.contains(e.target)) return;
    if (menu && menu.contains(e.target)) return;
    close();
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  // meni zapre le drsenje STRANI, ne drsenje po samem meniju
  const onScroll = (e) => {
    const t = e.target;
    // contains() sprejme le vozlišče; ob drsenju strani je target lahko
    // window ali document, kar bi vrglo napako in meni bi ostal odprt
    if (menu && t && t.nodeType === 1 && menu.contains(t)) return;
    close();
  };
  function close() {
    root.classList.remove("open");
    if (menu) {
      const m = menu; menu = null;
      m.classList.remove("open");
      setTimeout(() => m.remove(), 220);
    }
    document.removeEventListener("pointerdown", onDoc);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("scroll", onScroll, true);
    window.removeEventListener("resize", close);
  }
  function open() {
    document.querySelectorAll(".dd-menu").forEach((m) => m.remove());
    document.querySelectorAll(".dd.open").forEach((d) => d.classList.remove("open"));
    // meni gre v <body>, ne v .dd — tako ni ujet v backdrop-root topbara
    menu = document.createElement("div");
    menu.className = "dd-menu";
    menu.setAttribute("role", "listbox");
    menu.innerHTML = options.map((o) => `<button type="button" class="dd-opt${String(o.v) === String(value) ? " sel" : ""}" data-v="${esc(o.v)}" role="option">
        <span>${esc(o.l)}</span>
        ${String(o.v) === String(value) ? '<svg class="check" viewBox="0 0 12 10"><path d="M1 5l3.5 3.5L11 1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ""}
      </button>`).join("");
    document.body.appendChild(menu);
    const r = btn.getBoundingClientRect();
    menu.style.minWidth = Math.max(168, Math.round(r.width)) + "px";
    // dolgi seznami (datumi, ure) morajo biti drsljivi in znotraj zaslona
    const below = innerHeight - r.bottom - 16, above = r.top - 16;
    const flip = below < 220 && above > below;
    menu.style.maxHeight = Math.round(Math.min(420, flip ? above : below)) + "px";
    menu.style.overflowY = "auto";
    const mh = menu.getBoundingClientRect().height;
    menu.style.top = Math.round(flip ? Math.max(8, r.top - mh - 7) : r.bottom + 7) + "px";
    const mw = menu.getBoundingClientRect().width;
    menu.style.left = Math.round(Math.max(8, Math.min(r.right - mw, innerWidth - mw - 8))) + "px";
    menu.style.transformOrigin = flip ? "bottom right" : "top right";
    root.classList.add("open");
    void menu.offsetWidth;          // vsili preracun, da se prehod se izvede
    menu.classList.add("open");
    menu.querySelectorAll(".dd-opt").forEach((o) =>
      o.addEventListener("click", () => {
        const v = o.dataset.v;
        close();
        // Napis gumba mora slediti izbiri. Klicatelji, ki prerisejo cel
        // pogled, ga postavijo znova, pri tistih, ki samo osvezijo vsebino
        // (nastavitve, izbira dneva), pa je prej ostal star.
        const izbrana = options.find((x) => String(x.v) === String(v));
        if (izbrana) {
          value = v;
          const sp = btn.querySelector("span");
          if (sp) sp.textContent = izbrana.l;
        }
        onChange(v);
      }));
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
  }
  btn.addEventListener("click", () => (menu ? close() : open()));
}

function renderView() {
  const fn = { status: viewStatus, events: viewEvents, trends: viewTrends, reports: viewReports, fleet: viewFleet, diagnostics: viewDiagnostics, audit: viewAudit, settings: viewSettings }[S.view];
  if (fn) fn();
}

// ---------- Status ----------
async function loadOverview(silent) {
  try {
    S.overview = await apiGet("/api/v2/overview");
    applyMood();
    checkNewAlarms();
    novaMeritev();
    if (S.view === "status") renderStatus();
  } catch (e) { if (!silent) fail(e); }
}

// Nova meritev je dogodek, ne ura: graf se osvezi TAKOJ, ko naprava javi, in
// ne cez svoj interval. Tako utrip na grafu pomeni "prisla je meritev" in ne
// "minilo je deset sekund".
function novaMeritev() {
  const d = (S.overview && S.overview.devices) || [];
  const ts = d.reduce((n, x) => {
    const t = x.last_seen || x.ts || "";
    return t > n ? t : n;
  }, "");
  if (!ts || ts === S._zadnjaMeritev) return;
  const prva = !S._zadnjaMeritev;
  S._zadnjaMeritev = ts;
  if (!prva && typeof S.onMeritev === "function") S.onMeritev();
}

// Ozadje dobi komaj zaznan barvni ton glede na stanje sistema.
function applyMood() {
  if (!S.overview) return;
  document.documentElement.dataset.mood = statusHeadline(S.overview).cls;
}

// Toast ob novem alarmu (in ob prehodu v alarmno stanje).
function checkNewAlarms() {
  const sm = S.overview?.summary || {};
  const n = Number(sm.alerts_today || 0);
  const w = Number(sm.warnings_today || 0);
  const prev = S._prevAlarms, prevW = S._prevWarn;
  S._prevAlarms = n; S._prevWarn = w;
  if (PREFS.alerts === "off" || prev === undefined) return;
  if (n > prev) {
    const reason = S.overview?.status?.reason || "Preveri seznam dogodkov.";
    toast("alarm", `Nov alarm (${n - prev})`, reason, () => openAlarmsDetail());
  } else if (w > prevW) {
    toast("warning", "Novo opozorilo", S.overview?.status?.reason || "", () => openAlarmsDetail());
  }
}
function viewStatus() {
  topControls("");
  SUM.day = "";                  // ob vsakem vstopu povzetek kaze danasnji dan
  SUM.data = null;
  if (!S.overview) spin();
  loadOverview(false);
}
// Kaj tocno je narobe. Prej je v traku pisalo samo "Temp_C" -- ime stolpca v
// bazi, ki uporabniku ne pove niti, v katero smer je vrednost usla, kaj sele
// za koliko. Tu iz zadnjih vrednosti in mej izracunamo, katera meritev je cez,
// v katero smer in za koliko.
function krivci(o) {
  const lat = o.latest || {};
  const thr = o.metric_thresholds || {};
  const imena = String((o.status || {}).reason || "")
    .split(/[,;]/).map((x) => x.trim().toLowerCase()).filter(Boolean);
  const out = [];
  for (const ime of imena) {
    const key = METRIC_BY_KEY[ime] ? ime : Object.keys(METRIC_BY_KEY)
      .find((k) => k === ime || (METRIC_BY_KEY[k].label || "").toLowerCase() === ime);
    if (!key) continue;
    const m = METRIC_BY_KEY[key];
    const v = lat[key];
    const t = thr[key] || {};
    if (v == null) continue;
    let meja = null, smer = null, stopnja = "warning";
    if (t.alert_high != null && v >= t.alert_high) { meja = t.alert_high; smer = "up"; stopnja = "alert"; }
    else if (t.alert_low != null && v <= t.alert_low) { meja = t.alert_low; smer = "down"; stopnja = "alert"; }
    // Pravila naprave so ">=" -- pri natanko 27,0 °C z mejo 27,0 naprava ze
    // javi opozorilo, zato mora tudi razlaga tu prijeti, sicer ostane brez
    // stevilke ("izven pricakovanega"), kar ne pove nicesar.
    else if (t.warning_high != null && v >= t.warning_high) { meja = t.warning_high; smer = "up"; }
    else if (t.warning_low != null && v <= t.warning_low) { meja = t.warning_low; smer = "down"; }
    out.push({ key, label: m.label || key, unit: m.unit || "", dp: m.dp == null ? 1 : m.dp,
               value: v, limit: meja, dir: smer, lvl: stopnja,
               over: meja == null ? null : Math.abs(v - meja) });
  }
  return out;
}

// "Temperatura je 2,1 °C nad mejo" -- smer, koliko in cesa. Brez tega je
// opozorilo samo barva.
function krivecStavek(k) {
  const e = k.unit ? " " + k.unit : "";
  if (k.limit == null) return k.label + " je izven pričakovanega območja.";
  const kam = k.dir === "up" ? "nad" : "pod";
  return k.label + " je " + num(k.over, k.dp) + e + " " + kam + " mejo " +
    "(" + num(k.value, k.dp) + e + ", meja " + num(k.limit, k.dp) + e + ")";
}

const KRIV_PUSCICA = (d) => (d === "up" ? "▲" : d === "down" ? "▼" : "•");

function statusHeadline(o) {
  const st = o.status || {}, sm = o.summary || {};
  if (!sm.online) return { cls: "warning", head: "Ni sveže povezave", sub: st.reason || "Zadnji heartbeat je starejši od 2 minut." };
  const k = krivci(o);
  const povzetek = k.length
    ? k.map((x) => KRIV_PUSCICA(x.dir) + " " + krivecStavek(x)).join(" · ")
    : null;
  if (st.level === "alert") {
    return { cls: "alert", head: "Aktiven alarm",
             sub: povzetek || st.reason || "Sprožen dogodek.", krivci: k };
  }
  if (st.level === "warning") {
    return { cls: "warning", head: "Opozorilo",
             sub: povzetek || st.reason || "Vrednost blizu meje.", krivci: k };
  }
  return { cls: "ok", head: "Vse v redu", sub: "Vsi senzorji v dosegu, brez aktivnih alarmov.", krivci: [] };
}
const devLevel = (d) => !d.online ? "off" : d.status.level === "alert" ? "alert" : d.status.level === "warning" ? "warning" : "ok";
const devLabel = (d) => !d.online ? "Offline" : d.status.level === "alert" ? "Alarm" : d.status.level === "warning" ? "Opozorilo" : "V redu";

function renderStatus() {
  const o = S.overview; const sm = o.summary || {};
  const { cls, head, sub } = statusHeadline(o);

  const devices = o.devices || [];
  const devRows = devices.length ? devices.map((d) =>
    `<div class="device-row" data-detail="device" data-name="${esc(d.name)}">
      <div><div class="name">${esc(d.name)}</div><div class="loc">zadnji signal ${timeAgo(d.last_seen)}</div></div>
      <div class="spacer"></div>
      <div class="muted" style="font-size:12px">AQI ${num(d.aqi, 0)} · CO₂ ${num(d.co2eq, 0)}</div>
      <span class="pill ${devLevel(d)}">${devLabel(d)}</span>
    </div>`).join("") : '<div class="empty">Ni naprav v tem obsegu.</div>';

  const lat = o.latest || {};
  const m = main();

  // Živa posodobitev: če Status že stoji, ne re-renderiramo DOM-a, ampak
  // banner prevežemo in številke mehko tweenamo do novih vrednosti.
  if (m.dataset.view === "status" && m.querySelector("[data-stat]")) {
    const banner = m.querySelector(".health-banner");
    if (banner) {
      banner.className = `health-banner ${cls}`;
      banner.querySelector("h2").textContent = head;
      banner.querySelector("p").textContent = sub;
    }
    tweenStat(m, "total", sm.total_today);
    tweenStat(m, "alerts", sm.alerts_today);
    tweenStat(m, "aqi", lat.aqi);
    tweenStat(m, "co2", lat.co2eq);
    loadNotifications();           // zvonec sledi zivemu stanju (interno omejen)
    sumMaybeRefresh();             // povzetek dneva se cez dan dopolnjuje
  const av = m.querySelector('[data-stat="alerts"] .value');
    if (av) av.classList.toggle("alert-v", (sm.alerts_today || 0) > 0);
    const dl = m.querySelector("#devList");
    if (dl) dl.innerHTML = devRows;
    return;
  }

  m.innerHTML = `
    <div class="health-banner ${cls}" data-detail="status">
      <div class="hero-ring"><i class="halo2"></i><i class="halo1"></i><i class="core"></i></div>
      <div><h2>${esc(head)}</h2><p>${esc(sub)}</p></div>
    </div>
    <div class="card ai-sum" id="aiSummary"></div>
    <div class="grid cols-4">
      ${statTile("Heartbeati danes", sm.total_today, { key: "total" })}
      ${statTile("Alarmi danes", sm.alerts_today, {
        key: "alerts", alert: (sm.alerts_today || 0) > 0, detail: "alarms",
        hint: (sm.warnings_today || 0) > 0 ? `+ ${sm.warnings_today} opozoril · klik za seznam` : "klik za seznam",
      })}
      ${statTile("AQI (zadnji)", lat.aqi, { key: "aqi" })}
      ${statTile("CO₂eq (zadnji)", lat.co2eq, { key: "co2", unit: "ppm" })}
    </div>
    <div class="section-title">Naprave po lokaciji</div>
    <div class="card" id="devList">${devRows}</div>`;
  sumMount();
}

function statTile(label, value, opts = {}) {
  const { key = "", unit = "", alert = false, dp = 0, detail = "", hint = "" } = opts;
  const isNum = value !== null && value !== undefined && !Number.isNaN(Number(value));
  const shown = isNum ? num(value, dp) : (value ?? "—");
  return `<div class="card stat"${key ? ` data-stat="${key}"` : ""}${detail ? ` data-detail="${detail}" style="cursor:pointer"` : ""}>
    <div class="label">${esc(label)}</div>
    <div class="value${alert ? " alert-v" : ""}"><span class="v" data-v="${isNum ? Number(value) : ""}">${esc(shown)}</span>${unit ? `<small>${esc(unit)}</small>` : ""}</div>
    ${hint ? `<div class="trend">${esc(hint)}</div>` : ""}</div>`;
}

const humanDur = (s) => {
  if (s == null) return "—";
  if (s < 60) return `${Math.round(s)} s`;
  if (s < 3600) {
    const m0 = Math.round(s / 60);
    return m0 >= 60 ? "1 h" : `${m0} min`;      // 3599 s ni "60 min"
  }
  let h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
  if (m === 60) { h += 1; m = 0; }              // 7199 s je "2 h", ne "1 h 60 min"
  return m ? `${h} h ${m} min` : `${h} h`;
};

// ---------- Povzetek dneva ----------
// Prebere /api/v2/daily-summary in ga pove v cloveskem jeziku. Cez dan se
// sam osvezuje; ob vsakem vstopu v Status se vrne na DANASNJI dan, tudi ce
// si prej gledal nazaj.
const SUM = { day: "", data: null, at: 0, loading: false, seq: 0 };
const SUM_REFRESH_MS = 120000;        // povzetek je drag (~1 s), zato redkeje

const SPARK = '<svg class="ai-star" viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M12 2c.6 5.2 4.8 9.4 10 10-5.2.6-9.4 4.8-10 10-.6-5.2-4.8-9.4-10-10 5.2-.6 9.4-4.8 10-10z"/></svg>';

function sumStars() {
  return '<span class="ai-stars" aria-hidden="true">' +
    '<i class="s1">' + SPARK + "</i>" +
    '<i class="s2">' + SPARK + "</i>" +
    '<i class="s3">' + SPARK + "</i></span>";
}

function sumSkeleton() {
  return '<div class="ai-sk"><div class="skeleton" style="height:15px;width:62%"></div>' +
    '<div class="skeleton" style="height:12px;width:92%"></div>' +
    '<div class="skeleton" style="height:12px;width:78%"></div></div>';
}

// Sestavi ogrodje kartice (glava z dnevom ostane, vsebina se menja).
function sumMount() {
  const host = document.getElementById("aiSummary");
  if (!host) return;
  host.innerHTML =
    '<div class="ai-wash"><i class="b"></i><i class="f1"></i><i class="f2"></i></div>' +
    '<div class="ai-head">' + sumStars() +
      '<div class="ai-title">Povzetek dneva</div>' +
      '<div class="ai-day">' + dd("sumDay") + "</div>" +
    "</div>" +
    '<div class="ai-body" id="sumBody">' + (SUM.data ? "" : sumSkeleton()) + "</div>" +
    '<div class="ai-stars-br">' + sumStars() + "</div>";
  // setupDD ne osvezuje svojega napisa -- drugi klicatelji po izbiri prerisejo
  // cel pogled, tu pa se menja samo vsebina, zato ga po izbiri postavimo znova
  const bindDay = () => setupDD("sumDay", lastDaysOptions(30), SUM.day, (v) => {
    SUM.day = v; SUM.data = null;
    bindDay();
    sumLoad(true);
  });
  bindDay();
  if (SUM.data) sumPaint(SUM.data);
  sumLoad(!SUM.data);
}

async function sumLoad(force) {
  const host = document.getElementById("sumBody");
  if (!host) return;
  if (SUM.loading) return;
  if (!force && Date.now() - SUM.at < SUM_REFRESH_MS) return;
  SUM.loading = true;
  const seq = ++SUM.seq;
  if (SUM.data) host.classList.add("refreshing");     // stara vsebina se zamegli
  let d = null;
  try {
    d = await apiGet("/api/v2/daily-summary" + (SUM.day ? "?date=" + SUM.day : ""));
  } catch (e) {
    SUM.loading = false;
    if (seq !== SUM.seq) return;
    host.classList.remove("refreshing");
    if (!SUM.data) host.innerHTML = '<div class="ai-empty">Povzetka za ta dan ni bilo mogoče ' +
      "sestaviti." + (e && e.message ? ' <span class="muted">' + esc(e.message) + "</span>" : "") + "</div>";
    return;
  }
  SUM.loading = false;
  if (seq !== SUM.seq) return;          // vmes si izbral drug dan
  SUM.data = d; SUM.at = Date.now();
  host.classList.remove("refreshing");
  sumPaint(d);
}

const SUM_LEVEL = { alarm: "alert", warning: "warning", info: "info", ok: "ok" };

function sumPaint(d) {
  const host = document.getElementById("sumBody");
  if (!host) return;
  const s = d.summary || {};
  const card = document.getElementById("aiSummary");
  if (card) card.dataset.status = s.status || "ok";

  const hl = (s.highlights || []).map((h) => {
    const lvl = SUM_LEVEL[h.level] || "info";
    const kdaj = h.at ? clock(h.at) : "";
    return '<button class="ai-hl' + (h.at ? " go" : "") + '" type="button"' +
      (h.at ? ' data-at="' + esc(h.at) + '"' : " disabled") + '>' +
      '<span class="ai-dot ' + lvl + '"></span>' +
      '<span class="ai-hl-b"><span class="ai-hl-t">' + esc(h.title || "") +
        (kdaj ? '<span class="ai-hl-w">' + esc(kdaj) + "</span>" : "") + "</span>" +
      '<span class="ai-hl-x">' + esc(h.text || "") + "</span></span>" +
      (h.at ? '<span class="ai-go">→</span>' : "") + "</button>";
  }).join("");

  const osvezeno = d.generated_at ? clock(d.generated_at) : "";

  host.innerHTML =
    '<div class="ai-lead">' + esc(s.headline || "Ni posebnosti.") + "</div>" +
    (s.text ? '<div class="ai-text">\u00bb' + esc(s.text) + "\u00ab</div>" : "") +
    (hl ? '<div class="ai-hls">' + hl + "</div>" : "") +
    (osvezeno ? '<div class="ai-foot">' + esc(osvezeno) + "</div>" : "");

  if (!REDUCED && PREFS.motion !== "off") {
    blurIn(host.querySelector(".ai-lead"));
    const t = host.querySelector(".ai-text");
    if (t) setTimeout(() => blurIn(t), 70);
  }

  host.querySelectorAll(".ai-hl.go").forEach((b) =>
    b.addEventListener("click", () => {
      squish(b);
      const at = b.dataset.at;
      const dan = at.slice(0, 10);
      const danes = localISO(new Date()).slice(0, 10);
      setTimeout(() => openAlarmsDetail(dan === danes ? "" : dan, secOfDay(at), b), 120);
    }));
}

// Cez dan: osvezi, kadar gledas danasnji dan (starejsi dnevi se ne menjajo).
function sumMaybeRefresh() {
  if (SUM.day) return;
  sumLoad(false);
}

// ---------- Iskanje: ukazna plosca (Spotlight) ----------
// Plosca DELA TUDI BREZ strezniskega iskalnika: kar vmesnik ze ve (pogledi,
// meritve, nastavitve, naprave, dejanja), najde takoj in lokalno. Odgovor
// /api/v2/search se doda kot kartica na vrh, ce endpoint obstaja; ce ga ni,
// se tiho preskoci in plosca dela naprej.
const SEARCH = { panel: null, back: null, sel: 0, rows: [], timer: 0, abort: null,
                 answer: null, serverRows: [], index: null, q: "", seq: 0 };
const RECENT_KEY = "halo-search-recent";

const sNorm = (s) => (s || "").toString().toLowerCase()
  .replace(/[čć]/g, "c").replace(/š/g, "s").replace(/ž/g, "z").replace(/đ/g, "d")
  .replace(/[.,;:!?/()"'’\-_]+/g, " ").replace(/\s+/g, " ").trim();

// Kako ljudje res govorijo -- register metrik teh besed ne pozna.
const SYN = {
  pm25: ["trdi delci", "delci", "prah", "dim", "particles"],
  pm1: ["trdi delci", "delci", "prah"],
  pm10: ["trdi delci", "delci", "prah"],
  co2eq: ["co2", "ogljikov dioksid", "zatohlo", "tezek zrak", "prezracevanje"],
  tvoc: ["hlapne snovi", "smrad", "vonj", "zaudarja", "voc"],
  co: ["ogljikov monoksid", "zastrupitev"],
  nh3: ["amonijak", "amoniak"],
  noise: ["hrup", "glasno", "decibeli", "kricanje"],
  temp_c: ["temperatura", "vroce", "mrzlo", "toplo"],
  rh: ["vlaga", "vlazno", "suho"],
  lux: ["svetloba", "luc", "temno", "osvetlitev"],
  aqi: ["kakovost zraka", "zrak"],
  vape: ["vaping", "elektronska cigareta", "vejp"],
  smoking: ["kajenje", "cigareta", "kadil", "dim"],
  health_index: ["zdravje", "indeks"],
};

const SET_ROWS = [
  ["setTheme", "Tema", "Svetla, temna ali po sistemu", ["tema", "temno", "svetlo", "dark", "light"]],
  ["setAccent", "Poudarna barva", "Barva poudarkov in grafov", ["barva", "accent"]],
  ["setGlass", "Liquid glass", "Steklen material", ["steklo", "glass"]],
  ["setMotion", "Animacije", "Gibanje in prehodi", ["animacije", "gibanje", "motion"]],
  ["setSparkle", "Bleščice ob kliku", "Iskrice okoli kazalca", ["blescice", "iskrice", "sparkle"]],
  ["setCursorLight", "Svetloba ob kazalcu", "Luč sledi miški", ["svetloba", "luc", "kazalec"]],
  ["setDensity", "Gostota", "Razmik med elementi", ["gostota", "zgosceno", "compact"]],
  ["setAlerts", "Obvestila ob alarmu", "Sporočilo v kotu, po želji z zvokom", ["obvestila", "zvok", "alarm"]],
  ["setScrollNav", "Preklop pogleda z drsenjem", "Drsenje odpre naslednji pogled", ["drsenje", "scroll"]],
  ["setHome", "Privzeti pogled", "Kam se odpre ob zagonu", ["privzeti", "zagon", "home"]],
  ["setPoll", "Osveževanje statusa", "Interval osveževanja", ["osvezevanje", "interval", "poll"]],
  ["setSvg", "HALO SVG prikaz", "Grafični prikaz senzorja", ["svg", "prikaz", "senzor"]],
];

const VIEW_HINT = {
  status: ["status", "pregled", "zdaj", "trenutno"],
  events: ["eventi", "dogodki", "zapisi", "log"],
  trends: ["trendi", "grafi", "graf", "zgodovina", "chart"],
  reports: ["porocila", "porocilo", "mesecno", "izvoz", "pdf"],
  fleet: ["fleet", "flota", "naprave"],
  diagnostics: ["diagnostika", "tezave", "napake"],
  audit: ["audit", "revizija"],
  settings: ["nastavitve", "settings", "moznosti"],
};

// Indeks se sestavi ob ODPRTJU, ne ob vsakem pritisku tipke.
function buildIndex() {
  const out = [];
  navList().forEach(([id, label, ic]) => out.push({
    kind: "view", id, title: label, sub: "Pogled", icon: ic,
    keys: [label, id, ...(VIEW_HINT[id] || [])],
  }));
  METRICS.forEach(([v, l]) => {
    const m = METRIC_BY_KEY[v] || {};
    out.push({ kind: "metric", id: v, title: l, icon: "trends",
      sub: m.explain || "Graf meritve",
      keys: [l, v, ...(SYN[v] || []), m.unit || ""] });
  });
  if (S.role === "staff") SET_ROWS.forEach(([id, title, sub, keys]) =>
    out.push({ kind: "setting", id, title, sub: "Nastavitev · " + sub, icon: "settings", keys }));
  (S.overview?.devices || []).forEach((d) => out.push({
    kind: "device", id: d.name, title: d.name, icon: "status",
    sub: "Naprava" + (d.location ? " · " + d.location : ""), keys: [d.name, d.location || ""] }));
  out.push(
    { kind: "action", id: "alarms", title: "Alarmi danes", icon: "status",
      sub: "Odpri časovni stroj", keys: ["alarmi", "danes", "casovni stroj", "nazaj v cas"],
      run: () => openAlarmsDetail() },
    { kind: "action", id: "notif", title: "Obvestila", icon: "bell",
      sub: "Odpri center obvestil", keys: ["obvestila", "zvonec", "notifications"],
      run: () => openNotifications() },
    { kind: "action", id: "theme", title: "Preklopi temo", icon: "settings",
      sub: "Svetla ↔ temna", keys: ["tema", "temno", "svetlo", "dark mode"],
      run: () => { PREFS.theme = resolveTheme() === "dark" ? "light" : "dark";
        savePrefs(); applyPrefs(); } },
  );
  return out;
}

function scoreTarget(t, q, words) {
  const title = sNorm(t.title);
  if (title === q) return 1;
  if (title.startsWith(q)) return 0.9;
  let best = title.includes(q) ? 0.6 : 0;
  for (const k of t.keys || []) {
    const n = sNorm(k);
    if (!n) continue;
    if (n === q) best = Math.max(best, 0.78);
    else if (n.startsWith(q)) best = Math.max(best, 0.68);
    else if (n.includes(q)) best = Math.max(best, 0.55);
  }
  const ini = title.split(" ").map((w) => w[0]).join("");     // "kz" -> "Kakovost zraka"
  if (q.length >= 2 && ini.startsWith(q)) best = Math.max(best, 0.45);
  if (words.length > 1) {
    const hay = title + " " + (t.keys || []).map(sNorm).join(" ");
    const hits = words.filter((w) => hay.includes(w)).length;
    if (hits === words.length) best = Math.max(best, 0.62);
    else best += Math.min(0.15, 0.05 * hits);
  }
  return best;
}

const KIND_LABEL = { event: "Dogodki", view: "Pogledi", metric: "Meritve",
  setting: "Nastavitve", device: "Naprave", action: "Dejanja", recent: "" };

const recentSearches = () => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
};
function pushRecent(q) {
  if (!q || q.length < 2) return;
  try {
    localStorage.setItem(RECENT_KEY,
      JSON.stringify([q, ...recentSearches().filter((x) => x !== q)].slice(0, 5)));
  } catch {}
}

function openSearch() {
  if (SEARCH.panel) return;
  SEARCH.index = buildIndex();
  SEARCH.answer = null; SEARCH.serverRows = []; SEARCH.q = "";
  SEARCH.chart = null; SEARCH.pick = null;
  const back = document.createElement("div");
  back.className = "cmdk-back";
  const p = document.createElement("div");
  p.className = "cmdk";
  p.innerHTML =
    '<div class="cmdk-bar">' +
      '<svg class="cmdk-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16.6 16.6L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '<input id="cmdkInput" type="text" autocomplete="off" spellcheck="false" ' +
        'placeholder="Išči karkoli — ali vprašaj, npr. »a je kdo kadil«">' +
      '<span class="cmdk-spin" id="cmdkSpin" hidden></span>' +
      '<span class="cmdk-esc">esc</span>' +
    "</div>" +
    '<div class="cmdk-panel" id="cmdkPanel"><div class="cmdk-list" id="cmdkList"></div></div>';
  document.body.appendChild(back);
  document.body.appendChild(p);
  SEARCH.panel = p; SEARCH.back = back;
  void p.offsetWidth;
  back.classList.add("open");
  p.classList.add("open");

  const input = p.querySelector("#cmdkInput");
  input.focus();
  renderSearch("", true);
  input.addEventListener("input", () => {
    renderSearch(input.value);
    askServer(input.value);
  });
  p.querySelector("#cmdkList").addEventListener("click", (e) => {
    const row = e.target.closest(".cmdk-row");
    if (row) activateRow(Number(row.dataset.i));
  });
  p.querySelector("#cmdkList").addEventListener("pointermove", (e) => {
    const row = e.target.closest(".cmdk-row");
    if (!row) return;
    const i = Number(row.dataset.i);
    if (i !== SEARCH.sel) { SEARCH.sel = i; paintSelection(false); }
  });
  back.addEventListener("pointerdown", closeSearch);
  document.addEventListener("keydown", searchKeys, true);
}

function closeSearch() {
  const p = SEARCH.panel, b = SEARCH.back;
  if (!p) return;
  SEARCH.panel = null; SEARCH.back = null;
  if (SEARCH.abort) { SEARCH.abort.abort(); SEARCH.abort = null; }
  clearTimeout(SEARCH.timer);
  document.removeEventListener("keydown", searchKeys, true);
  p.classList.remove("open");
  if (b) b.classList.remove("open");
  setTimeout(() => { p.remove(); if (b) b.remove(); }, 240);
}

function searchKeys(e) {
  if (!SEARCH.panel) return;
  if (e.key === "Escape") { e.preventDefault(); closeSearch(); return; }
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    const n = SEARCH.rows.length;
    if (!n) return;
    SEARCH.sel = (SEARCH.sel + (e.key === "ArrowDown" ? 1 : -1) + n) % n;
    paintSelection(true);
    return;
  }
  if (e.key === "Enter") { e.preventDefault(); activateRow(SEARCH.sel); }
}

function paintSelection(scroll) {
  const list = document.getElementById("cmdkList");
  if (!list) return;
  list.querySelectorAll(".cmdk-row").forEach((el) => {
    const on = Number(el.dataset.i) === SEARCH.sel;
    el.classList.toggle("sel", on);
    if (on && scroll) el.scrollIntoView({ block: "nearest" });
  });
}

function activateRow(i) {
  const t = SEARCH.rows[i];
  if (!t) return;
  const input = document.getElementById("cmdkInput");
  if (t.kind === "recent") {                    // predlog samo napolni polje
    input.value = t.title;
    renderSearch(t.title); askServer(t.title);
    input.focus();
    return;
  }
  pushRecent(((input && input.value) || "").trim());
  closeSearch();
  if (t.kind === "view") location.hash = "#/" + t.id;
  else if (t.kind === "metric") {
    S.trend.metric = t.id;
    if (S.view === "trends") viewTrends(); else location.hash = "#/trends";
  } else if (t.kind === "setting") {
    if (S.view === "settings") focusSetting(t.id);
    else { location.hash = "#/settings"; setTimeout(() => focusSetting(t.id), 520); }
  } else if (t.kind === "device") openDeviceDetail(t.id);
  else if (t.kind === "action" && t.run) t.run();
  else if (t.kind === "event" && t.inc) { try { openIncidentDetail(t.inc); } catch {} }
}

function focusSetting(id) {
  const dd = document.getElementById(id);
  if (!dd) return;
  const row = dd.closest(".set-row") || dd;
  row.scrollIntoView({ block: "center", behavior: REDUCED ? "auto" : "smooth" });
  row.classList.add("set-focus");
  setTimeout(() => row.classList.remove("set-focus"), 2400);
}

// Visina plosce se ANIMIRA od stare do nove -- rezultati "zrastejo", ne
// poskocijo. Merimo dejansko visino seznama, ne ugibamo.
function growPanel(panel, list) {
  const to = Math.min(list.scrollHeight, Math.round(innerHeight * 0.52));
  if (REDUCED || PREFS.motion === "off") { panel.style.height = to + "px"; return; }
  // Prejsnjo animacijo je treba USTAVITI, sicer se ob hitrem tipkanju
  // nakopicijo in vsaka nova izmeri zacetek sredi prejsnje -- plosca bi se
  // vedno znova sesedala proti nic.
  panel.getAnimations().forEach((a) => a.cancel());
  const from = panel.getBoundingClientRect().height;
  panel.style.height = to + "px";
  if (Math.abs(to - from) < 2) return;
  panel.animate([{ height: from + "px" }, { height: to + "px" }],
    { duration: 260, easing: "cubic-bezier(0.16, 1, 0.22, 1)" });
}

function renderSearch(raw, first) {
  const list = document.getElementById("cmdkList");
  const panel = document.getElementById("cmdkPanel");
  if (!list || !panel) return;
  const q = sNorm(raw);
  if (!first && q === SEARCH.q && !SEARCH.dirty) return;   // brez odvecnega izrisa
  SEARCH.q = q; SEARCH.dirty = false; SEARCH.qRaw = raw;
  SEARCH.rows = [];
  let html = "";

  if (SEARCH.answer) {
    const a = SEARCH.answer;
    const cls = a.verdict === "yes" ? "yes" : a.verdict === "no" ? "no" : "maybe";
    const nadalj = (a.suggested_followups || []).slice(0, 3);
    html += '<div class="cmdk-answer ' + cls + '">' +
      '<div class="ca-head">' + esc(a.headline || "") + "</div>" +
      // Iskalni motor dobi obsiren opis (do 15 vrstic s stevilkami za vsako
      // meritev), v oknu pa hocemo videti samo bistvo -- zato "detail_short",
      // kadar obstaja.
      (a.detail_short || a.detail
        ? '<div class="ca-detail">' + esc(a.detail_short || a.detail) + "</div>" : "") +
      // ce jih je vec, kot jih pokazemo, to povej -- sicer je videti, kot da
      // jih je bilo res samo pet
      (a.events_truncated && a.total_events
        ? '<div class="ca-more">prikazanih ' + (a.events || []).length + " od " +
          a.total_events + " dogodkov</div>" : "") +
      (nadalj.length ? '<div class="ca-next">' + nadalj.map((f, i) =>
        '<button class="ca-chip" type="button" data-f="' + i + '">' +
        esc(f.label) + "</button>").join("") + "</div>" : "") +
      "</div>";
  }
  // Nastavljiv zadetek: kaj gledamo, kako in kdaj -- vse troje se da zamenjati
  // brez novega tipkanja.
  if (SEARCH.chart && SEARCH.pick) {
    const o = SEARCH.chart.options || {};
    html += '<div class="cmdk-chart" id="cmdkChart">' +
      '<div class="cc-head">' + esc(chartNaslov()) + "</div>" +
      '<div class="cc-ctl">' + dd("ccMetric") + dd("ccView") + dd("ccRange") +
        '<button class="btn primary cc-open" type="button">Odpri</button>' +
      "</div></div>";
    SEARCH._ddOpts = {
      metric: o.metric || [], view: o.view || [], range: o.range || [],
    };
  }

  if (!q) {
    const rec = recentSearches();
    const blok = (naslov, arr, ic) => {
      if (!arr.length) return "";
      let h = '<div class="cmdk-sec">' + naslov + "</div>";
      arr.forEach((s) => {
        SEARCH.rows.push({ kind: "recent", title: s });
        h += rowHtml({ kind: "recent", title: s, sub: "", icon: ic }, SEARCH.rows.length - 1);
      });
      return h;
    };
    html += blok("Nazadnje iskano", rec, "events");
    html += blok("Poskusi", ["a je kdo kadil", "kaj se je zgodilo včeraj", "PM2.5",
      "temna tema", "alarmi danes"], "trends");
  } else {
    const words = q.split(" ").filter(Boolean);
    const hits = (SEARCH.index || [])
      .map((t) => ({ t, s: scoreTarget(t, q, words) }))
      .filter((x) => x.s >= 0.35)
      .sort((a, b) => b.s - a.s)
      .slice(0, 24);
    const all = [...SEARCH.serverRows.map((t) => ({ t, s: 2 })), ...hits];
    if (!all.length) {
      html += '<div class="cmdk-empty">Nič ne ustreza.<span>Poskusi z imenom meritve, ' +
        "naprave ali nastavitve — ali kar vprašaj.</span></div>";
    } else {
      let last = "";
      all.forEach(({ t }) => {
        if (t.kind !== last) {
          html += '<div class="cmdk-sec">' + (KIND_LABEL[t.kind] || "Ostalo") + "</div>";
          last = t.kind;
        }
        SEARCH.rows.push(t);
        html += rowHtml(t, SEARCH.rows.length - 1);
      });
    }
  }
  list.innerHTML = html;
  SEARCH.sel = 0;
  paintSelection(false);

  // predlogi za naprej
  list.querySelectorAll(".ca-chip").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      const f = (SEARCH.answer.suggested_followups || [])[Number(b.dataset.f)];
      if (!f) return;
      const inp = document.getElementById("cmdkInput");
      inp.value = f.query || f.label;
      renderSearch(inp.value); askServer(inp.value);
      inp.focus();
    }));

  if (SEARCH.chart && SEARCH.pick && SEARCH._ddOpts) {
    const o = SEARCH._ddOpts;
    setupDD("ccMetric", o.metric, SEARCH.pick.metric, (v) => {
      SEARCH.pick.metric = v; SEARCH.dirty = true; renderSearch(SEARCH.qRaw || "");
    });
    setupDD("ccView", o.view, SEARCH.pick.view, (v) => {
      SEARCH.pick.view = v; SEARCH.dirty = true; renderSearch(SEARCH.qRaw || "");
    });
    setupDD("ccRange", o.range, SEARCH.pick.range, (v) => {
      SEARCH.pick.range = v; SEARCH.dirty = true; renderSearch(SEARCH.qRaw || "");
    });
    const btn = list.querySelector(".cc-open");
    if (btn) btn.addEventListener("click", (e) => { e.stopPropagation(); applyChartPick(); });
  }
  growPanel(panel, list);
}

// katero obdobje iz razpona -- backend vrne meje, mi pa potrebujemo kljuc
function rangeKeyOf(r) {
  if (!r || !r.start || !r.end) return "24h";
  const ur = (new Date(r.end) - new Date(r.start)) / 36e5;
  if (ur <= 1.5) return "1h";
  if (ur <= 8) return "6h";
  if (ur <= 36) return "24h";
  if (ur <= 8 * 24) return "7d";
  return "30d";
}
const VIEW_LABEL = { chart: "Graf metrike", alarms: "Alarmi", deviations: "Odstopanja" };
function chartNaslov() {
  const p = SEARCH.pick, m = METRIC_BY_KEY[p.metric] || {};
  const r = (SEARCH._ddOpts && (SEARCH._ddOpts.range || []).find((x) => x.v === p.range)) || null;
  return (m.label || p.metric) + " · " + (VIEW_LABEL[p.view] || p.view) +
    " · " + (p.label || (r ? r.l : p.range));
}
// Odpre trende natanko s tem, kar je izbrano v menijih.
function applyChartPick() {
  const p = SEARCH.pick;
  if (!p) return;
  S.trend.metric = p.metric;
  S.trend.range = p.range;
  S.trend.mode = p.view === "alarms" ? "alarms" : p.view === "deviations" ? "dev" : "chart";
  if (p.end) {
    // konec obdobja je IZKLJUCUJOC (27. 7. -> 28. 7. 00:00), zato bi
    // neposredna pretvorba pristala na naslednjem dnevu
    const d = new Date(new Date(p.end).getTime() - 1000);
    S.trend.when = !isNaN(d) ? narrowAnchor(localISO(d), p.range) : "";
  }
  closeSearch();
  if (S.view === "trends") viewTrends(); else location.hash = "#/trends";
}

function rowHtml(t, i) {
  return '<button class="cmdk-row" type="button" data-i="' + i +
    '" style="--i:' + Math.min(i, 7) + '">' +
    '<span class="cr-ic">' + icon(t.icon || "events") + "</span>" +
    '<span class="cr-body"><span class="cr-title">' + esc(t.title) + "</span>" +
    (t.sub ? '<span class="cr-sub">' + esc(t.sub) + "</span>" : "") + "</span>" +
    '<span class="cr-go">↵</span></button>';
}

// Strezniski iskalnik je NEOBVEZEN: ce ga ni, se tiho preskoci.
function askServer(raw) {
  clearTimeout(SEARCH.timer);
  const q = (raw || "").trim();
  const spin = document.getElementById("cmdkSpin");
  if (q.length < 3) {
    SEARCH.chart = null;
    // Zahtevek v LETU je treba razveljaviti, sicer pozni odgovor prejsnjega
    // vprasanja pripise zadetke k novi, krajsi poizvedbi.
    SEARCH.seq++;
    if (SEARCH.abort) { SEARCH.abort.abort(); SEARCH.abort = null; }
    const imel = SEARCH.answer || SEARCH.serverRows.length;
    SEARCH.answer = null; SEARCH.serverRows = [];
    if (spin) spin.hidden = true;
    if (imel) { SEARCH.dirty = true; renderSearch(raw); }
    return;
  }
  SEARCH.timer = setTimeout(async () => {
    if (SEARCH.abort) SEARCH.abort.abort();
    SEARCH.abort = new AbortController();
    const seq = ++SEARCH.seq;
    if (spin) spin.hidden = false;
    try {
      const r = await fetch("/api/v2/search?q=" + encodeURIComponent(q),
        { signal: SEARCH.abort.signal, cache: "no-store" });
      if (!r.ok) throw new Error("ni iskalnika");
      const d = await r.json();
      if (seq !== SEARCH.seq || !SEARCH.panel) return;
      SEARCH.answer = d && d.answer ? d.answer : null;
      SEARCH.chart = ((d && d.results) || []).find((x) => x.kind === "chart") || null;
      if (SEARCH.chart) {
        // izbrano stanje drzimo lokalno, da ga meniji lahko spreminjajo
        SEARCH.sel = null;
        SEARCH.pick = {
          metric: SEARCH.chart.metric,
          view: SEARCH.chart.view || "chart",
          range: (SEARCH.chart.range && SEARCH.chart.range.key) || rangeKeyOf(SEARCH.chart.range),
          end: SEARCH.chart.range && SEARCH.chart.range.end,
          label: (SEARCH.chart.range && SEARCH.chart.range.label) || "",
        };
      }
      SEARCH.serverRows = (((d || {}).answer || {}).events || []).slice(0, 8).map((e) => ({
        kind: "event", icon: "events",
        title: e.label || SIG_LABEL[e.kind] || e.kind || "Dogodek",
        sub: (e.device_name ? e.device_name + " · " : "") + dateTime(e.started_at) +
          (e.confidence != null ? " · zaupanje " + Math.round(e.confidence * 100) + " %" : ""),
        inc: { s: e.started_at, e: e.ended_at, d: e.device_id, b: e.kind, l: e.label || e.kind },
      }));
    } catch {
      if (seq !== SEARCH.seq) return;
      SEARCH.answer = null; SEARCH.serverRows = []; SEARCH.chart = null;
    }
    if (spin) spin.hidden = true;
    const input = document.getElementById("cmdkInput");
    if (input && SEARCH.panel) { SEARCH.dirty = true; renderSearch(input.value); }
  }, 160);
}

const SIG_LABEL = { smoking: "Kajenje", vaping: "Vaping", spray: "Sprej",
  cooking: "Kuhanje", ventilation: "Prezračevanje", masking: "Zakrivanje senzorja",
  occupancy: "Zasedenost", unknown_spike: "Nenaden skok meritev" };

// ---------- Bliznjice ----------
// Ena crka brez modifikatorja, kot pri postnih odjemalcih: hitro in brez
// prepletanja z brskalnikovimi ukazi (Ctrl+T, Ctrl+R ... so njegovi in jih
// ne jemljemo). Delujejo samo, kadar ne pises in ni odprtega okna.
function preklopiTemo() {
  PREFS.theme = resolveTheme() === "dark" ? "light" : "dark";
  savePrefs(); applyPrefs();
  toast("info", "Tema", PREFS.theme === "dark" ? "Temna" : "Svetla");
}

const BLIZNJICE = [
  ["Iskanje", "Ctrl K", () => openSearch()],
  ["Status", "S", () => (location.hash = "#/status")],
  ["Eventi", "E", () => (location.hash = "#/events")],
  ["Trendi", "T", () => (location.hash = "#/trends")],
  ["Poročila", "P", () => (location.hash = "#/reports")],
  ["Nastavitve", "N", () => (location.hash = "#/settings")],
  ["Obvestila", "O", () => openNotifications()],
  ["Osveži podatke", "R", () => { loadOverview(); renderView(); }],
  ["Zamenjaj temo", "D", preklopiTemo],
  ["Vizitka", "V", () => document.querySelector(".viz-btn")?.click()],
  ["Seznam bližnjic", "?", () => odpriBliznjice()],
];
const BLIZ_PO_CRKI = new Map(
  BLIZNJICE.filter((b) => b[1].length === 1).map((b) => [b[1].toLowerCase(), b[2]]));

function odpriBliznjice() {
  openModal(
    '<button class="btn close">Zapri</button>' +
    '<h2 style="margin:0 0 4px">Bližnjice</h2>' +
    '<p class="muted" style="margin:0 0 16px;font-size:12.5px">Delujejo, ko ne pišeš v polje. ' +
      "Isti ukazi so tudi pod desnim klikom.</p>" +
    '<div class="bliz">' + BLIZNJICE.map(([ime, tipka]) =>
      '<div class="bliz-v"><span>' + esc(ime) + "</span><kbd>" + esc(tipka) + "</kbd></div>").join("") +
    "</div>");
}

document.addEventListener("keydown", (e) => {
  if (SEARCH.panel) return;
  const t = e.target, tag = (t && t.tagName) || "";
  const typing = tag === "INPUT" || tag === "TEXTAREA" || (t && t.isContentEditable);
  // Kadar kazalec stoji nad casovno osjo, iskanje pripada NJEJ: vprasanje se
  // odgovori tam, kjer gledas, namesto da bi cez zaslon padla paleta.
  const nadOsjo = () => document.body.dataset.tlNad === "1" && !document.querySelector(".modal-back");
  if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    if (nadOsjo()) document.dispatchEvent(new CustomEvent("tl:iskanje"));
    else openSearch();
    return;
  }
  if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "/" && !document.querySelector(".modal-back")) {
    e.preventDefault();
    if (nadOsjo()) document.dispatchEvent(new CustomEvent("tl:iskanje"));
    else openSearch();
    return;
  }
  if (e.key === "?") { e.preventDefault(); odpriBliznjice(); return; }
  if (document.querySelector(".modal-back")) return;   // v oknu naj crke molcijo
  const fn = BLIZ_PO_CRKI.get(String(e.key).toLowerCase());
  if (fn) { e.preventDefault(); fn(); }
});

// ---------- Center obvestil ----------
// Zvonec v glavi: kaj se je zgodilo in kaj od tega uporabnik se ni videl.
// Prebranost hranimo kot casovno crto (vse starejse od nje je videno) -- to
// je majhno, prezivi osvezitev in ne potrebuje zapisa na strezniku.
const NOTIF = { items: [], loaded: 0, menu: null, newAtOpen: new Set(), notices: [] };

// Obvestila, ki jih ustvari sam vmesnik (npr. da je zaradi hitrosti nekaj
// izklopil). Niso iz baze, zato zivijo loceno od dogodkov.
function pushNotice(naslov, besedilo) {
  if (NOTIF.notices.some((n) => n.title === naslov)) return;   // ne ponavljaj
  NOTIF.notices.unshift({ title: naslov, text: besedilo, at: new Date().toISOString() });
  paintNotif();
  toast("warning", naslov, besedilo);
}
const SEEN_KEY = "halo-seen-until";

function seenUntil() { try { return localStorage.getItem(SEEN_KEY) || ""; } catch { return ""; } }
function markSeen() {
  try { localStorage.setItem(SEEN_KEY, new Date().toISOString()); } catch {}
  paintNotif();
}
function incKey(i) { return i.started_at + "|" + i.base + "|" + i.device_id; }
function unseen() {
  const u = seenUntil();
  return NOTIF.items.filter((i) => !u || i.started_at > u);
}

async function loadNotifications(force) {
  if (!force && Date.now() - NOTIF.loaded < 45000) return;
  try {
    const d = await apiGet("/api/v2/incidents?kind=important&days=7");
    NOTIF.items = (d.incidents || []).slice()
      .sort((a, b) => (a.started_at < b.started_at ? 1 : -1));
    NOTIF.loaded = Date.now();
  } catch { /* zvonec ne sme podreti pogleda */ }
  paintNotif();
}

function paintNotif() {
  const n = unseen().length + NOTIF.notices.length;
  const badge = document.getElementById("notifBadge");
  if (badge) { badge.textContent = n > 9 ? "9+" : String(n); badge.hidden = n === 0; }
  const btn = document.getElementById("notifBtn");
  if (btn) btn.classList.toggle("has-new", n > 0);
  // pikica na kartici "Alarmi danes" -- prek <body>, da prezivi ponoven izris
  const today = localISO(new Date()).slice(0, 10);
  const novaDanes = unseen().some((i) => i.started_at.slice(0, 10) === today);
  if (document.body) document.body.classList.toggle("new-alarms", novaDanes);
}

function notifRow(i, novo) {
  const kdaj = new Date(i.started_at);
  const danes = localISO(new Date()).slice(0, 10) === i.started_at.slice(0, 10);
  const dan = danes ? "danes"
    : kdaj.toLocaleDateString("sl", { weekday: "short", day: "2-digit", month: "2-digit" });
  return '<button class="notif-item' + (novo ? " novo" : "") + '" type="button" data-inc="' +
    esc(JSON.stringify({ s: i.started_at, e: i.ended_at, d: i.device_id, b: i.base, l: i.label, t: i.tier })) + '">' +
    '<span class="ni-dot ' + (i.tier === "alarm" ? "alarm" : "warning") + '"></span>' +
    '<span class="ni-body"><span class="ni-title">' + esc(i.label) +
      (novo ? '<span class="ni-new">novo</span>' : "") + "</span>" +
      '<span class="ni-why">' + esc(i.why || "") + "</span></span>" +
    '<span class="ni-time">' + clock(i.started_at) + "<small>" + esc(dan) + "</small></span>" +
    "</button>";
}

function notifBody() {
  const sys = NOTIF.notices.length
    ? '<div class="notif-sec">Sistem · ' + NOTIF.notices.length + "</div>" +
      NOTIF.notices.map((n) =>
        '<div class="notif-item sys"><span class="ni-dot warning"></span>' +
        '<span class="ni-body"><span class="ni-title">' + esc(n.title) + "</span>" +
        '<span class="ni-why">' + esc(n.text) + "</span></span>" +
        '<span class="ni-time">' + clock(n.at) + "</span></div>").join("")
    : "";
  if (!NOTIF.items.length) {
    return sys + (sys ? "" : '<div class="notif-empty">Vse je mirno.<br><span>V zadnjih 7 dneh ni bilo ' +
      "alarmov ali opozoril.</span></div>");
  }
  return sys + notifBodyDogodki();
}

function notifBodyDogodki() {
  if (!NOTIF.items.length) {
    return '<div class="notif-empty">Vse je mirno.<br><span>V zadnjih 7 dneh ni bilo ' +
      "alarmov ali opozoril.</span></div>";
  }
  const today = localISO(new Date()).slice(0, 10);
  const novo = [], danes = [], prej = [];
  NOTIF.items.forEach((i) => {
    if (NOTIF.newAtOpen.has(incKey(i))) novo.push(i);
    else if (i.started_at.slice(0, 10) === today) danes.push(i);
    else prej.push(i);
  });
  const sec = (naslov, arr, jeNovo) => arr.length
    ? '<div class="notif-sec">' + naslov + " · " + arr.length + "</div>" +
      arr.map((i) => notifRow(i, jeNovo)).join("")
    : "";
  return sec("Novo", novo, true) + sec("Danes", danes, false) + sec("Zadnjih 7 dni", prej, false);
}

function openNotifications() {
  if (NOTIF.menu) { closeNotifications(); return; }
  const btn = document.getElementById("notifBtn");
  notifPeekHide();
  NOTIF.newAtOpen = new Set(unseen().map(incKey));
  const m = document.createElement("div");
  m.className = "notif-panel";
  m.innerHTML =
    '<div class="notif-head"><b>Obvestila</b>' +
      '<button class="notif-clear" type="button">Označi vse kot prebrano</button></div>' +
    '<div class="notif-list">' + notifBody() + "</div>" +
    '<div class="notif-foot">Zadnjih 7 dni · klikni vrstico za podrobnosti</div>';
  document.body.appendChild(m);
  NOTIF.menu = m;
  const r = btn.getBoundingClientRect();
  const w = Math.min(380, innerWidth - 16);
  m.style.width = w + "px";
  m.style.top = Math.round(r.bottom + 8) + "px";
  m.style.left = Math.round(Math.max(8, Math.min(r.right - w, innerWidth - w - 8))) + "px";
  m.style.maxHeight = Math.round(Math.min(560, innerHeight - r.bottom - 24)) + "px";
  void m.offsetWidth;                    // vsili preracun, da se prehod izvede
  m.classList.add("open");
  btn.classList.add("open");
  markSeen();                            // odprtje = pregledal si

  m.querySelector(".notif-clear").addEventListener("click", () => {
    NOTIF.newAtOpen.clear();
    m.querySelector(".notif-list").innerHTML = notifBody();
    markSeen();
  });
  m.querySelector(".notif-list").addEventListener("click", (e) => {
    const row = e.target.closest(".notif-item");
    if (!row) return;
    closeNotifications();
    try { openIncidentDetail(JSON.parse(row.dataset.inc)); } catch {}
  });
  const onDoc = (e) => {
    if (m.contains(e.target) || (btn && btn.contains(e.target))) return;
    closeNotifications();
  };
  const onKey = (e) => { if (e.key === "Escape") closeNotifications(); };
  NOTIF._off = () => {
    document.removeEventListener("pointerdown", onDoc);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", closeNotifications);
  };
  setTimeout(() => {
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", closeNotifications);
  }, 0);
}

// Oblacek zivi v <body>, zato ga je treba skriti, ko izgine to, kar opisuje.
function hideChartTip() {
  const t = document.getElementById("chartTip");
  if (t) t.style.opacity = 0;
}

// Majhen oblacek nad ikono: prve tri neprebrane, ali pomiritev, da je mirno.
let _peekTimer = 0;
function notifPeek(btn) {
  if (NOTIF.menu) return;
  clearTimeout(_peekTimer);
  let el = document.getElementById("notifPeek");
  if (!el) {
    el = document.createElement("div");
    el.id = "notifPeek";
    el.className = "notif-peek";
    document.body.appendChild(el);
  }
  const nove = unseen().slice(0, 3);
  el.innerHTML = nove.length
    ? '<div class="np-head">' + nove.length + (nove.length === 1 ? " novo obvestilo" : " nova obvestila") + "</div>" +
      nove.map((i) => '<div class="np-row"><span class="ni-dot ' +
        (i.tier === "alarm" ? "alarm" : "warning") + '"></span>' +
        '<span class="np-t">' + esc(i.label) + "</span>" +
        '<span class="np-w">' + clock(i.started_at) + "</span></div>").join("")
    : '<div class="np-head">Vse je mirno</div>' +
      '<div class="np-empty">Nič novega ni.</div>';
  const r = btn.getBoundingClientRect();
  const w = 244;                     // enako kot v CSS -- brez merjenja ni zgresitve
  // najprej sredinsko pod ikono; ce bi ustal z zaslona, poravnaj njegov DESNI
  // rob z ikono -- to je videti namerno, poravnava na rob okna pa ne
  let left = r.left + r.width / 2 - w / 2;
  if (left + w > innerWidth - 10) left = r.right - w + 6;
  el.style.left = Math.round(Math.max(8, left)) + "px";
  el.style.top = Math.round(r.bottom + 10) + "px";
  el.classList.add("on");
}
function notifPeekHide() {
  clearTimeout(_peekTimer);
  _peekTimer = setTimeout(() => {
    const el = document.getElementById("notifPeek");
    if (el) el.classList.remove("on");
  }, 90);
}

function closeNotifications() {
  const m = NOTIF.menu;
  if (!m) return;
  NOTIF.menu = null;
  if (NOTIF._off) NOTIF._off();
  m.classList.remove("open");
  setTimeout(() => m.remove(), 220);
  const btn = document.getElementById("notifBtn");
  if (btn) btn.classList.remove("open");
}

// Seznam današnjih dogodkov s ČASOVNIM STROJEM: drsnik vrti čas nazaj in
// panel kaže, kaj je senzor kazal takrat.
const TM = { day: "", sec: null, incidents: [], snapTimer: null, seq: 0, snapSig: null,
  dev: null, devs: [], page: 0, pageBusy: false, autoTimer: 0, autoPaused: false,
  lastSnap: null, dragging: false, autoNext: 0 };

// Vsebina okna prispe v korakih (najprej ogrodje, nato seznam, nazadnje
// posnetek), zato je okno prej ob vsakem koraku POSKOCILO. Tu opazujemo
// vsebino in visino okna animiramo do nove -- opazujemo VSEBINO, ne okna,
// sicer bi animacija visine sprozila novo opazovanje in bi se zaciklalo.
function tmSmoothGrow(modal, content, ms = 3000) {
  if (!modal || !content || REDUCED || PREFS.motion === "off") return;
  if (!window.ResizeObserver) return;
  let prev = modal.getBoundingClientRect().height;
  const ro = new ResizeObserver(() => {
    const h = modal.getBoundingClientRect().height;
    if (Math.abs(h - prev) < 8) { prev = h; return; }
    const from = prev;
    prev = h;
    modal.animate([{ height: from + "px" }, { height: h + "px" }],
      { duration: 460, easing: "cubic-bezier(0.16, 1, 0.22, 1)" });
  });
  ro.observe(content);
  setTimeout(() => ro.disconnect(), ms);
}

// Deli okna pridejo eden za drugim, ne vsi naenkrat.
function tmEnter(root) {
  if (!root || REDUCED || PREFS.motion === "off") return;
  [...root.children].forEach((el, i) => {
    el.animate([
      { opacity: 0, transform: "translateY(9px)", filter: "blur(6px)" },
      { opacity: 1, transform: "none", filter: "blur(0px)" },
    ], { duration: 520, delay: i * 85, easing: "cubic-bezier(0.16, 1, 0.22, 1)",
         fill: "backwards" });
  });
}

async function openAlarmsDetail(day = "", sec = null, origin = null) {
  clearInterval(TM.autoTimer);
  TM.page = 0; TM.snapSig = null; TM.lastSnap = null;
  markSeen();                    // pregled seznama = obvestila niso vec nova
  TM.day = day;                  // povzetek dneva zna skociti na tocen trenutek
  TM.sec = sec;
  TM.snapSig = null;
  const { back } = openModal(
    '<button class="btn close">Zapri</button><div id="tmRoot" class="spin">Nalagam…</div>',
    origin);
  const modal = back.querySelector(".modal");
  modal.classList.add("wide");
  // pocakaj, da se okno odpre; sestavljanje seznama med animacijo jo zatakne
  await new Promise((r) => setTimeout(r, REDUCED || PREFS.motion === "off" ? 0 : 260));
  tmSmoothGrow(modal, document.getElementById("tmRoot"));
  await tmLoadDay();
}

function tmDayStart(day) {
  const d = day ? new Date(day + "T00:00:00") : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
// Naprava javi meritev vsakih ~15 s -- to je najdrobnejsa locljivost, ki
// sploh obstaja, zato se drsnik premika po 15-sekundnih korakih.
const TM_STEP = 15;
const secOfDay = (iso) => { const t = new Date(iso);
  return t.getHours() * 3600 + t.getMinutes() * 60 + t.getSeconds(); };
// Dogodek brez konca je trenuten -- da se ga da "zadeti" z drsnikom, mu damo
// najmanjse okno ene minute.
const INC_MIN_S = 60;
function tmTierAt(sec) {
  let tier = "", start = null;
  for (const i of TM.incidents) {
    if (i.tier === "info") continue;
    const s0 = secOfDay(i.started_at);
    const s1 = Math.max(i.ended_at ? secOfDay(i.ended_at) : s0, s0 + INC_MIN_S);
    if (sec < s0 || sec > s1) continue;
    if (i.tier === "alarm" || !tier) {           // alarm prevlada nad opozorilom
      if (i.tier === "alarm" && tier !== "alarm") start = s0;
      else if (!tier) start = s0;
      else start = Math.min(start, s0);
      tier = i.tier === "alarm" ? "alarm" : (tier || "warning");
    }
  }
  return { tier, start };
}
function tmMaxSec(day) {
  const start = tmDayStart(day);
  const now = new Date();
  return start.toDateString() === now.toDateString()
    ? Math.floor((now - start) / 1000) : 86399;
}
function tmIsLive() {
  // "v zivo" je samo danes in znotraj enega vzorca od zdaj; pretekli dan
  // je vedno pogled nazaj, tudi ce je drsnik cisto na desni
  return !TM.day && TM.sec >= tmMaxSec("") - TM_STEP;
}
function tmMoment() {
  const d = tmDayStart(TM.day);
  d.setSeconds(TM.sec == null ? tmMaxSec(TM.day) : TM.sec);
  return d;
}
const tmHHMM = (s) => String(Math.floor(s / 3600)).padStart(2, "0") + ":" +
  String(Math.floor((s % 3600) / 60)).padStart(2, "0");

async function tmLoadDay() {
  const root = document.getElementById("tmRoot");
  if (!root) return;
  let d;
  try {
    d = await apiGet("/api/v2/incidents?kind=all" + (TM.day ? "&date=" + TM.day : ""));
  } catch (e) {
    root.innerHTML = '<div class="error-state">Napaka: ' + esc(e.message) + "</div>";
    return;
  }
  TM.incidents = d.incidents || [];
  if (TM.sec == null) TM.sec = tmMaxSec(TM.day);
  TM.snapSig = null;              // panel se pri menjavi dneva sestavi na novo
  tmRender();
}

function tmRender() {
  const root = document.getElementById("tmRoot");
  if (!root) return;
  root.classList.remove("spin");
  const maxSec = tmMaxSec(TM.day);
  // vse mora meriti po ISTEM merilu kot drsnik in z istim vrisanim robom, ki
  // ga ima nativni gumb (pol sirine na vsaki strani); calc() se preracuna ob
  // vsaki spremembi postavitve, izracun v pikslih pa bi obtical
  const pos = (s) => "calc(var(--tm-th) / 2 + " + (s / Math.max(1, maxSec)).toFixed(6) +
    " * (100% - var(--tm-th)))";
  // Dogodki NISO crtice na steklu -- so odseki v svojem pasu pod drsnikom.
  // Sirina odseka pove, kako dolgo je dogodek trajal; to je vec informacije
  // in steklo ostane cisto.
  const segs = TM.incidents
    .filter((i) => i.tier !== "info")
    .map((i) => {
      const s0 = secOfDay(i.started_at);
      if (s0 > maxSec) return "";
      const s1 = Math.min(maxSec, i.ended_at ? secOfDay(i.ended_at) : s0);
      const w = Math.max(0, s1 - s0) / Math.max(1, maxSec);
      // brez title=: nativni oblacek je crn sistemski okvir. Podatke nosimo
      // s sabo in jih pokazemo v ISTEM steklenem oblacku kot grafi.
      const kdaj = clock(i.started_at) +
        (i.ended_at && i.ended_at !== i.started_at ? " – " + clock(i.ended_at) : "") +
        (i.duration_s ? " · " + humanDur(i.duration_s) : "");
      return '<div class="tm-seg ' + (i.tier === "alarm" ? "alarm" : "warning") +
        '" style="left:' + pos(s0) + ';width:max(5px, ' + w.toFixed(6) +
        ' * (100% - var(--tm-th)))" data-sec="' + s0 +
        '" data-label="' + esc(i.label || "") +
        '" data-when="' + esc(kdaj) +
        '" data-tier="' + (i.tier === "alarm" ? "alarm" : "warning") +
        '" data-peak="' + esc(i.peak != null ? "vrh " + num(i.peak, 1) + " " + (i.unit || "") : "") +
        '"></div>';
    }).join("");
  // lestvica se prilagodi dolzini dneva (danes se konca ob trenutni uri)
  const live = tmIsLive();
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) =>
    f === 1 && !TM.day ? "zdaj" : tmHHMM(Math.round(maxSec * f)));

  root.innerHTML =
    '<div class="tm-head">' +
      "<div><div class=\"tm-clock\" id=\"tmClock\"></div><div class=\"tm-date\" id=\"tmDate\"></div></div>" +
      '<span class="tm-live" id="tmBadge"></span>' +
      '<div style="flex:1"></div>' +
      '<div class="tm-nav">' + dd("tmDayDD") +
        '<button class="btn" id="tmPrev" title="Prejšnji dogodek">‹ prejšnji</button>' +
        '<button class="btn" id="tmNext" title="Naslednji dogodek">naslednji ›</button>' +
        '<button class="btn primary" id="tmNow">Na zdaj</button>' +
      "</div>" +
    "</div>" +
    '<div class="tm-slider"><div class="tm-track">' +
      '<div class="tm-fill" id="tmFill"></div>' +
      '<div class="tm-thumb" id="tmThumb"></div>' +
      '<input type="range" id="tmRange" min="0" max="' + maxSec + '" step="' + TM_STEP +
        '" value="' + TM.sec + '" aria-label="Čas">' +
    "</div>" +
    '<div class="tm-lane">' + segs + "</div>" +
    '<div class="tm-scale">' + ticks.map((t) => "<span>" + t + "</span>").join("") + "</div>" +
    '<div class="tm-hint">Povleci drsnik nazaj in panel pokaže, kaj je senzor kazal takrat — ' +
      "po 15 sekund natančno, kolikor pogosto naprava sploh javlja. " +
      "V pasu pod drsnikom so dogodki: rdeči alarmi, jantarna opozorila, dolžina pa pove, koliko so trajali — klikni jih za skok. " +
      "S puščicama ← → se premikaš po eno meritev.</div>" +
    "</div>" +
    '<div id="tmSnap"></div>' +
    '<div id="tmList"></div>';

  setupDD("tmDayDD", lastDaysOptions(30), TM.day, (v) => {
    TM.day = v; TM.sec = null; tmLoadDay();
  });
  const range = document.getElementById("tmRange");
  const slider = root.querySelector(".tm-slider");
  let raf = 0, guard = 0;
  const runTick = () => {
    if (raf) cancelAnimationFrame(raf);
    clearTimeout(guard);
    raf = 0; guard = 0;
    tmTick();                     // seznam in posnetek (drazji del)
  };
  range.addEventListener("input", () => {
    TM.sec = Number(range.value);
    scrubBlur();                  // vrednosti se zameglijo, dokler se premikas
    tmLight();                    // ura, gumb, polnilo -> takoj in poceni
    if (raf || guard) return;
    raf = requestAnimationFrame(runTick);
    guard = setTimeout(runTick, 120);   // ce rAF ne tece (skrit zavihek)
  });
  range.addEventListener("pointerdown", () => {
    slider.classList.add("dragging"); TM.dragging = true; scrubBlur();
  });
  ["pointerup", "pointercancel", "blur"].forEach((ev) =>
    range.addEventListener(ev, () => {
      slider.classList.remove("dragging");
      TM.dragging = false;
      tmTick();                 // zdaj sele preberi prave vrednosti
    }));
  document.getElementById("tmNow").addEventListener("click", () => {
    // "Na zdaj" mora vrniti tudi na DANASNJI dan, ne le na konec izbranega
    if (TM.day) { TM.day = ""; TM.sec = null; tmLoadDay(); return; }
    tmGlide(tmMaxSec(""));
  });
  document.getElementById("tmPrev").addEventListener("click", () => tmJump(-1));
  document.getElementById("tmNext").addEventListener("click", () => tmJump(1));
  root.querySelectorAll(".tm-seg").forEach((el) =>
    el.addEventListener("click", () => tmGlide(Number(el.dataset.sec))));
  tmEnter(root);

  // Oblacek dogodka je ISTI element kot na grafih (#chartTip v <body>), zato
  // je videz enak povsod -- steklo, ne sistemski crn okvir.
  const lane = root.querySelector(".tm-lane");
  if (lane) {
    const tip = chartTip();
    const show = (el, x, y) => {
      const tier = el.dataset.tier === "alarm" ? "alert" : "warning";
      tip.innerHTML = "<b>" + esc(el.dataset.label || "") + "</b>" +
        (el.dataset.peak ? '<span class="rng">' + esc(el.dataset.peak) + "</span>" : "") +
        '<span class="tt">' + esc(el.dataset.when || "") + "</span>" +
        '<span class="state ' + tier + '">' +
          (tier === "alert" ? "Alarm" : "Opozorilo") + "</span>";
      tip.style.opacity = 1;
      const tw = tip.offsetWidth || 150, th = tip.offsetHeight || 60;
      const b = el.getBoundingClientRect();
      let left = Math.min(Math.max(8, x - tw / 2), innerWidth - tw - 8);
      let top = b.top - th - 10;
      if (top < 8) top = b.bottom + 10;          // ob vrhu zaslona se prezrcali
      tip.style.left = Math.round(left) + "px";
      tip.style.top = Math.round(top) + "px";
    };
    lane.addEventListener("pointermove", (e) => {
      const el = e.target.closest(".tm-seg");
      if (el) show(el, e.clientX, e.clientY);
      else tip.style.opacity = 0;
    });
    lane.addEventListener("pointerleave", () => { tip.style.opacity = 0; });
  }
  tmTick();
}

// Med vlecenjem se stevilke zameglijo -- oko vidi, da se vrednosti menjajo,
// ne trudi pa se brati vmesnih. Ko se ustavis, se ostrina vrne pocasi (ease
// out v CSS), kar da obcutek umirjanja namesto preskoka.
function scrubBlur() {
  const h = document.getElementById("tmSnap");
  if (!h || REDUCED || PREFS.motion === "off") return;
  h.classList.add("scrubbing");
  clearTimeout(TM.scrubTimer);
  TM.scrubTimer = setTimeout(() => h.classList.remove("scrubbing"), 340);
}

// Skok na dogodek ni preskok: drsnik zdrsi do cilja z ease-in-out, vmes pa
// se vrednosti se naprej menjajo (zamegljene), da se vidi potovanje po casu.
function tmGlide(target) {
  const maxSec = tmMaxSec(TM.day);
  const to = Math.max(0, Math.min(maxSec, Math.round(target)));
  const from = TM.sec;
  const r = document.getElementById("tmRange");
  const finish = () => {
    TM.gliding = false;
    // Ob skoku na dogodek hocemo videti NAJPOMEMBNEJSE meritve, zato nazaj na
    // prvo stran. Zadrzek stejemo od PRISTANKA, ne od zacetka zdrsa, da prva
    // stran res obstoji polnih 15 s.
    TM.page = 0;
    TM.autoNext = performance.now() + SNAP_HOLD_MS;
    TM.sec = to; if (r) r.value = to; tmLight(); tmTick();
  };
  if (REDUCED || PREFS.motion === "off" || Math.abs(to - from) < TM_STEP) return finish();
  cancelAnimationFrame(TM.glideRaf || 0);
  clearTimeout(TM.glideGuard);
  TM.gliding = true;
  scrubBlur();
  const t0 = performance.now(), DUR = 520;
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  let lastTick = 0;
  const step = (now) => {
    const k = Math.min(1, (now - t0) / DUR);
    TM.sec = Math.round(from + (to - from) * ease(k));
    if (r) r.value = TM.sec;
    tmLight();
    scrubBlur();
    if (now - lastTick > 130) { lastTick = now; tmTick(); }   // stevilke tecejo
    if (k < 1) TM.glideRaf = requestAnimationFrame(step);
    else { TM.glideRaf = 0; finish(); }
  };
  TM.glideRaf = requestAnimationFrame(step);
  // ce slike ne tecejo (zavihek v ozadju), po roku vseeno pristani na cilju
  TM.glideGuard = setTimeout(() => {
    if (TM.glideRaf) { cancelAnimationFrame(TM.glideRaf); TM.glideRaf = 0; finish(); }
  }, DUR + 160);
}

// Poceni del: ura, znacka, polnilo in stekleni gumb - tece ob vsakem pikslu.
function tmLight() {
  const maxSec = tmMaxSec(TM.day);
  const when = tmMoment();
  const live = tmIsLive();
  const f = TM.sec / Math.max(1, maxSec);
  const clockEl = document.getElementById("tmClock");
  const badge = document.getElementById("tmBadge");
  const thumb = document.getElementById("tmThumb");
  const track = document.querySelector(".tm-track");
  if (clockEl) clockEl.innerHTML = String(when.getHours()).padStart(2, "0") + ":" +
    String(when.getMinutes()).padStart(2, "0") +
    '<small>:' + String(when.getSeconds()).padStart(2, "0") + "</small>";
  if (badge) {
    badge.textContent = live ? "v živo" : "pogled v preteklost";
    badge.classList.toggle("tm-back", !live);
  }
  // ena sama stevilka postavi polnilo IN gumb (oboje prek calc() v CSS), zato
  // ostaneta poravnana tudi ko se tir zozi -- npr. ko se pojavi navpicni drsnik
  if (track) track.style.setProperty("--tm-f", f.toFixed(6));
  // Ko drsnik stoji v casu opozorila ali alarma, se KONEC crte pocasi prebarva
  // (prehod je v CSS). Zacetek preliva je tam, kjer se je dogodek zacel.
  if (track) {
    const { tier, start } = tmTierAt(TM.sec);
    const TH = parseFloat(getComputedStyle(track).getPropertyValue("--tm-th")) || 44;
    const W = track.clientWidth;
    const xNow = TH / 2 + f * Math.max(0, W - TH);
    const x0 = start == null ? xNow
      : TH / 2 + (start / Math.max(1, maxSec)) * Math.max(0, W - TH);
    const d0 = Math.max(0, Math.min(96, ((x0 - 3) / Math.max(1, xNow - 3)) * 100));
    track.style.setProperty("--tm-d0", d0.toFixed(1) + "%");
    track.style.setProperty("--tm-warn-op", tier === "warning" ? "1" : "0");
    track.style.setProperty("--tm-alert-op", tier === "alarm" ? "1" : "0");
  }
  if (thumb && track) {
    // bleščice na tem drsniku so del kontrole, zato ne visijo na nastavitvi
    // "Bleščice" (ta velja za klike drugod) — ustavi jih le izklop gibanja
    if (!REDUCED && PREFS.motion !== "off") {
      const now = performance.now();
      if (now - (TM.lastSpark || 0) > 90) {
        TM.lastSpark = now;
        const b = thumb.getBoundingClientRect();
        spawnSparkles(b.left + b.width / 2, b.top + b.height / 2, 3);
      }
    }
  }
}

function tmJump(dir) {
  const secs = TM.incidents.filter((i) => i.tier !== "info").map((i) => {
    const t = new Date(i.started_at);
    return t.getHours() * 3600 + t.getMinutes() * 60 + t.getSeconds();
  }).sort((a, b) => a - b);
  if (!secs.length) {
    toast("warning", "Ni dogodkov", "Ta dan ni alarmov ali opozoril, med katerimi bi skakali.");
    return;
  }
  const cur = TM.sec;
  const next = dir < 0 ? [...secs].reverse().find((s) => s < cur - TM_STEP)
    : secs.find((s) => s > cur + TM_STEP);
  if (next == null) {
    toast("warning", dir < 0 ? "Ni starejšega dogodka" : "Ni novejšega dogodka",
      "V tej smeri ni več dogodkov tega dne.");
    return;
  }
  tmGlide(next);
}

// Ob premiku drsnika: takoj osveži uro, seznam in polnilo; posnetek senzorja
// je omrežni klic, zato ga malo zadržimo, da vlečenje ostane gladko.
function tmTick() {
  const when = tmMoment();
  tmLight();
  const dateEl = document.getElementById("tmDate");
  if (dateEl) dateEl.textContent = when.toLocaleDateString("sl",
    { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  // seznam: samo tisto, kar se je do tega trenutka že zgodilo
  // Meritev prispe vsakih 15 s, zato je vse, kar se je zacelo znotraj istega
  // vzorca, ze "zgodilo". Brez tega klik na alarm pade nekaj milisekund pred
  // njegov zacetek in seznam je prazen, dokler drsnika ne premaknes naprej.
  const tw = when.getTime() + TM_STEP * 1000;
  const upto = TM.incidents.filter((i) => new Date(i.started_at).getTime() <= tw);
  const active = upto.filter((i) => {
    const end = new Date(i.ended_at || i.started_at).getTime();
    return end >= when.getTime() - TM_STEP * 1000;
  });
  const TIER = { alarm: ["alert", "Alarmi"], warning: ["warning", "Opozorila"], info: ["off", "Indikatorji"] };
  const row = (i) => {
    const on = active.includes(i);
    return '<tr data-inc="' + esc(JSON.stringify({ s: i.started_at, e: i.ended_at, d: i.device_id, b: i.base, l: i.label, t: i.tier })) +
      '" style="cursor:pointer' + (on ? ";font-weight:600" : "") + '">' +
      "<td>" + clock(i.started_at) + (i.ended_at ? "–" + clock(i.ended_at) : "") + "</td>" +
      '<td><span class="pill ' + TIER[i.tier][0] + '">' + esc(i.label) + "</span></td>" +
      "<td>" + humanDur(i.duration_s) + (on ? " · <b>v teku</b>" : "") + "</td>" +
      '<td class="num">' + (i.peak != null ? num(i.peak, 1) + " " + esc(i.unit || "") : "—") + "</td>" +
      '<td class="muted" style="white-space:normal;max-width:280px">' + esc(i.why || "") + "</td></tr>";
  };
  const section = (tier) => {
    const items = upto.filter((i) => i.tier === tier);
    return '<div class="section-title" style="margin-top:16px">' + TIER[tier][1] + " · " + items.length + "</div>" +
      (items.length
        ? '<div class="table-wrap"><table class="data"><thead><tr><th>Čas</th><th>Dogodek</th><th>Trajanje</th><th>Vrh</th><th>Zakaj je pomembno</th></tr></thead><tbody>' +
          items.map(row).join("") + "</tbody></table></div>"
        : '<div class="empty" style="padding:18px">Do tega trenutka ni bilo takih dogodkov.</div>');
  };
  const list = document.getElementById("tmList");
  if (list) {
    const prvic = !list.dataset.filled;
    list.innerHTML = section("alarm") + section("warning") + section("info");
    list.dataset.filled = "1";
    if (prvic) tmEnter(list);
    list.querySelectorAll("tr[data-inc]").forEach((tr) =>
      tr.addEventListener("click", () => {
        try { openIncidentDetail(JSON.parse(tr.dataset.inc)); } catch {}
      }));
  }

  // Med vlecenjem NE hodimo v bazo -- to je bilo pocasno in vmesne vrednosti
  // itak niso berljive. Namesto tega stevilke premesamo; prave pridejo, ko
  // se drsnik ustavi.
  clearTimeout(TM.snapTimer);
  // mesamo CELO kartico, da pripete ploscice med vlecenjem ne obstanejo z
  // zamrznjeno stevilko -- to bi izgledalo, kot da se ne posodabljajo
  const grid = document.querySelector(".snap-card");
  if (TM.dragging || TM.gliding) {
    if (grid) scrambleStart(grid);
    return;
  }
  const seq = ++TM.seq;
  TM.snapTimer = setTimeout(() => {
    if (grid) scrambleStop(grid);
    tmSnapshot(when, seq);
  }, 140);
}

// ---------- Panel meritev v casovnem stroju ----------
// Meritev je vec, kot jih gre na eno vrsto, zato so razdeljene na strani in
// razvrscene po POMEMBNOSTI: kar je cez mejo, gre naprej. Panel se ne
// prerisuje -- ogrodje ostane, menjajo se stevilke.
const SNAP_PER_PAGE = 8;
const SNAP_AUTO_MS = 7000;

// vrstni red, kadar nic ne izstopa (od najbolj do najmanj povedne meritve)
const SNAP_BASE_ORDER = ["aqi", "pm25", "tvoc", "co2eq", "co", "temp_c", "rh", "noise",
  "pm1", "pm10", "nh3", "no2", "lux", "health_index", "occupancy", "move", "pressure"];

// --- pripete meritve -------------------------------------------------------
// Ploscice se same menjajo, zato meritve, ki jo gledas, cez nekaj sekund ni
// vec tam. Pripeta meritev gre v svojo vrsto nad panelom: iz vrtenja izpade,
// ostane na mestu in se ob premikanju casovnice le posodablja. To je edini
// nacin, da se ena meritev spremlja skozi cas.
const PIN_KEY = "halo-pins";
function pinsLoad() {
  try { return new Set(JSON.parse(localStorage.getItem(PIN_KEY) || "[]")); }
  catch { return new Set(); }
}
function pinsSave() {
  try { localStorage.setItem(PIN_KEY, JSON.stringify([...TM.pins])); } catch {}
}
let _pinsInit = false;

// Strani se racunajo SAMO iz nepripetih meritev -- pripete ne smejo jemati
// mesta v vrtenju, sicer bi se strani praznile, ko jih pripnes vec.
function snapRazrez(kljuci) {
  const pins = kljuci.filter((k) => TM.pins.has(k));
  const rest = kljuci.filter((k) => !TM.pins.has(k));
  const strani = Math.max(1, Math.ceil(rest.length / SNAP_PER_PAGE));
  const naStran = Math.max(1, Math.ceil(rest.length / strani));
  return { pins, rest, strani, naStran };
}

function pinToggle(k) {
  if (TM.pins.has(k)) TM.pins.delete(k); else TM.pins.add(k);
  pinsSave();
  TM.page = 0;
  const grid = document.getElementById("snapGrid");
  if (grid) TM.autoNext = performance.now() + SNAP_HOLD_MS;   // ne menjaj strani takoj
  snapRepaint();
  const tile = document.querySelector('.mini[data-k="' + k + '"]');
  if (tile) squish(tile);
}

function snapOrder(dev, thr) {
  return Object.keys(dev.metrics || {})
    // Varnostne metrike (vape, smoking, masking ...) so ODVODI in gredo v
    // minus -- kot stevilka na ploscici ne pomenijo nicesar. Zaznave iz njih
    // so ze v seznamu dogodkov, tu bi bile samo zavajajoce.
    .filter((k) => dev.metrics[k] != null && METRIC_BY_KEY[k] &&
      METRIC_BY_KEY[k].group !== "security")
    .map((k) => {
      const a = assessValue(dev.metrics[k], thr[k]);
      const rank = a.lvl === "alert" ? 0 : a.lvl === "warning" ? (a.deg >= 0.5 ? 1 : 2) : 3;
      const i = SNAP_BASE_ORDER.indexOf(k);
      return { k, rank, i: i < 0 ? 99 : i };
    })
    .sort((x, y) => x.rank - y.rank || x.i - y.i)
    .map((x) => x.k);
}

// --- premesane vrednosti ---------------------------------------------------
// Med vlecenjem casovnice ne beremo vrednosti iz baze ob vsakem pikslu (to je
// bilo pocasno), ampak stevilke premesamo. Oko vidi, da se dogaja, cifre pa
// so zamegljene ravno toliko, da jih ne bere. Ko se drsnik ustavi, pridejo
// prave vrednosti.
const SCRAMBLE_CH = "0123456789";
const SCRAMBLE_AZ = "abcdefghijklmnoprstuvz";
function scrambleText(t) {
  return t.replace(/[0-9]/g, () => SCRAMBLE_CH[(Math.random() * 10) | 0])
    .replace(/[a-zžšč]/gi, (c) => {
      const r = SCRAMBLE_AZ[(Math.random() * SCRAMBLE_AZ.length) | 0];
      return c === c.toUpperCase() ? r.toUpperCase() : r;
    });
}
function scrambleStart(host) {
  if (!host || REDUCED || PREFS.motion === "off") return;
  host.classList.add("scrambling");
  if (host._scr) return;
  const cilji = [...host.querySelectorAll(".mnum, .mk")].map((el) => {
    if (!el.dataset.real) el.dataset.real = el.textContent;
    return el;
  });
  host._scr = setInterval(() => {
    cilji.forEach((el) => { el.textContent = scrambleText(el.dataset.real || el.textContent); });
  }, 70);
}
function scrambleStop(host) {
  if (!host) return;
  host.classList.remove("scrambling");
  if (host._scr) { clearInterval(host._scr); host._scr = null; }
  host.querySelectorAll(".mnum, .mk").forEach((el) => {
    if (el.dataset.real != null) { el.textContent = el.dataset.real; delete el.dataset.real; }
  });
}

async function tmSnapshot(when, seq) {
  const host = document.getElementById("tmSnap");
  if (!host) return;
  let d;
  try { d = await apiGet("/api/v2/snapshot?ts=" + encodeURIComponent(localISO(when))); }
  catch { return; }
  if (seq !== TM.seq || !document.getElementById("tmSnap")) return;   // vmes se je premaknil
  const devs = d.devices || [];
  if (!devs.length) {
    TM.snapSig = null;
    host.innerHTML = '<div class="card" style="margin-top:14px"><div class="muted">' +
      "Ob tem času ni bilo meritev (senzor ni javljal).</div></div>";
    return;
  }
  TM.devs = devs.map((x) => ({ v: String(x.device_id), l: x.name }));
  if (!TM.dev || !devs.some((x) => String(x.device_id) === TM.dev)) {
    TM.dev = String(devs[0].device_id);
  }
  const dev = devs.find((x) => String(x.device_id) === TM.dev) || devs[0];
  const thr = (S.overview && S.overview.metric_thresholds) || {};
  if (!_pinsInit) { TM.pins = pinsLoad(); _pinsInit = true; }
  const kljuci = snapOrder(dev, thr);
  // strani enakomerno napolnimo (17 meritev -> 6/6/5, ne 8/8/1)
  const { strani, naStran } = snapRazrez(kljuci);
  if (TM.page == null || TM.page >= strani) TM.page = 0;

  // Ogrodje se prezidalo samo ob menjavi naprave; pripenjanje in menjava
  // strani sta zgolj prerisovanje, sicer bi panel poskocil.
  if (TM.snapSig !== TM.dev) { TM.snapSig = TM.dev; snapMount(dev, strani); }
  snapPaint(dev, kljuci, thr, when, strani, false, naStran);
}

function snapMount(dev, strani) {
  const host = document.getElementById("tmSnap");
  const pike = Array.from({ length: strani }, (_, i) =>
    '<button class="snap-dot" data-p="' + i + '" aria-label="Stran ' + (i + 1) + '"></button>').join("");
  host.innerHTML =
    '<div class="card snap-card" style="margin-top:14px">' +
      '<div class="snap-head">' +
        '<span class="pill" data-role="pill"></span>' +
        '<div class="snap-dev">' + dd("snapDevDD") + "</div>" +
        '<span class="muted snap-meta" data-role="when"></span>' +
        '<span class="muted snap-meta" data-role="trig"></span>' +
      "</div>" +
      '<div class="mini-grid pripete" id="snapPins" hidden></div>' +
      '<div class="snap-stage">' +
        '<button class="snap-arrow l" aria-label="Prejšnja stran">‹</button>' +
        '<div class="mini-grid" id="snapGrid"></div>' +
        '<button class="snap-arrow r" aria-label="Naslednja stran">›</button>' +
      "</div>" +
      '<div class="snap-dots"' + (strani > 1 ? "" : " hidden") + ">" + pike + "</div>" +
    "</div>";
  setupDD("snapDevDD", TM.devs, TM.dev, (v) => {
    TM.dev = v; TM.page = 0; TM.snapSig = null;
    tmSnapshot(tmMoment(), TM.seq);
  });
  const card = host.querySelector(".snap-card");
  // pikice se ob pripenjanju prezidajo, zato posluh visi na posodi, ne na njih
  card.querySelector(".snap-dots").addEventListener("click", (e) => {
    const b = e.target.closest(".snap-dot");
    if (b) snapGoTo(Number(b.dataset.p));
  });
  // Klik na plosčico jo pripne (in odpne). Pripeta gre iz vrtenja v svojo
  // vrsto in ostane tam, dokler je ne odpneš.
  card.addEventListener("click", (e) => {
    const t = e.target.closest(".mini");
    if (t && t.dataset.k) pinToggle(t.dataset.k);
  });
  card.querySelector(".snap-arrow.l").addEventListener("click", () => snapGoTo(TM.page - 1));
  card.querySelector(".snap-arrow.r").addEventListener("click", () => snapGoTo(TM.page + 1));
  card.addEventListener("pointerenter", () => { TM.autoPaused = true; });
  card.addEventListener("pointerleave", () => { TM.autoPaused = false; });
  clearInterval(TM.autoTimer);
  {
    TM.autoNext = performance.now() + SNAP_AUTO_MS;
    // Ura tece pogosteje kot menjava, ker se rok premika (ob hoverju in po
    // rocnem posegu) -- fiksen interval tega ne bi mogel spostovati.
    // Ura tece tudi pri eni strani: pripenjanje stevilo strani spreminja.
    TM.autoTimer = setInterval(() => {
      const zdaj = performance.now();
      if (TM.autoPaused || document.hidden || !document.getElementById("snapGrid")) {
        TM.autoNext = zdaj + SNAP_AUTO_MS;    // ko odmaknes misko, ne skoci takoj
        return;
      }
      if (zdaj < (TM.autoNext || 0)) return;
      snapGoTo(TM.page + 1, true);
    }, 500);
  }
}

// Menjava strani: ploscice se raztegnejo (visina dol, sirina gor), zabrisejo
// in odplavajo, nove pa pridejo ena za drugo -- isti jezik kot drugod.
// Po ROCNEM posegu (puscica, pikica) in po skoku na dogodek se samodejno
// menjavanje ustavi za 15 s -- sicer bi ti stran zamenjala stran ravno takrat,
// ko si jo sam izbral.
const SNAP_HOLD_MS = 15000;
function snapGoTo(p, samodejno) {
  const grid = document.getElementById("snapGrid");
  if (!grid || TM.pageBusy) return;
  // po ROCNI menjavi 15 s miru, po samodejni pa obicajen ritem
  TM.autoNext = performance.now() + (samodejno ? SNAP_AUTO_MS : SNAP_HOLD_MS);
  const strani = document.querySelectorAll(".snap-dot").length || 1;
  const nova = ((p % strani) + strani) % strani;
  if (nova === TM.page) return;
  const smer = (p > TM.page || (TM.page === strani - 1 && nova === 0)) ? 1 : -1;
  TM.page = nova;
  if (REDUCED || PREFS.motion === "off") { snapRepaint(); return; }
  TM.pageBusy = true;
  scrambleStart(grid);
  const out = grid.animate([
    { transform: "scale(1, 1) translateX(0)", filter: "blur(0px)", opacity: 1 },
    { transform: `scale(1.06, 0.88) translateX(${-smer * 26}px)`, filter: "blur(9px)", opacity: 0 },
  ], { duration: 280, easing: "cubic-bezier(0.5, 0, 0.9, 0.4)", fill: "forwards" });
  const konec = () => {
    snapRepaint();
    scrambleStop(grid);
    try { out.cancel(); } catch {}
    grid.animate([
      { transform: `scale(1.05, 0.90) translateX(${smer * 26}px)`, filter: "blur(9px)", opacity: 0 },
      { transform: "none", filter: "blur(0px)", opacity: 1 },
    ], { duration: 520, easing: "cubic-bezier(0.16, 1, 0.22, 1)" });
    snapStagger(grid);
    TM.pageBusy = false;
  };
  out.onfinish = konec;
  setTimeout(() => { if (TM.pageBusy) konec(); }, 420);   // ce slike ne tecejo
}

// Bucika je vidna sele ob hoverju, na pripeti ploscici pa vedno -- drugace bi
// sedemnajst buciko cakalo na klik, ki ga nihce ni nameraval.
function miniMarkup(k) {
  const m = METRIC_BY_KEY[k] || {};
  const pripeta = TM.pins.has(k);
  return '<div class="mini' + (pripeta ? " pripeta" : "") + '" data-k="' + k + '" ' +
    'title="' + (pripeta ? "Klik odpne" : "Klik pripne — meritev ostane na mestu") + '">' +
    '<div class="mk">' + esc(m.label || k) + "</div>" +
    '<div class="mv"><span class="mnum"></span>' +
    (m.unit ? "<small>" + esc(m.unit) + "</small>" : "") + "</div>" +
    '<svg class="mpin" viewBox="0 0 16 16" aria-hidden="true">' +
      '<path d="M9.6 1.6l4.8 4.8-1.3 1.3-1.1-.3-2.5 2.5.4 2.3-1.2 1.2-3-3-3.1 3.1-.7-.7 3.1-3.1-3-3 1.2-1.2 2.3.4 2.5-2.5-.3-1.1z" ' +
      'fill="currentColor"/></svg>' +
    "</div>";
}

// ploscice pridejo ena za drugo, ne vse naenkrat
function snapStagger(grid) {
  if (REDUCED || PREFS.motion === "off") return;
  [...grid.querySelectorAll(".mini:not([hidden])")].forEach((el, i) => {
    el.animate([
      { opacity: 0, transform: "translateY(7px) scale(0.985)", filter: "blur(5px)" },
      { opacity: 1, transform: "none", filter: "blur(0px)" },
    ], { duration: 420, delay: Math.min(i, 7) * 45, easing: "cubic-bezier(0.16, 1, 0.22, 1)",
         fill: "backwards" });
  });
}

function snapRepaint() {
  const host = document.getElementById("tmSnap");
  if (!host || !TM.lastSnap) return;
  const { dev, kljuci, thr, when, strani, naStran } = TM.lastSnap;
  snapPaint(dev, kljuci, thr, when, strani, true, naStran);
}

function snapPaint(dev, kljuci, thr, when, strani, brezVstopa, naStran) {
  const perPage = naStran || SNAP_PER_PAGE;
  TM.lastSnap = { dev, kljuci, thr, when, strani, naStran: perPage };
  const card = document.querySelector(".snap-card");
  const grid = document.getElementById("snapGrid");
  if (!card || !grid) return;
  const setText = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
  const st = dev.status || {};
  const lvl = st.level === "alert" ? "alert" : st.level === "warning" ? "warning" : "ok";
  const pill = card.querySelector('[data-role="pill"]');
  if (pill.className !== "pill " + lvl) pill.className = "pill " + lvl;
  setText(pill, st.label || "—");
  const age = Math.max(0, Math.round((when - new Date(dev.ts)) / 1000));
  setText(card.querySelector('[data-role="when"]'), "meritev ob " + clockSec(dev.ts) +
    (age > TM_STEP * 2 ? " · " + humanDur(age) + " pred izbranim trenutkom" : ""));
  setText(card.querySelector('[data-role="trig"]'),
    dev.triggered ? "· sproženo: " + dev.triggered : "");
  const { pins, rest } = snapRazrez(kljuci);
  const stran = rest.slice(TM.page * perPage, (TM.page + 1) * perPage);

  // Pikice povedo stanje vrtenja NEPRIPETIH strani -- ob pripenjanju jih je
  // lahko manj ali vec, zato jih po potrebi prezidamo.
  const dots = card.querySelector(".snap-dots");
  if (dots) {
    if (dots.children.length !== strani) {
      dots.innerHTML = Array.from({ length: strani }, (_, i) =>
        '<button class="snap-dot" data-p="' + i + '" aria-label="Stran ' + (i + 1) + '"></button>').join("");
    }
    dots.hidden = strani <= 1;
    dots.querySelectorAll(".snap-dot").forEach((b, i) => b.classList.toggle("on", i === TM.page));
  }

  const pinHost = document.getElementById("snapPins");
  if (pinHost) {
    pinHost.hidden = !pins.length;
    const zdaj = [...pinHost.querySelectorAll(".mini")].map((e) => e.dataset.k).join(",");
    if (zdaj !== pins.join(",")) pinHost.innerHTML = pins.map(miniMarkup).join("");
  }
  // Ce si pripel vse, se ni cesa vrteti -- prazen oder s puscicami, ki nic ne
  // naredijo, je videti pokvarjeno.
  const stage = card.querySelector(".snap-stage");
  if (stage) stage.hidden = !stran.length;
  const obstojece = new Map([...grid.querySelectorAll(".mini")].map((e) => [e.dataset.k, e]));
  const novoOgrodje = stran.some((k) => !obstojece.has(k)) || obstojece.size !== stran.length;
  if (novoOgrodje) grid.innerHTML = stran.map(miniMarkup).join("");
  [...pins, ...stran].forEach((k) => {
    const tile = (TM.pins.has(k) ? pinHost : grid).querySelector('.mini[data-k="' + k + '"]');
    if (!tile) return;
    const v = dev.metrics[k];
    const m = METRIC_BY_KEY[k] || {};
    const numEl = tile.querySelector(".mnum");
    const txt = num(v, m.dp == null ? 1 : m.dp);
    if (numEl.dataset.real != null) numEl.dataset.real = txt;    // med mesanjem
    else if (numEl.textContent !== txt) {
      const prvic = numEl.textContent === "";
      numEl.textContent = txt;
      if (!prvic && !brezVstopa) blurIn(numEl);
    }
    const a = assessValue(v, thr[k]);
    const cls = a.lvl === "alert" ? "lvl-alert"
      : a.lvl === "warning" ? (a.deg >= 0.5 ? "lvl-warn-strong" : "lvl-warn") : "";
    if ((tile.dataset.lvl || "") !== cls) {
      tile.classList.remove("lvl-alert", "lvl-warn", "lvl-warn-strong");
      if (cls) tile.classList.add(cls);
      if (cls && !brezVstopa) squish(tile);
      tile.dataset.lvl = cls;
    }
    const namig = a.text + (a.text ? " · " : "") +
      (TM.pins.has(k) ? "klik odpne" : "klik pripne");
    if (tile.title !== namig) tile.title = namig;
  });
  if (novoOgrodje && !brezVstopa) snapStagger(grid);
}

// Znacka mora povedati PRAVO stopnjo: opozorilo iz svetlobe ni alarm, prej
// pa je bila glava vedno rdeca.
function incPill(inc, d) {
  if (inc && inc.t) return inc.t === "alarm" ? "alert" : inc.t === "warning" ? "warning" : "ok";
  const own = (d && d.metrics && d.metrics[0]) || null;
  if (own && own.crossed === "alarm") return "alert";
  if (own && own.crossed) return "warning";
  return "ok";
}

// Kaj se je zgodilo: povzetek v dveh stavkih, izstopajoče meritve in graf
// obdobja, ko je šlo gor in nazaj dol.
async function openIncidentDetail(inc) {
  const { back } = openModal(`<button class="btn close">Zapri</button>
    <div id="incDetail" class="spin">Nalagam…</div>`);
  back.querySelector(".modal").classList.add("wide");
  let d;
  try {
    d = await apiGet(`/api/v2/incident-detail?start=${encodeURIComponent(inc.s)}` +
      `&end=${encodeURIComponent(inc.e || inc.s)}&device_id=${inc.d}&bases=${encodeURIComponent(inc.b || "")}`);
  } catch (e) {
    back.querySelector("#incDetail").classList.remove("spin");   // vsebina je tu
  back.querySelector("#incDetail").innerHTML = `<div class="error-state">Napaka: ${esc(e.message)}</div>`;
    return;
  }
  const rows = (d.metrics || []).map((m) => {
    // malo cez mejo in mocno cez mejo nista isto: nad polovico poti do
    // alarmne meje gre barva iz jantarne v opecnato
    const cls = m.crossed === "alarm" ? " lvl-alert"
      : m.crossed ? ((m.severity || 0) >= 0.5 ? " lvl-warn-strong" : " lvl-warn") : "";
    const times = m.ratio && m.ratio >= 2 ? ` <b>${num(m.ratio, 1)}×</b>` : "";
    return `<div class="mini${cls}">
      <div class="mk">${esc(m.label)}${m.crossed ? ` · ${esc(m.crossed)}` : ""}</div>
      <div class="mv">${num(m.peak, m.dp)}<small>${esc(m.unit)}</small></div>
      <div class="mtrend">prej ${m.calm != null ? num(m.calm, m.dp) : "—"}${times}</div>
    </div>`;
  }).join("");
  back.querySelector("#incDetail").innerHTML = `
    <div class="detail-head"><span class="pill ${incPill(inc, d)}">${esc(inc.l || "Dogodek")}</span></div>
    <h2 style="margin:8px 0 6px">${esc(d.cause || "Kaj se je zgodilo")}</h2>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.55">${esc(d.summary || "")}</p>
    ${rows ? `<div class="section-title" style="margin-top:0">Izstopajoče meritve</div>
      <div class="mini-grid">${rows}</div>` : ""}
    <div class="section-title">Potek (z 10 min konteksta pred in po)</div>
    <div id="incCharts"></div>`;
  const host = back.querySelector("#incCharts");
  const series = d.series || {};
  const meta = Object.fromEntries((d.metrics || []).map((m) => [m.key, m]));
  Object.keys(series).forEach((k) => {
    const pts = series[k];
    if (!pts || pts.length < 2) return;
    const head = document.createElement("div");
    head.className = "chart-head";
    head.innerHTML = `<span class="metric-value">${esc(meta[k]?.label || k)}</span>` +
      `<span class="metric-unit">vrh ${num(meta[k]?.peak, meta[k]?.dp ?? 1)} ${esc(meta[k]?.unit || "")}</span>`;
    host.appendChild(head);
    host.appendChild(lineChart(pts, {
      unit: meta[k]?.unit || "",
      thresholds: (METRIC_BY_KEY[k] || {}).thresholds || {},
    }));
  });
  if (!host.children.length) host.innerHTML = '<div class="muted">Ni dovolj meritev za graf.</div>';
}

function tweenStat(root, key, to, dp = 0) {
  const el = root.querySelector(`[data-stat="${key}"] .v`);
  if (!el) return;
  if (to === null || to === undefined || Number.isNaN(Number(to))) {
    el.textContent = "—"; el.dataset.v = ""; return;
  }
  const target = Number(to);
  const from = el.dataset.v === "" ? target : Number(el.dataset.v);
  el.dataset.v = target;
  if (from === target) { el.textContent = num(target, dp); return; }
  const t0 = performance.now(), dur = 800;
  let done = false;
  const step = (t) => {
    if (done) return;
    const k = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = num(from + (target - from) * e, dp);
    if (k < 1) requestAnimationFrame(step);
    else done = true;
  };
  requestAnimationFrame(step);
  // Ce slike ne tecejo (zavihek v ozadju, varcevanje), se stevilka nikoli ne
  // bi presteta do konca in bi obtičala na stari vrednosti. Zato mora po roku
  // vseeno pristati na pravi.
  setTimeout(() => { if (!done) { done = true; el.textContent = num(target, dp); } }, dur + 140);
}


const pillClass = (lvl) => lvl === "alert" ? "alert" : lvl === "warning" ? "warning" : lvl === "off" ? "off" : "ok";

function openStatusDetail() {
  const o = S.overview; if (!o) return;
  const st = o.status || {}, sm = o.summary || {}, lat = o.latest || {};
  const { cls, head, sub, krivci: kr } = statusHeadline(o);
  const lab = { alert: "Alarm", warning: "Opozorilo", ok: "V redu" }[cls] || "—";

  // Katera meritev je kriva, koliko je in koliko je cez -- s stevilkami, ne
  // z imenom stolpca. To je prvo, kar hoces videti, zato je nad tabelo.
  const kartice = (kr || []).map((k) => {
    const e = k.unit ? " " + k.unit : "";
    const cez = k.limit == null ? "" :
      '<div class="kr-cez ' + k.lvl + '">' + KRIV_PUSCICA(k.dir) + " " +
        num(k.over, k.dp) + e + (k.dir === "up" ? " nad mejo" : " pod mejo") + "</div>";
    return '<div class="kr-card ' + k.lvl + '">' +
      '<div class="kr-ime">' + esc(k.label) + "</div>" +
      '<div class="kr-v">' + num(k.value, k.dp) + '<small>' + esc(k.unit || "") + "</small></div>" +
      cez +
      '<div class="kr-meja">meja ' +
        (k.limit == null ? "—" : num(k.limit, k.dp) + e) + "</div>" +
    "</div>";
  }).join("");

  const rows = [
    ["Povezava", sm.online ? "Naprave javljajo v živo" : "Zadnji heartbeat starejši od 2 min"],
    ["Zadnji signal", `${timeAgo(lat.received_at)} (${dateTime(lat.received_at)})`],
    ["Alarmi danes", num(sm.alerts_today, 0)],
    ["Najpogostejši dogodek danes", sm.most_common_event_today || "—"],
    ["Heartbeati danes", num(sm.total_today, 0)],
  ];
  if (!kr || !kr.length) {
    rows.splice(2, 0, ["Vzrok stanja", st.reason ||
      (cls === "ok" ? "Vse izmerjene vrednosti so v mejah alarmnih pravil." : "—")]);
  }
  openModal(`
    <button class="btn close">Zapri</button>
    <div class="detail-head"><span class="pill ${cls}">${lab}</span></div>
    <h2 style="margin:8px 0 2px">${esc(head)}</h2>
    <p class="muted" style="margin:0 0 16px">${esc(sub)}</p>
    ${kartice ? '<div class="kr-grid">' + kartice + "</div>" : ""}
    <dl class="kv">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`);
}

// Kako daleč je vrednost od povprečja zadnje ure — brez grafa, z besedo.
function trendWord(now, avg) {
  if (now == null || avg == null || !isFinite(now) || !isFinite(avg)) return null;
  const base = Math.abs(avg);
  const diff = now - avg;
  if (base < 1e-6) return Math.abs(diff) < 1e-6 ? { t: "stabilno", cls: "" } : null;
  const pct = (diff / base) * 100;
  const a = Math.abs(pct);
  if (a < 8) return { t: "stabilno", cls: "" };
  const dir = pct > 0 ? "↑" : "↓";
  const word = a >= 40 ? (pct > 0 ? "močno višje" : "močno nižje") : (pct > 0 ? "višje" : "nižje");
  return { t: `${dir} ${word} (${pct > 0 ? "+" : ""}${num(pct, 0)} %)`, cls: a >= 40 ? "strong" : "" };
}

function openDeviceDetail(name) {
  const d = (S.overview?.devices || []).find((x) => x.name === name);
  if (!d) return;
  const met = d.metrics || {};
  const avg = d.avg1h || {};
  const thr = S.overview?.metric_thresholds || {};
  const grid = DETAIL_METRICS.map(([k, l, u]) => {
    const v = met[k];
    // barva pove stanje: rdeča samo alarm, jantar opozorilo
    const a = assessValue(v, thr[k]);
    const cls = v == null ? "" : a.lvl === "alert" ? " lvl-alert"
      : a.lvl === "warning" ? (a.deg >= 0.5 ? " lvl-warn-strong" : " lvl-warn") : "";
    const tr = trendWord(v, avg[k]);
    return `<div class="mini${cls}" title="${esc(a.text)}">
      <div class="mk">${l}</div>
      <div class="mv">${num(v, 1)}${u ? `<small>${u}</small>` : ""}</div>
      ${tr ? `<div class="mtrend ${tr.cls}">${esc(tr.t)}</div>` : ""}</div>`;
  }).join("");
  openModal(`
    <button class="btn close">Zapri</button>
    <div class="detail-head"><span class="pill ${pillClass(devLevel(d))}">${esc(devLabel(d))}</span></div>
    <h2 style="margin:8px 0 2px">${esc(d.name)}</h2>
    <p class="muted" style="margin:0 0 16px">Zadnji signal ${timeAgo(d.last_seen)} · ${esc(d.status.reason || "vse vrednosti v mejah")}</p>
    <div class="section-title" style="margin-top:0">Zadnje meritve</div>
    <div class="mini-grid">${grid}</div>`);
}

// ---------- Events ----------

// Pametno iskanje dogodkov: prosto besedilo + operatorji.
//   "vape"        -> tip/opis/lokacija vsebuje "vape"
//   ">50"  "<10"  -> po vrednosti
//   "danes" "vceraj" "teden" -> po času
//   "alarm" "opozorilo"      -> po resnosti
function parseSearch(q) {
  const terms = { text: [], min: null, max: null, since: null, sev: null };
  for (const raw of String(q || "").toLowerCase().split(/\s+/).filter(Boolean)) {
    let m;
    if ((m = raw.match(/^>=?(-?[\d.]+)$/))) { terms.min = parseFloat(m[1]); continue; }
    if ((m = raw.match(/^<=?(-?[\d.]+)$/))) { terms.max = parseFloat(m[1]); continue; }
    if (raw === "danes") { const d = new Date(); d.setHours(0,0,0,0); terms.since = d; continue; }
    if (raw === "včeraj" || raw === "vceraj") { const d = new Date(); d.setDate(d.getDate()-1); d.setHours(0,0,0,0); terms.since = d; continue; }
    if (raw === "teden") { const d = new Date(); d.setDate(d.getDate()-7); terms.since = d; continue; }
    if (raw === "alarm" || raw === "alarmi") { terms.sev = "alert"; continue; }
    if (raw.startsWith("opozoril")) { terms.sev = "normal"; continue; }
    terms.text.push(raw);
  }
  return terms;
}
function matchesSearch(e, t) {
  if (t.sev && (e.severity || "") !== t.sev) return false;
  if (t.min != null && !(Number(e.value) >= t.min)) return false;
  if (t.max != null && !(Number(e.value) <= t.max)) return false;
  if (t.since && new Date(e.occurred_at) < t.since) return false;
  if (!t.text.length) return true;
  const hay = [eventLabel(e.event_type), e.event_type, e.title, e.message,
               e.device_name, e.category, e.metric].join(" ").toLowerCase();
  return t.text.every((w) => hay.includes(w));
}

const HOT_TYPES = ["vape", "vape_thc", "thc", "aggression", "gunshot", "keyword", "panic", "tamper", "smoking", "masking"];

// Človeku razumljive oznake za HALO event tipe (surovo ime ostane na hoverju).
const EVENT_BASE = {
  motion: "Gibanje", occupancy: "Zasedenost", comfort: "Udobje prostora",
  light: "Svetloba", air_quality: "Kakovost zraka", temperature: "Temperatura",
  humidity: "Vlaga", noise: "Hrup", sound: "Hrup", co2: "CO₂", tvoc: "TVOC",
  pm: "Delci v zraku", pm1: "Delci PM1", pm25: "Delci PM2.5", pm10: "Delci PM10",
  aqi: "Kakovost zraka", vape: "Vaping", vape_thc: "Vaping (THC)", thc: "Vaping (THC)",
  smoking: "Kajenje", masking: "Zakrivanje senzorja", aggression: "Agresija",
  gunshot: "Strel", help: "Klic na pomoč", keyword: "Ključna beseda",
  panic: "Panični gumb", tamper: "Poseg v napravo", pressure: "Zračni tlak",
};
const EVENT_SUFFIX = { start: "— začetek", stop: "— konec", occurred: "— sprožen", cleared: "— umirjen" };
// HALO driver moduli (diagnostika)
const DRIVER_NAMES = {
  thocc: "senzor temp./vlage/zasedenosti", co2: "CO₂ senzor", gas: "plinski senzor",
  pir: "PIR (gibanje)", lux: "svetlobni senzor", aud: "zvočni senzor",
  acc: "pospeškometer", br2: "senzor tlaka", ht4: "senzor temp./vlage",
  oled: "zaslon", ethsw: "omrežno stikalo",
};
function eventLabel(type) {
  if (!type) return "Dogodek";
  const t = String(type).toLowerCase();
  const m = t.match(/^(.*?)_(start|stop|occurred|cleared)$/);
  const base = m ? m[1] : t, suf = m ? (EVENT_SUFFIX[m[2]] || "") : "";
  if (EVENT_BASE[base]) return (EVENT_BASE[base] + (suf ? " " + suf : "")).trim();
  const dm = t.match(/^driver_(.+)$/);
  if (dm) return "HALO modul — " + (DRIVER_NAMES[dm[1]] || dm[1].toUpperCase());
  if (t === "system_health") return "Zdravje sistema";
  if (t === "device_event") return "Dogodek naprave";
  if (t === "notification") return "Obvestilo";
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const EV_SEVERITY = [
  { v: "", l: "Vse resnosti" }, { v: "alert", l: "Alarmi" },
  { v: "normal", l: "Umiritve" }, { v: "info", l: "Informativni" },
];
S.evFilter = { type: "", location: "", severity: "", q: "" };
// ---------- Eventi: najprej SKLEPI, nato surov dnevnik ----------
// Surov seznam pove, kaj se je zgodilo, ne pa, ali je bilo to nenavadno.
// Zato je zgoraj primerjava z enako dolgim prejsnjim obdobjem, spodaj pa
// dnevnik za tiste, ki hocejo videti vsak zapis.
S.dig = { period: "day", date: "" };

const DIG_PERIOD = [{ v: "day", l: "Dan" }, { v: "week", l: "Teden" }, { v: "month", l: "Mesec" }];

function digWhenOptions(period) {
  const now = new Date();
  const out = [{ v: "", l: period === "day" ? "Danes" : period === "week" ? "Ta teden" : "Ta mesec" }];
  if (period === "day") {
    for (let i = 1; i <= 30; i++) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      out.push({ v: localISO(d).slice(0, 10),
        l: i === 1 ? "Včeraj" : d.toLocaleDateString("sl", { weekday: "short", day: "2-digit", month: "2-digit" }) });
    }
  } else if (period === "week") {
    for (let i = 1; i <= 12; i++) {
      const d = new Date(now); d.setDate(d.getDate() - i * 7);
      const p = new Date(d); p.setDate(p.getDate() - ((p.getDay() + 6) % 7));
      out.push({ v: localISO(p).slice(0, 10), l: "teden od " + p.getDate() + ". " + (p.getMonth() + 1) + "." });
    }
  } else {
    for (let i = 1; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({ v: localISO(d).slice(0, 10),
        l: d.toLocaleDateString("sl", { month: "long", year: "numeric" }) });
    }
  }
  return out;
}

const DIG_ICON = { aqi: "⌁", pm25: "◍", tvoc: "≈", co2eq: "◎", temp_c: "☼", rh: "◈",
  lux: "☀", noise: "♪" };

// Majhna kartica ob drugih, ne pano cez celo sirino: sosednji kartici ze
// stejeta dogodke in gibanje, tu je samo bistvo obdobja.
function summaryCard(d) {
  const s = d.summary || {};
  if (!s.headline) return "";
  return '<div class="card ai-sum dig-ai" data-status="' + esc(s.status || "ok") + '">' +
    '<div class="ai-wash"><i class="b"></i><i class="f1"></i><i class="f2"></i></div>' +
    '<div class="ai-head">' + sumStars() +
      '<div class="ai-title">Povzetek obdobja</div>' +
    "</div>" +
    '<div class="ai-body">' +
      '<div class="ai-lead">' + esc(s.headline) + "</div>" +
      (s.short ? '<div class="ai-text">»' + esc(s.short) + "«</div>" : "") +
    "</div>" +
    '<div class="ai-stars-br">' + sumStars() + "</div>" +
  "</div>";
}

function digestCards(d) {
  const ch = d.changes || [];
  const a = d.activity || {};
  const ev = d.events || {};
  const base = d.baseline || {};
  // slovenska dvojina: 1 stvar drugačna, 2 stvari drugačni, 3-4 drugačne, 5+ drugačnih
  const oblika = (n, a, b, c, d) => (n % 100 === 1 ? a : n % 100 === 2 ? b
    : n % 100 === 3 || n % 100 === 4 ? c : d);
  const dovolj = (base.days || 0) >= 4;
  const glava = ch.length
    ? "Od običajnega dne " +
      oblika(ch.length, "odstopa 1 meritev.", "odstopata 2 meritvi.",
        "odstopajo " + ch.length + " meritve.", "odstopa " + ch.length + " meritev.")
    : dovolj ? "Nič ne izstopa iz običajnega dne."
      : "Za primerjavo z običajnim dnem je premalo zgodovine.";

  const vrstice = ch.map((c) => {
    const gor = c.dir === "up";
    // sigma pove, KOLIKO izstopa: 1,3 je na meji, 3 je res izjema
    const sig = c.sigma != null
      ? '<span class="dig-sig" title="Odmik v standardnih odklonih od običajnega dne">'
        + num(c.sigma, 1) + "σ</span>" : "";
    return '<div class="dig-row">' +
      '<span class="dig-ic">' + (DIG_ICON[c.key] || "•") + "</span>" +
      '<span class="dig-t">' + esc(c.text) + sig + "</span>" +
      '<span class="dig-n ' + (gor ? "up" : "down") + '">' + (gor ? "▲" : "▼") + " " +
        num(Math.abs(c.percent), 0) + " %</span>" +
      '<span class="dig-v">' + num(c.now, 1) + " " + esc(c.unit || "") +
        ' <small>običajno ' + num(c.usual, 1) + "</small></span></div>";
  }).join("") || '<div class="dig-empty">' + (dovolj
    ? "Vse meritve so v območju, kakršno ima običajen dan."
    : "Zbranih je šele " + (base.days || 0) + " dni meritev.") + "</div>";

  const promet = a.traffic
    ? '<span class="dig-pill ' + (a.traffic.dir === "up" ? "up" : "down") + '">' +
      esc(a.traffic.text) + " " + num(Math.abs(a.traffic.percent), 0) + " %</span>"
    : "";
  const gib = a.motion || {}, zas = a.occupancy || {};

  // Alarme primerjamo z obicajnim DNEM, ne s prejsnjim obdobjem: prejsnji
  // dan je lahko slucajno miren in potem vsak navaden dan izgleda kot skok.
  const naDan = base.alarms_per_day;
  const razlikaAlarm = dovolj && naDan != null ? (ev.alarm || 0) - naDan : null;
  return '<div class="card dig-card">' +
      '<div class="dig-head"><span class="dig-per">' + esc(d.range.label) + "</span>" +
        '<span class="muted">proti ' + esc(base.label || "običajnemu dnevu") + "</span></div>" +
      '<div class="dig-lead">' + esc(glava) + "</div>" +
      '<div class="dig-rows">' + vrstice + "</div>" +
    "</div>" +
    '<div class="grid cols-3" style="margin-top:12px">' +
      summaryCard(d) +
      '<div class="card">' +
        "<h3>Dogajanje v prostoru</h3>" +
        '<div class="dig-fact"><b>' + num(gib.periods || 0, 0) + "</b> obdobij gibanja, skupaj <b>" +
          humanDur((gib.minutes || 0) * 60) + "</b> " + promet + "</div>" +
        '<div class="dig-fact muted">' + (zas.periods
          ? num(zas.periods, 0) + " obdobij prisotnosti, največ " +
            oblika(Math.round(zas.peak || 0), "1 oseba", "2 osebi", (zas.peak || 0) + " osebe",
              num(zas.peak || 0, 0) + " oseb") + " hkrati"
          : "Prisotnosti ni bilo zaznane.") + "</div>" +
      "</div>" +
      '<div class="card">' +
        "<h3>Dogodki</h3>" +
        '<div class="dig-fact"><b class="' + ((ev.alarm || 0) > 0 ? "dig-alert" : "") + '">' +
          num(ev.alarm || 0, 0) + "</b> alarmov · <b>" + num(ev.warning || 0, 0) + "</b> opozoril" +
          (razlikaAlarm ? '<span class="dig-pill ' + (razlikaAlarm > 0 ? "up" : "down") + '">' +
            (razlikaAlarm > 0 ? "+" : "") + num(razlikaAlarm, 1) +
            " proti običajnemu dnevu</span>" : "") +
        "</div>" +
        '<div class="dig-fact muted">' + ((ev.top || []).length
          ? "Najpogosteje: " + ev.top.map((t) => esc(t.type) + " (" + t.count + ")").join(", ")
          : "Brez dogodkov v prostoru.") + "</div>" +
      "</div>" +
    "</div>";
}

async function viewEvents() {
  topControls("");
  spin();
  // Pogled potrebuje samo sklepe: dogodke bere casovna os sama, po dnevih in
  // sproti. Prej smo tu vlekli 300 vrstic dnevnika, od katerih jih je 98 %
  // bila telemetrija gonilnikov.
  let dig = null;
  try {
    dig = await apiGet("/api/v2/digest?period=" + S.dig.period +
      (S.dig.date ? "&date=" + S.dig.date : "")).catch(() => null);
  } catch (e) { return fail(e); }
  topControls(dd("ddDigPer") + dd("ddDigWhen"));
  setupDD("ddDigPer", DIG_PERIOD, S.dig.period, (v) => {
    S.dig.period = v; S.dig.date = ""; viewEvents();
  });
  setupDD("ddDigWhen", digWhenOptions(S.dig.period), S.dig.date, (v) => {
    S.dig.date = v; viewEvents();
  });

  main().innerHTML = `
    ${dig ? digestCards(dig) : ""}
    <div id="evAnswer"></div>
    <div id="tlHost"></div>
    <div id="mejeHost"></div>`;

  // Casovna os JE pogled na dogodke. Seznam 300 vrstic je bil 98 % telemetrije
  // gonilnikov, iskalno polje pa je zivelo lastno zivljenje nad njim -- oboje
  // je zamenjala os, na kateri dogodki stojijo tam, kjer so se zgodili.
  import("./casovnica.js" + ASSET_V).then(({ casovnicaMount }) => {
    const host = document.getElementById("tlHost");
    if (!host) return;                       // uporabnik je medtem zamenjal pogled
    if (S._tlOff) S._tlOff();
    S._tlOff = casovnicaMount(host, {
      api: apiGet,
      reduced: REDUCED || PREFS.motion === "off",
      // dropdowni so isti gradnik kot povsod drugod; os jih dobi od tod, da
      // ne obstajata dve vrsti menija, ki izgledata skoraj enako
      dd, setupDD,
    });
  }).catch(() => {});

  mejeMount();
  // Search V3 odgovori na vprasanje nad seznamom; seznam filtriramo lokalno,
  // da tipkanje ostane trenutno.
  evAsk(S.evFilter.q);
}

// ---------- Meje meritev ----------
// Stiri stevilke same po sebi ne povedo nicesar, zato ima vsaka meritev tudi
// stavek, kaj te meje pomenijo, in trak, ki isto pokaze slikovno: rdece skrajno
// levo in desno (alarm), jantar ob njem (opozorilo), zeleno v sredini.
const MEJE_SKUPINE = { air: "Zrak", comfort: "Udobje", security: "Varnost", presence: "Prisotnost" };
const MEJE_POLJA = [
  ["alert_low", "Alarm pod", "alert"],
  ["warning_low", "Opozorilo pod", "warn"],
  ["warning_high", "Opozorilo nad", "warn"],
  ["alert_high", "Alarm nad", "alert"],
];
const MEJE = { data: null, odprt: false, spremembe: {} };

async function mejeMount() {
  const host = document.getElementById("mejeHost");
  if (!host) return;
  host.innerHTML =
    '<button class="ev-types-btn meje-btn" id="mejeBtn" type="button">' +
      "Meje in alarmi" +
      '<svg viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" ' +
      'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
    '<div class="meje" id="mejeBox" hidden></div>';
  const btn = document.getElementById("mejeBtn");
  const box = document.getElementById("mejeBox");
  btn.addEventListener("click", async () => {
    const odpri = box.hasAttribute("hidden");
    if (!odpri) {
      btn.classList.remove("on");
      box.setAttribute("hidden", "");
      MEJE.odprt = false;
      return;
    }
    btn.classList.add("on");
    box.removeAttribute("hidden");
    MEJE.odprt = true;
    if (!MEJE.data) {
      box.innerHTML = '<div class="ev-load">Nalagam meje…</div>';
      try { MEJE.data = await apiGet("/api/v2/limits"); }
      catch { box.innerHTML = '<div class="ev-load">Mej ni bilo mogoče naložiti.</div>'; return; }
    }
    mejePaint();
    if (!REDUCED && PREFS.motion !== "off") {
      box.animate([{ opacity: 0, transform: "translateY(-6px)", filter: "blur(6px)" },
                   { opacity: 1, transform: "none", filter: "blur(0px)" }],
        { duration: 380, easing: "cubic-bezier(0.16, 1, 0.22, 1)" });
    }
  });
}

function mejeTrak(m) {
  // Trak pokaze isto kot stevilke, samo takoj razumljivo. Sirine so enakomerne,
  // ker vrednosti niso na skupni skali -- pomembno je zaporedje, ne razmerje.
  const l = m.limits || {};
  const kosi = [];
  if (l.alert_low != null) kosi.push(["alert", "alarm"]);
  if (l.warning_low != null) kosi.push(["warn", "opozorilo"]);
  kosi.push(["ok", "v redu"]);
  if (l.warning_high != null) kosi.push(["warn", "opozorilo"]);
  if (l.alert_high != null) kosi.push(["alert", "alarm"]);
  return '<div class="meje-trak">' + kosi.map(([c, t]) =>
    '<i class="' + c + '" title="' + esc(t) + '"></i>').join("") + "</div>";
}

function mejePaint() {
  const box = document.getElementById("mejeBox");
  if (!box || !MEJE.data) return;
  const po = {};
  (MEJE.data.metrics || []).forEach((m) => (po[m.group] = po[m.group] || []).push(m));
  const polje = (m, [k, oznaka, cls]) => {
    const v = m.limits[k];
    const rocno = (m.custom || []).includes(k);
    return '<label class="meje-f' + (rocno ? " rocno" : "") + '">' +
      '<span class="meje-l ' + cls + '">' + oznaka + "</span>" +
      '<input class="select" type="number" step="any" data-k="' + esc(m.key) + '" data-m="' + k +
        '" value="' + (v == null ? "" : v) + '" placeholder="' +
        (m.inherited[k] == null ? "—" : m.inherited[k]) + '">' +
      "</label>";
  };
  box.innerHTML =
    '<div class="meje-uvod">Kdaj je meritev opozorilo in kdaj alarm. Prazno polje pomeni ' +
      '»brez te meje«; siva številka v ozadju je privzeta vrednost, ki velja, ' +
      "dokler ne vpišeš svoje.</div>" +
    Object.keys(MEJE_SKUPINE).filter((g) => po[g]).map((g) =>
      '<div class="meje-skupina"><div class="meje-naslov">' + MEJE_SKUPINE[g] + "</div>" +
      po[g].map((m) =>
        '<div class="meje-vrstica" data-key="' + esc(m.key) + '">' +
          '<div class="meje-ime"><b>' + esc(m.label) + "</b>" +
            (m.unit ? '<span class="meje-e">' + esc(m.unit) + "</span>" : "") +
            ((m.custom || []).length ? '<span class="meje-znak">po meri</span>' : "") +
          "</div>" +
          mejeTrak(m) +
          '<div class="meje-polja">' + MEJE_POLJA.map((f) => polje(m, f)).join("") + "</div>" +
          '<div class="meje-txt">' + esc(m.text || "") + "</div>" +
        "</div>").join("") + "</div>").join("") +
    '<div class="meje-noga">' +
      '<button class="btn primary" id="mejeSave">Shrani meje</button>' +
      '<button class="btn" id="mejeReset">Povrni privzeto</button>' +
      '<span class="muted" id="mejeMsg"></span></div>';

  box.querySelectorAll("input[data-k]").forEach((i) =>
    i.addEventListener("input", () => {
      const k = i.dataset.k;
      MEJE.spremembe[k] = MEJE.spremembe[k] || {};
      MEJE.spremembe[k][i.dataset.m] = i.value;
      document.getElementById("mejeMsg").textContent = "Neshranjeno.";
    }));
  document.getElementById("mejeSave").addEventListener("click", mejeSave);
  document.getElementById("mejeReset").addEventListener("click", () => {
    box.querySelectorAll("input[data-k]").forEach((i) => (i.value = ""));
    MEJE.spremembe = { __vse: true };
    document.getElementById("mejeMsg").textContent = "Vse meje bodo privzete — shrani za potrditev.";
  });
}

async function mejeSave() {
  const box = document.getElementById("mejeBox");
  const msg = document.getElementById("mejeMsg");
  // Poslati moramo CELO sliko, ne le sprememb: prazno polje pomeni "brez
  // meje", in tega z delnim zapisom ne bi mogli izraziti.
  const limits = {};
  box.querySelectorAll("input[data-k]").forEach((i) => {
    if (i.value === "") return;
    limits[i.dataset.k] = limits[i.dataset.k] || {};
    limits[i.dataset.k][i.dataset.m] = i.value;
  });
  msg.textContent = "Shranjujem…";
  try {
    MEJE.data = await apiSend("PUT", "/api/v2/limits", { limits });
    MEJE.spremembe = {};
    mejePaint();
    document.getElementById("mejeMsg").textContent = "Shranjeno.";
    toast("info", "Meje shranjene", "Nove meje veljajo za vse nadaljnje meritve.");
    loadOverview(true);          // stanje in barve se preracunajo takoj
  } catch (e) {
    msg.textContent = "Napaka: " + (e.message || "neznana");
  }
}

// Ena vrstica seznama je palica, ki se ob kliku razpre -- brez okna, ker je
// kontekst dogodka del seznama in ne nov kraj.
function evBar(e) {
  const sev = e.severity || "info";
  const raw = e.event_type || e.category || "";
  return `<div class="ev-bar" data-id="${e.id}" data-sev="${esc(sev)}">
    <button class="ev-head" type="button">
      <span class="sev-dot sev-${esc(sev)}"></span>
      <span class="ev-t" title="${esc(raw)}">${esc(eventLabel(raw))}</span>
      <span class="ev-d">${esc(e.title || e.message || "—")}</span>
      <span class="ev-loc">${esc(e.device_name || "—")}</span>
      <span class="ev-time">${dateTime(e.occurred_at)}</span>
      <span class="ev-val">${e.value != null ? num(e.value, 1) + " " + esc(e.unit || "") : ""}</span>
      <svg class="ev-chev" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="ev-body"></div>
  </div>`;
}

// Namigi so vstopna tocka: prazno polje ne sme biti prazna stran.
const EV_TIPS = [
  "danes", "ta teden", "alarmi", "kajenje", "vape", "gibanje", "temperatura",
];
function evTips(box) {
  const host = document.getElementById("evTips");
  if (!host || !box) return;
  host.innerHTML = "Poskusi: " + EV_TIPS.map((t) =>
    '<button class="ev-tip" type="button" data-q="' + esc(t) + '">' + esc(t) + "</button>").join("");
  host.querySelectorAll(".ev-tip").forEach((b) => b.addEventListener("click", () => {
    box.value = b.dataset.q;
    S.evFilter.q = b.dataset.q;
    viewEvents();
  }));
}

// Odgovor iskalnika nad seznamom. Prazno vprasanje = brez odgovora.
let _evAskSeq = 0;
async function evAsk(q) {
  const host = document.getElementById("evAnswer");
  if (!host) return;
  if (!q || q.trim().length < 3) { host.innerHTML = ""; return; }
  const seq = ++_evAskSeq;
  let d;
  try { d = await apiGet("/api/v2/search?q=" + encodeURIComponent(q)); }
  catch { return; }
  if (seq !== _evAskSeq) return;
  const h = document.getElementById("evAnswer");
  if (!h) return;
  const a = d.answer;
  if (!a || !a.headline) { h.innerHTML = ""; return; }
  const cls = a.verdict === "yes" ? "yes" : a.verdict === "no" ? "no" : "maybe";
  h.innerHTML = '<div class="ev-answer ' + cls + '">' +
    '<div class="ea-head">' + esc(a.headline) + "</div>" +
    (a.detail_short || a.detail
      ? '<div class="ea-detail">' + esc(a.detail_short || a.detail) + "</div>" : "") +
    ((a.suggested_followups || []).length
      ? '<div class="ea-next">' + a.suggested_followups.slice(0, 3).map((f) =>
        '<button class="ev-tip" type="button" data-q="' + esc(f.query || f.label) + '">' +
        esc(f.label) + "</button>").join("") + "</div>" : "") +
    "</div>";
  h.querySelectorAll(".ev-tip").forEach((b) => b.addEventListener("click", () => {
    S.evFilter.q = b.dataset.q; viewEvents();
  }));
  if (!REDUCED && PREFS.motion !== "off") blurIn(h.querySelector(".ev-answer"));
}

// Razpiranje palice: visina raste iz nic, vsebina se nalozi sele ob prvem
// odprtju. Popup smo odstranili -- kontekst dogodka je del seznama in ne
// nov kraj, kamor te vrze.
async function evToggle(bar) {
  if (!bar || bar._busy) return;
  const body = bar.querySelector(".ev-body");
  const odprt = bar.classList.contains("open");
  const mir = REDUCED || PREFS.motion === "off";
  if (odprt) {
    bar.classList.remove("open");
    if (mir) { body.style.height = "0px"; return; }
    bar._busy = true;
    const a = body.animate([{ height: body.scrollHeight + "px", opacity: 1 },
                            { height: "0px", opacity: 0 }],
      { duration: 260, easing: "cubic-bezier(0.5, 0, 0.9, 0.4)" });
    const konec = () => {
      body.style.height = "0px";
      bar._busy = false;
      try { a.cancel(); } catch {}
    };
    a.onfinish = konec;
    setTimeout(konec, 360);
    return;
  }
  bar.classList.add("open");
  if (!body.dataset.filled) {
    body.innerHTML = '<div class="ev-load">Nalagam kontekst…</div>';
    body.dataset.filled = "1";
    evFill(bar, body);
  }
  body.style.height = "auto";
  if (mir) return;
  bar._busy = true;
  const h = body.scrollHeight;
  const a = body.animate([
    { height: "0px", opacity: 0, filter: "blur(7px)" },
    { height: h + "px", opacity: 1, filter: "blur(0px)" },
  ], { duration: 420, easing: "cubic-bezier(0.16, 1, 0.22, 1)" });
  const konec = () => {
    bar._busy = false;
    // Ce slicice ne tecejo, animacija obtici na prvi tocki (visina 0) in
    // vrstica bi ostala videti zaprta. Po roku jo odpovemo -- obvelja
    // "auto" in vsebina je vidna v vsakem primeru.
    try { a.cancel(); } catch {}
    if (bar.classList.contains("open")) body.style.height = "auto";
  };
  a.onfinish = konec;
  setTimeout(konec, 520);
  squish(bar);
}

async function evFill(bar, body) {
  let ctx;
  try { ctx = await apiGet("/api/v2/event-context?event_id=" + bar.dataset.id); }
  catch { body.innerHTML = '<div class="ev-load">Konteksta ni bilo mogoče naložiti.</div>'; return; }
  const ev = ctx.event;
  const metric = ev.metric && ctx.telemetry.length ? ev.metric : null;
  const pts = metric
    ? ctx.telemetry.map((r) => ({ t: r.ts, v: r[metric] })).filter((p) => p.v != null) : [];
  body.innerHTML =
    '<div class="ev-grid">' +
      '<dl class="kv">' +
        "<dt>Čas</dt><dd>" + dateTime(ev.occurred_at) + "</dd>" +
        "<dt>Naprava</dt><dd>" + esc(ev.device_name || "—") + "</dd>" +
        "<dt>Kategorija</dt><dd>" + esc(ev.category || "—") + "</dd>" +
        "<dt>Meritev</dt><dd>" + esc(ev.metric || "—") + " " +
          (ev.value != null ? num(ev.value) + " " + esc(ev.unit || "") : "") + "</dd>" +
        "<dt>Prag</dt><dd>" + (ev.threshold != null ? num(ev.threshold) : "—") + "</dd>" +
        '<dt>Surovo ime</dt><dd class="ev-raw">' + esc(ev.event_type || "—") + "</dd>" +
      "</dl>" +
      '<div class="ev-chart"><div class="ev-chart-t">Telemetrija ±10 min' +
        (metric ? " · " + esc(metric) : "") + "</div>" +
        '<div class="ev-chart-host"></div></div>' +
    "</div>" +
    (ev.message ? '<div class="ev-msg">' + esc(ev.message) + "</div>" : "");
  const host = body.querySelector(".ev-chart-host");
  if (pts.length) host.appendChild(lineChart(pts, { unit: ev.unit || "" }));
  else host.innerHTML = '<div class="muted" style="font-size:12px">Ni telemetrije v tem oknu.</div>';
  if (bar.classList.contains("open")) body.style.height = "auto";
}

async function openEventContext(id) {
  let ctx;
  try { ctx = await apiGet("/api/v2/event-context?event_id=" + id); } catch (e) { return; }
  const ev = ctx.event;
  const metric = ev.metric && ctx.telemetry.length ? ev.metric : null;
  const pts = metric ? ctx.telemetry.map((r) => ({ t: r.ts, v: r[metric] })).filter((p) => p.v != null) : [];
  const back = document.createElement("div");
  back.className = "modal-back";
  back.innerHTML = `<div class="modal">
    <button class="btn close">Zapri</button>
    <h2 style="margin-top:0;margin-bottom:2px">${esc(eventLabel(ev.event_type) || ev.title || "Dogodek")}</h2>
    <p class="muted" style="margin:0 0 16px;font-size:12px">surovo ime: <span style="font-family:var(--mono)">${esc(ev.event_type || "—")}</span></p>
    <dl class="kv">
      <dt>Čas</dt><dd>${dateTime(ev.occurred_at)}</dd>
      <dt>Naprava</dt><dd>${esc(ev.device_name || "—")}</dd>
      <dt>Kategorija</dt><dd>${esc(ev.category || "—")}</dd>
      <dt>Meritev</dt><dd>${esc(ev.metric || "—")} ${ev.value != null ? num(ev.value) + " " + esc(ev.unit || "") : ""}</dd>
      <dt>Prag</dt><dd>${ev.threshold != null ? num(ev.threshold) : "—"}</dd>
      <dt>Sporočilo</dt><dd>${esc(ev.message || "—")}</dd>
    </dl>
    <div class="section-title">Telemetrija okoli dogodka (±10 min)${metric ? " — " + esc(metric) : ""}</div>
    <div id="evCtxChart"><div class="muted">Ni telemetrije v oknu ±10 min.</div></div>
  </div>`;
  document.body.appendChild(back);
  if (pts.length) {
    const host = back.querySelector("#evCtxChart");
    host.innerHTML = "";
    host.appendChild(lineChart(pts, { unit: ev.unit || "" }));
  }
  const close = () => back.remove();
  back.addEventListener("click", (e) => { if (e.target === back || e.target.classList.contains("close")) close(); });
}

// ---------- Trends ----------
S.trend = { metric: "aqi", range: "24h" };
// Seznami metrik NISO več trdo kodirani — pridejo iz registra
// (/api/v2/metrics), da nova metrika ne zahteva urejanja frontenda.
let METRICS = [];          // [[key, label], ...] za dropdown
let METRIC_EXPLAIN = {};   // key -> razlaga v preprostem jeziku
let DETAIL_METRICS = [];   // [[key, label, unit], ...] za ploščice
let METRIC_BY_KEY = {};

async function loadMetricRegistry() {
  try {
    const r = await apiGet("/api/v2/metrics");
    const list = r.metrics || [];
    METRIC_BY_KEY = Object.fromEntries(list.map((m) => [m.key, m]));
    METRICS = list.map((m) => [m.key, m.label]);
    METRIC_EXPLAIN = Object.fromEntries(list.map((m) => [m.key, m.explain]));
    // v detajlu naprave pokazi vse razen varnostnih detekcij (te dobijo
    // svoj prostor, ker so odkloni in ne absolutne vrednosti)
    DETAIL_METRICS = list.map((m) => [m.key, m.label, m.unit]);
  } catch { /* ostane prazno; UI pade nazaj na kljuce */ }
}
const RANGES = [["1h", "1 h"], ["6h", "6 h"], ["24h", "24 h"], ["7d", "7 dni"], ["30d", "30 dni"]];
const CMP_OPTS = [
  { v: "", l: "Brez primerjave" },
  { v: "prev", l: "Prejšnje obdobje" },
  { v: "week", l: "Isti čas prejšnji teden" },
];
const RANGE_SECONDS = { "1h": 3600, "6h": 21600, "24h": 86400, "7d": 604800, "30d": 2592000 };
// lokalni ISO brez časovnega pasu (backend bere naivni lokalni čas)
const localISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
// zoom-on-hover: mocnejsi tam, kjer je graf stisnjen (7/30 dni)
const ZOOM_BY_RANGE = { "1h": 1, "6h": 1.5, "24h": 2.5, "7d": 5, "30d": 7 };

// Razlage za končnega uporabnika (preprost jezik, brez žargona).


function assessValue(v, thr) {
  if (v == null || !thr) return { lvl: "ok", label: "V redu", deg: 0, text: "Vrednost je v priporočenem območju." };
  if ((thr.alert_high != null && v >= thr.alert_high) || (thr.alert_low != null && v <= thr.alert_low))
    return { lvl: "alert", label: "Kritično", deg: 1, text: "Vrednost je čez alarmno mejo — priporočamo takojšnje ukrepanje." };
  if ((thr.warning_high != null && v > thr.warning_high) || (thr.warning_low != null && v < thr.warning_low)) {
    // koliko poti do alarmne meje je ze prehojene -- malo cez in mocno cez
    // nista isto, zato ima mocno preseganje svoj, temnejsi ton
    let deg = 0.5;
    if (thr.warning_high != null && v > thr.warning_high) {
      const razpon = (thr.alert_high != null && thr.alert_high > thr.warning_high)
        ? thr.alert_high - thr.warning_high : Math.max(Math.abs(thr.warning_high) * 0.5, 1e-6);
      deg = Math.max(0, Math.min(1, (v - thr.warning_high) / razpon));
    }
    return { lvl: "warning", deg,
      label: deg >= 0.5 ? "Močno povišano" : "Povišano",
      text: deg >= 0.5
        ? "Vrednost je krepko izven priporočenega območja — blizu alarmne meje."
        : "Vrednost je izven priporočenega območja — spremljajte oz. prezračite/uredite prostor." };
  }
  return { lvl: "ok", label: "V redu", deg: 0, text: "Vrednost je v priporočenem območju." };
}

// Izbira datuma prek dropdowna (native date/month input je nerodno za tipkanje).
function lastDaysOptions(n = 30) {
  const out = [{ v: "", l: "Danes" }];
  for (let i = 1; i <= n; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const v = localISO(d).slice(0, 10);
    const l = i === 1 ? "Včeraj"
      : d.toLocaleDateString("sl", { weekday: "short", day: "2-digit", month: "2-digit" });
    out.push({ v, l });
  }
  return out;
}
function lastMonthsOptions(n = 12) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    out.push({
      v: localISO(d).slice(0, 7),
      l: d.toLocaleDateString("sl", { month: "long", year: "numeric" }) + (i === 0 ? " (ta mesec)" : ""),
    });
  }
  return out;
}


// Izbira obdobja se prilagodi granulaciji: pri urah izbiraš dan + uro,
// pri 24 h dan, pri tednu teden, pri mesecu mesec.
// Izbira obdobja se ZOZI po korakih: ko izberes mesec in preklopis na 24 h,
// ti ponudi dneve TISTEGA meseca; ko izberes dan in gres na 1 h, ti ponudi ure
// tistega dne. Brez tega bi moral seznam ponuditi vse ure vseh dni vseh
// mesecev, kar v en dropdown ne gre.
function monthEnd(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 0, 0); }

function weekEndsOfMonth(anchor) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const out = [];
  let e = monthEnd(anchor);
  while (e >= first) {
    out.push(new Date(e));
    const n = new Date(e); n.setDate(n.getDate() - 7); e = n;
  }
  return out;
}

function anchorOptions(range, when) {
  const out = [{ v: "", l: "Do zdaj" }];
  const now = new Date();
  const a = when ? new Date(when) : null;
  const sameMonth = a && a.getFullYear() === now.getFullYear() && a.getMonth() === now.getMonth();
  const dm = (x) => x.toLocaleDateString("sl", { day: "2-digit", month: "2-digit" });

  if (range === "30d") {
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59); // konec meseca
      out.push({ v: localISO(d), l: d.toLocaleDateString("sl", { month: "long", year: "numeric" }) });
    }
  } else if (range === "7d") {
    if (a) {                                   // tedni znotraj izbranega meseca
      weekEndsOfMonth(a).forEach((end) => {
        if (end > now) return;
        const st = new Date(end); st.setDate(st.getDate() - 6);
        out.push({ v: localISO(end), l: `${dm(st)} – ${dm(end)}` });
      });
    } else {
      for (let i = 0; i < 12; i++) {
        const end = new Date(now); end.setDate(end.getDate() - i * 7); end.setHours(23, 59, 0, 0);
        const st = new Date(end); st.setDate(st.getDate() - 6);
        out.push({ v: localISO(end), l: `${dm(st)} – ${dm(end)}` });
      }
    }
  } else if (range === "24h") {
    if (a) {                                   // dnevi izbranega meseca
      const last = sameMonth ? now.getDate() : monthEnd(a).getDate();
      for (let day = last; day >= 1; day--) {
        const d = new Date(a.getFullYear(), a.getMonth(), day, 23, 59, 0, 0);
        const danes = sameMonth && day === now.getDate();
        const vceraj = sameMonth && day === now.getDate() - 1;
        out.push({ v: localISO(d), l: danes ? "Danes" : vceraj ? "Včeraj"
          : d.toLocaleDateString("sl", { weekday: "short", day: "2-digit", month: "2-digit" }) });
      }
    } else {
      for (let i = 0; i < 30; i++) {
        const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(23, 59, 0, 0);
        out.push({ v: localISO(d), l: i === 0 ? "Danes" : i === 1 ? "Včeraj"
          : d.toLocaleDateString("sl", { weekday: "short", day: "2-digit", month: "2-digit" }) });
      }
    }
  } else if (a) {                              // ure izbranega dne
    const sameDay = a.toDateString() === now.toDateString();
    const hFrom = sameDay ? now.getHours() : 23;
    for (let h = hFrom; h >= 0; h--) {
      const d = new Date(a.getFullYear(), a.getMonth(), a.getDate(), h, 0, 0, 0);
      out.push({ v: localISO(d), l: (sameDay ? "danes" : dm(d)) + " do " +
        String(h).padStart(2, "0") + ":00" });
    }
  } else {
    // brez izbranega dneva: zadnjih 7 dni po urah
    for (let day = 0; day < 7; day++) {
      for (let h = 23; h >= 0; h--) {
        const d = new Date(now); d.setDate(d.getDate() - day); d.setHours(h, 0, 0, 0);
        if (d > now) continue;
        const dayLbl = day === 0 ? "danes" : day === 1 ? "včeraj" : dm(d);
        out.push({ v: localISO(d), l: `${dayLbl} do ${String(h).padStart(2, "0")}:00` });
      }
    }
  }
  return out;
}

// Ob menjavi dolzine obdobja izbrani cas OSTANE, le zaokrozi se na novo
// natancnost (mesec -> dan -> ura). Ce tako nastali cas v novem seznamu ne
// obstaja (npr. je v prihodnosti), vzame najblizjega mozneg.
function narrowAnchor(when, to) {
  if (!when) return "";
  const d = new Date(when);
  if (Number.isNaN(d.getTime())) return "";
  let c;
  if (to === "30d") c = monthEnd(d);
  else if (to === "7d") {
    const ends = weekEndsOfMonth(d);
    c = [...ends].reverse().find((e) => e >= d) || ends[0];
  } else if (to === "24h") c = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 0, 0);
  else c = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), 0, 0, 0);
  const v = localISO(c);
  const opts = anchorOptions(to, v);
  if (opts.some((o) => o.v === v)) return v;
  return opts[1] ? opts[1].v : "";
}

const TMODE_OPTS = [{ v: "chart", l: "Graf metrike" }, { v: "alarms", l: "Alarmi (vse metrike skupaj)" }, { v: "dev", l: "Odstopanja (vse metrike)" }];
const DEVWIN_OPTS = [
  { v: "day", l: "Dnevno (zadnji dan)" },
  { v: "week", l: "Tedensko (zadnji teden)" },
  { v: "month", l: "Mesečno (zadnji mesec)" },
];
const DEVHOURS_OPTS = [
  { v: "all", l: "Cel dan (24 h)" },
  { v: "work", l: "Delovni čas (7–19)" },
  { v: "night", l: "Ponoči (19–7)" },
];

// ---------- Prehod med grafi ----------
// Izhod in vhod NISTA ista animacija. Staro odide hitro in pospeseno (ne
// zanima nas vec), novo pride pocasneje in se umiri z expo-out ter rahlim
// stiskom -- tako ima obcutek mase. Blur nosi globino in hkrati skrije, da
// se krivulja ne more zares preoblikovati v drugo.
const T_OUT = "cubic-bezier(0.5, 0, 0.9, 0.35)";     // pospesevanje stran
const T_IN = "cubic-bezier(0.16, 1, 0.22, 1)";       // expo-out, dolgo umirjanje

// Smer pove razmerje med starim in novim: nazaj po casu = novo prihaja z
// leve, daljse obdobje = pogled se oddalji.
function trendMotion() {
  const nextEnd = S.trend.when ? new Date(S.trend.when).getTime() : Date.now();
  const prevEnd = S.trend._end;
  const prevRange = S.trend._range;
  const span = RANGE_SECONDS[S.trend.range] || 86400;
  const prevSpan = RANGE_SECONDS[prevRange] || span;
  let kind = "fade", dir = 0;
  if (prevRange && prevRange !== S.trend.range) {
    kind = "zoom"; dir = span > prevSpan ? 1 : -1;      // 1 = oddalji se
  } else if (prevEnd != null && Math.abs(nextEnd - prevEnd) > span * 250) {
    kind = "pan"; dir = nextEnd < prevEnd ? -1 : 1;     // -1 = nazaj po casu
  }
  S.trend._end = nextEnd;
  S.trend._range = S.trend.range;
  return { kind, dir };
}

function trendExit(el, m) {
  if (!el || REDUCED || PREFS.motion === "off") return null;
  const x = m.kind === "pan" ? m.dir * -26 : 0;         // staro odplava nasproti
  const sc = m.kind === "zoom" ? (m.dir > 0 ? 1.03 : 0.975) : 1;
  return el.animate([
    { filter: "blur(0px)", opacity: 1, transform: "translateX(0) scale(1) scaleY(1)" },
    { filter: "blur(9px)", opacity: 0,
      transform: `translateX(${x}px) scale(${sc}) scaleY(0.955)` },
  ], { duration: 200, easing: T_OUT, fill: "forwards" });
}

function trendEnter(el, m, delay = 0) {
  if (!el || REDUCED || PREFS.motion === "off") return;
  const x = m.kind === "pan" ? m.dir * 30 : 0;          // novo prileti z one strani
  const sc = m.kind === "zoom" ? (m.dir > 0 ? 0.965 : 1.035) : 1;
  const a = el.animate([
    { filter: "blur(12px)", opacity: 0.12, offset: 0,
      transform: `translateX(${x}px) scale(${sc}) scaleY(1.055) scaleX(0.986)` },
    { filter: "blur(2.5px)", opacity: 0.92, offset: 0.5,
      transform: `translateX(${x * 0.14}px) scale(1) scaleY(0.984) scaleX(1.005)` },
    { filter: "blur(0px)", opacity: 1, offset: 0.78,
      transform: "translateX(0) scale(1) scaleY(1.006) scaleX(0.998)" },
    { filter: "blur(0px)", opacity: 1, offset: 1, transform: "none" },
  ], { duration: 560, delay, easing: T_IN, fill: "backwards" });
  // ciscenje ne sme viseti na tem, ali animacija pride do konca
  a.onfinish = () => a.cancel();
  setTimeout(() => { try { a.cancel(); } catch {} }, 560 + delay + 260);
}

async function viewTrends() {
  if (S.trendTimer) { clearInterval(S.trendTimer); S.trendTimer = null; }
  if ((S.trend.mode || "chart") === "dev") return viewDeviations();
  if (S.trend.mode === "alarms") return viewAlarmScope();
  // stari graf se zablura in umakne, medtem ko tečejo podatki za novega —
  // namesto da bi vsebina izginila in se čez hip pojavila
  const oldMain = document.getElementById("main");
  const motion = trendMotion();
  // Ce graf ze stoji, ga NE rusimo: podatki se bodo preoblikovali v novega
  // (val cez krivuljo), zato ni ne izhodne animacije ne skeletona.
  const liveHost = document.getElementById("chartHost");
  const liveWrap = liveHost && liveHost.firstElementChild;
  const willMorph = !!(liveWrap && liveWrap.morphTo) && !REDUCED && PREFS.motion !== "off";
  let blurAnim = null;
  if (!willMorph && oldMain && oldMain.dataset.view === "trends") {
    blurAnim = trendExit(oldMain, motion);
  }
  // Zamegljenost drži samo, dokler tečejo podatki. Če se pogled konča prej
  // (ni podatkov, napaka), jo je treba odstraniti — sicer ostane cel zaslon
  // zabrisan. Varovalka velja tudi, če kaj vmes odpove.
  const clearBlur = () => {
    if (blurAnim) { blurAnim.cancel(); blurAnim = null; }
    const m = document.getElementById("main");
    if (m) m.getAnimations().forEach((a) => { if (a !== blurAnim) a.cancel(); });
  };
  const blurGuard = setTimeout(clearBlur, 2500);
  topControls(dd("ddMode") + dd("ddMetric") + dd("ddRange") + dd("ddWhen") + dd("ddCmp") + dd("ddLoc"));
  setupDD("ddMode", TMODE_OPTS, S.trend.mode || "chart",
    (v) => { S.trend.mode = v; viewTrends(); });
  setupDD("ddMetric", METRICS.map(([v, l]) => ({ v, l })), S.trend.metric,
    (v) => { S.trend.metric = v; viewTrends(); });
  setupDD("ddRange", RANGES.map(([v, l]) => ({ v, l })), S.trend.range,
    (v) => {
      // izbrani cas se ohrani in samo zaokrozi -- iz maja na 24 h ostanes v maju
      S.trend.when = narrowAnchor(S.trend.when, v);
      S.trend.range = v;
      viewTrends();
    });
  setupDD("ddWhen", anchorOptions(S.trend.range, S.trend.when), S.trend.when || "",
    (v) => { S.trend.when = v; viewTrends(); });
  setupDD("ddCmp", CMP_OPTS, S.trend.compare || "",
    (v) => { S.trend.compare = v; viewTrends(); });
  setupDD("ddLoc",
    [{ v: "", l: "Vse lokacije" }, ...(S.overview?.locations || []).map((l) => ({ v: l, l }))],
    S.location, (v) => { S.location = v; viewTrends(); });
  if (!willMorph) spin();          // pri morphu stari graf ostane, dokler ne pridejo podatki
  const locQ = S.location ? "&location=" + encodeURIComponent(S.location) : "";
  let d;
  const whenQ = S.trend.when ? `&end=${encodeURIComponent(S.trend.when)}` : "";
  try { d = await apiGet(`/api/v2/trends?metric=${S.trend.metric}&range=${S.trend.range}${whenQ}${locQ}`); }
  catch (e) { clearTimeout(blurGuard); clearBlur(); return fail(e); }
  if (!d.points.length) {
    clearTimeout(blurGuard); clearBlur();
    main().innerHTML = `<div class="empty">Za izbrano obdobje ni meritev.
      <div style="margin-top:8px;font-size:12px">Poskusi drug dan ali daljše obdobje.</div></div>`;
    return;
  }

  // primerjalno obdobje: prejšnje okno ali isti čas prejšnji teden
  let cmpPts = [], cmpLabel = "";
  const cmpMode = S.trend.compare || "";
  if (cmpMode) {
    const spanS = RANGE_SECONDS[S.trend.range] || 86400;
    const shiftS = cmpMode === "week" ? 604800 : spanS;
    cmpLabel = cmpMode === "week" ? "prejšnji teden" : "prejšnje obdobje";
    try {
      const endShift = new Date(Date.now() - shiftS * 1000);
      const c = await apiGet(`/api/v2/trends?metric=${S.trend.metric}&range=${S.trend.range}&end=${encodeURIComponent(localISO(endShift))}${locQ}`);
      // časovno poravnaj na primarno okno
      cmpPts = (c.points || []).map((p) => ({ t: new Date(new Date(p.t).getTime() + shiftS * 1000).toISOString(), v: p.v }));
    } catch { cmpPts = []; }
  }
  const vals = d.points.map((p) => p.v);
  const last = vals[vals.length - 1], first = vals[0];
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  // Pri daljših obdobjih so točke 5-min POVPREČJA; vrh, ki je trajal nekaj
  // sekund, bi se v povprečju izgubil. Ekstreme zato beremo iz min/max
  // vrednosti rollupa (lo/hi), ki ju baza hrani prav za to.
  const mn = Math.min(...d.points.map((p) => (p.lo != null ? p.lo : p.v)));
  const mx = Math.max(...d.points.map((p) => (p.hi != null ? p.hi : p.v)));
  const delta = last - first;
  const arrow = delta > 0 ? "▲" : delta < 0 ? "▼" : "→";
  S.trend._data = d;                 // odprti pop-up mora dobiti SVEZE podatke

  // ZIVA POT: ogrodje ostane, menjajo se samo podatki -- krivulja se preoblikuje,
  // stevilke se prestejejo. Nic se ne odmontira in nic ne utripne.
  if (willMorph && document.getElementById("trendCard")) {
    clearTimeout(blurGuard);
    const m = main();
    const set = (id, txt) => { const el = document.getElementById(id); if (el && el.textContent !== txt) el.textContent = txt; };
    set("tUnit", d.unit || "");
    set("tDelta", `${arrow} ${num(Math.abs(delta), 1)} v obdobju`);
    set("tRes", d.resolution === "5m" ? "5-min povprečja" : "surovo");
    tweenStat(m, "thead", last, 1);
    tweenStat(m, "tavg", avg, 1);
    tweenStat(m, "tmin", mn, 1);
    tweenStat(m, "tmax", mx, 1);
    tweenStat(m, "tlast", last, 1);
    m.querySelectorAll(".stat .value small").forEach((el) => { el.textContent = d.unit || ""; });
    // legenda primerjave se le prizge ali ugasne
    let leg = m.querySelector(".chart-legend");
    if (cmpPts.length && !leg) {
      leg = document.createElement("div");
      leg.className = "chart-legend";
      m.querySelector(".chart-head").after(leg);
    }
    if (leg) {
      leg.hidden = !cmpPts.length;
      if (cmpPts.length) leg.innerHTML =
        `<span><i></i>zdaj</span><span class="cmp"><i></i>${esc(cmpLabel)}</span>`;
    }
    liveWrap.morphTo(d.points, {
      unit: d.unit, thresholds: d.thresholds, compare: cmpPts,
      zoom: ZOOM_BY_RANGE[S.trend.range] || 4,
      onSelect: (from, to) => openTrendDetail(S.trend._data, { from, to }),
    });
    const w = document.getElementById("chartHost").firstElementChild;
    if (w && w.setLive) {
      w.setLive(!S.trend.when && ["1h", "6h", "24h"].includes(S.trend.range));
    }
    trendZivo(d, locQ, cmpPts);
    return;
  }

  // Graf je "ziv", kadar se obdobje konca zdaj -- takrat ima na koncu crte
  // utripajoco tocko in se sam dopolnjuje.
  const ZIVO = !S.trend.when && ["1h", "6h", "24h"].includes(S.trend.range);
  main().innerHTML = `
    <div class="card" id="trendCard" style="cursor:pointer">
      <div class="chart-head">
        <span class="metric-value" data-stat="thead"><span class="v" data-v="${last}">${num(last, 1)}</span></span>
        <span class="metric-unit" id="tUnit">${esc(d.unit)}</span>
        <span class="muted" id="tDelta" style="font-size:13px">${arrow} ${num(Math.abs(delta), 1)} v obdobju</span>
        <span class="res" id="tRes">${d.resolution === "5m" ? "5-min povprečja" : "surovo"}</span>
      </div>
      ${cmpPts.length ? `<div class="chart-legend"><span><i></i>zdaj</span><span class="cmp"><i></i>${esc(cmpLabel)}</span></div>` : ""}
      <div id="chartHost"></div>
      <div class="muted" style="font-size:11.5px;margin-top:8px">Kolešček približa · vlečenje premika · dvoklik povrne · klik označi točko (dve točki = odsek za analizo)</div>
    </div>
    <div class="grid cols-4" style="margin-top:14px">
      ${statTile("Povprečje", avg, { unit: d.unit, dp: 1, key: "tavg" })}
      ${statTile("Najnižje", mn, { unit: d.unit, dp: 1, key: "tmin" })}
      ${statTile("Najvišje", mx, { unit: d.unit, dp: 1, key: "tmax" })}
      ${statTile("Zadnja", last, { unit: d.unit, dp: 1, key: "tlast" })}
    </div>`;
  const chartWrap = lineChart(d.points, {
    unit: d.unit, thresholds: d.thresholds, compare: cmpPts,
    onSelect: (from, to) => openTrendDetail(d, { from, to }),
  });
  document.getElementById("chartHost").appendChild(chartWrap);
  if (ZIVO) chartWrap.setLive(true);
  // novi graf pride iz blura nazaj v ostrino
  clearTimeout(blurGuard);
  const mNow = document.getElementById("main");
  if (mNow) {
    mNow.getAnimations().forEach((a) => a.cancel());   // izhod je opravil svoje
    // ta pogled ima svoj, usmerjen prehod -- splosni stagger bi tekel cezenj
    // (ostane na skeletonu iz spin() in se prenese na novo vsebino)
    // Prej je ta pogled odstranil skupni vstop in imel svojega, sibkejsega.
    // Zdaj obdrzi skupnega -- graf in stiri ploscice pridejo z isto gesto kot
    // kartice povsod drugje.
    // varovalka: ce karkoli odpove, zaslon ne sme ostati zabrisan
    setTimeout(() => {
      const m2 = document.getElementById("main");
      if (m2) m2.querySelectorAll("*").forEach((el) => {
        if (el.getAnimations) el.getAnimations().forEach((a) => {
          if (a.playState === "finished" || a.playState === "idle") a.cancel();
        });
      });
    }, 1000);
  }
  const tc = document.getElementById("trendCard");
  // klik na kartico (izven grafa) = analiza celotnega obdobja; klik v graf
  // označuje točke, zato tam ne odpiramo modala
  tc.addEventListener("click", (e) => {
    if (e.target.closest("#chartHost")) return;
    pop(tc); openTrendDetail(S.trend._data || d);
  });

  // Živa sled: pri obdobjih, ki se koncajo zdaj, se graf sam dopolnjuje.
  trendZivo(d, locQ, cmpPts);
}


// Ziva sled zivi v svoji funkciji, ker jo potrebujeta OBE poti izrisa: polna
// (prvi vstop v pogled) in "vroca" (menjava metrike ali obdobja, kjer stari
// graf ostane in se samo preoblikuje). Prej je bila samo v polni poti, zato
// je graf po vsaki menjavi v spustnem meniju obmiroval -- casovnik je bil na
// zacetku izrisa pobrisan in nikoli znova postavljen.
function trendZivo(d, locQ, cmpPts) {
  clearInterval(S.trendTimer);
  S.trendTimer = null;
  S.onMeritev = null;
  // "Do zdaj" in kratko obdobje: samo tam so nove meritve. Pri preteklem
  // obdobju osvezevanje nima kaj prinesti.
  const zivo = !S.trend.when && ["1h", "6h", "24h"].includes(S.trend.range);
  if (!zivo || !d.points || !d.points.length) return;

    // ob vsaki novi meritvi (in kot varovalka se na svoj interval)
    S.onMeritev = () => osvezi();
    // Pri 24 h so tocke 5-minutna povprecja: cas zadnje tocke se ne premakne,
    // njena vrednost pa se ob vsaki novi meritvi popravi. Zato gledamo oboje,
    // sicer bi se graf pol ure delal, da se ni nic zgodilo.
    let lastT = d.points[d.points.length - 1].t;
    let lastV = d.points[d.points.length - 1].v;
    let tece = false, zadnjiUtrip = 0;
    const osvezi = async () => {
      if (document.hidden || S.view !== "trends" || tece) return;
      tece = true;
      try {
        const fresh = await apiGet(`/api/v2/trends?metric=${S.trend.metric}&range=${S.trend.range}${locQ}`);
        if (!fresh.points.length) return;
        const newest = fresh.points[fresh.points.length - 1];
        const cur0 = document.getElementById("chartHost")?.firstElementChild;
        if (newest.t === lastT && newest.v === lastV) {
          // Meritev je prisla, samo slika je enaka (pri 24 h se 5-minutno
          // povprecje ni premaknilo). Utrip vseeno pozenemo -- pove, da graf
          // ni obstal, ampak da se ni nic spremenilo.
          // brez dvojnega utripa, ko se dogodek in casovnik ujameta
          if (cur0 && cur0.pulseLast && performance.now() - zadnjiUtrip > 6000) {
            zadnjiUtrip = performance.now();
            cur0.pulseLast();
          }
          return;
        }
        lastT = newest.t; lastV = newest.v;
        const host = document.getElementById("chartHost");
        if (!host) return;
        const cur = host.firstElementChild;
        S.trend._data = fresh;
        if (cur && cur.morphTo) {
          // nova meritev se PRIPNE, graf se ne zamenja -- priblizava ostane
          cur.morphTo(fresh.points, {
            unit: fresh.unit, thresholds: fresh.thresholds, compare: cmpPts,
          });
          setTimeout(() => cur.pulseLast && cur.pulseLast(), 1000);
        } else {
          const w = lineChart(fresh.points, {
            unit: fresh.unit, thresholds: fresh.thresholds,
            zoom: ZOOM_BY_RANGE[S.trend.range] || 4, compare: cmpPts,
          });
          host.replaceChildren(w);
          w.setLive(true);
          w.pulseLast();
        }
        tweenStat(main(), "thead", newest.v, 1);
      } catch { /* tiho: naslednji cikel */ }
      finally { tece = false; }
    };
    // Naprava javlja vsakih 15 s, zato tak je tudi ritem. Prihod meritve
    // osvezi takoj, casovnik pa ujame primere, ko pregled ne tece.
    S.trendTimer = setInterval(osvezi, 15000);
  }

// Kaj posamezna metrika pomeni, ko gre gor oz. dol — za povzetek v stavku.
const DEV_PHRASE = {
  noise: ["bilo je bolj hrupno — nekaj je povzročalo več zvoka", "bilo je tišje kot običajno"],
  temp_c: ["bilo je topleje", "bilo je hladneje"],
  rh: ["bilo je bolj vlažno", "bilo je bolj suho"],
  co2eq: ["zrak je bil bolj zadušljiv (slabše prezračevanje)", "prezračevanje je bilo boljše"],
  tvoc: ["v zraku je bilo več hlapnih snovi", "v zraku je bilo manj hlapnih snovi"],
  aqi: ["kakovost zraka je bila slabša", "kakovost zraka je bila boljša"],
  pm1: ["bilo je več najdrobnejših delcev", "bilo je manj najdrobnejših delcev"],
  pm25: ["v zraku je bilo več drobnih delcev", "v zraku je bilo manj drobnih delcev"],
  pm10: ["v zraku je bilo več prahu", "v zraku je bilo manj prahu"],
  co: ["povišan je bil ogljikov monoksid", "ogljikovega monoksida je bilo manj"],
  nh3: ["povišan je bil amonijak", "amonijaka je bilo manj"],
  no2: ["povišan je bil dušikov dioksid", "dušikovega dioksida je bilo manj"],
  lux: ["bilo je svetleje", "bilo je temneje"],
  move: ["bilo je več gibanja", "bilo je manj gibanja"],
};

// Izhodišče opišemo po tem, koliko podatkov RES imamo — ne po nominalnem
// oknu, sicer bi pisalo "8 tednov", primerjali pa 18 dni.
function baselineLabel(d) {
  const nominal = { day: "14 dnevi", week: "8 tedni", month: "pol leta" }[d.window] || "";
  const days = d.baseline_actual_days || 0;
  if (!days) return `s prejšnjim obdobjem`;
  if (days >= 60) return `s prejšnjimi ${Math.round(days / 30)} meseci`;
  if (days >= 21) return `s prejšnjimi ${Math.round(days / 7)} tedni`;
  return `s prejšnjimi ${days} dnevi`;
}

function deviationSummary(d) {
  const win = { day: "zadnjih 24 urah", week: "zadnjem tednu", month: "zadnjem mesecu" }[d.window] || "obdobju";
  const base = baselineLabel(d);
  const part = { work: " v delovnem času", night: " ponoči", all: "" }[d.hours] || "";
  const dfmt = (iso) => new Date(iso).toLocaleDateString("sl", { day: "2-digit", month: "2-digit", year: "numeric" });
  const today = d.current_to ? dfmt(d.current_to) : new Date().toLocaleDateString("sl", { day: "2-digit", month: "2-digit", year: "numeric" });
  const from = d.current_from ? dfmt(d.current_from) : null;
  const span = from && d.window !== "day" ? `${from} – ${today}` : today;
  const strong = (d.metrics || []).filter((m) => Math.abs(m.z || 0) >= 1.5 && m.relevant !== false).slice(0, 3);
  if (!strong.length) {
    return `V ${win}${part} (${span}) se ni nič bistveno razlikovalo od običajnega vzorca — vse metrike se ujemajo s primerjavo ${base}.`;
  }
  const parts = strong.map((m) => {
    const up = (m.delta || 0) >= 0;
    const ph = (DEV_PHRASE[m.metric] || [`${m.label} je bil višji`, `${m.label} je bil nižji`])[up ? 0 : 1];
    const pct = `${up ? "+" : ""}${num(m.pct, 0)} %`;
    // majhna razlika, a dosledna -> to je treba povedati pošteno
    const small = Math.abs(m.pct || 0) < 10 && Math.abs(m.z || 0) >= 3;
    return `${ph} (${pct}${small ? ", majhna a zelo dosledna razlika" : ""})`;
  });
  return `V ${win}${part} (${span}), v primerjavi ${base}: ${parts.join("; ")}.`;
}

// Podroben pogled ene metrike: razlaga + primerjava po urah.
async function openDeviationDetail(metric) {
  const w = S.trend.devWin || "day", h = S.trend.devHours || "all";
  const { back } = openModal(`<button class="btn close">Zapri</button>
    <div id="devDetail" class="spin">Nalagam…</div>`);
  back.querySelector(".modal").classList.add("wide");
  let d;
  try { d = await apiGet(`/api/v2/deviations?window=${w}&hours=${h}&metric=${encodeURIComponent(metric)}` +
    (S.trend.devDate ? `&date=${S.trend.devDate}` : "") +
    (S.location ? "&location=" + encodeURIComponent(S.location) : "")); }
  catch (e) { back.querySelector("#devDetail").innerHTML = `<div class="error-state">Napaka: ${esc(e.message)}</div>`; return; }
  const m = (d.metrics || []).find((x) => x.metric === metric);
  if (!m) { back.querySelector("#devDetail").innerHTML = '<div class="empty">Ni podatkov.</div>'; return; }
  const z = Math.abs(m.z || 0);
  const negligible = m.relevant === false;
  const unusual = negligible ? "zanemarljivo (blizu nič)"
    : z >= 3 ? "zelo nenavadno" : z >= 1.5 ? "nenavadno" : "v mejah običajnega";
  const pill = negligible ? "off" : m.severity === "alert" ? "alert" : (m.severity === "warning" || z >= 3) ? "warning" : "ok";
  const up = (m.delta || 0) >= 0;
  const phrase = (DEV_PHRASE[metric] || ["višje", "nižje"])[up ? 0 : 1];
  const thr = m.thresholds || {};
  const thrText = [
    thr.warning_low != null ? `pod ${num(thr.warning_low, 0)} = opozorilo` : null,
    thr.warning_high != null ? `nad ${num(thr.warning_high, 0)} = opozorilo` : null,
    thr.alert_high != null ? `nad ${num(thr.alert_high, 0)} = alarm` : null,
    thr.alert_low != null ? `pod ${num(thr.alert_low, 0)} = alarm` : null,
  ].filter(Boolean).join(" · ") || "za to metriko ni nastavljenih mej";
  back.querySelector("#devDetail").innerHTML = `
    <div class="detail-head"><span class="pill ${pill}">${esc(unusual)}</span></div>
    <h2 style="margin:8px 0 2px">${esc(m.label)}</h2>
    <p class="muted" style="margin:0 0 6px">${esc(METRIC_EXPLAIN[metric] || "")}</p>
    <p style="margin:0 0 16px;font-size:13px">V tem obdobju ${esc(phrase)} —
      ${(m.pct || 0) > 0 ? "+" : ""}${num(m.pct, 0)} % glede na običajno.
      Razlika je ${num(z, 1)}× večja od običajnega nihanja.${negligible
        ? ` <b>Vendar je premik v absolutnem smislu zanemarljiv</b> (${(m.delta || 0) > 0 ? "+" : ""}${num(m.delta, 3)} ${esc(m.unit)});
            vrednosti so tako nizke, da odstotek zavaja.` : ""}</p>
    <div class="mini-grid" style="margin-bottom:16px">
      <div class="mini"><div class="mk">Zdaj (povprečje)</div><div class="mv">${num(m.current, 1)}<small>${esc(m.unit)}</small></div></div>
      <div class="mini"><div class="mk">Običajno</div><div class="mv">${num(m.baseline, 1)}<small>${esc(m.unit)}</small></div></div>
      <div class="mini"><div class="mk">Razlika</div><div class="mv">${(m.delta || 0) > 0 ? "+" : ""}${num(m.delta, 1)}<small>${esc(m.unit)}</small></div></div>
      <div class="mini"><div class="mk">Običajno nihanje</div><div class="mv">±${num(m.std, 1)}<small>${esc(m.unit)}</small></div></div>
    </div>
    <div class="section-title" style="margin-top:0">Po urah dneva — zdaj proti običajnemu</div>
    <div class="chart-legend"><span><i></i>zdaj</span><span class="cmp"><i></i>običajno (s pasom nihanja)</span></div>
    <div id="devHourChart"></div>
    <div class="muted" style="font-size:12px;margin-top:10px">Meje: ${esc(thrText)}</div>`;
  const host = back.querySelector("#devHourChart");
  if (d.hourly && d.hourly.length) host.appendChild(hourChart(d.hourly, m.unit));
  else host.innerHTML = '<div class="muted">Ni urne razčlenitve.</div>';
}

// Stolpičen prikaz po urah: siv pas = običajno ± nihanje, modra = zdaj.
function hourChart(rows, unit) {
  const W = 720, H = 220, padL = 44, padR = 12, padT = 12, padB = 26;
  const iw = W - padL - padR, ih = H - padT - padB;
  let lo = Infinity, hi = -Infinity;
  for (const r of rows) {
    lo = Math.min(lo, r.cur, r.base - (r.std || 0));
    hi = Math.max(hi, r.cur, r.base + (r.std || 0));
  }
  if (!isFinite(lo)) { lo = 0; hi = 1; }
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.1; lo -= pad; hi += pad;
  const X = (i) => padL + (rows.length < 2 ? iw / 2 : (i / (rows.length - 1)) * iw);
  const Y = (v) => padT + ih - ((v - lo) / (hi - lo)) * ih;
  let grid = "";
  for (let g = 0; g <= 3; g++) {
    const v = lo + ((hi - lo) * g) / 3, y = Y(v).toFixed(1);
    grid += `<line class="grid-line" x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"/>`
      + `<text class="axis-label" x="${padL - 6}" y="${(+y + 3).toFixed(1)}" text-anchor="end">${num(v, hi - lo < 5 ? 1 : 0)}</text>`;
  }
  let bandTop = "", bandBot = "", baseLine = "", curLine = "", xlab = "";
  rows.forEach((r, i) => {
    const x = X(i).toFixed(1);
    bandTop += (i ? "L" : "M") + x + " " + Y(r.base + (r.std || 0)).toFixed(1) + " ";
    baseLine += (i ? "L" : "M") + x + " " + Y(r.base).toFixed(1) + " ";
    curLine += (i ? "L" : "M") + x + " " + Y(r.cur).toFixed(1) + " ";
    if (i % 3 === 0) xlab += `<text class="axis-label" x="${x}" y="${H - 8}" text-anchor="middle">${String(r.h).padStart(2, "0")}h</text>`;
  });
  for (let i = rows.length - 1; i >= 0; i--)
    bandBot += "L" + X(i).toFixed(1) + " " + Y(rows[i].base - (rows[i].std || 0)).toFixed(1) + " ";
  const wrap = document.createElement("div");
  wrap.innerHTML = `<svg class="linechart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img">
    ${grid}${xlab}
    <path class="band" d="${bandTop}${bandBot}Z"/>
    <path class="series2" d="${baseLine}"/>
    <path class="series" d="${curLine}"/>
  </svg>`;
  return wrap;
}

// ---------- Pogled Alarmi: vse povišane metrike enega dogodka skupaj ----------
S.alarmPick = null;
async function viewAlarmScope() {
  topControls(dd("ddMode") + dd("ddAlarmDay") + dd("ddAlarmPick"));
  setupDD("ddMode", TMODE_OPTS, "alarms", (v) => { S.trend.mode = v; viewTrends(); });
  setupDD("ddAlarmDay", lastDaysOptions(14), S.alarmDay || "",
    (v) => { S.alarmDay = v; S.alarmPick = null; S.alarmSeriesKey = null; viewAlarmScope(); });
  spin();

  let list;
  try {
    list = await apiGet("/api/v2/incidents?kind=alarm" + (S.alarmDay ? "&date=" + S.alarmDay : ""));
  } catch (e) { return fail(e); }
  const alarms = list.incidents || [];
  if (!alarms.length) {
    setupDD("ddAlarmPick", [{ v: "", l: "Ni alarmov" }], "", () => {});
    main().innerHTML = '<div class="empty">Ta dan ni bilo alarmov. To je dobra novica.</div>';
    return;
  }
  const opts = alarms.map((a, i) => ({ v: String(i), l: clock(a.started_at) + " · " + a.label }));
  const idx = Math.min(Number(S.alarmPick ?? 0), alarms.length - 1);
  setupDD("ddAlarmPick", opts, String(idx), (v) => { S.alarmPick = v; S.alarmSeriesKey = null; viewAlarmScope(); });

  const a = alarms[idx];
  let d;
  try {
    d = await apiGet("/api/v2/alarm-scope?start=" + encodeURIComponent(a.started_at) +
      "&device_id=" + a.device_id + "&bases=" + encodeURIComponent(a.base || ""));
  } catch (e) { return fail(e); }

  const series = d.series || [];
  if (!S.alarmSeriesOn || S.alarmSeriesKey !== a.started_at) {
    // privzeto vklopi tiste, ki so prečkale mejo (sicer prve tri)
    const crossed = series.filter((x) => x.crossed).map((x) => x.key);
    S.alarmSeriesOn = new Set(crossed.length ? crossed : series.slice(0, 3).map((x) => x.key));
    S.alarmSeriesKey = a.started_at;
    S.alarmFocus = crossed[0] || (series[0] && series[0].key) || null;
  }
  // Barva pripada METRIKI, ne vrstnemu redu risanja: dodelimo jo po kljucu in
  // jo prilepimo na serijo, da ima gumb natanko tisto barvo, ki jo ima
  // njegova krivulja. Prej so bili gumbi crni in ni bilo mogoce vedeti,
  // katera krivulja je katera.
  series.forEach((x, i) => { x.color = SERIES_COLORS[i % SERIES_COLORS.length]; });
  const toggles = series.map((x) => {
    const on = S.alarmSeriesOn.has(x.key);
    const focus = S.alarmFocus === x.key;
    return '<button class="chip metric' + (on ? " active" : "") +
      (x.crossed === "alarm" ? " hot" : x.crossed ? " warm" : "") +
      (focus ? " focus" : "") +
      '" style="--c:' + x.color + '" data-key="' + esc(x.key) +
      '" title="vrh ' + num(x.peak, x.dp) + " " + esc(x.unit) +
      (x.crossed ? " · " + (x.crossed === "alarm" ? "cez alarmno mejo" : "cez opozorilno mejo") : "") +
      '"><i class="dot"></i>' + esc(x.label) + "</button>";
  }).join("");

  main().innerHTML =
    '<div class="card summary-card" style="margin-bottom:14px">' +
      "<h3>Kaj se je zgodilo</h3>" +
      '<p class="dev-summary">' + esc(d.summary || "") + "</p>" +
      '<div class="muted" style="font-size:12.5px;margin-top:6px">Začetek ' +
        dateTime(d.window.started) + " · stanje se je umirilo po <b>" + num(d.settled_min, 0) +
        " min</b> (ko se je najbolj prizadeta meritev vrnila 70 % poti nazaj proti običajnemu).</div>" +
    "</div>" +
    '<div class="card">' +
      '<div class="filters" style="margin-bottom:10px">' + toggles + "</div>" +
      '<div class="muted" style="font-size:11.5px;margin:-4px 0 10px">Klik vklopi ali izklopi krivuljo · ' +
      "desni klik jo postavi v ospredje (oblaček in os pripadata njej). " +
      "Vsaka metrika ima svoje merilo, zato so poravnane po višini.</div>" +
      '<div id="multiHost"></div>' +
    "</div>";

  const host = document.getElementById("multiHost");
  host.appendChild(multiChart(series.filter((x) => S.alarmSeriesOn.has(x.key)), S.alarmFocus));
  main().querySelectorAll(".chip[data-key]").forEach((c) => {
    c.addEventListener("click", () => {
      const k = c.dataset.key;
      if (S.alarmSeriesOn.has(k)) S.alarmSeriesOn.delete(k); else S.alarmSeriesOn.add(k);
      if (!S.alarmSeriesOn.has(S.alarmFocus)) S.alarmFocus = [...S.alarmSeriesOn][0] || null;
      renderAlarmChart(series);
    });
    c.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      S.alarmFocus = c.dataset.key;
      S.alarmSeriesOn.add(c.dataset.key);
      renderAlarmChart(series);
    });
  });

  function renderAlarmChart(all) {
    const h = document.getElementById("multiHost");
    if (h) h.replaceChildren(multiChart(all.filter((x) => S.alarmSeriesOn.has(x.key)), S.alarmFocus));
    main().querySelectorAll(".chip[data-key]").forEach((c) => {
      const on = S.alarmSeriesOn.has(c.dataset.key);
      c.classList.toggle("active", on);
      const lab = all.find((x) => x.key === c.dataset.key);
      c.textContent = (S.alarmFocus === c.dataset.key ? "◉ " : "") + (lab ? lab.label : c.dataset.key);
    });
  }
}

// Več metrik v enem okviru: vsaka normalizirana na svoje merilo, izbrana je
// poudarjena, os in oblaček pripadata njej.
const SERIES_COLORS = ["var(--accent)", "#e8934a", "#48ae83", "#9782e8", "#e37ba8", "#7c8598", "#3aaeb8"];
function multiChart(series, focusKey) {
  const W = 760, H = 260, padL = 46, padR = 14, padT = 14, padB = 26;
  const iw = W - padL - padR, ih = H - padT - padB;
  const wrap = document.createElement("div");
  wrap.style.position = "relative";
  if (!series.length) { wrap.innerHTML = '<div class="empty">Nobena metrika ni izbrana.</div>'; return wrap; }

  const all = series.flatMap((s) => s.points.map((p) => new Date(p.t).getTime()));
  const xmin = Math.min(...all), xmax = Math.max(...all);
  const X = (t) => padL + (xmax === xmin ? iw / 2 : ((t - xmin) / (xmax - xmin)) * iw);
  const bounds = (s) => {
    const lo = Math.min(s.min, s.calm == null ? s.min : s.calm);
    const hi = Math.max(s.max, s.peak == null ? s.max : s.peak);
    return [lo, hi - lo || 1];
  };
  const norm = (s) => { const [lo, span] = bounds(s); return (v) => padT + ih - ((v - lo) / span) * ih; };
  const focus = series.find((s) => s.key === focusKey) || series[0];
  const fy = norm(focus);

  let grid = "";
  for (let g = 0; g <= 3; g++) {
    const y = (padT + (ih * g) / 3).toFixed(1);
    grid += '<line class="grid-line" x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '"/>';
  }
  const [flo, fspan] = bounds(focus);
  for (let g = 0; g <= 3; g++) {
    const v = flo + (fspan * (3 - g)) / 3, y = (padT + (ih * g) / 3);
    grid += '<text class="axis-label" x="' + (padL - 6) + '" y="' + (y + 3).toFixed(1) +
      '" text-anchor="end">' + num(v, focus.dp) + "</text>";
  }
  for (let g = 0; g <= 2; g++) {
    const t = xmin + ((xmax - xmin) * g) / 2;
    grid += '<text class="axis-label" x="' + X(t).toFixed(1) + '" y="' + (H - 8) +
      '" text-anchor="' + (g === 0 ? "start" : g === 2 ? "end" : "middle") + '">' +
      clock(new Date(t).toISOString()) + "</text>";
  }
  const paths = series.map((s, i) => {
    const Y = norm(s);
    const dd = s.points.map((p, k) => (k ? "L" : "M") + X(new Date(p.t).getTime()).toFixed(1) + " " + Y(p.v).toFixed(1)).join(" ");
    const on = s.key === focus.key;
    return '<path d="' + dd + '" fill="none" stroke="' + (s.color || SERIES_COLORS[i % SERIES_COLORS.length]) +
      '" stroke-width="' + (on ? 2.4 : 1.4) + '" opacity="' + (on ? 1 : 0.45) +
      '" stroke-linejoin="round" stroke-linecap="round"/>';
  }).join("");

  wrap.innerHTML = '<svg class="linechart" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" role="img">' +
    grid + paths +
    '<line class="cursor-line" x1="0" y1="' + padT + '" x2="0" y2="' + (padT + ih) + '" style="opacity:0"/>' +
    '<circle class="cursor-dot" r="3.5" style="opacity:0"/>' +
    '<rect x="' + padL + '" y="' + padT + '" width="' + iw + '" height="' + ih + '" fill="transparent" style="cursor:crosshair"/>' +
    "</svg>";

  const svg = wrap.querySelector("svg"), cl = wrap.querySelector(".cursor-line"),
    cd = wrap.querySelector(".cursor-dot"), rect = wrap.querySelector("rect"), tip = chartTip();
  const fpts = focus.points;
  rect.addEventListener("mousemove", (e) => {
    const r = svg.getBoundingClientRect();
    const fx = Math.min(1, Math.max(0, (((e.clientX - r.left) / r.width) * W - padL) / iw));
    const t = xmin + fx * (xmax - xmin);
    let bi = 0, bd = Infinity;
    fpts.forEach((p, i) => { const q = Math.abs(new Date(p.t).getTime() - t); if (q < bd) { bd = q; bi = i; } });
    const p = fpts[bi], px = X(new Date(p.t).getTime()), py = fy(p.v);
    cl.setAttribute("x1", px); cl.setAttribute("x2", px); cl.style.opacity = 1;
    cd.setAttribute("cx", px); cd.setAttribute("cy", py); cd.style.opacity = 1;
    const at = (s) => {
      let b = s.points[0], bd2 = Infinity;
      s.points.forEach((q) => {
        const dq = Math.abs(new Date(q.t).getTime() - new Date(p.t).getTime());
        if (dq < bd2) { bd2 = dq; b = q; }
      });
      return b.v;
    };
    tip.innerHTML = "<b>" + esc(focus.label) + " " + num(p.v, focus.dp) + " " + esc(focus.unit) + "</b>" +
      series.filter((s) => s.key !== focus.key).map((s) =>
        '<span class="rng">' + esc(s.label) + " " + num(at(s), s.dp) + " " + esc(s.unit) + "</span>").join("") +
      '<span class="tt">' + clock(p.t) + "</span>";
    tip.style.opacity = 1;
    const sx = r.left + (px / W) * r.width, sy = r.top + (py / H) * r.height;
    const tw = tip.offsetWidth || 150, th = tip.offsetHeight || 70;
    let left = sx + 16;
    if (left + tw > innerWidth - 8) left = sx - tw - 16;
    tip.style.left = Math.round(Math.max(8, left)) + "px";
    tip.style.top = Math.round(Math.max(8, Math.min(sy - th / 2, innerHeight - th - 8))) + "px";
  });
  rect.addEventListener("mouseleave", () => {
    cl.style.opacity = 0; cd.style.opacity = 0; tip.style.opacity = 0;
  });
  return wrap;
}

// Pogled odstopanj: vse metrike hkrati, urejene po tem, koliko izstopajo
// od običajnega (primerjava z izhodiščnim obdobjem).
async function viewDeviations() {
  topControls(dd("ddMode") + dd("ddDevWin") + dd("ddDevHours") + dd("ddDevDate") + dd("ddLoc"));
  setupDD("ddDevDate", lastDaysOptions(30), S.trend.devDate || "",
    (v) => { S.trend.devDate = v; viewDeviations(); });
  setupDD("ddMode", TMODE_OPTS, "dev", (v) => { S.trend.mode = v; viewTrends(); });
  setupDD("ddDevWin", DEVWIN_OPTS, S.trend.devWin || "day",
    (v) => { S.trend.devWin = v; viewDeviations(); });
  setupDD("ddDevHours", DEVHOURS_OPTS, S.trend.devHours || "all",
    (v) => { S.trend.devHours = v; viewDeviations(); });
  setupDD("ddLoc",
    [{ v: "", l: "Vse lokacije" }, ...(S.overview?.locations || []).map((l) => ({ v: l, l }))],
    S.location, (v) => { S.location = v; viewDeviations(); });
  spin();
  let d;
  try {
    d = await apiGet(`/api/v2/deviations?window=${S.trend.devWin || "day"}` +
      `&hours=${S.trend.devHours || "all"}` +
      (S.trend.devDate ? `&date=${S.trend.devDate}` : "") +
      (S.location ? "&location=" + encodeURIComponent(S.location) : ""));
  } catch (e) { return fail(e); }
  if (!d.metrics.length) {
    main().innerHTML = `<div class="empty">${esc(d.reason || "Ni dovolj zgodovine za primerjavo.")}
      <div style="margin-top:8px;font-size:12px">Poskusi krajše obdobje (dnevno ali tedensko).</div></div>`;
    return;
  }
  const winLabel = baselineLabel(d);
  const hoursLabel = { all: "cel dan", work: "samo delovni čas 7–19", night: "samo ponoči 19–7" }[d.hours] || "cel dan";
  const row = (m) => {
    const z = Math.abs(m.z || 0);
    // koliko izstopa: z-vrednost (kolikokrat običajno nihanje)
    const negligible = m.relevant === false;
    const unusual = negligible ? "zanemarljivo (blizu nič)"
      : z >= 3 ? "zelo nenavadno" : z >= 1.5 ? "nenavadno" : "v mejah običajnega";
    const cls = negligible ? "" : m.severity === "alert" ? " alert" : (m.severity === "warning" || z >= 3) ? " warn" : "";
    const half = negligible ? 2 : Math.min(50, (z / 4) * 50);   // pol pasu = 4σ
    const left = (m.delta || 0) >= 0 ? 50 : 50 - half;
    return `<div class="dev-row${cls}" data-metric="${esc(m.metric)}" title="Klik za podrobnosti">
      <div class="dev-name">${esc(m.label)}<small>običajno ${num(m.baseline, 1)} ${esc(m.unit)}</small></div>
      <div class="dev-val">${num(m.current, 1)}<small>${esc(m.unit)}</small></div>
      <div class="dev-bar"><i style="left:${left}%;width:${half}%"></i><span class="mid"></span></div>
      <div class="dev-note"><b>${negligible
        ? `${(m.delta || 0) > 0 ? "+" : ""}${num(m.delta, 2)} ${esc(m.unit)}`
        : `${(m.pct || 0) > 0 ? "+" : ""}${num(m.pct, 0)} %`}</b>${esc(unusual)}</div>
    </div>`;
  };
  const top = d.metrics.filter((m) => Math.abs(m.z || 0) >= 1.5 && m.relevant !== false);
  main().innerHTML = `
    <div class="card summary-card" style="margin-bottom:14px">
      <h3>Povzetek</h3>
      <p class="dev-summary">${esc(deviationSummary(d))}</p>
    </div>
    <div class="card" style="margin-bottom:14px">
      <h3>Kaj izstopa</h3>
      <div class="muted" style="margin:-4px 0 12px;font-size:12.5px">
        Primerjava trenutnega obdobja ${esc(winLabel)} (izhodišče), <b>uro z uro</b>
        (${esc(hoursLabel)}, ${d.hours_compared} ur) — zato dnevno-nočni cikel
        ne popači rezultata. Vrednosti so povprečja teh ur.
        Odstopanje meri, kolikokrat je razlika večja od običajnega nihanja,
        ne le, ali je vrednost visoka.
      </div>
      ${top.length
        ? top.map(row).join("")
        : '<div class="empty" style="padding:22px">Nič ne izstopa — vse metrike so v mejah običajnega nihanja.</div>'}
    </div>
    <div class="card">
      <h3>Vse metrike</h3>
      ${d.metrics.map(row).join("")}
    </div>`;
  main().querySelectorAll(".dev-row[data-metric]").forEach((r) =>
    r.addEventListener("click", () => { pop(r); openDeviationDetail(r.dataset.metric); }));
}

// Povečan pogled grafa s statistikami v preprostem jeziku (klik na graf).
function openTrendDetail(d, win) {
  let pts = d.points || [];
  if (win) {
    const a = new Date(win.from).getTime(), b = new Date(win.to).getTime();
    pts = pts.filter((p) => { const t = new Date(p.t).getTime(); return t >= a && t <= b; });
    if (!pts.length) { toast("warning", "Ni podatkov", "V izbranem odseku ni meritev."); return; }
  }
  if (!pts.length) return;
  const vals = pts.map((p) => p.v);
  const last = vals[vals.length - 1];
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  // ekstremi iz lo/hi (rollup), sicer bi vrh krajši od 5 min izginil
  const lows = pts.map((p) => (p.lo != null ? p.lo : p.v));
  const highs = pts.map((p) => (p.hi != null ? p.hi : p.v));
  let iMin = 0, iMax = 0;
  lows.forEach((v, i) => { if (v < lows[iMin]) iMin = i; });
  highs.forEach((v, i) => { if (v > highs[iMax]) iMax = i; });
  const wide = S.trend.range === "7d" || S.trend.range === "30d";
  const tShort = (iso) => (wide
    ? `${new Date(iso).toLocaleDateString("sl", { day: "2-digit", month: "2-digit" })} ${clock(iso)}`
    : clock(iso));
  const thr = d.thresholds || {};
  const a = assessValue(last, thr);
  const fmtDT = (iso) => `${new Date(iso).toLocaleDateString("sl", { day: "2-digit", month: "2-digit" })} ${clock(iso)}`;
  const rangeLabel = win
    ? `${fmtDT(win.from)} – ${fmtDT(win.to)}`
    : (RANGES.find(([k]) => k === S.trend.range) || ["", S.trend.range])[1];
  let overTile = "";
  if (thr.warning_high != null) {
    const over = highs.filter((v) => v > thr.warning_high).length;
    overTile = `<div class="mini"><div class="mk">Nad mejo ${num(thr.warning_high, 0)} ${esc(d.unit)}</div>
      <div class="mv">${num((over / vals.length) * 100, 0)}<small>% časa</small></div></div>`;
  }
  const mini = (label, val, sub) =>
    `<div class="mini"><div class="mk">${esc(label)}</div>
     <div class="mv">${num(val, 1)}<small>${esc(d.unit)}</small></div>
     ${sub ? `<div class="mk" style="margin-top:2px">${esc(sub)}</div>` : ""}</div>`;
  const { back } = openModal(`
    <button class="btn close">Zapri</button>
    <div class="detail-head"><span class="pill ${a.lvl === "alert" ? "alert" : a.lvl === "warning" ? "warning" : "ok"}">${esc(a.label)}</span></div>
    <h2 style="margin:8px 0 2px">${esc(d.label || d.metric)} — ${win ? "izbrani odsek" : "zadnjih"} ${esc(rangeLabel)}</h2>
    <p class="muted" style="margin:0 0 6px">${esc(METRIC_EXPLAIN[d.metric] || "")}</p>
    <p style="margin:0 0 14px;font-size:13px">${esc(a.text)}</p>
    <div id="trendBigChart"></div>
    <div class="mini-grid" style="margin-top:14px">
      ${mini("Zdaj", last)}
      ${mini("Povprečje", avg)}
      ${mini("Najnižje", lows[iMin], "ob " + tShort(pts[iMin].t))}
      ${mini("Najvišje", highs[iMax], "ob " + tShort(pts[iMax].t))}
      <div class="mini"><div class="mk">Št. meritev</div><div class="mv">${num(vals.length, 0)}</div></div>
      ${overTile}
    </div>`);
  back.querySelector(".modal").classList.add("wide");
  back.querySelector("#trendBigChart").appendChild(lineChart(pts, {
    unit: d.unit, thresholds: d.thresholds,
  }));
}

// ---------- Fleet ----------
async function viewFleet() {
  topControls("");
  spin();
  let d;
  try { d = await apiGet("/api/v2/fleet"); } catch (e) { return fail(e); }
  const rows = d.devices.map((f) => {
    const lvl = !f.online ? "off" : f.status.level === "alert" ? "alert" : f.status.level === "warning" ? "warning" : "ok";
    const lab = !f.online ? "Offline" : f.status.label || "—";
    return `<tr>
      <td><span class="sev-dot sev-${f.status.level === "normal" ? "normal" : esc(f.status.level)}"></span>${esc(f.name)}</td>
      <td>${esc(f.org_name || "—")}</td>
      <td><span class="pill ${lvl}">${esc(lab)}</span></td>
      <td>${timeAgo(f.last_seen_at)}</td>
      <td>${esc(f.firmware || "—")}</td>
      <td class="num">${num(f.aqi, 0)}</td>
      <td class="num">${num(f.co2eq, 0)}</td>
    </tr>`;
  }).join("");
  main().innerHTML = `<div class="muted" style="margin-bottom:8px;font-size:12px">${d.count} naprav — najbolj kritične najprej.</div>
    <div class="table-wrap"><table class="data">
    <thead><tr><th>Naprava</th><th>Organizacija</th><th>Stanje</th><th>Zadnji signal</th><th>Firmware</th><th>AQI</th><th>CO₂</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

// ---------- Diagnostics ----------
async function viewDiagnostics() {
  topControls("");
  spin();
  let d;
  try { d = await apiGet("/api/v2/diagnostics"); } catch (e) { return fail(e); }
  const lr = d.latest_raw || {};
  const sync = d.log_sync || {};
  const metricsKv = ["temp_c", "rh", "aqi", "pm1", "pm25", "pm10", "tvoc", "co2eq", "co", "nh3", "no2", "noise", "move", "lux"]
    .map((m) => `<dt>${m}</dt><dd>${num(lr[m], 2)}</dd>`).join("");
  main().innerHTML = `
    <div class="grid cols-2">
      <div class="card"><h3>Zadnji surovi heartbeat</h3>
        <dl class="kv"><dt>Čas</dt><dd>${dateTime(lr.received_at)}</dd>
        <dt>Lokacija</dt><dd>${esc(lr.location || "—")}</dd>
        <dt>IP</dt><dd>${esc(lr.client_ip || "—")}</dd>
        <dt>Sproženo</dt><dd>${esc(lr.triggered || "—")}</dd>${metricsKv}</dl>
      </div>
      <div class="card"><h3>Log sync</h3>
        <dl class="kv">
          <dt>Stanje</dt><dd>${esc(sync.state || "—")}</dd>
          <dt>Zadnji tek</dt><dd>${dateTime(sync.last_run_at)}</dd>
          <dt>Naslednji</dt><dd>${dateTime(sync.next_run_at)}</dd>
          <dt>Napaka</dt><dd>${esc(sync.last_error || "—")}</dd>
        </dl>
        <h3 style="margin-top:16px">SVG stream</h3>
        <dl class="kv"><dt>Stanje</dt><dd>${esc((d.svg || {}).label || "—")}</dd></dl>
      </div>
    </div>
    <div class="section-title">Error log (zadnjih 40 vrstic)</div>
    <div class="logtail">${d.error_log_tail.length ? esc(d.error_log_tail.join("\n")) : "prazen — brez napak"}</div>`;
}

// ---------- Settings (retention) ----------
const THEME_OPTS = [{ v: "light", l: "Svetla" }, { v: "dark", l: "Temna" }, { v: "auto", l: "Samodejno (sistem)" }];
const ACCENT_OPTS = [
  { v: "blue", l: "Nebeško modra" }, { v: "indigo", l: "Indigo" },
  { v: "lavender", l: "Sivka" }, { v: "rose", l: "Rožnata" },
  { v: "coral", l: "Koralna" }, { v: "apricot", l: "Marelica" },
  { v: "mint", l: "Meta" }, { v: "sage", l: "Žajbelj" },
  { v: "graphite", l: "Grafit" },
];
const GLASS_OPTS = [{ v: "off", l: "Izklopljen" }, { v: "on", l: "Vklopljen" }];
const MOTION_OPTS = [{ v: "full", l: "Polne animacije" }, { v: "off", l: "Brez animacij" }];
const DENSITY_OPTS = [{ v: "comfortable", l: "Udobna" }, { v: "compact", l: "Zgoščena" }];
const HOME_OPTS = [{ v: "status", l: "Status" }, { v: "events", l: "Eventi" }, { v: "trends", l: "Trendi" }];
const POLL_OPTS = [{ v: "5", l: "5 s" }, { v: "10", l: "10 s" }, { v: "30", l: "30 s" }, { v: "60", l: "60 s" }];
const SVG_OPTS = [{ v: "off", l: "Izklopljen" }, { v: "handle", l: "Na klik (desni rob)" }, { v: "always", l: "Vedno prikazan" }];
const SCROLLNAV_OPTS = [{ v: "on", l: "Vklopljeno" }, { v: "off", l: "Izklopljeno" }];
const SPARKLE_OPTS = [{ v: "off", l: "Izklopljene" }, { v: "on", l: "Vklopljene" }];
const LIGHT_OPTS = [{ v: "on", l: "Vklopljena" }, { v: "off", l: "Izklopljena" }];
const DUST_OPTS = [
  { v: "on", l: "Vklopljen (z varovalko)" },
  { v: "always", l: "Vedno vklopljen" },
  { v: "off", l: "Izklopljen" },
];
const ALERT_OPTS = [
  { v: "off", l: "Izklopljena" },
  { v: "visual", l: "Samo obvestilo" },
  { v: "sound", l: "Obvestilo + zvok" },
];

const setRow = (label, hint, id) =>
  `<div class="set-row"><div><div class="set-l">${esc(label)}</div><div class="set-h">${esc(hint)}</div></div>${dd(id)}</div>`;

// Nastavitev, ki se uveljavi sele ob osvezitvi strani, ni nastavitev.
// Vsaka sprememba zato takoj shrani, uveljavi in po potrebi prerise vrstice
// (npr. ko izbira palete pride zraven), z ohranjenim polozajem drsnika.
function viewSettings() {
  const shrani = (prerisi) => {
    savePrefs();
    applyPrefs();
    if (prerisi) {
      const y = window.scrollY;
      viewSettings();
      window.scrollTo(0, y);
    }
  };
  topControls("");
  const glassOk = !!(window.HaloGlass && window.HaloGlass.supported());
  main().innerHTML = `
    <div class="card" style="margin-bottom:14px">
      <h3>Videz</h3>
      ${setRow("Tema", "Svetla, temna ali po sistemu", "setTheme")}
      ${setRow("Poudarna barva", "Barva poudarkov, gumbov in grafov", "setAccent")}
      ${setRow("Super barve", "Močnejše palete za ozadje in poudarek · privzeto izklopljeno", "setSuper")}
      ${PREFS.superColors === "on"
        ? setRow("Paleta", "Katera od palet velja", "setPaleta") : ""}
      ${setRow("Liquid glass", glassOk ? "Steklen material, sijaj sledi kazalcu" : "Ni podprt v tem brskalniku", "setGlass")}
      ${setRow("Animacije", "Gibanje in prehodi vmesnika", "setMotion")}
      ${setRow("Bleščice ob kliku", "Iskrice okoli kazalca ob pritisku", "setSparkle")}
      ${setRow("Svetloba ob kazalcu", "Mehka luč sledi miški, robovi pod njo zasvetijo", "setCursorLight")}
      ${setRow("Zvezdni prah", "Iskrice nad tem, kar je mogoče pritisniti · »Vedno« ne upošteva hitrosti", "setDust")}
      ${setRow("Gostota", "Razmik med elementi", "setDensity")}
    </div>
    <div class="card" style="margin-bottom:14px">
      <h3>Obnašanje</h3>
      ${setRow("Obvestila ob alarmu", "Sporočilo v kotu, po želji z zvokom", "setAlerts")}
      ${setRow("Preklop pogleda z drsenjem", "Ko je stran na robu, drsenje odpre naslednji pogled", "setScrollNav")}
      ${setRow("Privzeti pogled", "Kam se odpre ob zagonu", "setHome")}
      ${setRow("Osveževanje statusa", "Interval samodejnega osveževanja", "setPoll")}
      ${setRow("HALO SVG prikaz", "Grafični prikaz senzorja iz levega roba", "setSvg")}
    </div>
    <div id="retentionCard"></div>
    <div class="card" style="margin-top:14px">
      <h3>Varnostna kopija baze</h3>
      <div class="muted" style="margin:-4px 0 12px;font-size:12.5px">
        Izvoz naredi stisnjen posnetek cele baze — meritve, dogodke, naprave in
        uporabnike. Shrani ga, kamor hočeš (Drive, USB); uvoz ga vrne nazaj,
        tudi na drugem računalniku, kjer senzorja ni.
      </div>
      <div class="db-vrsta">
        <a class="btn primary" href="/api/v2/db/export" download>Izvozi bazo</a>
        <label class="btn" for="dbFile">Izberi datoteko za uvoz</label>
        <input id="dbFile" type="file" accept=".sqlite,.gz,application/gzip" hidden>
        <span class="muted" id="dbIme"></span>
      </div>
      <div class="muted" id="dbMsg" style="margin-top:10px;font-size:12.5px"></div>
    </div>
    <div class="card nevarno" style="margin-top:14px">
      <h3>Izbris podatkov</h3>
      <div class="muted" style="margin:-4px 0 12px;font-size:12.5px">
        Izbriše <b>vse izmerjene podatke</b> — telemetrijo, 5-minutna povprečja,
        dogodke in heartbeate. Naprave, uporabniki in nastavitve ostanejo.
        Dejanja <b>ni mogoče razveljaviti</b>; če boš podatke še potreboval,
        prej naredi varnostno kopijo (<code>python backup_db.py</code>).
      </div>
      <button class="btn nevaren" id="wipeBtn" type="button">Izbriši vse podatke</button>
      <span class="muted" id="wipeMsg" style="margin-left:12px"></span>
    </div>`;
  setupDD("setTheme", THEME_OPTS, PREFS.theme, (v) => { PREFS.theme = v; shrani(); });
  setupDD("setAccent", ACCENT_OPTS, PREFS.accent, (v) => { PREFS.accent = v; shrani(); });
  setupDD("setSuper", SUPER_OPTS, PREFS.superColors, (v) => {
    PREFS.superColors = v; shrani(true);      // vrstica s paleto se pojavi/izgine
  });
  setupDD("setPaleta", PALETA_OPTS, PREFS.paleta, (v) => { PREFS.paleta = v; shrani(); });
  setupDD("setGlass", GLASS_OPTS, glassOk && window.HaloGlass.get() ? "on" : "off",
    (v) => { if (window.HaloGlass) window.HaloGlass.set(v === "on"); });
  setupDD("setMotion", MOTION_OPTS, PREFS.motion, (v) => { PREFS.motion = v; shrani(); });
  setupDD("setSparkle", SPARKLE_OPTS, PREFS.sparkle, (v) => { PREFS.sparkle = v; shrani(); });
  setupDD("setCursorLight", LIGHT_OPTS, PREFS.cursorLight, (v) => {
    PREFS.cursorLight = v; shrani();
  });
  setupDD("setDust", DUST_OPTS, PREFS.dust, (v) => {
    PREFS.dust = v; shrani();
    dustReset();          // "vedno" preklice prejsnji izklop zaradi hitrosti
  });
  setupDD("setDensity", DENSITY_OPTS, PREFS.density, (v) => { PREFS.density = v; shrani(); });
  setupDD("setAlerts", ALERT_OPTS, PREFS.alerts, (v) => {
    PREFS.alerts = v; shrani();
    if (v !== "off") toast("warning", "Obvestila vklopljena", "Tako bo videti opozorilo.");
  });
  setupDD("setScrollNav", SCROLLNAV_OPTS, PREFS.scrollNav, (v) => { PREFS.scrollNav = v; shrani(); });
  setupDD("setHome", HOME_OPTS, PREFS.home, (v) => { PREFS.home = v; shrani(); });
  setupDD("setPoll", POLL_OPTS, PREFS.poll, (v) => { PREFS.poll = v; shrani(); restartPoll(); });
  setupDD("setSvg", SVG_OPTS, PREFS.svgStream, (v) => { PREFS.svgStream = v; shrani(); });
  renderRetention();
  vezIzbris();
  vezBazo();
}

// Uvoz zamenja CELO bazo, zato ima enako zaporo kot izbris: izbira datoteke
// samo pripravi, potrditev z besedo pa je locen korak.
function vezBazo() {
  const vhod = document.getElementById("dbFile");
  const ime = document.getElementById("dbIme");
  const msg = document.getElementById("dbMsg");
  if (!vhod) return;
  vhod.addEventListener("change", () => {
    const f = vhod.files && vhod.files[0];
    if (!f) return;
    ime.textContent = f.name + " · " + (f.size / 1024 / 1024).toFixed(1) + " MB";
    openModal(
      '<button class="btn close">Prekliči</button>' +
      '<h2 style="margin:0 0 6px">Zamenjam bazo z uvoženo?</h2>' +
      '<p class="muted" style="margin:0 0 14px;font-size:13px">Trenutna baza bo ' +
        "zamenjana z <b>" + esc(f.name) + "</b>. Pred zamenjavo naredimo varnostno " +
        "kopijo v mapo <code>backups</code>, a je kljub temu pametno prej izvoziti " +
        "obstoječo bazo.</p>" +
      '<p style="margin:0 0 8px;font-size:13px">Za potrditev vpiši <b>UVOZI</b>:</p>' +
      '<input class="select" id="dbWord" autocomplete="off" spellcheck="false" ' +
        'style="width:180px;letter-spacing:0.08em">' +
      '<div style="margin-top:16px;display:flex;gap:10px;align-items:center">' +
        '<button class="btn primary" id="dbGo" disabled>Uvozi in zamenjaj</button>' +
        '<span class="muted" id="dbErr"></span></div>', vhod);
    const polje = document.getElementById("dbWord");
    const go = document.getElementById("dbGo");
    polje.focus();
    const preveri = () => { go.disabled = polje.value.trim().toUpperCase() !== "UVOZI"; };
    polje.addEventListener("input", preveri);
    polje.addEventListener("keydown", (e) => { if (e.key === "Enter" && !go.disabled) go.click(); });
    go.addEventListener("click", async () => {
      go.disabled = true;
      document.getElementById("dbErr").textContent = "Nalagam…";
      const fd = new FormData();
      fd.append("file", f);
      fd.append("confirm", "UVOZI");
      try {
        const r = await fetch("/api/v2/db/import", { method: "POST", body: fd,
          credentials: "same-origin" });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || r.status);
        document.querySelector(".modal-back .close").click();
        msg.textContent = "Uvoženo: " + num(d.rows, 0) +
          " meritev. Stara baza je shranjena kot " + d.backup + ".";
        toast("info", "Baza zamenjana",
          num(d.rows, 0) + " meritev. Plošča se osvežuje.");
        S.overview = null;
        loadOverview(true);
        renderView();
      } catch (e) {
        document.getElementById("dbErr").textContent = "Napaka: " + (e.message || "neznana");
        go.disabled = false;
      }
      vhod.value = "";
    });
  });
}

// Dvojno vprasanje ni nadlegovanje: prvi klik je lahko pomota, drugi ne more
// biti. Drugi korak zahteva vpis besede, zato ga ni mogoce "odkliknjati" z
// isto potezo kot prvega.
function vezIzbris() {
  const b = document.getElementById("wipeBtn");
  const msg = document.getElementById("wipeMsg");
  if (!b) return;
  b.addEventListener("click", () => {
    openModal(
      '<button class="btn close">Prekliči</button>' +
      '<h2 style="margin:0 0 6px">Res izbrišem vse podatke?</h2>' +
      '<p class="muted" style="margin:0 0 14px;font-size:13px">Izbrisani bodo vsi ' +
        "izmerjeni podatki. Naprave in nastavitve ostanejo. Tega ni mogoče razveljaviti.</p>" +
      '<p style="margin:0 0 8px;font-size:13px">Za potrditev vpiši <b>IZBRIŠI</b>:</p>' +
      '<input class="select" id="wipeWord" autocomplete="off" spellcheck="false" ' +
        'style="width:180px;letter-spacing:0.08em">' +
      '<div style="margin-top:16px;display:flex;gap:10px;align-items:center">' +
        '<button class="btn nevaren" id="wipeGo" disabled>Dokončno izbriši</button>' +
        '<span class="muted" id="wipeErr"></span></div>', b);
    const polje = document.getElementById("wipeWord");
    const go = document.getElementById("wipeGo");
    polje.focus();
    const preveri = () => {
      go.disabled = polje.value.trim().toUpperCase() !== "IZBRIŠI";
    };
    polje.addEventListener("input", preveri);
    polje.addEventListener("keydown", (e) => { if (e.key === "Enter" && !go.disabled) go.click(); });
    go.addEventListener("click", async () => {
      go.disabled = true;
      document.getElementById("wipeErr").textContent = "Brišem…";
      try {
        const r = await apiSend("POST", "/api/v2/wipe", { confirm: "IZBRISI" });
        const skupaj = Object.values(r.deleted || {}).reduce((a, x) => a + x, 0);
        document.querySelector(".modal-back .close").click();
        if (msg) msg.textContent = "Izbrisano: " + num(skupaj, 0) + " zapisov.";
        toast("info", "Podatki izbrisani",
          "Odstranjenih " + num(skupaj, 0) + " zapisov. Plošča je prazna.");
        S.overview = null;
        loadOverview(true);
        renderView();
      } catch (e) {
        document.getElementById("wipeErr").textContent = "Napaka: " + (e.message || "neznana");
        go.disabled = false;
      }
    });
  });
}

async function renderRetention() {
  const host = document.getElementById("retentionCard");
  if (!host) return;
  let d;
  try { d = await apiGet("/api/retention"); }
  catch (e) { host.innerHTML = ""; return; } // ne-staff: skrij
  const rows = d.policies.map((p) => `<tr>
    <td>${esc(p.name)}</td>
    <td class="num"><input data-org="${p.org_id}" data-f="raw" type="number" min="1" value="${p.telemetry_raw_days}" class="select" style="width:80px"></td>
    <td class="num"><input data-org="${p.org_id}" data-f="rollup" type="number" min="1" value="${p.telemetry_rollup_days}" class="select" style="width:90px"></td>
    <td class="num"><input data-org="${p.org_id}" data-f="events" type="number" min="1" value="${p.events_days}" class="select" style="width:80px"></td>
    <td><button class="btn primary" data-save="${p.org_id}">Shrani</button></td>
  </tr>`).join("");
  host.innerHTML = `<div class="card"><h3>Retencija podatkov (dni)</h3>
    <div class="muted" style="margin:-4px 0 12px;font-size:12px">Po organizaciji. Vsaka sprememba se zabeleži v audit log.</div>
    <div class="table-wrap"><table class="data">
    <thead><tr><th>Organizacija</th><th>Surova telemetrija</th><th>5-min rollup</th><th>Eventi</th><th></th></tr></thead>
    <tbody>${rows}</tbody></table></div>
    <div id="retMsg" class="muted" style="margin-top:10px"></div></div>`;
  host.querySelectorAll("button[data-save]").forEach((b) => b.addEventListener("click", async () => {
    const org = b.dataset.save;
    const gv = (f) => Number(host.querySelector(`input[data-org="${org}"][data-f="${f}"]`).value);
    try {
      await apiSend("PUT", "/api/retention", {
        org_id: Number(org), telemetry_raw_days: gv("raw"),
        telemetry_rollup_days: gv("rollup"), events_days: gv("events"),
      });
      document.getElementById("retMsg").textContent = "Shranjeno.";
    } catch (e) { document.getElementById("retMsg").textContent = "Napaka: " + e.message; }
  }));
}

// ---------- Poročila ----------
// Staro poročilo je naštevalo, kar je bilo lahko prešteti: 140.000 meritev in
// 115.620 "alarmov" (vsaka vrstica heartbeata čez neko mejo). To ni poročilo,
// ampak izvoz baze. Zdaj je zgrajeno obratno: najprej sodba v enem stavku,
// nato pest številk, ki jih človek razume brez razlage, in šele potem
// podrobnosti.
const REP = { data: null, seq: 0 };

async function viewReports() {
  if (!S.reportMonth) S.reportMonth = new Date().toISOString().slice(0, 7);
  const url = (fmt) => `/api/v2/report?month=${S.reportMonth}${fmt ? "&format=" + fmt : ""}`;
  topControls(dd("ddRepMonth") +
    `<button class="btn" id="repPrint" type="button">Natisni</button>` +
    `<a class="btn" href="${url("csv")}" download>CSV</a>`);
  setupDD("ddRepMonth", lastMonthsOptions(12), S.reportMonth, (v) => {
    S.reportMonth = v; viewReports();
  });
  document.getElementById("repPrint").addEventListener("click", () => window.print());
  spin();
  const seq = ++REP.seq;
  let d;
  try { d = await apiGet("/api/v2/report-data?month=" + S.reportMonth); }
  catch (e) { return fail(e); }
  if (seq !== REP.seq) return;
  REP.data = d;
  main().innerHTML = repIzris(d);
  repVezi();
}

const REP_OCENA = (x) => (x == null ? "off" : x >= 0.8 ? "ok" : x >= 0.5 ? "warning" : "alert");

function repIzris(d) {
  if (d.empty) {
    return '<div class="empty" style="padding:40px">Za ' + esc(d.label) +
      " ni shranjenih meritev.</div>";
  }
  const c = d.counts, g = d.good_share || {}, mm = d.metrics || {};
  const dan = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("sl",
    { day: "numeric", month: "long" });

  // Sodba: prvo, kar clovek prebere, in edino, kar si bo zapomnil.
  const sodba = '<div class="card rep-sodba ' + esc(d.verdict.status) + '">' +
    '<div class="rep-znak">' + (d.verdict.status === "ok" ? "✓"
      : d.verdict.status === "warning" ? "!" : "!") + "</div>" +
    "<div><div class=\"rep-mesec\">" + esc(d.label) + "</div>" +
    '<h2 class="rep-naslov">' + esc(d.verdict.headline) + "</h2>" +
    '<div class="rep-stavek">' + esc(d.verdict.text) + "</div></div></div>";

  // Stevilke, ki nekaj pomenijo. Vsaka ima pod sabo poved, ne enote.
  const kartica = (naslov, vrednost, pod, cls) =>
    '<div class="card rep-num ' + (cls || "") + '"><div class="rep-k">' + esc(naslov) + "</div>" +
    '<div class="rep-v">' + vrednost + "</div>" +
    '<div class="rep-p">' + pod + "</div></div>";

  const zrak = g.aqi == null ? null : num(g.aqi, 0) + "<small>%</small>";
  const prezr = g.co2eq == null ? null : num(g.co2eq, 0) + "<small>%</small>";
  const stevilke = '<div class="grid cols-4 rep-grid">' +
    kartica("Alarmi", num(c.alarms, 0),
      c.alarms ? "povprečno " + num(c.alarms_per_day, 1) + " na dan" : "cel mesec brez alarma",
      c.alarms ? "alert" : "ok") +
    kartica("Opozorila", num(c.warnings, 0),
      c.warnings ? "vrednost je šla čez mejo, a ne v alarm" : "brez opozoril",
      c.warnings ? "warning" : "ok") +
    (zrak ? kartica("Zrak je bil dober", zrak, "časa v priporočenem območju",
      g.aqi >= 90 ? "ok" : g.aqi >= 70 ? "warning" : "alert") : "") +
    (prezr ? kartica("Dobro prezračeno", prezr, "časa pod 1000 ppm CO₂",
      g.co2eq >= 90 ? "ok" : g.co2eq >= 70 ? "warning" : "alert") : "") +
    "</div>";

  // Trak dnevov pokaze ALARME in OPOZORILA po dnevih. Prva razlicica je
  // risala povprecje dneva -- to je skoraj vedno videti v redu, zato so bili
  // vsi stolpci enako zeleni in graf ni povedal nicesar. Zdaj je visina
  // stolpca stevilo dogodkov tistega dne, barva pa najhujsa stopnja.
  const dni = d.days_series || [];
  const najvec = Math.max(1, ...dni.map((x) => (x.alarms || 0) + (x.warnings || 0)));
  const cistih = dni.filter((x) => !x.alarms && !x.warnings).length;
  const trak = dni.length ? '<div class="card"><h3>Alarmi in opozorila po dnevih</h3>' +
    '<div class="muted rep-legenda"><i class="alert"></i>alarm<i class="warning"></i>opozorilo' +
      '<i class="ok"></i>brez dogodkov<span class="rep-cistih">' + cistih + " od " +
      dni.length + " dni brez dogodka</span></div>" +
    '<div class="rep-plot"><div class="rep-os">' +
      [najvec, Math.round(najvec / 2), 0].map((v) => "<span>" + v + "</span>").join("") +
    '</div><div class="rep-trak">' + dni.map((x) => {
      const a = x.alarms || 0, w = x.warnings || 0, skupaj = a + w;
      const cls = a ? "alert" : w ? "warning" : "ok";
      const naslov = dan(x.day) + " — " +
        (skupaj ? (a ? a + " " + (a === 1 ? "alarm" : a === 2 ? "alarma" : a < 5 ? "alarmi" : "alarmov") : "") +
          (a && w ? ", " : "") +
          (w ? w + " " + (w === 1 ? "opozorilo" : w === 2 ? "opozorili" : w < 5 ? "opozorila" : "opozoril") : "")
          : "brez dogodkov") +
        (x.values.aqi != null ? " · AQI " + num(x.values.aqi, 0) : "") +
        (x.values.temp_c != null ? " · " + num(x.values.temp_c, 1) + " °C" : "");
      const hA = skupaj ? (a / najvec) * 100 : 0;
      const hW = skupaj ? (w / najvec) * 100 : 0;
      return '<div class="rep-dan ' + cls + '" title="' + esc(naslov) + '" data-day="' +
        esc(x.day) + '"><span class="rep-stolp">' +
          (a ? '<i class="a" style="height:' + hA.toFixed(1) + '%"></i>' : "") +
          (w ? '<i class="w" style="height:' + hW.toFixed(1) + '%"></i>' : "") +
          (skupaj ? "" : '<i class="prazno"></i>') +
        "</span>" +
        '<span class="rep-dnum">' + new Date(x.day + "T00:00:00").getDate() + "</span></div>";
    }).join("") + "</div></div>" +
    (d.worst_day && d.best_day && d.worst_day.day !== d.best_day.day
      ? '<div class="rep-skrajnosti">' +
      '<span><b class="ok">Najmirnejši dan</b> ' + esc(dan(d.best_day.day)) + "</span>" +
      '<span><b class="alert">Najbolj obremenjen dan</b> ' + esc(dan(
        (dni.slice().sort((p1, p2) =>
          ((p2.alarms || 0) + (p2.warnings || 0)) - ((p1.alarms || 0) + (p1.warnings || 0)))[0] || {}
        ).day || d.worst_day.day)) + "</span></div>" : "") + "</div>" : "";

  // Delez casa v redu po meritvah -- vodoravni stolpci, ker so odstotki
  const vrstice = (mm.keys || []).filter((k) => g[k] != null).map((k) => {
    const p = g[k];
    return '<div class="rep-bar"><span class="rep-bl">' + esc(mm.labels[k] || k) + "</span>" +
      '<span class="rep-bt"><i class="' + (p >= 90 ? "ok" : p >= 70 ? "warning" : "alert") +
        '" style="width:' + p.toFixed(1) + '%"></i></span>' +
      '<span class="rep-bv">' + num(p, 0) + " %</span></div>";
  }).join("");
  const delezi = vrstice ? '<div class="card"><h3>Koliko časa je bilo v redu</h3>' +
    '<div class="muted" style="font-size:12px;margin:-6px 0 12px">Delež časa, ko je bila ' +
      "meritev v priporočenem območju.</div>" + vrstice + "</div>" : "";

  // Kaj izstopa in kaj se je dogajalo
  const izstopa = (d.standouts || []).length
    ? (d.standouts).map((x) =>
      '<div class="dig-row"><span class="dig-ic">' + (DIG_ICON[x.key] || "•") + "</span>" +
      '<span class="dig-t">' + esc(x.text) +
        (x.sigma != null ? '<span class="dig-sig">' + num(x.sigma, 1) + "σ</span>" : "") + "</span>" +
      '<span class="dig-n ' + (x.dir === "up" ? "up" : "down") + '">' +
        (x.dir === "up" ? "▲" : "▼") + " " + num(Math.abs(x.percent), 0) + " %</span>" +
      '<span class="dig-v">' + num(x.now, 1) + " " + esc(x.unit || "") +
        " <small>običajno " + num(x.usual, 1) + "</small></span></div>").join("")
    : '<div class="dig-empty">' + (d.baseline_days >= 4
      ? "Nič ni izstopalo iz običajnega dne."
      : "Za primerjavo z običajnim dnem je premalo zgodovine.") + "</div>";

  const dogodki = (d.top_events || []).length
    ? '<div class="rep-dogodki">' + d.top_events.map((e) =>
      '<div><b>' + num(e.count, 0) + "</b> " + esc(e.type) + "</div>").join("") + "</div>"
    : '<div class="muted">V tem mesecu ni bilo zabeleženih dogodkov.</div>';

  const gib = d.activity || {};
  const dogajanje = '<div class="card"><h3>Kaj se je dogajalo</h3>' + dogodki +
    (gib.minutes ? '<div class="rep-gib muted">Gibanja je bilo skupaj <b>' +
      humanDur(gib.minutes * 60) + "</b> v " + num(gib.periods, 0) + " obdobjih.</div>" : "") +
    "</div>";

  const nasveti = (d.advice || []).length
    ? '<div class="card rep-nasvet"><h3>Kaj priporočamo</h3><ul>' +
      d.advice.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul></div>"
    : "";

  return sodba + stevilke +
    '<div class="grid cols-2 rep-grid">' +
      '<div class="card"><h3>Kaj je izstopalo</h3>' +
        '<div class="muted" style="font-size:12px;margin:-6px 0 10px">Proti običajnemu dnevu' +
        (d.baseline_days ? " (" + d.baseline_days + " dni)" : "") + '.</div>' +
        '<div class="dig-rows">' + izstopa + "</div></div>" +
      dogajanje +
    "</div>" +
    trak + delezi + nasveti;
}

function repVezi() {
  // klik na dan odpre Trende za ta dan -- porocilo je vstopna tocka, ne slepa ulica
  main().querySelectorAll(".rep-dan[data-day]").forEach((el) =>
    el.addEventListener("click", () => {
      S.trend = { ...S.trend, when: el.dataset.day, range: "24h" };
      location.hash = "#/trends";
    }));
}

async function viewAudit() {
  topControls("");
  spin();
  let d;
  try {
    d = await apiGet("/api/v2/audit?limit=300" + (S.auditFilter ? "&action=" + encodeURIComponent(S.auditFilter) : ""));
  } catch (e) { return fail(e); }
  const chips = ['<button class="chip' + (!S.auditFilter ? " active" : "") + '" data-act="">Vse</button>']
    .concat(d.actions.map((a) =>
      `<button class="chip ${S.auditFilter === a ? "active" : ""}" data-act="${esc(a)}">${esc(a)}</button>`))
    .join("");
  const rows = d.entries.length ? d.entries.map((e) => {
    let detail = e.detail_json || "";
    try { detail = Object.entries(JSON.parse(detail)).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(" · "); } catch {}
    return `<tr>
      <td>${dateTime(e.at)}</td>
      <td><span class="pill ok" style="text-transform:none">${esc(e.action)}</span></td>
      <td>${esc(e.user_email || "sistem")}</td>
      <td>${esc(e.org_name || "—")}</td>
      <td>${esc(e.target || "—")}</td>
      <td class="muted" style="white-space:normal;max-width:340px">${esc(detail)}</td>
    </tr>`;
  }).join("") : '<tr><td colspan="6" class="empty" style="border:none">Ni audit vnosov.</td></tr>';
  main().innerHTML = `
    <div class="filters">${chips}</div>
    <div class="table-wrap"><table class="data">
      <thead><tr><th>Čas</th><th>Akcija</th><th>Uporabnik</th><th>Organizacija</th><th>Tarča</th><th>Detajli</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  main().querySelectorAll(".chip[data-act]").forEach((c) =>
    c.addEventListener("click", () => { S.auditFilter = c.dataset.act; viewAudit(); }));
}

// ---------- Login ----------
function renderLogin() {
  document.getElementById("app").removeAttribute("aria-busy");
  document.getElementById("app").innerHTML = `
    <div class="login-wrap"><form class="login-card" id="loginForm">
      <h1>HALO Dashboard</h1><p>Prijava za dostop do nadzorne plošče.</p>
      <label>E-pošta</label><input type="email" id="li_email" autocomplete="username" required>
      <label>Geslo</label><input type="password" id="li_pw" autocomplete="current-password" required>
      <button class="btn primary" type="submit">Prijava</button>
      <div class="login-err" id="li_err"></div>
    </form></div>`;
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await apiSend("POST", "/api/auth/login", { email: $("#li_email").value, password: $("#li_pw").value });
      location.reload();
    } catch (err) { document.getElementById("li_err").textContent = err.message || "Prijava ni uspela"; }
  });
}

// ---------- SVG line chart (enoserijski, hover crosshair) ----------

// Oblaček grafa živi v <body>: kartica ima backdrop-filter, ta pa naredi
// containing block za position:fixed potomce — znotraj nje bi se koordinate
// merile od kartice in oblaček bi visel vstran.
function chartTip() {
  let t = document.getElementById("chartTip");
  if (!t) {
    t = document.createElement("div");
    t.id = "chartTip";
    t.className = "chart-tip";
    document.body.appendChild(t);
  }
  return t;
}

function lineChart(points, opts = {}) {
  const W = 760, H = 240, padL = 46, padR = 14, padT = 14, padB = 28;
  const iw = W - padL - padR, ih = H - padT - padB;
  // Podatki se med zivljenjem grafa ZAMENJAJO (morph), zato niso konstante.
  let xs = points.map((p) => new Date(p.t).getTime());
  let n = points.length;
  let xmin = xs[0], xmax = xs[n - 1];
  let span = Math.max(1, xmax - xmin);
  let hasBand = points.some((p) => p.lo != null && p.hi != null);
  const zoomMax = Math.max(1, opts.zoom || 1);
  let cmp = opts.compare || [];
  let thr = thresholdLines(opts.thresholds);
  const setData = (pts, o) => {
    points = pts;
    xs = points.map((q) => new Date(q.t).getTime());
    n = points.length;
    xmin = xs[0]; xmax = xs[n - 1];
    span = Math.max(1, xmax - xmin);
    hasBand = points.some((q) => q.lo != null && q.hi != null);
    if (o) {
      opts = Object.assign({}, opts, o);
      cmp = opts.compare || [];
      thr = thresholdLines(opts.thresholds);
    }
  };
  const gid = "lg" + Math.random().toString(36).slice(2, 8);

  const wrap = document.createElement("div");
  wrap.style.position = "relative";
  wrap.innerHTML = `<svg class="linechart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img">
    <defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--accent)" stop-opacity="0.16"/>
        <stop offset="1" stop-color="var(--accent)" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="${gid}s" x1="0" y1="0" x2="0" y2="1"></linearGradient>
      <linearGradient id="${gid}w" x1="0" y1="0" x2="1" y2="0"></linearGradient>
    </defs>
    <g class="dyn"></g>
    <g class="live"></g>
    <line class="cursor-line" x1="0" y1="${padT}" x2="0" y2="${padT + ih}" style="opacity:0"/>
    <circle class="cursor-dot" r="3.5" style="opacity:0"/>
    <rect x="${padL}" y="${padT}" width="${iw}" height="${ih}" fill="transparent" style="cursor:crosshair"/>
  </svg>`;
  const xlab = document.createElement("div");
  xlab.className = "chart-xlab";
  wrap.appendChild(xlab);
  const svg = wrap.querySelector("svg"), dyn = wrap.querySelector("g.dyn"),
    zivo = wrap.querySelector("g.live"),
    cl = wrap.querySelector(".cursor-line"), cd = wrap.querySelector(".cursor-dot"),
    tip = chartTip(), rect = wrap.querySelector("rect");

  // Interaktivni zoom: brez hoverja je prikazano celotno obdobje; ob hoverju
  // se pogled pocasi (lerp) priblizuje casu pod kazalcem — faktor poda
  // klicatelj (najvecji pri 7/30 dneh, kjer je graf najbolj stisnjen). Y os
  // se preracuna na vidni izsek, zato se stisnjena krivulja zares razpre.
  const st = { c: 0.5, z: 1, tc: 0.5, tz: 1, cVel: 0, raf: 0, mouse: null, view: null, marks: [] };

  const bisect = (t) => {
    let a = 0, b = n - 1;
    while (a < b) { const m = (a + b) >> 1; if (xs[m] < t) a = m + 1; else b = m; }
    return a;
  };

  function render() {
    const halfw = 0.5 / st.z;
    const c = Math.min(1 - halfw, Math.max(halfw, st.c));
    const w0 = xmin + (c - halfw) * span, w1 = xmin + (c + halfw) * span;
    let i0 = bisect(w0); if (i0 > 0) i0--;
    let i1 = bisect(w1) + 2; if (i1 > n) i1 = n;
    const stride = Math.max(1, Math.ceil((i1 - i0) / 400));
    const sl = [];
    for (let i = i0; i < i1; i += stride) sl.push(i);
    if (sl[sl.length - 1] !== i1 - 1) sl.push(i1 - 1);

    let lo = Infinity, hi = -Infinity;
    for (const i of sl) {
      const p = points[i];
      const a = p.lo != null ? p.lo : p.v, b = p.hi != null ? p.hi : p.v;
      if (a < lo) lo = a;
      if (b > hi) hi = b;
    }
    if (!Number.isFinite(lo)) { lo = 0; hi = 1; }
    if (lo === hi) { lo -= 1; hi += 1; }
    const vpad = (hi - lo) * 0.08; lo -= vpad; hi += vpad;

    const X = (t) => padL + ((t - w0) / Math.max(1, w1 - w0)) * iw;
    const Y = (v) => padT + ih - ((v - lo) / (hi - lo)) * ih;

    let line = "", top = "", bot = "";
    sl.forEach((i, k) => {
      const x = X(xs[i]).toFixed(1);
      line += (k ? "L" : "M") + x + " " + Y(points[i].v).toFixed(1) + " ";
      if (hasBand) top += (k ? "L" : "M") + x + " " + Y(points[i].hi ?? points[i].v).toFixed(1) + " ";
    });
    // primerjalna serija (drugo obdobje), časovno poravnana na isto okno
    let line2 = "";
    if (cmp.length) {
      let started = false;
      for (const p of cmp) {
        const t = new Date(p.t).getTime();
        if (t < w0 || t > w1 || p.v == null) continue;
        line2 += (started ? "L" : "M") + X(t).toFixed(1) + " " + Y(p.v).toFixed(1) + " ";
        started = true;
      }
    }
    if (hasBand)
      for (let k = sl.length - 1; k >= 0; k--) {
        const i = sl[k];
        bot += "L" + X(xs[i]).toFixed(1) + " " + Y(points[i].lo ?? points[i].v).toFixed(1) + " ";
      }
    const baseY = (padT + ih).toFixed(1);
    const area = `M${X(xs[sl[0]]).toFixed(1)} ${baseY} ${line.replace(/^M/, "L")}L${X(xs[sl[sl.length - 1]]).toFixed(1)} ${baseY} Z`;

    let gridS = "";
    for (let g = 0; g <= 4; g++) {
      const v = lo + ((hi - lo) * g) / 4, y = Y(v).toFixed(1);
      gridS += `<line class="grid-line" x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"/>` +
        `<text class="axis-label" x="${padL - 6}" y="${(+y + 3).toFixed(1)}" text-anchor="end">${num(v, hi - lo < 5 ? 1 : 0)}</text>`;
    }
    const wide = (w1 - w0) > 48 * 36e5;
    for (let g = 0; g <= 2; g++) {
      const t = w0 + ((w1 - w0) * g) / 2, d = new Date(t);
      const lab = (wide ? d.toLocaleDateString("sl", { day: "2-digit", month: "2-digit" }) + " " : "") + clock(d.toISOString());
      gridS += `<text class="axis-label" x="${X(t).toFixed(1)}" y="${H - 8}" text-anchor="${g === 0 ? "start" : g === 2 ? "end" : "middle"}">${lab}</text>`;
    }
    for (const tl of thr) {
      if (tl.v < lo || tl.v > hi) continue;
      const y = Y(tl.v).toFixed(1);
      const col = tl.kind === "alert" ? "var(--alert)" : "var(--warn)";
      gridS += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="${col}" stroke-width="1" stroke-dasharray="4 4"/>` +
        `<text class="axis-label" x="${W - padR}" y="${(+y - 3).toFixed(1)}" text-anchor="end" fill="${col}">${tl.label} ${num(tl.v, 0)}</text>`;
    }

    // označene točke + pas med njima
    let marksS = "";
    if (st.marks.length) {
      if (st.marks.length === 2) {
        const mx0 = Math.max(padL, X(st.marks[0])), mx1 = Math.min(W - padR, X(st.marks[1]));
        if (mx1 > mx0) marksS += `<rect class="sel-band" x="${mx0.toFixed(1)}" y="${padT}" width="${(mx1 - mx0).toFixed(1)}" height="${ih}"/>`;
      }
      for (const t of st.marks) {
        const mx = X(t);
        if (mx < padL - 2 || mx > W - padR + 2) continue;
        marksS += `<line class="sel-mark" x1="${mx.toFixed(1)}" y1="${padT}" x2="${mx.toFixed(1)}" y2="${padT + ih}"/>`
          + `<circle class="sel-dot" cx="${mx.toFixed(1)}" cy="${padT + ih}" r="4"/>`;
      }
    }
    dyn.innerHTML = gridS +
      (hasBand ? `<path class="band" d="${top}${bot}Z"/>` : "") +
      `<path class="areafill" d="${area}" fill="url(#${gid})"/>` +
      (line2 ? `<path class="series2" d="${line2}"/>` : "") +
      `<path class="series" d="${line}" stroke="url(#${gid}s)"/>` + marksS;
    // Barva krivulje sledi resnosti: kjer preseže opozorilno mejo postane
    // jantarna, nad alarmno rdeča. Gradient je po Y, zato se barva spremeni
    // točno na meji — brez izmišljanja.
    const grad = wrap.querySelector(`#${gid}s`);
    if (grad) {
      const t = opts.thresholds || {};
      const frac = (v) => Math.max(0, Math.min(1, (Y(v) - padT) / ih));
      const stops = [];
      const push = (off, col) => stops.push(`<stop offset="${off.toFixed(3)}" stop-color="${col}"/>`);
      const wh = t.warning_high, ah = t.alert_high;
      if (ah != null && ah < hi) { push(0, "var(--alert)"); push(frac(ah), "var(--alert)"); }
      if (wh != null && wh < hi) {
        const f = frac(wh);
        if (!stops.length) push(0, "var(--warn)");
        else push(frac(ah != null ? ah : wh), "var(--warn)");
        push(f, "var(--warn)");
        push(f, "var(--accent)");
      } else if (stops.length) {
        push(frac(ah), "var(--accent)");
      }
      if (!stops.length) { push(0, "var(--accent)"); push(1, "var(--accent)"); }
      else push(1, "var(--accent)");
      grad.innerHTML = stops.join("");
      grad.setAttribute("gradientUnits", "objectBoundingBox");
    }
    st.view = { w0, w1, X, Y };
    st.lastPt = { x: X(xs[n - 1]), y: Y(points[n - 1].v) };
    postaviZivo();
    if (st.mouse) updateCursor();
  }

  // Ziva tocka je v svoji plasti, ker render() plast "dyn" ob vsakem izrisu
  // prepise -- utrip bi tam izginil ze ob prvem premiku miske ali ob morphu.
  // Tu jo samo prestavimo za zadnjo meritvijo.
  function postaviZivo() {
    if (!st.zivo || !st.lastPt) return;
    const t = zivo.querySelector(".live-core"), h = zivo.querySelector(".live-halo");
    if (!t) return;
    const znotraj = st.lastPt.x >= padL - 1 && st.lastPt.x <= padL + iw + 1;
    zivo.style.opacity = znotraj ? 1 : 0;
    [t, h].forEach((e) => {
      if (!e) return;
      e.setAttribute("cx", st.lastPt.x);
      e.setAttribute("cy", st.lastPt.y);
    });
    zivo.querySelectorAll(".pulse-ring").forEach((e) => {
      e.setAttribute("cx", st.lastPt.x); e.setAttribute("cy", st.lastPt.y);
    });
  }

  const NS_SVG = "http://www.w3.org/2000/svg";

  // Graf, ki tece do zdaj, ima na koncu crte zivo tocko: mehko utripa sama od
  // sebe (da se vidi, da je slika ziva), ob PRIHODU nove meritve pa iz nje
  // stece obroc. Tako se posodobitev vidi tudi, ce je vrednost enaka.
  wrap.setLive = (on) => {
    st.zivo = !!on;
    zivo.innerHTML = on
      ? '<circle class="live-halo" r="7"/><circle class="live-core" r="3.2"/>'
      : "";
    postaviZivo();
  };

  wrap.pulseLast = () => {
    if (!st.lastPt || REDUCED || PREFS.motion === "off") return;
    if (!st.zivo) wrap.setLive(true);
    const ring = document.createElementNS(NS_SVG, "circle");
    ring.setAttribute("class", "pulse-ring");
    ring.setAttribute("cx", st.lastPt.x); ring.setAttribute("cy", st.lastPt.y);
    ring.setAttribute("r", "3");
    zivo.appendChild(ring);
    setTimeout(() => ring.remove(), 3400);
  };

  function clampTarget() {
    const halfw = 0.5 / Math.max(1, st.tz);
    st.tc = Math.min(1 - halfw, Math.max(halfw, st.tc));
  }

  function tick() {
    st.raf = 0;
    // graf sledi ciljema (tz/tc), ki ju nastavlja kolešček / vlečenje —
    // nikoli sam od sebe ob prehodu miške
    st.z += (st.tz - st.z) * 0.16;
    const halfw = 0.5 / Math.max(1, st.z);
    st.cVel += (st.tc - st.c) * 0.14;
    st.cVel *= 0.72;
    st.c += st.cVel;
    if (st.c < halfw) { st.c = halfw; if (st.cVel < 0) st.cVel *= -0.25; }
    if (st.c > 1 - halfw) { st.c = 1 - halfw; if (st.cVel > 0) st.cVel *= -0.25; }
    if (Math.abs(st.tz - st.z) < 0.004 && Math.abs(st.tc - st.c) < 0.0006 && Math.abs(st.cVel) < 0.0006) {
      st.z = st.tz; st.c = st.tc; st.cVel = 0;
    }
    render();
    if (Math.abs(st.tz - st.z) > 0.003 || Math.abs(st.tc - st.c) > 0.0005 || Math.abs(st.cVel) > 0.0005) queue();
  }
  const queue = () => { if (!st.raf) st.raf = requestAnimationFrame(tick); };

  function hideCursor() {
    cl.style.opacity = 0; cd.style.opacity = 0; tip.style.opacity = 0;
    xlab.classList.remove("on");
  }

  function updateCursor() {
    const { w0, w1, X, Y } = st.view;
    const t = w0 + st.mouse.fx * (w1 - w0);
    let i = bisect(t);
    if (i > 0 && Math.abs(xs[i - 1] - t) < Math.abs(xs[i] - t)) i--;
    const p = points[i];
    // v vrzeli med meritvami ne kažemo vrednosti (sicer bi se križec pripel
    // na oddaljeno točko in oblaček bi visel daleč stran)
    if (Math.abs(xs[i] - t) > (w1 - w0) * 0.05) { hideCursor(); return; }
    const px = X(xs[i]), py = Y(p.v);
    cl.setAttribute("x1", px); cl.setAttribute("x2", px); cl.style.opacity = 1;
    cd.setAttribute("cx", px); cd.setAttribute("cy", py); cd.style.opacity = 1;
    const d = new Date(p.t);
    const rng = p.lo != null && p.hi != null
      ? `<span class="rng">min ${num(p.lo, 1)} · max ${num(p.hi, 1)}</span>` : "";
    const st8 = assessValue(p.v, opts.thresholds);
    tip.innerHTML = `<b>${num(p.v, 1)} ${esc(opts.unit || "")}</b>${rng}` +
      `<span class="tt">${d.toLocaleDateString("sl", { day: "2-digit", month: "2-digit" })} ${clock(p.t)}</span>` +
      `<span class="state ${st8.lvl}">${esc(st8.label)}</span>`;
    tip.style.opacity = 1;
    // pod navpicnico, na dnu grafa, pise cel dan in ura -- brez ugibanja,
    // kateri dan je tocka, kadar graf zajema vec dni
    xlab.textContent = d.toLocaleDateString("sl",
      { weekday: "long", day: "numeric", month: "numeric" }) + " " + clock(p.t);
    xlab.style.left = ((px / W) * 100).toFixed(3) + "%";
    xlab.style.top = (((padT + ih) / H) * 100).toFixed(3) + "%";
    xlab.classList.add("on");
    // oblaček stoji CENTRIRAN NAD označeno točko, da ga ni mogoče zgrešiti
    const r = svg.getBoundingClientRect();
    const sx = r.left + (px / W) * r.width;
    const sy = r.top + (py / H) * r.height;
    const tw = tip.offsetWidth || 130, th = tip.offsetHeight || 60;
    // desno od pike in navpično poravnan z njo; ob desnem robu se prezrcali
    let left = sx + 16;
    if (left + tw > innerWidth - 8) left = sx - tw - 16;
    left = Math.max(8, left);
    let top = sy - th / 2;
    top = Math.max(8, Math.min(top, innerHeight - th - 8));
    tip.style.left = Math.round(left) + "px";
    tip.style.top = Math.round(top) + "px";

    // zvezdice ob premiku na novo točko (če so vklopljene)
    if (PREFS.sparkle === "on" && st.lastIdx !== i && !REDUCED && PREFS.motion !== "off") {
      st.lastIdx = i;
      spawnSparkles(sx, sy, 4);
    }
  }

  // ---- Interakcija: kolešček približa, vlečenje panira, klik označi točko ----
  // Hover NIČ ne premika — samo križec in tooltip.
  const MAXZ = 60;
  const fxOf = (clientX) => {
    const r = svg.getBoundingClientRect();
    return Math.min(1, Math.max(0, (((clientX - r.left) / r.width) * W - padL) / iw));
  };
  const timeAt = (fx) => {
    const v = st.view || { w0: xmin, w1: xmax };
    return v.w0 + fx * (v.w1 - v.w0);
  };
  rect.style.cursor = "crosshair";

  rect.addEventListener("wheel", (e) => {
    e.preventDefault();
    const fx = fxOf(e.clientX);
    const anchor = (timeAt(fx) - xmin) / span;         // čas pod kazalcem
    const nz = Math.min(MAXZ, Math.max(1, st.tz * Math.exp(-e.deltaY * 0.0018)));
    const halfw = 0.5 / nz;
    st.tz = nz;
    st.tc = anchor + halfw * (1 - 2 * fx);             // ta čas ostane na mestu
    clampTarget();
    queue();
  }, { passive: false });

  let drag = null;
  rect.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, c: st.tc, moved: 0 };
    try { rect.setPointerCapture(e.pointerId); } catch { /* ni nujno */ }
  });
  rect.addEventListener("pointerup", (e) => {
    const wasDrag = drag && drag.moved > 4;
    drag = null;
    if (!wasDrag) addMark(timeAt(fxOf(e.clientX)));
  });
  rect.addEventListener("pointercancel", () => { drag = null; });
  rect.addEventListener("dblclick", () => { st.tz = 1; st.tc = 0.5; clampTarget(); queue(); });

  rect.addEventListener("mousemove", (e) => {
    st.mouse = { fx: fxOf(e.clientX), cx: e.clientX, cy: e.clientY };
    if (drag) {
      const r = svg.getBoundingClientRect();
      drag.moved = Math.max(drag.moved, Math.abs(e.clientX - drag.x));
      const dxFrac = ((e.clientX - drag.x) / Math.max(1, r.width)) * (W / iw) / Math.max(1, st.z);
      st.tc = drag.c - dxFrac;
      clampTarget();
      queue();
    }
    if (st.view) updateCursor();
  });
  rect.addEventListener("mouseleave", () => { st.mouse = null; hideCursor(); });
  // ko graf izgine (menjava metrike, zaprt modal), skupni oblaček skrij
  new MutationObserver((_, obs) => {
    if (!wrap.isConnected) { hideCursor(); obs.disconnect(); }
  }).observe(document.body, { childList: true, subtree: true });

  // ---- Označitev dveh točk -> odsek za analizo ----
  const chip = document.createElement("div");
  chip.className = "sel-chip";
  wrap.appendChild(chip);

  function addMark(t) {
    if (st.marks.length >= 2) st.marks = [];
    st.marks.push(t);
    st.marks.sort((a, b) => a - b);
    renderChip();
    render();
  }
  function clearMarks() { st.marks = []; renderChip(); render(); }
  wrap.clearMarks = clearMarks;

  function renderChip() {
    if (st.marks.length < 2) { chip.classList.remove("on"); chip.innerHTML = ""; return; }
    const [a, b] = st.marks;
    const fmt = (t) => {
      const d = new Date(t);
      return `${d.toLocaleDateString("sl", { day: "2-digit", month: "2-digit" })} ${clock(d.toISOString())}`;
    };
    const mins = Math.round((b - a) / 60000);
    const dur = mins < 60 ? `${mins} min` : mins < 1440 ? `${(mins / 60).toFixed(1)} h` : `${(mins / 1440).toFixed(1)} dni`;
    chip.innerHTML = `<button class="sel-open" type="button">${esc(fmt(a))} → ${esc(fmt(b))} · ${esc(dur)} · Analiziraj</button>
      <button class="sel-x" type="button" aria-label="Počisti">&times;</button>`;
    chip.classList.add("on");
    chip.querySelector(".sel-open").addEventListener("click", (e) => {
      e.stopPropagation();
      if (opts.onSelect) opts.onSelect(new Date(a).toISOString(), new Date(b).toISOString());
    });
    chip.querySelector(".sel-x").addEventListener("click", (e) => { e.stopPropagation(); clearMarks(); });
  }

  render();

  // ---------- Morph: val potuje z leve proti desni ----------
  // Krivulja je funkcija casa (za vsak x en y), zato ni treba splosnega
  // preoblikovanja likov: obe seriji prevzorcimo na ISTO mrezo in vsaki tocki
  // damo SVOJ napredek, ki ga poganja celo vala. Levo je preobrazba ze
  // koncana, desno se ni zacela -- oblika tece.
  const MORPH_RES = 320;        // koliko tock ima vmesna krivulja
  const MORPH_MS = 1150;
  const SPREAD = 0.42;          // sirina vala v delezu grafa (sirse = bolj tekoce)

  // vzorec na poljubnem mestu serije (u = 0..1 po indeksu)
  const sampleAt = (pts, u) => {
    const x = u * (pts.length - 1);
    const i = Math.max(0, Math.min(pts.length - 1, Math.floor(x)));
    const j = Math.min(pts.length - 1, i + 1);
    const f = x - i, a = pts[i], b = pts[j];
    const mix = (k) => {
      const va = a[k] != null ? a[k] : a.v, vb = b[k] != null ? b[k] : b.v;
      return va + (vb - va) * f;
    };
    return {
      t: new Date(a.t).getTime() + (new Date(b.t).getTime() - new Date(a.t).getTime()) * f,
      v: a.v + (b.v - a.v) * f, lo: mix("lo"), hi: mix("hi"),
    };
  };
  // CSS-ov cubic-bezier v JS: val ne tece prek CSS prehoda, ampak ga risemo
  // sami sliko za sliko, zato potrebujemo isto krivuljo v kodi.
  const cubicBezier = (x1, y1, x2, y2) => {
    const A = (a, b) => 1 - 3 * b + 3 * a, B = (a, b) => 3 * b - 6 * a, C = (a) => 3 * a;
    const calc = (t, a, b) => ((A(a, b) * t + B(a, b)) * t + C(a)) * t;
    const slope = (t, a, b) => 3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a);
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 6; i++) {                 // Newton-Raphson, dovolj za 6 mest
        const d = slope(t, x1, x2);
        if (Math.abs(d) < 1e-6) break;
        const e = calc(t, x1, x2) - x;
        if (Math.abs(e) < 1e-6) break;
        t -= e / d;
      }
      return calc(t, y1, y2);
    };
  };
  // Celo vala: klasicni ease-in-out. Prej je bil expo-out, ki je na zacetku
  // svignil in se na koncu vlekel -- zadnja cetrtina grafa je porabila 40 %
  // casa. S to krivuljo so razmiki med koncanjem tock 117/110/122/175 ms.
  const easeWave = cubicBezier(0.42, 0, 0.58, 1);
  // Celo potuje OD LEVEGA ROBA do desnega + rezerva, da tam ne odmre.
  // Prej je zacelo pri -SPREAD, torej je prvo tretjino animacije potovalo
  // zunaj grafa in se prvih 400 ms ni videlo nicesar.
  const WAVE_RUN = 1 + SPREAD + 0.10;
  // Tocka pristane s komaj zaznavnim preskokom: teza brez poskakovanja.
  const backOut = (x) => 1 + 1.42 * Math.pow(x - 1, 3) + 0.72 * Math.pow(x - 1, 2);

  wrap.morphTo = (nextPts, nextOpts) => {
    if (!nextPts || !nextPts.length) return;
    // v skritem zavihku je val cista poraba -- casovniki so tam upocasnjeni
    if (REDUCED || PREFS.motion === "off" || document.hidden ||
        points.length < 2 || nextPts.length < 2) {
      setData(nextPts, nextOpts); st.tz = 1; st.tc = 0.5; st.z = 1; st.c = 0.5;
      st.marks = []; render(); return;
    }
    cancelAnimationFrame(wrap._morphRaf || 0);
    clearTimeout(wrap._morphGuard);
    const fromPts = points, toPts = nextPts;
    const fromOpts = opts, toOpts = Object.assign({}, opts, nextOpts || {});
    const A = [], B = [];
    for (let k = 0; k < MORPH_RES; k++) {
      const u = k / (MORPH_RES - 1);
      A.push(sampleAt(fromPts, u));
      B.push(sampleAt(toPts, u));
    }
    // koliko naj val "vzvalovi" -- sorazmerno s tem, kako mocno se tocka seli
    const scaleOf = [];
    let maxJump = 0;
    for (let k = 0; k < MORPH_RES; k++) {
      const j = Math.abs(B[k].v - A[k].v);
      scaleOf.push(j);
      if (j > maxJump) maxJump = j;
    }
    const floor = maxJump * 0.12;

    st.marks = [];                       // oznacene tocke ne veljajo za nove podatke
    st.tz = 1; st.tc = 0.5; st.z = 1; st.c = 0.5;
    rect.style.pointerEvents = "none";
    hideCursor();
    svg.style.transformOrigin = "50% 100%";
    let swapped = false;
    const t0 = performance.now();

    const frame = (now) => {
      const T = Math.min(1, (now - t0) / MORPH_MS);
      const e = easeWave(T);
      const front = e * WAVE_RUN;
      // pragovi in enota pripadajo NOVI meritvi -- zamenjamo jih pod celom vala
      if (!swapped && front > 0.5) {
        swapped = true;
        opts = toOpts; cmp = opts.compare || []; thr = thresholdLines(opts.thresholds);
      }
      const mid = [];
      for (let k = 0; k < MORPH_RES; k++) {
        const u = k / (MORPH_RES - 1);
        const pRaw = (front - u) / SPREAD;
        const pp = Math.max(0, Math.min(1, pRaw));
        const ease = backOut(pp);                       // gravitacija na cilju
        const amp = (scaleOf[k] * 0.16 + floor) * 0.55;
        // sin^1.6 namesto sin: greben se bolj postopoma dvigne in spusti
        const bulge = amp * Math.pow(Math.sin(Math.PI * pp), 1.6) * (1 - 0.3 * pp);
        const a = A[k], b = B[k];
        mid.push({
          t: a.t + (b.t - a.t) * e,
          v: a.v + (b.v - a.v) * ease + bulge,
          lo: a.lo + (b.lo - a.lo) * ease,
          hi: a.hi + (b.hi - a.hi) * ease,
        });
      }
      setData(mid.map((q) => ({ t: new Date(q.t).toISOString(), v: q.v, lo: q.lo, hi: q.hi })));
      render();
      // svetloba na celu vala + rahel stisk celega grafa
      const glowSrc = dyn.querySelector("path.series");
      const gw = wrap.querySelector(`#${gid}w`);
      if (glowSrc && gw && T < 1) {
        const c = Math.max(0, Math.min(1, front));
        gw.innerHTML =
          `<stop offset="${Math.max(0, c - 0.14).toFixed(3)}" stop-color="var(--accent)" stop-opacity="0"/>` +
          `<stop offset="${c.toFixed(3)}" stop-color="#ffffff" stop-opacity="0.95"/>` +
          `<stop offset="${Math.min(1, c + 0.10).toFixed(3)}" stop-color="var(--accent)" stop-opacity="0"/>`;
        gw.setAttribute("gradientUnits", "objectBoundingBox");
        const glow = glowSrc.cloneNode();
        glow.setAttribute("class", "morph-glow");
        glow.setAttribute("stroke", `url(#${gid}w)`);
        dyn.appendChild(glow);
      }
      svg.style.transform = "scaleY(" +
        (1 + 0.018 * Math.pow(Math.sin(Math.PI * T), 1.4)).toFixed(4) + ")";

      if (T < 1) { schedule(); return; }
      wrap._morphRaf = 0;
      finish();
    };
    // Val ne sme viseti samo na animacijski sliki: ce te ne tecejo (zavihek v
    // ozadju, varcevanje), ga poganja casovnik. Kadar slike tecejo, casovnik
    // vsakic prekinemo, zato normalno tece s polno hitrostjo.
    const schedule = () => {
      wrap._morphRaf = requestAnimationFrame((now) => {
        clearTimeout(wrap._morphTick);
        frame(now);
      });
      wrap._morphTick = setTimeout(() => {
        cancelAnimationFrame(wrap._morphRaf);
        frame(performance.now());
      }, 40);
    };
    const finish = () => {
      clearTimeout(wrap._morphTick);
      clearTimeout(wrap._morphGuard);
      opts = toOpts;
      setData(toPts, toOpts);
      st.tz = 1; st.tc = 0.5; st.z = 1; st.c = 0.5;
      render();
      svg.style.transform = "";
      rect.style.pointerEvents = "";
      const gw = wrap.querySelector(`#${gid}w`);
      if (gw) gw.innerHTML = "";
    };
    schedule();
    // skrajna varovalka: tudi ce se karkoli zatakne, pristanemo na novih podatkih
    wrap._morphGuard = setTimeout(() => {
      cancelAnimationFrame(wrap._morphRaf);
      clearTimeout(wrap._morphTick);
      wrap._morphRaf = 0;
      finish();
    }, MORPH_MS + 400);
  };

  // draw-in ob prvem izrisu
  requestAnimationFrame(() => {
    const sp = dyn.querySelector("path.series");
    if (!sp) return;
    try {
      const len = sp.getTotalLength();
      if (len > 0 && Number.isFinite(len)) {
        sp.style.strokeDasharray = String(len);
        sp.style.strokeDashoffset = String(len);
        sp.classList.add("draw");
        requestAnimationFrame(() => { sp.style.strokeDashoffset = "0"; });
        setTimeout(() => {
          const cur = dyn.querySelector("path.series");
          if (cur) { cur.classList.remove("draw"); cur.style.strokeDasharray = ""; cur.style.strokeDashoffset = ""; }
        }, 1200);
      }
    } catch { /* odklopljen svg: preskoci animacijo */ }
  });
  return wrap;
}
function thresholdLines(t) {
  // metric_thresholds() vrne warning_high/alert_high/warning_low/alert_low;
  // za PM10-izpeljane dogodke (vape/THC/masking prag 35, smoking 200) so meje
  // v alarm_rules.json že vključene prek configured_alarm_thresholds().
  if (!t || typeof t !== "object") return [];
  const map = {
    alert_high: ["alert", "alarm"], alert_low: ["alert", "alarm"],
    warning_high: ["warn", "opoz."], warning_low: ["warn", "opoz."],
  };
  const out = [];
  for (const [k, [kind, label]] of Object.entries(map))
    if (typeof t[k] === "number") out.push({ v: t[k], kind, label });
  return out;
}
