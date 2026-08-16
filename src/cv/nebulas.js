/**
 * Meglice.
 *
 * Raymarch se izvede ENKRAT ob zagonu, v majhno teksturo. Meglice so nato
 * navadne obrnjene ploskve na svojih mestih v sceni.
 *
 * Zakaj tako in ne celozaslonski raymarch vsako slicico:
 *
 *   - Celozaslonski raymarcher ima svojo kamero in o sceni nic ne ve. Bil bi
 *     ploska slika cez ozadje in se z galaksijo ne bi premikal - ravno tega
 *     pa hocemo.
 *
 *   - Cena. Raymarch je ~50 korakov na piksel, vsak z desetinami sinusov. Za
 *     ozadje, ki naj bo komaj opazno, je to nesorazmerno. Izpecena tekstura
 *     stane med tekom nic.
 *
 *   - Ker so meglice na svojih legah v svetu, dobijo pravilno perspektivo in
 *     parallakso, ko kamera krozi. Notranje parallakse pri tako majhnih in
 *     bledih madezih oko ne pogresi - prave meglice so prakticno v
 *     neskoncnosti.
 *
 * Funkcija gostote je napisana na novo. Vzorec "sestevaj sinuse in vmes
 * zavrti ravnino" je znan prijem, sama izvedba pa je tu lastna, zato na
 * projekt ne pade tuja licenca.
 */

import * as THREE from "three";

/** Koliko razlicnih meglic izpecemo in koliko jih postavimo v sceno. */
const RAZLICIC = 3;
const KOSOV = 3;

/**
 * Koliko se vidijo prameni pod sijem. Sij sam je lep, a brez snovi pod njim
 * je meglica le obarvana lisa; polovicna moc pusti strukturo slutiti, ne da
 * bi tekmovala s sijem.
 */
const PRAMENI = 0.5;

/** Stranica izpecene teksture. */
const LOCLJIVOST = 320;

/** Velikost meglice kot delez polmera galaksije. */
const VELIKOST_MIN = 0.09;
const VELIKOST_MAX = 0.17;

/**
 * Kje se meglice zadrzujejo, v polmerih galaksije.
 *
 * Kamera stoji na 1.1 polmera in gleda v sredisce z vidnim kotom 64 stopinj.
 * Pri prejsnjem razponu 1.2-3.4 po celotni krogli je bila vecina meglic za
 * hrbtom ali izven okvirja in nobene ni bilo videti. Zdaj so blizje in
 * razporejene v obroc okoli diska, zato jih je ob vsakem kotu nekaj v vidnem
 * polju.
 */
const ODMIK_MIN = 0.3;
const ODMIK_MAX = 1.05;

/** Kako mocno so vidne. Nizko namenoma - so ozadje, ne motiv. */
const MOC_MIN = 0.7;
const MOC_MAX = 1.0;

/** Barvni pari: sredica in obrobje. */
/**
 * Barvni pari: sredica in obrobje.
 *
 * Zadrzane namenoma - komaj odmaknjene od sivine. Nasicena meglica ob
 * additivnem mesanju takoj prevlada nad zvezdami in postane motiv, ne ozadje.
 */
const BARVE = [
  // Prameni ostanejo zadrzani, sij pa dobi barvo, kakrsno imajo prave
  // meglice: vodik sveti rdece-rozno, dvakrat ionizirani kisik turkizno,
  // prah okoli mladih zvezd zlato.
  {
    sredica: new THREE.Color(0.72, 0.62, 0.68),
    obrobje: new THREE.Color(0.2, 0.14, 0.18),
    sij: new THREE.Color(1.0, 0.26, 0.44),
  },
  {
    sredica: new THREE.Color(0.6, 0.72, 0.74),
    obrobje: new THREE.Color(0.14, 0.2, 0.22),
    sij: new THREE.Color(0.22, 0.86, 0.82),
  },
  {
    sredica: new THREE.Color(0.78, 0.72, 0.6),
    obrobje: new THREE.Color(0.24, 0.2, 0.14),
    sij: new THREE.Color(1.0, 0.6, 0.22),
  },
];

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform vec3 uSeme;
  uniform vec3 uSredica;
  uniform vec3 uObrobje;
  uniform vec3 uSij;
  uniform float uPrameni;
  varying vec2 vUv;

  const float NUDGE = 0.72;

  /**
   * Grebenast spiralni sum: sestevamo sinuse, vmes pa ravnino zavrtimo in
   * podvojimo frekvenco. Absolutna vrednost naredi ostre grebene, ki v
   * meglici berejo kot prameni prahu.
   */
  float grebeni(vec3 p) {
    float norm = inversesqrt(1.0 + NUDGE * NUDGE);
    float n = 0.0;
    float f = 1.0;
    for (int i = 0; i < 7; i++) {
      n += -abs(sin(p.y * f) + cos(p.x * f)) / f;
      p.xy += vec2(p.y, -p.x) * NUDGE; p.xy *= norm;
      p.xz += vec2(p.z, -p.x) * NUDGE; p.xz *= norm;
      f *= 1.71;
    }
    return n;
  }

  /** Enako, brez absolutne vrednosti: mehke, velike oblike. */
  float mehko(vec3 p) {
    float norm = inversesqrt(1.0 + NUDGE * NUDGE);
    float n = 0.0;
    float f = 1.0;
    for (int i = 0; i < 4; i++) {
      n += (sin(p.y * f) + cos(p.x * f)) / f;
      p.xz += vec2(p.z, -p.x) * NUDGE; p.xz *= norm;
      f *= 1.34;
    }
    return n;
  }

  float gostota(vec3 p) {
    p += uSeme;
    float d = p.y + 4.2;
    d -= grebeni(p);
    d += grebeni(p.zxy * 0.51 + 100.0) * 3.6;
    d -= mehko(p);
    return abs(d * 0.5) + 0.03;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;

    vec3 ro = vec3(0.0, 0.0, -6.0);
    vec3 rd = normalize(vec3(uv, 1.4));

    // Presecisce z ovojno kroglo, da ne korakamo po praznini.
    float b = dot(rd, ro);
    float c = dot(ro, ro) - 8.0;
    float delta = b * b - c;
    vec4 vsota = vec4(0.0);

    if (delta > 0.0) {
      float koren = sqrt(delta);
      float t = max(-b - koren, 0.0);
      float konec = -b + koren;
      float skupna = 0.0;

      for (int i = 0; i < 48; i++) {
        if (skupna > 0.92 || t > konec || vsota.a > 0.98) break;

        vec3 pos = ro + t * rd;
        float d = max(gostota(pos), 0.08);

        if (d < 0.1) {
          // Lokalna gostota in utez: blize ko je robu, vec prispeva, a manj,
          // ce je pred njim ze veliko snovi - tako dobimo obcutek zasenčenja
          // znotraj oblaka.
          float lokalna = 0.1 - d;
          float w = (1.0 - skupna) * lokalna;
          skupna += w + 1.0 / 200.0;

          float r = length(pos);
          vec3 barva = mix(uSredica, uObrobje, clamp(r / 2.4, 0.0, 1.0));
          // Svetla sredica, ki od znotraj osvetli prah.
          barva += uSredica * 0.5 / max(r * r, 0.35);

          vec4 col = vec4(barva, skupna * 0.32);
          col.rgb *= col.a;
          vsota += col * (1.0 - vsota.a);
        }

        skupna += 1.0 / 80.0;
        t += max(d * 0.32, 0.035);
      }
    }

    vsota = clamp(vsota, 0.0, 1.0);

    // Krozna zabrisanost: brez nje bi imela meglica robove svojega kvadrata.
    float d = length(uv);
    float rob = 1.0 - smoothstep(0.55, 1.0, d);
    vsota *= rob * rob * uPrameni;

    // Sij v barvi plina. Dva clena: ozko jedro, ki gori mocneje, in siroka
    // avreola, ki se razlije skoraj do roba. En sam clen da ali packo ali
    // komaj vidno meglo; dva dasta globino, po kateri je meglica videti kot
    // svetlobni vir in ne kot izrezek.
    float jedro = exp(-d * 5.4) * 0.28;
    float avreola = exp(-d * 1.7) * 0.22;
    float sij = (jedro + avreola) * (1.0 - smoothstep(0.62, 1.0, d));
    vsota.rgb += uSij * sij;
    vsota.a = max(vsota.a, sij * 0.85);

    gl_FragColor = vsota;
  }
`;

/** Izpece eno meglico v teksturo. */
function izpeci(renderer, seme, sredica, obrobje, sij) {
  const cilj = new THREE.WebGLRenderTarget(LOCLJIVOST, LOCLJIVOST, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });

  const scena = new THREE.Scene();
  const kamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const ploskev = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: {
        uSeme: { value: seme },
        uSredica: { value: sredica },
        uObrobje: { value: obrobje },
        uSij: { value: sij },
        uPrameni: { value: PRAMENI },
      },
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
    })
  );
  scena.add(ploskev);

  const prejsnji = renderer.getRenderTarget();
  renderer.setRenderTarget(cilj);
  renderer.clear(true, true, true);
  renderer.render(scena, kamera);
  renderer.setRenderTarget(prejsnji);

  ploskev.geometry.dispose();
  ploskev.material.dispose();

  return cilj.texture;
}

/**
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {THREE.Vector3} sredisce sredisce galaksije
 * @param {number} radius polmer galaksije
 */
export function installNebulas(renderer, scene, sredisce, radius) {
  const teksture = [];
  for (let i = 0; i < RAZLICIC; i += 1) {
    const { sredica, obrobje, sij } = BARVE[i % BARVE.length];
    const seme = new THREE.Vector3(
      Math.random() * 60 - 30,
      Math.random() * 60 - 30,
      Math.random() * 60 - 30
    );
    teksture.push(izpeci(renderer, seme, sredica, obrobje, sij));
  }

  for (let i = 0; i < KOSOV; i += 1) {
    const material = new THREE.SpriteMaterial({
      map: teksture[i % teksture.length],
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      // Meglica ne sme prekriti zvezd pred sabo; z branjem globine ostane
      // za tistimi, ki so blizje.
      depthTest: true,
      opacity: MOC_MIN + Math.random() * (MOC_MAX - MOC_MIN),
      rotation: Math.random() * Math.PI * 2,
    });

    const kos = new THREE.Sprite(material);

    // Obroc okoli diska, enakomerno razmaknjen po kotu. Nakljucni koti bi se
    // gruce in vrzeli - pri devetih kosih bi lahko bila cela polovica neba
    // prazna. Enakomeren razmik z majhnim odmikom zagotovi, da jih je ob
    // vsakem kotu kamere nekaj v vidnem polju.
    const u = ((i + Math.random() * 0.5) / KOSOV) * Math.PI * 2;
    const r = radius * (ODMIK_MIN + Math.random() * (ODMIK_MAX - ODMIK_MIN));
    kos.position.set(
      sredisce.x + r * Math.cos(u),
      // Nizko nad ravnino diska, da so med zvezdami in ne lebdijo nad njimi.
      sredisce.y + (Math.random() * 2 - 1) * radius * 0.22,
      sredisce.z + r * Math.sin(u)
    );

    const s = radius * (VELIKOST_MIN + Math.random() * (VELIKOST_MAX - VELIKOST_MIN));
    kos.scale.set(s, s, 1);
    kos.renderOrder = -1;

    scene.add(kos);
  }
}
