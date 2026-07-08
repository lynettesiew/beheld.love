/* BeHeld — hero A/B test measurement + waitlist form.
   Variant assignment happens in the inline script in index.html <head>;
   this file only reads it, so it is safe to load on every page. */
(function () {
  var KLAVIYO_PUBLIC_KEY = 'KLAVIYO_PUBLIC_KEY'; /* TODO: replace with your Klaviyo public (site) key */
  var KLAVIYO_LIST_ID = 'LIST_ID';               /* TODO: replace with your Klaviyo waitlist list ID */
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

  /* Waitlist lead forms → Klaviyo, variant attached as profile property */
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
                    properties: { hero_variant: variant(), signup_source: source }
                  }
                }
              }
            },
            relationships: { list: { data: { type: 'list', id: KLAVIYO_LIST_ID } } }
          }
        })
      }).then(function (res) {
        if (!res.ok) throw new Error('subscribe failed: ' + res.status);
        track('waitlist_submit', { form_location: source });
        var success = document.createElement('div');
        success.className = 'lead-success';
        success.innerHTML = 'You’re on the list. One more step:<br>' +
          '<a class="btn btn-primary" data-track="tally" data-loc="' + source + '" href="' + TALLY_URL +
          '" target="_blank" rel="noopener">Continue your application →</a>';
        if (msg) msg.hidden = true;
        form.replaceWith(success);
      }).catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = btnLabel; }
        if (msg) {
          msg.hidden = false;
          msg.innerHTML = 'Something went wrong — <a href="' + TALLY_URL + '" data-track="tally" data-loc="' +
            source + '" target="_blank" rel="noopener">apply directly here</a>.';
        }
      });
    });
  });
})();
