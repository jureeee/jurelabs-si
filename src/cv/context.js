/**
 * Meni na desni klik.
 *
 * Uporablja iste ploskve in isto vedenje kot spustni meniji drugod v
 * aplikaciji: razred .dg za lom svetlobe, .spust-seznam za obliko in .spust-
 * izbira za vrstice. Tako ni tretjega sloga za isto reč.
 *
 * Vsebina se ravna po tem, kam si kliknil - nad sliko ponudi dejanja za sliko,
 * drugod pa dejanja za stran. Meni z vedno istimi vrsticami je le krajsa pot
 * do razocaranja.
 *
 * Postavitev je ista kot pri spustnih menijih: meni se ne sme razliti cez rob
 * zaslona, zato se ob robu prezrcali in po potrebi skrajsa.
 */

import { t } from "./jezik.js";
import { nastavitve } from "./settings.js";

const IKONA_ZUNAJ =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4"/></svg>';
const IKONA_KOPIRAJ =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a1 1 0 0 1 1-1h9"/></svg>';
const IKONA_ZOBNIK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" stroke-linecap="round"/></svg>';
const IKONA_OSEBA =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0"/></svg>';
const IKONA_MREZA =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>';

const svg = (vsebina) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${vsebina}</svg>`;
const IKONA_OKNO = svg('<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M3.5 9h17M7 7h.01M9.5 7h.01"/>');
const IKONA_SLIKA = svg('<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m20 16-4.5-4.5L7 19"/>');
const IKONA_POSTA = svg('<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>');
const IKONA_POVEZAVA = svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>');
const IKONA_SVET = svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.4 5.2 3.4 8.5s-1 6.1-3.4 8.5c-2.4-2.4-3.4-5.2-3.4-8.5s1-6.1 3.4-8.5z"/>');
const IKONA_RAZSIRI = svg('<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/>');
const IKONA_SKRCI = svg('<path d="M9 4v4a1 1 0 0 1-1 1H4M20 9h-4a1 1 0 0 1-1-1V4M15 20v-4a1 1 0 0 1 1-1h4M4 15h4a1 1 0 0 1 1 1v4"/>');
const IKONE_STRANI = {
  arhiv: svg('<rect x="3.5" y="4.5" width="17" height="4.5" rx="1.2"/><path d="M5 9v9.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4"/>'),
  delo: svg('<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 12.5h17"/>'),
  omeni: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>'),
  stik: svg('<path d="M20 15.5a2 2 0 0 1-2 2H8l-4 3.5V6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/>'),
};

/** @param {{odpri: () => void}} profil @param {{odpri: () => void}} plosca */
export function installContextMenu(profil, plosca) {
  const meni = document.createElement("div");
  meni.className = "spust-seznam kmeni dg";
  document.body.appendChild(meni);

  const vrstica = (ime, ikona, opravilo) => ({ ime, ikona, opravilo });
  const locnica = "locnica";

  const kopiraj = (besedilo) => navigator.clipboard?.writeText(besedilo);
  const celZaslon = () => !!document.fullscreenElement;

  /** Dejanja za tisto, kar je pod kazalcem - pridejo na vrh menija. */
  function vrsticeCilja(cilj) {
    const izbrano = String(getSelection() ?? "").trim();
    if (izbrano) {
      return [vrstica(t("kmeni.kopirajBesedilo", "Kopiraj"), IKONA_KOPIRAJ, () => kopiraj(izbrano))];
    }

    const polje = cilj?.closest?.(".prof-polje");
    if (polje) {
      const url = polje.dataset.url;
      return [
        vrstica(t("kmeni.novZavihek", "Odpri v novem zavihku"), IKONA_ZUNAJ, () => window.open(url, "_blank", "noopener")),
        vrstica(t("kmeni.kopiraj", "Kopiraj naslov"), IKONA_KOPIRAJ, () => kopiraj(new URL(url, location.href).href)),
      ];
    }

    const aplikacija = cilj?.closest?.(".zapis-odpri");
    if (aplikacija) {
      return [
        vrstica(t("zapis.odpri", "Odpri aplikacijo"), IKONA_OKNO, () => aplikacija.click()),
        vrstica(t("kmeni.novZavihek", "Odpri v novem zavihku"), IKONA_ZUNAJ, () =>
          window.open(aplikacija.dataset.aplikacija, "_blank", "noopener")
        ),
      ];
    }

    const slika = cilj?.closest?.(".zapis-slika")?.querySelector("img");
    if (slika) {
      return [
        vrstica(t("kmeni.odpriSliko", "Odpri sliko"), IKONA_SLIKA, () => slika.click()),
        vrstica(t("kmeni.kopirajSliko", "Kopiraj naslov slike"), IKONA_KOPIRAJ, () => kopiraj(slika.currentSrc || slika.src)),
      ];
    }

    const povezava = cilj?.closest?.("a[href]");
    if (povezava) {
      if (povezava.href.startsWith("mailto:")) {
        const naslov = decodeURIComponent(povezava.href.slice(7).split("?")[0]);
        return [vrstica(t("kmeni.kopirajEposto", "Kopiraj e-poštni naslov"), IKONA_POSTA, () => kopiraj(naslov))];
      }
      return [
        vrstica(t("kmeni.novZavihek", "Odpri v novem zavihku"), IKONA_ZUNAJ, () => window.open(povezava.href, "_blank", "noopener")),
        vrstica(t("kmeni.kopirajPovezavo", "Kopiraj povezavo"), IKONA_POVEZAVA, () => kopiraj(povezava.href)),
      ];
    }
    return [];
  }

  /** Vsebina se ravna po tem, kam si kliknil. */
  function vrsticeZa(cilj) {
    const zgoraj = vrsticeCilja(cilj);

    // Strani po zavihkih v meniju - napis vzamemo z gumba, da je ze preveden.
    const strani = [...document.querySelectorAll('.nav [role="tab"][data-stran]')].map((z) =>
      vrstica(z.textContent.trim(), IKONE_STRANI[z.dataset.stran] ?? IKONA_MREZA, () => z.click())
    );

    return [
      ...zgoraj,
      ...(zgoraj.length ? [locnica] : []),
      ...strani,
      locnica,
      vrstica(t("kmeni.profil", "Profil"), IKONA_OSEBA, () => profil.odpri()),
      vrstica(t("kmeni.nastavitve", "Nastavitve"), IKONA_ZOBNIK, () => plosca.odpri()),
      vrstica(t("kmeni.jezik", "Jezik"), IKONA_SVET, () => document.querySelector(".jez")?.click()),
      locnica,
      vrstica(t("kmeni.kopirajStran", "Kopiraj povezavo do strani"), IKONA_POVEZAVA, () => kopiraj(location.href)),
      celZaslon()
        ? vrstica(t("kmeni.izhodCelozaslonsko", "Zapusti celozaslonski način"), IKONA_SKRCI, () => document.exitFullscreen?.())
        : vrstica(t("kmeni.celozaslonsko", "Celozaslonski način"), IKONA_RAZSIRI, () =>
            document.documentElement.requestFullscreen?.()
          ),
      vrstica(t("kmeni.ponastavi", "Ponastavi pogled"), IKONA_MREZA, () => {
        nastavitve.ozadje = "galaksija";
        document.dispatchEvent(new CustomEvent("nast-sprememba", { bubbles: true }));
      }),
    ];
  }

  let vrstice = [];

  function narisi(seznam) {
    vrstice = seznam.filter((v) => v !== locnica);
    let i = 0;
    meni.innerHTML = seznam
      .map((v) =>
        v === locnica
          ? '<span class="spust-locnica"></span>'
          : `<button type="button" class="spust-izbira" data-i="${i++}">` +
            `<span class="kmeni-ikona">${v.ikona}</span><span>${v.ime}</span></button>`
      )
      .join("");
  }

  function zapri() {
    meni.classList.remove("odprt");
  }

  addEventListener("contextmenu", (e) => {
    // Znotraj vnosnih polj pustimo sistemski meni - tam ponuja rezanje in
    // lepljenje, ki ju sami ne znamo.
    if (e.target instanceof Element && e.target.closest("input, textarea")) return;
    e.preventDefault();

    narisi(vrsticeZa(e.target instanceof Element ? e.target : null));

    // Izmerimo, preden pokazemo, sicer visine se ni.
    meni.style.visibility = "hidden";
    meni.style.maxHeight = "";
    meni.style.top = "0px";
    meni.style.left = "0px";
    meni.classList.add("odprt");

    const v = meni.offsetHeight;
    const s = meni.offsetWidth;
    // Ob robu se meni prezrcali, da ne visi cez zaslon.
    const navzgor = e.clientY + v + 14 > window.innerHeight && e.clientY > v + 14;
    const levo = e.clientX + s + 14 > window.innerWidth;

    // Ce ne gre ne gor ne dol, ga potisnemo navzgor, kolikor je treba, da ostane ves na zaslonu.
    const zgoraj = navzgor ? e.clientY - v : Math.min(e.clientY, window.innerHeight - v - 12);
    meni.style.top = `${Math.max(12, zgoraj)}px`;
    meni.style.left = `${levo ? Math.max(12, e.clientX - s) : e.clientX}px`;
    meni.style.transformOrigin = `${navzgor ? "bottom" : "top"} ${levo ? "right" : "left"}`;
    meni.style.visibility = "";
  });

  meni.addEventListener("click", (e) => {
    const b = e.target instanceof Element ? e.target.closest(".spust-izbira") : null;
    if (!b) return;
    e.stopPropagation();
    zapri();
    vrstice[Number(b.dataset.i)]?.opravilo?.();
  });

  addEventListener("pointerdown", (e) => {
    if (e.target instanceof Element && e.target.closest(".kmeni")) return;
    zapri();
  });
  addEventListener("keydown", (e) => e.key === "Escape" && zapri());
  addEventListener("resize", zapri);
  addEventListener("scroll", zapri, { passive: true, capture: true });
}
