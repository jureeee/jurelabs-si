/**
 * Metulj v namigu na prvem zaslonu.
 *
 * Model je iz 3D AI Studia (Meshy 7), za splet poenostavljen na 37 tisoc
 * trikotnikov in brez tekstur - barvo mu da sencilnik tu. Material je
 * prosojen in na robovih svetlejsi (Fresnel): krila so na robu tanka, zato
 * sijejo, sredina pa ostane komaj vidna. Tako je metulj dimnat, ne plasticen.
 *
 * Nalozi se sele, ko je stran ze nalozena, in izrisuje le, dokler je namig
 * viden - ko se kdo pomakne navzdol, zanka stoji.
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import modelUrl from "../assets/3d models/metulj.glb?url";

/** Zibanje: najvecji zasuk levo-desno (radiani) in cas enega nihaja. */
const ZIBANJE = 0.55;
const ZIBANJE_S = 6.5;

export function installMetulj(gnezdo, namig) {
  let izrisovalnik;
  try {
    izrisovalnik = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return; // Brez WebGL ostane namig brez metulja - besedilo je dovolj.
  }
  // Tanke konice kril so na majhnem platnu nazobcane; dvojna gostota jih
  // zgladi, platno pa je tako majhno, da to nic ne stane.
  izrisovalnik.setPixelRatio(Math.min(Math.max(devicePixelRatio || 1, 1) * 2, 3));
  izrisovalnik.setClearAlpha(0);
  const platno = izrisovalnik.domElement;
  gnezdo.appendChild(platno);

  const prizor = new THREE.Scene();
  const kamera = new THREE.PerspectiveCamera(26, 1, 0.1, 20);
  kamera.position.set(0, 0, 4.4);

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uBarva: { value: new THREE.Color(0.86, 0.9, 1.0) } },
    vertexShader: `
      varying vec3 vNormala;
      varying vec3 vPogled;
      void main() {
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        vNormala = normalize(normalMatrix * normal);
        vPogled = normalize(-p.xyz);
        gl_Position = projectionMatrix * p;
      }`,
    fragmentShader: `
      uniform vec3 uBarva;
      varying vec3 vNormala;
      varying vec3 vPogled;
      void main() {
        float rob = 1.0 - abs(dot(normalize(vNormala), normalize(vPogled)));
        // Model je skoraj ploski in gleda v kamero, zato roba ni veliko:
        // osnova mora biti ze sama vidna, rob jo le prizge.
        float a = 0.36 + pow(rob, 1.6) * 0.85;
        gl_FragColor = vec4(uBarva * a, a);
      }`,
  });

  const nosilec = new THREE.Group();
  prizor.add(nosilec);

  function meri() {
    const r = gnezdo.getBoundingClientRect();
    const s = Math.max(1, Math.round(r.width));
    const v = Math.max(1, Math.round(r.height));
    izrisovalnik.setSize(s, v, false);
    kamera.aspect = s / v;
    kamera.updateProjectionMatrix();
  }
  meri();
  addEventListener("resize", meri);

  new GLTFLoader().load(modelUrl, (g) => {
    g.scene.traverse((o) => {
      if (o.isMesh) o.material = material;
    });
    // Na sredino in na velikost, ki zapolni platno po sirini.
    const skatla = new THREE.Box3().setFromObject(g.scene);
    const sredisce = skatla.getCenter(new THREE.Vector3());
    const mere = skatla.getSize(new THREE.Vector3());
    g.scene.position.sub(sredisce);
    nosilec.add(g.scene);
    nosilec.scale.setScalar(1.6 / Math.max(mere.x, 0.001));
    platno.classList.add("nalozen");
  });

  const ura = new THREE.Clock();
  function slicica() {
    requestAnimationFrame(slicica);
    if (document.hidden || namig.classList.contains("skrit")) return;
    const t = ura.getElapsedTime();
    const faza = (t / ZIBANJE_S) * Math.PI * 2;
    nosilec.rotation.y = Math.sin(faza) * ZIBANJE;
    nosilec.rotation.x = -0.18 + Math.sin(faza * 0.5 + 1) * 0.06;
    nosilec.rotation.z = Math.sin(faza * 0.7) * 0.04;
    nosilec.position.y = Math.sin(faza * 1.3) * 0.05;
    izrisovalnik.render(prizor, kamera);
  }
  requestAnimationFrame(slicica);
}
