// assets/js/main.js (v2)
window.addEventListener('DOMContentLoaded', () => {
  if (window.Fancybox) {
    Fancybox.bind('[data-fancybox="galeria"]', {
      animated: true,
      dragToClose: true,
      showClass: 'f-fadeIn',
      hideClass: 'f-fadeOut',
      Carousel: { infinite: false },
      Toolbar: { display: ['counter','close'] },
      compact: false,
    });
  }
});
