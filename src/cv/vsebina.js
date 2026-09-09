/**
 * Besedilo strani Delo in O meni.
 *
 * Loceno od pogona v zapis.js z namenom: obe strani teceta po isti
 * mehaniki, razlikujeta se le po besedah. Kdor popravlja besedilo, naj mu ni
 * treba brati drsenja in vrtiljaka.
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
 */

/** Delo: kaj sem zgradil in s cim. */
export const DELO = {
  uvod: {
    oznaka: "Delo",
    naslov: "Gradim programsko opremo\nin sisteme, na katerih tece.",
    vodilo:
      "Delam na presecisu razvoja, infrastrukture in tehnicnih sistemov. " +
      "Vecina tega, kar sem zgradil, je nastala iz dejanske potrebe pri delu.",
  },
  odseki: [
    {
      tip: "par",
      oznaka: "Kaj delam",
      naslov: "Strojna in programska oprema,\nne eno ali drugo.",
      telo:
        "Streznisko okolje, omrezja in tehnicni sistemi na eni strani, polni " +
        "razvoj aplikacij na drugi. Obojega ne locujem - vecina problemov " +
        "stoji ravno na meji med njima.",
      slika: 1,
    },
    {
      tip: "par",
      obrnjen: true,
      oznaka: "Projekt",
      naslov: "Trace Space",
      telo:
        "Nadzorna plosca za senzorje kakovosti zraka in varnosti. Zbira " +
        "meritve, prepozna vzorce in opozori, preden postane tezava.",
      znacke: ["Python", "Flask", "SQLite", "Nadzorne plosce"],
      slika: 4,
    },
    {
      tip: "par",
      oznaka: "Projekt",
      naslov: "Vantage",
      telo:
        "Aplikacija za odkrivanje, nastavljanje in vodenje omreznih kamer ter " +
        "njihovih leg. Namesto desetih locenih vmesnikov ena povrsina, ki jih " +
        "zna vse.",
      znacke: ["Python", "React", "TypeScript", "ONVIF", "SSE"],
      slika: 7,
    },
    {
      tip: "sirok",
      oznaka: "Lastni projekti",
      naslov: "Racunalniski vid v realnem casu",
      telo:
        "Zaznavanje, prepoznavanje in sledenje predmetov z modeli YOLO, " +
        "napisano v C in razposlano kot samostojna aplikacija. Nastalo je " +
        "zunaj delovnih obveznosti.",
    },
    {
      tip: "skupine",
      oznaka: "S cim delam",
      skupine: {
        Jeziki: ["Python", "C", "JavaScript", "TypeScript", "HTML", "CSS", "SQL", "Bash"],
        "Ogrodja in orodja": ["React", "Vite", "Flask", "Three.js", "Node", "Git", "Docker"],
        Sistemi: ["Linux", "Windows Server", "Active Directory", "Omrezja", "Virtualizacija"],
        Podrocja: ["Racunalniski vid", "Avtomatizacija", "Nadzorni sistemi", "Vgrajeni sistemi"],
      },
    },
  ],
  kartice: {
    oznaka: "Kako delam",
    seznam: [
      {
        oznaka: "Pristop",
        naslov: "Razumeti,\nne le uporabiti.",
        telo: "Sistem, ki ga ne razumem pod povrsjem, znam le upravljati. Zanima me, zakaj deluje.",
      },
      {
        oznaka: "Metoda",
        naslov: "Ucim se z gradnjo.",
        telo: "Nova tehnologija postane moja sele, ko z njo nekaj nastane. Dokumentacija je zacetek, ne konec.",
      },
      {
        oznaka: "Merilo",
        naslov: "Deluje ali ne deluje.",
        telo: "Cilj ni zapletenost, ampak resitev, ki dela in ki jo je cez pol leta se mogoce razumeti.",
      },
      {
        oznaka: "Naprej",
        naslov: "Dovolj tezko,\nda je zanimivo.",
        telo: "Zanima me delo, kjer se srecajo programska oprema, sistemi in nove tehnologije.",
      },
    ],
  },
  konec: "Se vedno gradim.",
};

/** O meni: kaj me zanima, ko me za to nihce ne placuje. */
export const OMENI = {
  uvod: {
    oznaka: "O meni",
    naslov: "Preden je bil to poklic,\nje bila radovednost.",
    vodilo:
      "Kaj rad delam, kaj me potegne in zakaj vecino stvari razstavim, " +
      "preden jih zacnem uporabljati.",
  },
  odseki: [
    {
      tip: "par",
      oznaka: "Kaj rad delam",
      naslov: "Stvari, ki jih je mogoce\npogledati in obrniti.",
      telo:
        "Najraje delam tam, kjer se koda konca v necem vidnem - v sliki, v " +
        "gibanju, v napravi, ki se odzove. Zaslon, ki nekaj pokaze, pove vec " +
        "od izpisa v terminalu.",
      slika: 2,
    },
    {
      tip: "par",
      obrnjen: true,
      oznaka: "Zunaj sluzbe",
      naslov: "Tudi ta stran\nje eden takih projektov.",
      telo:
        "Galaksija v ozadju ni slika. So tocke, ki jih graficna kartica " +
        "izrise znova ob vsaki slicici, s svojim sencilnikom in svojim sijem. " +
        "Nastala je iz vprasanja, ali znam.",
      znacke: ["Three.js", "WebGL", "Sencilniki", "Blender"],
      slika: 11,
    },
    {
      tip: "par",
      oznaka: "Kako se ucim",
      naslov: "Dokler ne dela,\nnisem razumel.",
      telo:
        "Dokumentacijo preberem, potem pa jo zaprem in poskusim po spominu. " +
        "Razlaga, ki je ne znam sestaviti sam, ni razumevanje, ampak citat.",
      slika: 17,
    },
    {
      tip: "sirok",
      oznaka: "Kam me vlece",
      naslov: "Tja, kjer se racunalnistvo dotakne fizike",
      telo:
        "Svetloba, optika, gibanje, senzorji. Podrocja, kjer se rezultat ne " +
        "meri v vrsticah kode, ampak v tem, ali se na koncu nekaj premakne " +
        "ali prikaze tako, kot si zamislil.",
    },
    {
      tip: "skupine",
      oznaka: "Kaj me zanima",
      skupine: {
        "V tem projektu": ["Three.js", "WebGL", "Sencilniki", "Blender", "Vite", "Vanilla JS"],
        "Vec casa bi rad dal": ["Realnocasovni grafiki", "Racunalniskemu vidu", "Vgrajenim sistemom", "Optiki"],
      },
    },
  ],
  kartice: {
    oznaka: "Kaksen sem pri delu",
    seznam: [
      {
        oznaka: "Radovednost",
        naslov: "Vprasanje je\nvedno zakaj.",
        telo: "Kako se nauci vsak. Zakaj tako in ne drugace je edino, kar ostane uporabno cez leto dni.",
      },
      {
        oznaka: "Potrpljenje",
        naslov: "Osma razlicica.",
        telo: "Prva razlicica je le dokaz, da je izvedljivo. Zanimivo postane sele, ko jo zacnem odvzemati.",
      },
      {
        oznaka: "Okus",
        naslov: "Detajl, ki ga\nnihce ne opazi.",
        telo: "Zamik animacije, sirina roba, obnasanje ob robu zaslona. Skupaj se pozna, posamic ne.",
      },
      {
        oznaka: "Mera",
        naslov: "Konec ni\npopolnost.",
        telo: "Nekje je treba nehati in stvar pokazati. Sicer nikoli ne izve, ali je dobra.",
      },
    ],
  },
  konec: "Ce te kaj od tega zanima, mi pisi.",
};
