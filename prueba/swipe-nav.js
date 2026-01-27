(() => {
  // --- Activación SOLO mobile/touch ---
  const isMobile = () =>
    window.matchMedia("(pointer: coarse) and (hover: none)").matches ||
    window.matchMedia("(max-width: 1024px)").matches;

  if (!isMobile()) return;

  // --- Config ---
  const THRESHOLD_PX = 70; // distancia mínima en X
  const RESTRAINT_PX = 60; // tolerancia en Y (si se mueve mucho en Y, es scroll)
  const ALLOWANCE_RATIO = 1.2; // X debe ser claramente mayor que Y (absX > absY*ratio)
  const MAX_TIME_MS = 600; // opcional: si tarda más, lo ignoramos (reduce falsos positivos)

  const root = document.body; // o un contenedor específico
  let startX = 0;
  let startY = 0;
  let startT = 0;
  let tracking = false;

  // Para no romper sliders/inputs: si arrancás el gesto sobre estos elementos, no navegues
  const shouldIgnoreStart = (target) => {
    return !!target.closest(
      "input, textarea, select, button, a, [data-no-swipe], .no-swipe",
    );
  };

  root.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      if (shouldIgnoreStart(e.target)) return;

      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      startT = Date.now();
      tracking = true;
    },
    { passive: true },
  );

  root.addEventListener(
    "touchmove",
    (e) => {
      // No hacemos preventDefault para no bloquear scroll;
      // solo medimos. (Más abajo validamos el gesto.)
      if (!tracking) return;
      if (e.touches.length !== 1) tracking = false;
    },
    { passive: true },
  );

  root.addEventListener(
    "touchend",
    () => {
      if (!tracking) return;
      tracking = false;

      const dt = Date.now() - startT;
      if (dt > MAX_TIME_MS) return;

      const endTouch = event.changedTouches?.[0]; // fallback si existiera
      // En algunos navegadores "event" global no existe: usamos last known via touchend event si preferís.
      // Para mantenerlo simple, usamos delta basado en start y la última posición conocida NO; mejor: calculamos en touchend con el evento:
    },
    { passive: true },
  );

  // Reemplazo del touchend para tener coordenadas seguras:
  root.addEventListener(
    "touchend",
    (e) => {
      if (!tracking) return;
      tracking = false;

      const dt = Date.now() - startT;
      if (dt > MAX_TIME_MS) return;

      const t = e.changedTouches[0];
      const distX = t.clientX - startX;
      const distY = t.clientY - startY;

      const absX = Math.abs(distX);
      const absY = Math.abs(distY);

      // Validación: gesto horizontal claro
      if (absX < THRESHOLD_PX) return;
      if (absY > RESTRAINT_PX) return;
      if (absX <= absY * ALLOWANCE_RATIO) return;

      const leftUrl = root.getAttribute("data-swipe-left");
      const rightUrl = root.getAttribute("data-swipe-right");

      // distX < 0 => swipe hacia la izquierda (vas "a la próxima", típico)
      if (distX < 0 && leftUrl) {
        window.location.href = leftUrl;
      } else if (distX > 0 && rightUrl) {
        window.location.href = rightUrl;
      }
    },
    { passive: true },
  );
})();
