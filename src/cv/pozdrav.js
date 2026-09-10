/**
 * Pozdrav - besedilo, sestavljeno iz znakov, ki se prelivajo skozi jezike.
 *
 * Kako nastane oblika: besedilo izrisemo na pomozno platno, ga preberemo po
 * mrezi in vsaka polna tocka postane tarca. S tem oblike ne opisuje noben
 * seznam koordinat - crke pridejo iz pisave, torej so pravilne v vsakem
 * jeziku, s sumniki vred.
 *
 * Ob menjavi jezika vsak znak dobi PROSTORSKO NAJBLIZJO prosto tarco, ne
 * tarce z isto zaporedno stevilko. Zato znaki ne odletijo cez cel napis, ampak
 * se premaknejo za nekaj crk - in menjava se bere kot preliv, ne kot skok.
 * Zamik potovanja raste z lego po vodoravnici, zato tece kot val z leve.
 *
 * Znaki so dveh vrst. Prvi sestavljajo besedilo. Drugi lezijo v ozadju na
 * Chladnijevih figurah - vzorcih, ki jih na plosci nariše stojece valovanje
 * pri dani frekvenci. Ti ostanejo tudi, ko besedilo odide: ob drsenju po
 * strani se besedilo umakne, ozadje pa gre naprej pod vsebino.
 */

import "./pozdrav.css";

/**
 * Pozdrav je sestavljen iz dveh delov, ki imata vsak svoje jezikovne
 * razlicice. Dokler gremo skozi jezike prvic, sta oba iz istega jezika; ko
 * smo presli vse, se zacneta mesati - pozdrav iz enega jezika, "jaz sem" iz
 * drugega. Tako se napis ne zacne ponavljati.
 */
const DELI = [
  ["Živjo", "Hi", "Hola", "Ciao", "Hallo", "Bonjour", "Merhaba", "Hej", "Ahoj"],
  ["jaz sem", "I am", "soy", "sono", "ich bin", "je suis", "ben", "jag är", "jsem"],
];
const IME = "Jure Blatnik";
const JEZIKOV = DELI[0].length;

/** Napis v kotu. Ne sodeluje v menjavi jezikov - je podpis, ne pozdrav. */
const KOT_NAPIS = "jure labs";

/**
 * Znaki, iz katerih so delci.
 *
 * Zvezde, srca, rombi, kriz i, snezinke - oblike in ne crtice. Pika ali
 * pomisljaj sta prah; znak z obliko se vidi tudi, ko je droben, in napis iz
 * njih je videti sestavljen in ne natipkan.
 */
const ZNAKI = [
  "✦", "✧", "★", "☆", "✶", "✷", "✸", "✹", "✺", "✻", "✼", "❂",
  "❉", "❊", "❋", "✿", "❀", "❁", "♥", "♡", "♦", "♢", "♠", "♣",
  "●", "○", "◉", "◎", "◆", "◇", "■", "□", "▲", "△", "▼", "▽",
  "✚", "✕", "✖", "✱", "✲", "✳", "❄", "❅", "❆", "⚡", "☀", "☾",
  "⚙", "✤", "✣", "✥", "⁕", "⁎", "∗", "⍟",
];

/** Koliko casa napis miruje, preden se zacne prelivati v naslednji jezik. */
const MIROVANJE_S = 6.5;
/** Koliko traja preliv od zacetka prvega znaka do prihoda zadnjega. */
const VAL_S = 1.9;

/** Razmik med tarcami. Vecji od velikosti znakov, sicer se ti prekrivajo. */
const GOSTOTA = 11;
/** Zgornja meja stevila znakov v besedilu in v ozadju. */
const NAJVEC_BESEDILA = 900;
const NAJVEC_OZADJA = 620;
/** Koliko sirine sme zavzeti napis. */
const NAJVEC_SIRINE = 0.74;

/** Kako mocno znak vlece proti tarci in koliko ga dusi. */
const VZMET = 0.055;
const DUSENJE = 0.86;

/** Kazalec odriva znake. Polmer v pikah in moc odriva. */
const KAZALEC_R = 150;
const KAZALEC_MOC = 2.6;

/**
 * Frekvence v ozadju.
 *
 * Chladnijeva figura je crta, po kateri plosca pri dani frekvenci miruje -
 * tam, kjer se dve stojeci valovanji iznicita. Vzorec dobimo tako, da
 * povsod izracunamo
 *
 *     f = cos(n pi x) cos(m pi y) - cos(m pi x) cos(n pi y)
 *
 * in obdrzimo tocke, kjer je |f| blizu nic. Razlicna n in m dajo razlicne
 * vzorce; imena in herci so tu zato, ker vzorec brez imena ni nic.
 */
const FREKVENCE = [
  { hz: 126, ime: "Sun pulse", n: 2, m: 3, meja: 0.13 },
  { hz: 180, ime: "Personal", n: 3, m: 4, meja: 0.13 },
  { hz: 432, ime: "Harmonic", n: 4, m: 5, meja: 0.12 },
  { hz: 528, ime: "Uplifting", n: 5, m: 6, meja: 0.115 },
  { hz: 540, ime: "Signature", n: 6, m: 5, meja: 0.115 },
  { hz: 963, ime: "Cosmic", n: 7, m: 8, meja: 0.108 },
];
/** Na koliko casa se vzorec zamenja. */
const FREKVENCA_S = 18;

const nakljucno = (a, b) => a + Math.random() * (b - a);
const znak = () => ZNAKI[(Math.random() * ZNAKI.length) | 0];

/**
 * Tocke, na katerih je besedilo polno.
 *
 * Bralna mreza je v lihih vrsticah zamaknjena za pol koraka, sicer tocke
 * sestavijo ocitno kvadratno resetko in napis je videti kot vezenina.
 */
function tockeBesedila(besedilo, sirinaNaVoljo, velikostPisave, gostota = GOSTOTA) {
  const platno = document.createElement("canvas");
  const ctx = platno.getContext("2d", { willReadFrequently: true });
  const pisava = (v) => `700 ${v}px "Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif`;

  // Velikost prilagodimo sirini, ki jo imamo: dolg stavek v nemscini ne sme
  // odteci cez rob, kratek v anglescini pa naj ne ostane droben.
  ctx.font = pisava(velikostPisave);
  const merilo = Math.min(1, sirinaNaVoljo / Math.max(1, ctx.measureText(besedilo).width));
  const velikost = Math.max(16, velikostPisave * merilo);

  ctx.font = pisava(velikost);
  const m = ctx.measureText(besedilo);
  const sirina = Math.ceil(m.width) + 8;
  const nad = Math.ceil(m.actualBoundingBoxAscent || velikost * 0.8);
  const pod = Math.ceil(m.actualBoundingBoxDescent || velikost * 0.25);
  const visina = nad + pod + 8;

  platno.width = sirina;
  platno.height = visina;
  ctx.font = pisava(velikost);
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(besedilo, 4, nad + 4);

  const slika = ctx.getImageData(0, 0, sirina, visina).data;
  const tocke = [];
  for (let y = 0, vrstica = 0; y < visina; y += gostota, vrstica++) {
    const zamik = vrstica % 2 ? gostota / 2 : 0;
    for (let x = zamik; x < sirina; x += gostota) {
      if (slika[((y | 0) * sirina + (x | 0)) * 4 + 3] > 128) {
        tocke.push({ x: x - sirina / 2, y: y - visina / 2 });
      }
    }
  }
  return tocke;
}

/** Tocke na vozlicnih crtah Chladnijeve figure, razporejene cez ploskev. */
function tockeFrekvence(vzorec, sirina, visina, najvec) {
  const tocke = [];
  const korak = 9;
  const { n, m, meja } = vzorec;
  for (let py = korak / 2; py < visina; py += korak) {
    for (let px = korak / 2; px < sirina; px += korak) {
      const x = px / sirina;
      const y = py / visina;
      const f =
        Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y) -
        Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y);
      if (Math.abs(f) < meja) tocke.push({ x: px, y: py });
    }
  }
  // Ce jih je prevec, jih prevzorcimo enakomerno - izrez bi pustil prazen kot.
  if (tocke.length <= najvec) return tocke;
  const izbrane = [];
  const skok = tocke.length / najvec;
  for (let i = 0; i < najvec; i++) izbrane.push(tocke[Math.floor(i * skok)]);
  return izbrane;
}

/**
 * Vsakemu znaku najblizja prosta tarca.
 *
 * Tarce jemljemo po vrsti; za vsako poiscemo najblizjega se neporabljenega
 * med danimi znaki. Pas okoli tarce rastemo, dokler v njem ni nicesar.
 */
function poveziNajblizje(delci, kandidati, tocke, sredX, sredY) {
  const zaseden = new Set();
  for (const t of tocke) {
    const cx = sredX + t.x;
    const cy = sredY + t.y;
    let najboljsi = -1;
    let najblizje = Infinity;
    for (let pas = 90; pas <= 4000 && najboljsi < 0; pas *= 3) {
      for (const i of kandidati) {
        if (zaseden.has(i)) continue;
        const d = delci[i];
        if (Math.abs(d.y - cy) > pas) continue;
        const dx = d.x - cx;
        const dy = d.y - cy;
        const r = dx * dx + dy * dy;
        if (r < najblizje) {
          najblizje = r;
          najboljsi = i;
        }
      }
    }
    if (najboljsi < 0) break;
    zaseden.add(najboljsi);
    const d = delci[najboljsi];
    d.ciljX = cx;
    d.ciljY = cy;
    d.imaCilj = true;
  }
  return zaseden;
}

/** @param {HTMLElement} gnezdo ploskev, na katero se pozdrav narise */
export function installPozdrav(gnezdo) {
  const platno = document.createElement("canvas");
  platno.className = "pozdrav-platno";
  platno.setAttribute("aria-hidden", "true");
  gnezdo.appendChild(platno);
  const ctx = platno.getContext("2d");

  const mirno = matchMedia("(prefers-reduced-motion: reduce)");

  let sirina = 1;
  let visina = 1;
  const besedni = [];   // znaki, ki sestavljajo napis
  const ozadje = [];    // znaki na Chladnijevi figuri
  const kotni = [];     // podpis v kotu

  let jezikA = 0;
  let jezikB = 0;
  let prvikrat = true;
  let menjavaOb = 0;
  let frekvencaOb = 0;
  let frekvencaKje = 0;
  let zanka = null;
  let viden = false;
  let zadnjiSek = 0;
  /** 0 = na vrhu strani, 1 = napis je odsel. Ozadje ostane. */
  let umik = 0;
  const kazalec = { x: -1e4, y: -1e4, ziv: false };

  const besedilo = () => `${DELI[0][jezikA]}, ${DELI[1][jezikB]} ${IME}`;

  function naprejJezik() {
    if (prvikrat) {
      jezikA = (jezikA + 1) % JEZIKOV;
      jezikB = jezikA;
      if (jezikA === 0) prvikrat = false;
      return;
    }
    jezikA = (jezikA + 1) % JEZIKOV;
    jezikB = (jezikB + 3) % JEZIKOV;
  }

  function meri() {
    const r = gnezdo.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    sirina = Math.max(1, Math.round(r.width));
    visina = Math.max(1, Math.round(r.height));
    platno.width = Math.round(sirina * dpr);
    platno.height = Math.round(visina * dpr);
    platno.style.width = `${sirina}px`;
    platno.style.height = `${visina}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function noviDelec(velikostA, velikostB) {
    return {
      x: nakljucno(0, sirina),
      y: nakljucno(0, visina),
      vx: 0,
      vy: 0,
      ciljX: 0,
      ciljY: 0,
      imaCilj: false,
      cakaj: 0,
      z: znak(),
      velikost: nakljucno(velikostA, velikostB),
      alfa: nakljucno(0.45, 1),
    };
  }

  function napolni(polje, koliko, a, b) {
    while (polje.length < koliko) polje.push(noviDelec(a, b));
  }

  /** Preusmeri znake besedila na novo besedilo. */
  function preusmeriBesedilo() {
    const velikost = Math.min(visina * 0.16, sirina * 0.082);
    const tocke = tockeBesedila(besedilo(), sirina * NAJVEC_SIRINE, velikost).slice(
      0,
      NAJVEC_BESEDILA
    );
    napolni(besedni, Math.min(NAJVEC_BESEDILA, Math.round(tocke.length * 1.1)), 9, 21);

    const sredX = sirina / 2;
    const sredY = visina / 2;
    for (const d of besedni) d.imaCilj = false;
    const kandidati = besedni.map((_, i) => i);
    const zaseden = poveziNajblizje(besedni, kandidati, tocke, sredX, sredY);

    for (let i = 0; i < besedni.length; i++) {
      const d = besedni[i];
      if (!zaseden.has(i)) {
        d.imaCilj = false;
        d.cakaj = 0;
        continue;
      }
      // Val z leve proti desni: zamik raste z lego tarce po vodoravnici.
      const delez = (d.ciljX - sredX) / Math.max(1, sirina * NAJVEC_SIRINE * 0.5);
      d.cakaj = ((delez + 1) / 2) * VAL_S;
      d.z = znak();
    }
  }

  /** Preusmeri znake ozadja na naslednjo figuro. */
  function preusmeriOzadje() {
    const vzorec = FREKVENCE[frekvencaKje % FREKVENCE.length];
    const tocke = tockeFrekvence(vzorec, sirina, visina, NAJVEC_OZADJA);
    napolni(ozadje, tocke.length, 6, 13);
    for (const d of ozadje) d.imaCilj = false;
    const kandidati = ozadje.map((_, i) => i);
    // Tocke figure so ze v koordinatah ploskve, zato brez zamika sredisca.
    poveziNajblizje(ozadje, kandidati, tocke, 0, 0);
    for (const d of ozadje) d.cakaj = nakljucno(0, 1.4);
  }

  /** Podpis v kotu. Stoji pri miru, zato se izracuna ob vsaki meritvi. */
  function sestaviKot() {
    kotni.length = 0;
    const tocke = tockeBesedila(KOT_NAPIS, sirina * 0.2, Math.min(40, sirina * 0.024), 6);
    let najX = 0;
    let najY = 0;
    for (const t of tocke) {
      najX = Math.max(najX, Math.abs(t.x));
      najY = Math.max(najY, Math.abs(t.y));
    }
    const x0 = 46 + najX;
    const y0 = visina - 44 - najY;
    for (const t of tocke) {
      kotni.push({ x: x0 + t.x, y: y0 + t.y, z: znak(), velikost: nakljucno(5, 9) });
    }
  }

  function korak(dt) {
    for (const polje of [besedni, ozadje]) {
      for (const d of polje) {
        if (d.cakaj > 0) {
          d.cakaj -= dt;
        } else if (d.imaCilj) {
          d.vx += (d.ciljX - d.x) * VZMET;
          d.vy += (d.ciljY - d.y) * VZMET;
        } else {
          d.vx += nakljucno(-0.05, 0.05);
          d.vy += nakljucno(-0.07, 0.03);
        }

        if (kazalec.ziv) {
          const dx = d.x - kazalec.x;
          const dy = d.y - kazalec.y;
          const r = Math.hypot(dx, dy);
          if (r < KAZALEC_R && r > 0.01) {
            const moc = (1 - r / KAZALEC_R) * KAZALEC_MOC;
            d.vx += (dx / r) * moc;
            d.vy += (dy / r) * moc;
          }
        }

        d.vx *= DUSENJE;
        d.vy *= DUSENJE;
        d.x += d.vx;
        d.y += d.vy;

        if (!d.imaCilj) {
          if (d.x < -40) d.x = sirina + 40;
          if (d.x > sirina + 40) d.x = -40;
          if (d.y < -40) d.y = visina + 40;
          if (d.y > visina + 40) d.y = -40;
        }
      }
    }
  }

  function risiPolje(polje, mnozitelj, barva) {
    if (mnozitelj <= 0.01) return;
    ctx.fillStyle = barva;
    for (const d of polje) {
      ctx.globalAlpha = (d.imaCilj ? d.alfa : d.alfa * 0.16) * mnozitelj;
      ctx.font = `${d.velikost}px "Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols 2", sans-serif`;
      ctx.fillText(d.z, d.x, d.y);
    }
  }

  function risi() {
    ctx.clearRect(0, 0, sirina, visina);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Ozadje ostane tudi ob drsenju; besedilo in podpis se umakneta.
    risiPolje(ozadje, 0.34, "#9fb6d8");
    risiPolje(besedni, 1 - umik, "#e9edf3");
    if (umik < 0.99) {
      ctx.fillStyle = "#c8d4e8";
      for (const k of kotni) {
        ctx.globalAlpha = 0.5 * (1 - umik);
        ctx.font = `${k.velikost}px "Segoe UI Symbol", "Apple Symbols", sans-serif`;
        ctx.fillText(k.z, k.x, k.y);
      }
    }
    ctx.globalAlpha = 1;
  }

  function slicica(ms) {
    zanka = requestAnimationFrame(slicica);
    const sek = ms * 0.001;
    const dt = zadnjiSek ? Math.min(sek - zadnjiSek, 0.05) : 1 / 60;
    zadnjiSek = sek;

    if (sek >= menjavaOb) {
      naprejJezik();
      preusmeriBesedilo();
      menjavaOb = sek + MIROVANJE_S + VAL_S;
    }
    if (sek >= frekvencaOb) {
      frekvencaKje += 1;
      preusmeriOzadje();
      frekvencaOb = sek + FREKVENCA_S;
    }
    korak(dt);
    risi();
  }

  const naMisko = (e) => {
    const r = gnezdo.getBoundingClientRect();
    kazalec.x = e.clientX - r.left;
    kazalec.y = e.clientY - r.top;
    kazalec.ziv = true;
  };
  const naIzhod = () => {
    kazalec.ziv = false;
  };
  const naSpremembo = () => {
    if (!viden) return;
    meri();
    sestaviKot();
    preusmeriBesedilo();
    preusmeriOzadje();
  };

  return {
    pokazi() {
      if (viden) return;
      viden = true;
      meri();
      sestaviKot();
      // Prvi napis je slovenski; ta pozdrav bere vecina, ki pride sem.
      jezikA = 0;
      jezikB = 0;
      prvikrat = true;
      preusmeriBesedilo();
      preusmeriOzadje();
      platno.classList.add("vidno");
      addEventListener("pointermove", naMisko, { passive: true });
      addEventListener("pointerleave", naIzhod, { passive: true });
      addEventListener("resize", naSpremembo);
      if (mirno.matches) {
        for (const d of [...besedni, ...ozadje]) {
          if (!d.imaCilj) continue;
          d.x = d.ciljX;
          d.y = d.ciljY;
          d.cakaj = 0;
        }
        risi();
        return;
      }
      zadnjiSek = 0;
      const zdaj = performance.now() * 0.001;
      menjavaOb = zdaj + MIROVANJE_S + VAL_S;
      frekvencaOb = zdaj + FREKVENCA_S;
      zanka = requestAnimationFrame(slicica);
    },
    /** @param {number} p 0 na vrhu strani, 1 ko je napis odsel */
    nastaviUmik(p) {
      umik = Math.max(0, Math.min(p, 1));
    },
    skrij() {
      if (!viden) return;
      viden = false;
      platno.classList.remove("vidno");
      if (zanka) cancelAnimationFrame(zanka);
      zanka = null;
      removeEventListener("pointermove", naMisko);
      removeEventListener("pointerleave", naIzhod);
      removeEventListener("resize", naSpremembo);
    },
  };
}
