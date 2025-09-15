(function () {
   const stage = document.getElementById('stage');
   const hitLeft = stage.querySelector('.hit.left');
   const hitRight = stage.querySelector('.hit.right');

   // Geometría/estilo
   const CARD_W = 540; // ancho del activo
   const SIDE_SCALE = 0.82; // escala base de laterales (más chico)
   const SIDE_BLUR = 4; // blur mayor en laterales
   const HOVER_SCALE = 0.88; // hover leve, PERO < 1 (nunca igual al activo)
   const HOVER_BLUR = SIDE_BLUR; /* mantener blur en hover (no cambia) */

   function els() {
      return {
         prev: stage.querySelector('.verbatim.prev'),
         active: stage.querySelector('.verbatim.active'),
         next: stage.querySelector('.verbatim.next'),
      };
   }

   // Posiciona: prev pegado a borde izq, next pegado a borde der
   function applyLayout() {
      const { prev, active, next } = els();
      const stageW = stage.clientWidth; // 1320px (o menos si viewport chico)
      const halfStage = stageW / 2;

      // ACTIVO (centro y arriba)
      if (active) {
         active.style.transform = `translate(-50%, -50%) translateX(0px) scale(1)`;
         active.style.filter = 'blur(0px)';
         active.style.boxShadow = '0 0 39.7px rgba(0,0,0,0.1)';
         active.style.opacity = '1';
         active.style.zIndex = '3'; // siempre por encima
         active.style.cursor = 'default';
      }

      // Helper para laterales (debajo, más chicos, blur alto)
      function placeSide(el, isLeft) {
         if (!el) return;
         const hovering = el.classList.contains('hovering');
         const scale = hovering ? HOVER_SCALE : SIDE_SCALE; // nunca llega a 1
         const sideW = CARD_W * scale;

         // Queremos que el borde toque exactamente 0px (izq) o stageW (der)
         const shift = Math.max(0, halfStage - sideW / 2);
         const x = isLeft ? -shift : +shift;

         el.style.transform = `translate(-50%, -50%) translateX(${x}px) scale(${scale})`;
         el.style.filter = `blur(${HOVER_BLUR}px)`; // blur constante también en hover
         el.style.boxShadow = '0 0 16px rgba(0,0,0,.06)';
         el.style.opacity = '0.95';
         el.style.zIndex = '1'; // SIEMPRE debajo del activo
         el.style.cursor = 'pointer';

         // Hotzones del tamaño exacto del lateral visible
         if (isLeft && hitLeft) hitLeft.style.width = sideW + 'px';
         if (!isLeft && hitRight) hitRight.style.width = sideW + 'px';
      }

      placeSide(prev, true);
      placeSide(next, false);
   }

   function bindSideInteractions() {
      // Limpio handlers viejos
      stage.querySelectorAll('.verbatim').forEach((v) => {
         v.onclick = null;
         v.onmouseenter = null;
         v.onmouseleave = null;
      });

      const { prev, next } = els();

      // Click directo
      if (prev) prev.onclick = goPrev;
      if (next) next.onclick = goNext;

      // Hover: sube apenas la escala, mantiene blur, SIEMPRE debajo del activo
      if (prev) {
         prev.onmouseenter = () => {
            prev.classList.add('hovering');
            applyLayout();
         };
         prev.onmouseleave = () => {
            prev.classList.remove('hovering');
            applyLayout();
         };
      }
      if (next) {
         next.onmouseenter = () => {
            next.classList.add('hovering');
            applyLayout();
         };
         next.onmouseleave = () => {
            next.classList.remove('hovering');
            applyLayout();
         };
      }

      // Hotzones: click + hover espejo (para feedback)
      hitLeft.onclick = goPrev;
      hitRight.onclick = goNext;

      hitLeft.onmouseenter = () => {
         const { prev } = els();
         prev?.classList.add('hovering');
         applyLayout();
      };
      hitLeft.onmouseleave = () => {
         const { prev } = els();
         prev?.classList.remove('hovering');
         applyLayout();
      };
      hitRight.onmouseenter = () => {
         const { next } = els();
         next?.classList.add('hovering');
         applyLayout();
      };
      hitRight.onmouseleave = () => {
         const { next } = els();
         next?.classList.remove('hovering');
         applyLayout();
      };
   }

   function goNext() {
      const { prev, active, next } = els();
      next.classList.replace('next', 'active');
      active.classList.replace('active', 'prev');
      prev.classList.replace('prev', 'next');
      applyLayout();
      bindSideInteractions();
   }

   function goPrev() {
      const { prev, active, next } = els();
      prev.classList.replace('prev', 'active');
      active.classList.replace('active', 'next');
      next.classList.replace('next', 'prev');
      applyLayout();
      bindSideInteractions();
   }

   // Swipe básico (opcional)
   let startX = null;
   stage.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
   });
   stage.addEventListener('pointerup', (e) => {
      if (startX == null) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 30) dx < 0 ? goNext() : goPrev();
      startX = null;
   });

   // Inicializa
   applyLayout();
   bindSideInteractions();
   window.addEventListener('resize', applyLayout, { passive: true });
})();
