(function ($) {
  var $wrap = $("#gallery");
  if (!$wrap.length) return;

  function postToTop(payload) {
    try {
      window.top && window.top.postMessage(payload, "*");
    } catch (e) {}
  }

  function setBodyZoom(on) {
    postToTop({ type: "ZOOMPHOTOS_BODY", on: !!on });
  }

  function requestCloseModal1() {
    postToTop({ type: "ZOOMPHOTOS_CLOSE_MODAL1" });
  }

  function requestFocusIframe1() {
    postToTop({ type: "ZOOMPHOTOS_FOCUS_IFRAME1" });
  }

  /* =========================
     ISOTOPE
     ========================= */
  var iso = function () {
    $wrap.isotope({
      itemSelector: ".tt-grid-item",
      percentPosition: true,
      masonry: {
        columnWidth: ".grid-sizer",
        gutter: ".gutter-sizer",
      },
    });
  };

  if ($.fn.imagesLoaded) {
    $wrap.imagesLoaded(function () {
      iso();
      $wrap.isotope("layout");
    });
  } else {
    iso();
    $(window).on("load", function () {
      $wrap.isotope("layout");
    });
  }

  /* =========================
     LIGHTGALLERY v1
     ========================= */
  if ($.fn.lightGallery) {
    $wrap.lightGallery({
      selector: "a.lg-trigger",
      download: false,
      thumbnail: true,
      zoom: true,
      actualSize: false,
    });

    $wrap.off("onAfterOpen.lg.__z").on("onAfterOpen.lg.__z", function () {
      setBodyZoom(true);
      requestFocusIframe1();
    });

    $wrap.off("onCloseAfter.lg.__z").on("onCloseAfter.lg.__z", function () {
      setBodyZoom(false);
      requestFocusIframe1();
    });
  }

  function isLGOpen() {
    return !!document.querySelector(".lg-outer.lg-visible");
  }

  function closeLG() {
    var btn = document.querySelector(".lg-outer.lg-visible .lg-close");
    if (btn) {
      btn.click();
      return true;
    }

    var inst = $wrap.data("lightGallery");
    if (inst && typeof inst.closeGallery === "function") {
      inst.closeGallery();
      return true;
    }
    return false;
  }

  /* =========================
     ESC STACK
     ========================= */
  document.addEventListener(
    "keydown",
    function (e) {
      if (e.key !== "Escape") return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // 1) si Modal 2 (LG) está abierto, cerrarlo
      if (isLGOpen()) {
        closeLG();
        return;
      }

      // 2) si no, cerrar Modal 1 (padre)
      requestCloseModal1();
    },
    true
  );

  /* =========================
     RESIZE
     ========================= */
  var resizeTimer = null;
  $(window).on("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if ($wrap.data("isotope")) $wrap.isotope("layout");
    }, 120);
  });
})(jQuery);

/* =========================
   SWITCH (tinte)
   ========================= */
(function () {
  const toggle = document.getElementById("toggleTint");
  const gallery = document.getElementById("gallery");
  if (!toggle || !gallery) return;

  const apply = () => gallery.classList.toggle("no-tint", !toggle.checked);
  toggle.addEventListener("change", apply);
  apply();
})();
