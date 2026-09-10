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
 * Znaki so dveh vrst in zato na dveh platnih. Prvi sestavljajo besedilo in
 * lezijo na platnu, ki je navaden element v toku - z drsenjem gre gor kot vse
 * drugo. Drugi lezijo na Chladnijevih figurah, vzorcih, ki jih na plosci
 * nariše stojece valovanje pri dani frekvenci; njihovo platno miruje pod celo
 * stranjo, zato ozadje ostane, ko besedilo odide.
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
 * Pisava pozdrava.
 *
 * Okrasna, ne sistemska: pozdrav je edino mesto na strani, kjer crke niso
 * obvestilo, ampak podoba. Rezervna je sistemska, ce se datoteka ne nalozi -
 * takrat je napis manj lep, a se vedno tam.
 */
const PISAVA = '"Pozdrav", "Segoe UI Variable Display", "Segoe UI", system-ui, serif';

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

/**
 * Razmik med tarcami.
 *
 * Drobnejsi od velikosti znakov, zato se ti rahlo prekrivajo - in prav to je
 * potrebno, da se vidi oblika pisave. Pri redki mrezi ostanejo od okrasnih
 * serifov le posamezne pike in napis je videti kot katerikoli drug.
 */
const GOSTOTA = 10;
/** Zgornja meja stevila znakov v besedilu in v ozadju. */
const NAJVEC_BESEDILA = 2300;
const NAJVEC_OZADJA = 620;
/** Koliko sirine sme zavzeti napis. */
const NAJVEC_SIRINE = 0.82;
/** Razmik med vrsticama, kot delez visine crk. */
const VRSTICA = 1.12;

/**
 * Razmik med crkami, kot delez velikosti pisave.
 *
 * Gotska pisava je sama po sebi zbita - crke se skoraj dotikajo. Ko je vsaka
 * sestavljena iz posameznih znakov, se sosednje zlijejo in napisa ni mogoce
 * brati. Zato jih razmaknemo.
 *
 * Razmik risemo sami, crko za crko, in ne prek ctx.letterSpacing: tega starejsi
 * brskalniki ne poznajo in bi ga tiho prezrli, napis pa bi ostal zbit.
 */
const RAZMIK = 0.17;

/**
 * Raztezek crk po sirini.
 *
 * Gotska pisava je ozka in visoka - crke stojijo kot resetke. Raztegnjene po
 * sirini izgubijo to pokoncnost in se priblizajo predlogi, ki je bila siroka
 * in polozena. Raztezemo ob izrisu na pomozno platno, zato so tocke ze v
 * pravih legah in vzmet nima s tem nobenega dela.
 */
const SIRJENJE = 1.45;

/** Kako mocno znak vlece proti tarci in koliko ga dusi. */
const VZMET = 0.055;
const DUSENJE = 0.86;

/**
 * Odboj ob drsenju.
 *
 * Ob vsakem zasuku kolesca znaki dobijo sunek navzdol - ne premika se platno,
 * ampak znaki na njem. Vzmet, ki jih drzi na crkah, jih nato potegne nazaj in
 * pri tem malo prenese cez, zato se napis pozibava kot nekaj obesenega, ne kot
 * slika, ki bi drsela.
 *
 * Sunek je omejen: hitro drsenje sicer razmece napis cez pol zaslona.
 */
const ODBOJ = 0.055;
const ODBOJ_NAJVEC = 13;

/** Kazalec odriva znake. Polmer v pikah in moc odriva. */
const KAZALEC_R = 150;
const KAZALEC_MOC = 2.6;

/**
 * Blescanje.
 *
 * Znaki v mirovanju ne gorijo s polno mocjo, ampak pri OSNOVNA_ALFA; vsak
 * zase pa vsake toliko casa za hip zasveti in ugasne. Ker so casi nakljucni in
 * za vsak znak svoji, napis ni videti kot utripajoca luc, ampak kot nekaj, kar
 * se iskri - kot zvezde, ki jih napis prekriva.
 */
const OSNOVNA_ALFA = 0.6;
const BLESK_NAJKRAJ_S = 2.2;
const BLESK_NAJDLJE_S = 11;
/** Kolikokrat na sekundo sij upade na desetino. Visje = kratek blisk. */
const BLESK_UPAD = 0.055;

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
 * Sprejme eno vrstico ali vec. Vec vrstic je tu bistvenih: pozdrav v eni
 * vrstici mora biti drobcen, da gre cez zaslon, v dveh pa so crke lahko
 * dvakrat vecje - in sele takrat se vidi, kaksna je pisava.
 *
 * Bralna mreza je v lihih vrsticah zamaknjena za pol koraka, sicer tocke
 * sestavijo ocitno kvadratno resetko in napis je videti kot vezenina.
 */
/** Sirina besedila, ko so crke razmaknjene in raztegnjene. */
function sirinaRazmaknjena(ctx, besedilo, velikost) {
  const razmik = velikost * RAZMIK;
  let sirina = 0;
  for (const c of besedilo) sirina += ctx.measureText(c).width + razmik;
  return Math.max(0, sirina - razmik) * SIRJENJE;
}

/** Izris crko za crko z razmikom. Vrne skupno sirino. */
function narisiRazmaknjeno(ctx, besedilo, x, y, velikost) {
  const razmik = velikost * RAZMIK;
  let kje = x;
  for (const c of besedilo) {
    ctx.fillText(c, kje, y);
    kje += ctx.measureText(c).width + razmik;
  }
  return Math.max(0, kje - x - razmik);
}

function tockeBesedila(vrstice, sirinaNaVoljo, velikostPisave, gostota = GOSTOTA) {
  const seznam = Array.isArray(vrstice) ? vrstice : [vrstice];
  if (seznam.length > 1) return tockeVecVrstic(seznam, sirinaNaVoljo, velikostPisave, gostota);
  const besedilo = seznam[0];
  const platno = document.createElement("canvas");
  const ctx = platno.getContext("2d", { willReadFrequently: true });
  const pisava = (v) => `400 ${v}px ${PISAVA}`;

  // Velikost prilagodimo sirini, ki jo imamo: dolg stavek v nemscini ne sme
  // odteci cez rob, kratek v anglescini pa naj ne ostane droben.
  ctx.font = pisava(velikostPisave);
  const merilo = Math.min(
    1,
    sirinaNaVoljo / Math.max(1, sirinaRazmaknjena(ctx, besedilo, velikostPisave))
  );
  const velikost = Math.max(16, velikostPisave * merilo);

  ctx.font = pisava(velikost);
  const m = ctx.measureText(besedilo);
  const sirina = Math.ceil(sirinaRazmaknjena(ctx, besedilo, velikost)) + 8;
  const nad = Math.ceil(m.actualBoundingBoxAscent || velikost * 0.8);
  const pod = Math.ceil(m.actualBoundingBoxDescent || velikost * 0.25);
  const visina = nad + pod + 8;

  platno.width = sirina;
  platno.height = visina;
  ctx.font = pisava(velikost);
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "alphabetic";
  // Raztezek dosezemo z merilom platna, ne s prilagojeno pisavo: pisava
  // razlicnih sirin nima, prilagojena pa bi izgubila obliko potez.
  ctx.save();
  ctx.scale(SIRJENJE, 1);
  narisiRazmaknjeno(ctx, besedilo, 4 / SIRJENJE, nad + 4, velikost);
  ctx.restore();

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

/**
 * Vec vrstic, poravnanih na sredino in zlozenih ena pod drugo.
 *
 * Velikost doloci najsirsa vrstica: ce bi vsaka dobila svojo, bi bile crke v
 * kratki vrstici vecje od crk v dolgi in napis bi razpadel na dva napisa.
 */
function tockeVecVrstic(vrstice, sirinaNaVoljo, velikostPisave, gostota) {
  const merilno = document.createElement("canvas").getContext("2d");
  merilno.font = `400 ${velikostPisave}px ${PISAVA}`;
  const najsirsa = Math.max(
    ...vrstice.map((v) => sirinaRazmaknjena(merilno, v, velikostPisave))
  );
  const merilo = Math.min(1, sirinaNaVoljo / Math.max(1, najsirsa));
  const velikost = Math.max(16, velikostPisave * merilo);

  const posamezne = vrstice.map((v) => tockeBesedila(v, Infinity, velikost, gostota));
  const visina = velikost * VRSTICA;
  const zamik = ((vrstice.length - 1) * visina) / 2;

  const tocke = [];
  posamezne.forEach((del, i) => {
    for (const t of del) tocke.push({ x: t.x, y: t.y + i * visina - zamik });
  });
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

/**
 * @param {HTMLElement} gnezdoOzadja platno pod celo stranjo, ki miruje
 * @param {HTMLElement} gnezdoBesedila platno prvega zaslona, ki drsi z njim
 */
export function installPozdrav(gnezdoOzadja, gnezdoBesedila) {
  const platnoO = document.createElement("canvas");
  platnoO.className = "pozdrav-ozadje";
  platnoO.setAttribute("aria-hidden", "true");
  gnezdoOzadja.appendChild(platnoO);
  const ctxO = platnoO.getContext("2d");

  const platnoB = document.createElement("canvas");
  platnoB.className = "pozdrav-besedilo";
  platnoB.setAttribute("aria-hidden", "true");
  gnezdoBesedila.appendChild(platnoB);
  const ctxB = platnoB.getContext("2d");

  const mirno = matchMedia("(prefers-reduced-motion: reduce)");

  // Vsako platno ima svoje mere: ozadje pokriva celo stran, besedilo en zaslon.
  const mereO = { s: 1, v: 1 };
  const mereB = { s: 1, v: 1 };

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
  const kazalec = { x: -1e4, y: -1e4, ziv: false };

  // Dve vrstici: pozdrav zgoraj, ime spodaj. V eni vrstici bi bile crke
  // pretesne, da bi se videla pisava.
  const besedilo = () => [`${DELI[0][jezikA]}, ${DELI[1][jezikB]}`, IME];

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

  function meriPlatno(platno, ctx, gnezdo, mere) {
    const r = gnezdo.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    mere.s = Math.max(1, Math.round(r.width));
    mere.v = Math.max(1, Math.round(r.height));
    platno.width = Math.round(mere.s * dpr);
    platno.height = Math.round(mere.v * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const meri = () => {
    meriPlatno(platnoO, ctxO, gnezdoOzadja, mereO);
    meriPlatno(platnoB, ctxB, gnezdoBesedila, mereB);
  };

  function noviDelec(mere, najmanj, najvec) {
    return {
      x: nakljucno(0, mere.s),
      y: nakljucno(0, mere.v),
      vx: 0,
      vy: 0,
      ciljX: 0,
      ciljY: 0,
      imaCilj: false,
      cakaj: 0,
      z: znak(),
      velikost: nakljucno(najmanj, najvec),
      alfa: nakljucno(0.45, 1),
      sij: 0,
      // Cas je absoluten, zato ga postavimo od zdaj naprej - sicer bi bili vsi
      // znaki ze "zapadli" in bi ob prvi slicici zasvetili hkrati.
      sijOb: performance.now() * 0.001 + nakljucno(0, BLESK_NAJDLJE_S),
    };
  }

  const napolni = (polje, koliko, mere, najmanj, najvec) => {
    while (polje.length < koliko) polje.push(noviDelec(mere, najmanj, najvec));
  };

  /** Preusmeri znake besedila na novo besedilo. */
  function preusmeriBesedilo() {
    // Visino delimo med obe vrstici in pustimo rob: pri 0,3 je spodnja vrstica
    // s podaljski crk segala cez spodnji rob platna.
    const velikost = Math.min(mereB.v * 0.24, mereB.s * 0.155);
    const tocke = tockeBesedila(besedilo(), mereB.s * NAJVEC_SIRINE, velikost).slice(
      0,
      NAJVEC_BESEDILA
    );
    napolni(besedni, Math.min(NAJVEC_BESEDILA, Math.round(tocke.length * 1.08)), mereB, 7, 16);

    const sredX = mereB.s / 2;
    const sredY = mereB.v / 2;
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
      const delez = (d.ciljX - sredX) / Math.max(1, mereB.s * NAJVEC_SIRINE * 0.5);
      d.cakaj = ((delez + 1) / 2) * VAL_S;
      d.z = znak();
    }
  }

  /** Preusmeri znake ozadja na naslednjo figuro. */
  function preusmeriOzadje() {
    const vzorec = FREKVENCE[frekvencaKje % FREKVENCE.length];
    const tocke = tockeFrekvence(vzorec, mereO.s, mereO.v, NAJVEC_OZADJA);
    napolni(ozadje, tocke.length, mereO, 6, 13);
    for (const d of ozadje) d.imaCilj = false;
    // Tocke figure so ze v koordinatah ploskve, zato brez zamika sredisca.
    poveziNajblizje(ozadje, ozadje.map((_, i) => i), tocke, 0, 0);
    for (const d of ozadje) d.cakaj = nakljucno(0, 1.4);
  }

  /** Podpis v kotu prvega zaslona. Stoji pri miru, zato le ob meritvi. */
  function sestaviKot() {
    kotni.length = 0;
    const tocke = tockeBesedila(KOT_NAPIS, mereB.s * 0.2, Math.min(40, mereB.s * 0.024), 6);
    let najX = 0;
    let najY = 0;
    for (const t of tocke) {
      najX = Math.max(najX, Math.abs(t.x));
      najY = Math.max(najY, Math.abs(t.y));
    }
    const x0 = 46 + najX;
    const y0 = mereB.v - 44 - najY;
    for (const t of tocke) {
      kotni.push({ x: x0 + t.x, y: y0 + t.y, z: znak(), velikost: nakljucno(5, 9) });
    }
  }

  function korakPolja(polje, mere, dt, lok, sek) {
    for (const d of polje) {
      // Blescanje. Sij pade proti nic; ko pride cas, spet skoci na polno.
      d.sij *= Math.pow(BLESK_UPAD, dt);
      if (sek >= d.sijOb) {
        d.sij = 1;
        d.sijOb = sek + nakljucno(BLESK_NAJKRAJ_S, BLESK_NAJDLJE_S);
      }

      if (d.cakaj > 0) {
        d.cakaj -= dt;
      } else if (d.imaCilj) {
        d.vx += (d.ciljX - d.x) * VZMET;
        d.vy += (d.ciljY - d.y) * VZMET;
      } else {
        d.vx += nakljucno(-0.05, 0.05);
        d.vy += nakljucno(-0.07, 0.03);
      }

      if (lok.ziv) {
        const dx = d.x - lok.x;
        const dy = d.y - lok.y;
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
        if (d.x < -40) d.x = mere.s + 40;
        if (d.x > mere.s + 40) d.x = -40;
        if (d.y < -40) d.y = mere.v + 40;
        if (d.y > mere.v + 40) d.y = -40;
      }
    }
  }

  function risiPolje(ctx, polje, mnozitelj, barva) {
    ctx.fillStyle = barva;
    for (const d of polje) {
      // Osnovna moc plus tisto, kar prispeva blisk: 0,6 v mirovanju, 1 na vrhu.
      const moc = OSNOVNA_ALFA + (1 - OSNOVNA_ALFA) * d.sij;
      ctx.globalAlpha = (d.imaCilj ? d.alfa * moc : d.alfa * 0.16) * mnozitelj;
      ctx.font = `${d.velikost}px "Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols 2", sans-serif`;
      ctx.fillText(d.z, d.x, d.y);
    }
    ctx.globalAlpha = 1;
  }

  function risi() {
    ctxO.clearRect(0, 0, mereO.s, mereO.v);
    ctxO.textAlign = "center";
    ctxO.textBaseline = "middle";
    risiPolje(ctxO, ozadje, 0.34, "#9fb6d8");

    ctxB.clearRect(0, 0, mereB.s, mereB.v);
    ctxB.textAlign = "center";
    ctxB.textBaseline = "middle";
    risiPolje(ctxB, besedni, 1, "#e9edf3");
    ctxB.fillStyle = "#c8d4e8";
    for (const k of kotni) {
      ctxB.globalAlpha = 0.5;
      ctxB.font = `${k.velikost}px "Segoe UI Symbol", "Apple Symbols", sans-serif`;
      ctxB.fillText(k.z, k.x, k.y);
    }
    ctxB.globalAlpha = 1;
  }

  /** Kazalec je za vsako platno svoj, ker platni ne lezita na istem mestu. */
  const kazalecZa = (gnezdo) => {
    if (!kazalec.ziv) return { ziv: false, x: 0, y: 0 };
    const r = gnezdo.getBoundingClientRect();
    return { ziv: true, x: kazalec.x - r.left, y: kazalec.y - r.top };
  };

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
    korakPolja(besedni, mereB, dt, kazalecZa(gnezdoBesedila), sek);
    korakPolja(ozadje, mereO, dt, kazalecZa(gnezdoOzadja), sek);
    risi();
  }

  const naMisko = (e) => {
    kazalec.x = e.clientX;
    kazalec.y = e.clientY;
    kazalec.ziv = true;
  };
  const naIzhod = () => {
    kazalec.ziv = false;
  };
  /**
   * Sunek ob drsenju.
   *
   * Dobijo ga samo znaki besedila. Ozadje s frekvencami miruje pod stranjo in
   * z drsenjem nima opravka; ce bi poskocilo tudi to, bi bilo videti, kot da
   * se trese cel zaslon.
   */
  const sunek = (dy) => {
    const moc = Math.max(-ODBOJ_NAJVEC, Math.min(dy * ODBOJ, ODBOJ_NAJVEC));
    for (const d of besedni) d.vy += moc;
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
      // Prvi napis je slovenski; ta pozdrav bere vecina, ki pride sem.
      jezikA = 0;
      jezikB = 0;
      prvikrat = true;
      preusmeriOzadje();

      // Oblike crk merimo sele, ko je pisava tu. Prej bi jih narisala
      // sistemska in napis bi ob prihodu okrasne poskocil.
      const pripravljena = document.fonts
        ? document.fonts.load('400 100px "Pozdrav"').catch(() => null)
        : Promise.resolve(null);

      pripravljena.then(() => {
        if (!viden) return;
        sestaviKot();
        preusmeriBesedilo();
        platnoO.classList.add("vidno");
        platnoB.classList.add("vidno");
        if (!mirno.matches) return;
        for (const d of besedni.concat(ozadje)) {
          if (!d.imaCilj) continue;
          d.x = d.ciljX;
          d.y = d.ciljY;
          d.cakaj = 0;
        }
        risi();
      });

      addEventListener("pointermove", naMisko, { passive: true });
      addEventListener("pointerleave", naIzhod, { passive: true });
      addEventListener("resize", naSpremembo);
      if (mirno.matches) return;

      zadnjiSek = 0;
      const zdaj = performance.now() * 0.001;
      menjavaOb = zdaj + MIROVANJE_S + VAL_S;
      frekvencaOb = zdaj + FREKVENCA_S;
      zanka = requestAnimationFrame(slicica);
    },
    sunek,
    skrij() {
      if (!viden) return;
      viden = false;
      platnoO.classList.remove("vidno");
      platnoB.classList.remove("vidno");
      if (zanka) cancelAnimationFrame(zanka);
      zanka = null;
      removeEventListener("pointermove", naMisko);
      removeEventListener("pointerleave", naIzhod);
      removeEventListener("resize", naSpremembo);
    },
  };
}
