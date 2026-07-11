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

  /* Recess carousel (homepage): one uncropped clip at a time, muted loop.
     Arrows/swipe navigate; only the active slide's video plays; the whole
     stage pauses when scrolled off screen. */
  var recessStage = document.querySelector('.recess-stage');
  if (recessStage) {
    var recessSlides = recessStage.querySelectorAll('.recess-slide');
    var recessName = document.querySelector('.recess-name');
    var recessDesc = document.querySelector('.recess-desc');
    var recessNum = document.querySelector('.recess-num');
    var recessActive = 0;
    var recessOnScreen = false;
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };

    var showRecess = function (i) {
      recessActive = (i + recessSlides.length) % recessSlides.length;
      recessSlides.forEach(function (slide, n) {
        var v = slide.querySelector('video');
        if (n === recessActive) {
          slide.classList.add('is-active');
          if (recessOnScreen) v.play().catch(function () {});
        } else {
          slide.classList.remove('is-active');
          v.pause();
        }
      });
      var active = recessSlides[recessActive];
      recessName.textContent = active.getAttribute('data-name');
      recessDesc.textContent = active.getAttribute('data-desc');
      recessNum.textContent = 'Activity ' + pad(recessActive + 1) + ' · of ' + pad(recessSlides.length);
    };

    document.querySelector('.recess-prev').addEventListener('click', function () { showRecess(recessActive - 1); });
    document.querySelector('.recess-next').addEventListener('click', function () { showRecess(recessActive + 1); });

    var swipeX = null;
    recessStage.addEventListener('pointerdown', function (e) { swipeX = e.clientX; });
    recessStage.addEventListener('pointerup', function (e) {
      if (swipeX === null) return;
      var dx = e.clientX - swipeX;
      swipeX = null;
      if (dx > 40) showRecess(recessActive - 1);
      else if (dx < -40) showRecess(recessActive + 1);
    });

    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        recessOnScreen = entry.isIntersecting;
        var v = recessSlides[recessActive].querySelector('video');
        if (recessOnScreen) v.play().catch(function () {});
        else v.pause();
      });
    }, { threshold: 0.25 }).observe(recessStage);

    showRecess(0);
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
