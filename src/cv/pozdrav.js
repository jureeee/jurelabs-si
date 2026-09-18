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
const PISAVA = '"Pozdrav", "PozdravRezerva", "Segoe UI Variable Display", "Segoe UI", system-ui, serif';

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
  { svg: METULJ, sirina: 0.2, gostota: 5, odtenek: 328, zamah: 26, doba: 47, faza: 0,
    leti: true, pas: [0.24, 0.36] },
  { svg: KRONA, sirina: 0.18, gostota: 5, odtenek: 286, zamah: 24, doba: 61, faza: 0.42,
    pas: [0.58, 0.7] },
];

/**
 * Kje ob straneh smeta stati.
 *
 * Sredina pripada napisu in vsebini; okras gre zato v levi ali desni pas.
 * Katera stran komu pripade, se zmenita ob vsakem odprtju - a nikoli isto,
 * sicer bi se znasla eden pod drugim v istem stolpcu.
 */
const PAS_LEVO = [0.12, 0.25];
const PAS_DESNO = [0.75, 0.88];

/** Koliko od okrasa ostane v dnu diha; v vrhu je cel. */
const OKRAS_DNO = 0.18;

/**
 * Koliko po odhodu z zaslona napis se tece, preden obmiruje.
 *
 * Znakov je dva tisoc in vsak je telo na vzmeti; racunati jih, ko jih nihce
 * ne gleda, je zastonj delo. Dve sekundi sta zato, da kratek pogled navzdol
 * in nazaj ne ustavi ravno tekocega preliva - sicer bi se ta ob vrnitvi
 * nadaljeval s sunkom.
 */
const UGASNI_PO_S = 2;

/**
 * Let metulja.
 *
 * Krila niso druga risba, ampak ista, ki jo vsako slicico preoblikujemo. Krilo
 * se pri zamahu zavrti iz ravnine zaslona; oko tega ne vidi kot vrtenje, ampak
 * kot da se krilo POZI - siroko je manj, konica pa gre navzgor. Natanko to
 * naredimo: vodoravni odmik od telesa pomnozimo s kosinusom kota, konico pa
 * dvignemo za sinus. Telo ima odmik nic in zato mirno stoji, ne da bi ga bilo
 * treba loceno oznacevati.
 *
 * Zamah je pocasen in to ni okus, ampak nuja: vsak znak je delec na vzmeti in
 * mora pot fizicno prepotovati. Pri hitrem zamahu znaki ne bi dohajali tarc in
 * to ne bi bilo videti kot let, ampak kot migetanje. Pri 2,6 sekunde na zamah
 * jih vzmet ujame, zaostanek konic pa je celo dobrodosel - krilo je videti
 * mehko.
 *
 * Lebdenje sta dve nihanji z razlicno dobo, zato pot ni krog, ampak vijuga, ki
 * se ne ponovi na oceh. Manjsi dvig je vezan na zamah: metulj se ob zamahu
 * navzdol malce dvigne.
 */
const ZAMAH_S = 2.6;
const ZAMAH_KOT = 1.15;
const ZAMAH_NAGIB = 0.5;
const LET_X_S = 17;
const LET_Y_S = 11;
const LET_X = 0.22;
const LET_Y = 0.13;
const LET_BOB = 0.06;

/** Koliko casa napis miruje, preden se zacne prelivati v naslednji jezik. */
const MIROVANJE_S = 6.5;

/**
 * Pisanje s tipkovnico.
 *
 * Kar natipkas, se sestavi iz istih znakov kot pozdrav - pozdrav se umakne in
 * znaki odtecejo v tvoje crke. Po nekaj sekundah brez tipke se vrne k jezikom.
 *
 * Val je pri tem kratek. Pozdrav tece z leve proti desni skoraj dve sekundi,
 * ker je dogodek; crka pod prstom pa mora priti takoj, sicer pisanje zaostaja
 * za roko in je videti pokvarjeno.
 */
const VPIS_NAJVEC = 36;
const VPIS_MIRUJE_S = 7;
const VPIS_VAL_S = 0.45;
/** Do te dolzine je vpis ena vrstica; dalje se prelomi na presledku. */
const VPIS_VRSTICA = 16;
/** Koliko traja preliv od zacetka prvega znaka do prihoda zadnjega. */
const VAL_S = 1.9;

/**
 * Razmik med tarcami.
 *
 * Znaki se ob njem rahlo dotikajo, ne prekrivajo. Gosteje zapolnjena crka je
 * bila kompaktna in tezka; pri tem koraku so med znaki reze, skozi katere se
 * vidi ozadje, in oko ima kje pocivati. Prevec redko pa bi pojedlo okrasne
 * serife in napis bi bil videti kot katerikoli drug.
 */
const GOSTOTA = 9.5;
/**
 * Zgornja meja stevila znakov v besedilu in v ozadju.
 *
 * Meja gre z gostoto in je bistvena: ce je nizja od stevila tarc, jih ostane
 * vec praznih in crke razpadejo v raztresene pike. Enkrat se je to ze
 * zgodilo - meja 2050 pri gostoti 11,5 je od napisa pustila oblak.
 */
const NAJVEC_BESEDILA = 3000;

/**
 * Koliko znakov si naprava sploh zasluzi.
 *
 * Telefon ima manjso ploskev in pogosto dvojno gostoto tock, torej stiri
 * milijone pik na isto sliko. Trdih tri tisoc znakov je tam predrago, zato
 * stevilo vezemo na dejansko povrsino v pikah.
 */
function delezNaprave() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const pik = innerWidth * innerHeight * dpr * dpr;
  // 1600 x 900 pri enojni gostoti je merilo za polno kolicino.
  return Math.max(0.42, Math.min(1, (1600 * 900 * 1.6) / Math.max(1, pik)));
}

/**
 * Koliko se tarca odmakne od svojega mesta v mrezi, kot delez koraka.
 *
 * Brez tega znaki sedejo natanko na mrezo in crka je videti kot izpis s
 * pisalnega stroja - oko najprej vidi vrste in stolpce in sele nato crko.
 * Nakljucni odmik jih razsuje, oblika pa ostane, ker je odmik manjsi od
 * koraka; obenem rob crke rahlo razcefra, kar je za risbo iz zvezd prav.
 */
const RAZSUTOST = 0.36;
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
// Blackletter ima ze v svojih sirinah dovolj zraka ob strani; dodaten razmik
// je crke razmetal po vrstici, kot bi bile vsaka zase.
const RAZMIK = 0;

/**
 * Raztezek crk po sirini.
 *
 * Crke so raztegnjene po sirini in stisnjene skupaj. To dvoje gre z roko v
 * roki: sirsa crka sama po sebi lovi vec prostora, zato je med njimi lahko
 * manj zraka, ne da bi se zlile. Obratno bi bilo najslabse - ozke crke z
 * majhnim razmikom se zlepijo v vrsto. Raztezemo ob izrisu na pomozno platno, zato so tocke ze v
 * pravih legah in vzmet nima s tem nobenega dela.
 */
// Pri Eczarju je bilo 1.42. Blackletter je ozka in visoka po naravi; ce jo
// raztegnemo toliko, izgubi znacaj in med crkami nastanejo luknje.
const SIRJENJE = 1.12;

/**
 * Debelina crk, kot delez velikosti pisave.
 *
 * Pisava ima le eno debelino, zato poteze zadebelimo sami: crko poleg
 * zapolnitve se obrisemo. To ni isto kot vecji znaki - vecji znaki naredijo
 * gostejso packo, debelejsa poteza pa siri samo crko, tako da gre po njeni
 * sirini vec znakov in stebla postanejo trdna.
 */
// Blackletter ima tanke lasnice med debelimi stebli; malo mocnejsi obris jih
// ohrani, da gre po njih vsaj en znak.
const DEBELINA = 0.03;

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
 * Kazalec je crna luknja.
 *
 * Ko se mu crka priblizja, jo zacne vleci vase - vso naenkrat, a ne enako:
 * del crke, ki je blizje, gre dlje proti kazalcu kot oddaljeni, zato se crka
 * raztegne proti njemu, kot bi jo srkalo. Zraven je rahel vrtinec, da vlek ni
 * raven kot magnet, ampak zasuka kot snov okoli luknje.
 *
 * Znaki ostanejo na svojih vzmeteh; luknja jim le premakne tarce. Ko gre
 * kazalec stran, vlek pojenja in vzmeti crko postavijo nazaj - z malo odboja,
 * kot da se je iztrgala.
 *
 *   LUKNJA_R         kako dalec od roba crke se vlek zacne
 *   LUKNJA_MOC       najvec, koliko poti do kazalca sme znak narediti
 *   LUKNJA_SIRINA    kako hitro vlek pade z razdaljo od kazalca
 *   LUKNJA_VRTINEC   delez vleka, ki gre v zasuk
 *   LUKNJA_ZAJEM     kako hitro vlek naraste, ko se priblizas
 *   LUKNJA_IZPUST    kako hitro pojenja, ko gres stran
 */
const LUKNJA_R = 290;
const LUKNJA_MOC = 0.93;
const LUKNJA_SIRINA = 145;
const LUKNJA_VRTINEC = 0.3;
const LUKNJA_ZAJEM = 0.09;
const LUKNJA_IZPUST = 0.045;

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
/**
 * Kako dolgo traja en blisk, od prvega soja do teme.
 *
 * Blisk ne skoci na polno, ampak se prizge in ugasne po krivulji sin^2: najprej
 * pocasi, na vrhu mehko, nato enako pocasi nazaj. Prej je skocil v hipu in
 * ugasal hitro - to je bilo videti kot utrip, ne kot sij.
 */
const BLESK_TRAJANJE_S = 2.8;

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

/**
 * Izris crko za crko z razmikom. Vrne skupno sirino.
 *
 * Ce dobi polje obsegov, vanj zapise vodoravni pas vsake crke - po njem
 * pozneje vemo, kateri crki pripada posamezna tocka.
 */
function narisiRazmaknjeno(ctx, besedilo, x, y, velikost, obsegi) {
  const razmik = velikost * RAZMIK;
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = velikost * DEBELINA;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  let kje = x;
  for (const c of besedilo) {
    const sirinaCrke = ctx.measureText(c).width;
    // Pas je v pikah platna, izris pa tece raztegnjen - zato SIRJENJE.
    if (obsegi) obsegi.push({ od: kje * SIRJENJE, do: (kje + sirinaCrke) * SIRJENJE });
    ctx.fillText(c, kje, y);
    // Obris zadebeli potezo navzven; brez njega je crka tanka kot nit in po
    // njeni sirini gre komaj en znak.
    ctx.strokeText(c, kje, y);
    kje += ctx.measureText(c).width + razmik;
  }
  return Math.max(0, kje - x - razmik);
}

/** Kateri crki pripada tocka - crke stojijo druga ob drugi, zato odloci lega. */
function crkaZa(obsegi, x) {
  let naj = -1;
  let najblizje = Infinity;
  for (let i = 0; i < obsegi.length; i++) {
    const o = obsegi[i];
    if (x >= o.od && x <= o.do) return i;
    // Obris crko razsiri cez njen pas; tocka tik ob robu pripada isti crki.
    const d = x < o.od ? o.od - x : x - o.do;
    if (d < najblizje) {
      najblizje = d;
      naj = i;
    }
  }
  return naj;
}

function tockeBesedila(vrstice, sirinaNaVoljo, velikostPisave, gostota = GOSTOTA) {
  const seznam = Array.isArray(vrstice) ? vrstice : [vrstice];
  if (seznam.length > 1) return tockeVecVrstic(seznam, sirinaNaVoljo, velikostPisave, gostota);
  const besedilo = seznam[0];
  const platno = document.createElement("canvas");
  const ctx = platno.getContext("2d", { willReadFrequently: true });
  const pisava = (v) => `800 ${v}px ${PISAVA}`;

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
  const obsegi = [];
  ctx.save();
  ctx.scale(SIRJENJE, 1);
  narisiRazmaknjeno(ctx, besedilo, 4 / SIRJENJE, nad + 4, velikost, obsegi);
  ctx.restore();

  const slika = ctx.getImageData(0, 0, sirina, visina).data;
  const tocke = [];
  for (let y = 0, vrstica = 0; y < visina; y += gostota, vrstica++) {
    const zamik = vrstica % 2 ? gostota / 2 : 0;
    for (let x = zamik; x < sirina; x += gostota) {
      if (slika[((y | 0) * sirina + (x | 0)) * 4 + 3] > 128) {
        const r = gostota * RAZSUTOST;
        tocke.push({
          x: x - sirina / 2 + nakljucno(-r, r),
          y: y - visina / 2 + nakljucno(-r, r),
          crka: crkaZa(obsegi, x),
        });
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
  merilno.font = `800 ${velikostPisave}px ${PISAVA}`;
  const najsirsa = Math.max(
    ...vrstice.map((v) => sirinaRazmaknjena(merilno, v, velikostPisave))
  );
  const merilo = Math.min(1, sirinaNaVoljo / Math.max(1, najsirsa));
  const velikost = Math.max(16, velikostPisave * merilo);

  const posamezne = vrstice.map((v) => tockeBesedila(v, Infinity, velikost, gostota));
  const visina = velikost * VRSTICA;
  const zamik = ((vrstice.length - 1) * visina) / 2;

  const tocke = [];
  let prvaCrka = 0;
  posamezne.forEach((del, i) => {
    let najvecja = -1;
    for (const t of del) {
      tocke.push({
        x: t.x,
        y: t.y + i * visina - zamik,
        crka: t.crka < 0 ? -1 : prvaCrka + t.crka,
      });
      if (t.crka > najvecja) najvecja = t.crka;
    }
    prvaCrka += najvecja + 1;
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
            const r = gostota * RAZSUTOST;
            tocke.push({
              x: x - s / 2 + nakljucno(-r, r),
              y: y - v / 2 + nakljucno(-r, r),
            });
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
      if (Math.abs(f) < meja) {
        const r = korak * RAZSUTOST;
        tocke.push({ x: px + nakljucno(-r, r), y: py + nakljucno(-r, r) });
      }
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
    d.crka = t.crka ?? -1;
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
  /** Crke napisa: sredisce, polmer in odmik, ki ga da kazalec. */
  const crkeNapisa = [];
  const ozadje = [];    // znaki na Chladnijevi figuri
  const kotni = [];     // podpis v kotu
  /** Vsak okras ima svoje znake, da lahko diha in menja odtenek po svoje. */
  const okrasni = OKRASI.map((o) => ({ o, delci: [], x: 0, y: 0 }));

  /**
   * Zmeni, kje bosta okrasa tokrat.
   *
   * Tece ob vsakem odprtju in ne ob vsaki meritvi: ob spremembi velikosti okna
   * naj metulj ostane, kjer je bil, sicer bi ob vsakem premiku roba poskocil
   * drugam.
   */
  function izberiLege() {
    const prviLevo = Math.random() < 0.5;
    okrasni.forEach((k, i) => {
      const pas = (i === 0) === prviLevo ? PAS_LEVO : PAS_DESNO;
      k.x = nakljucno(pas[0], pas[1]);
      k.y = nakljucno(k.o.pas[0], k.o.pas[1]);
    });
  }
  izberiLege();

  let jezikA = 0;
  let jezikB = 0;
  let prvikrat = true;
  let menjavaOb = 0;
  let frekvencaOb = 0;
  let frekvencaKje = 0;
  let zanka = null;
  let viden = false;
  /** Ali napis tece; ozadje in okrasa tecejo naprej, ker sta drugod. */
  let napisTece = true;
  let ugasniOb = null;
  let opazovalec = null;
  let zadnjiSek = 0;
  const kazalec = { x: -1e4, y: -1e4, ziv: false };

  // Dve vrstici: pozdrav zgoraj, ime spodaj. V eni vrstici bi bile crke
  // pretesne, da bi se videla pisava.
  /** Natipkano besedilo; null pomeni, da tece pozdrav v jezikih. */
  let vpis = null;

  /** Dolg vpis prelomimo na presledku, ki je sredini najblizji. */
  function vrsticeVpisa(t) {
    if (t.length <= VPIS_VRSTICA) return [t];
    const sredina = t.length / 2;
    let najbolje = -1;
    for (let i = 0; i < t.length; i++) {
      if (t[i] === " " && (najbolje < 0 || Math.abs(i - sredina) < Math.abs(najbolje - sredina))) {
        najbolje = i;
      }
    }
    const rez = najbolje > 0 ? najbolje : Math.round(sredina);
    return [t.slice(0, rez).trim(), t.slice(rez).trim()].filter(Boolean);
  }

  const besedilo = () =>
    vpis !== null ? vrsticeVpisa(vpis) : [`${DELI[0][jezikA]}, ${DELI[1][jezikB]}`, IME];

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
      crka: -1,
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
  /**
   * Enakomerno redcenje seznama tock.
   *
   * Vzame vsako n-to tocko, ne prvih n - tako ostane oblika cela, le gostota
   * pade. Prav to je bila napaka, ki je odrezala spodnjo vrstico napisa.
   */
  function redci(tocke, koliko) {
    if (tocke.length <= koliko) return tocke;
    const korak = tocke.length / koliko;
    const izbrane = [];
    for (let i = 0; i < koliko; i += 1) izbrane.push(tocke[Math.floor(i * korak)]);
    return izbrane;
  }

  function preusmeriBesedilo(val = VAL_S) {
    // Visino delimo med obe vrstici in pustimo rob: pri 0,3 je spodnja vrstica
    // s podaljski crk segala cez spodnji rob platna.
    const velikost = Math.min(mereB.v * 0.24, mereB.s * 0.155);
    // Sibkejsa naprava dobi manj znakov. Tocke REDCIMO in ne rezemo: rezanje
    // seznama je odsekalo spodnjo vrstico, ker tocke nastajajo od zgoraj navzdol.
    const meja = Math.round(NAJVEC_BESEDILA * delezNaprave());
    const vse = tockeBesedila(besedilo(), mereB.s * NAJVEC_SIRINE, velikost);
    const tocke = redci(vse, meja);
    napolni(besedni, Math.min(meja, Math.round(tocke.length * 1.08)), mereB, 5.5, 11.5);

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
      d.cakaj = ((delez + 1) / 2) * val;
      d.z = znak();
    }

    sestaviCrke();
  }

  /**
   * Iz tarc znakov sestavi crke: sredisce in polmer vsake.
   *
   * Sredisce je povprecje tarc, polmer pa polovica daljse stranice - toliko
   * dalec seze crka in po tem vemo, kdaj je kazalec dovolj blizu.
   */
  function sestaviCrke() {
    crkeNapisa.length = 0;
    for (const d of besedni) {
      if (!d.imaCilj || d.crka < 0) continue;
      let c = crkeNapisa[d.crka];
      if (!c) {
        c = crkeNapisa[d.crka] = {
          n: 0, sx: 0, sy: 0,
          levo: Infinity, desno: -Infinity, zgoraj: Infinity, spodaj: -Infinity,
          cx: 0, cy: 0, r: 0, vlek: 0,
        };
      }
      c.n += 1;
      c.sx += d.ciljX;
      c.sy += d.ciljY;
      c.levo = Math.min(c.levo, d.ciljX);
      c.desno = Math.max(c.desno, d.ciljX);
      c.zgoraj = Math.min(c.zgoraj, d.ciljY);
      c.spodaj = Math.max(c.spodaj, d.ciljY);
    }
    const vrsta = crkeNapisa.filter(Boolean);
    for (const c of vrsta) {
      c.cx = c.sx / c.n;
      c.cy = c.sy / c.n;
      c.r = Math.max(c.desno - c.levo, c.spodaj - c.zgoraj) * 0.5;
    }
  }

  /** Zadnja lega luknje; ostane tudi, ko gre kazalec stran, da se crke vrnejo od tam. */
  let luknjaX = 0;
  let luknjaY = 0;

  /** Vlek vsake crke: narasca, ko je kazalec blizu, in pojenja, ko ga ni. */
  function korakCrk(lok) {
    if (lok.ziv) {
      luknjaX = lok.x;
      luknjaY = lok.y;
    }
    for (const c of crkeNapisa) {
      if (!c) continue;
      let cilj = 0;
      if (lok.ziv) {
        const r = Math.hypot(c.cx - lok.x, c.cy - lok.y);
        const doseg = c.r + LUKNJA_R;
        if (r < doseg) cilj = Math.pow(1 - r / doseg, 1.4);
      }
      c.vlek += (cilj - c.vlek) * (cilj > c.vlek ? LUKNJA_ZAJEM : LUKNJA_IZPUST);
      if (c.vlek < 0.0005 && cilj === 0) c.vlek = 0;
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
      const sredX = mereK.s * k.x;
      const sredY = mereK.v * k.y;
      const cilji = tocke.map((t) => ({ x: sredX + t.x, y: sredY + t.y }));
      napolni(k.delci, cilji.length, mereK, 5, 11);
      for (const d of k.delci) d.imaCilj = false;
      // Tarce so ze v koordinatah prostora, zato brez zamika sredisca.
      poveziNajblizje(k.delci, k.delci.map((_, i) => i), cilji, 0, 0);
      // Mirujoca oblika, merjena od sredisca: iz nje se vsako slicico racuna
      // zamah. Tarce same se namrec sproti spreminjajo.
      k.sredX = sredX;
      k.sredY = sredY;
      for (const d of k.delci) {
        d.cakaj = nakljucno(0, 1.8);
        d.doma = { x: d.ciljX - sredX, y: d.ciljY - sredY };
      }
    }
  }

  /**
   * Prestavi tarce metulja: zamah kril in lebdenje po strani.
   *
   * Tece pred korakom delcev, da znaki v isti slicici ze vlecejo proti novi
   * legi. Kdor je izklopil gibanje, dobi metulja pri miru - takrat tarce
   * ostanejo tam, kamor jih je postavila oblika.
   */
  function zamahni(k, sek) {
    if (!k.o.leti || mirno.matches) return;
    const kot = Math.sin((sek / ZAMAH_S) * Math.PI * 2) * ZAMAH_KOT;
    const stisk = Math.cos(kot);
    const dvig = Math.sin(kot);
    const merilo = mereK.s * k.o.sirina;
    const nesX = Math.sin((sek / LET_X_S) * Math.PI * 2) * merilo * LET_X;
    const nesY =
      Math.sin((sek / LET_Y_S) * Math.PI * 2 + 1.1) * merilo * LET_Y - dvig * merilo * LET_BOB;
    for (const d of k.delci) {
      if (!d.imaCilj || !d.doma) continue;
      d.ciljX = k.sredX + d.doma.x * stisk + nesX;
      d.ciljY = k.sredY + d.doma.y - Math.abs(d.doma.x) * dvig * ZAMAH_NAGIB + nesY;
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
    // Odtenek zaokrozimo na dvanajst stopinj: nihanje je tako ali tako majhno,
    // predpomnilnik slicic pa dobi nekaj barv namesto nove ob vsaki slicici.
    return { moc, barva: `hsl(${(Math.round(h / 12) * 12).toFixed(0)}, 78%, 76%)` };
  }

  /** Preusmeri znake ozadja na naslednjo figuro. */
  function preusmeriOzadje() {
    const vzorec = FREKVENCE[frekvencaKje % FREKVENCE.length];
    const tocke = redci(
      tockeFrekvence(vzorec, mereO.s, mereO.v, NAJVEC_OZADJA),
      Math.round(NAJVEC_OZADJA * delezNaprave())
    );
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

  function korakPolja(polje, mere, dt, lok, sek, crke) {
    for (const d of polje) {
      // Blescanje: sij se prizge in ugasne po mehki krivulji, nato pocaka.
      if (d.sijOd !== undefined) {
        const t = (sek - d.sijOd) / BLESK_TRAJANJE_S;
        d.sij = t < 1 ? Math.sin(Math.PI * t) ** 2 : 0;
      }
      if (sek >= d.sijOb) {
        d.sijOd = sek;
        d.sijOb = sek + BLESK_TRAJANJE_S + nakljucno(BLESK_NAJKRAJ_S, BLESK_NAJDLJE_S);
      }

      if (d.cakaj > 0) {
        d.cakaj -= dt;
      } else if (d.imaCilj) {
        let tx = d.ciljX;
        let ty = d.ciljY;
        // Crna luknja: tarca znaka se premakne proti kazalcu, toliko bolj,
        // kolikor blizje mu je - crka se raztegne proti njemu.
        const c = crke && d.crka >= 0 ? crke[d.crka] : null;
        if (c && c.vlek > 0) {
          const dx = luknjaX - d.ciljX;
          const dy = luknjaY - d.ciljY;
          const r = Math.hypot(dx, dy) || 1;
          const vpliv = (c.vlek * LUKNJA_MOC) / (1 + (r / LUKNJA_SIRINA) ** 2);
          tx += dx * vpliv - dy * vpliv * LUKNJA_VRTINEC;
          ty += dy * vpliv + dx * vpliv * LUKNJA_VRTINEC;
        }
        d.vx += (tx - d.x) * VZMET;
        d.vy += (ty - d.y) * VZMET;
      } else {
        d.vx += nakljucno(-0.05, 0.05);
        d.vy += nakljucno(-0.07, 0.03);
      }

      // Kjer crke vlece luknja, posamezni znak odriva ne cuti - sicer bi se
      // crka hkrati razlezla in raztegnila.
      if (lok.ziv && !crke) {
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

  /**
   * Znak, narisan vnaprej na svojo majhno sliko.
   *
   * Prej je vsak znak ob vsaki slicici dobil svojo pisavo in svoj fillText;
   * pri treh tisoc znakih je bilo to daljs del celotnega dela in prav to je
   * delalo zatikanje na sibkejsih napravah. Risanje ze pripravljene slike je
   * nekajkrat ceneje, videz pa je isti.
   *
   * Kljuc je znak, velikost (zaokrozena na pol pike) in barva; slike nastajajo
   * sproti, ob prvi uporabi.
   */
  const spriti = new Map();
  const PISAVA_ZNAKA = '"Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols 2", sans-serif';

  function sprite(znak, velikost, barva) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    // Cele pike: pol pike je dalo dvakrat vec razlicic, razlike pa ni videti.
    const v = Math.max(1, Math.round(velikost));
    const kljuc = `${znak}|${v}|${barva}|${dpr}`;
    let s = spriti.get(kljuc);
    if (s) return s;

    // Znaki imajo repke in konice; okvir je zato precej vecji od velikosti.
    const rob = Math.ceil(v * 2.1);
    const platno = document.createElement("canvas");
    platno.width = Math.max(2, Math.round(rob * dpr));
    platno.height = platno.width;
    const g = platno.getContext("2d");
    g.scale(dpr, dpr);
    g.font = `${v}px ${PISAVA_ZNAKA}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = barva;
    g.fillText(znak, rob / 2, rob / 2);

    s = { platno, rob };
    // Zgornja meja: ko je dosezena, vrzemo ven najstarejse vnose in ne vsega.
    // Popolno praznjenje je pomenilo, da je treba vse slicice narisati znova -
    // in prav zaradi tega je stran vsakih nekaj sekund obstala.
    if (spriti.size > 3000) {
      let odvec = 600;
      for (const k of spriti.keys()) {
        spriti.delete(k);
        if (--odvec <= 0) break;
      }
    }
    spriti.set(kljuc, s);
    return s;
  }

  function risiPolje(ctx, polje, mnozitelj, barva) {
    for (const d of polje) {
      // Osnovna moc plus tisto, kar prispeva blisk: 0,4 v mirovanju, 1 na vrhu.
      const moc = OSNOVNA_ALFA + (1 - OSNOVNA_ALFA) * d.sij;
      const alfa = (d.imaCilj ? d.alfa * moc : d.alfa * 0.16) * mnozitelj;
      // Kar je pod tem, se na zaslonu ne vidi; risanje bi bilo zastonj delo.
      if (alfa <= 0.004) continue;
      const s = sprite(d.z, d.velikost, barva);
      ctx.globalAlpha = alfa;
      ctx.drawImage(s.platno, d.x - s.rob / 2, d.y - s.rob / 2, s.rob, s.rob);
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Stevec slicic. Ozadje in okrasa se gibljeta pocasi, zato ju osvezujemo
   * vsako drugo slicico - na platnu med tem ostane prejsnja slika in razlike
   * ni videti, dela pa je pol manj.
   */
  let slicic = 0;

  function risi(sek) {
    slicic += 1;
    const ozadjeZdaj = slicic % 2 === 0;
    if (!ozadjeZdaj) {
      risiNapis();
      return;
    }
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

    risiNapis();
  }

  function risiNapis() {
    // Ko napis miruje, platna niti ne cistimo: zadnja slika ostane na njem in
    // je ob vrnitvi ze tu, mi pa med tem ne risemo nicesar.
    if (!napisTece) return;
    ctxB.clearRect(0, 0, mereB.s, mereB.v);
    ctxB.textAlign = "center";
    ctxB.textBaseline = "middle";
    risiPolje(ctxB, besedni, 1, "#e9edf3");
    ctxB.globalAlpha = 0.5;
    for (const k of kotni) {
      const s = sprite(k.z, k.velikost, "#c8d4e8");
      ctxB.drawImage(s.platno, k.x - s.rob / 2, k.y - s.rob / 2, s.rob, s.rob);
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

    if (napisTece && sek >= menjavaOb) {
      // Ko je vpis potekel, se vrne jezik, ki je bil prej - ne naslednji, sicer
      // bi bilo videti, kot da je pisanje pojedlo en pozdrav.
      if (vpis !== null) vpis = null;
      else naprejJezik();
      preusmeriBesedilo();
      menjavaOb = sek + MIROVANJE_S + VAL_S;
    }
    if (sek >= frekvencaOb) {
      frekvencaKje += 1;
      preusmeriOzadje();
      frekvencaOb = sek + FREKVENCA_S;
    }
    const kazalecB = kazalecZa(gnezdoBesedila);
    if (napisTece) {
      korakCrk(kazalecB);
      korakPolja(besedni, mereB, dt, kazalecB, sek, crkeNapisa);
    }
    korakPolja(ozadje, mereO, dt, kazalecZa(gnezdoOzadja), sek);

    // Kazalec je za okrase v prostoru strani, torej nizje za toliko, kolikor
    // je stran zdrsela - sicer bi znaki bezali pred prazno tocko.
    const kazalecK = kazalecZa(gnezdoOzadja);
    if (kazalecK.ziv) kazalecK.y += vrhStrani();
    for (const k of okrasni) {
      zamahni(k, sek);
      korakPolja(k.delci, mereK, dt, kazalecK, sek);
    }
    risi(sek);
  }

  /**
   * Tipka na strani.
   *
   * Lovimo le, kar je res pisanje: en znak ali brisalko, brez Ctrl, Alt in Cmd,
   * ne v vnosnih poljih in ne, ko je odprta vizitka. Esc ostane strani - z njim
   * se zapira. Presledku preprecimo privzeto dejanje, sicer bi stran ob vsakem
   * presledku skocila za zaslon navzdol.
   */
  const naTipko = (e) => {
    if (!viden || !napisTece || e.isComposing) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const cilj = e.target;
    if (
      cilj instanceof HTMLElement &&
      (cilj.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(cilj.tagName))
    ) {
      return;
    }
    if (document.documentElement.classList.contains("viz-open")) return;

    let nov = vpis ?? "";
    if (e.key === "Backspace") {
      if (vpis === null) return;
      nov = nov.slice(0, -1);
    } else if (e.key.length === 1) {
      if (nov.length >= VPIS_NAJVEC) return;
      nov += e.key;
    } else {
      return;
    }
    e.preventDefault();

    const zdaj = performance.now() * 0.001;
    vpis = nov.trim() ? nov : null;
    // Prazen vpis vrne pozdrav takoj; sicer pocaka, da nehas tipkati.
    menjavaOb = zdaj + (vpis === null ? MIROVANJE_S : VPIS_MIRUJE_S);
    preusmeriBesedilo(VPIS_VAL_S);
  };

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
      izberiLege();
      meri();
      // Prvi napis je slovenski; ta pozdrav bere vecina, ki pride sem.
      jezikA = 0;
      jezikB = 0;
      prvikrat = true;
      preusmeriOzadje();

      // Oblike crk merimo sele, ko je pisava tu. Prej bi jih narisala
      // sistemska in napis bi ob prihodu okrasne poskocil.
      const pripravljena = document.fonts
        ? document.fonts.load('800 100px "Pozdrav"').catch(() => null)
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

      /**
       * Napis zaspi, ko odide z zaslona.
       *
       * Frekvence in okrasa tecejo naprej - prve so pod celo stranjo, druga
       * sta nizje na njej in ju gledas prav takrat, ko napisa ni. Ustavi se
       * le tisto, cesar nihce ne gleda.
       */
      opazovalec = new IntersectionObserver(
        (vnosi) => {
          const naZaslonu = vnosi.some((v) => v.isIntersecting);
          if (naZaslonu) {
            clearTimeout(ugasniOb);
            ugasniOb = null;
            if (!napisTece) {
              napisTece = true;
              // Ob vrnitvi naj preliv ne skoci takoj: ura je med spanjem tekla
              // naprej in bi bil ze zapadel.
              menjavaOb = performance.now() * 0.001 + MIROVANJE_S;
            }
            return;
          }
          if (ugasniOb) return;
          ugasniOb = setTimeout(() => {
            napisTece = false;
            ugasniOb = null;
          }, UGASNI_PO_S * 1000);
        },
        { root: drsnik ?? null, threshold: 0 }
      );
      opazovalec.observe(gnezdoBesedila);

      addEventListener("keydown", naTipko);
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
      opazovalec?.disconnect();
      opazovalec = null;
      clearTimeout(ugasniOb);
      ugasniOb = null;
      napisTece = true;
      platnoO.classList.remove("vidno");
      platnoB.classList.remove("vidno");
      if (zanka) cancelAnimationFrame(zanka);
      zanka = null;
      removeEventListener("keydown", naTipko);
      removeEventListener("pointermove", naMisko);
      vpis = null;
      removeEventListener("pointerleave", naIzhod);
      removeEventListener("resize", naSpremembo);
    },
  };
}
