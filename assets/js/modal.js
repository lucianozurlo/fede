// modal.js — modal accesible sin dependencias
// Reqs HTML:
// - Trigger:  <a href="#" data-modal-open="#modal-faqs">FAQs</a>
// - Modal root: <div id="modal-faqs" class="modal-simple" aria-hidden="true">...
// - Backdrop: <div class="modal__backdrop"></div>
// - Close: <button data-modal-close>...</button> o <a data-modal-close>...</a>

(function () {
  const OPEN_ATTR = "data-modal-open";
  const CLOSE_ATTR = "data-modal-close";
  const MODAL_SELECTOR = ".modal-simple";
  const DIALOG_SELECTOR = ".modal__dialog";
  const BACKDROP_SELECTOR = ".modal__backdrop";

  // Debe matchear tu CSS: --modal-close-ms (420ms)
  const CLOSE_ANIM_MS = 420;

  let lastActiveTrigger = null;

  /* ----------------------------- helpers ----------------------------- */

  const getOpenModals = () =>
    Array.from(
      document.querySelectorAll(
        `${MODAL_SELECTOR}.is-open, ${MODAL_SELECTOR}.is-closing`,
      ),
    );

  function updateScrollLock() {
    const anyOpen = getOpenModals().length > 0;
    document.documentElement.classList.toggle("modal-open", anyOpen);
    document.body.classList.toggle("modal-open", anyOpen);
  }

  function getFocusable(root) {
    const selectors = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    return Array.from(root.querySelectorAll(selectors)).filter(
      (el) =>
        !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
    );
  }

  function focusFirst(modal) {
    const focusables = getFocusable(modal);
    if (!focusables.length) return;

    const closeBtn = modal.querySelector(`[${CLOSE_ATTR}]`);
    (closeBtn || focusables[0]).focus();
  }

  function finishClose(modal, { restoreFocus } = { restoreFocus: true }) {
    modal.classList.remove("is-closing");
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    updateScrollLock();

    if (
      restoreFocus &&
      lastActiveTrigger &&
      typeof lastActiveTrigger.focus === "function"
    ) {
      lastActiveTrigger.focus();
    }
  }

  function closeModal(modal, { restoreFocus } = { restoreFocus: true }) {
    if (!modal) return;
    if (modal.classList.contains("is-closing")) return;

    const dialog = modal.querySelector(DIALOG_SELECTOR);

    // Dispara animación de salida (CSS)
    modal.classList.add("is-closing");
    modal.classList.remove("is-open");

    updateScrollLock();

    let done = false;

    const onEnd = (e) => {
      if (done) return;
      if (dialog && e.target !== dialog) return;
      done = true;
      dialog?.removeEventListener("animationend", onEnd);
      finishClose(modal, { restoreFocus });
    };

    if (dialog) {
      dialog.addEventListener("animationend", onEnd);
      setTimeout(() => {
        if (done) return;
        done = true;
        dialog.removeEventListener("animationend", onEnd);
        finishClose(modal, { restoreFocus });
      }, CLOSE_ANIM_MS + 120);
    } else {
      setTimeout(() => finishClose(modal, { restoreFocus }), CLOSE_ANIM_MS);
    }
  }

  function closeAllModals() {
    const modals = getOpenModals();

    // Cerramos todos sin restaurar foco por cada uno
    modals.forEach((m) => closeModal(m, { restoreFocus: false }));

    // Restauramos foco una sola vez cuando termine el cierre
    if (modals.length) {
      setTimeout(() => {
        if (
          lastActiveTrigger &&
          typeof lastActiveTrigger.focus === "function"
        ) {
          lastActiveTrigger.focus();
        }
      }, CLOSE_ANIM_MS + 150);
    }
  }

  function openModal(selector) {
    const modal = document.querySelector(selector);
    if (!modal) return;

    // Sin stacking: cerramos lo que esté abierto
    closeAllModals();

    lastActiveTrigger = document.activeElement;

    modal.classList.remove("is-closing");
    modal.classList.add("is-open");
    modal.removeAttribute("aria-hidden");

    updateScrollLock();
    focusFirst(modal);
  }

  /* --------------------------- event delegation --------------------------- */

  // Abrir
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(`[${OPEN_ATTR}]`);
    if (!trigger) return;

    e.preventDefault();

    const target = trigger.getAttribute(OPEN_ATTR);
    if (!target) return;

    openModal(target);
  });

  // Cerrar (backdrop o botón)
  document.addEventListener("click", (e) => {
    const modal = e.target.closest(MODAL_SELECTOR);
    if (!modal) return;

    const clickedBackdrop = e.target.matches(BACKDROP_SELECTOR);
    const closeBtn = e.target.closest(`[${CLOSE_ATTR}]`);

    if (!clickedBackdrop && !closeBtn) return;

    e.preventDefault();
    closeModal(modal);
  });

  // Navegar desde links dentro del modal:
  // - setea View Transition
  // - cierra modal
  // - navega cuando termina el cierre (para que el snapshot viejo NO tenga el modal encima)
  document.addEventListener(
    "click",
    (e) => {
      const modal = e.target.closest(MODAL_SELECTOR);
      if (!modal) return;

      // Solo si el modal está abierto/clausurándose
      if (
        !modal.classList.contains("is-open") &&
        !modal.classList.contains("is-closing")
      )
        return;

      const link = e.target.closest("a[href]");
      if (!link) return;

      // Ignorar links de open/close del propio modal
      if (link.hasAttribute(OPEN_ATTR) || link.hasAttribute(CLOSE_ATTR)) return;

      const hrefAttr = link.getAttribute("href");
      if (!hrefAttr) return;

      // Ignorar anchors / no navegación
      if (hrefAttr === "#" || hrefAttr.startsWith("#")) return;

      // Ignorar links externos en nueva pestaña
      if (link.target === "_blank") return;

      // ========= View Transition (igual que nav.js) =========
      const mode = link.dataset.vtMode || "fade"; // fade | slide
      const dir = mode === "slide" ? link.dataset.vtDir || "next" : null;

      // Setear en el doc actual (snapshot viejo)
      document.documentElement.dataset.vtMode = mode;
      if (dir) document.documentElement.dataset.vtDir = dir;
      else delete document.documentElement.dataset.vtDir;

      // Persistir para el doc destino (snapshot nuevo)
      sessionStorage.setItem("vt_mode", mode);
      if (dir) sessionStorage.setItem("vt_dir", dir);
      else sessionStorage.removeItem("vt_dir");

      // Frenar navegación inmediata
      e.preventDefault();

      // Cerrar y navegar al final
      closeModal(modal, { restoreFocus: false });

      // Usamos el mismo timing que tu cierre (CLOSE_ANIM_MS)
      // + margen por fallback
      const navigateAfter = CLOSE_ANIM_MS + 60;

      // link.href da la URL resuelta (absoluta)
      setTimeout(() => {
        location.assign(link.href);
      }, navigateAfter);
    },
    { capture: true },
  );

  // Teclado: ESC cierra todo + Tab trap en el modal abierto
  document.addEventListener("keydown", (e) => {
    const openModals = getOpenModals();
    if (!openModals.length) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeAllModals();
      return;
    }

    if (e.key !== "Tab") return;

    // Trap focus en el último modal abierto (por si hubiese más de uno)
    const modal = openModals[openModals.length - 1];
    const focusables = getFocusable(modal);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // API mínima (por si querés abrir/cerrar desde código)
  window.Modal = {
    open: openModal,
    close: (selectorOrEl) => {
      const modal =
        typeof selectorOrEl === "string"
          ? document.querySelector(selectorOrEl)
          : selectorOrEl;
      closeModal(modal);
    },
    closeAll: closeAllModals,
  };
})();
