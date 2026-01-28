(function () {
  const stage = document.getElementById("stage");
  const hitLeft = stage.querySelector(".hit.left");
  const hitRight = stage.querySelector(".hit.right");

  // === Mobile media query ===
  const mobileMQ = window.matchMedia("(max-width: 960px)");
  let isMobile = mobileMQ.matches;

  // Parámetros visuales (desktop)
  const CARD_W = 540;
  const SIDE_SCALE = 0.82;
  const SIDE_BLUR = 4;
  const HOVER_SCALE = 0.88;
  const HOVER_BLUR = SIDE_BLUR;
  const HOVER_LIFT_Y = -8;
  const HIDDEN_MARGIN = 12;

  // Estado
  let items = [];
  let activeIndex = 0;
  let lastDirection = "next";

  function syncItems() {
    items = Array.from(stage.querySelectorAll(".verbatim"));
    const domActive = items.findIndex((el) => el.classList.contains("active"));
    if (domActive !== -1) activeIndex = domActive;
  }

  const mod = (n, m) => ((n % m) + m) % m;

  function rolesFor(aIdx) {
    const N = items.length;
    return {
      prev: mod(aIdx - 1, N),
      active: aIdx,
      next: mod(aIdx + 1, N),
    };
  }

  function clearRoles() {
    items.forEach((el) =>
      el.classList.remove("prev", "active", "next", "hidden", "hovering"),
    );
  }

  function setRoles(aIdx) {
    const { prev, active, next } = rolesFor(aIdx);
    clearRoles();
    items.forEach((el, i) => {
      if (i === active) el.classList.add("active");
      else if (i === prev) el.classList.add("prev");
      else if (i === next) el.classList.add("next");
      else el.classList.add("hidden");
    });
  }

  // =========================
  // LAYOUT
  // =========================
  function applyLayout() {
    const N = items.length;
    if (!N) return;

    stage.classList.toggle("is-mobile", isMobile);

    if (isMobile) {
      applyLayoutMobile(0);
    } else {
      // si venís de mobile, limpiá height inline para que vuelva el CSS (237px)
      stage.style.height = "";
      applyLayoutDesktop();
    }
  }

  function applyLayoutDesktop() {
    const N = items.length;
    if (!N) return;

    const stageW = stage.clientWidth;
    const halfStage = stageW / 2;

    function placeSide(el, isLeft) {
      const hovering = el.classList.contains("hovering");
      const scale = hovering ? HOVER_SCALE : SIDE_SCALE;
      const ty = hovering ? HOVER_LIFT_Y : 0;
      const sideW = CARD_W * scale;
      const shift = Math.max(0, halfStage - sideW / 2);
      const x = isLeft ? -shift : +shift;

      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${ty}px) scale(${scale})`;
      el.style.filter = `blur(${HOVER_BLUR}px)`;
      el.style.boxShadow = "0 0 16px rgba(0,0,0,.06)";
      el.style.opacity = "0.95";
      el.style.zIndex = "1";
      el.style.cursor = "pointer";

      if (isLeft) hitLeft.style.width = sideW + "px";
      else hitRight.style.width = sideW + "px";
    }

    items.forEach((el, i) => {
      if (el.classList.contains("active")) {
        el.style.transform =
          "translate(-50%, -50%) translate(0px, 0px) scale(1)";
        el.style.filter = "blur(0px)";
        el.style.boxShadow = "0 0 39.7px rgba(0,0,0,0.1)";
        el.style.opacity = "1";
        el.style.zIndex = "3";
        el.style.cursor = "default";
        el.style.pointerEvents = "auto";
        el.removeAttribute("data-hidden-side");
      } else if (el.classList.contains("prev")) {
        placeSide(el, true);
        el.style.pointerEvents = "auto";
        el.removeAttribute("data-hidden-side");
      } else if (el.classList.contains("next")) {
        placeSide(el, false);
        el.style.pointerEvents = "auto";
        el.removeAttribute("data-hidden-side");
      } else {
        let side = el.getAttribute("data-hidden-side");
        if (!side) {
          const forward = (i - activeIndex + N) % N;
          const backward = (activeIndex - i + N) % N;
          side = forward <= backward ? "right" : "left";
        }
        const scale = SIDE_SCALE;
        const sideW = CARD_W * scale;
        const x =
          side === "left"
            ? -(halfStage + sideW / 2 + HIDDEN_MARGIN)
            : halfStage + sideW / 2 + HIDDEN_MARGIN;

        el.style.transform = `translate(-50%, -50%) translate(${x}px, 0px) scale(${scale})`;
        el.style.filter = `blur(${SIDE_BLUR + 1}px)`;
        el.style.boxShadow = "none";
        el.style.opacity = "0";
        el.style.zIndex = "0";
        el.style.pointerEvents = "none";
      }
    });
  }

  // Mobile: 1 card centrada. Prev/Next quedan offscreen (sin previews).
  // dragDx desplaza el “track” para arrastrar suave.
  function applyLayoutMobile(dragDx) {
    const N = items.length;
    if (!N) return;

    const stageW = stage.clientWidth;
    const step = stageW; // distancia de slide a slide

    const { prev, active, next } = rolesFor(activeIndex);

    // Ajustar altura del stage al alto del activo (para evitar “corte”)
    const activeEl = items[active];
    if (activeEl) {
      // esperar layout real
      requestAnimationFrame(() => {
        stage.style.height = activeEl.offsetHeight + "px";
      });
    }

    items.forEach((el, i) => {
      let x = 0;
      let visible = true;
      let z = 1;

      if (i === active) {
        x = dragDx;
        z = 3;
      } else if (i === prev) {
        x = dragDx - step;
        z = 2;
      } else if (i === next) {
        x = dragDx + step;
        z = 2;
      } else {
        // bien lejos y apagado
        x = dragDx + step * 2;
        visible = false;
        z = 0;
      }

      el.style.transform = `translate(-50%, -50%) translate(${x}px, 0px) scale(1)`;
      el.style.filter = "blur(0px)";
      el.style.opacity = visible ? "1" : "0";
      el.style.zIndex = String(z);

      // En mobile: solo el activo es interactivo (evita taps raros al arrastrar)
      el.style.pointerEvents = i === active ? "auto" : "none";

      // sombra
      el.style.boxShadow =
        i === active
          ? "0 0 39.7px rgba(0,0,0,0.1)"
          : "0 0 16px rgba(0,0,0,.06)";
    });
  }

  // =========================
  // PREPARE (desktop)
  // =========================
  function prepareIncoming(direction) {
    const N = items.length;
    if (N < 2) return;

    const { prev, next } = rolesFor(activeIndex);

    if (direction === "next") {
      const incoming = mod(activeIndex + 2, N);
      items[incoming]?.setAttribute("data-hidden-side", "right");
      items[prev]?.setAttribute("data-hidden-side", "left");
    } else {
      const incoming = mod(activeIndex - 2, N);
      items[incoming]?.setAttribute("data-hidden-side", "left");
      items[next]?.setAttribute("data-hidden-side", "right");
    }

    lastDirection = direction;

    applyLayoutDesktop();
    void stage.offsetWidth;
  }

  // =========================
  // INTERACTIONS
  // =========================
  function bindSideInteractions() {
    // En mobile no usamos hover/click laterales ni hotzones
    if (isMobile) return;

    items.forEach((v) => {
      v.onclick = null;
      v.onmouseenter = null;
      v.onmouseleave = null;
    });

    const prevEl = items.find((el) => el.classList.contains("prev"));
    const nextEl = items.find((el) => el.classList.contains("next"));

    if (prevEl) {
      prevEl.onclick = goPrev;
      prevEl.onmouseenter = () => {
        prevEl.classList.add("hovering");
        applyLayout();
      };
      prevEl.onmouseleave = () => {
        prevEl.classList.remove("hovering");
        applyLayout();
      };
    }

    if (nextEl) {
      nextEl.onclick = goNext;
      nextEl.onmouseenter = () => {
        nextEl.classList.add("hovering");
        applyLayout();
      };
      nextEl.onmouseleave = () => {
        nextEl.classList.remove("hovering");
        applyLayout();
      };
    }

    hitLeft.onclick = goPrev;
    hitRight.onclick = goNext;

    hitLeft.onmouseenter = () => {
      prevEl?.classList.add("hovering");
      applyLayout();
    };
    hitLeft.onmouseleave = () => {
      prevEl?.classList.remove("hovering");
      applyLayout();
    };
    hitRight.onmouseenter = () => {
      nextEl?.classList.add("hovering");
      applyLayout();
    };
    hitRight.onmouseleave = () => {
      nextEl?.classList.remove("hovering");
      applyLayout();
    };
  }

  function goNext() {
    syncItems();
    if (items.length < 2) return;

    if (!isMobile) prepareIncoming("next");

    activeIndex = mod(activeIndex + 1, items.length);
    setRoles(activeIndex);

    applyLayout();
    bindSideInteractions();
  }

  function goPrev() {
    syncItems();
    if (items.length < 2) return;

    if (!isMobile) prepareIncoming("prev");

    activeIndex = mod(activeIndex - 1, items.length);
    setRoles(activeIndex);

    applyLayout();
    bindSideInteractions();
  }

  // =========================
  // DRAG / SWIPE (mobile) con resistencia
  // =========================
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let dragDx = 0;
  let dragging = false;

  function clampWithRubberBand(dx, limit) {
    // Dentro del límite: lineal
    if (Math.abs(dx) <= limit) return dx;

    // Fuera del límite: "rubber band" (cada vez cuesta más)
    const sign = dx < 0 ? -1 : 1;
    const over = Math.abs(dx) - limit;

    // factor ajustable: más alto => más "duro"
    const k = 0.55;

    // compresión suave del excedente
    const rubber = limit + (over * k) / (1 + (over * k) / 160);

    return sign * rubber;
  }

  function endDrag() {
    if (!isMobile) return;

    stage.classList.remove("dragging");

    const w = stage.clientWidth;
    const threshold = Math.min(140, w * 0.22); // un poquito más firme
    const dx = dragDx;

    pointerId = null;
    dragging = false;
    dragDx = 0;

    if (Math.abs(dx) > threshold) {
      dx < 0 ? goNext() : goPrev();
    } else {
      // snap back
      applyLayout();
    }
  }

  stage.addEventListener(
    "pointerdown",
    (e) => {
      if (!isMobile) return;

      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      dragDx = 0;
      dragging = false;

      stage.setPointerCapture(pointerId);
      stage.classList.add("dragging");
    },
    { passive: true },
  );

  stage.addEventListener(
    "pointermove",
    (e) => {
      if (!isMobile || pointerId == null || e.pointerId !== pointerId) return;

      const dxRaw = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!dragging) {
        // lock horizontal
        if (Math.abs(dxRaw) > 8 && Math.abs(dxRaw) > Math.abs(dy)) {
          dragging = true;
        } else if (Math.abs(dy) > 14) {
          // era scroll vertical -> cancelar drag
          stage.classList.remove("dragging");
          try {
            stage.releasePointerCapture(pointerId);
          } catch {}
          pointerId = null;
          return;
        }
      }

      if (dragging) {
        // límite base: ~0.9 de ancho (se siente natural)
        const limit = stage.clientWidth * 0.9;
        dragDx = clampWithRubberBand(dxRaw, limit);

        applyLayoutMobile(dragDx);
        e.preventDefault();
      }
    },
    { passive: false },
  );

  stage.addEventListener(
    "pointerup",
    (e) => {
      if (!isMobile || pointerId == null || e.pointerId !== pointerId) return;
      try {
        stage.releasePointerCapture(pointerId);
      } catch {}
      endDrag();
    },
    { passive: true },
  );

  stage.addEventListener(
    "pointercancel",
    () => {
      if (!isMobile || pointerId == null) return;
      try {
        stage.releasePointerCapture(pointerId);
      } catch {}
      endDrag();
    },
    { passive: true },
  );

  // =========================
  // MUTATION OBSERVER
  // =========================
  const observer = new MutationObserver((mutations) => {
    let changed = false;
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.classList?.contains("verbatim")) {
          node.setAttribute("tabindex", "0");
          node.classList.remove("prev", "next", "active");
          node.classList.add("hidden");
          node.setAttribute("data-hidden-side", "right");
          changed = true;
        }
      });
    }
    if (changed) {
      syncItems();
      setRoles(activeIndex);
      applyLayout();
      bindSideInteractions();
    }
  });
  observer.observe(stage, { childList: true });

  // =========================
  // MEDIA QUERY CHANGE + RESIZE
  // =========================
  mobileMQ.addEventListener("change", (e) => {
    isMobile = e.matches;
    applyLayout();
    bindSideInteractions();
  });

  window.addEventListener("resize", applyLayout, { passive: true });

  // Init
  syncItems();
  setRoles(activeIndex);
  applyLayout();
  bindSideInteractions();
})();
