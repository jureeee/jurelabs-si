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
 * Kar zadeva lego in teksture: model nosi svoj zasuk, ki ni zemljepisni.
 * Izmerjen je in zapisan v V_MODEL; koncno lego zgradimo iz smeri proti
 * Sloveniji in smeri proti severu.
 *
 * Prizor je svoj, loceni izris. Galaksija tece v svojem platnu pod njim in
 * ostane cela.
 */

import { obJeziku, t } from "./jezik.js";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import modelUrl from "../assets/3d models/zemlja.glb?url";
import { MEJA_SLO } from "./meja-slo.js";

/**
 * Kje na modelu je kaj.
 *
 * Teksture na tem modelu ne lezijo po poldnevnikih in vzporednikih, ampak v
 * svojem, zasukanem okviru. Prej sta bili zato smer pogleda in lega Slovenije
 * nastavljeni na roko - in obris je pristal nekaj sto kilometrov od drzave,
 * nekje nad Malo Azijo.
 *
 * Zasuk je zdaj izmerjen iz modela samega:
 *
 *   1. Iz mreze se prebere, kako se teksturne koordinate preslikajo v lego na
 *      krogli. Model je razrezan na stiri ploscice, vsaka nosi cetrtino
 *      enakokotne karte; iz oglisc sledi lon = lon0 - 182,903 u in
 *      lat = lat0 + 90,876 v, z ostankom pod desetinko stopinje.
 *   2. Iz ploscic se sestavi ena sama karta v okviru modela.
 *   3. Grobi priblizek zasuka da nekaj prepoznavnih tock - Antarktika,
 *      Avstralija, Madagaskar, Nova Zelandija.
 *   4. Priblizek se uglasi tako, da se kopno na modelu ujame s kopnim iz
 *      Natural Earth: sedemnajst tisoc obalnih celic, zasuk se isce po treh
 *      oseh, dokler je ujemanje najboljse.
 *
 * Preverjeno tako, da so bile na tako preslikano karto modela narisane obale
 * Natural Earth: ujamejo se po vsem svetu - Iberija, italijanski skorenj,
 * Egeja, Sinaj, Ciper.
 *
 * Izmeri jo orodja/zemlja-zasuk.mjs; ce se model kdaj zamenja, se matrika
 * dobi tako, da orodje spet stece.
 *
 * Matrika slika zemljepisno smer v prostor mreze. Tretji stolpec je negativen
 * zato, ker nasa formula steje dolzino v nasprotno smer kot model.
 */
const V_MODEL = new THREE.Matrix3().set(
  0.96695152, -0.15534867, -0.20216714,
  -0.24745765, -0.38088751, -0.89089248,
  -0.06139603, -0.91147764, 0.40674198
);

/** Sredisce Slovenije. Tja gleda globus, ko obmiruje, in tam je obris. */
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

/**
 * Koliko radianov na piko poteka doda vlecenje.
 *
 * Nizko namenoma. Pri 0,006 se je globus pod prstom vrtel kot vrtavka in je
 * bilo tezko ustaviti ga tam, kjer si hotel; telo te velikosti se ne sme
 * odzivati kot gumb. Pri 0,0022 gre poteg cez pol zaslona priblizno v cetrt
 * obrata - dovolj, da ga obrnes, premalo, da bi ti usel.
 */
const VLEK = 0.0022;
/**
 * Koliksen del vrtilne hitrosti ostane po sekundi, ko globus spustis.
 *
 * Visoka vrednost je namerna: pri 0,2 se ustavi skoraj takoj in je videti kot
 * gumb, pri 0,86 se izteka nekaj sekund in je videti kot nekaj tezkega.
 */
const IZTEK = 0.86;
/** Zgornja meja hitrosti, da divje vlecenje ne konca v vrtavki. */
const NAJVEC_HITROSTI = 1.5;

/**
 * Vrnitev v izhodisce.
 *
 * Ko globus spustis, se izteka - in obstane, kjer se ustavi. Po POCITEK_S
 * sekundah brez dotika se sam vrne v lego, v kateri je Slovenija pred
 * gledalcem, in v natanko to lego, ne priblizno.
 *
 * Vrnitev NI preliv s trajanjem. Ob koncu pocitka se globus najbrz se vedno
 * vrti in preliv bi mu v hipu spremenil smer - videti bi bilo, kot da ga je
 * nekaj sunilo. Namesto tega deluje vzmet na isto vrtilno hitrost, na katero
 * deluje vlecenje: obstojece vrtenje najprej ustavi in ga sele nato povlece
 * nazaj, zato je vrnitev ena sama zvezna poteza.
 *
 * VRNITEV_MOC je kvadrat lastne frekvence; dusenje je dvakratnik njenega
 * korena, torej mejno. Sibkejse bi cez cilj zanihalo nazaj, mocnejse bi se
 * vleklo. Ostanek pod pragom poravnamo, sicer se vzmet cilja le priblizuje in
 * lega ni nikoli natanko ista.
 */
const POCITEK_S = 5;
const VRNITEV_MOC = 3.6;
const VRNITEV_DUSENJE = 2 * Math.sqrt(VRNITEV_MOC);
const VRNITEV_PRAG = 0.002;

/** Koliko obratov naredi ob priletu in koliko casa za to porabi. */
const OBRATOV = 1.7;
const PRILET_MS = 5200;

/**
 * Odriv ob vlecenju.
 *
 * Ko globus zagrabis in potegnes, se ne le zavrti - malo se tudi PREMAKNE v
 * smer potega, kot da bi ga odrinil, in se nato vrne. Brez tega je vrtenje
 * gib slike; s tem je gib telesa, ki ima tezo in se upira.
 *
 * Vzmet je namenoma podduseno nastavljena - dusenje je nekaj vec kot polovica
 * mejnega. Zato se ne vrne naravnost, ampak enkrat zaniha cez sredino in sele
 * potem obmiruje; prav ta en odboj je tisto, kar se bere kot prozno in ne kot
 * mehanizem, ki se zapira.
 *
 * Odmik meri v delezih polmera, ne v pikah - drugace bi bil na velikem zaslonu
 * komaj viden, na malem pa bi globus odnesel z njega.
 */
const ODRIV = 0.0011;
const ODRIV_NAJVEC = 0.11;
const ODRIV_MOC = 26;
const ODRIV_DUSENJE = 5.2;

/**
 * Priblizevanje s kolescem.
 *
 * Ko je kazalec nad globusom, ga kolesce priblizuje in oddaljuje - a ga ne
 * pusti tam. Sam se vrne na osnovno velikost, tako kot odriv vrne lego. To ni
 * nastavitev pogleda, ampak igra: prijeti ga smes in ga potegniti k sebi,
 * spustis pa ga nazaj.
 *
 * Dvoje se giblje, ne eno. Kolesce premika CILJ, velikost pa cilju sledi z
 * zamikom - zato en zavrtljaj ne skoci na najvecje, ampak se tja pomika.
 * Cilj medtem sam plahni proti nic, zato se vse skupaj po nekaj trenutkih
 * mirovanja vrne, ne da bi bilo treba karkoli spustiti.
 *
 * Dokler globus se prihaja, kolesce ne stori nicesar: prihod je pot in med
 * njo se v merilo ne sme posegati.
 */
const ZOOM_KORAK = 0.0011;
const ZOOM_NAJVEC = 0.5;
/** Kako hitro velikost dohaja cilj in kako hitro cilj plahni proti nic. */
const ZOOM_SLEDENJE = 3.2;
const ZOOM_UPAD = 0.85;

/** Koliko nad povrsjem lezi crta, da je krogla ne poje. */
const DVIG = 1.004;
/** Koliko prostora okoli globusa pusti kamera. 1 je tesno. */
const ZRAK = 1.05;

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/** Tocka na krogli iz zemljepisnih koordinat, v prostoru mreze. */
function naKroglo(lonStopinj, latStopinj, r) {
  const lon = (lonStopinj * Math.PI) / 180;
  const lat = (latStopinj * Math.PI) / 180;
  const k = Math.cos(lat);
  return new THREE.Vector3(k * Math.cos(lon), Math.sin(lat), k * Math.sin(lon))
    .applyMatrix3(V_MODEL)
    .multiplyScalar(r);
}

/** Smer proti severnemu tecaju, v prostoru mreze. */
const SEVER_MODEL = naKroglo(0, 90, 1);

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
  napis.textContent = t("zemlja.slovenija", "Slovenija");
  obJeziku(() => { napis.textContent = t("zemlja.slovenija", "Slovenija"); });
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
  let polmerLok = 1;        // v prostoru mreze - zanj je merjena meja
  let polmerSvet = 1;       // v prostoru prizora - v njem se globus premika
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
  /** Odriv: koliko je globus premaknjen s svojega mesta in kako hitro se vraca. */
  const odmik = new THREE.Vector3();
  const odmikHitrost = new THREE.Vector3();
  /** Priblizanje: 0 je osnovna velikost, pozitivno je blizje. */
  let zoom = 0;
  let zoomCilj = 0;
  let razdaljaOsnovna = 1;
  /** Kako dalec je globus na svoji poti v prizor; 1 je na mestu. */
  let prihodDelez = 0;

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
   * Vsako oglisce obrisa gre naravnost iz svojih zemljepisnih koordinat na
   * kroglo. Prej je bil obris zaplata na dotikalni ravnini in je smer navzgor
   * jemal kar z zaslona, ker preslikava ni bila znana; zdaj je izmerjena in
   * ovinka ni vec treba.
   */
  function naredMejo() {
    const tocke = [];
    for (let i = 0; i < MEJA_SLO.length; i += 2) {
      tocke.push(naKroglo(MEJA_SLO[i], MEJA_SLO[i + 1], polmerLok * DVIG));
    }

    const geo = new THREE.BufferGeometry().setFromPoints([...tocke, tocke[0]]);
    meja = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color: 0xffe6a6, transparent: true, opacity: 0.95 })
    );
    meja.frustumCulled = false;
    skupina.add(meja);

    // Tocka, na katero pripnemo napis: sredisce drzave.
    sidro = naKroglo(SLO_LON, SLO_LAT, polmerLok * DVIG);
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
    polmerSvet = r;
    const d = (r / Math.tan((kamera.fov * Math.PI) / 360)) * ZRAK;
    razdaljaOsnovna = d;
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

    const z = vSvet(naKroglo(SLO_LON, SLO_LAT, 1));
    severOsnovni = vSvet(SEVER_MODEL);
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
    nosilec.position
      .copy(sredisce)
      .addScaledVector(sredisce.clone().applyQuaternion(q), -1)
      .add(odmik);
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
      const pocivam = !vlecem && sek - zadnjiDotik > POCITEK_S;
      let doma = false;

      if (pocivam) {
        // Zasuk, ki manjka do izhodisca. Kvaternion in njegovo nasprotje sta
        // ista lega; tistega z negativnim w obrnemo, sicer bi se vzmet vlekla
        // po dolgi poti okoli.
        const nazaj = zasuk.clone().conjugate();
        if (nazaj.w < 0) nazaj.set(-nazaj.x, -nazaj.y, -nazaj.z, -nazaj.w);
        const sinus = Math.sqrt(Math.max(0, 1 - nazaj.w * nazaj.w));
        const kot = 2 * Math.acos(Math.min(1, Math.max(-1, nazaj.w)));
        if (sinus > 1e-6) {
          const os = new THREE.Vector3(nazaj.x, nazaj.y, nazaj.z).divideScalar(sinus);
          hitrost.addScaledVector(os, kot * VRNITEV_MOC * dt);
        }
        hitrost.multiplyScalar(Math.exp(-VRNITEV_DUSENJE * dt));
        if (kot < VRNITEV_PRAG && hitrost.length() < VRNITEV_PRAG) {
          zasuk.identity();
          hitrost.set(0, 0, 0);
          doma = true;
          spremenilo = true;
        }
      } else if (!vlecem) {
        hitrost.multiplyScalar(Math.pow(IZTEK, dt));
      }

      const dolzina = hitrost.length();
      if (!doma && dolzina > 1e-4) {
        zasuk.premultiply(
          new THREE.Quaternion().setFromAxisAngle(
            hitrost.clone().divideScalar(dolzina),
            dolzina * dt
          )
        );
        spremenilo = true;
      }
    }

    // Odriv se vraca na svoje mesto. Vzmet tece tudi med vlecenjem - takrat
    // se z vlekom prepira in globus zaostaja za potegom, kar je prav to, kar
    // se cuti kot teza.
    if (odmik.lengthSq() > 1e-10 || odmikHitrost.lengthSq() > 1e-10) {
      odmikHitrost.addScaledVector(odmik, -ODRIV_MOC * dt);
      odmikHitrost.multiplyScalar(Math.exp(-ODRIV_DUSENJE * dt));
      odmik.addScaledVector(odmikHitrost, dt);
      const meja = polmerSvet * ODRIV_NAJVEC;
      if (odmik.length() > meja) odmik.setLength(meja);
      spremenilo = true;
    }

    // Priblizanje se vraca na osnovno velikost. Kamero premikamo in ne
    // globusa: lego nosilca zaseda ze zasuk in odriv, in merilo bi se z njima
    // prepiralo.
    if (Math.abs(zoom) > 1e-4 || Math.abs(zoomCilj) > 1e-4) {
      zoomCilj *= Math.exp(-ZOOM_UPAD * dt);
      zoom += (zoomCilj - zoom) * (1 - Math.exp(-ZOOM_SLEDENJE * dt));
      kamera.position.z = sredisce.z + razdaljaOsnovna / (1 + zoom);
      spremenilo = true;
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
  /** Kdaj se je globusa nazadnje kdo dotaknil; od tod se meri pocitek. */
  let zadnjiDotik = 0;
  const dotaknil = () => { zadnjiDotik = performance.now() * 0.001; };

  platno.addEventListener("pointerdown", (e) => {
    if (!viden) return;
    // Kdor prime globus, prevzame vodenje: prilet se konca tam, kjer je.
    priletTece = false;
    vlecem = true;
    dotaknil();
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
    dotaknil();
    // Odriv gre v smer potega po zaslonu; y je navzdol, prizor navzgor.
    odmik.x += dx * ODRIV * polmerSvet;
    odmik.y -= dy * ODRIV * polmerSvet;
    zasuk.premultiply(new THREE.Quaternion().setFromAxisAngle(os, kot));
    uporabiZasuk();
    osveziNapis();

    // Hitrost za iztek. Delimo s slicico in ne z merjenim casom: kratki
    // premori med dogodki bi sicer dali neresnicno visoke hitrosti.
    hitrost.copy(os).multiplyScalar(Math.min(kot * 60, NAJVEC_HITROSTI));
  });

  platno.addEventListener(
    "wheel",
    (e) => {
      // Dokler globus ni na mestu, je kolesce navadno drsenje. Sele ko je
      // prispel in se nehal vrteti, ga sme kdo priblizevati.
      if (!viden || priletTece || prihodDelez < 0.999) return;

      // Ko priblizujemo, stran ne sme hkrati drseti - sicer se globus veca in
      // odhaja z zaslona obenem.
      e.preventDefault();
      dotaknil();

      // Kolesce meri enkrat v pikah, drugic v vrsticah, tretjic v straneh.
      const enota = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1;
      zoomCilj = Math.max(
        -ZOOM_NAJVEC,
        Math.min(zoomCilj - e.deltaY * enota * ZOOM_KORAK, ZOOM_NAJVEC)
      );
    },
    { passive: false }
  );

  const nehaj = (e) => {
    if (!vlecem) return;
    vlecem = false;
    dotaknil();
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
      prihodDelez = d;
      const e = easeOut(d);
      // Iz daljave in ne le od spodaj: pri 0,64 je globus ze ob prihodu skoraj
      // tak, kot bo, in poti ni videti. Pri 0,2 je najprej drobec.
      platno.style.transform = `translateY(${(1 - e) * 9}%) scale(${0.2 + e * 0.8})`;
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
        zadnjiDotik = priletOd;
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
