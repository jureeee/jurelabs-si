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

/**
 * Okrasa: metulj in krona.
 *
 * Nista sliki, ampak predlogi. Narisemo ju na pomozno platno, preberemo po
 * mrezi in vsaka polna tocka postane tarca za znak - natanko tako kot crke.
 * Zato sta iz istih zvezd in srckov kot napis in ne tujek na strani.
 *
 * Risana sta s POTEZAMI in ne s ploskvami, in to je bistveno. Prva razlicica
 * je bila polna: krila kot zapolnjene peruti, krona kot zapolnjen lok s
 * cepinami. Ko mreza pobere polno ploskev, dobi pravokotnik enakomernih tock -
 * packo brez oblike. Predlogi sta zracni, sestavljeni iz tankih ukrivljenih
 * potez z veliko praznine med njimi, in prav praznina je tisto, kar oko bere
 * kot risbo.
 *
 * Risba je nasa in ne prevzeta: predloge so tuje avtorsko delo, tu pa je
 * oblika, ki lovi njihovo misel.
 */

/** Poteze so povsod enake: bele, okroglih koncev, brez zapolnitve. */
const POTEZA = 'stroke="#fff" fill="none" stroke-linecap="round" stroke-linejoin="round"';

/**
 * Metulj.
 *
 * Razmerja so tu vse. Prva risba je imela krila razprta vodoravno in metulj je
 * bil videti kot zvezda; na predlogi pa krila STRMO POLETIJO NAVZGOR in je
 * cela zival visja kot sirsa. Zgornji perut je zato dolg in ozek in se konca
 * skoraj nad telesom, spodnji pa je majhen in visi pod njim.
 *
 * Zilice tecejo po dolzini peruti in ne zvezdasto iz telesa: v predlogi so
 * vzporedne s krilom, zato ga podpirajo, namesto da bi ga razbijale.
 *
 * Plameni so pripeti na zunanji rob in gredo v isto smer kot krilo - navzgor
 * in navzven. Plamen, ki bi sel prek krila, bi obris zabrisal.
 */
const METULJ = (() => {
  const polovica = `
    <path d="M 6 -6 C 26 -70 46 -132 74 -178 C 92 -160 102 -122 106 -84
             C 112 -56 104 -34 84 -20 C 56 -8 26 -4 9 3 Z"
          stroke-width="6" ${POTEZA} />
    <path d="M 9 10 C 34 16 58 34 66 58 C 70 82 58 100 42 108
             C 26 100 14 66 8 28 Z"
          stroke-width="6" ${POTEZA} />

    <path d="M 12 -8 C 30 -62 48 -116 70 -166" stroke-width="4" ${POTEZA} />
    <path d="M 16 -6 C 40 -54 66 -92 96 -122" stroke-width="4" ${POTEZA} />
    <path d="M 20 -2 C 48 -30 76 -50 104 -66" stroke-width="4" ${POTEZA} />
    <path d="M 14 20 C 32 36 48 54 60 74" stroke-width="4" ${POTEZA} />
    <path d="M 12 32 C 24 56 32 80 40 104" stroke-width="4" ${POTEZA} />

    <path d="M 74 -178 C 80 -202 74 -218 58 -226" stroke-width="5" ${POTEZA} />
    <path d="M 92 -150 C 104 -168 104 -184 94 -196" stroke-width="4" ${POTEZA} />
    <path d="M 106 -84 C 126 -92 138 -82 140 -64" stroke-width="5" ${POTEZA} />
    <path d="M 104 -40 C 124 -34 132 -18 124 -2" stroke-width="4" ${POTEZA} />
    <path d="M 66 58 C 84 66 88 82 78 94" stroke-width="5" ${POTEZA} />
    <path d="M 42 108 C 46 130 38 144 22 150" stroke-width="4" ${POTEZA} />`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-150 -240 300 420">` +
    `<g>${polovica}</g><g transform="scale(-1 1)">${polovica}</g>` +
    `<path d="M 0 -34 C 5 -10 6 46 0 104 C -6 46 -5 -10 0 -34 Z" stroke-width="5" ${POTEZA} />` +
    `<path d="M -3 -44 C -18 -76 -30 -92 -46 -100" stroke-width="4" ${POTEZA} />` +
    `<path d="M 3 -44 C 18 -76 30 -92 46 -100" stroke-width="4" ${POTEZA} />` +
    `</svg>`
  );
})();

/**
 * Krona.
 *
 * Trnaste konice, ki se proti vrhu upognejo navzven, in dvojni lok pod njimi.
 * Vsaka konica ima ob sebi kratko brado - brez nje bi bila palica, z njo je
 * trn. Konice so tanke poteze, ne zapolnjeni klini: predloga je kovana in
 * predrta, ne ulita.
 */
const KRONA = (() => {
  const deli = [];
  for (let i = 0; i < 7; i++) {
    const d = (i - 3) / 3;                     // -1 levo, 0 sredina, 1 desno
    const x = d * 82;
    const visina = 128 - Math.abs(d) * 54;
    const upogib = d * 42;                     // konica se odkloni navzven
    const vrhX = x + upogib;
    const vrhY = 34 - visina;
    deli.push(
      `<path d="M ${x.toFixed(1)} 40 C ${(x + upogib * 0.25).toFixed(1)} ${(
        34 - visina * 0.5
      ).toFixed(1)} ${(vrhX - upogib * 0.35).toFixed(1)} ${(vrhY + visina * 0.22).toFixed(
        1
      )} ${vrhX.toFixed(1)} ${vrhY.toFixed(1)}" stroke-width="6" ${POTEZA} />`
    );
    // Brada: kratka veja, ki se od konice odcepi navzdol in navzven.
    const bradaY = vrhY + visina * 0.42;
    deli.push(
      `<path d="M ${(x + upogib * 0.4).toFixed(1)} ${bradaY.toFixed(1)} C ${(
        x + upogib * 0.4 + Math.sign(d || 1) * 20
      ).toFixed(1)} ${(bradaY + 6).toFixed(1)} ${(x + upogib * 0.4 + Math.sign(d || 1) * 30).toFixed(
        1
      )} ${(bradaY + 26).toFixed(1)} ${(x + upogib * 0.4 + Math.sign(d || 1) * 26).toFixed(1)} ${(
        bradaY + 40
      ).toFixed(1)}" stroke-width="4" ${POTEZA} />`
    );
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-150 -110 300 210">` +
    deli.join("") +
    `<path d="M -104 40 C -52 62 52 62 104 40" stroke-width="7" ${POTEZA} />` +
    `<path d="M -100 66 C -50 88 50 88 100 66" stroke-width="6" ${POTEZA} />` +
    `<path d="M -104 40 L -100 66" stroke-width="5" ${POTEZA} />` +
    `<path d="M 104 40 L 100 66" stroke-width="5" ${POTEZA} />` +
    `</svg>`
  );
})();

/**
 * Kje na strani stojita metulj in krona.
 *
 * Ne vec ob napisu na prvem zaslonu: y meri delez CELE strani in ne enega
 * zaslona. Metulj visi v dnu prvega zaslona, krona v dnu drugega; tretji
 * pripada Zemlji in tam ni ne enega ne drugega. Razmik med njima je vecji od
 * enega zaslona, zato nikoli nista oba hkrati pred tabo: dokler eden odhaja
 * cez zgornji rob, drugega se ni od spodaj.
 *
 * Ne gorita enakomerno. Vsak ima svoje dihanje - dolg val, ki ga skoraj
 * ugasne in spet prizge - in svoj odtenek, ki ob tem lezi sem in tja. Faza in
 * doba sta razlicni, da nista nikoli v koraku; ce bi bila, bi bilo videti kot
 * utripanje strani in ne kot dve svoji stvari.
 *
 * Mreza je pri okrasih drobnejsa kot pri crkah. Crka je velika in preprosta,
 * risba pa ima tanke poteze; pri istem koraku bi od nje ostalo nekaj
 * raztresenih znakov brez obrisa.
 */
const OKRASI = [
  { svg: METULJ, x: 0.845, y: 0.3, sirina: 0.2, gostota: 5, odtenek: 328, zamah: 26, doba: 47, faza: 0 },
  { svg: KRONA, x: 0.185, y: 0.615, sirina: 0.18, gostota: 5, odtenek: 286, zamah: 24, doba: 61, faza: 0.42 },
];
/** Koliko od okrasa ostane v dnu diha; v vrhu je cel. */
const OKRAS_DNO = 0.18;

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
 * Majhen, ker so crke raztegnjene po sirini in zato ze same po sebi lovijo
 * prostor. Razmik je tu le se toliko, da se sosednji znaki ne dotikajo.
 *
 * Razmik risemo sami, crko za crko, in ne prek ctx.letterSpacing: tega starejsi
 * brskalniki ne poznajo in bi ga tiho prezrli, napis pa bi ostal zbit.
 */
const RAZMIK = 0.06;

/**
 * Raztezek crk po sirini.
 *
 * Crke so raztegnjene po sirini in stisnjene skupaj. To dvoje gre z roko v
 * roki: sirsa crka sama po sebi lovi vec prostora, zato je med njimi lahko
 * manj zraka, ne da bi se zlile. Obratno bi bilo najslabse - ozke crke z
 * majhnim razmikom se zlepijo v vrsto. Raztezemo ob izrisu na pomozno platno, zato so tocke ze v
 * pravih legah in vzmet nima s tem nobenega dela.
 */
const SIRJENJE = 1.42;

/**
 * Debelina crk, kot delez velikosti pisave.
 *
 * Metamorphous ima le eno debelino, zato poteze zadebelimo sami: crko poleg
 * zapolnitve se obrisemo. To ni isto kot vecji znaki - vecji znaki naredijo
 * gostejso packo, debelejsa poteza pa siri samo crko, tako da gre po njeni
 * sirini vec znakov in stebla postanejo trdna.
 */
const DEBELINA = 0.055;

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
 * Znaki v mirovanju gorijo pri 40 odstotkih, ob blisku pa pri polni moci.
 * Prej je bila razlika med 60 in 100 in se skoraj ni videla; sele pri 40 se
 * blisk res prizge. Ker so casi nakljucni in
 * za vsak znak svoji, napis ni videti kot utripajoca luc, ampak kot nekaj, kar
 * se iskri - kot zvezde, ki jih napis prekriva.
 */
const OSNOVNA_ALFA = 0.4;
const BLESK_NAJKRAJ_S = 1.1;
const BLESK_NAJDLJE_S = 5.5;
/** Koliksen del sija ostane po sekundi. Visje = daljsi, bolj opazen blisk. */
const BLESK_UPAD = 0.16;

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
  // Obris crko razsiri za svojo debelino na vsako stran; ce tega ne stejemo,
  // je napis izracunan ozji, kot je narisan, in zadnja crka pade cez rob.
  return Math.max(0, sirina - razmik + velikost * DEBELINA) * SIRJENJE;
}

/** Izris crko za crko z razmikom. Vrne skupno sirino. */
function narisiRazmaknjeno(ctx, besedilo, x, y, velikost) {
  const razmik = velikost * RAZMIK;
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = velikost * DEBELINA;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  let kje = x;
  for (const c of besedilo) {
    ctx.fillText(c, kje, y);
    // Obris zadebeli potezo navzven; brez njega je crka tanka kot nit in po
    // njeni sirini gre komaj en znak.
    ctx.strokeText(c, kje, y);
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

/**
 * Tocke, na katerih je narisana oblika polna.
 *
 * Isto kot pri besedilu, le da vir ni pisava, ampak SVG. Nalozimo ga kot
 * sliko, narisemo na pomozno platno in preberemo po mrezi.
 */
function tockeIzSvg(svg, sirinaCilj, gostota) {
  return new Promise((res) => {
    const slika = new Image();
    slika.onload = () => {
      const razmerje = slika.height / Math.max(1, slika.width);
      const s = Math.max(8, Math.round(sirinaCilj));
      const v = Math.max(8, Math.round(s * razmerje));
      const platno = document.createElement("canvas");
      platno.width = s;
      platno.height = v;
      const ctx = platno.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(slika, 0, 0, s, v);
      const piksli = ctx.getImageData(0, 0, s, v).data;
      const tocke = [];
      for (let y = 0, vrstica = 0; y < v; y += gostota, vrstica++) {
        const zamik = vrstica % 2 ? gostota / 2 : 0;
        for (let x = zamik; x < s; x += gostota) {
          if (piksli[((y | 0) * s + (x | 0)) * 4 + 3] > 110) {
            tocke.push({ x: x - s / 2, y: y - v / 2 });
          }
        }
      }
      res(tocke);
    };
    slika.onerror = () => res([]);
    slika.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
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
 * @param {HTMLElement} [drsnik] tok strani; okrasa lezita v njem, ne na zaslonu
 */
export function installPozdrav(gnezdoOzadja, gnezdoBesedila, drsnik) {
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
  /**
   * Prostor okrasov ni platno, ampak stran.
   *
   * Sirok je kot okno, visok pa kot ves tok - zato lahko okras stoji tam, kjer
   * ga ob prihodu se ni videti. Riseta se na platno ozadja, le premaknjena za
   * toliko, kolikor je stran zdrsela; tako se vedeta kot navadna elementa
   * strani, platna pa je treba le eno.
   */
  const mereK = { s: 1, v: 1 };
  const vrhStrani = () => (drsnik ? drsnik.scrollTop : 0);

  const besedni = [];   // znaki, ki sestavljajo napis
  const ozadje = [];    // znaki na Chladnijevi figuri
  const kotni = [];     // podpis v kotu
  /** Vsak okras ima svoje znake, da lahko diha in menja odtenek po svoje. */
  const okrasni = OKRASI.map((o) => ({ o, delci: [] }));

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
    mereK.s = mereO.s;
    mereK.v = Math.max(mereO.v, drsnik ? drsnik.scrollHeight : mereO.v * 3);
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

  /**
   * Postavi znake na metulja in krono.
   *
   * Tece ob prikazu in ob spremembi velikosti. Vsak okras dobi svoje znake in
   * svoje tarce, ker se tudi izrisuje zase - z lastnim dihom in odtenkom.
   * Koordinate so v prostoru strani, ne zaslona.
   */
  async function postaviOkrase() {
    for (const k of okrasni) {
      const tocke = await tockeIzSvg(k.o.svg, mereK.s * k.o.sirina, k.o.gostota ?? GOSTOTA);
      const sredX = mereK.s * k.o.x;
      const sredY = mereK.v * k.o.y;
      const cilji = tocke.map((t) => ({ x: sredX + t.x, y: sredY + t.y }));
      napolni(k.delci, cilji.length, mereK, 5, 11);
      for (const d of k.delci) d.imaCilj = false;
      // Tarce so ze v koordinatah prostora, zato brez zamika sredisca.
      poveziNajblizje(k.delci, k.delci.map((_, i) => i), cilji, 0, 0);
      for (const d of k.delci) d.cakaj = nakljucno(0, 1.8);
    }
  }

  /**
   * Koliko okras ta hip gori in kaksne barve je.
   *
   * Dih je kosinus, ki se giblje med OKRAS_DNO in ena; odtenek pa sinus z
   * nekoliko drugacno dobo, da barva ne pade z mocjo v isti tocki. Da se
   * ujemata natanko, bi bilo videti kot ena sama nastavitev.
   */
  function stanjeOkrasa(k, sek) {
    // Kdor je izklopil gibanje, ne sme dobiti niti dihanja: okras naj enkrat
    // za vselej stoji tam, kjer je, in v svoji barvi.
    if (mirno.matches) return { moc: 1, barva: `hsl(${k.o.odtenek}, 78%, 76%)` };
    const dih = 0.5 - 0.5 * Math.cos((sek / k.o.doba + k.o.faza) * Math.PI * 2);
    const moc = OKRAS_DNO + (1 - OKRAS_DNO) * dih;
    const h = k.o.odtenek + Math.sin((sek / (k.o.doba * 0.63) + k.o.faza) * Math.PI * 2) * k.o.zamah;
    return { moc, barva: `hsl(${h.toFixed(1)}, 78%, 76%)` };
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
      // Osnovna moc plus tisto, kar prispeva blisk: 0,4 v mirovanju, 1 na vrhu.
      const moc = OSNOVNA_ALFA + (1 - OSNOVNA_ALFA) * d.sij;
      ctx.globalAlpha = (d.imaCilj ? d.alfa * moc : d.alfa * 0.16) * mnozitelj;
      ctx.font = `${d.velikost}px "Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols 2", sans-serif`;
      ctx.fillText(d.z, d.x, d.y);
    }
    ctx.globalAlpha = 1;
  }

  function risi(sek) {
    ctxO.clearRect(0, 0, mereO.s, mereO.v);
    ctxO.textAlign = "center";
    ctxO.textBaseline = "middle";
    // Frekvence so ozadje in ne sobesedilo: kadar so premocne, tekmujejo z
    // napisom, ki lezi cez nje, in oko ne ve, kam naj gleda.
    risiPolje(ctxO, ozadje, 0.26, "#9fb6d8");

    // Okrasa lezita v prostoru strani, platno pa stoji pri miru - zato ju
    // narisemo zamaknjena za toliko, kolikor je stran zdrsela.
    ctxO.save();
    ctxO.translate(0, -vrhStrani());
    for (const k of okrasni) {
      const { moc, barva } = stanjeOkrasa(k, sek);
      risiPolje(ctxO, k.delci, 0.92 * moc, barva);
    }
    ctxO.restore();

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
    const kazalecB = kazalecZa(gnezdoBesedila);
    korakPolja(besedni, mereB, dt, kazalecB, sek);
    korakPolja(ozadje, mereO, dt, kazalecZa(gnezdoOzadja), sek);

    // Kazalec je za okrase v prostoru strani, torej nizje za toliko, kolikor
    // je stran zdrsela - sicer bi znaki bezali pred prazno tocko.
    const kazalecK = kazalecZa(gnezdoOzadja);
    if (kazalecK.ziv) kazalecK.y += vrhStrani();
    for (const k of okrasni) korakPolja(k.delci, mereK, dt, kazalecK, sek);
    risi(sek);
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
    // Okrasa se odzoveta sibkeje: sta tezja od crk in se ne zibata tako lahko.
    for (const k of okrasni) for (const d of k.delci) d.vy += moc * 0.55;
  };

  const naSpremembo = () => {
    if (!viden) return;
    meri();
    sestaviKot();
    preusmeriBesedilo();
    preusmeriOzadje();
    postaviOkrase();
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

      postaviOkrase();
      pripravljena.then(() => {
        if (!viden) return;
        sestaviKot();
        preusmeriBesedilo();
        platnoO.classList.add("vidno");
        platnoB.classList.add("vidno");
        if (!mirno.matches) return;
        const vsi = besedni.concat(ozadje, ...okrasni.map((k) => k.delci));
        for (const d of vsi) {
          if (!d.imaCilj) continue;
          d.x = d.ciljX;
          d.y = d.ciljY;
          d.cakaj = 0;
        }
        risi(performance.now() * 0.001);
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
