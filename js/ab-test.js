/* BeHeld — hero A/B test measurement + Klaviyo signup forms.
   Variant assignment happens in the inline script in index.html <head>;
   this file only reads it, so it is safe to load on every page.

   Two form flows, chosen by the form's data-flow attribute:
   - "application": waitlist intent — Klaviyo capture, then a confirmation
     dialog offering the Tally application (email prefilled) or a one-click
     newsletter signup instead. GA events: waitlist_submit, then
     application_continue or newsletter_submit.
   - "newsletter": plain newsletter signup, no application. GA event:
     newsletter_submit. */
(function () {
  var KLAVIYO_PUBLIC_KEY = 'TFTB5A'; /* Klaviyo public site key (matches the klaviyo.js tag in the page head) */
  var WAITLIST_LIST_ID = 'TSbgvg';   /* Klaviyo "Waitlist" list */
  var NEWSLETTER_LIST_ID = 'TcMtEG'; /* Klaviyo "Newsletter" list — The BeHeld letter */
  var TALLY_URL = 'https://tally.so/r/MedLGX';

  function variant() {
    try { return localStorage.getItem('bh_hero_variant') || ''; } catch (e) { return ''; }
  }

  function track(name, params) {
    if (typeof gtag !== 'function') return;
    params = params || {};
    var v = variant();
    if (v) params.hero_variant = v;
    gtag('event', name, params);
  }

  /* Tally URL-prefill: query key must match the form's email field — verify in Tally */
  function tallyUrl(email) {
    return TALLY_URL + (email ? '?email=' + encodeURIComponent(email) : '');
  }

  /* Subscribe an email to a Klaviyo list; resolves on success, rejects on failure */
  function subscribe(email, listId, source, flow) {
    return fetch('https://a.klaviyo.com/client/subscriptions/?company_id=' + KLAVIYO_PUBLIC_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'revision': '2024-10-15' },
      body: JSON.stringify({
        data: {
          type: 'subscription',
          attributes: {
            profile: {
              data: {
                type: 'profile',
                attributes: {
                  email: email,
                  properties: { hero_variant: variant(), signup_source: source, signup_flow: flow }
                }
              }
            }
          },
          relationships: { list: { data: { type: 'list', id: listId } } }
        }
      })
    }).then(function (res) {
      if (!res.ok) throw new Error('subscribe failed: ' + res.status);
    });
  }

  /* Exposure — fires only where the A/B hero exists (homepage) */
  if (document.querySelector('.hero-copy-a')) {
    track('hero_variant_exposure');
  }

  /* Click tracking for tagged links */
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-track]') : null;
    if (!el) return;
    if (el.getAttribute('data-track') === 'rsvp') {
      track('rsvp_click', { link_location: el.getAttribute('data-loc') || '' });
    } else if (el.getAttribute('data-track') === 'tally') {
      track('application_continue', { link_location: el.getAttribute('data-loc') || '' });
    }
  });

  /* Confirmation dialog after a waitlist signup: continue to Tally, or
     take the newsletter instead (one click — we already have the email) */
  function showApplicationModal(email, source) {
    var overlay = document.createElement('div');
    overlay.className = 'bh-modal-overlay';
    overlay.innerHTML =
      '<div class="bh-modal" role="dialog" aria-modal="true" aria-labelledby="bh-modal-title">' +
        '<button class="bh-modal-close" type="button" aria-label="Close">&times;</button>' +
        '<h3 id="bh-modal-title">You’re on the list ✓</h3>' +
        '<p>Complete your application to help us match you to your people.</p>' +
        '<div class="bh-modal-actions">' +
          '<a class="btn btn-primary" data-track="tally" data-loc="' + source + '_modal" href="' + tallyUrl(email) + '">Start my application →</a>' +
          '<button class="btn btn-secondary bh-modal-letter" type="button">Put me on the newsletter</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    function close() {
      overlay.remove();
      document.removeEventListener('keydown', onEsc);
    }
    function onEsc(e) { if (e.key === 'Escape') close(); }
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    overlay.querySelector('.bh-modal-close').addEventListener('click', close);
    document.addEventListener('keydown', onEsc);

    overlay.querySelector('.bh-modal-letter').addEventListener('click', function () {
      var btn = this;
      btn.disabled = true;
      btn.textContent = 'One sec…';
      subscribe(email, NEWSLETTER_LIST_ID, 'post_waitlist_modal', 'newsletter').then(function () {
        track('newsletter_submit', { form_location: 'post_waitlist_modal' });
        var modal = overlay.querySelector('.bh-modal');
        modal.innerHTML =
          '<button class="bh-modal-close" type="button" aria-label="Close">&times;</button>' +
          '<h3>You’re in ✓</h3>' +
          '<p>Check your inbox or spam for the good stuff.</p>' +
          '<div class="bh-modal-actions"><button class="btn btn-secondary bh-modal-done" type="button">Close</button></div>';
        modal.querySelector('.bh-modal-close').addEventListener('click', close);
        modal.querySelector('.bh-modal-done').addEventListener('click', close);
      }).catch(function () {
        btn.disabled = false;
        btn.textContent = 'Not now — send me the BeHeld letter instead';
      });
    });

    overlay.querySelector('a.btn').focus();
  }

  /* Signup forms → Klaviyo, variant attached as profile property */
  document.querySelectorAll('form.lead-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var msg = form.nextElementSibling && form.nextElementSibling.classList.contains('lead-form-msg')
        ? form.nextElementSibling : null;
      var btn = form.querySelector('button');
      var btnLabel = btn ? btn.textContent : '';
      var email = (input && input.value || '').trim();
      var source = form.getAttribute('data-signup-source') || 'site';
      var flow = form.getAttribute('data-flow') === 'newsletter' ? 'newsletter' : 'application';
      var listId = flow === 'newsletter' ? NEWSLETTER_LIST_ID : WAITLIST_LIST_ID;

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (msg) { msg.hidden = false; msg.textContent = 'Please enter a valid email.'; }
        return;
      }
      if (btn) { btn.disabled = true; btn.textContent = 'One sec…'; }

      subscribe(email, listId, source, flow).then(function () {
        var success = document.createElement('div');
        success.className = 'lead-success';
        if (flow === 'newsletter') {
          track('newsletter_submit', { form_location: source });
          success.innerHTML = 'You’re in — first letter coming soon.';
        } else {
          track('waitlist_submit', { form_location: source });
          success.innerHTML = 'You’re on the list ✓ <a data-track="tally" data-loc="' + source + '" href="' +
            tallyUrl(email) + '">Open the application →</a>';
          showApplicationModal(email, source);
        }
        if (msg) msg.hidden = true;
        form.replaceWith(success);
      }).catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = btnLabel; }
        if (msg) {
          msg.hidden = false;
          if (flow === 'newsletter') {
            msg.textContent = 'Something went wrong — please try again in a moment.';
          } else {
            msg.innerHTML = 'Something went wrong — <a href="' + tallyUrl(email) + '" data-track="tally" data-loc="' +
              source + '">apply directly here</a>.';
          }
        }
      });
    });
  });
})();
