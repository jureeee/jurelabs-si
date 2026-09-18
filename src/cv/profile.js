/**
 * Profil.
 *
 * Vsebina lezi neposredno cez galaksijo - brez plosce. Zadaj je le 2 px
 * zameglitve, dovolj da se besedilo loci od zvezd, premalo da bi galaksijo
 * skrilo.
 *
 * Virtualizacija: mreza ima 137 datotek, od tega 64 videov. Ce bi jih
 * nalozili vse, bi brskalnik potegnil 171 MB in poganjal 64 dekoderjev hkrati.
 * Zato ima vsako polje src prazen, dokler ne pride na zaslon; ko ga zapusti,
 * se video ustavi. Nalaganje in predvajanje sta torej vezana na vidnost, ne
 * na obstoj v dokumentu.
 */

import "./profile.css";
import avatarUrl from "../assets/media/profile picture.webp";
import { mediji } from "./mediji.js";
import { obJeziku, t } from "./jezik.js";
import { namestiLebdenje } from "./lebdenje.js";
import { oziviBesedilo } from "./crke.js";
import { nastavitve } from "./settings.js";

const IKONA_ZAPRI =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
/** Ikona za razporeditev - tri crte padajocih dolzin, kot v iOS. */
const IKONA_KLJUKICA =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l6 6L20 6"/></svg>';
const IKONA_RAZPORED =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M4 7h16M6.5 12h11M9.5 17h5"/></svg>';
const IKONA_VEC =
  '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="18.5" cy="12" r="1.9"/></svg>';
const IKONA_VIDEO =
  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4.5v15l15-7.5z"/></svg>';

const PODATKI = {
  ime: "blatnikjuree",
  pravo: "Jure",
  bio: "✨ Če ne ujamem zvezd, pridem po tebe.",
  sledilcev: 325,
  sledi: 169,
};

/**
 * Seznam vseh medijev. Glob vrne le naslove (nize), zato tu se nic ne
 * potuje po mrezi - datoteka se prenese sele, ko polje dobi src.
 */

/**
 * Vrsta z zamikom.
 *
 * Ko pride na zaslon cela vrsta polj hkrati, bi jih hkratno nalaganje in
 * hkratna animacija zasekala. Tu se obdelajo eno za drugim z zamikom, ki je
 * krajsi od animacije - naslednje se torej zacne, preden se prejsnje konca,
 * in gib se bere kot zaporedje, ne kot cakanje v koloni.
 */
function narediVrsto(zamik, opravilo) {
  const cakajo = [];
  let tece = false;

  function naprej() {
    const el = cakajo.shift();
    if (!el) {
      tece = false;
      return;
    }
    opravilo(el);
    // setTimeout in ne rAF: na skriti strani rAF ne tece in vrsta bi obstala.
    setTimeout(naprej, zamik);
  }

  return (el) => {
    cakajo.push(el);
    if (tece) return;
    tece = true;
    naprej();
  };
}

/** Val pod prstom, izvira iz tocke dotika. */
function val(el, event) {
  const r = el.getBoundingClientRect();
  const premer = Math.max(r.width, r.height) * 2.2;
  const v = document.createElement("span");
  v.className = "val";
  v.style.width = v.style.height = `${premer}px`;
  v.style.left = `${(event?.clientX ?? r.left + r.width / 2) - r.left - premer / 2}px`;
  v.style.top = `${(event?.clientY ?? r.top + r.height / 2) - r.top - premer / 2}px`;
  el.appendChild(v);
  v.addEventListener("animationend", () => v.remove());
}

/** Squish ob prehodu miske in val ob pritisku, za vse gumbe znotraj korena. */
function ozivi(koren) {
  koren.addEventListener("pointerdown", (e) => {
    const b = e.target instanceof Element ? e.target.closest("button, .prof-polje") : null;
    if (b) val(b, e);
  });
  koren.addEventListener("pointerover", (e) => {
    const b = e.target instanceof Element ? e.target.closest("button") : null;
    if (!b || b.classList.contains("squish")) return;
    b.classList.add("squish");
    b.addEventListener("animationend", () => b.classList.remove("squish"), { once: true });
  });
}

/**
 * Mirujoca slicica videa za sij pod njim.
 *
 * Majhna, ker je sij tako ali tako zabrisan za 26 pik - vec pik bi pomenilo
 * le vec dela za isto meglo.
 */
function narisiSij(platno, video) {
  const w = 48;
  const h = Math.max(1, Math.round((w * video.videoHeight) / Math.max(1, video.videoWidth)));
  platno.width = w;
  platno.height = h;
  try {
    platno.getContext("2d").drawImage(video, 0, 0, w, h);
  } catch {
    // Ce slicice ni mogoce narisati, sij ostane prazen; polje samo ni prizadeto.
  }
}

export function installProfile({ onOdprt, onZaprt } = {}) {
  const koren = document.createElement("div");
  koren.className = "prof";
  koren.innerHTML = `
    <div class="prof-zavesa"></div>
    <div class="prof-rob"></div>
    <button class="prof-zapri dg" type="button" aria-label="Zapri">${IKONA_ZAPRI}</button>
    <div class="prof-vsebina">
      <div class="prof-glava prof-del" style="--i:0">
        <div class="prof-avatar-ovoj">
          <div class="prof-avatar"><img alt="" src="${avatarUrl}" /></div>
        </div>
        <div class="prof-desno">
          <div class="prof-ime">${PODATKI.ime}</div>
          <div class="prof-pravo">${PODATKI.pravo}</div>
          <div class="prof-stevci">
            <span class="prof-stevec"><b>${mediji.length}</b><span class="prof-beseda">objav</span></span>
            <span class="prof-stevec"><b>${PODATKI.sledilcev}</b><span class="prof-beseda">sledilcev</span></span>
            <span class="prof-stevec"><b>${PODATKI.sledi}</b><span class="prof-beseda">sledi</span></span>
          </div>
          <div class="prof-bio">${PODATKI.bio}</div>
          <div class="prof-gumbi">
            <button class="prof-gumb dg" type="button">Uredi profil</button>
            <button class="prof-gumb dg" type="button">Arhiv</button>
            <button class="prof-vec dg" type="button" aria-label="Razporeditev">${IKONA_VEC}</button>
          </div>
        </div>
      </div>

      <div class="prof-zgodbe prof-del" style="--i:1"></div>

      <div class="prof-zavihki prof-del" style="--i:2" role="tablist">
        <button class="prof-zavihek dg" type="button" role="tab" aria-selected="true">Objave</button>
        <button class="prof-zavihek dg" type="button" role="tab" aria-selected="false">Shranjeno</button>
        <button class="prof-zavihek dg" type="button" role="tab" aria-selected="false">Označeno</button>
        <button class="prof-razpored dg" type="button" aria-label="Razporeditev">${IKONA_RAZPORED}</button>
      </div>

      <div class="prof-mreza prof-del" style="--i:3"></div>
    </div>`;
  document.body.appendChild(koren);
  // Slog profila iz nastavitev: "nov" ali "star". Vse razlike so v slogu,
  // oznake so iste - zato menjava ne potrebuje ponovne gradnje.
  koren.dataset.slog = nastavitve.profilSlog;

  const mreza = koren.querySelector(".prof-mreza");
  const zgodbe = koren.querySelector(".prof-zgodbe");

  /** Besedilo profila prileti po znakih. */
  const oziviProfil = () =>
    oziviBesedilo(koren, {
      tok: koren,
      izbor: ".prof-ime, .prof-pravo, .prof-bio, .prof-stevec, .prof-gumb, .prof-zavihek",
    });
  oziviProfil();

  // --- zgodbe: prvih nekaj slik ---
  mediji
    .filter((m) => !m.video)
    .slice(0, 6)
    .forEach((m) => {
      const z = document.createElement("button");
      z.className = "prof-zgodba dg";
      z.type = "button";
      z.innerHTML = `<img alt="" loading="lazy" src="${m.url}" />`;
      zgodbe.appendChild(z);
    });

  // --- mreza: polja so prazna, dokler ne pridejo na zaslon ---
  mediji.forEach((m) => {
    const polje = document.createElement("div");
    polje.className = "prof-polje";
    polje.dataset.url = m.url;
    polje.dataset.video = String(m.video);
    if (m.video) polje.innerHTML = `<span class="prof-video-znak">${IKONA_VIDEO}</span>`;
    mreza.appendChild(polje);
  });

  /**
   * Predpriprava prvega zaslona.
   *
   * Polja so prazna, dokler opazovalec ne pove, da so v pogledu - torej se
   * nic ne prenese, dokler ne klikneš na profil. Prvi zaslon si zato vsakic
   * zasluzi kratko cakanje.
   *
   * Odkar so slike stisnjene, je prvi zaslon skupaj vreden priblizno dva
   * megabajta. Toliko lahko prenesemo ze prej, dokler uporabnik gleda
   * galaksijo in mreza ni nikjer - brskalnik prenesene slike obdrzi, zato
   * jih napolni() pozneje dobi iz predpomnilnika, brez novega prenosa.
   *
   * Samo slike. Videi so desetkrat vecji od slik in bi pobrali pas za nekaj,
   * cesar morda nihce ne bo odprl; poleg tega se predvajajo sele ob prehodu
   * miske. Okno je zato prvih PREDPRIPRAVA polj mreze, iz katerih videe
   * izpustimo - ne prvih PREDPRIPRAVA slik, ker bi tako segli globlje v
   * mrezo, kot prvi zaslon sploh pokaze.
   *
   * Tece v prostem casu in sele po nalozeni strani, da ne tekmuje z modelom
   * galaksije, ki je edino, kar uporabnik takrat res gleda.
   */
  const PREDPRIPRAVA = 18;
  const vProstemCasu = window.requestIdleCallback ?? ((f) => setTimeout(f, 2500));
  const zacniPredpripravo = () =>
    vProstemCasu(
      () =>
        mediji
          .slice(0, PREDPRIPRAVA)
          .filter((m) => !m.video)
          .forEach((m) => {
            const i = new Image();
            i.decoding = "async";
            i.src = m.url;
          }),
      { timeout: 6000 }
    );
  if (document.readyState === "complete") zacniPredpripravo();
  else addEventListener("load", zacniPredpripravo, { once: true });

  /**
   * Opazovalec vidnosti.
   *
   * rootMargin da pas okoli zaslona: mediji se zacnejo nalagati tik preden
   * pridejo v pogled, zato polje ni prazno v trenutku, ko ga zagledas.
   */
  const opazovalec = new IntersectionObserver(
    (vnosi) => {
      vnosi.forEach((v) => {
        const polje = v.target;
        if (v.isIntersecting) {
          vNalaganje(polje);
        } else {
          // Ustavimo, a ne odstranimo: brskalnik obdrzi ze prenesene podatke,
          // dekoder pa neha delati.
          polje.querySelectorAll("video").forEach((x) => x.pause());
          polje.classList.remove("igra");
        }
      });
    },
    // Sirok pas: mediji se zacnejo nalagati priblizno zaslon in pol pred
    // tem, ko jih zagledas, zato polje ni nikoli prazno.
    { root: koren, rootMargin: "1100px 0px", threshold: 0.01 }
  );

  /**
   * Drugi opazovalec, brez zaloge, samo za videz.
   *
   * Prvi ima 400 px zaloge, da se mediji nalozijo, preden jih zagledas. Ce bi
   * z njim vodili tudi zameglitev, bi se ta zgodila 400 px izven zaslona, kjer
   * je ni videti. Ta tece po pravem robu zaslona in loci, ali je polje odslo
   * navzdol ali navzgor - smer nosi pomen, saj mora polje oditi tja, kamor ga
   * je odneslo.
   *
   * Prihod je enkraten. Ko je polje enkrat prislo, ga nehamo opazovati: sicer
   * bi ob vsakem drsenju nazaj spet zbledelo in se po eno na 90 ms vracalo,
   * kar je videti kot ponovno nalaganje - polje pa je ves cas tu in slika je
   * ze prenesena. Odhod zato vidis samo pri poljih, ki jih se nisi videl.
   */
  const videz = new IntersectionObserver(
    (vnosi) => {
      vnosi.forEach((v) => {
        const polje = v.target;
        polje.classList.remove("odhaja-dol", "odhaja-gor");
        if (v.isIntersecting) {
          vPrikaz(polje);
          videz.unobserve(polje);
          return;
        }
        polje.classList.remove("vidno");
        const meje = v.rootBounds;
        if (!meje) return;
        polje.classList.add(
          v.boundingClientRect.top >= meje.bottom ? "odhaja-dol" : "odhaja-gor"
        );
      });
    },
    // Pozitivna zaloga rob razsiri: polje velja za vidno se nekaj cez rob
    // zaslona, zato se umakne sele, ko je res zunaj, in ne ze na poti tja.
    { root: koren, rootMargin: "8% 0px 8% 0px", threshold: 0.01 }
  );

  /** Nalaganje je hitrejse od prikaza, da je vsebina pripravljena pred njim. */
  const vNalaganje = narediVrsto(55, (polje) => napolni(polje));

  // 90 ms proti 820 ms animacije: devet polj je hkrati v gibu, zato je videti
  // kot val in ne kot naštevanje.
  const vPrikaz = narediVrsto(90, (polje) => polje.classList.add("vidno"));

  /**
   * Klik na polje odpre sliko cez stran.
   *
   * Ogled je tezek - nosi sencilnika in svoj izris - zato pride sele ob prvem
   * kliku. Do takrat ni v svezenju in mreza se nalozi brez njega.
   *
   * Video gre skozi isto pot; v ogledu tece naprej od tam, kjer je bil v
   * mrezi. Kdor je gibanje izklopil, ostane klik brez posledic, tako kot je
   * bil prej.
   */
  const mirnoGibanje = matchMedia("(prefers-reduced-motion: reduce)");
  // Najprej izpuhti dvignjena slika, sele nato pride ogled - dva ucinka drug
  // za drugim in ne hkrati.
  function odpriSliko(polje) {
    if (!polje || mirnoGibanje.matches) return;
    const url = polje.dataset.url;
    if (!url) return;
    const video = polje.dataset.video === "true";
    lebdenje
      .pokni(polje)
      .then(() => import("./plapol.js"))
      .then((m) => m.odpri(url, "", video ? { video, cas: polje.querySelector("video")?.currentTime || 0 } : {}))
      .catch(() => null);
  }
  const lebdenje = namestiLebdenje(mreza, { klik: odpriSliko });
  mreza.addEventListener("click", (e) => {
    odpriSliko(e.target instanceof Element ? e.target.closest(".prof-polje") : null);
  });

  function napolni(polje) {
    if (polje.dataset.polno === "1") return;
    polje.dataset.polno = "1";
    const url = polje.dataset.url;

    const jeVideo = polje.dataset.video === "true";

    // Sij: ista slika se enkrat, zabrisana in povecana, pod pravo. Barva
    // torej pride iz same vsebine in ne iz izmisljene svetlobe.
    //
    // Pri videu je sij MIRUJOCA SLICICA in ne drugi video. Drugi <video> je
    // pomenil dva predvajalnika in dva prenosa na posnetek - pri 64 videih 128
    // hkrati. Brskalnik ima predvajalnikov omejeno in ob hitrem drsenju je
    // del prenosov propadel; polje je ostalo prazno. Zabris 26 pik gib tako
    // ali tako pogoltne, zato sij na mestu ne izgubi nicesar.
    const sij = document.createElement(jeVideo ? "canvas" : "img");
    sij.className = "prof-sij";
    if (!jeVideo) sij.src = url;
    polje.prepend(sij);

    if (jeVideo) {
      const v = document.createElement("video");
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      // metadata in ne auto: celega posnetka ne vlecemo, dokler se ne zacne
      // predvajati.
      v.preload = "metadata";
      v.addEventListener("loadedmetadata", () => {
        if (v.videoWidth) {
          polje.style.setProperty("--razmerje", `${v.videoWidth} / ${v.videoHeight}`);
        }
        // Metadata se ni slika. Chrome pri preload=metadata prve slicice
        // pogosto ne dekodira in polje ostane prazno do prvega predvajanja;
        // drobcen premik jo izsili.
        if (v.currentTime === 0) v.currentTime = 0.001;
      });
      v.addEventListener("loadeddata", () => narisiSij(sij, v), { once: true });
      // Ponovni poskus. Prvi prenos ob hitrem drsenju vcasih propade in
      // brskalnik javi "ni vira", posnetek pa je v redu - drugic pride.
      // Tri poskusi z vse daljsim premorom, da ne tolcemo po strezniku.
      let poskus = 0;
      v.addEventListener("error", () => {
        if (poskus >= 3) return;
        poskus += 1;
        setTimeout(() => {
          v.src = url;
          v.load();
        }, 500 * poskus * poskus);
      });
      v.src = url;
      polje.append(v);
    } else {
      const i = document.createElement("img");
      i.src = url;
      i.alt = "";
      i.decoding = "async";
      // Razmerje zapisemo sele, ko sliko poznamo; postavitvi "izvirno" in
      // "polno" ga bereta prek --razmerje.
      i.addEventListener("load", () => {
        if (i.naturalWidth) {
          polje.style.setProperty("--razmerje", `${i.naturalWidth} / ${i.naturalHeight}`);
        }
      }, { once: true });
      polje.append(i);
    }
  }

  mreza.querySelectorAll(".prof-polje").forEach((p) => {
    opazovalec.observe(p);
    videz.observe(p);
  });

  // Ko vstopna animacija odseka pretece, mu odvzamemo filter - sicer steklo
  // gumbov v njem ne lomi nicesar.
  koren.querySelectorAll(".prof-del").forEach((del) => {
    del.addEventListener("animationend", (e) => {
      if (e.animationName === "profVstop") del.classList.add("koncano");
    });
  });

  /**
   * Predvaja se samo posnetek pod kazalcem.
   *
   * Prej so tekli vsi vidni hkrati - do deset dekoderjev naenkrat, kar je
   * glavnina zatikanja med drsenjem. Zdaj mirujejo na prvi slicici, dokler
   * greš cez.
   */
  mreza.addEventListener("pointerover", (e) => {
    const polje = e.target instanceof Element ? e.target.closest(".prof-polje") : null;
    if (!polje || polje.classList.contains("igra")) return;
    mreza.querySelectorAll(".prof-polje.igra").forEach((p) => {
      p.classList.remove("igra");
      p.querySelectorAll("video").forEach((v) => v.pause());
    });
    polje.classList.add("igra");
    polje.querySelectorAll("video").forEach((v) => v.play().catch(() => {}));
  });
  mreza.addEventListener("pointerleave", () => {
    mreza.querySelectorAll(".prof-polje.igra").forEach((p) => {
      p.classList.remove("igra");
      p.querySelectorAll("video").forEach((v) => v.pause());
    });
  });

  /**
   * Mehko drsenje.
   *
   * Privzeto drsenje skoci po korakih kolesca, kar je pri veliki mrezi videti
   * sunkovito. Tu kolesce le premakne cilj, dejanski odmik pa ga lovi z
   * dusenjem - gib se zato zacne in konca mehko, brez ustavljanja na koraku.
   *
   * Zanka tece samo, kadar je kaj za dohiteti; sicer se ustavi in ne jemlje
   * casa galeriji.
   */
  let cilj = 0;
  let tece = false;

  koren.addEventListener(
    "wheel",
    (e) => {
      // Vodoravno drsenje pustimo pri miru - z njim se premikajo zgodbe.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      const najvec = koren.scrollHeight - koren.clientHeight;
      cilj = Math.max(0, Math.min(cilj + e.deltaY, najvec));
      if (!tece) {
        tece = true;
        requestAnimationFrame(mehko);
      }
    },
    { passive: false }
  );

  function mehko() {
    const razlika = cilj - koren.scrollTop;
    if (Math.abs(razlika) < 0.4) {
      koren.scrollTop = cilj;
      tece = false;
      return;
    }
    koren.scrollTop += razlika * 0.11;
    requestAnimationFrame(mehko);
  }

  // Ce se odmik spremeni drugace (tipkovnica, vlecenje), cilj potegnemo za njim.
  koren.addEventListener("scroll", () => {
    if (!tece) cilj = koren.scrollTop;
  }, { passive: true });

  ozivi(koren);

  koren.querySelector(".prof-zavihki").addEventListener("click", (e) => {
    const b = e.target instanceof Element ? e.target.closest('[role="tab"]') : null;
    if (!b) return;
    koren
      .querySelectorAll('[role="tab"]')
      .forEach((t) => t.setAttribute("aria-selected", String(t === b)));
  });

  /**
   * Razporeditve mreze.
   *
   * Menjava ne animira lege polj: prehod med mrezama bi terjal merjenje pred
   * in po (FLIP), kar pri 89 poljih pomeni 89 izracunov postavitve naenkrat.
   * Namesto tega polja zbledijo in se vrnejo - kratko in brez zatikanja.
   */
  const RAZPOREDI = [
    { kljuc: "tri", ime: "Trije stolpci" },
    { kljuc: "dve", ime: "Dva stolpca" },
    { kljuc: "stiri", ime: "Štirje stolpci" },
    { kljuc: "mozaik", ime: "Mozaik" },
    { kljuc: "stopnice", ime: "Stopnice" },
    { kljuc: "gost", ime: "Gosto (6-7)" },
    { kljuc: "bento", ime: "Bento" },
    { kljuc: "trak", ime: "Trak" },
    { kljuc: "izvirno", ime: "Izvirna razmerja" },
    { kljuc: "izvirnoxl", ime: "Izvirna razmerja XL" },
    { kljuc: "polno", ime: "Čez cel zaslon" },
    { kljuc: "stolpci", ime: "Zidak" },
    { kljuc: "prostor", ime: "Prostor 3D" },
  ];
  // Razmik je svoja izbira in ne del razporeditve: velja za vse in ga
  // uporabnik menja neodvisno od tega, koliko stolpcev gleda.
  const RAZMIKI = [
    { kljuc: "da", ime: "Z razmikom" },
    { kljuc: "ne", ime: "Brez razmika" },
  ];
  // Sirina je tretja, prav tako neodvisna izbira: koliko prostora dobi mreza,
  // ne kako so polja v njej razporejena.
  const SIRINE = [
    { kljuc: "robovi", ime: "Do robov" },
    { kljuc: "cez", ime: "Čez sredino" },
    { kljuc: "sredina", ime: "Na sredini" },
  ];
  // Privzeto: gosta mreza cez sredino zaslona. Naenkrat je videti veliko slik,
  // hkrati pa imajo ob straneh zrak - galerija tako ne pritiska na robove.
  // Novi slog ima svojo privzeto mrezo: bento, polja razlicnih velikosti.
  const privzetiRazpored = () => (nastavitve.profilSlog === "nov" ? "bento" : "gost");
  let razpored = privzetiRazpored();
  let razmik = "da";
  let sirina = "cez";
  mreza.dataset.razpored = razpored;
  mreza.dataset.razmik = razmik;
  mreza.dataset.sirina = sirina;

  const gumbRazpored = koren.querySelector(".prof-razpored");

  // Seznam zivi v body, ne v gumbu: prednik s filtrom postane nova podlaga za
  // position: fixed, potomec pa ga potem overflow odreze. Ista past kot pri
  // nastavitvah.
  const seznam = document.createElement("div");
  seznam.className = "spust-seznam dg";
  // Drsi plast v ploskvi in ne ploskev sama - glej .spust-drsnik v settings.css.
  const drsnik = document.createElement("div");
  drsnik.className = "spust-drsnik";
  seznam.appendChild(drsnik);
  document.body.appendChild(seznam);

  const vrsticaIzbire = (r, izbrana, vrsta) =>
    `<button type="button" class="spust-izbira" data-vrsta="${vrsta}" data-kljuc="${r.kljuc}"` +
    ` aria-selected="${izbrana}">` +
    `<span>${t(`gal.${vrsta}.${r.kljuc}`, r.ime)}</span><span class="spust-kljukica">${IKONA_KLJUKICA}</span></button>`;

  function osveziSeznam() {
    drsnik.innerHTML =
      RAZPOREDI.map((r) => vrsticaIzbire(r, r.kljuc === razpored, "razpored")).join("") +
      '<span class="spust-locnica"></span>' +
      RAZMIKI.map((r) => vrsticaIzbire(r, r.kljuc === razmik, "razmik")).join("") +
      '<span class="spust-locnica"></span>' +
      SIRINE.map((r) => vrsticaIzbire(r, r.kljuc === sirina, "sirina")).join("");
  }
  osveziSeznam();

  /**
   * Napisi profila v izbranem jeziku.
   *
   * Oznake so ze postavljene; zamenja se le besedilo. Beseda ob stevcu ima
   * svojo skatlo (.prof-beseda): ko besedilo razbijemo na znake, se pod
   * stevcem pojavijo novi span-i in iskanje "span" bi zadelo nje, ne besede -
   * prav to je stevcu objav pisalo "sledi" pred stevilko.
   */
  function prevediProfil() {
    const besede = [
      ["prof.objav", "objav"],
      ["prof.sledilcev", "sledilcev"],
      ["prof.sledi", "sledi"],
    ];
    koren.querySelectorAll(".prof-stevci .prof-beseda").forEach((el, i) => {
      if (besede[i]) el.textContent = t(...besede[i]);
    });
    const bio = koren.querySelector(".prof-bio");
    if (bio) bio.textContent = t("prof.bio", PODATKI.bio);
    const [uredi, arhiv] = koren.querySelectorAll(".prof-gumb");
    if (uredi) uredi.textContent = t("prof.uredi", "Uredi profil");
    if (arhiv) arhiv.textContent = t("prof.arhiv", "Arhiv");
    const zavihki = [
      ["prof.objave", "Objave"],
      ["prof.shranjeno", "Shranjeno"],
      ["prof.oznaceno", "Označeno"],
    ];
    koren.querySelectorAll(".prof-zavihek").forEach((el, i) => {
      if (zavihki[i]) el.textContent = t(...zavihki[i]);
    });
    koren.querySelector(".prof-zapri")?.setAttribute("aria-label", t("prof.zapri", "Zapri"));
    koren.querySelector(".prof-razpored")?.setAttribute("aria-label", t("prof.razporeditev", "Razporeditev"));
    koren.querySelector(".prof-vec")?.setAttribute("aria-label", t("prof.razporeditev", "Razporeditev"));
    osveziSeznam();
    // Prevod besedilo prepise, zato ga razbijemo znova.
    oziviProfil();
  }
  obJeziku(prevediProfil);

  function zapriSeznam() {
    seznam.classList.remove("odprt");
    gumbRazpored.classList.remove("odprt");
    koren.querySelector(".prof-vec")?.classList.remove("odprt");
  }

  // Menjava sloga v nastavitvah. Ce uporabnik mreze ni sam izbral, gre z
  // novim slogom tudi njegova privzeta mreza.
  document.addEventListener("nast-sprememba", (e) => {
    if (e.detail?.kljuc !== "profilSlog") return;
    const staraPrivzeta = razpored === (nastavitve.profilSlog === "nov" ? "gost" : "bento");
    koren.dataset.slog = nastavitve.profilSlog;
    if (staraPrivzeta) {
      razpored = privzetiRazpored();
      mreza.dataset.razpored = razpored;
      osveziSeznam();
      uskladiProstor();
    }
  });

  gumbRazpored.addEventListener("click", (e) => odpriRazpored(e, gumbRazpored));
  // V novem slogu je razporeditev za gumbom s tremi pikami ob "Uredi profil".
  const gumbVec = koren.querySelector(".prof-vec");
  gumbVec.addEventListener("click", (e) => odpriRazpored(e, gumbVec));

  function odpriRazpored(e, sidro) {
    e.stopPropagation();
    const odpiramo = !seznam.classList.contains("odprt");
    zapriSeznam();
    if (!odpiramo) return;

    const r = sidro.getBoundingClientRect();
    seznam.style.visibility = "hidden";
    seznam.style.top = "0px";
    // Najprej sprostimo omejitev, da izmerimo pravo visino vsebine.
    drsnik.style.maxHeight = "";
    const v = seznam.offsetHeight;
    const navzgor = window.innerHeight - r.bottom - 16 < v && r.top > v + 16;
    seznam.style.top = `${navzgor ? r.top - v - 8 : r.bottom + 8}px`;
    seznam.style.left = `${Math.max(12, r.right - seznam.offsetWidth)}px`;
    // Seznam ne sme cez rob zaslona: omejimo ga na prostor, ki ga dejansko ima.
    const prostor = navzgor ? r.top - 20 : window.innerHeight - r.bottom - 20;
    drsnik.style.maxHeight = `${Math.max(160, Math.min(v, prostor)) - 12}px`;
    seznam.style.transformOrigin = navzgor ? "bottom right" : "top right";
    seznam.style.visibility = "";
    seznam.classList.add("odprt");
    sidro.classList.add("odprt");
  }

  seznam.addEventListener("click", (e) => {
    const b = e.target instanceof Element ? e.target.closest(".spust-izbira") : null;
    if (!b) return;
    e.stopPropagation();
    val(b, e);
    const vrsta = b.dataset.vrsta;
    if (vrsta === "razmik") razmik = b.dataset.kljuc;
    else if (vrsta === "sirina") sirina = b.dataset.kljuc;
    else razpored = b.dataset.kljuc;
    osveziSeznam();
    zapriSeznam();
    // Mreza zbledi in se vrne v novi postavitvi.
    mreza.classList.add("menja");
    setTimeout(() => {
      mreza.dataset.razpored = razpored;
      mreza.dataset.razmik = razmik;
      mreza.dataset.sirina = sirina;
      mreza.classList.remove("menja");
      uskladiProstor();
    }, 190);
  });

  /**
   * Prostor 3D je svoj modul s three.js in se nalozi sele, ko ga kdo izbere.
   * Tece le, dokler je izbran in je profil odprt.
   */
  let prostor = null;
  let prostorNalaga = null;
  function uskladiProstor() {
    const hocemo = razpored === "prostor" && koren.classList.contains("odprt");
    if (prostor || !hocemo) {
      prostor?.nastavi(hocemo);
      return;
    }
    prostorNalaga ??= import("./prostor.js").then((m) => {
      prostor = m.namestiProstor(mreza, mediji, { odpri: odpriIzProstora });
    });
    prostorNalaga.then(uskladiProstor).catch(() => null);
  }
  function odpriIzProstora(m, cas) {
    if (mirnoGibanje.matches) return;
    import("./plapol.js")
      .then((p) => p.odpri(m.url, "", m.video ? { video: true, cas } : {}))
      .catch(() => null);
  }

  koren.addEventListener("click", zapriSeznam);
  addEventListener("resize", zapriSeznam);

  let zapiranje = null;

  function odpri() {
    if (zapiranje) {
      clearTimeout(zapiranje);
      zapiranje = null;
      koren.classList.remove("zapira");
    }
    koren.classList.add("odprt");
    koren.scrollTop = 0;
    cilj = 0;
    uskladiProstor();
    onOdprt?.();
  }

  function zapri() {
    if (zapiranje) return;
    // Za izhodno animacijo mora filter spet obstajati.
    koren.querySelectorAll(".prof-del").forEach((d) => d.classList.remove("koncano"));
    koren.classList.add("zapira");
    // setTimeout in ne rAF: na skriti strani rAF ne tece in profil bi ostal
    // odprt, dokler se zavihek ne vrne v ospredje.
    zapiranje = setTimeout(() => {
      koren.classList.remove("odprt", "zapira");
      koren.querySelectorAll("video").forEach((v) => v.pause());
      lebdenje.spusti(true);
      uskladiProstor();
      onZaprt?.();
      zapiranje = null;
    }, 460);
  }

  koren.querySelector(".prof-zapri").addEventListener("click", zapri);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && koren.classList.contains("odprt")) zapri();
  });

  return { odpri, zapri };
}
