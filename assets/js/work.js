// FANCYBOX
(function () {
   function getInstance() {
      try {
         return window.parent?.Fancybox?.getInstance?.() || null;
      } catch (e) {
         return null;
      }
   }
   function closeMe() {
      const fb = getInstance();
      if (fb) fb.close();
      else if (history.length > 1) history.back();
      else window.close();
   }

   // (Punto 2) Delegación: cerrar al clickear cualquier [data-fancybox-close] dentro del iframe
   document.addEventListener('click', (e) => {
      const el = e.target.closest('a[data-fancybox-close], button[data-fancybox-close]');
      if (!el) return;
      e.preventDefault();
      closeMe();
   });

   // Si tu template trae #closeBtn, lo cableamos sin romper si no existe
   const btn = document.getElementById('closeBtn');
   if (btn)
      btn.addEventListener('click', (e) => {
         e.preventDefault();
         closeMe();
      });

   // ESC para cerrar (iframe standalone)
   window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMe();
   });
})();

// SCROLL
// Si tenés un header fijo, poné su altura acá:
const HEADER_HEIGHT = 0; // ej: 76

document.getElementById('scroll-work').addEventListener('click', function (e) {
   e.preventDefault();

   const el = e.currentTarget;
   const rect = el.getBoundingClientRect();
   const linkTopAbs = window.scrollY + rect.top;

   // Scrollea hasta un punto *apenas* después del final del <a>,
   // compensando un posible header fijo para que quede completamente oculto.
   const targetY = linkTopAbs + el.offsetHeight - HEADER_HEIGHT + 1;

   window.scrollTo({
      top: targetY,
      behavior: 'smooth',
   });
});

/* */
