/* BeHeld — hero A/B test measurement + Klaviyo signup forms.
   Variant assignment happens in the inline script in index.html <head>;
   this file only reads it, so it is safe to load on every page.

   Two form flows, chosen by the form's data-flow attribute:
   - "application": waitlist intent — Klaviyo capture, then onward to the
     Tally application with email prefilled. GA event: waitlist_submit.
   - "newsletter": plain newsletter signup, no application. GA event:
     newsletter_submit. */
(function () {
  var KLAVIYO_PUBLIC_KEY = 'TFTB5A'; /* Klaviyo public site key (matches the klaviyo.js tag in the page head) */
  var WAITLIST_LIST_ID = 'WAITLIST_LIST_ID';     /* TODO: Klaviyo list for waitlist-intent emails */
  var NEWSLETTER_LIST_ID = 'NEWSLETTER_LIST_ID'; /* only used if a custom data-flow="newsletter" form exists; the newsletter card now uses Klaviyo's embedded form XwNMXT instead */
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

  /* Exposure — fires only where the A/B hero exists (homepage) */
  if (document.querySelector('.hero-copy-a')) {
    track('hero_variant_exposure');
  }

  /* Klaviyo embedded form (newsletter card) — track submits + attach the
     A/B variant to the new profile. Klaviyo fires a "klaviyoForms" event
     for its embedded/popup forms. */
  window.addEventListener('klaviyoForms', function (e) {
    if (!e.detail || e.detail.type !== 'submit') return;
    track('newsletter_submit', { form_location: 'newsletter_card', klaviyo_form: e.detail.formId || '' });
    try {
      window.klaviyo = window.klaviyo || [];
      window.klaviyo.push(['identify', { hero_variant: variant(), signup_flow: 'newsletter' }]);
    } catch (err) {}
  });

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

      fetch('https://a.klaviyo.com/client/subscriptions/?company_id=' + KLAVIYO_PUBLIC_KEY, {
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
        var success = document.createElement('div');
        success.className = 'lead-success';
        if (flow === 'newsletter') {
          track('newsletter_submit', { form_location: source });
          success.innerHTML = 'You’re in — first letter coming soon.';
        } else {
          track('waitlist_submit', { form_location: source });
          success.innerHTML = 'You’re on the list. One more step:<br>' +
            '<a class="btn btn-primary" data-track="tally" data-loc="' + source + '" href="' + tallyUrl(email) +
            '" target="_blank" rel="noopener">Continue your application →</a>';
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
              source + '" target="_blank" rel="noopener">apply directly here</a>.';
          }
        }
      });
    });
  });
})();
