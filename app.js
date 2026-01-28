(function () {
  // 1) Antes de navegar: guardo modo/dirección para que el CSS sepa qué animar
  // - shared: Home ⇄ Detalle (shared elements)
  // - slide: Detalle ⇄ Detalle (swipe/prev/next)
  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest("a[data-vt-mode]");
      if (!a) return;

      sessionStorage.setItem("vt_mode", a.dataset.vtMode);
      if (a.dataset.vtDir) sessionStorage.setItem("vt_dir", a.dataset.vtDir);
    },
    { capture: true },
  );

  // 2) Swipe (solo en páginas con data-prev/data-next)
  const prevUrl = document.body?.dataset?.prev;
  const nextUrl = document.body?.dataset?.next;
  if (!prevUrl && !nextUrl) return;

  const isMobile =
    matchMedia("(pointer: coarse)").matches ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (!isMobile) return;

  let startX = 0,
    startY = 0,
    startT = 0,
    tracking = false;
  const minDistance = 70; // px
  const maxVertical = 60; // px
  const maxTime = 650; // ms

  window.addEventListener(
    "pointerdown",
    (e) => {
      if (e.pointerType && e.pointerType !== "touch") return;
      if (e.isPrimary === false) return;
      tracking = true;
      startX = e.clientX;
      startY = e.clientY;
      startT = performance.now();
    },
    { passive: true },
  );

  window.addEventListener(
    "pointerup",
    (e) => {
      if (!tracking) return;
      tracking = false;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const dt = performance.now() - startT;

      if (dt > maxTime) return;
      if (Math.abs(dy) > maxVertical) return;
      if (Math.abs(dx) < minDistance) return;

      // Swipe izquierda => next
      if (dx < 0 && nextUrl) {
        sessionStorage.setItem("vt_mode", "slide");
        sessionStorage.setItem("vt_dir", "next");
        location.assign(nextUrl);
        return;
      }

      // Swipe derecha => prev
      if (dx > 0 && prevUrl) {
        sessionStorage.setItem("vt_mode", "slide");
        sessionStorage.setItem("vt_dir", "prev");
        location.assign(prevUrl);
      }
    },
    { passive: true },
  );

  window.addEventListener(
    "pointercancel",
    () => {
      tracking = false;
    },
    { passive: true },
  );
})();
