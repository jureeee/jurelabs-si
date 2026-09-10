/**
 * Zemlja na strani Stik.
 *
 * Globus se zavrti in se ustavi tako, da je Slovenija na sredini, sever pa
 * navzgor; nato se okoli nje izrise meja. Zaporedje je namerno - dokler se
 * vrti, ne ve nihce, kam gleda, zato meja pride sele, ko je mirno.
 *
 * Dvoje je bilo treba ugotoviti in ne uganiti.
 *
 * Prvo, kako dolzina in sirina lezita na modelu. Preverjeno z mrezo
 * poldnevnikov in vzporednikov, izrisano cez model: dolzina tece v nasprotno
 * smer od pricakovane, izhodisca pa ni treba zamikati.
 *
 * Drugo, lega modela. Izvozen je s polom obrnjenim proti kameri; vrtenje
 * okoli pola zato prizora ni obracalo, ampak ga je le vrtelo v krogu, kot bi
 * gledal na plosco od zgoraj. Koncne lege torej ne prevzamemo od modela,
 * ampak jo zgradimo: iz smeri proti Sloveniji in smeri proti severu sestavimo
 * bazo in jo poravnamo z bazo zaslona.
 *
 * Vrtenje ni zanka, ki bi jo nekdo ustavil. Odigramo ga kot odmik od koncne
 * lege, ki gre proti nic - globus se zato ustavi natanko tam, kjer mora.
 *
 * Globus se da tudi zavrteti z misko. Vlecenje po vodoravnici ga vrti okoli
 * lastne osi, po navpicnici pa nagiba; nagib je omejen, da ne konca na glavi.
 * Ker po koncanem priletu izrisa nihce ne poganja, med vlecenjem izrisemo
 * sliko po sliki sami - zanka, ki bi tekla ves cas, bi risala prazno.
 *
 * Prizor je svoj, loceni izris. Galaksija tece v svojem platnu pod njim in
 * ostane cela.
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import modelUrl from "../assets/3d models/zemlja.glb?url";
import { MEJA_SLO } from "./meja-slo.js";

/**
 * Kam gleda globus, ko obmiruje.
 *
 * To NISTA koordinati Ljubljane, ceprav bi po imenu morali biti. Med tem
 * sistemom in tistim, po katerem so na modelu polozene teksture, je se ena
 * zasukanost, ki je nisem izmeril; vrednosti sta zato nastavljeni na roko,
 * dokler globus ne gleda na Sredozemlje.
 *
 * Prava resitev je iz stirih cetrtin modela sestaviti eno samo enakokotno
 * teksturo in jo poloziti na svojo kroglo. Takrat je preslikava nasa in
 * tocna, meja Slovenije pa pade tja, kamor sodi.
 */
const CILJ_LON = 14.5058;
const CILJ_LAT = 68;

/** Smer dolzine na modelu in zamik izhodisca; izmerjeno z mrezo. */
const SMER = -1;
const LON_ZAMIK = 0;

/** Koliko celih obratov naredi, preden se ustavi. */
const OBRATOV = 2;
/** Trajanje vrtenja in izrisa meje. */
const VRTENJE_MS = 5600;
const MEJA_MS = 1500;
/** Zamik med koncem vrtenja in zacetkom risanja meje. */
const PREMOR_MS = 320;

/** Koliko nad povrsjem lezi crta, da je krogla ne poje. */
const DVIG = 1.004;

/**
 * Ali se meja Slovenije izrise.
 *
 * Zaenkrat ne. Lega globusa je prava - Evropa je obrnjena proti gledalcu in
 * sever je zgoraj - crta pa pade na Cad namesto na Slovenijo. Med mojim
 * sistemom sirine in dolzine ter tistim, po katerem so polozene teksture
 * tega modela, je se ena neznana zasukanost; sib med cetrtinami je pri y = 0,
 * torej pola geometrije in teksture nista ista.
 *
 * Dokler to ni razreseno, je bolje ne narisati nicesar, kot narisati obris
 * cez Afriko in mu reci Slovenija.
 */
const MEJA_VIDNA = false;
/** Koliko prostora okoli globusa pusti kamera. 1 je tesno. */
const ZRAK = 1.05;

/** Koliko radianov na sliko premika vlecenje in do kod sme nagib. */
const VLEK = 0.0085;
const NAGIB_MEJA = Math.PI * 0.38;

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Tocka na krogli iz zemljepisnih koordinat, v prostoru modela.
 *
 * Sever modela je -y in ne +y. Mreza poldnevnikov tega ne pokaze, ker je
 * simetricna: obrnjena je videti enako. Pokaze se sele, ko na globus polozis
 * nekaj, kar ni simetricno - Slovenija je pristala na Antarktiki.
 */
function naKroglo(lonStopinj, latStopinj, r) {
  const lon = ((SMER * lonStopinj + LON_ZAMIK) * Math.PI) / 180;
  const lat = (latStopinj * Math.PI) / 180;
  const k = Math.cos(lat);
  return new THREE.Vector3(r * k * Math.cos(lon), -r * Math.sin(lat), -r * k * Math.sin(lon));
}

/** @param {HTMLElement} gnezdo ploskev, na katero se globus izrise */
export function installZemlja(gnezdo) {
  const izrisovalnik = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  izrisovalnik.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  izrisovalnik.outputColorSpace = THREE.SRGBColorSpace;
  izrisovalnik.setClearAlpha(0);
  izrisovalnik.domElement.className = "zemlja-platno";
  gnezdo.appendChild(izrisovalnik.domElement);

  const prizor = new THREE.Scene();
  const kamera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);

  // Malo razsvetljave: dnevna stran naj bo komaj vidna, da nocne luci ostanejo
  // najsvetlejse na globusu. Pri mocnejsi luci luci potonejo v dan.
  prizor.add(new THREE.AmbientLight(0xffffff, 0.28));
  const sonce = new THREE.DirectionalLight(0xbcd0ff, 1.05);
  sonce.position.set(-2.4, 1.1, 1.6);
  prizor.add(sonce);

  const nosilec = new THREE.Group();
  prizor.add(nosilec);

  let skupina = null;      // vozlisce z Zemljo; vrtimo okoli njegove osi y
  let zacetnaLega = null;  // njegova lega, preden zavrtimo
  let meja = null;
  let polmerLok = 1;

  let zanka = null;
  let viden = false;
  let zacetek = 0;
  let skupniKot = 0;
  let koncnaLega = null;   // lega nosilca, preden vanjo posezemo z misko

  /** Kar je uporabnik zavrtel sam. Sesteva se s priletom. */
  let rocniObrat = 0;
  let rocniNagib = 0;
  /** Koliko priletu je ze odigrano; potrebuje ga izris na zahtevo. */
  let odigranoDelez = 1;

  const nalozen = new Promise((res) => {
    new GLTFLoader().load(
      modelUrl,
      (g) => {
        nosilec.add(g.scene);
        skupina = g.scene.getObjectByName("Earth_Geo2") || g.scene;
        zacetnaLega = skupina.quaternion.clone();

        // Polmer iz zdruzene skatle vseh stirih cetrtin. Ocrtana krogla ene
        // same cetrtine je vecja od globusa - crta bi lebdela nad njim.
        const skatla = new THREE.Box3();
        skupina.children
          .filter((c) => c.isMesh)
          .forEach((c) => {
            c.geometry.computeBoundingBox();
            skatla.union(c.geometry.boundingBox);
          });
        const mere = skatla.getSize(new THREE.Vector3());
        polmerLok = Math.max(mere.x, mere.y, mere.z) * 0.5;

        naredMejo();
        namestiKamero(g.scene);
        postaviLego(g.scene);
        res(true);
      },
      undefined,
      () => res(false)
    );
  });

  /** Crta po obodu drzave, otrok skupine - torej se vrti skupaj z Zemljo. */
  function naredMejo() {
    const tocke = [];
    for (let i = 0; i < MEJA_SLO.length; i += 2) {
      tocke.push(naKroglo(MEJA_SLO[i], MEJA_SLO[i + 1], polmerLok * DVIG));
    }
    const geo = new THREE.BufferGeometry().setFromPoints([...tocke, tocke[0]]);
    meja = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color: 0xe4eeff, transparent: true, opacity: 0.95 })
    );
    meja.frustumCulled = false;
    meja.geometry.setDrawRange(0, 0);
    if (MEJA_VIDNA) skupina.add(meja);
  }

  /** Kamera gleda v sredisce globusa, dovolj dalec, da gre cel na ploskev. */
  function namestiKamero(koren) {
    const skatla = new THREE.Box3().setFromObject(koren);
    const sredisce = skatla.getCenter(new THREE.Vector3());
    const mere = skatla.getSize(new THREE.Vector3());
    const r = Math.max(mere.x, mere.y, mere.z) * 0.5;
    const d = (r / Math.tan((kamera.fov * Math.PI) / 360)) * ZRAK;
    kamera.position.set(sredisce.x, sredisce.y, sredisce.z + d);
    kamera.lookAt(sredisce);
    prizor.userData.sredisce = sredisce;
  }

  /**
   * Koncna lega: Slovenija proti kameri, sever navzgor.
   *
   * Iz smeri proti cilju in smeri proti severu sestavimo pravokotno bazo v
   * prostoru modela in jo poravnamo z bazo zaslona - x desno, y navzgor,
   * z proti gledalcu. Vrtenje nosilca gre okoli izhodisca, globus pa v njem
   * ne stoji, zato ga s premikom vrnemo na svoje mesto.
   */
  function postaviLego(koren) {
    const sredisce = prizor.userData.sredisce;
    skupina.updateWorldMatrix(true, false);
    const vSvet = (v) => v.clone().transformDirection(skupina.matrixWorld).normalize();

    const z = vSvet(naKroglo(CILJ_LON, CILJ_LAT, 1));
    const sever = vSvet(new THREE.Vector3(0, -1, 0));
    const y = sever.clone().addScaledVector(z, -sever.dot(z)).normalize();
    const x = new THREE.Vector3().crossVectors(y, z);

    const baza = new THREE.Matrix4().makeBasis(x, y, z);
    koncnaLega = new THREE.Quaternion().setFromRotationMatrix(baza.transpose());
    nosilec.position.copy(sredisce).addScaledVector(
      sredisce.clone().applyQuaternion(koncnaLega),
      -1
    );
    uporabiNagib();
    koren.updateWorldMatrix(true, true);
  }

  /**
   * Nagib z misko.
   *
   * Zavrtimo okoli SVETOVNE osi x, torej okoli vodoravnice zaslona, in sele
   * nato postavimo globus v koncno lego. Nagib okoli lastne osi bi bil odvisen
   * od tega, kam je globus ravno obrnjen, in bi se ob vsakem obratu obnasal
   * drugace.
   */
  function uporabiNagib() {
    if (!koncnaLega) return;
    const nagib = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      rocniNagib
    );
    nosilec.quaternion.copy(nagib).multiply(koncnaLega);
    nosilec.updateWorldMatrix(true, true);
  }

  /**
   * Odmik od koncne lege: vrtenje okoli lastne osi.
   *
   * Sesteva prilet, ki gre proti nic, in to, kar je uporabnik zavrtel sam.
   * Ce bi bila locena, bi vlecenje med priletom skakalo.
   */
  function zavrti(kot) {
    skupina.quaternion
      .copy(zacetnaLega)
      .multiply(
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), kot + rocniObrat)
      );
  }

  /** En izris na zahtevo. Med vlecenjem zanka ne tece. */
  function narisi() {
    if (!skupina) return;
    zavrti(-skupniKot * (1 - odigranoDelez));
    izrisovalnik.render(prizor, kamera);
  }

  // --- vlecenje z misko ----------------------------------------------------
  let vlecem = false;
  let zadnjiX = 0;
  let zadnjiY = 0;

  izrisovalnik.domElement.addEventListener("pointerdown", (e) => {
    if (!viden) return;
    vlecem = true;
    zadnjiX = e.clientX;
    zadnjiY = e.clientY;
    izrisovalnik.domElement.setPointerCapture(e.pointerId);
    izrisovalnik.domElement.classList.add("vlecem");
  });

  izrisovalnik.domElement.addEventListener("pointermove", (e) => {
    if (!vlecem) return;
    rocniObrat += (e.clientX - zadnjiX) * VLEK;
    rocniNagib = Math.max(
      -NAGIB_MEJA,
      Math.min(rocniNagib + (e.clientY - zadnjiY) * VLEK, NAGIB_MEJA)
    );
    zadnjiX = e.clientX;
    zadnjiY = e.clientY;
    uporabiNagib();
    // Med priletom zanka ze tece; takrat izris prepustimo njej.
    if (!zanka) narisi();
  });

  const nehaj = (e) => {
    if (!vlecem) return;
    vlecem = false;
    izrisovalnik.domElement.releasePointerCapture?.(e.pointerId);
    izrisovalnik.domElement.classList.remove("vlecem");
  };
  izrisovalnik.domElement.addEventListener("pointerup", nehaj);
  izrisovalnik.domElement.addEventListener("pointercancel", nehaj);

  function slicica(ms) {
    zanka = requestAnimationFrame(slicica);
    const t = Math.min((ms - zacetek) / VRTENJE_MS, 1);
    odigranoDelez = easeOut(t);
    zavrti(-skupniKot * (1 - odigranoDelez));

    if (t >= 1 && meja) {
      const odMeje = ms - zacetek - VRTENJE_MS - PREMOR_MS;
      const skupaj = meja.geometry.attributes.position.count;
      const delez = Math.max(0, Math.min(odMeje / MEJA_MS, 1));
      meja.geometry.setDrawRange(0, Math.round(skupaj * easeOut(delez)));
      if (delez >= 1) {
        cancelAnimationFrame(zanka);
        zanka = null;
      }
    }
    izrisovalnik.render(prizor, kamera);
  }

  function meri() {
    const r = gnezdo.getBoundingClientRect();
    const s = Math.max(1, Math.round(Math.min(r.width, r.height)));
    izrisovalnik.setSize(s, s, false);
    izrisovalnik.domElement.style.width = `${s}px`;
    izrisovalnik.domElement.style.height = `${s}px`;
    kamera.aspect = 1;
    kamera.updateProjectionMatrix();
  }

  return {
    /**
     * Prihod, vezan na lego drsnika.
     *
     * Pisemo v slog platna in ne v prizor: ko se globus neha vrteti, zanka
     * ugasne in prizora nihce ne izrisuje vec. Merilo in prosojnost v slogu
     * delujeta tudi takrat - in gib gre ob vracanju sam po sebi nazaj.
     *
     * @param {number} p 0 = se pod robom, 1 = na svojem mestu
     */
    nastaviPrihod(p) {
      const d = Math.max(0, Math.min(p, 1));
      const e = easeOut(d);
      izrisovalnik.domElement.style.transform =
        `translateY(${(1 - e) * 13}%) scale(${0.82 + e * 0.18})`;
      izrisovalnik.domElement.style.opacity = String(e);
    },
    pokazi() {
      if (viden) return;
      viden = true;
      nalozen.then((ok) => {
        if (!ok || !viden) return;
        meri();
        skupniKot = Math.PI * 2 * OBRATOV;
        meja.geometry.setDrawRange(0, 0);

        odigranoDelez = 0;
        zacetek = performance.now();
        zanka = requestAnimationFrame(slicica);
      });
    },
    skrij() {
      if (!viden) return;
      viden = false;
      izrisovalnik.domElement.classList.remove("vidno");
      if (zanka) cancelAnimationFrame(zanka);
      zanka = null;
    },
  };
}
