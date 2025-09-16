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
   document.addEventListener('click', (e) => {
      const el = e.target.closest('a[data-fancybox-close], button[data-fancybox-close]');
      if (!el) return;
      e.preventDefault();
      try {
         const fb = window.Fancybox?.getInstance?.();
         if (fb) fb.close();
      } catch (err) {
         /* no-op */
      }
   });
});
