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
 * Prizor je svoj, loceni izris. Galaksija tece v svojem platnu pod njim in
 * ostane cela.
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import modelUrl from "../assets/3d models/zemlja.glb?url";
import { MEJA_SLO } from "./meja-slo.js";

/** Kam gleda globus, ko obmiruje. Ljubljana. */
const CILJ_LON = 14.5058;
const CILJ_LAT = 46.0569;

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
    const q = new THREE.Quaternion().setFromRotationMatrix(baza.transpose());
    nosilec.quaternion.copy(q);
    nosilec.position.copy(sredisce).addScaledVector(sredisce.clone().applyQuaternion(q), -1);
    nosilec.updateWorldMatrix(true, true);
    koren.updateWorldMatrix(true, true);
  }

  /** Odmik od koncne lege: vrtenje okoli lastne osi, ki gre proti nic. */
  function zavrti(kot) {
    skupina.quaternion
      .copy(zacetnaLega)
      .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), kot));
  }

  function slicica(ms) {
    zanka = requestAnimationFrame(slicica);
    const t = Math.min((ms - zacetek) / VRTENJE_MS, 1);
    zavrti(-skupniKot * (1 - easeOut(t)));

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
    pokazi() {
      if (viden) return;
      viden = true;
      nalozen.then((ok) => {
        if (!ok || !viden) return;
        meri();
        skupniKot = Math.PI * 2 * OBRATOV;
        meja.geometry.setDrawRange(0, 0);
        izrisovalnik.domElement.classList.add("vidno");
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
