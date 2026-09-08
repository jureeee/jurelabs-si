/**
 * Sij pod izbranim besedilom.
 *
 * ::selection sprejema le pescico lastnosti - barvo, ozadje in senco besedila.
 * Zabrisa ali zaobljenih robov mu ni mogoce dati, zato je sistemska izbira
 * vedno oster pravokotnik.
 *
 * Tu je narisana svoja plast: iz obmocja izbire vzamemo pravokotnike
 * (Range.getClientRects vrne enega na vrstico) in jih narisemo kot mehke
 * zaobljene lise. Zabris je na celi plasti in ne na vsaki lisi posebej - tako
 * se sosednje vrstice zlijejo v eno telo namesto v niz locenih packic.
 *
 * Mesanje je "screen": ploskev pod besedilom se posvetli, belo besedilo pa
 * ostane belo. Navadna prosojna plast cez besedilo bi ga zbledila.
 *
 * Sama izbira ostane prava izbira - besedilo je se vedno mogoce kopirati.
 * Sistemsko ozadje le skrijemo.
 */

import "./selection.css";

/** Pod to velikostjo je pravokotnik ostanek prazne vrstice, ne besedilo. */
const NAJMANJ = 2;

export function installSelectionGlow() {
  const plast = document.createElement("div");
  plast.className = "izbira-sij";
  document.body.appendChild(plast);

  let cakalec = null;

  function narisi() {
    const izbira = document.getSelection();
    plast.replaceChildren();
    if (!izbira || izbira.isCollapsed || izbira.rangeCount === 0) return;

    const obmocje = izbira.getRangeAt(0);
    const kosi = [];
    for (const r of obmocje.getClientRects()) {
      if (r.width < NAJMANJ || r.height < NAJMANJ) continue;
      const lisa = document.createElement("span");
      // Rahlo razsirimo: zabris sicer poje robove in izbira je videti ozja od
      // besedila, ki ga pokriva.
      lisa.style.cssText =
        `left:${r.left - 3}px;top:${r.top - 2}px;` +
        `width:${r.width + 6}px;height:${r.height + 4}px`;
      kosi.push(lisa);
    }
    plast.append(...kosi);
  }

  /**
   * Med vlecenjem se izbira spreminja ob vsakem pikslu. Risanje odlozimo v
   * naslednjo slicico, sicer bi pri dolgem besedilu racunali lege veckrat, kot
   * jih je mogoce prikazati.
   */
  function osvezi() {
    if (cakalec) return;
    cakalec = requestAnimationFrame(() => {
      cakalec = null;
      narisi();
    });
  }

  document.addEventListener("selectionchange", osvezi);
  // Lege so v koordinatah okna, zato jih ob drsenju preracunamo.
  addEventListener("scroll", osvezi, { passive: true, capture: true });
  addEventListener("resize", osvezi);
}
