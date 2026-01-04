(() => {
  const preloader = document.getElementById("preloader");
  if (!preloader) return;

  document.documentElement.classList.add("no-scroll");

  const percentEl = preloader.querySelector("[data-percent]");
  const rotTR = preloader.querySelector(".pl-rotator--tr");
  const rotBL = preloader.querySelector(".pl-rotator--bl");

  let displayed = 0;
  let target = 0;
  let finished = false;

  const reduceMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  )?.matches;

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const setTarget = (v) => (target = clamp(v, target, 100)); // nunca baja
  const lerp = (a, b, t) => a + (b - a) * t;

  // Fondo: #F8F8F8 -> #ff6600
  const bgStart = { r: 248, g: 248, b: 248 };
  const bgEnd = { r: 255, g: 102, b: 0 };

  const bumpByState = () => {
    switch (document.readyState) {
      case "loading":
        setTarget(10);
        break;
      case "interactive":
        setTarget(45);
        break;
      case "complete":
        setTarget(100);
        break;
    }
  };

  document.addEventListener("readystatechange", bumpByState);
  document.addEventListener("DOMContentLoaded", () => setTarget(65));
  window.addEventListener("load", () => setTarget(100));

  const trackImages = () => {
    const imgs = Array.from(document.images || []);
    const pending = imgs.filter((img) => !img.complete);

    if (pending.length === 0) {
      setTarget(Math.max(target, 80));
      return;
    }

    const total = pending.length;
    let loaded = 0;

    const onAsset = () => {
      loaded++;
      const p = 20 + Math.round((loaded / total) * 70);
      setTarget(p);
      if (loaded >= total) setTarget(90);
    };

    pending.forEach((img) => {
      img.addEventListener("load", onAsset, { once: true });
      img.addEventListener("error", onAsset, { once: true });
    });
  };

  const render = () => {
    displayed += (target - displayed) * 0.12;
    if (Math.abs(target - displayed) < 0.15) displayed = target;

    const p = Math.round(displayed);
    const t = clamp(p / 100, 0, 1);

    if (percentEl) percentEl.textContent = `(${p}%)`;

    if (!reduceMotion) {
      // ✅ Fondo que cambia con el progreso
      const r = Math.round(lerp(bgStart.r, bgEnd.r, t));
      const g = Math.round(lerp(bgStart.g, bgEnd.g, t));
      const b = Math.round(lerp(bgStart.b, bgEnd.b, t));
      preloader.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

      // ✅ Rotaciones: 0 → -10° y 0 → +10°
      // rotación + fade-in (0 → 1) con el progreso
      const o = lerp(0, 1, t);

      if (rotTR) {
        rotTR.style.transform = `rotate(${lerp(0, -10, t)}deg)`;
        rotTR.style.opacity = o;
      }

      if (rotBL) {
        rotBL.style.transform = `rotate(${lerp(0, 10, t)}deg)`;
        rotBL.style.opacity = o;
      }
    }

    if (!finished && target === 100 && p === 100) finish();
    if (!finished) requestAnimationFrame(render);
  };

  const cleanup = () => {
    preloader?.remove();
    document.documentElement.classList.remove("no-scroll");
  };

  const finish = () => {
    finished = true;

    if (reduceMotion) {
      cleanup();
      return;
    }

    preloader.classList.add("is-done");
    preloader.addEventListener(
      "animationend",
      (e) => {
        if (e.animationName !== "preloader-out") return;
        cleanup();
      },
      { once: true }
    );
  };

  bumpByState();
  trackImages();
  requestAnimationFrame(render);

  window.__setLoaderProgress = (v) => setTarget(clamp(v, 0, 100));
})();
