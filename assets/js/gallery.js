// assets/js/main.js (v4.5.1) — Fancybox v5: deep-link por caption + FAB + submodal inline + ESC priority + backtick-safe
window.addEventListener('DOMContentLoaded', () => {
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

   // ===== Helpers slug/id por caption =====
   const usedSlugs = new Set();
   const slugify = (str) =>
      (str || '')
         .toString()
         .normalize('NFD')
         .replace(/[\u0300-\u036f]/g, '')
         .toLowerCase()
         .replace(/[^a-z0-9]+/g, '-')
         .replace(/^-+|-+$/g, '')
         .slice(0, 120) || 'item';

   const ensureUnique = (base) => {
      let s = base;
      let i = 2;
      while (usedSlugs.has(s)) s = base + '-' + i++;
      usedSlugs.add(s);
      return s;
   };

   const slugToIndex = new Map();
   const indexToSlug = new Map();

   // ===== Thumbs + IDs automáticos + slugs =====
   const triggers = Array.from(
      document.querySelectorAll('.gallery .card[data-fancybox="galeria"]')
   );
   triggers.forEach((card, i) => {
      if (!card.hasAttribute('data-thumb')) {
         const img = card.querySelector('.media .img-base');
         if (img && img.src) card.setAttribute('data-thumb', img.src);
      }
      const caption =
         card.getAttribute('data-caption') ||
         card.getAttribute('data-title') ||
         card.title ||
         'proyecto-' + (i + 1);
      const slug = ensureUnique(slugify(caption));
      card.dataset.slug = slug;
      if (!card.id) card.id = slug;
      slugToIndex.set(slug, i);
      indexToSlug.set(i, slug);
   });

   const getSlugFromHash = () => (location.hash.startsWith('#') ? location.hash.slice(1) : '');
   const safeReplaceHash = (hash) => {
      try {
         const url = new URL(location.href);
         url.hash = hash || '';
         history.replaceState(null, '', url.toString());
      } catch {
         if (hash) location.hash = hash; // fallback
      }
   };

   // ===== Bind Fancybox =====
   if (window.Fancybox) {
      // Galería principal
      Fancybox.bind('[data-fancybox="galeria"]', {
         ...common,
         iframeAttr: {
            sandbox: 'allow-forms allow-scripts allow-same-origin allow-popups allow-modals',
         },
         on: {
            ready: (fb) => {
               add('gallery');
               injectFab(fb);
               const slug = indexToSlug.get(fb.page);
               if (slug) safeReplaceHash('#' + slug);
            },
            destroy: () => {
               remove('gallery');
               // safeReplaceHash(''); // opcional: limpiar hash al cerrar
            },
            'Carousel.change': (fb, carousel, to) => {
               const s = indexToSlug.get(to);
               if (s) safeReplaceHash('#' + s);
            },
            init: (fb) => injectFab(fb),
         },
      });

      // Cualquier otro uso
      Fancybox.bind('[data-fancybox]:not([data-fancybox="galeria"])', {
         ...common,
         on: {
            ready: () => add('standalone'),
            destroy: () => remove('standalone'),
         },
      });
   }

   // ===== Abrir galería en un slug específico =====
   const openGalleryAtSlug = (slug) => {
      if (!slugToIndex.has(slug)) return false;
      const startIndex = slugToIndex.get(slug);

      const items = triggers.map((el) => ({
         src: el.getAttribute('href') || el.getAttribute('data-src') || '',
         type: el.getAttribute('data-type') || undefined,
         caption: el.getAttribute('data-caption') || el.getAttribute('data-title') || '',
         thumb:
            el.getAttribute('data-thumb') ||
            (el.querySelector &&
               el.querySelector('.img-base') &&
               el.querySelector('.img-base').src) ||
            '',
         $trigger: el,
      }));

      Fancybox.show(items, {
         ...common,
         startIndex,
         iframeAttr: {
            sandbox: 'allow-forms allow-scripts allow-same-origin allow-popups allow-modals',
         },
         on: {
            ready: (fb) => {
               add('gallery');
               injectFab(fb);
               const s = indexToSlug.get(fb.page) || slug;
               if (s) safeReplaceHash('#' + s);
            },
            destroy: () => remove('gallery'),
            'Carousel.change': (fb, carousel, to) => {
               const s = indexToSlug.get(to);
               if (s) safeReplaceHash('#' + s);
            },
         },
      });
      return true;
   };

   // ===== FAB dentro del modal principal =====
   function injectFab(fb) {
      const mount = fb && fb.$container ? fb.$container : null;
      if (!mount)
         return requestAnimationFrame(function () {
            injectFab(fb);
         });
      if (mount.querySelector('.fbx-menu-fab')) return;

      const btn = document.createElement('button');
      btn.className = 'fbx-menu-fab';
      btn.type = 'button';
      btn.textContent = 'Ver proyectos';
      btn.addEventListener('click', function () {
         openSlideMenu(fb);
      });
      mount.appendChild(btn);
   }

   // ===== Helpers de clases globales =====
   function add(type) {
      counters[type] = (counters[type] || 0) + 1;
      html.classList.add(type === 'gallery' ? 'with-fancybox-gallery' : 'with-fancybox-standalone');
   }
   function remove(type) {
      counters[type] = Math.max(0, (counters[type] || 0) - 1);
      const cls = type === 'gallery' ? 'with-fancybox-gallery' : 'with-fancybox-standalone';
      if (counters[type] === 0) html.classList.remove(cls);
   }

   // ===== Utils de scroll / navegación (base) =====
   const getFB = () =>
      (window.Fancybox && window.Fancybox.getInstance && window.Fancybox.getInstance()) || null;

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
      let target = document.getElementById(id);
      if (!target) {
         try {
            const esc = window.CSS && CSS.escape ? CSS.escape(id) : id;
            target = document.querySelector('[name="' + esc + '"]');
         } catch {}
      }
      if (!target) {
         try {
            history.pushState(null, '', raw);
         } catch {
            location.hash = raw;
         }
         return;
      }
      const y = target.getBoundingClientRect().top + window.pageYOffset - (Number(offset) || 0);
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      try {
         history.pushState(null, '', '#' + id);
      } catch {
         location.hash = '#' + id;
      }
   }

   function afterFancyboxClosed(cb) {
      const fb = getFB();
      if (!fb) return requestAnimationFrame(cb);
      let done = false;
      const finish = () => {
         if (done) return;
         done = true;
         // Limpieza defensiva del flag de submodal
         document.documentElement.classList.remove('with-fancybox-sub');
         requestAnimationFrame(cb);
      };

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
         fb.on && fb.on('destroy', finish);
      } catch {}
      setTimeout(finish, 900);
      try {
         fb.close();
      } catch {}
   }

   // ===== Click delegado: cierres y scroll seguro =====
   document.addEventListener(
      'click',
      (e) => {
         const closer = e.target.closest('a[data-close-fancybox], button[data-close-fancybox]');
         if (!closer) return;

         const container = closer.closest('.fancybox__container');
         const isSub = container && container.classList.contains('is-submodal');

         if (isSub) {
            // Cerrar SOLO el submodal y limpiar la clase
            e.preventDefault();
            try {
               const fb = getFB();
               if (fb) fb.close();
            } finally {
               document.documentElement.classList.remove('with-fancybox-sub');
            }
            return; // No continuar con el flujo de hash/scroll
         }

         // Cierre general (galería u otros)
         const href = (closer.getAttribute('href') || '').trim();
         const offset = closer.dataset.scrollOffset || closer.dataset.offset || 0;
         const hasHref = !!href && href !== '#';
         const fb = getFB();

         if (hasHref && isSamePageHash(href)) {
            const hash = extractHash(href);
            requestAnimationFrame(() => scrollToHash(hash, offset));
            if (fb) afterFancyboxClosed(() => scrollToHash(hash, offset));
            return;
         }
         if (hasHref) {
            if (fb)
               setTimeout(() => {
                  try {
                     fb.close();
                  } catch {}
               }, 0);
            return;
         }
         if (fb) {
            e.preventDefault();
            fb.close();
         }
      },
      { capture: true }
   );

   // ===== ESC priority: cerrar submodal antes que la galería =====
   document.addEventListener(
      'keydown',
      (e) => {
         const key = e.key || e.code;
         if (key !== 'Escape' && key !== 'Esc') return;

         const fb = getFB();
         if (!fb) return;

         // Si la instancia top es un submodal, priorizar ese cierre
         const isSubTop = !!(
            fb.$container &&
            fb.$container.classList &&
            fb.$container.classList.contains('is-submodal')
         );
         if (isSubTop) {
            e.preventDefault();
            e.stopPropagation();
            try {
               fb.close();
            } finally {
               document.documentElement.classList.remove('with-fancybox-sub');
            }
         }
         // Si no es submodal, Fancybox maneja el Escape normalmente
      },
      { capture: true }
   );

   // ===== Modal hijo con menú de saltos =====
   function openSlideMenu(parentFb) {
      const fbParent = parentFb || getFB();
      let items = fbParent && fbParent.items;
      if (!items || !items.length) {
         const t = triggers;
         items = t.map((el) => ({
            src: el.getAttribute('href') || el.getAttribute('data-src') || '',
            type: el.getAttribute('data-type') || undefined,
            caption: el.getAttribute('data-caption') || el.getAttribute('data-title') || '',
            thumb:
               el.getAttribute('data-thumb') ||
               (el.querySelector &&
                  el.querySelector('.img-base') &&
                  el.querySelector('.img-base').src) ||
               '',
            $trigger: el,
         }));
      }

      // Construcción segura del HTML (sin backticks anidados)
      const htmlItems = items
         .map((it, i) => {
            const t =
               it.thumb ||
               (it.$trigger &&
                  it.$trigger.getAttribute &&
                  it.$trigger.getAttribute('data-thumb')) ||
               (it.$trigger &&
                  it.$trigger.querySelector &&
                  it.$trigger.querySelector('.img-base') &&
                  it.$trigger.querySelector('.img-base').src) ||
               '';
            const label = (
               it.caption ||
               it.title ||
               'Proyecto ' + String(i + 1).padStart(2, '0')
            ).toString();

            return (
               '<button class="fbx-menu-item" data-index="' +
               i +
               '" type="button">' +
               '<img class="fbx-menu-thumb" src="' +
               t +
               '" alt="">' +
               '<div class="fbx-menu-label">' +
               label +
               '</div>' +
               '</button>'
            );
         })
         .join('');

      const htmlMenu =
         '<div class="fbx-menu">' +
         '<h3>Ir al proyecto</h3>' +
         '<div class="fbx-menu-grid">' +
         htmlItems +
         '</div>' +
         '</div>';

      Fancybox.show([{ src: htmlMenu, type: 'html' }], {
         closeExisting: false,
         dragToClose: true,
         animated: true,
         closeButton: 'top',
         on: {
            done: (fbChild) => {
               fbChild.$container.querySelectorAll('.fbx-menu-item').forEach((btn) => {
                  btn.addEventListener('click', () => {
                     const idx = Number(btn.dataset.index);
                     fbChild.close();
                     if (fbParent && fbParent.jumpTo) {
                        fbParent.jumpTo(idx);
                     } else {
                        const sel = triggers.map((el) => ({
                           src: el.getAttribute('href') || el.getAttribute('data-src') || '',
                           type: el.getAttribute('data-type') || undefined,
                           caption: el.getAttribute('data-caption') || '',
                        }));
                        Fancybox.show(sel, { ...common, startIndex: idx });
                     }
                  });
               });
            },
         },
      });
   }

   // ===== API Sub-modal (inline) — sin default params
   function openSubModal(src, opts) {
      if (!window.Fancybox) {
         console.warn('[SUBMODAL] Fancybox no está disponible');
         return;
      }
      src = src || '#submodal-template';
      opts = opts || {};

      const el = document.querySelector(src);
      if (!el) {
         console.error('[SUBMODAL] No existe el selector:', src);
         return;
      }

      Fancybox.show([{ src: src, type: 'inline' }], {
         closeExisting: false,
         animated: true,
         dragToClose: true,
         showClass: 'f-fadeIn',
         hideClass: 'f-fadeOut',
         hideScrollbar: false,
         compact: false,
         ...opts,
         on: {
            init: (fb) => {
               document.documentElement.classList.add('with-fancybox-sub');
               try {
                  fb.$container.classList.add('is-submodal');
               } catch {}
            },
            destroy: () => {
               document.documentElement.classList.remove('with-fancybox-sub');
            },
         },
      });
   }
   if (typeof window !== 'undefined') {
      window.openSubModal = openSubModal;
   }

   // Apertura por data-attr (cuando el slide no es iframe)
   document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-open-submodal]');
      if (!btn) return;
      e.preventDefault();
      const src = btn.getAttribute('data-open-submodal') || '#submodal-template';
      openSubModal(src);
   });

   // Mensajes desde iframes (slides tipo iframe)
   window.addEventListener('message', (ev) => {
      const data = ev.data || {};
      if (data && data.fancybox === 'open-submodal') {
         openSubModal(data.src || '#submodal-template', data.opts || {});
      }
   });

   // ===== Deep link al cargar / cambio de hash =====
   const initialSlug = getSlugFromHash();
   if (initialSlug && slugToIndex.has(initialSlug)) {
      openGalleryAtSlug(initialSlug);
   }
   window.addEventListener('hashchange', () => {
      const s = getSlugFromHash();
      if (!s) return;
      const fb = getFB();
      if (slugToIndex.has(s)) {
         const idx = slugToIndex.get(s);
         if (fb && fb.jumpTo) fb.jumpTo(idx);
         else openGalleryAtSlug(s);
      }
   });
});
