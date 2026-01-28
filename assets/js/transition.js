(function () {
  const root = document.documentElement;

  // CLICK: respeta data-vt-mode / data-vt-dir del link.
  // Default: fade.
  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest("a[href]");
      if (!a) return;

      const mode = a.dataset.vtMode || "fade"; // fade | slide
      const dir = a.dataset.vtDir || ""; // prev | next (solo slide)

      // 1) Setear en el doc actual (snapshot viejo)
      root.dataset.vtMode = mode;
      if (mode === "slide") root.dataset.vtDir = dir || "next";
      else delete root.dataset.vtDir;

      // 2) Persistir para el doc destino (snapshot nuevo)
      sessionStorage.setItem("vt_mode", mode);
      if (mode === "slide") sessionStorage.setItem("vt_dir", dir || "next");
      else sessionStorage.removeItem("vt_dir");
    },
    { capture: true },
  );

  // SWIPE: solo en páginas con data-prev/data-next (p1..p6)
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
  const minDistance = 70;
  const maxVertical = 60;
  const maxTime = 650;

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

      if (dx < 0 && nextUrl) {
        root.dataset.vtMode = "slide";
        root.dataset.vtDir = "next";
        sessionStorage.setItem("vt_mode", "slide");
        sessionStorage.setItem("vt_dir", "next");
        location.assign(nextUrl);
        return;
      }

      if (dx > 0 && prevUrl) {
        root.dataset.vtMode = "slide";
        root.dataset.vtDir = "prev";
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

// ==========================================
// BOTONES PREV/NEXT (pager entre páginas)
// - usa body[data-prev]/body[data-next]
// - fuerza SLIDE (como el drag mobile)
// ==========================================
function go(dir) {
  const prev = document.body?.dataset?.prev;
  const next = document.body?.dataset?.next;

  const target = dir === "prev" ? prev : dir === "next" ? next : null;

  if (!target) return;

  const url = new URL(target, location.href).href;

  // Setear transición en snapshot viejo
  document.documentElement.dataset.vtMode = "slide";
  document.documentElement.dataset.vtDir = dir;

  // Persistir para snapshot nuevo
  sessionStorage.setItem("vt_mode", "slide");
  sessionStorage.setItem("vt_dir", dir);

  location.assign(url);
}

document.addEventListener("click", (e) => {
  const prevBtn = e.target.closest('[data-carousel-prev="true"]');
  const nextBtn = e.target.closest('[data-carousel-next="true"]');

  if (!prevBtn && !nextBtn) return;

  e.preventDefault(); // evita cualquier comportamiento accidental
  go(prevBtn ? "prev" : "next");
});

// ==========================================
// TECLAS ← / → (desktop) => prev/next
// - ignora inputs, textareas, selects, contenteditable
// - ignora si hay modal abierto (clase modal-open)
// ==========================================
function isTypingContext(el) {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el.isContentEditable) return true;
  return false;
}

document.addEventListener("keydown", (e) => {
  // no interferir con combinaciones
  if (e.altKey || e.ctrlKey || e.metaKey) return;

  // si hay modal abierto, no navegamos
  if (
    document.documentElement.classList.contains("modal-open") ||
    document.body.classList.contains("modal-open")
  ) {
    return;
  }

  // si estás escribiendo en algún campo, no navegamos
  if (isTypingContext(document.activeElement)) return;

  if (e.key === "ArrowLeft") {
    e.preventDefault();
    go("prev");
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    go("next");
  }
});

(function prewarmPrevNext() {
  const prev = document.body?.dataset?.prev;
  const next = document.body?.dataset?.next;
  if (!prev && !next) return;

  // Evitar gastar datos en conexiones pobres / ahorro de datos
  const c = navigator.connection;
  if (c && (c.saveData || /2g/.test(c.effectiveType))) return;

  const urls = [prev, next]
    .filter(Boolean)
    .map((u) => new URL(u, location.href).href);

  const run = () => {
    urls.forEach((u) => {
      fetch(u, { credentials: "same-origin", cache: "force-cache" }).catch(
        () => {},
      );
    });
  };

  if ("requestIdleCallback" in window)
    requestIdleCallback(run, { timeout: 1200 });
  else setTimeout(run, 250);
})();
