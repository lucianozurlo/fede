// assets/js/main.js (v4.1) — scroll siempre + cierre de Fancybox sin romper el anchor
window.addEventListener('DOMContentLoaded', () => {
   // ====== Fancybox (dos grupos con clases distintas) ======
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

   if (window.Fancybox) {
      Fancybox.bind('[data-fancybox="galeria"]', {
         ...common,
         on: { ready: () => add('gallery'), destroy: () => remove('gallery') },
      });
      Fancybox.bind('[data-fancybox]:not([data-fancybox="galeria"])', {
         ...common,
         on: { ready: () => add('standalone'), destroy: () => remove('standalone') },
      });
   }

   function add(type) {
      counters[type] = (counters[type] || 0) + 1;
      html.classList.add(type === 'gallery' ? 'with-fancybox-gallery' : 'with-fancybox-standalone');
   }
   function remove(type) {
      counters[type] = Math.max(0, (counters[type] || 0) - 1);
      const cls = type === 'gallery' ? 'with-fancybox-gallery' : 'with-fancybox-standalone';
      if (counters[type] === 0) html.classList.remove(cls);
   }

   // ====== Utils de scroll/navegación ======
   const getFB = () => window.Fancybox?.getInstance?.() || null;

   function isSamePageHash(href) {
      if (!href) return false;
      if (href.startsWith('#')) return href.length > 1;
      try {
         const u = new URL(href, location.href);
         return (
            u.origin === location.origin && u.pathname === location.pathname && u.hash.length > 1
         );
      } catch {
         return false;
      }
   }

   function extractHash(href) {
      if (!href) return '';
      if (href.startsWith('#')) return href;
      try {
         return new URL(href, location.href).hash || '';
      } catch {
         return '';
      }
   }

   function scrollToHash(hash, offset) {
      const raw = (hash || '').trim();
      if (!raw || raw === '#') return;

      const id = raw.slice(1);
      // ID primero (robusto); fallback a [name=]
      let target = document.getElementById(id);
      if (!target) {
         try {
            const esc = window.CSS && CSS.escape ? CSS.escape(id) : id;
            target = document.querySelector(`[name="${esc}"]`);
         } catch {}
      }
      if (!target) {
         // Al menos reflejar el hash
         try {
            history.pushState(null, '', raw);
         } catch {
            location.hash = raw;
         }
         return;
      }

      const y = target.getBoundingClientRect().top + window.pageYOffset - (Number(offset) || 0);
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      // Reflejar hash sin “salto”
      try {
         history.pushState(null, '', '#' + id);
      } catch {
         location.hash = '#' + id;
      }
   }

   // Reintenta la acción tras quitar overlay/clase de Fancybox (si estaba abierto)
   function afterFancyboxClosed(cb) {
      const fb = getFB();
      if (!fb) return requestAnimationFrame(cb);

      let done = false;
      const finish = () => {
         if (done) return;
         done = true;
         requestAnimationFrame(cb);
      };

      // Detectar cuando <html> pierde 'with-fancybox'
      let obs;
      try {
         obs = new MutationObserver(() => {
            if (!document.documentElement.classList.contains('with-fancybox')) {
               obs.disconnect();
               finish();
            }
         });
         obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      } catch {}
      try {
         fb.on?.('destroy', finish);
      } catch {}
      setTimeout(finish, 900); // fallback
      fb.close();
   }

   // ====== Handler para [data-close-fancybox] ======
   // Importante: NO usamos data-fancybox-close (lo deja Fancybox y rompe el anchor).
   document.addEventListener(
      'click',
      (e) => {
         const a = e.target.closest('a[data-close-fancybox], button[data-close-fancybox]');
         if (!a) return;

         // Nunca llamar preventDefault sobre un <a> con hash; dejamos que el navegador haga lo suyo
         // y nosotros sólo ajustamos (offset) y cerramos Fancybox aparte.
         const href = (a.getAttribute('href') || '').trim();
         const offset = a.dataset.scrollOffset || a.dataset.offset || 0;
         const hasHref = !!href && href !== '#';
         const fb = getFB();

         // Si es HASH de esta página: dejamos que el navegador scrollee (NO prevenimos)
         if (hasHref && isSamePageHash(href)) {
            // Ajuste de offset en el frame siguiente (después del scroll nativo)
            const hash = extractHash(href);
            requestAnimationFrame(() => scrollToHash(hash, offset));

            // Si hay Fancybox abierto, lo cerramos SIN bloquear el click,
            // y re-ajustamos el offset cuando el overlay desaparezca.
            if (fb) afterFancyboxClosed(() => scrollToHash(hash, offset));

            // No return; dejamos pasar el evento para que el anchor haga su trabajo
            return;
         }

         // Si es otra URL (con o sin hash): dejamos navegar, pero si hay Fancybox lo cerramos “después”
         if (hasHref) {
            if (fb)
               setTimeout(() => {
                  try {
                     fb.close();
                  } catch {}
               }, 0);
            return; // navegación nativa
         }

         // Si es botón sin href: cerramos si hay Fancybox
         if (fb) {
            e.preventDefault(); // no hay navegación que preservar
            fb.close();
         }
      },
      { capture: true }
   ); // captura: nos adelantamos, pero SIN prevenir el default del anchor
});
