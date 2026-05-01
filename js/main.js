/* ==========================================================================
   main.js — page interactions
   ========================================================================== */

(function () {
  'use strict';

  // Smooth-scroll for in-page anchor links.
  // Most browsers handle this via CSS scroll-behavior, but this is a fallback
  // for older browsers and gives us an offset for the sticky nav if needed.
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = link.getAttribute('href');
      if (targetId === '#' || targetId.length < 2) return;

      var target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Close other open <details> elements when one is opened (accordion behavior).
  // Comment this block out if you'd rather allow multiple open at once.
  var allDetails = document.querySelectorAll('.faq-list details');
  allDetails.forEach(function (detail) {
    detail.addEventListener('toggle', function () {
      if (detail.open) {
        allDetails.forEach(function (other) {
          if (other !== detail) other.open = false;
        });
      }
    });
  });
})();