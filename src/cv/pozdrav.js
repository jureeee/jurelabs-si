/**
 * Pozdrav - besedilo, sestavljeno iz znakov, ki se prelivajo skozi jezike.
 *
 * Kako nastane oblika: besedilo izrisemo na pomozno platno, ga preberemo po
 * mrezi in vsaka polna tocka postane tarca. S tem oblike ne opisuje noben
 * seznam koordinat - crke pride iz pisave, torej so pravilne v vsakem jeziku,
 * s sumniki vred. Atlas znakov ni potreben.
 *
 * Ob menjavi jezika vsak znak dobi PROSTORSKO NAJBLIZJO prosto tarco, ne
 * tarce z isto zaporedno stevilko. Zato znaki ne odletijo cez cel napis, ampak
 * se premaknejo za nekaj crk - in menjava se bere kot preliv, ne kot skok.
 *
 * Zamik potovanja raste z lego po vodoravnici, zato menjava tece kot val z
 * leve proti desni.
 *
 * Znakov je vec kot tarc. Odvecni ne izginejo: odplavajo v ozadje in cakajo,
 * saj bo naslednje besedilo morda daljse. Prazen zaslon med jeziki bi bil
 * videti kot napaka.
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
 * Namenoma niso pike. Pika je prah, znak je pisava - in ravno to je bila
 * poanta: napis iz znakov, ki so sami po sebi znaki.
 */
const ZNAKI = "01·+×/\\|-—=<>[]{}()*^~:;.,'\"!?abcdefghijklmnoprstuvzABCDEFGHIJKLMNOPRSTUVZ";

/** Koliko casa napis miruje, preden se zacne prelivati v naslednji jezik. */
const MIROVANJE_S = 6.5;
/** Koliko traja preliv od zacetka prvega znaka do prihoda zadnjega. */
const VAL_S = 1.9;

/**
 * Kje na ploskvi stoji napis in koliko sirine sme zavzeti.
 *
 * Ne na sredini: sredina pripada besedilu strani. Pozdrav lezi pod njim, v
 * spodnji tretjini, in je zato ozadje - ne tekmec za isto mesto.
 */
const LEGA_Y = 0.74;
const NAJVEC_SIRINE = 0.72;

/** Razmik med tarcami v slikovnih pikah. Nizje = gostejsi in tezji napis. */
const GOSTOTA = 7;
/** Zgornja meja stevila delcev. Cez to gre risanje pocasi, videz pa ne boljsi. */
const NAJVEC_DELCEV = 1500;

/** Kako mocno znak vlece proti tarci in koliko ga dusi. */
const VZMET = 0.055;
const DUSENJE = 0.86;

/** Kazalec odriva znake. Polmer v pikah in moc odriva. */
const KAZALEC_R = 150;
const KAZALEC_MOC = 2.6;

const nakljucno = (a, b) => a + Math.random() * (b - a);
const znak = () => ZNAKI[(Math.random() * ZNAKI.length) | 0];

/**
 * Tocke, na katerih je besedilo polno.
 *
 * Besedilo narisemo na pomozno platno in ga preberemo po mrezi. Bralna mreza
 * je zamaknjena za pol koraka v lihih vrsticah, sicer tocke sestavijo ocitno
 * kvadratno resetko in napis je videti kot vezenina.
 *
 * @returns {{x: number, y: number}[]}
 */
function tockeBesedila(besedilo, sirinaNaVoljo, velikostPisave) {
  const platno = document.createElement("canvas");
  const ctx = platno.getContext("2d", { willReadFrequently: true });
  const pisava = (v) => `700 ${v}px "Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif`;

  // Velikost prilagodimo sirini, ki jo imamo: dolg stavek v nemscini ne sme
  // odteci cez rob, kratek v anglescini pa naj ne ostane droben.
  ctx.font = pisava(velikostPisave);
  const izmerjena = ctx.measureText(besedilo).width;
  const merilo = Math.min(1, sirinaNaVoljo / Math.max(1, izmerjena));
  const velikost = Math.max(18, velikostPisave * merilo);

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
  for (let y = 0, vrstica = 0; y < visina; y += GOSTOTA, vrstica++) {
    const zamik = vrstica % 2 ? GOSTOTA / 2 : 0;
    for (let x = zamik; x < sirina; x += GOSTOTA) {
      if (slika[((y | 0) * sirina + (x | 0)) * 4 + 3] > 128) {
        tocke.push({ x: x - sirina / 2, y: y - visina / 2 });
      }
    }
  }
  return tocke;
}

/**
 * Vsakemu znaku najblizja prosta tarca.
 *
 * Tarce jemljemo po vrsti od leve; za vsako poiscemo najblizji se neporabljen
 * znak. Iskanje je omejeno na tiste, ki so v navpicnem pasu okoli tarce, zato
 * ne pregledamo vseh - pri tisocih tarcah bi bilo to milijon primerjav ob
 * vsaki menjavi jezika.
 */
function poveziNajblizje(delci, tocke, sredX, sredY) {
  const prosti = delci.map((_, i) => i);
  const zaseden = new Uint8Array(delci.length);

  for (const t of tocke) {
    const cx = sredX + t.x;
    const cy = sredY + t.y;

    let najboljsi = -1;
    let najblizje = Infinity;
    // Pas rastemo, dokler v njem ni nicesar prostega.
    for (let pas = 90; pas <= 4000 && najboljsi < 0; pas *= 3) {
      for (const i of prosti) {
        if (zaseden[i]) continue;
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
    zaseden[najboljsi] = 1;
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
  let dpr = 1;
  const delci = [];
  const kotni = [];

  let jezikA = 0;
  let jezikB = 0;
  let prvikrat = true;
  let menjavaOb = 0;
  let zanka = null;
  let viden = false;
  let zadnjiSek = 0;
  const kazalec = { x: -1e4, y: -1e4, ziv: false };

  function besedilo() {
    return `${DELI[0][jezikA]}, ${DELI[1][jezikB]} ${IME}`;
  }

  /**
   * Naslednji jezik.
   *
   * Prvi krog gre po vrsti, oba dela iz istega jezika. Ko je krog sklenjen, se
   * dela premikata razlicno hitro in se zato mesata.
   */
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
    dpr = Math.min(devicePixelRatio || 1, 2);
    sirina = Math.max(1, Math.round(r.width));
    visina = Math.max(1, Math.round(r.height));
    platno.width = Math.round(sirina * dpr);
    platno.height = Math.round(visina * dpr);
    platno.style.width = `${sirina}px`;
    platno.style.height = `${visina}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function ustvariDelce(koliko) {
    while (delci.length < koliko) {
      delci.push({
        x: nakljucno(0, sirina),
        y: nakljucno(0, visina),
        vx: 0,
        vy: 0,
        ciljX: 0,
        ciljY: 0,
        imaCilj: false,
        cakaj: 0,
        z: znak(),
        velikost: nakljucno(7, 12),
        alfa: nakljucno(0.35, 0.9),
      });
    }
  }

  /** Preusmeri znake na novo besedilo. */
  function preusmeri() {
    const velikost = Math.min(visina * 0.11, sirina * 0.055);
    const tocke = tockeBesedila(besedilo(), sirina * NAJVEC_SIRINE, velikost).slice(
      0,
      NAJVEC_DELCEV
    );
    ustvariDelce(Math.min(NAJVEC_DELCEV, Math.round(tocke.length * 1.12)));

    const sredX = sirina / 2;
    const sredY = visina * LEGA_Y;
    for (const d of delci) d.imaCilj = false;
    const zaseden = poveziNajblizje(delci, tocke, sredX, sredY);

    // Val: zamik po legi tarce. Racunamo ga sele tu, ker sele zdaj vemo,
    // katera tarca je cigava.
    for (const d of delci) {
      if (d.imaCilj) {
        const delez = (d.ciljX - sredX) / Math.max(1, sirina * NAJVEC_SIRINE * 0.5);
        d.cakaj = ((delez + 1) / 2) * VAL_S;
        // Ob menjavi znak zamenja tudi svojo crko - napis se prelije tudi po
        // vsebini, ne le po legi.
        d.z = znak();
      } else {
        d.cakaj = 0;
      }
    }
    for (let i = 0; i < delci.length; i++) if (!zaseden[i]) delci[i].imaCilj = false;
  }

  function korak(dt) {
    for (const d of delci) {
      if (d.cakaj > 0) {
        d.cakaj -= dt;
      } else if (d.imaCilj) {
        d.vx += (d.ciljX - d.x) * VZMET;
        d.vy += (d.ciljY - d.y) * VZMET;
      } else {
        // Brez tarce znak lenobno plava. Rahel nagib navzgor, da se ne useda
        // na dno kot prah.
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

      // Znaki brez tarce se ob robu zavijejo nazaj, da ne odplavajo za vedno.
      if (!d.imaCilj) {
        if (d.x < -40) d.x = sirina + 40;
        if (d.x > sirina + 40) d.x = -40;
        if (d.y < -40) d.y = visina + 40;
        if (d.y > visina + 40) d.y = -40;
      }
    }
  }

  function risi() {
    ctx.clearRect(0, 0, sirina, visina);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const d of delci) {
      // Znak brez tarce je bledejsi: oko naj lovi napis, ne ozadja.
      ctx.globalAlpha = d.imaCilj ? d.alfa : d.alfa * 0.16;
      ctx.font = `${d.velikost}px ui-monospace, "Cascadia Mono", Consolas, monospace`;
      ctx.fillStyle = "#e9edf3";
      ctx.fillText(d.z, d.x, d.y);
    }
    for (const k of kotni) {
      ctx.globalAlpha = 0.5;
      ctx.font = `${k.velikost}px ui-monospace, "Cascadia Mono", Consolas, monospace`;
      ctx.fillStyle = "#c8d4e8";
      ctx.fillText(k.z, k.x, k.y);
    }
    ctx.globalAlpha = 1;
  }

  /** Podpis v kotu. Stoji pri miru, zato se izracuna enkrat ob meritvi. */
  function sestaviKot() {
    kotni.length = 0;
    // Spodaj levo in ne desno: desni kot pripada doku z iskanjem in
    // nastavitvami, in podpis bi mu lezal pod gumbi.
    const tocke = tockeBesedila(KOT_NAPIS, sirina * 0.2, Math.min(40, sirina * 0.024));
    let najX = 0;
    for (const t of tocke) najX = Math.max(najX, Math.abs(t.x));
    const x0 = 52 + najX;
    const y0 = visina - 54;
    for (const t of tocke) {
      kotni.push({ x: x0 + t.x, y: y0 + t.y, z: znak(), velikost: nakljucno(5, 8) });
    }
  }

  function slicica(ms) {
    zanka = requestAnimationFrame(slicica);
    const sek = ms * 0.001;
    // Dolge premore po vrnitvi na zavihek odrezemo, sicer znaki poskocijo.
    const dt = zadnjiSek ? Math.min(sek - zadnjiSek, 0.05) : 1 / 60;
    zadnjiSek = sek;

    if (sek >= menjavaOb) {
      naprejJezik();
      preusmeri();
      menjavaOb = sek + MIROVANJE_S + VAL_S;
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
    preusmeri();
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
      preusmeri();
      platno.classList.add("vidno");
      addEventListener("pointermove", naMisko, { passive: true });
      addEventListener("pointerleave", naIzhod, { passive: true });
      addEventListener("resize", naSpremembo);
      if (mirno.matches) {
        // Brez gibanja: znake postavimo na tarce in narisemo enkrat.
        for (const d of delci) {
          if (!d.imaCilj) continue;
          d.x = d.ciljX;
          d.y = d.ciljY;
          d.cakaj = 0;
        }
        risi();
        return;
      }
      zadnjiSek = 0;
      // Prvi napis je ze postavljen, zato se odstevanje zacne zdaj.
      menjavaOb = performance.now() * 0.001 + MIROVANJE_S + VAL_S;
      zanka = requestAnimationFrame(slicica);
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
