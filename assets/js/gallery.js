// gallery.js — Fancybox v5 con URL SIEMPRE limpia + API global Gallery.openBySlug()
window.addEventListener('DOMContentLoaded', () => {
   const html = document.documentElement;

   // Limpiar cualquier hash al cargar y mantenerlo limpio
   clearUrlHash();
   window.addEventListener('hashchange', clearUrlHash);

   // Desactivar cualquier manejo de hash interno de Fancybox
   try {
      window.Fancybox && (window.Fancybox.defaults.Hash = false);
   } catch {}
   const common = {
      animated: true,
      dragToClose: true,
      showClass: 'f-fadeIn',
      hideClass: 'f-fadeOut',
      Carousel: { infinite: false },
      Toolbar: { display: ['counter', 'close'] },
      compact: false,
      Hash: false,
      hash: false,
   };

   const getFB = () => window.Fancybox?.getInstance?.() || null;

   // Triggers de la galería (no tocamos IDs ni escribimos hash)
   const triggers = Array.from(document.querySelectorAll('[data-fancybox="galeria"]'));
   const indexBySlug = new Map(); // slug -> index (para API openBySlug)
   const slugFrom = (el) => {
      const card = el.closest('.card');
      // Solo a efectos de lookup interno; NO lo reflejamos en URL
      return (el.getAttribute('data-caption') || card?.getAttribute('data-caption') || '').trim();
   };

   triggers.forEach((el, i) => {
      // thumb automático
      if (!el.hasAttribute('data-thumb')) {
         const card = el.closest('.card');
         const img = card?.querySelector('.media .img-base');
         if (img?.src) el.setAttribute('data-thumb', img.src);
      }
      const slug = slugFrom(el);
      if (slug) indexBySlug.set(slug, i);
   });

   // Bind Fancybox
   if (window.Fancybox) {
      window.Fancybox.bind('[data-fancybox="galeria"]', {
         ...common,
         on: {
            ready: (fb) => {
               html.classList.add('with-fancybox-gallery');
               keepUrlCleanDuringCarousel(fb);
            },
            close: clearUrlHash,
            destroy: () => {
               html.classList.remove('with-fancybox-gallery');
               document.removeEventListener('click', onGlobalClearGallery, { capture: true });
               clearUrlHash();
            },
         },
      });
   }

   // Mantener URL limpia en cualquier navegación del carousel
   function keepUrlCleanDuringCarousel(fb) {
      if (!fb) return;
      const clean = () => clearUrlHash();

      try {
         fb.Carousel.on?.('change', clean);
      } catch {}
      try {
         fb.Carousel.on?.('select', clean);
      } catch {}
      fb.on?.('done', clean);
      queueMicrotask(clean);

      // Botón global que cierra galería y limpia URL
      document.addEventListener('click', onGlobalClearGallery, { capture: true });
   }

   function onGlobalClearGallery(e) {
      const btn = e.target.closest('[data-clear-gallery]');
      if (!btn) return;
      const fb = getFB();
      try {
         fb?.close?.();
      } catch {}
      clearUrlHash();
   }

   function clearUrlHash() {
      try {
         const url = location.pathname + location.search;
         if (location.hash) history.replaceState(null, '', url);
         else history.replaceState(null, '', url);
      } catch {
         if (location.hash) location.hash = '';
      }
   }

   // API global para abrir por "slug" (sin tocar URL)
   function openBySlug(slug) {
      if (!slug) return false;
      const idx = indexBySlug.get(slug);
      if (typeof idx !== 'number') return false;

      const fb = getFB();
      if (fb?.jumpTo) {
         fb.jumpTo(idx);
      } else {
         // construir items desde triggers
         const items = triggers.map((el) => ({
            src: el.getAttribute('data-src') || el.getAttribute('href') || '',
            type: el.getAttribute('data-type') || undefined,
            caption: el.getAttribute('data-caption') || '',
            thumb: el.getAttribute('data-thumb') || '',
         }));
         window.Fancybox.show(items, { ...common, startIndex: idx });
      }

      // Por si algo escribió hash, lo limpiamos
      clearUrlHash();
      return true;
   }

   // Exponer API global
   window.Gallery = Object.freeze({
      openBySlug,
      openByIndex: (i) => {
         const el = triggers[i];
         if (!el) return false;
         const slug = slugFrom(el) || null;
         if (slug) return openBySlug(slug);
         // Si no hay slug, abrimos por índice
         const items = triggers.map((el) => ({
            src: el.getAttribute('data-src') || el.getAttribute('href') || '',
            type: el.getAttribute('data-type') || undefined,
            caption: el.getAttribute('data-caption') || '',
            thumb: el.getAttribute('data-thumb') || '',
         }));
         window.Fancybox.show(items, { ...common, startIndex: i });
         clearUrlHash();
         return true;
      },
   });
});
