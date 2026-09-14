import strojnaSlika from "../assets/zapis/strojna-programska.webp";
import traceSpaceSlika from "../assets/zapis/trace-space.webp";
import vantageSlika from "../assets/zapis/vantage.webp";

/**
 * Besedilo strani Delo, O meni in Arhiv.
 *
 * Loceno od pogona v zapis.js z namenom: vse tri strani tecejo po isti
 * mehaniki, razlikujejo se le po besedah. Kdor popravlja besedilo, naj mu ni
 * treba brati drsenja in vrtiljaka.
 *
 * Uvod lahko dobi "ikona": kljuc iz nabora v zapis.js, ne oznake SVG - v
 * vsebini naj ne bo kode. Vrtiljak "kartice" je neobvezen; stran brez njega
 * se konca z zadnjim razdelkom.
 *
 * Oblika razdelka:
 *   { tip: "par", oznaka, naslov, telo, znacke?, slika }  besedilo in slika
 *   { tip: "par", obrnjen: true, ... }                    slika na levi
 *   { tip: "sirok", oznaka, naslov, telo }                cez celo sirino
 *   { tip: "skupine", oznaka, skupine: { ime: [znacke] } } stolpci znack
 *
 * "slika" je zaporedna stevilka v galeriji, ne pot - galerija se spreminja,
 * zaporedje pa ostaja. Strani imata razlicne stevilke, da se ne ponavljata.
 *
 * Naslovi lomijo vrstico z \n; pogon to prevede v <br>.
 *
 * Tu, za razliko od komentarjev in imen, pisemo s sumniki: to je edino
 * besedilo v projektu, ki ga bere obiskovalec.
 */

/** Delo: kaj sem zgradil in s cim. */
export const DELO = {
  uvod: {
    oznaka: "Delo",
    naslov: "Gradim programsko opremo\nin skrbim za sisteme pod njo.",
    vodilo:
      "Večina tega, kar sem zgradil, je nastala iz dejanske potrebe pri " +
      "delu – ne kot vaja.",
  },
  odseki: [
    {
      tip: "par",
      oznaka: "Kaj delam",
      naslov: "Strojna in programska oprema",
      telo:
        "Strežniško okolje, omrežja in tehnični sistemi na eni strani, celovit " +
        "razvoj aplikacij na drugi. Obojega ne ločujem – večina problemov " +
        "stoji ravno na meji med njima.",
      slika: strojnaSlika,
    },
    {
      tip: "par",
      obrnjen: true,
      oznaka: "Projekt",
      naslov: "Trace Space",
      telo:
        "Nadzorna plošča za senzorje kakovosti zraka in varnosti. Zbira " +
        "meritve, prepozna vzorce in opozori, preden postane težava.",
      znacke: ["Python", "Flask", "SQLite", "Nadzorne plošče"],
      // Pravi vmesnik aplikacije na izmisljenih podatkih.
      aplikacija: { pot: "demo/trace-space/index.html", ime: "Trace Space" },
      slika: traceSpaceSlika,
      // Vmesnik je lezec; v pokoncnem okvirju bi se mu odrezala polovica.
      razmerje: "3 / 2",
    },
    {
      tip: "par",
      oznaka: "Projekt",
      naslov: "Vantage",
      telo:
        "Aplikacija za odkrivanje, nastavljanje in vodenje omrežnih kamer. " +
        "Premičnim kameram hrani prednastavljene lege, tako da se z enim " +
        "klikom vrnejo natanko tja, kamor morajo gledati. Namesto desetih " +
        "ločenih vmesnikov ena površina, ki jih zna vse.",
      znacke: ["Python", "React", "TypeScript", "ONVIF", "PTZ", "SSE"],
      // Pravi vmesnik aplikacije, streznik nadomescajo izmisljeni podatki.
      aplikacija: { pot: "demo/vantage/index.html", ime: "Vantage" },
      slika: vantageSlika,
      // Plakat je lezec, kot pri Trace Space.
      razmerje: "3 / 2",
    },
    {
      tip: "sirok",
      oznaka: "Lastni projekti",
      naslov: "Računalniški vid v realnem času",
      telo:
        "Zaznavanje, prepoznavanje in sledenje predmetov z modeli YOLO, " +
        "napisano v C in razposlano kot samostojna aplikacija. Nastalo je " +
        "zunaj delovnih obveznosti.",
    },
    {
      tip: "skupine",
      oznaka: "S čim delam",
      skupine: {
        Jeziki: ["Python", "C", "JavaScript", "TypeScript", "HTML", "CSS", "SQL", "Bash"],
        "Ogrodja in orodja": ["React", "Vite", "Flask", "Three.js", "Node", "Git", "Docker"],
        Sistemi: ["Linux", "Windows Server", "Active Directory", "Omrežja", "Virtualizacija"],
        Področja: ["Računalniški vid", "Avtomatizacija", "Nadzorni sistemi", "Vgrajeni sistemi"],
      },
    },
  ],
  kartice: {
    oznaka: "Kako delam",
    seznam: [
      {
        oznaka: "Pristop",
        naslov: "Razumeti\nin uporabljati.",
        telo:
          "Sistem, ki ga ne razumem pod površjem, znam le upravljati. " +
          "Zanima me, zakaj deluje.",
      },
      {
        oznaka: "Metoda",
        naslov: "Raziskujem nove meje.",
        telo:
          "Nova tehnologija postane moja, ko z njo nekaj ustvarim. " +
          "Dokumentacija je začetek, izdelek je umetnost.",
      },
      {
        oznaka: "Merilo",
        naslov: "Deluje ali ne deluje.",
        telo:
          "Cilj ni zapletenost, ampak rešitev, ki dela in ki jo je čez pol " +
          "leta še mogoče razumeti.",
      },
      {
        oznaka: "Naprej",
        naslov: "Dovolj težko,\nda je zanimivo.",
        telo:
          "Zanima me delo, kjer se srečajo programska oprema, sistemi in " +
          "nove tehnologije.",
      },
    ],
  },
  konec: "Vedno gradim.",
};

/** O meni: kaj me zanima, ko me za to nihce ne placuje. */
export const OMENI = {
  uvod: {
    oznaka: "O meni",
    naslov: "Ni samo poklic.\nJe radovednost brez mej.",
    vodilo:
      "Kaj rad delam, kaj me potegne in zakaj večino stvari razstavim, " +
      "preden jih začnem uporabljati.",
  },
  odseki: [
    {
      tip: "par",
      oznaka: "Kaj rad delam",
      naslov: "Stvari, ki jih je mogoče\npogledati in obrniti.",
      telo:
        "Najraje delam tam, kjer se koda konča v nečem vidnem – v sliki, v " +
        "gibanju, v napravi, ki se odzove. Zaslon, ki nekaj pokaže, pove " +
        "več od izpisa v terminalu.",
      slika: 2,
    },
    {
      tip: "par",
      obrnjen: true,
      oznaka: "Kaj počnem v prostem času",
      naslov: "Tudi to stran\nsem naredil sam.",
      telo:
        "Zvezde v ozadju niso video. Brskalnik jih v živo izriše iz " +
        "desettisočih točk, zato se odzivajo na miško. Naredil sem jo, da " +
        "preverim, ali mi uspe.",
      znacke: ["Three.js", "WebGL", "Senčilniki", "Blender"],
      slika: 11,
    },
    {
      tip: "par",
      oznaka: "Kako se učim",
      naslov: "Dokler ne dela,\nnisem razumel.",
      telo:
        "Dokumentacijo preberem, potem pa jo zaprem in poskusim po spominu. " +
        "Razlaga, ki je ne znam sestaviti sam, ni razumevanje, ampak citat.",
      slika: 17,
    },
    {
      tip: "sirok",
      oznaka: "Kam me vleče",
      naslov: "Tja, kjer se računalništvo dotakne fizike",
      telo:
        "Svetloba, optika, gibanje, senzorji. Področja, kjer se rezultat ne " +
        "meri v vrsticah kode, ampak v tem, ali se na koncu nekaj premakne " +
        "ali prikaže tako, kot si zamislil.",
    },
    {
      tip: "skupine",
      oznaka: "Kaj me zanima",
      skupine: {
        "V tem projektu": ["Three.js", "WebGL", "Senčilniki", "Blender", "Vite", "Vanilla JS"],
        "Več časa bi rad dal": [
          "Realnočasovni grafiki",
          "Računalniškemu vidu",
          "Vgrajenim sistemom",
          "Optiki",
        ],
      },
    },
  ],
  kartice: {
    oznaka: "Kakšen sem pri delu",
    seznam: [
      {
        oznaka: "Radovednost",
        naslov: "Vprašanje je\nvedno zakaj.",
        telo:
          "Kako se nauči vsak. Zakaj tako in ne drugače je edino, kar " +
          "ostane uporabno čez leto dni.",
      },
      {
        oznaka: "Potrpljenje",
        naslov: "Prva različica\nni zadnja.",
        telo:
          "Najprej poskrbim, da deluje. Potem isto stvar popravljam in " +
          "poenostavljam, dokler ni res dobra.",
      },
      {
        oznaka: "Natančnost",
        naslov: "Pazim na\nmalenkosti.",
        telo:
          "Hitrost animacije, širina roba, kako se stran obnaša na telefonu. " +
          "Posamezno jih nihče ne opazi, skupaj pa se vidi razlika.",
      },
      {
        oznaka: "Mera",
        naslov: "Vem, kdaj je\ndovolj.",
        telo:
          "Popolno ne bo nikoli. Nekje se ustavim in stvar pokažem – šele " +
          "takrat izvem, ali je res dobra.",
      },
    ],
  },
  konec: "Če te kaj od tega zanima, mi piši.",
};

/**
 * Arhiv: koncane stvari, ki jih ne razvijam naprej.
 *
 * Namenoma kratek. Arhiv, ki ima vec vsebine od Dela, pove, da je najboljse
 * ze za tabo - zato tu stojita dve stvari in ne deset.
 *
 * Racunalniski vid stoji tudi pod Delom. Tam je dokaz, kaj znam narediti
 * zunaj delovnih obveznosti, tu pa dokaz, od kod to prihaja.
 */
export const ARHIV = {
  uvod: {
    oznaka: "Arhiv",
    ikona: "arhiv",
    naslov: "Dobrodošel v arhivu.",
    vodilo:
      "Stvari, ki so končane in jih ne razvijam naprej. Tu so, ker sem se ob " +
      "njih nekaj naučil in ker je pošteno pokazati tudi, kje sem začel.",
  },
  odseki: [
    {
      tip: "par",
      oznaka: "2024",
      naslov: "Zaznavanje in sledenje\nv realnem času",
      telo:
        "Modeli YOLO, napisano v C in razposlano kot samostojna aplikacija. " +
        "Prepozna predmete v sliki, jim sledi med sličicami in obdrži " +
        "identiteto, tudi ko za trenutek izginejo za nečim drugim.",
      znacke: ["C", "YOLO", "Računalniški vid", "Realni čas"],
      slika: 23,
    },
    {
      tip: "par",
      obrnjen: true,
      oznaka: "Starejše",
      naslov: "Simulacija rulete",
      telo:
        "Simulator, ki odigra milijone vrtljajev in preveri strategije, ki na " +
        "papirju zvenijo logično. Rezultat je vsakič isti: hiša ima svoj " +
        "odstotek in ta se z nobenim sistemom ne obrabi.",
      znacke: ["Verjetnost", "Simulacija"],
      slika: 31,
    },
  ],
  konec: "Kar je tu, je končano. Kar nastaja, je pod Delo.",
};

/**
 * Zacetna stran: predstavitev pod galaksijo, ko se pomaknes navzdol.
 *
 * Napisana po zivljenjepisu, a z besedami, s katerimi bi se predstavil v zivo.
 * Namenoma brez telefona, naslova in datuma rojstva - ti so v zivljenjepisu,
 * ne na javni strani. {starost} se izracuna sproti, da ne zastari.
 */
export const DOMOV = {
  namig: "Pomakni se navzdol",
  uvod: {
    pozdrav: "Živjo, jaz sem Jure.",
    vodilo:
      "Star sem {starost} let, živim v Ljubljani in večino dneva preživim med " +
      "strežniki, kabli in kodo. Tukaj je malo več o meni – brez uradnega " +
      "jezika iz življenjepisa.",
  },
  poglavja: [
    {
      oznaka: "Kako se je začelo",
      naslov: "Najprej šola,\npotem prava IT pisarna.",
      telo: [
        "Na Srednji šoli tehniških strok Šiška sem se izšolal za tehnika " +
          "računalništva in jo končal z nadpovprečnim uspehom. Programiranje, " +
          "baze, omrežja – tam sem prvič ugotovil, da me to res vleče.",
        "Še med šolanjem sem bil na praksi v IT oddelku Telekoma Slovenije. " +
          "Postavljal sem računalnike, pripravljal delovna mesta za nove " +
          "sodelavce, prenašal opremo in hodil na teren. Ni bilo glamurozno, " +
          "sem pa videl, kako IT deluje, ko se nanj zanaša na stotine ljudi.",
      ],
    },
    {
      oznaka: "Ovinek",
      naslov: "Ekonomija ni bila zame.\nIn to je čisto v redu.",
      telo: [
        "Po srednji šoli sem se vpisal na Ekonomsko fakulteto. Naučil sem se " +
          "veliko o tem, kako delujejo podjetja in poslovni procesi – in " +
          "ugotovil, da se v ekonomiji ne vidim. Zato sem se vrnil tja, kjer " +
          "mi čas mine, ne da bi opazil.",
      ],
    },
    {
      oznaka: "Danes",
      naslov: "IT tehnik v podjetju VTZ,\nod decembra 2025.",
      telo: [
        "Moj dan je redko dvakrat enak. Enkrat pripravljam strežnik in urejam " +
          "domeno v Active Directoryju, drugič nastavljam Cisco stikala ali " +
          "vlečem kable in montiram opremo.",
        "Delam z videonadzorom na Avigilon Unity 8 – zanj imam tudi certifikat –, " +
          "s kontrolo dostopa, požarnimi centralami, senzorji in mikrokontrolerji. " +
          "Za podjetje sem razvil tudi interno aplikacijo. Tam se strojna in " +
          "programska oprema srečata in tam se počutim najbolj doma.",
      ],
    },
  ],
  pot: {
    oznaka: "Moja pot",
    koraki: [
      { cas: "2019 – 2024", naslov: "SŠTS Šiška", opis: "Tehnik računalništva" },
      { cas: "2021 – 2022", naslov: "Telekom Slovenije", opis: "Praksa v IT oddelku" },
      { cas: "2024", naslov: "Šolski pulover", opis: "Moj dizajn je zmagal na natečaju." },
      { cas: "2024", naslov: "Ekonomska fakulteta", opis: "Poskusil sem in izvedel, kaj nočem." },
      { cas: "2025 –", naslov: "VTZ d.o.o.", opis: "IT tehnik" },
    ],
  },
  prosti: {
    oznaka: "Ko ne delam",
    naslov: "Žoga, hribi\nin Blender.",
    telo: [
      "Igram košarko in odbojko, pozimi smučam in drsam, poleti plavam, ko je " +
        "le priložnost, pa grem v hribe ali kam na pot. Šport mi vrne energijo, " +
        "ki jo pojedo zasloni.",
      "Rad tudi ustvarjam – fotografiram, oblikujem in montiram video. Sledim " +
        "novim procesorjem, telefonom in umetni inteligenci. Dve moji animaciji:",
    ],
    dela: [
      {
        ime: "Očala",
        opis: "Animacija na eno samo besedo. Izbral sem virtualna očala.",
        url: "https://youtu.be/QfAUvNHwMSI",
      },
      {
        ime: "Snežak",
        opis: "3D animacija v Blenderju, moja maturitetna naloga, dodelana v Premieru.",
        url: "https://youtu.be/Fm_bdeKcgGg",
      },
    ],
  },
  znanja: {
    oznaka: "Kaj znam",
    vodilo:
      "Sem zanesljiv, novih stvari se hitro naučim in dobro delam v ekipi – ali " +
      "sam, če je treba.",
    skupine: {
      Programiranje: ["Python", "C", "PHP", "TypeScript", "HTML5", "CSS", "Vite"],
      "Sistemi in omrežja": ["Active Directory", "Cisco", "Windows 10 / 11", "Omrežja", "Strojna oprema", "Baze podatkov"],
      Ustvarjanje: ["Blender", "Premiere Pro", "After Effects", "Photoshop"],
      Pisarna: ["Word", "Excel", "PowerPoint", "Access"],
    },
  },
  konec: {
    naslov: "Prišel si do konca?\nPotem se slišiva.",
    telo: "Najlažje me dobiš po e-pošti.",
    gumb: "Piši mi",
  },
};
