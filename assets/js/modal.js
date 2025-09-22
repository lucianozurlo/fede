// modal.js — modal accesible sin dependencias + integración con Fancybox (sin hashes)
(function () {
   const OPEN_ATTR = 'data-modal-open';
   const CLOSE_ATTR = 'data-modal-close';
   const CLEAR_GALLERY_ATTR = 'data-clear-gallery';
   const TARGET_ATTR = 'data-gallery-target'; // <- NUEVO: abre galería en 'slug'

   let lastActiveTrigger = null;

   // Fancybox helpers
   const getFB = () => window.Fancybox?.getInstance?.() || null;

   function clearUrlHash() {
      try {
         const url = location.pathname + location.search;
         history.replaceState(null, '', url);
      } catch {
         if (location.hash) location.hash = '';
      }
   }

   function closeFancyboxAndClearHash() {
      const fb = getFB();
      try {
         fb?.close?.();
      } catch {}
      clearUrlHash();
      document.documentElement.classList.remove('with-fancybox-gallery');
   }

   // Abrir modal por selector (#id)
   function openModal(selector) {
      const modal = document.querySelector(selector);
      if (!modal) return;

      lastActiveTrigger = document.activeElement;

      modal.classList.add('is-open');
      modal.removeAttribute('aria-hidden');
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');

      trapFocus(modal, true);

      modal.addEventListener('keydown', onKeyDown);
      modal.addEventListener('click', onClickClose);
   }

   // Cerrar modal
   function closeModal(modal) {
      if (!modal) return;

      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');

      modal.removeEventListener('keydown', onKeyDown);
      modal.removeEventListener('click', onClickClose);

      if (lastActiveTrigger && typeof lastActiveTrigger.focus === 'function') {
         lastActiveTrigger.focus();
      }
   }

   // Delegación global para abrir modales
   document.addEventListener('click', (e) => {
      const btn = e.target.closest(`[${OPEN_ATTR}]`);
      if (!btn) return;
      e.preventDefault();
      const target = btn.getAttribute(OPEN_ATTR);
      if (!target) return;
      openModal(target);
   });

   // Handler compartido dentro del modal: cerrar (y opcionalmente abrir galería)
   function onClickClose(e) {
      const isBackdrop = e.target.matches('.modal__backdrop');
      const closeBtn = e.target.closest(`[${CLOSE_ATTR}]`);
      if (!isBackdrop && !closeBtn) return;

      const modal = e.currentTarget.closest('.modal') || e.currentTarget;

      // ¿El botón/toggle también pide abrir la galería?
      // Usamos data-gallery-target="slug" para indicar el slide a abrir.
      const targetSlug = closeBtn?.getAttribute?.(TARGET_ATTR);

      // ¿Pide limpiar/cerrar galería Fancybox si estuviera abierta?
      if (closeBtn?.hasAttribute(CLEAR_GALLERY_ATTR)) {
         closeFancyboxAndClearHash();
      }

      // Cerramos el modal
      closeModal(modal);

      // Si hay un slug, abrimos la galería en ese ítem (sin hashes)
      if (targetSlug && window.Gallery && typeof window.Gallery.openBySlug === 'function') {
         // un pequeño delay para evitar pelearse con el final del close
         setTimeout(() => window.Gallery.openBySlug(targetSlug), 0);
      }
   }

   // Esc + focus trap
   function onKeyDown(e) {
      const modal = e.currentTarget.closest('.modal') || e.currentTarget;

      if (e.key === 'Escape') {
         e.preventDefault();
         closeModal(modal);
         return;
      }

      if (e.key === 'Tab') {
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
      }
   }

   // Focus utils
   function trapFocus(modal, focusFirst) {
      const focusables = getFocusable(modal);
      if (focusFirst && focusables.length) {
         const closeBtn = modal.querySelector(`[${CLOSE_ATTR}]`);
         (closeBtn || focusables[0]).focus();
      }
   }
   function getFocusable(root) {
      const selectors = [
         'a[href]',
         'button:not([disabled])',
         'input:not([disabled])',
         'select:not([disabled])',
         'textarea:not([disabled])',
         '[tabindex]:not([tabindex="-1"])',
      ].join(',');

      return Array.from(root.querySelectorAll(selectors)).filter(
         (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
      );
   }

   // Exponer helpers mínimos si hace falta
   window.openModal = openModal;
   window.closeModal = (selector) => {
      const modal = typeof selector === 'string' ? document.querySelector(selector) : selector;
      closeModal(modal);
   };
   window.closeFancyboxAndClearHash = closeFancyboxAndClearHash;
})();
