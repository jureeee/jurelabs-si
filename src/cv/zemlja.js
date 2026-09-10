/**
 * Zemlja na strani Stik.
 *
 * Globus pripotuje iz daljave, se zavrti in obmiruje tako, da je Slovenija
 * pred gledalcem. Nato stoji - da se meja lahko izrise okoli necesa, kar je
 * na mestu.
 *
 * Zagrabis ga lahko in zavrtis v katerokoli smer. Ko ga spustis, se ne ustavi
 * v hipu, ampak se izteka - vztrajnost je tisto, po cemer se telo bere kot
 * veliko. Lahek predmet se ustavi takoj, tezek se vrti se dolgo potem, ko si
 * ga nehal poganjati; zato je dusenje sibko in traja nekaj sekund.
 *
 * Ves cas se rahlo odziva na kazalec: nekaj stopinj sem in tja, toliko, da ni
 * videti kot slika. Odziv je vezan na lego kazalca in ne na njegovo hitrost,
 * zato se ob mirovanju umiri sam.
 *
 * Vrtenje je prosto, ne po dveh oseh. Vsak poteg je zasuk okoli osi, ki je
 * pravokotna nanj, in se sesteje s tem, kar je ze bilo - zato ni "zgornjega
 * roba", ob katerega bi trcil, in globus se ne zvija okoli navidezne palice.
 *
 * Vrti se OKOLI SVOJEGA SREDISCA. Nosilec je zato zamaknjen tako, da zasuk
 * okoli izhodisca ne odnese globusa vstran; brez tega bi krozil po zaslonu.
 *
 * Kar zadeva lego in teksture: model je izvozen s polom proti kameri, koncno
 * lego pa zgradimo sami iz smeri proti cilju in smeri proti severu.
 *
 * Prizor je svoj, loceni izris. Galaksija tece v svojem platnu pod njim in
 * ostane cela.
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import modelUrl from "../assets/3d models/zemlja.glb?url";
import { MEJA_SLO } from "./meja-slo.js";

/**
 * Kam gleda globus, ko pride v prizor.
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

/**
 * Kje na modelu je Slovenija.
 *
 * Ne po zemljepisnih koordinatah - te na tem modelu ne padejo tja, kamor bi
 * morale. Vrednosti sta izracunani iz lege, ki jo je na sliki oznacil clovek:
 * iz tocke na zaslonu smo z obratno preslikavo prisli nazaj v prostor modela.
 * Preverba je vrnila natanko isto lego na zaslonu.
 *
 * Zato meje ne polagamo po dolzini in sirini, ampak jo postavimo kot majhno
 * zaplato okoli te tocke: drzava je siroka tri stopinje in na taki razdalji
 * je ukrivljenost zanemarljiva.
 */
const SLO_MODEL_LON = -52.9922;
const SLO_MODEL_LAT = 49.0091;
/** Sredisce drzave v pravih koordinatah - glede nanj merimo odmike v obrisu. */
const SLO_LON = 14.5058;
const SLO_LAT = 46.0569;

/**
 * Odziv na kazalec.
 *
 * Najvecji odklon v radianih in kako hitro mu sledi. Zelo malo: to se sme
 * cutiti, ne videti. Vec bi bilo videti kot da globus plava.
 */
const MISKA_ODKLON = 0.075;
const MISKA_SLEDENJE = 2.4;

/** Koliko radianov na piko poteka doda vlecenje. */
const VLEK = 0.006;
/**
 * Koliksen del vrtilne hitrosti ostane po sekundi, ko globus spustis.
 *
 * Visoka vrednost je namerna: pri 0,2 se ustavi skoraj takoj in je videti kot
 * gumb, pri 0,86 se izteka nekaj sekund in je videti kot nekaj tezkega.
 */
const IZTEK = 0.86;
/** Zgornja meja hitrosti, da divje vlecenje ne konca v vrtavki. */
const NAJVEC_HITROSTI = 3.4;

/** Koliko obratov naredi ob priletu in koliko casa za to porabi. */
const OBRATOV = 1.7;
const PRILET_MS = 5200;

/** Koliko nad povrsjem lezi crta, da je krogla ne poje. */
const DVIG = 1.004;
/** Koliko prostora okoli globusa pusti kamera. 1 je tesno. */
const ZRAK = 1.05;

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/** Tocka na krogli iz zemljepisnih koordinat, v prostoru modela. */
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
  const platno = izrisovalnik.domElement;

  const napis = document.createElement("span");
  napis.className = "zemlja-oznaka";
  napis.textContent = "Slovenija";
  napis.style.opacity = "0";
  gnezdo.appendChild(napis);

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

  let skupina = null;       // vozlisce z Zemljo
  let meja = null;
  let polmerLok = 1;
  let koncnaLega = null;    // lega, v kateri globus gleda na cilj
  let severOsnovni = null;  // smer severa, preden zavrtimo
  let sredisce = null;
  let sidro = null;         // tocka na krogli, na katero je pripet napis

  /** Vse, kar se je nabralo od vrtenja. */
  const zasuk = new THREE.Quaternion();
  /** Kam kaze kazalec, kot delez od sredisca okna, in kam smo mu ze sledili. */
  const miska = { x: 0, y: 0 };
  const sledi = { x: 0, y: 0 };
  /** Vrtilna hitrost kot os krat radiani na sekundo. */
  const hitrost = new THREE.Vector3();

  let zanka = null;
  let viden = false;
  let zadnjiSek = 0;

  /**
   * Prilet.
   *
   * Vrtenje ob prihodu NI vztrajnost, ki bi se iztekla - taka se ne ustavi
   * tam, kjer mora, ampak kjer se zgodi, da ji zmanjka. Je animacija od
   * zamaknjene lege proti nic, zato globus obmiruje natanko v legi, v kateri
   * je Slovenija pred gledalcem.
   */
  let priletTece = false;
  let priletOd = 0;
  const priletOs = new THREE.Vector3();

  const nalozen = new Promise((res) => {
    new GLTFLoader().load(
      modelUrl,
      (g) => {
        nosilec.add(g.scene);
        skupina = g.scene.getObjectByName("Earth_Geo2") || g.scene;

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

        // Vrstni red je pomemben: meja bere smer navzgor iz koncne lege, ta
        // pa je znana sele, ko je globus postavljen.
        namestiKamero(g.scene);
        postaviLego();
        naredMejo();
        res(true);
      },
      undefined,
      () => res(false)
    );
  });

  /**
   * Crta po obodu drzave, otrok skupine - torej se vrti skupaj z Zemljo.
   *
   * Obris polozimo na dotikalno ravnino v srediscu drzave in ga nato potisnemo
   * nazaj na kroglo. Smer navzgor v tej ravnini vzamemo od zaslona: na modelu
   * "sever" ni tam, kjer bi pricakovali, na sliki pa je Evropa pokoncna, zato
   * je zaslon tu zanesljivejsi od modela.
   */
  function naredMejo() {
    const sredina = naKroglo(SLO_MODEL_LON, SLO_MODEL_LAT, 1).normalize();

    // Navzgor po zaslonu, prevedeno v prostor modela. matrixWorld ze vsebuje
    // nosilca, zato ga ne odstevamo se posebej - dvojno odstevanje je napaka,
    // ki jo preverba zlahka spregleda, ker jo dela v obe smeri enako.
    skupina.updateWorldMatrix(true, false);
    const obrat = new THREE.Matrix4().extractRotation(skupina.matrixWorld).invert();
    const gor = new THREE.Vector3(0, 1, 0).applyMatrix4(obrat).normalize();

    const sever = gor.clone().addScaledVector(sredina, -gor.dot(sredina)).normalize();
    const vzhod = new THREE.Vector3().crossVectors(sever, sredina).normalize();

    const stopinja = Math.PI / 180;
    const skrcek = Math.cos(SLO_LAT * stopinja); // poldnevniki se proti polu zblizujejo
    const tocke = [];
    for (let i = 0; i < MEJA_SLO.length; i += 2) {
      const vzhodno = (MEJA_SLO[i] - SLO_LON) * skrcek * stopinja;
      const severno = (MEJA_SLO[i + 1] - SLO_LAT) * stopinja;
      tocke.push(
        sredina
          .clone()
          .addScaledVector(vzhod, vzhodno)
          .addScaledVector(sever, severno)
          .normalize()
          .multiplyScalar(polmerLok * DVIG)
      );
    }

    const geo = new THREE.BufferGeometry().setFromPoints([...tocke, tocke[0]]);
    meja = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color: 0xffe6a6, transparent: true, opacity: 0.95 })
    );
    meja.frustumCulled = false;
    skupina.add(meja);

    // Tocka, na katero pripnemo napis. Ista kot sredina obrisa.
    sidro = sredina.clone().multiplyScalar(polmerLok * DVIG);
  }

  /**
   * Napis ob drzavi.
   *
   * Ni v prizoru, ampak nad njim kot navadno besedilo - v 3D bi bil zabrisan
   * in bi se z globusom nagibal. Vsako slicico ga postavimo tja, kamor pade
   * sidro, in ga skrijemo, ko to zaide na drugo stran krogle.
   */
  function osveziNapis() {
    if (!sidro || !napis) return;
    const v = sidro.clone().applyMatrix4(skupina.matrixWorld);
    const protiKameri = kamera.position.clone().sub(sredisce).normalize();
    const smer = v.clone().sub(sredisce).normalize();
    if (smer.dot(protiKameri) < 0.08) {
      napis.style.opacity = "0";
      return;
    }
    const zaslon = v.clone().project(kamera);
    const r = gnezdo.getBoundingClientRect();
    const s = Math.min(r.width, r.height);
    napis.style.opacity = "1";
    napis.style.left = `${((zaslon.x + 1) / 2) * s}px`;
    napis.style.top = `${((1 - zaslon.y) / 2) * s}px`;
  }

  /** Kamera gleda v sredisce globusa, dovolj dalec, da gre cel na ploskev. */
  function namestiKamero(koren) {
    const skatla = new THREE.Box3().setFromObject(koren);
    sredisce = skatla.getCenter(new THREE.Vector3());
    const mere = skatla.getSize(new THREE.Vector3());
    const r = Math.max(mere.x, mere.y, mere.z) * 0.5;
    const d = (r / Math.tan((kamera.fov * Math.PI) / 360)) * ZRAK;
    kamera.position.set(sredisce.x, sredisce.y, sredisce.z + d);
    kamera.lookAt(sredisce);
  }

  /**
   * Lega, v kateri globus gleda na cilj in ima sever zgoraj.
   *
   * Iz smeri proti cilju in smeri proti severu sestavimo pravokotno bazo v
   * prostoru modela in jo poravnamo z bazo zaslona - x desno, y navzgor,
   * z proti gledalcu.
   */
  function postaviLego() {
    skupina.updateWorldMatrix(true, false);
    const vSvet = (v) => v.clone().transformDirection(skupina.matrixWorld).normalize();

    const z = vSvet(naKroglo(CILJ_LON, CILJ_LAT, 1));
    severOsnovni = vSvet(new THREE.Vector3(0, -1, 0));
    const y = severOsnovni.clone().addScaledVector(z, -severOsnovni.dot(z)).normalize();
    const x = new THREE.Vector3().crossVectors(y, z);

    koncnaLega = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(x, y, z).transpose()
    );
    uporabiZasuk();
  }

  /**
   * Zloz vse zasuke v lego nosilca.
   *
   * Zasuk gre PRED koncno lego, torej v prostoru zaslona: poteg v desno je
   * vedno poteg v desno, ne glede na to, kam je globus ravno obrnjen. Premik
   * nosilca iznici to, da zasuk tece okoli izhodisca in ne okoli globusa.
   */
  function uporabiZasuk() {
    if (!koncnaLega) return;
    // Odziv na kazalec gre cisto na vrh in se nikamor ne shrani: je pogled na
    // globus, ne njegova lega. Zato ga vlecenje ne odnese s sabo.
    const pogled = new THREE.Quaternion()
      .setFromAxisAngle(new THREE.Vector3(0, 1, 0), sledi.x * MISKA_ODKLON)
      .multiply(
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), sledi.y * MISKA_ODKLON)
      );
    const q = pogled.multiply(zasuk).multiply(koncnaLega);
    nosilec.quaternion.copy(q);
    nosilec.position.copy(sredisce).addScaledVector(sredisce.clone().applyQuaternion(q), -1);
    nosilec.updateWorldMatrix(true, true);
  }

  function slicica(ms) {
    zanka = requestAnimationFrame(slicica);
    const sek = ms * 0.001;
    const dt = zadnjiSek ? Math.min(sek - zadnjiSek, 0.05) : 1 / 60;
    zadnjiSek = sek;

    let spremenilo = false;

    if (priletTece) {
      const t = Math.min((sek - priletOd) / (PRILET_MS / 1000), 1);
      const kot = -Math.PI * 2 * OBRATOV * (1 - easeOut(t));
      zasuk.setFromAxisAngle(priletOs, kot);
      if (t >= 1) priletTece = false;
      spremenilo = true;
    } else {
      if (!vlecem) hitrost.multiplyScalar(Math.pow(IZTEK, dt));
      const dolzina = hitrost.length();
      if (dolzina > 1e-4) {
        zasuk.premultiply(
          new THREE.Quaternion().setFromAxisAngle(
            hitrost.clone().divideScalar(dolzina),
            dolzina * dt
          )
        );
        spremenilo = true;
      }
    }

    // Sledenje kazalcu. Eksponentno priblizevanje: hitro na zacetku, brez
    // konca - zato ni praga, na katerem bi se gib ustavil sunkovito.
    const k = 1 - Math.exp(-MISKA_SLEDENJE * dt);
    if (Math.abs(miska.x - sledi.x) > 1e-4 || Math.abs(miska.y - sledi.y) > 1e-4) {
      sledi.x += (miska.x - sledi.x) * k;
      sledi.y += (miska.y - sledi.y) * k;
      spremenilo = true;
    }

    if (spremenilo) uporabiZasuk();
    osveziNapis();
    izrisovalnik.render(prizor, kamera);
  }

  function meri() {
    const r = gnezdo.getBoundingClientRect();
    const s = Math.max(1, Math.round(Math.min(r.width, r.height)));
    izrisovalnik.setSize(s, s, false);
    platno.style.width = `${s}px`;
    platno.style.height = `${s}px`;
    kamera.aspect = 1;
    kamera.updateProjectionMatrix();
  }

  // --- vlecenje ------------------------------------------------------------
  let vlecem = false;
  let zadnjiX = 0;
  let zadnjiY = 0;

  platno.addEventListener("pointerdown", (e) => {
    if (!viden) return;
    // Kdor prime globus, prevzame vodenje: prilet se konca tam, kjer je.
    priletTece = false;
    vlecem = true;
    zadnjiX = e.clientX;
    zadnjiY = e.clientY;
    hitrost.set(0, 0, 0);
    platno.setPointerCapture?.(e.pointerId);
    platno.classList.add("vlecem");
  });

  platno.addEventListener("pointermove", (e) => {
    if (!vlecem) return;
    const dx = e.clientX - zadnjiX;
    const dy = e.clientY - zadnjiY;
    zadnjiX = e.clientX;
    zadnjiY = e.clientY;

    // Os zasuka je pravokotna na poteg in lezi v ravnini zaslona. Zato je
    // vrtenje prosto: navpicni poteg vrti okoli vodoravnice, vodoravni okoli
    // navpicnice, posevni pa okoli posevne osi - brez posebnih primerov.
    const os = new THREE.Vector3(dy, dx, 0);
    const dolzina = os.length();
    if (dolzina < 1e-6) return;
    os.divideScalar(dolzina);

    const kot = dolzina * VLEK;
    zasuk.premultiply(new THREE.Quaternion().setFromAxisAngle(os, kot));
    uporabiZasuk();
    osveziNapis();

    // Hitrost za iztek. Delimo s slicico in ne z merjenim casom: kratki
    // premori med dogodki bi sicer dali neresnicno visoke hitrosti.
    hitrost.copy(os).multiplyScalar(Math.min(kot * 60, NAJVEC_HITROSTI));
  });

  const nehaj = (e) => {
    if (!vlecem) return;
    vlecem = false;
    platno.releasePointerCapture?.(e.pointerId);
    platno.classList.remove("vlecem");
  };
  platno.addEventListener("pointerup", nehaj);
  platno.addEventListener("pointercancel", nehaj);

  // Kazalec poslusa okno in ne globusa: odziv naj se cuti tudi, ko se z misko
  // sprehajas ob njem, ne sele ko si nad njim.
  const naOkno = (e) => {
    miska.x = (e.clientX / innerWidth) * 2 - 1;
    miska.y = (e.clientY / innerHeight) * 2 - 1;
  };
  addEventListener("pointermove", naOkno, { passive: true });

  return {
    /**
     * Prihod, vezan na lego drsnika.
     *
     * Globus pripotuje iz daljave: raste in se izostri, namesto da bi se le
     * pojavil. Pisemo v slog platna, ne v prizor - merilo in prosojnost v
     * slogu delujeta tudi, ko izris ne tece, in gib gre ob vracanju sam po
     * sebi nazaj.
     *
     * @param {number} p 0 = se dalec, 1 = na svojem mestu
     */
    nastaviPrihod(p) {
      const d = Math.max(0, Math.min(p, 1));
      const e = easeOut(d);
      platno.style.transform = `translateY(${(1 - e) * 9}%) scale(${0.64 + e * 0.36})`;
      platno.style.opacity = String(e);
      platno.style.filter = `blur(${(1 - e) * 7}px)`;
    },
    pokazi() {
      if (viden) return;
      viden = true;
      nalozen.then((ok) => {
        if (!ok || !viden) return;
        meri();
        // Prilet se vrti okoli osi Zemlje, izrazene v prostoru zaslona -
        // torej pred koncno lego, tam, kjer se sesteva tudi vlecenje.
        priletOs.copy(severOsnovni).applyQuaternion(koncnaLega).normalize();
        hitrost.set(0, 0, 0);
        priletTece = true;
        priletOd = performance.now() * 0.001;
        zadnjiSek = 0;
        zanka = requestAnimationFrame(slicica);
      });
    },
    skrij() {
      if (!viden) return;
      viden = false;
      if (zanka) cancelAnimationFrame(zanka);
      zanka = null;
    },
  };
}
