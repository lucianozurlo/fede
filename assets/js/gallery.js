// assets/js/main.js (v4)
window.addEventListener('DOMContentLoaded', () => {
   if (window.Fancybox) {
      Fancybox.bind('[data-fancybox]', {
         animated: true,
         dragToClose: true,
         showClass: 'f-fadeIn',
         hideClass: 'f-fadeOut',
         Carousel: { infinite: false },
         Toolbar: { display: ['counter', 'close'] },
         compact: false,
      });
   }
});
