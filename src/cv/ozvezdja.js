/**
 * Ozvezdja v galaksiji.
 *
 * Ozvezdje ni razpeto cez celo nebo, ampak je majhen lik, ki stoji v prostoru
 * galaksije in se z njo premika. Ker so v istem prostoru kot njene zvezde, ob
 * krozenju kamere dobijo pravo paralakso - nebo, pribito na zaslon, bi se
 * izdalo v prvi sekundi.
 *
 * Crtna figura je privzeto komaj vidna. Ko prides z misko nadnjo, se izrise,
 * zraven pa pride ime in risba, ce zanjo obstaja slika.
 *
 * Kar je za srediscem galaksije, je skrito: gledalec naj ne lovi ozvezdja, ki
 * lezi na drugi strani diska in ga zakriva sto tisoc zvezd.
 *
 * Oblika lika: prave zvezde ozvezdja so smeri na nebu, zato jih preslikamo na
 * ravnino (gnomonska projekcija okoli sredisca ozvezdja) in umerimo na enotsko
 * velikost. Razmerja med zvezdami tako ostanejo prava, lik pa postane predmet,
 * ki ga je mogoce postaviti kamor koli.
 */

import * as THREE from "three";
import "./ozvezdja.css";
import { OZVEZDJA } from "./ozvezdja-podatki.js";
import { jezik, obJeziku } from "./jezik.js";

/** Kako velik je lik glede na polmer galaksije. */
const MERILO = 0.085;
/**
 * Na kaksni razdalji od sredisca stojijo, v polmerih galaksije.
 *
 * Blizje kot so, dlje casa ostanejo v okviru zaslona. Pri 0.62 do 0.98 jih je
 * bilo pol cez rob in gledalec je videl dve od desetih.
 */
const ODMIK_NAJMANJ = 0.5;
const ODMIK_NAJVEC = 0.78;
/** Koliko pik od crte se steje za "sem nad ozvezdjem". */
const DOSEG_PIK = 44;
/**
 * Crt v mirovanju ni: na nebu so samo zvezde, tako kot v resnici. Figura se
 * narise sele pod kazalcem - takrat se izrise po vrsti, od zvezde do zvezde,
 * kot bi jo nekdo povlekel s prstom.
 */
const CRTA_NAD = 0.8;
/** Koliko prehoda porabi risanje; ostanek je ze izrisana figura. */
const RISANJE = 0.75;
/**
 * Zvezde ozvezdij so navadne zvezde galaksije.
 *
 * Iste stevilke kot v cv.js (STAR_SIZE_MIN, STAR_SIZE_SPREAD, STAR_BRIGHT_MIN,
 * STAR_BRIGHT_SPREAD), le da delez ne pride iz nakljucja, ampak iz magnitude.
 */
const ZVEZDA_NAJMANJ = 0.0016;
const ZVEZDA_RAZPON = 0.0085;
const SVETLOST_NAJMANJ = 0.32;
const SVETLOST_RAZPON = 2.6;
/** Koliko se zvezde ojacajo, ko je ozvezdje pod kazalcem. */
const DVIG_POD_KAZALCEM = 0.45;
/** Dusenje prehodov; nizje je pocasneje. */
const PREHOD = 0.12;

/** Risbe ozvezdij: datoteka se imenuje po kljucu, npr. leo.webp. */
const RISBE = import.meta.glob("../assets/ozvezdja/*.{webp,png,jpg,svg}", {
  eager: true,
  query: "?url",
  import: "default",
});
const risbaZa = (kljuc) => {
  const najdena = Object.entries(RISBE).find(([pot]) => pot.split("/").pop().split(".")[0] === kljuc);
  return najdena ? najdena[1] : null;
};

/** Rektascenzija in deklinacija v stopinjah -> smer na enotski krogli. */
function smer(ra, dec) {
  const a = THREE.MathUtils.degToRad(ra);
  const d = THREE.MathUtils.degToRad(dec);
  return new THREE.Vector3(Math.cos(d) * Math.cos(a), Math.sin(d), -Math.cos(d) * Math.sin(a));
}

/**
 * Zvezde ozvezdja, preslikane na ravnino in umerjene na polmer 1.
 *
 * Gnomonska projekcija je tista, ki ravne crte na nebu pusti ravne - zato lik
 * ostane tak, kot ga vidi oko, in se ne zvije.
 */
function ravninskeTocke(zvezde) {
  const smeri = zvezde.map((z) => smer(z[0], z[1]));
  const sredina = smeri.reduce((v, s) => v.add(s), new THREE.Vector3()).normalize();
  const u = new THREE.Vector3(0, 1, 0).cross(sredina);
  if (u.lengthSq() < 1e-6) u.set(1, 0, 0);
  u.normalize();
  const v = new THREE.Vector3().crossVectors(sredina, u).normalize();

  const ravno = smeri.map((s) => {
    const globina = Math.max(0.2, s.dot(sredina));
    const p = s.clone().divideScalar(globina).sub(sredina);
    return new THREE.Vector2(p.dot(u), p.dot(v));
  });
  const polmer = Math.max(...ravno.map((p) => p.length())) || 1;
  return ravno.map((p) => new THREE.Vector3(p.x / polmer, p.y / polmer, 0));
}

/** Svetlejsa zvezda je vecja; magnituda tece obratno. */
const velikostZvezde = (mag) => Math.max(1.3, 4.3 - mag * 0.5);

/**
 * Lege ozvezdij: Fibonaccijeva spirala po krogli, da so razmetana enakomerno
 * in vedno na istem mestu. Nakljucje bi ob vsakem odprtju premesalo nebo.
 */
function lega(i, skupaj) {
  const zlati = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (i / Math.max(1, skupaj - 1)) * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const kot = zlati * i;
  // Disk galaksije je gost, zato so liki potisnjeni proc od njegove ravnine.
  const yy = (y >= 0 ? 1 : -1) * (0.22 + Math.abs(y) * 0.45);
  const smerLege = new THREE.Vector3(Math.cos(kot) * r, yy, Math.sin(kot) * r).normalize();
  const delez = ODMIK_NAJMANJ + (((i * 7) % 5) / 4) * (ODMIK_NAJVEC - ODMIK_NAJMANJ);
  return { smerLege, delez };
}

export function installOzvezdja(camera, renderer) {
  const skupina = new THREE.Group();
  skupina.visible = false;

  const sloj = document.createElement("div");
  sloj.className = "ozv-sloj";
  sloj.setAttribute("aria-hidden", "true");
  document.body.appendChild(sloj);

  let polmerGalaksije = 0;

  const vsa = OZVEZDJA.map((o, i) => {
    const tocke = ravninskeTocke(o.zvezde);
    const gnezdo = new THREE.Group();

    // Mejniki ozvezdja so iste zvezde kot v galaksiji: isti sencilnik, isti
    // difrakcijski kraki, isti sij. Svoja risba tock bi se videla kot nalepka
    // na prizoru. Material dobimo od galaksije sele ob postavitvi, zato tu
    // naredimo samo geometrijo in zacasen prostor zanj.
    const gZvezde = new THREE.BufferGeometry().setFromPoints(tocke);
    const zvezde = new THREE.Points(gZvezde, new THREE.PointsMaterial({ visible: false }));
    zvezde.frustumCulled = false;
    gnezdo.add(zvezde);

    // Vsaka tocka crte ve, kako dalec po figuri lezi (0 na zacetku, 1 na
    // koncu). Sencilnik odkrije le tisto, kar je pred napredkom risanja.
    const pari = [];
    const zaporedje = [];
    o.crte.forEach(([a, b], k) => {
      pari.push(tocke[a], tocke[b]);
      const od = k / Math.max(1, o.crte.length);
      const do_ = (k + 1) / Math.max(1, o.crte.length);
      zaporedje.push(od, do_);
    });
    const gCrte = new THREE.BufferGeometry().setFromPoints(pari);
    gCrte.setAttribute("aKje", new THREE.BufferAttribute(new Float32Array(zaporedje), 1));
    const mCrte = new THREE.ShaderMaterial({
      uniforms: { uMoc: { value: 0 }, uNapredek: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float aKje;
        varying float vKje;
        void main() {
          vKje = aKje;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform float uMoc;
        uniform float uNapredek;
        varying float vKje;
        void main() {
          // Mehak konec poteze, da se crta ne pojavi s stopnico.
          float odkrito = smoothstep(vKje - 0.14, vKje, uNapredek);
          float a = uMoc * odkrito;
          if (a <= 0.001) discard;
          gl_FragColor = vec4(vec3(0.62, 0.75, 1.0) * a, a);
        }`,
    });
    const crte = new THREE.LineSegments(gCrte, mCrte);
    crte.frustumCulled = false;
    gnezdo.add(crte);
    skupina.add(gnezdo);

    const okvir = document.createElement("div");
    okvir.className = "ozv-napis";
    const risba = risbaZa(o.kljuc);
    okvir.innerHTML =
      (risba ? `<img class="ozv-risba" src="${risba}" alt="" />` : "") + `<span class="ozv-ime"></span>`;
    sloj.appendChild(okvir);

    return {
      podatki: o,
      indeks: i,
      tocke,
      gnezdo,
      gZvezde,
      zvezde,
      mCrte,
      okvir,
      ime: okvir.querySelector(".ozv-ime"),
      risba: okvir.querySelector(".ozv-risba"),
      zaslon: tocke.map(() => new THREE.Vector3()),
      svet: new THREE.Vector3(),
      moc: 0,
      blizu: 0,
      vidnih: 0,
      sredx: 0,
      sredy: 0,
      sirinaPik: 0,
    };
  });

  function napisiImena() {
    const en = jezik() !== "sl";
    for (const o of vsa) o.ime.textContent = en ? o.podatki.imeEn : o.podatki.ime;
  }
  napisiImena();
  obJeziku(napisiImena);

  /**
   * Postavitev v prizor. Klicana, ko je galaksija nalozena in izmerjena -
   * prej ne vemo, kako velika je in kje stoji.
   */
  function postavi(koren, sredina, polmer, zvezdniMaterial) {
    polmerGalaksije = polmer;
    koren.add(skupina);
    // Skupina zivi v prostoru galaksije, zato mora biti v njenih koordinatah.
    koren.updateWorldMatrix(true, false);
    skupina.position.copy(koren.worldToLocal(sredina.clone()));

    const materiali = [];
    vsa.forEach((o, i) => {
      const { smerLege, delez } = lega(i, vsa.length);
      o.gnezdo.position.copy(smerLege).multiplyScalar(polmer * delez);
      // Lik gleda proc od sredisca, da ga od zunaj vidimo od spredaj.
      o.gnezdo.lookAt(o.gnezdo.position.clone().multiplyScalar(2));
      o.gnezdo.scale.setScalar(polmer * MERILO);

      // Vsako ozvezdje dobi svoj izvod materiala, ker se moc pod kazalcem
      // spreminja posamic. Velikost je v svetovnih enotah, zato je vezana na
      // polmer galaksije in ne na merilo lika.
      const n = o.podatki.zvezde.length;
      const velikost = new Float32Array(n);
      const svetlost = new Float32Array(n);
      const barva = new Float32Array(n * 3);
      o.podatki.zvezde.forEach((z, k) => {
        // Ista lestvica kot pri zvezdah galaksije, le da delez ne pride iz
        // nakljucja, ampak iz magnitude: mejnik ozvezdja je navadna zvezda,
        // ne poudarjena pika. Vecja ali svetlejsa bi se izdala kot nalepka.
        const delez = Math.max(0, Math.min(1, (4.6 - z[2]) / 3.4));
        velikost[k] = polmer * (ZVEZDA_NAJMANJ + delez * ZVEZDA_RAZPON);
        svetlost[k] = SVETLOST_NAJMANJ + delez * SVETLOST_RAZPON;
        barva[k * 3] = 0.86;
        barva[k * 3 + 1] = 0.9;
        barva[k * 3 + 2] = 1;
      });
      o.gZvezde.setAttribute("aVelikost", new THREE.BufferAttribute(velikost, 1));
      o.gZvezde.setAttribute("aSvetlost", new THREE.BufferAttribute(svetlost, 1));
      o.gZvezde.setAttribute("aBarva", new THREE.BufferAttribute(barva, 3));

      o.mZvezde = zvezdniMaterial.clone();
      // Osnovna moc je natanko galaksijina; pod kazalcem se le malo dvigne.
      o.osnovnaMoc = o.mZvezde.uniforms.uMoc.value;
      o.mZvezde.uniforms.uMoc.value = o.osnovnaMoc;
      o.zvezde.material = o.mZvezde;
      materiali.push(o.mZvezde);
    });
    skupina.visible = true;
    // Vrnjeni materiali gredo v isti seznam kot galaksijini, da ob spremembi
    // velikosti okna in nastavitve velikosti zvezd dobijo novo merilo.
    return materiali;
  }

  // --- kazalec ---
  let mis = null;
  addEventListener(
    "pointermove",
    (e) => {
      mis = e.pointerType === "touch" ? null : { x: e.clientX, y: e.clientY };
    },
    { passive: true }
  );
  addEventListener("pointerleave", () => (mis = null), { passive: true });

  /** Razdalja tocke do daljice, v pikah zaslona. */
  function doDaljice(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const dolzina = dx * dx + dy * dy;
    const t = dolzina ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / dolzina)) : 0;
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }

  let vidno = true;
  const nastavi = (da) => {
    vidno = da;
    skupina.visible = da && polmerGalaksije > 0;
    sloj.classList.toggle("skrit", !da);
  };

  const sredisceSvet = new THREE.Vector3();

  let slicic = 0;

  function korak() {
    if (!vidno || !polmerGalaksije) return;
    // Lege na zaslonu racunamo vsako drugo slicico: kazalec se v 16 ms ne
    // premakne toliko, da bi se poznalo, dela pa je pol manj.
    slicic += 1;
    if (slicic % 2 === 0) {
      posodobiMoci();
      return;
    }

    const platno = renderer.domElement;
    const sirina = platno.clientWidth;
    const visina = platno.clientHeight;
    skupina.getWorldPosition(sredisceSvet);
    const doSredisca = camera.position.distanceTo(sredisceSvet);

    let najblizje = null;
    let najmanj = DOSEG_PIK;

    for (const o of vsa) {
      o.gnezdo.getWorldPosition(o.svet);
      // Za srediscem galaksije: lik je na drugi strani diska in ga ne kazemo.
      const zaGalaksijo = camera.position.distanceTo(o.svet) > doSredisca;

      let vidnih = 0;
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < o.tocke.length; i += 1) {
        const p = o.zaslon[i].copy(o.tocke[i]);
        o.gnezdo.localToWorld(p).project(camera);
        const zaSabo = p.z > 1;
        p.x = ((p.x + 1) / 2) * sirina;
        p.y = ((1 - p.y) / 2) * visina;
        p.z = zaSabo ? 1 : 0;
        if (zaSabo) continue;
        vidnih += 1;
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
      o.vidnih = vidnih;
      o.sredx = (minX + maxX) / 2;
      o.sredy = (minY + maxY) / 2;
      o.sirinaPik = maxX - minX;
      // Za galaksijo so videti enako kot vse druge zvezde - le loviti se jih ne
      // da, ker bi pomenilo ciljati skozi disk.
      o.blizu = zaGalaksijo ? 0 : 1;

      if (!mis || zaGalaksijo || vidnih < 2) continue;
      for (const [a, b] of o.podatki.crte) {
        const pa = o.zaslon[a];
        const pb = o.zaslon[b];
        if (pa.z || pb.z) continue;
        const d = doDaljice(mis.x, mis.y, pa.x, pa.y, pb.x, pb.y);
        if (d < najmanj) {
          najmanj = d;
          najblizje = o;
        }
      }
    }

    najblizjeZdaj = najblizje;
    posodobiMoci();
  }

  /** Prehodi moci in postavitev napisa; tece vsako slicico. */
  let najblizjeZdaj = null;
  function posodobiMoci() {
    for (const o of vsa) {
      const cilj = o === najblizjeZdaj ? 1 : 0;
      o.moc += (cilj - o.moc) * PREHOD;
      if (o.moc < 0.002 && cilj === 0) o.moc = 0;

      // Ozvezdje za galaksijo ugasne v celoti.
      o.mCrte.uniforms.uMoc.value = CRTA_NAD * o.moc * o.blizu;
      // Risanje je hitrejse od pojemanja moci, da je poteza vidna kot poteza.
      o.mCrte.uniforms.uNapredek.value = Math.min(1, o.moc / RISANJE);
      if (o.mZvezde) o.mZvezde.uniforms.uMoc.value = o.osnovnaMoc * (1 + DVIG_POD_KAZALCEM * o.moc);

      if (o.moc > 0.002 && o.vidnih > 1) {
        o.okvir.style.transform =
          `translate(${Math.round(o.sredx)}px, ${Math.round(o.sredy)}px) translate(-50%, -50%)`;
        o.okvir.style.opacity = String(o.moc);
        o.okvir.style.visibility = "visible";
        // Risba je velika kot lik na zaslonu, da sede na zvezde in ne lebdi.
        if (o.risba) o.risba.style.width = `${Math.round(Math.max(110, o.sirinaPik * 1.35))}px`;
      } else if (o.okvir.style.visibility !== "hidden") {
        o.okvir.style.visibility = "hidden";
        o.okvir.style.opacity = "0";
      }
    }
  }

  return { korak, nastavi, postavi };
}
