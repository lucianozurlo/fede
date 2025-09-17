// assets/js/main.js (v3.4) — binds excluyentes + delegación de cierre en el padre
window.addEventListener('DOMContentLoaded', () => {
   if (!window.Fancybox) return;

   const html = document.documentElement;
   const counters = { gallery: 0, standalone: 0 };

   const common = {
      animated: true,
      dragToClose: true,
      showClass: 'f-fadeIn',
      hideClass: 'f-fadeOut',
      Carousel: { infinite: false },
      Toolbar: { display: ['counter', 'close'] },
      compact: false,
   };

   const add = (type) => {
      counters[type] = (counters[type] || 0) + 1;
      html.classList.add(type === 'gallery' ? 'with-fancybox-gallery' : 'with-fancybox-standalone');
   };
   const remove = (type) => {
      counters[type] = Math.max(0, (counters[type] || 0) - 1);
      const cls = type === 'gallery' ? 'with-fancybox-gallery' : 'with-fancybox-standalone';
      if (counters[type] === 0) html.classList.remove(cls);
   };

   // 1) SOLO galería (exactamente data-fancybox="galeria")
   Fancybox.bind('[data-fancybox="galeria"]', {
      ...common,
      on: {
         ready: () => add('gallery'),
         destroy: () => remove('gallery'),
      },
   });

   // 2) TODO lo que NO sea la galería (cualquier otro data-fancybox)
   Fancybox.bind('[data-fancybox]:not([data-fancybox="galeria"])', {
      ...common,
      on: {
         ready: () => add('standalone'),
         destroy: () => remove('standalone'),
      },
   });

   // Delegación global en el PADRE: cerrar cualquier instancia si clickean <a|button data-fancybox-close>
   // Delegación global en el PADRE: cerrar y luego actuar sobre el href (hash scroll o navegación)
   document.addEventListener('click', (e) => {
      const el = e.target.closest('a[data-fancybox-close], button[data-fancybox-close]');
      if (!el) return;

      const href = (el.getAttribute('href') || '').trim();
      const isHash = href.startsWith('#') && href.length > 1;
      const offset = Number(el.dataset.offset || 0) || 0;

      // Acción a ejecutar DESPUÉS del cierre
      const afterClose = () => {
         if (isHash) {
            const id = href.slice(1);
            const target = document.getElementById(id);
            if (target) {
               const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
               window.scrollTo({ top: y, behavior: 'smooth' });
            } else {
               // fallback: actualizar hash si no existe el elemento (no rompe)
               location.hash = href;
            }
         } else if (href && href !== '#') {
            // Navegación normal a otra URL
            location.href = href;
         }
      };

      const fb = window.Fancybox?.getInstance?.();

      if (fb) {
         e.preventDefault();

         // Intentá engancharte a la destrucción de la instancia para ejecutar la acción luego
         let ran = false;
         const runOnce = () => {
            if (ran) return;
            ran = true;
            afterClose();
         };
         try {
            fb.on?.('destroy', runOnce);
         } catch (_) {
            // fallback por si la API cambia
            setTimeout(runOnce, 0);
         }
         fb.close();
      } else {
         // No hay Fancybox abierto: si es hash, manejamos nosotros para aplicar offset; si no, dejamos navegar
         if (isHash) {
            e.preventDefault();
            afterClose();
         }
         // si NO es hash, no prevenimos y el navegador navega normalmente
      }
   });
});
