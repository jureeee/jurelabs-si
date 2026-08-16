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
import avatarUrl from "../assets/images/profile picture.png";

const IKONA_ZAPRI =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
/** Ikona za razporeditev - tri crte padajocih dolzin, kot v iOS. */
const IKONA_KLJUKICA =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l6 6L20 6"/></svg>';
const IKONA_RAZPORED =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M4 7h16M6.5 12h11M9.5 17h5"/></svg>';
const IKONA_VIDEO =
  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4.5v15l15-7.5z"/></svg>';

const PODATKI = {
  ime: "blatnikjuree",
  pravo: "Jure",
  bio: "✨ Ce ne ujamem zvezd, pridem po tebe.",
  sledilcev: 325,
  sledi: 169,
};

/**
 * Seznam vseh medijev. Glob vrne le naslove (nize), zato tu se nic ne
 * potuje po mrezi - datoteka se prenese sele, ko polje dobi src.
 */
const vsi = Object.entries(
  import.meta.glob("../assets/images/*.{jpg,JPG,jpeg,JPEG,png,PNG,mp4,MP4,mov,MOV}", {
    eager: true,
    query: "?url",
    import: "default",
  })
)
  .map(([pot, url]) => ({
    url,
    ime: pot.split("/").pop(),
    video: /\.(mp4|mov)$/i.test(pot),
  }))
  // Profilna slika sodi v glavo, ne v mrezo.
  .filter((m) => !m.ime.startsWith("profile picture"));

/**
 * Ena vrstica na posnetek.
 *
 * Iz telefona pride vsak Live Photo dvakrat: kot slika in kot .mov z isto
 * osnovo imena. V mrezi bi bil zato isti prizor dvakrat, enkrat mirujoc in
 * enkrat gibljiv. Zdruzimo ju po osnovi in obdrzimo video, ker vsebuje tudi
 * mirujoco slicico; ce videa ni, ostane slika.
 *
 * Stranski ucinek je, da se znebimo tudi datotek .heic, ki jih noben
 * brskalnik ne prikaze - vse imajo svoj .mov.
 */
const poOsnovi = new Map();
for (const m of vsi) {
  const osnova = m.ime.replace(/\.[^.]+$/, "").toLowerCase();
  const prej = poOsnovi.get(osnova);
  if (!prej || (m.video && !prej.video)) poOsnovi.set(osnova, m);
}

const mediji = [...poOsnovi.values()]
  // Brez pripone in po stevilki, da vrstni red sledi imenu in ne abecedi,
  // kjer bi img10 stal pred img2.
  .sort((a, b) =>
    a.ime.localeCompare(b.ime, undefined, { numeric: true, sensitivity: "base" })
  );

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

export function installProfile({ onOdprt, onZaprt } = {}) {
  const koren = document.createElement("div");
  koren.className = "prof";
  koren.innerHTML = `
    <div class="prof-zavesa"></div>
    <div class="prof-rob"></div>
    <button class="prof-zapri dg" type="button" aria-label="Zapri">${IKONA_ZAPRI}</button>
    <div class="prof-vsebina">
      <div class="prof-glava prof-del" style="--i:0">
        <div class="prof-avatar"><img alt="" src="${avatarUrl}" /></div>
        <div class="prof-desno">
          <div class="prof-ime">${PODATKI.ime}</div>
          <div class="prof-pravo">${PODATKI.pravo}</div>
          <div class="prof-stevci">
            <span><b>${mediji.length}</b>objav</span>
            <span><b>${PODATKI.sledilcev}</b>sledilcev</span>
            <span><b>${PODATKI.sledi}</b>sledi</span>
          </div>
          <div class="prof-bio">${PODATKI.bio}</div>
          <div class="prof-gumbi">
            <button class="prof-gumb dg" type="button">Uredi profil</button>
            <button class="prof-gumb dg" type="button">Arhiv</button>
          </div>
        </div>
      </div>

      <div class="prof-zgodbe prof-del" style="--i:1"></div>

      <div class="prof-zavihki prof-del" style="--i:2" role="tablist">
        <button class="prof-zavihek dg" type="button" role="tab" aria-selected="true">Objave</button>
        <button class="prof-zavihek dg" type="button" role="tab" aria-selected="false">Shranjeno</button>
        <button class="prof-zavihek dg" type="button" role="tab" aria-selected="false">Oznaceno</button>
        <button class="prof-razpored dg" type="button" aria-label="Razporeditev">${IKONA_RAZPORED}</button>
      </div>

      <div class="prof-mreza prof-del" style="--i:3"></div>
    </div>`;
  document.body.appendChild(koren);

  const mreza = koren.querySelector(".prof-mreza");
  const zgodbe = koren.querySelector(".prof-zgodbe");

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
    { root: koren, rootMargin: "400px 0px", threshold: 0.01 }
  );

  /**
   * Drugi opazovalec, brez zaloge, samo za videz.
   *
   * Prvi ima 400 px zaloge, da se mediji nalozijo, preden jih zagledas. Ce bi
   * z njim vodili tudi zameglitev, bi se ta zgodila 400 px izven zaslona, kjer
   * je ni videti. Ta tece po pravem robu zaslona in loci, ali je polje odslo
   * navzdol ali navzgor - smer nosi pomen, saj mora polje oditi tja, kamor ga
   * je odneslo.
   */
  const videz = new IntersectionObserver(
    (vnosi) => {
      vnosi.forEach((v) => {
        const polje = v.target;
        polje.classList.remove("odhaja-dol", "odhaja-gor");
        if (v.isIntersecting) {
          vPrikaz(polje);
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
    // Negativna zaloga pomakne rob navznoter, zato se polje zamegli, se
    // preden dejansko zapusti zaslon.
    { root: koren, rootMargin: "-12% 0px -10% 0px", threshold: 0.01 }
  );

  /** Nalaganje je hitrejse od prikaza, da je vsebina pripravljena pred njim. */
  const vNalaganje = narediVrsto(55, (polje) => napolni(polje));

  // 90 ms proti 820 ms animacije: devet polj je hkrati v gibu, zato je videti
  // kot val in ne kot naštevanje.
  const vPrikaz = narediVrsto(90, (polje) => polje.classList.add("vidno"));

  function napolni(polje) {
    if (polje.dataset.polno === "1") return;
    polje.dataset.polno = "1";
    const url = polje.dataset.url;

    // Sij: ista slika se enkrat, zabrisana in povecana, pod pravo. Barva
    // torej pride iz same vsebine in ne iz izmisljene svetlobe.
    const sij = document.createElement(polje.dataset.video === "true" ? "video" : "img");
    sij.className = "prof-sij";
    sij.src = url;
    if (polje.dataset.video === "true") {
      sij.muted = true; sij.loop = true; sij.playsInline = true; sij.preload = "metadata";
    }
    polje.prepend(sij);

    if (polje.dataset.video === "true") {
      const v = document.createElement("video");
      v.src = url;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      // metadata in ne auto: prvo slicico dobimo takoj, celega posnetka pa ne
      // vlecemo, dokler se ne zacne predvajati.
      v.preload = "metadata";
      polje.append(v);
    } else {
      const i = document.createElement("img");
      i.src = url;
      i.alt = "";
      i.decoding = "async";
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
    { kljuc: "stiri", ime: "Stirje stolpci" },
    { kljuc: "mozaik", ime: "Mozaik" },
    { kljuc: "stopnice", ime: "Stopnice" },
    { kljuc: "trak", ime: "Trak" },
    { kljuc: "stolpci", ime: "Zidak" },
  ];
  // Razmik je svoja izbira in ne del razporeditve: velja za vse in ga
  // uporabnik menja neodvisno od tega, koliko stolpcev gleda.
  const RAZMIKI = [
    { kljuc: "da", ime: "Z razmikom" },
    { kljuc: "ne", ime: "Brez razmika" },
  ];
  let razpored = "tri";
  let razmik = "da";
  mreza.dataset.razpored = razpored;
  mreza.dataset.razmik = razmik;

  const gumbRazpored = koren.querySelector(".prof-razpored");

  // Seznam zivi v body, ne v gumbu: prednik s filtrom postane nova podlaga za
  // position: fixed, potomec pa ga potem overflow odreze. Ista past kot pri
  // nastavitvah.
  const seznam = document.createElement("div");
  seznam.className = "spust-seznam dg";
  document.body.appendChild(seznam);

  const vrsticaIzbire = (r, izbrana, vrsta) =>
    `<button type="button" class="spust-izbira" data-vrsta="${vrsta}" data-kljuc="${r.kljuc}"` +
    ` aria-selected="${izbrana}">` +
    `<span>${r.ime}</span><span class="spust-kljukica">${IKONA_KLJUKICA}</span></button>`;

  function osveziSeznam() {
    seznam.innerHTML =
      RAZPOREDI.map((r) => vrsticaIzbire(r, r.kljuc === razpored, "razpored")).join("") +
      '<span class="spust-locnica"></span>' +
      RAZMIKI.map((r) => vrsticaIzbire(r, r.kljuc === razmik, "razmik")).join("");
  }
  osveziSeznam();

  function zapriSeznam() {
    seznam.classList.remove("odprt");
    gumbRazpored.classList.remove("odprt");
  }

  gumbRazpored.addEventListener("click", (e) => {
    e.stopPropagation();
    const odpiramo = !seznam.classList.contains("odprt");
    zapriSeznam();
    if (!odpiramo) return;

    const r = gumbRazpored.getBoundingClientRect();
    seznam.style.visibility = "hidden";
    seznam.style.top = "0px";
    const v = seznam.offsetHeight;
    const navzgor = window.innerHeight - r.bottom - 16 < v && r.top > v + 16;
    seznam.style.top = `${navzgor ? r.top - v - 8 : r.bottom + 8}px`;
    seznam.style.left = `${Math.max(12, r.right - seznam.offsetWidth)}px`;
    seznam.style.transformOrigin = navzgor ? "bottom right" : "top right";
    seznam.style.visibility = "";
    seznam.classList.add("odprt");
    gumbRazpored.classList.add("odprt");
  });

  seznam.addEventListener("click", (e) => {
    const b = e.target instanceof Element ? e.target.closest(".spust-izbira") : null;
    if (!b) return;
    e.stopPropagation();
    val(b, e);
    if (b.dataset.vrsta === "razmik") razmik = b.dataset.kljuc;
    else razpored = b.dataset.kljuc;
    osveziSeznam();
    zapriSeznam();
    // Mreza zbledi in se vrne v novi postavitvi.
    mreza.classList.add("menja");
    setTimeout(() => {
      mreza.dataset.razpored = razpored;
      mreza.dataset.razmik = razmik;
      mreza.classList.remove("menja");
    }, 190);
  });

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
