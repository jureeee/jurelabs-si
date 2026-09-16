import strojnaSlika from "../assets/zapis/strojna-programska.webp";
import traceSpaceSlika from "../assets/zapis/trace-space.webp";
import vantageSlika from "../assets/zapis/vantage.webp";
import ruletaSlika from "../assets/zapis/ruleta.webp";
import yoloSlika from "../assets/zapis/yolo.webp";

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
      "Ko imam čas, gradim svoje ideje. Ne zmanjka jih in vsaka naslednja " +
      "je boljša. Iščem projekte, kjer je še veliko neodkritega.",
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
    naslov: "Vsi projekti\nna enem mestu.",
    vodilo:
      "Od zadnjega do prvega. Nekateri še živijo in rastejo, drugi so " +
      "končani – vsak me je nekaj naučil.",
  },
  odseki: [
    {
      tip: "par",
      oznaka: "2026 · v uporabi",
      naslov: "Trace Space",
      telo:
        "Nadzorna plošča za senzorje kakovosti zraka in varnosti. Zbira " +
        "meritve, prepozna vzorce in opozori, preden postane težava.",
      znacke: ["Python", "Flask", "SQLite", "Nadzorne plošče"],
      aplikacija: { pot: "demo/trace-space/index.html", ime: "Trace Space" },
      slika: traceSpaceSlika,
      razmerje: "3 / 2",
    },
    {
      tip: "par",
      obrnjen: true,
      oznaka: "2026 · v uporabi",
      naslov: "Vantage",
      telo:
        "Aplikacija za odkrivanje, nastavljanje in vodenje omrežnih kamer. " +
        "Premičnim kameram hrani prednastavljene lege, tako da se z enim " +
        "klikom vrnejo natanko tja, kamor morajo gledati.",
      znacke: ["Python", "React", "TypeScript", "ONVIF", "PTZ", "SSE"],
      aplikacija: { pot: "demo/vantage/index.html", ime: "Vantage" },
      slika: vantageSlika,
      razmerje: "3 / 2",
    },
    {
      tip: "par",
      oznaka: "2026 · živo",
      naslov: "Ta stran",
      telo:
        "Galaksija v ozadju ni video. Brskalnik jo izriše v živo iz " +
        "desettisočih točk, z lastnim senčilnikom in sijem. Vse, kar vidiš, " +
        "je narejeno brez ogrodja.",
      znacke: ["Three.js", "WebGL", "Senčilniki", "Vite"],
      slika: 11,
    },
    {
      tip: "par",
      obrnjen: true,
      oznaka: "2024 · končano",
      naslov: "Zaznavanje in sledenje\nv realnem času",
      telo:
        "Modeli YOLO, napisano v C in razposlano kot samostojna aplikacija. " +
        "Prepozna predmete v sliki, jim sledi med sličicami in obdrži " +
        "identiteto, tudi ko za trenutek izginejo za nečim drugim.",
      znacke: ["C", "YOLO", "Računalniški vid", "Realni čas"],
      slika: yoloSlika,
      // Posnetek je pokoncen, tak kot pride iz telefona.
      razmerje: "3 / 4",
    },
    {
      tip: "par",
      oznaka: "Starejše · končano",
      naslov: "Simulacija rulete",
      telo:
        "Simulator, ki odigra milijone vrtljajev in preveri strategije, ki na " +
        "papirju zvenijo logično. Rezultat je vsakič isti: hiša ima svoj " +
        "odstotek in ta se z nobenim sistemom ne obrabi.",
      znacke: ["Verjetnost", "Simulacija"],
      slika: ruletaSlika,
      // Slika je lezeca; v pokoncnem okvirju bi ostala polovica mize zunaj.
      razmerje: "16 / 9",
    },
  ],
  konec: "Seznam raste. Kar je pod Delo, je tisto, kar zdaj največ uporabljam.",
};


/**
 * Zacetna stran: predstavitev pod galaksijo, ko se pomaknes navzdol.
 *
 * Besedilo je lastnikovo. Naslovi so namenoma v anglescini, telo v
 * slovenscini. {starost} se izracuna sproti, da ne zastari. Povezava brez
 * naslova (url: "") se ne izrise - tako GitHub in LinkedIn cakata na pravi
 * naslov in ne vodita v prazno.
 */
export const DOMOV = {
  namig: "Pomakni se navzdol",
  uvod: {
    ime: "Jure Blatnik",
    naslov: "I build things\nthat work.",
    podrocja: "IT Systems · Infrastructure · Software · Security",
    telo: [
      "Najbolj me zanima razvoj novih tehnologij in smer, v katero se računalništvo " +
        "premika — od AI in novih programskih rešitev do naprednih sistemov, naprav in " +
        "infrastrukture.",
      "Najbolj me pritegnejo zahtevne naloge, kjer rešitev ni očitna in je treba res " +
        "razmišljati.",
    ],
    kraj: "{starost} · Ljubljana, Slovenia",
    gumbi: [
      { besedilo: "Explore my work", stran: "delo" },
      { besedilo: "Contact", stran: "stik" },
    ],
  },
  omeni: {
    oznaka: "About",
    naslov: "How I work.",
    telo: [
      "Sem tehnik računalništva z močnim praktičnim pristopom.",
      "Moje delo sega od razvoja aplikacij in konfiguracije omrežij do strežnikov, video " +
        "nadzornih sistemov, senzorjev, mikrokontrolerjev in druge infrastrukture.",
      "Najbolj me vlečejo zahtevni projekti brez očitne rešitve, kjer lahko iz nove ideje " +
        "zgradim nekaj tehnično naprednega in vizualno dovršenega.",
      "Rad razumem celoten sistem — kako je zgrajen, kako komunicira, zakaj odpove in kako " +
        "ga izboljšati.",
    ],
  },
  pot: {
    oznaka: "Moja pot",
    koraki: [
      { cas: "2021 – 2022", naslov: "Telekom Slovenije", opis: "Prvo pravo IT okolje – praksa v IT oddelku." },
      { cas: "2022 – 2024", naslov: "SŠTS Šiška", opis: "Tehnik računalništva." },
      { cas: "2024", naslov: "Zmagovalni dizajn", opis: "Moj dizajn je postal šolski pulover." },
      { cas: "2024", naslov: "Ekonomska fakulteta", opis: "Poskusil sem in ugotovil, da me vleče tehnika." },
      { cas: "2025 – danes", naslov: "VTZ d.o.o.", opis: "IT tehnik, certifikat Avigilon Unity 8." },
    ],
  },
  izkusnje: {
    oznaka: "Experience",
    seznam: [
      {
        podjetje: "VTZ",
        vloga: "IT Technician",
        cas: "2025 — Present",
        telo: [
          "Delam na presečišču IT infrastrukture, omrežij, varnostnih sistemov in razvoja.",
          "Moje delo vključuje konfiguracijo in diagnostiko strežnikov, delo z Active " +
            "Directory okolji, omrežno infrastrukturo in Cisco opremo ter deployment " +
            "tehničnih sistemov.",
          "Sodelujem tudi pri integraciji CCTV sistemov, kontrole dostopa, senzorjev, " +
            "mikrokontrolerjev in druge povezane infrastrukture.",
          "Za potrebe podjetja sem razvil tudi interno programsko rešitev, ki je postala del " +
            "mojega praktičnega razvoja na področju software engineeringa.",
        ],
        certifikat: "Avigilon Unity 8 Certified",
        znacke: ["Servers", "Networking", "Active Directory", "Cisco", "CCTV", "Access Control", "IoT", "Software"],
      },
      {
        podjetje: "Telekom Slovenije",
        vloga: "IT Department",
        cas: "2021 — 2022",
        telo: [
          "Moje prvo profesionalno IT okolje.",
          "Med praktičnim usposabljanjem sem sodeloval pri deploymentu računalniške opreme, " +
            "pripravi delovnih mest in podpori IT infrastrukture.",
          "Izkušnja mi je prvič pokazala, kako deluje IT v velikem poslovnem okolju in me " +
            "usmerila v praktično delo z računalniškimi sistemi.",
        ],
      },
    ],
  },
  dela: {
    oznaka: "Selected work",
    seznam: [
      {
        naslov: "Internal Software",
        telo: [
          "Razvoj interne aplikacije za potrebe podjetja.",
          "Od ideje in uporabniškega problema do dejanske rešitve, uporabljene v realnem okolju.",
        ],
        podrocja: "Software · UI · Workflow Automation",
      },
      {
        naslov: "Infrastructure & Security Systems",
        telo: [
          "Delo z omrežji, strežniki, video nadzorom, kontrolo dostopa ter integracijo " +
            "fizičnih in digitalnih sistemov.",
        ],
        podrocja: "Networking · Servers · CCTV · Access Control",
      },
      {
        naslov: "Connected Systems",
        telo: [
          "Integracija naprav, senzorjev in mikrokontrolerjev ter testiranje komunikacije med " +
            "različnimi deli sistema.",
        ],
        podrocja: "Sensors · Microcontrollers · IoT",
      },
    ],
  },
  lab: {
    oznaka: "Lab",
    naslov: "Building beyond work.",
    telo: [
      "Velik del stvari, ki jih znam, sem se naučil tako, da sem jih preprosto začel graditi.",
      "Eksperimentiram z aplikacijami, AI sistemi, 3D okolji, računalniško vizualizacijo in " +
        "interaktivnimi spletnimi projekti.",
    ],
    poudarki: ["Nekateri postanejo resni projekti.", "Drugi ostanejo eksperimenti.", "Oboji me naučijo nekaj novega."],
    gumb: { besedilo: "Enter the Lab →", stran: "arhiv" },
  },
  znanja: {
    oznaka: "Capabilities",
    skupine: {
      Development: ["Python", "TypeScript", "JavaScript", "HTML / CSS", "PHP", "C", "Vite", "Databases"],
      Systems: ["Windows", "Active Directory", "Servers", "Hardware", "Deployment", "Diagnostics"],
      Networking: ["Cisco", "TCP/IP", "Network configuration", "Switching", "Device integration"],
      "Security & Connected Systems": ["Avigilon Unity", "CCTV", "Access Control", "Sensors", "Microcontrollers"],
      Creative: ["Blender", "Photoshop", "Premiere Pro", "After Effects", "3D", "Motion Design"],
    },
  },
  izobrazba: {
    oznaka: "Education",
    naslov: "Computer Science Technician",
    kraj: "SŠTS Šiška · Ljubljana",
    telo:
      "Izobraževanje na področju razvoja programske opreme, podatkovnih baz, računalniških " +
      "omrežij in informacijskih sistemov.",
  },
  druga: {
    oznaka: "Another side",
    naslov: "Tehnologija ni moje edino področje.",
    telo: [
      "Ukvarjam se tudi z oblikovanjem, 3D grafiko, fotografijo in video produkcijo.",
      "V srednji šoli je bil moj dizajn izbran kot zmagovalni dizajn šolskega puloverja.",
      "Ta kombinacija tehničnega in vizualnega razmišljanja precej vpliva tudi na način, kako " +
        "gradim svoje projekte.",
    ],
  },
  stik: {
    oznaka: "Contact",
    naslov: "Let's build\nsomething.",
    kraj: "Ljubljana, Slovenia",
    eposta: "jure.blatnik10@gmail.com",
    povezave: [
      { ime: "GitHub", url: "" },
      { ime: "LinkedIn", url: "" },
      { ime: "Email", url: "mailto:jure.blatnik10@gmail.com" },
    ],
  },
};
