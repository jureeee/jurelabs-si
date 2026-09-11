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

/** @param {{odpri: () => void}} profil @param {{odpri: () => void}} plosca */
export function installContextMenu(profil, plosca) {
  const meni = document.createElement("div");
  meni.className = "spust-seznam kmeni dg";
  document.body.appendChild(meni);

  const vrstica = (ime, ikona, opravilo) => ({ ime, ikona, opravilo });
  const locnica = "locnica";

  /** Vsebina se ravna po tem, kam si kliknil. */
  function vrsticeZa(cilj) {
    const polje = cilj?.closest?.(".prof-polje");
    if (polje) {
      const url = polje.dataset.url;
      return [
        vrstica(t("kmeni.novZavihek", "Odpri v novem zavihku"), IKONA_ZUNAJ, () => window.open(url, "_blank", "noopener")),
        vrstica(t("kmeni.kopiraj", "Kopiraj naslov"), IKONA_KOPIRAJ, () =>
          navigator.clipboard?.writeText(new URL(url, location.href).href)
        ),
        locnica,
        vrstica(t("kmeni.nastavitve", "Nastavitve"), IKONA_ZOBNIK, () => plosca.odpri()),
      ];
    }
    return [
      vrstica(t("kmeni.profil", "Profil"), IKONA_OSEBA, () => profil.odpri()),
      vrstica(t("kmeni.nastavitve", "Nastavitve"), IKONA_ZOBNIK, () => plosca.odpri()),
      locnica,
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

    const prostor = navzgor ? e.clientY - 14 : window.innerHeight - e.clientY - 14;
    meni.style.maxHeight = `${Math.max(140, Math.min(v, prostor))}px`;
    meni.style.top = `${navzgor ? Math.max(12, e.clientY - v) : e.clientY}px`;
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
