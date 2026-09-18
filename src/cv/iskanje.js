/**
 * Iskanje - po zgledu Spotlighta, a od spodaj navzgor.
 *
 * Ob odprtju se od spodnjega roba dvigne rahlo zabrisana zavesa, nizje od
 * sredine zaslona se prikaze steklena vrstica za vnos, zadetki pa se nizajo
 * NAD njo, od spodaj gor - golo besedilo, vsak v svoji vrsti, brez okvirjev.
 * Najboljsi je tik ob vrstici, kjer je pogled ze tako ali tako. Puscica gor
 * gre zato k naslednjemu zadetku, puscica dol nazaj proti vrstici.
 *
 * Kazalo se sestavi ob vsakem odprtju iz strani samih - iz naslovov, oznak,
 * znack in povezav, kakor so ta hip izpisani. Tako isce v jeziku, ki je
 * izbran, in ni drugega seznama, ki bi ga bilo treba vzdrzevati ob vsebini.
 * Strani so v drevesu tudi, ko so zaprte (le skrite), zato je vse na voljo.
 *
 * Odpre se z gumbom z lupo, s Ctrl/Cmd + K ali s posevnico, zapre z Esc,
 * klikom mimo ali izbiro zadetka.
 */

import "./iskanje.css";
import { t, obJeziku } from "./jezik.js";

const LUPA =
  '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="10.8" cy="10.8" r="6.4"/><path d="M15.6 15.6 L20 20"/></svg>';

/** Najvec zadetkov naenkrat; vec jih ne pregledas, ne da bi pisal naprej. */
const NAJVEC = 8;

/** Brez sumnikov in velikih crk: "sola" najde "Šola", "cv" najde "CV". */
const poenostavi = (s) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Besedilo elementa, kakor ga bere oko. textContent zlepi vrstici, ki ju
 * loci <br> ("Razumetiin uporabljati"), zato prelom steje kot presledek.
 */
function besedilo(el) {
  let s = "";
  const hodi = (n) => {
    if (n.nodeType === 3) s += n.nodeValue;
    else if (n.nodeName === "BR") s += " ";
    else n.childNodes.forEach(hodi);
  };
  hodi(el);
  return s.replace(/ /g, " ").replace(/\s+/g, " ").trim();
}

/** Ubezi za HTML - zadetki pridejo iz strani, a v innerHTML gredo znova. */
const ubezi = (s) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function installIskanje() {
  const gumb = document.querySelector('.dock-icon[data-orodje="iskanje"]');

  const koren = document.createElement("div");
  koren.className = "isk";
  koren.innerHTML = `
    <div class="isk-zavesa"></div>
    <div class="isk-okvir">
      <div class="isk-rezultati">
        <div class="isk-seznam" role="listbox"></div>
      </div>
      <label class="isk-vrstica dg">
        <span class="isk-lupa">${LUPA}</span>
        <input class="isk-vnos" type="text" autocomplete="off" spellcheck="false"
          role="combobox" aria-expanded="false" aria-autocomplete="list" />
        <kbd class="isk-tipka">Esc</kbd>
      </label>
    </div>`;
  document.body.appendChild(koren);

  const zavesa = koren.querySelector(".isk-zavesa");
  const seznam = koren.querySelector(".isk-seznam");
  const vnos = koren.querySelector(".isk-vnos");

  const prevedi = () => {
    vnos.placeholder = t("isk.namig", "Išči po strani …");
    vnos.setAttribute("aria-label", t("orodja.iskanje", "Iskanje"));
  };
  prevedi();
  obJeziku(prevedi);

  // --- kazalo --------------------------------------------------------------
  /** @type {{naslov:string, pot:string, vrsta:string, telo:string, kljucne:string, izvedi:() => void}[]} */
  let kazalo = [];

  const zavihek = (kljuc) => document.querySelector(`.nav [role="tab"][data-stran="${kljuc}"]`);
  const odprtaStran = () => document.querySelector(".zapis.odprt");

  /** Zapre odprto stran, da se vidi domaca. */
  function naDomov() {
    odprtaStran()?.querySelector(".zapis-zapri")?.click();
  }

  /** Odpre stran (ce se ni) in pripelje odsek na zaslon. */
  function pojdiNa(kljuc, cilj) {
    const stran = document.querySelector(`.zapis[data-stran="${kljuc}"]`);
    if (!stran) return;
    const zeOdprta = stran.classList.contains("odprt");
    if (!zeOdprta) zavihek(kljuc)?.click();
    if (!cilj) return;
    // Stran se ob odprtju postavi na vrh; odsek poiscemo, ko je ze postavljena.
    setTimeout(() => {
      const tok = stran.querySelector(".zapis-tok");
      if (!tok) return;
      const vrhToka = tok.getBoundingClientRect().top - tok.scrollTop;
      let vrh;
      if (/^H[1-3]$/.test(cilj.tagName) && !cilj.closest(".zapis-kartica")) {
        // Naslov: odsek z vrhom malo pod robom, da se vidi tudi oznaka nad njim.
        const odsek = cilj.closest("section, header, .odsek") || cilj;
        vrh = odsek.getBoundingClientRect().top - vrhToka - tok.clientHeight * 0.16;
      } else {
        // Znacka ali kartica: zadetek sam na sredino zaslona.
        const r = cilj.getBoundingClientRect();
        vrh = r.top - vrhToka - (tok.clientHeight - r.height) / 2;
      }
      tok.scrollTo({ top: Math.max(0, vrh), behavior: "smooth" });
      // Kartica v vrtiljaku je lahko ob strani: vrtiljak jo pripelje na sredino.
      const kartica = cilj.closest(".zapis-kartica");
      const tir = kartica?.closest(".zapis-tir");
      if (kartica && tir) {
        tir.scrollTo({
          left: kartica.offsetLeft - (tir.clientWidth - kartica.offsetWidth) / 2,
          behavior: "smooth",
        });
      }
      poudari(cilj);
    }, zeOdprta ? 0 : 140);
  }

  /** Domaca stran: zapre odprto stran in podrsa do odseka. */
  function pojdiDomov(cilj) {
    naDomov();
    const domov = document.querySelector(".domov");
    if (!domov) return;
    setTimeout(() => {
      if (!cilj) {
        domov.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const odsek = cilj.closest(".odsek") || cilj;
      const vrh = odsek.getBoundingClientRect().top - domov.getBoundingClientRect().top + domov.scrollTop;
      domov.scrollTo({ top: Math.max(0, vrh - innerHeight * 0.18), behavior: "smooth" });
      poudari(cilj);
    }, 60);
  }

  /** Zadetek na strani za hip zasveti, da oko ve, kam pogledati. */
  function poudari(el) {
    el.classList.remove("isk-zadetek");
    void el.offsetWidth;
    el.classList.add("isk-zadetek");
    setTimeout(() => el.classList.remove("isk-zadetek"), 2200);
  }

  /** Oznaka odseka, v katerem stoji element. */
  const oznakaOdseka = (el) => {
    const o = el.closest("section, article, header, .odsek")?.querySelector(".zapis-oznaka");
    return o ? besedilo(o) : "";
  };

  function zgradiKazalo() {
    const k = [];
    const dodaj = (z) => {
      if (!z.naslov) return;
      k.push({ telo: "", kljucne: "", ...z });
    };

    // Strani same.
    document.querySelectorAll('.nav [role="tab"][data-stran]').forEach((z) => {
      const kljuc = z.dataset.stran;
      dodaj({
        naslov: besedilo(z),
        pot: t("isk.stran", "Stran"),
        vrsta: "stran",
        predlog: true,
        izvedi: () => pojdiNa(kljuc),
      });
    });

    // Naslovi in znacke na straneh.
    document.querySelectorAll(".zapis[data-stran]").forEach((stran) => {
      const kljuc = stran.dataset.stran;
      const imeStrani = zavihek(kljuc) ? besedilo(zavihek(kljuc)) : kljuc;
      const videne = new Set();

      stran.querySelectorAll(".zapis-tok h1, .zapis-tok h2, .zapis-tok h3").forEach((h) => {
        const naslov = besedilo(h);
        const oznaka = oznakaOdseka(h);
        const odsek = h.closest("section, article, header, .odsek");
        // Skupina znack (h3) ima svoje ime; njen odsek je oznaka nad stolpci.
        const telo = odsek ? besedilo(odsek).slice(0, 400) : "";
        dodaj({
          naslov,
          pot: [imeStrani, oznaka].filter(Boolean).join(" · "),
          vrsta: "odsek",
          telo,
          izvedi: () => pojdiNa(kljuc, h),
        });
      });

      stran.querySelectorAll(".zapis-znacka:not(.zapis-vec)").forEach((z) => {
        const naslov = besedilo(z);
        const kljucZnacke = poenostavi(naslov);
        if (!naslov || videne.has(kljucZnacke)) return;
        videne.add(kljucZnacke);
        const skupina = z.closest(".zapis-skupina")?.querySelector("h3");
        const nad = skupina ? besedilo(skupina) : besedilo(z.closest("section, article")?.querySelector("h2") ?? z);
        dodaj({
          naslov,
          pot: [imeStrani, nad].filter(Boolean).join(" · "),
          vrsta: "znacka",
          izvedi: () => pojdiNa(kljuc, z),
        });
      });

      stran.querySelectorAll("a.stik-povezava").forEach((a) => {
        dodaj({
          naslov: besedilo(a),
          pot: imeStrani,
          vrsta: "povezava",
          kljucne: a.href,
          izvedi: () => a.click(),
        });
      });
    });

    // Domaca stran.
    const domov = document.querySelector(".domov");
    const imeDomov = t("isk.domov", "Domov");
    dodaj({
      naslov: imeDomov,
      pot: t("isk.zacetek", "Začetek strani"),
      vrsta: "domov",
      kljucne: "home zacetek",
      izvedi: () => pojdiDomov(null),
    });
    domov?.querySelectorAll("h1, h2, h3").forEach((h) => {
      const odsek = h.closest(".odsek");
      const oznaka = odsek?.querySelector(".zapis-oznaka");
      dodaj({
        naslov: besedilo(h),
        pot: [imeDomov, oznaka ? besedilo(oznaka) : ""].filter(Boolean).join(" · "),
        vrsta: "odsek",
        telo: odsek ? besedilo(odsek).slice(0, 400) : "",
        izvedi: () => pojdiDomov(h),
      });
    });

    // Orodja.
    const orodje = (naslov, kljucne, izvedi, predlog = false) =>
      dodaj({ naslov, pot: t("isk.orodje", "Orodje"), vrsta: "orodje", kljucne, izvedi, predlog });
    orodje(t("kmeni.profil", "Profil"), "profil galerija objave slike fotografije", () =>
      document.querySelector(".profil")?.click(), true);
    orodje(t("kmeni.nastavitve", "Nastavitve"), "nastavitve tema svetla temna ozadje galaksija kazalec sij", () =>
      document.querySelector('.dock-icon[data-orodje="nastavitve"]')?.click(), true);
    orodje(t("kmeni.jezik", "Jezik"), "jezik language english slovenscina prevod", () =>
      document.querySelector(".jez")?.click());
    orodje(t("orodja.arkada", "Arkada"), "arkada igre games igrice", () =>
      document.querySelector(".arkada")?.click());
    orodje(
      document.fullscreenElement
        ? t("kmeni.izhodCelozaslonsko", "Izhod iz celozaslonskega načina")
        : t("kmeni.celozaslonsko", "Celozaslonsko"),
      "celozaslonsko fullscreen cel zaslon",
      () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())
    );

    // Isti naslov na isti poti le enkrat (npr. naslov, ki je tudi oznaka).
    const bili = new Set();
    kazalo = k.filter((z) => {
      const kljuc = poenostavi(z.naslov + "|" + z.pot);
      if (bili.has(kljuc)) return false;
      bili.add(kljuc);
      z.n = poenostavi(z.naslov);
      z.p = poenostavi(z.pot);
      z.t = poenostavi(z.telo);
      z.k = poenostavi(z.kljucne);
      return true;
    });
  }

  // --- ujemanje ------------------------------------------------------------
  /** Crke poizvedbe po vrsti v besedilu, s presledki vmes ("trsp" -> Trace Space). */
  function podzaporedje(q, s) {
    let i = 0;
    for (let j = 0; j < s.length && i < q.length; j++) if (s[j] === q[i]) i++;
    return i === q.length;
  }

  function tocke(z, besede, cela) {
    let vsota = 0;
    for (const b of besede) {
      let najbolje = 0;
      if (z.n === b) najbolje = 120;
      else if (z.n.startsWith(b)) najbolje = 100;
      else if (z.n.split(/[\s·,.–-]+/).some((w) => w.startsWith(b))) najbolje = 85;
      else if (z.n.includes(b)) najbolje = 70;
      else if (z.k.includes(b)) najbolje = 55;
      else if (z.p.includes(b)) najbolje = 45;
      else if (z.t.includes(b)) najbolje = 30;
      else if (b.length > 2 && podzaporedje(b, z.n)) najbolje = 18;
      if (!najbolje) return 0;
      vsota += najbolje;
    }
    // Vse skupaj kot fraza v naslovu je vec kot vsaka beseda posebej.
    if (besede.length > 1 && z.n.includes(cela)) vsota += 60;
    // Strani in orodja imajo prednost pred odseki z enakim ujemanjem.
    if (z.vrsta === "stran" || z.vrsta === "orodje") vsota += 6;
    return vsota;
  }

  /** Oznaci del naslova, ki se ujema, ne da bi pokvaril sumnike v izpisu. */
  function oznaci(naslov, besede) {
    // Iscemo v poenostavljenem besedilu, oznacujemo pa izvirne znake - zato
    // vsak znak poenostavimo posebej in vemo, kje v izvirniku je kaj.
    const znaki = [...naslov];
    const kljuci = znaki.map((c) => poenostavi(c) || (c === " " ? " " : c.toLowerCase()));
    const oznaceno = new Array(znaki.length).fill(false);
    const plosko = kljuci.join("");
    for (const b of besede) {
      const i = plosko.indexOf(b);
      if (i < 0) continue;
      let d = 0;
      for (let z = 0; z < kljuci.length; z++) {
        const od = d;
        d += kljuci[z].length;
        if (d > i && od < i + b.length) oznaceno[z] = true;
      }
    }
    let html = "";
    let v = false;
    znaki.forEach((c, i) => {
      if (oznaceno[i] && !v) { html += "<mark>"; v = true; }
      if (!oznaceno[i] && v) { html += "</mark>"; v = false; }
      html += ubezi(c);
    });
    if (v) html += "</mark>";
    return html;
  }

  // --- izris ---------------------------------------------------------------
  let zadetki = [];
  let izbran = 0;

  function isci() {
    const q = poenostavi(vnos.value);
    if (!q) {
      zadetki = kazalo.filter((z) => z.predlog);
    } else {
      const besede = q.split(" ").filter(Boolean);
      const ocenjeni = kazalo
        .map((z) => ({ z, s: tocke(z, besede, q) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s);
      // Ko je v naslovih kaj dobrega, zadetki le iz besedila odsekov samo
      // motijo ("pyt" ne isce odseka, v katerem je nekje Python).
      const prag = (ocenjeni[0]?.s ?? 0) * 0.35;
      zadetki = ocenjeni
        .filter((x) => x.s >= prag)
        .slice(0, NAJVEC)
        .map((x) => x.z);
    }
    izbran = 0;
    narisi(q);
  }

  function narisi(q) {
    const besede = q ? q.split(" ").filter(Boolean) : [];
    if (!zadetki.length) {
      seznam.innerHTML = `<div class="isk-nic">${ubezi(t("isk.nic", "Ni zadetkov"))}</div>`;
    } else {
      seznam.innerHTML = zadetki
        .map(
          (z, i) => `
        <div class="isk-zadetek-vrsta" role="option" id="isk-${i}" data-i="${i}" style="--i:${i}">
          <span class="isk-naslov">${besede.length ? oznaci(z.naslov, besede) : ubezi(z.naslov)}</span>
          <span class="isk-pot">${ubezi(z.pot)}</span>
        </div>`
        )
        .join("");
    }
    vnos.setAttribute("aria-expanded", String(zadetki.length > 0));
    oznaciIzbranega();
    // Vsak nov seznam se znova dvigne - kot da se zadetki nalagajo od spodaj.
    seznam.classList.remove("dviga");
    void seznam.offsetWidth;
    seznam.classList.add("dviga");
  }

  function oznaciIzbranega() {
    seznam.querySelectorAll(".isk-zadetek-vrsta").forEach((el) => {
      el.classList.toggle("izbran", Number(el.dataset.i) === izbran);
    });
    const el = seznam.querySelector(`[data-i="${izbran}"]`);
    if (el) {
      vnos.setAttribute("aria-activedescendant", el.id);
      el.scrollIntoView({ block: "nearest" });
    } else {
      vnos.removeAttribute("aria-activedescendant");
    }
  }

  function izberi(i) {
    const z = zadetki[i];
    if (!z) return;
    zapri();
    // Zavesa se se spusca; dejanje naj pride takoj, da stran ze tece.
    z.izvedi();
  }

  // --- odpiranje -----------------------------------------------------------
  const odprt = () => koren.classList.contains("odprt");

  function odpri() {
    if (odprt()) return;
    zgradiKazalo();
    vnos.value = "";
    koren.classList.add("odprt");
    gumb?.setAttribute("aria-expanded", "true");
    isci();
    // Fokus po okvirju, da brskalnik ne podrsa strani do vnosa.
    requestAnimationFrame(() => vnos.focus({ preventScroll: true }));
  }

  function zapri() {
    if (!odprt()) return;
    koren.classList.remove("odprt");
    gumb?.setAttribute("aria-expanded", "false");
    vnos.blur();
  }

  gumb?.setAttribute("aria-expanded", "false");
  gumb?.addEventListener("click", () => (odprt() ? zapri() : odpri()));
  zavesa.addEventListener("pointerdown", zapri);
  koren.querySelector(".isk-okvir").addEventListener("pointerdown", (e) => {
    // Klik v prazno ob plosci zapre, klik v plosco ali vrstico ne.
    if (e.target === e.currentTarget) zapri();
  });

  vnos.addEventListener("input", isci);
  seznam.addEventListener("pointermove", (e) => {
    const el = e.target instanceof Element ? e.target.closest(".isk-zadetek-vrsta") : null;
    if (el && Number(el.dataset.i) !== izbran) {
      izbran = Number(el.dataset.i);
      oznaciIzbranega();
    }
  });
  seznam.addEventListener("click", (e) => {
    const el = e.target instanceof Element ? e.target.closest(".isk-zadetek-vrsta") : null;
    if (el) izberi(Number(el.dataset.i));
  });

  vnos.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") {
      // Seznam raste navzgor: gor je naslednji zadetek.
      e.preventDefault();
      izbran = Math.min(izbran + 1, zadetki.length - 1);
      oznaciIzbranega();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      izbran = Math.max(izbran - 1, 0);
      oznaciIzbranega();
    } else if (e.key === "Enter") {
      e.preventDefault();
      izberi(izbran);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      zapri();
    }
  });

  // Bliznjici. V zajemu, da ju ne pojesta pozdrav (tipkanje v napis) ali stran.
  addEventListener(
    "keydown",
    (e) => {
      const cilj = e.target;
      const pise =
        cilj instanceof HTMLElement &&
        (cilj.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(cilj.tagName));
      const k = (e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "k";
      const posevnica = e.key === "/" && !pise && !e.ctrlKey && !e.metaKey && !e.altKey;
      if (!k && !posevnica) return;
      if (posevnica && odprt()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (odprt() && k) zapri();
      else odpri();
    },
    { capture: true }
  );

  return { odpri, zapri };
}
