/**
 * Nastavitve.
 *
 * Postavitev je po zgledu Applovih nastavitev: skupine zaokrozenih vrstic z
 * naslovki, ena vrstica ena stvar, vrednost desno.
 *
 * Tri stvari so tu resene namensko:
 *
 *   1. Odpiranje je dvostopenjsko. Najprej se zablura ozadje, sele nato
 *      priplavajo nastavitve. Ce oboje stece hkrati, oko vidi en sam skok;
 *      z zamikom pa najprej zazna, da se je svet umaknil, in sele potem, kaj
 *      je prislo predenj.
 *
 *   2. Vrstice pridejo v valu - vsaka za prejsnjo z zamikom, ki ga nosi
 *      spremenljivka --i. Hkraten prihod vseh je videti kot vklop luci.
 *
 *   3. Podmeni ne zamenja vsebine, ampak jo odpotuje. Naprej: stara stran
 *      odplava v levo, nova pride z desne. Nazaj obratno. Smer nosi pomen -
 *      brez nje uporabnik izgubi obcutek, kje v drevesu je.
 *
 * Vsi gumbi, drsniki in spustni meniji nosijo razred .dg, zato jih
 * defractedGlass.js pobere sam - iste ploskve kot meni in orodja.
 */

import "./settings.css";

const IKONA_PUSC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';
const IKONA_NAZAJ =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
const IKONA_ZAPRI =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const IKONA_DOL =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const IKONA_KLJUKICA =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l6 6L20 6"/></svg>';

/** Trenutne vrednosti. Spreminjajo jih vrstice, bere jih stran. */
export const nastavitve = {
  steklo: true,
  prosojnost: 5,
  tema: "temna",
  ozadje: "galaksija",
  meglice: true,
  odzivNaMisko: true,
  hitrostOrbite: 42,
  sij: 46,
  velikostZvezd: 21,
};

/** Val pod prstom. Izvira iz tocke dotika, ne iz sredisca ploskve. */
function val(el, event) {
  const r = el.getBoundingClientRect();
  const x = (event?.clientX ?? r.left + r.width / 2) - r.left;
  const y = (event?.clientY ?? r.top + r.height / 2) - r.top;
  const premer = Math.max(r.width, r.height) * 2.2;

  const v = document.createElement("span");
  v.className = "val";
  v.style.width = v.style.height = `${premer}px`;
  v.style.left = `${x - premer / 2}px`;
  v.style.top = `${y - premer / 2}px`;
  el.appendChild(v);
  v.addEventListener("animationend", () => v.remove());
}

function enkratna(el, razred) {
  if (!el || el.classList.contains(razred)) return;
  el.classList.add(razred);
  const konec = () => {
    el.classList.remove(razred);
    el.removeEventListener("animationend", konec);
  };
  el.addEventListener("animationend", konec);
}

/** Ogrodje vrstice: ime, opis in poljubna kontrola desno. */
function vrstica({ ime, opis, kontrola, klikna, naKlik }, i) {
  const el = document.createElement("div");
  el.className = "nast-vrstica" + (klikna ? " klikna" : "");
  el.style.setProperty("--i", i);

  const oznaka = document.createElement("div");
  oznaka.className = "nast-oznaka";
  oznaka.innerHTML =
    `<div class="nast-ime">${ime}</div>` + (opis ? `<div class="nast-opis">${opis}</div>` : "");
  el.appendChild(oznaka);
  if (kontrola) el.appendChild(kontrola);

  if (klikna) {
    el.addEventListener("pointerdown", (e) => {
      val(el, e);
      enkratna(el, "stisni");
    });
    el.addEventListener("click", () => naKlik?.());
  }
  return el;
}

function stikalo(kljuc) {
  const b = document.createElement("button");
  b.className = "stikalo";
  b.type = "button";
  b.setAttribute("role", "switch");
  b.setAttribute("aria-checked", String(nastavitve[kljuc]));
  // Gumbek je pravi element, ne psevdo-element: lom svetlobe se nanasa na
  // ploskve, ki jih defractedGlass.js najde v dokumentu, psevdo-elementov pa
  // ne more.
  b.innerHTML = '<span class="stikalo-rocaj dg"></span>';
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    nastavitve[kljuc] = !nastavitve[kljuc];
    b.setAttribute("aria-checked", String(nastavitve[kljuc]));
    b.dispatchEvent(new CustomEvent("nast-sprememba", { bubbles: true, detail: { kljuc } }));
  });
  return b;
}

function drsnik(kljuc, { min = 0, max = 100, enota = "" } = {}) {
  const ovoj = document.createElement("div");
  ovoj.className = "drsnik";

  const tir = document.createElement("div");
  // Steklo nosi rocaj, ne tir - tir je tanka crta in bi kot ploskev risal
  // siv pravokotnik za drsnikom.
  tir.className = "drsnik-tir";
  tir.innerHTML = '<div class="drsnik-polnilo"></div><div class="drsnik-rocaj dg"></div>';

  const stevilka = document.createElement("div");
  stevilka.className = "drsnik-stevilka";

  const nastavi = (v) => {
    const vred = Math.round(Math.min(Math.max(v, min), max));
    nastavitve[kljuc] = vred;
    const del = ((vred - min) / (max - min)) * 100;
    tir.style.setProperty("--del", `${del}%`);
    stevilka.textContent = `${vred}${enota}`;
    tir.dispatchEvent(new CustomEvent("nast-sprememba", { bubbles: true, detail: { kljuc } }));
  };

  const izVodoravne = (e) => {
    const r = tir.getBoundingClientRect();
    nastavi(min + ((e.clientX - r.left) / r.width) * (max - min));
  };

  tir.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    tir.setPointerCapture(e.pointerId);
    tir.classList.add("drsi");
    izVodoravne(e);
  });
  const konec = () => tir.classList.remove("drsi");
  tir.addEventListener("pointerup", konec);
  tir.addEventListener("pointercancel", konec);
  tir.addEventListener("pointermove", (e) => {
    if (tir.hasPointerCapture(e.pointerId)) izVodoravne(e);
  });

  ovoj.append(tir, stevilka);
  nastavi(nastavitve[kljuc]);
  return ovoj;
}

/** Zapre vse spustne menije razen podanega. */
function zapriVse(razen) {
  document.querySelectorAll(".spust.odprt").forEach((d) => {
    if (d === razen) return;
    d.classList.remove("odprt");
    d.seznam?.classList.remove("odprt");
  });
}

function spust(kljuc, moznosti) {
  const ovoj = document.createElement("div");
  ovoj.className = "spust";

  const gumb = document.createElement("button");
  gumb.type = "button";
  gumb.className = "spust-gumb dg";

  // Seznam zivi v body, ne v vrstici.
  //
  // Vrstica ima po animaciji filter, filter pa naredi novo izhodisce za
  // position: fixed - potomec se zato obnasa kot absolute in ga overflow:
  // hidden na vrstici odreze. Zato ga obesimo na body, kjer nad njim ni
  // nobenega filtra.
  const seznam = document.createElement("div");
  seznam.className = "spust-seznam dg";
  document.body.appendChild(seznam);

  const osvezi = () => {
    const izbrana = moznosti.find((m) => m.vrednost === nastavitve[kljuc]);
    gumb.innerHTML = `<span>${izbrana?.ime ?? ""}</span>${IKONA_DOL}`;
    seznam.querySelectorAll(".spust-izbira").forEach((b) => {
      b.setAttribute("aria-selected", String(b.dataset.vrednost === nastavitve[kljuc]));
    });
  };

  moznosti.forEach((m) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "spust-izbira";
    b.dataset.vrednost = m.vrednost;
    b.innerHTML = `<span>${m.ime}</span><span class="spust-kljukica">${IKONA_KLJUKICA}</span>`;
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      val(b, e);
      nastavitve[kljuc] = m.vrednost;
      osvezi();
      ovoj.classList.remove("odprt");
      seznam.classList.remove("odprt");
      b.dispatchEvent(new CustomEvent("nast-sprememba", { bubbles: true, detail: { kljuc } }));
    });
    seznam.appendChild(b);
  });

  gumb.addEventListener("click", (e) => {
    e.stopPropagation();
    // Le en spustni meni naenkrat.
    zapriVse(ovoj);
    const odpiramo = !ovoj.classList.contains("odprt");
    ovoj.classList.toggle("odprt", odpiramo);
    seznam.classList.toggle("odprt", odpiramo);
    if (!odpiramo) return;

    // Seznam je fiksen, zato mu lego postavimo sami. Privzeto pod gumbom;
    // ce spodaj ni prostora, ga obrnemo navzgor.
    const r = gumb.getBoundingClientRect();
    seznam.style.visibility = "hidden";
    seznam.style.top = "0px";
    const v = seznam.offsetHeight;
    const podSpodaj = window.innerHeight - r.bottom - 16;
    const navzgor = podSpodaj < v && r.top > v + 16;
    seznam.style.top = `${navzgor ? r.top - v - 8 : r.bottom + 8}px`;
    seznam.style.left = `${Math.max(12, r.right - seznam.offsetWidth)}px`;
    seznam.style.transformOrigin = navzgor ? "bottom right" : "top right";
    seznam.style.visibility = "";
  });

  ovoj.seznam = seznam;
  ovoj.append(gumb);
  osvezi();
  return ovoj;
}

/** Sestava strani. Podmeniji so navadne funkcije, ki vrnejo isto obliko. */
function stranGlavna(pojdi) {
  return {
    naslov: "Nastavitve",
    skupine: [
      {
        naslovek: "Videz",
        vrstice: [
          { ime: "Liquid Refractor UI", opis: "Lom svetlobe ob robovih ploskev", kontrola: stikalo("steklo") },
          { ime: "Prosojnost", kontrola: drsnik("prosojnost", { min: 0, max: 30, enota: "%" }) },
          {
            ime: "Tema",
            kontrola: spust("tema", [
              { vrednost: "temna", ime: "Temna" },
              { vrednost: "svetla", ime: "Svetla" },
              { vrednost: "sistem", ime: "Po sistemu" },
            ]),
          },
        ],
      },
      {
        naslovek: "Ozadje",
        vrstice: [
          {
            ime: "Prizor",
            kontrola: spust("ozadje", [
              { vrednost: "galaksija", ime: "Galaksija" },
              { vrednost: "zvezde", ime: "Samo zvezde" },
              { vrednost: "izklop", ime: "Izklopljeno" },
            ]),
          },
          { ime: "Meglice", opis: "Barvni oblaki okoli diska", kontrola: stikalo("meglice") },
          {
            ime: "Galaksija",
            opis: "Sij, velikost zvezd, hitrost",
            klikna: true,
            naKlik: () => pojdi(stranGalaksija),
            kontrola: (() => {
              const s = document.createElement("span");
              s.className = "nast-pusc";
              s.innerHTML = IKONA_PUSC;
              return s;
            })(),
          },
        ],
      },
      {
        naslovek: "Gibanje",
        vrstice: [
          { ime: "Odziv na misko", opis: "Pogled sledi kazalcu", kontrola: stikalo("odzivNaMisko") },
        ],
      },
    ],
  };
}

function stranGalaksija() {
  return {
    naslov: "Galaksija",
    skupine: [
      {
        naslovek: "Izris",
        vrstice: [
          { ime: "Sij", kontrola: drsnik("sij", { min: 0, max: 100, enota: "%" }) },
          { ime: "Velikost zvezd", kontrola: drsnik("velikostZvezd", { min: 5, max: 60, enota: "" }) },
        ],
      },
      {
        naslovek: "Kamera",
        vrstice: [
          { ime: "Hitrost orbite", kontrola: drsnik("hitrostOrbite", { min: 0, max: 100, enota: "%" }) },
        ],
      },
    ],
  };
}

export function installSettings() {
  const koren = document.createElement("div");
  koren.className = "nast";
  koren.dataset.globina = "0";
  koren.innerHTML = `
    <div class="nast-zavesa"></div>
    <div class="nast-plosca dg">
      <div class="nast-glava">
        <button class="nast-nazaj" type="button" aria-label="Nazaj">${IKONA_NAZAJ}</button>
        <div class="nast-naslov">Nastavitve</div>
        <button class="nast-zapri" type="button" aria-label="Zapri">${IKONA_ZAPRI}</button>
      </div>
      <div class="nast-okno"></div>
    </div>`;
  document.body.appendChild(koren);

  const okno = koren.querySelector(".nast-okno");
  const naslov = koren.querySelector(".nast-naslov");
  const zavesa = koren.querySelector(".nast-zavesa");
  const gumbNazaj = koren.querySelector(".nast-nazaj");
  const gumbZapri = koren.querySelector(".nast-zapri");

  let sklad = [];
  let trenutna = null;

  function narisi(opis) {
    const stran = document.createElement("div");
    stran.className = "nast-stran";
    let i = 0;
    opis.skupine.forEach((sk) => {
      const skupina = document.createElement("div");
      skupina.className = "nast-skupina";
      if (sk.naslovek) {
        const n = document.createElement("div");
        n.className = "nast-naslovek";
        n.textContent = sk.naslovek;
        skupina.appendChild(n);
      }
      sk.vrstice.forEach((v) => skupina.appendChild(vrstica(v, i++)));
      stran.appendChild(skupina);
    });
    return stran;
  }

  /** @param {"naprej"|"nazaj"|null} smer */
  function pokazi(tvorec, smer) {
    const opis = tvorec();
    const nova = narisi(opis);
    naslov.textContent = opis.naslov;

    if (trenutna && smer) {
      const stara = trenutna;
      stara.classList.add("odhaja", smer === "naprej" ? "i-naprej" : "i-nazaj");
      stara.addEventListener("animationend", () => stara.remove(), { once: true });
      nova.classList.add(smer === "naprej" ? "v-naprej" : "v-nazaj");
    } else if (trenutna) {
      trenutna.remove();
    }

    okno.appendChild(nova);
    trenutna = nova;
    koren.dataset.globina = String(sklad.length);
  }

  const pojdi = (tvorec) => {
    sklad.push(tvorec);
    pokazi(tvorec, "naprej");
  };

  const nazaj = () => {
    if (!sklad.length) return;
    sklad.pop();
    pokazi(sklad.length ? sklad[sklad.length - 1] : () => stranGlavna(pojdi), "nazaj");
  };

  function odpri() {
    sklad = [];
    pokazi(() => stranGlavna(pojdi), null);
    // Razred v naslednji sliki, sicer se prehod ne sprozi - element je bil
    // pravkar vstavljen in brskalnik se ni izracunal zacetnega stanja.
    requestAnimationFrame(() => koren.classList.add("odprt"));
  }

  function zapri() {
    koren.classList.remove("odprt");
    zapriVse(null);
  }

  gumbNazaj.addEventListener("click", nazaj);
  gumbZapri.addEventListener("click", zapri);
  zavesa.addEventListener("click", zapri);
  window.addEventListener("keydown", (e) => {
    if (!koren.classList.contains("odprt")) return;
    if (e.key === "Escape") (sklad.length ? nazaj : zapri)();
  });
  // Klik izven spustnega menija ga zapre.
  koren.addEventListener("click", () => zapriVse(null));
  // Seznami zivijo v body, zato jih pobrisemo tudi ob zapiranju plosce.
  window.addEventListener("resize", () => zapriVse(null));

  return { odpri, zapri };
}
