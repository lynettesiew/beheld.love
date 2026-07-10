/* ==========================================================================
   main.js — BeHeld page interactions
   ========================================================================== */
(function () {
  'use strict';

  /* Active nav link */
  var page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  /* Mobile hamburger */
  var burger = document.getElementById('hamburger');
  var mobileNav = document.getElementById('mobile-nav');
  if (burger && mobileNav) {
    burger.addEventListener('click', function () { mobileNav.classList.toggle('open'); });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { mobileNav.classList.remove('open'); });
    });
  }

  /* Scroll reveal */
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.07 });
  document.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });

  /* FAQ accordion — only one open at a time */
  document.querySelectorAll('.faq-list').forEach(function (list) {
    var items = list.querySelectorAll('details');
    items.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) items.forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  });

  /* Hero background video: ambient footage plays for everyone; the nudge
     covers browsers that ignore the autoplay attribute. (The rotating
     headline below still goes static under prefers-reduced-motion.) */
  var heroVideo = document.querySelector('.hero-media video');
  if (heroVideo && heroVideo.paused) {
    heroVideo.play().catch(function () {});
  }

  /* Hero rotating headline word (homepage only). The slot's width animates
     to each word so the text after it glides instead of jumping. */
  var rotateWord = document.querySelector('.rotate-word');
  var rotateSlot = document.querySelector('.rotate-slot');
  if (rotateWord && rotateSlot) {
    var words = ['networking', 'dinner', 'speed-dating', 'social'];
    var wordIndex = 0;
    var fitSlot = function () { rotateSlot.style.width = rotateWord.offsetWidth + 'px'; };
    fitSlot();
    window.addEventListener('resize', fitSlot);
    setInterval(function () {
      rotateWord.style.opacity = '0';
      rotateWord.style.transform = 'translateY(0.25em)';
      setTimeout(function () {
        wordIndex = (wordIndex + 1) % words.length;
        rotateWord.textContent = words[wordIndex];
        rotateSlot.style.width = rotateWord.offsetWidth + 'px';
        rotateWord.style.opacity = '1';
        rotateWord.style.transform = 'translateY(0)';
      }, 300);
    }, 2400);
  }

  /* Testimonial cards (homepage): hover = muted preview, click = exclusive
     sound-on playback. Only one card plays with sound at a time. */
  var testimonialCards = document.querySelectorAll('.testimonial-card');
  if (testimonialCards.length) {
    var testimonialTracked = {};
    var stopTestimonial = function (card) {
      var v = card.querySelector('video');
      v.pause();
      v.muted = true;
      card.classList.remove('is-sound');
    };
    testimonialCards.forEach(function (card) {
      var v = card.querySelector('video');
      card.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse' || card.classList.contains('is-sound')) return;
        v.muted = true;
        v.play().catch(function () {});
      });
      card.addEventListener('pointerleave', function (e) {
        if (e.pointerType !== 'mouse' || card.classList.contains('is-sound')) return;
        v.pause();
      });
      card.addEventListener('click', function () {
        if (card.classList.contains('is-sound')) { stopTestimonial(card); return; }
        testimonialCards.forEach(function (other) { if (other !== card) stopTestimonial(other); });
        v.currentTime = 0;
        v.muted = false;
        card.classList.add('is-sound');
        v.play().catch(function () {});
        var clip = card.getAttribute('data-clip') || '';
        if (!testimonialTracked[clip] && typeof gtag === 'function') {
          testimonialTracked[clip] = true;
          gtag('event', 'testimonial_play', { clip: clip });
        }
      });
    });
  }

  /* Smooth scroll for anchor links */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

})();
