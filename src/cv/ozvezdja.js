/**
 * Ozvezdja na nebu za galaksijo.
 *
 * Zvezde stojijo na krogli, ki se drzi kamere: ko se kamera premika po orbiti,
 * se ozvezdja ne priblizajo - tako se vede nebo, ki je neskoncno dalec. Vrti pa
 * se z njo, zato mimo drsijo kot prave zvezde.
 *
 * Crtna figura je privzeto komaj vidna. Ko z miske prides nadnjo, se izrise,
 * zraven pa pride ime in risba ozvezdja, ce zanj obstaja slika.
 *
 * Zaznavanje ni raycasting: zvezd je nekaj sto, zato jih vsako slicico
 * projiciramo na zaslon in merimo razdaljo kazalca do crt. To je ceneje in
 * natancneje kot zadeti drobno tocko v prostoru.
 */

import * as THREE from "three";
import "./ozvezdja.css";
import { OZVEZDJA } from "./ozvezdja-podatki.js";
import { jezik, obJeziku } from "./jezik.js";

/**
 * Nebo je zgrajeno na krogli s polmerom 1, v prizor pa ga postavimo z merilom.
 *
 * Prizor se meri po galaksiji in ta je lahko velika nekaj enot ali nekaj
 * tisoc - odvisno od modela. Trdna stevilka bi torej lahko padla za vidno
 * polje kamere; delez njene najdaljse razdalje pa je vedno pravi.
 */
const DELEZ_VIDNEGA = 0.5;
/** Koliko pik od crte se steje za "sem nad ozvezdjem". */
const DOSEG_PIK = 70;
/** Mirno stanje in stanje pod kazalcem. */
const CRTA_MIRNO = 0.1;
const CRTA_NAD = 0.62;
/** Dusenje prehoda; nizje je pocasneje. */
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

/** Rektascenzija in deklinacija v stopinjah -> tocka na enotski krogli. */
function naNebo(ra, dec, polmer = 1) {
  const a = THREE.MathUtils.degToRad(ra);
  const d = THREE.MathUtils.degToRad(dec);
  return new THREE.Vector3(
    Math.cos(d) * Math.cos(a) * polmer,
    Math.sin(d) * polmer,
    -Math.cos(d) * Math.sin(a) * polmer
  );
}

/** Svetlejsa zvezda je vecja; magnituda tece obratno. */
const velikostZvezde = (mag) => Math.max(1.6, 5.2 - mag * 0.62);

export function installOzvezdja(scene, camera, renderer) {
  const skupina = new THREE.Group();
  skupina.frustumCulled = false;
  scene.add(skupina);

  const sloj = document.createElement("div");
  sloj.className = "ozv-sloj";
  sloj.setAttribute("aria-hidden", "true");
  document.body.appendChild(sloj);

  const vsa = OZVEZDJA.map((o) => {
    const tocke = o.zvezde.map((z) => naNebo(z[0], z[1]));

    // --- zvezde ---
    const gZvezde = new THREE.BufferGeometry().setFromPoints(tocke);
    gZvezde.setAttribute(
      "aVelikost",
      new THREE.BufferAttribute(new Float32Array(o.zvezde.map((z) => velikostZvezde(z[2]))), 1)
    );
    const mZvezde = new THREE.ShaderMaterial({
      uniforms: { uMoc: { value: 0.55 }, uPik: { value: renderer.getPixelRatio() } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float aVelikost;
        uniform float uPik;
        void main() {
          vec4 pogled = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * pogled;
          gl_PointSize = aVelikost * uPik * 2.2;
        }`,
      fragmentShader: `
        uniform float uMoc;
        void main() {
          // Mehka tocka s sijem; brez teksture, da ni odvisna od nalaganja.
          float r = length(gl_PointCoord - vec2(0.5));
          float jedro = smoothstep(0.5, 0.0, r);
          gl_FragColor = vec4(vec3(0.86, 0.91, 1.0) * jedro * uMoc, jedro * uMoc);
        }`,
    });
    const zvezde = new THREE.Points(gZvezde, mZvezde);
    zvezde.frustumCulled = false;
    skupina.add(zvezde);

    // --- crte ---
    const pari = [];
    for (const [a, b] of o.crte) pari.push(tocke[a], tocke[b]);
    const mCrte = new THREE.LineBasicMaterial({
      color: 0x9fc0ff,
      transparent: true,
      opacity: CRTA_MIRNO,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const crte = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pari), mCrte);
    crte.frustumCulled = false;
    skupina.add(crte);

    // --- napis in risba ---
    const okvir = document.createElement("div");
    okvir.className = "ozv-napis";
    const risba = risbaZa(o.kljuc);
    okvir.innerHTML =
      (risba ? `<img class="ozv-risba" src="${risba}" alt="" />` : "") +
      `<span class="ozv-ime"></span>`;
    sloj.appendChild(okvir);

    return {
      podatki: o,
      tocke,
      zvezde,
      crte,
      mZvezde,
      mCrte,
      okvir,
      ime: okvir.querySelector(".ozv-ime"),
      zaslon: tocke.map(() => new THREE.Vector3()),
      moc: 0,
      cilj: 0,
    };
  });

  function napisiImena() {
    const en = jezik() !== "sl";
    for (const o of vsa) o.ime.textContent = en ? o.podatki.imeEn : o.podatki.ime;
  }
  napisiImena();
  obJeziku(napisiImena);

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
    skupina.visible = da;
    sloj.classList.toggle("skrit", !da);
  };

  /**
   * Korak: nebo se drzi kamere, nato pogledamo, nad katerim ozvezdjem je
   * kazalec, in moc prehodov premaknemo proti cilju.
   */
  function korak() {
    // Nebo se drzi kamere in raste z njenim vidnim poljem.
    const polmer = camera.far * DELEZ_VIDNEGA;
    skupina.position.copy(camera.position);
    skupina.scale.setScalar(polmer);
    if (!vidno) return;

    const s = renderer.domElement;
    const sirina = s.clientWidth;
    const visina = s.clientHeight;

    let najblizje = null;
    let najmanj = DOSEG_PIK;

    for (const o of vsa) {
      let vsotaX = 0;
      let vsotaY = 0;
      let vidnih = 0;
      o.tocke.forEach((t, i) => {
        const p = o.zaslon[i].copy(t).multiplyScalar(polmer).add(camera.position).project(camera);
        const zaSabo = p.z > 1;
        p.x = ((p.x + 1) / 2) * sirina;
        p.y = ((1 - p.y) / 2) * visina;
        p.z = zaSabo ? 1 : 0;
        if (!zaSabo) {
          vsotaX += p.x;
          vsotaY += p.y;
          vidnih += 1;
        }
      });
      o.vidnih = vidnih;
      o.sredx = vidnih ? vsotaX / vidnih : 0;
      o.sredy = vidnih ? vsotaY / vidnih : 0;

      if (!mis || vidnih < 2) continue;
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

    for (const o of vsa) {
      o.cilj = o === najblizje ? 1 : 0;
      o.moc += (o.cilj - o.moc) * PREHOD;
      if (o.moc < 0.002 && o.cilj === 0) o.moc = 0;

      o.mCrte.opacity = CRTA_MIRNO + (CRTA_NAD - CRTA_MIRNO) * o.moc;
      o.mZvezde.uniforms.uMoc.value = 0.55 + 0.45 * o.moc;

      if (o.moc > 0.002 && o.vidnih > 1) {
        // Risba in ime stojita na sredini ozvezdja in gresta z njim.
        o.okvir.style.transform = `translate(${Math.round(o.sredx)}px, ${Math.round(o.sredy)}px) translate(-50%, -50%)`;
        o.okvir.style.opacity = String(o.moc);
        o.okvir.style.visibility = "visible";
      } else if (o.okvir.style.visibility !== "hidden") {
        o.okvir.style.visibility = "hidden";
        o.okvir.style.opacity = "0";
      }
    }
  }

  return { korak, nastavi };
}
