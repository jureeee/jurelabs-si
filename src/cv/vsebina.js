/**
 * Besedilo strani Delo in O meni.
 *
 * Loceno od pogona v zapis.js z namenom: obe strani teceta po isti mehaniki,
 * razlikujeta se le po besedah. Kdor popravlja besedilo, naj mu ni treba
 * brati drsenja in vrtiljaka.
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
      naslov: "Strojna in programska oprema,\nne eno ali drugo.",
      telo:
        "Strežniško okolje, omrežja in tehnični sistemi na eni strani, poln " +
        "razvoj aplikacij na drugi. Obojega ne ločujem – večina problemov " +
        "stoji ravno na meji med njima.",
      slika: 1,
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
      slika: 4,
    },
    {
      tip: "par",
      oznaka: "Projekt",
      naslov: "Vantage",
      telo:
        "Aplikacija za odkrivanje, nastavljanje in vodenje omrežnih kamer " +
        "ter njihovih leg. Namesto desetih ločenih vmesnikov ena površina, " +
        "ki jih zna vse.",
      znacke: ["Python", "React", "TypeScript", "ONVIF", "SSE"],
      slika: 7,
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
        naslov: "Razumeti,\nne le uporabiti.",
        telo:
          "Sistem, ki ga ne razumem pod površjem, znam le upravljati. " +
          "Zanima me, zakaj deluje.",
      },
      {
        oznaka: "Metoda",
        naslov: "Učim se z gradnjo.",
        telo:
          "Nova tehnologija postane moja šele, ko z njo nekaj nastane. " +
          "Dokumentacija je začetek, ne konec.",
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
  konec: "Še vedno gradim.",
};

/** O meni: kaj me zanima, ko me za to nihce ne placuje. */
export const OMENI = {
  uvod: {
    oznaka: "O meni",
    naslov: "Preden je bil to poklic,\nje bila radovednost.",
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
      oznaka: "Zunaj službe",
      naslov: "Tudi ta stran\nje eden takih projektov.",
      telo:
        "Galaksija v ozadju ni slika. So točke, ki jih grafična kartica " +
        "izriše znova ob vsaki sličici, s svojim senčilnikom in svojim " +
        "sijem. Nastala je iz vprašanja, ali znam.",
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
        naslov: "Osma različica.",
        telo:
          "Prva različica je le dokaz, da je izvedljivo. Zanimivo postane " +
          "šele, ko ji začnem odvzemati.",
      },
      {
        oznaka: "Okus",
        naslov: "Detajl, ki ga\nnihče ne opazi.",
        telo:
          "Zamik animacije, širina roba, obnašanje ob robu zaslona. Skupaj " +
          "se pozna, posamič ne.",
      },
      {
        oznaka: "Mera",
        naslov: "Konec ni\npopolnost.",
        telo:
          "Nekje je treba nehati in stvar pokazati. Sicer nikoli ne izve, " +
          "ali je dobra.",
      },
    ],
  },
  konec: "Če te kaj od tega zanima, mi piši.",
};
