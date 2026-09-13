// HALO — "liquid glass" material (zanesljiv, cross-browser). Samostojen in
// IZKLOPLJEN privzeto; ne dotakne se app.js/style.css. Preklop spodaj desno.
//
// Zakaj ne prava refrakcija: per-piksel lečenje ŽIVE DOM vsebine na webu ni
// zanesljivo (backdrop-filter:url(#feDisplacementMap) Chromium pogosto ne
// izriše; WebGL bi rabil zajem strani). Na svetlem, skoraj enotnem ozadju je
// refrakcija tako ali tako komajda vidna. Zato posnema "liquid glass" videz z
// močnim frostom + specular robom + sijajem, ki SLEDI kazalcu (kot mouse v
// referenčnem shaderju) — Apple-like in deluje povsod.
(() => {
  const LS = "halo-liquid-glass";

  function injectStyle() {
    const boxes = "body.lg-on .card, body.lg-on .health-banner, body.lg-on .mini, body.lg-on .login-card";
    const soft = "body.lg-on .sidebar, body.lg-on .topbar, body.lg-on .modal, body.lg-on .table-wrap, body.lg-on .dd-menu, body.lg-on .dd-btn, body.lg-on .select, body.lg-on .btn, body.lg-on .chip";
    const css = `
    /* --- frosted podlaga (vse steklene površine) --- */
    ${boxes}, ${soft} {
      -webkit-backdrop-filter: blur(20px) saturate(1.9) brightness(1.06);
      backdrop-filter: blur(20px) saturate(1.9) brightness(1.06);
    }
    /* --- polni material: sloji globine + rob (samostojni boksi) --- */
    ${boxes} {
      position: relative; isolation: isolate;
      background: linear-gradient(135deg, var(--lg-fill), var(--lg-fill-2)) !important;
      border: 1px solid var(--hairline-2) !important;
      box-shadow:
        inset 0 1px 1px rgba(255,255,255,0.9),
        inset 0 -8px 22px rgba(255,255,255,0.14),
        inset 0 0 0 1px rgba(255,255,255,0.16),
        0 14px 40px rgba(16,24,40,0.16) !important;
      overflow: hidden;
    }
    /* specular sijaj, ki sledi kazalcu (--mx/--my), + stalni rob-highlight */
    ${boxes.split(", ").map((s) => s + "::before").join(", ")} {
      content: ""; position: absolute; inset: 0; border-radius: inherit;
      pointer-events: none; z-index: -1;
      background:
        radial-gradient(60% 45% at var(--mx,30%) var(--my,0%), rgba(255,255,255,0.7), rgba(255,255,255,0) 60%),
        linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0) 26%),
        linear-gradient(0deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 20%);
      mix-blend-mode: screen; opacity: var(--lg-spec, 0.85);
      transition: background-position 0.1s linear;
    }
    /* rahel barvni lom na robu (kromatska aberacija) */
    ${boxes.split(", ").map((s) => s + "::after").join(", ")} {
      content: ""; position: absolute; inset: 0; border-radius: inherit;
      pointer-events: none; z-index: -1;
      box-shadow: inset 1px 0 1px rgba(120,180,255,0.22), inset -1px 0 1px rgba(255,150,180,0.18);
    }
    /* mehkejše površine (brez overflow/pseudo, da ne razbijemo scrolla/menijev) */
    ${soft} {
      background: linear-gradient(135deg, var(--lg-fill), var(--lg-fill-2)) !important;
      border: 1px solid var(--hairline-2) !important;
      box-shadow: inset 0 1px 1px rgba(255,255,255,0.4), 0 8px 26px rgba(16,24,40,0.12) !important;
    }
    body.lg-on .bg-stage { filter: saturate(1.05); }`;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  const GLASS_SEL = ".card, .health-banner, .mini, .login-card";
  function trackPointer() {
    let pending = null;
    document.addEventListener("pointermove", (e) => {
      if (!document.body.classList.contains("lg-on")) return;
      const el = e.target.closest && e.target.closest(GLASS_SEL);
      if (!el) return;
      if (pending) return;
      pending = requestAnimationFrame(() => {
        pending = null;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
        el.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
      });
    }, { passive: true });
  }

  function supported() {
    return typeof CSS !== "undefined" && (CSS.supports("backdrop-filter", "blur(1px)")
      || CSS.supports("-webkit-backdrop-filter", "blur(1px)"));
  }

  function boot() {
    injectStyle();
    trackPointer();
    const ok = supported();
    // Kontrola je zdaj v Nastavitvah (viewSettings). Sem izpostavimo API.
    window.HaloGlass = {
      supported: () => ok,
      get: () => localStorage.getItem(LS) === "1",
      set: (on) => {
        document.body.classList.toggle("lg-on", !!on && ok);
        localStorage.setItem(LS, on && ok ? "1" : "0");
      },
    };
    window.HaloGlass.set(localStorage.getItem(LS) === "1");
  }

  if (document.body) boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
