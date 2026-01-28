(() => {
  const mq = window.matchMedia("(max-width: 960px)");
  const container = document.querySelector("#services .trusted-container");
  if (!container) return;

  let cloned = false;

  const setup = () => {
    const track = container.querySelector(".trusted-track");
    if (!track) return;

    // Si no estamos en mobile, limpiamos clones y salimos
    if (!mq.matches) {
      if (cloned) {
        // removemos los duplicados
        const dups = track.querySelectorAll("[data-reel-clone='1']");
        dups.forEach((n) => n.remove());
        cloned = false;
      }
      container.style.removeProperty("--trusted-distance");
      container.style.removeProperty("--trusted-duration");
      return;
    }

    // Mobile: duplicamos una vez para loop perfecto
    if (!cloned) {
      const originals = Array.from(track.children);
      originals.forEach((node) => {
        const copy = node.cloneNode(true);
        copy.setAttribute("data-reel-clone", "1");
        track.appendChild(copy);
      });
      cloned = true;
    }

    // Esperamos a layout y medimos
    requestAnimationFrame(() => {
      // track ahora tiene 2 secuencias: la mitad es el "paso" del loop
      const distance = track.scrollWidth / 2;

      // Velocidad constante: px por segundo (ajustá a gusto)
      const speedPxPerSec = 70;
      const duration = Math.max(10, distance / speedPxPerSec); // mínimo 10s

      container.style.setProperty("--trusted-distance", `${distance}px`);
      container.style.setProperty("--trusted-duration", `${duration}s`);
    });
  };

  // init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, { once: true });
  } else {
    setup();
  }

  // recalcular en resize/orientation y cambios de breakpoint
  window.addEventListener("resize", setup, { passive: true });
  mq.addEventListener?.("change", setup);
})();
