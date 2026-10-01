(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Navigation: Trennlinie beim Scrollen, Menü auf dem Handy
  var nav = $('#nav');
  var toggle = $('#nav-toggle');
  var callbar = $('#callbar');
  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 4);
    if (callbar) callbar.classList.toggle('show', y > 520);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    if (!nav) return;
    nav.classList.remove('open');
    if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Menü öffnen'); }
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    });
    $$('#nav-links a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  // Segmented Control
  var seg = $('#seg');
  if (seg) {
    var thumb = $('.seg-thumb', seg);
    var tabs = $$('[role="tab"]', seg);
    var moveThumb = function (tab) {
      thumb.style.width = tab.offsetWidth + 'px';
      thumb.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
    };
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      moveThumb(tab);
      if (focus) tab.focus();
      if (tab.scrollIntoView && seg.scrollWidth > seg.clientWidth) {
        seg.scrollTo({ left: tab.offsetLeft - (seg.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
      }
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!n) return;
        e.preventDefault();
        select(tabs[(i + n + tabs.length) % tabs.length], true);
      });
    });
    var current = function () { return tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0]; };
    moveThumb(current());
    window.addEventListener('resize', function () { moveThumb(current()); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveThumb(current()); });

    $$('[data-tab]').forEach(function (a) {
      a.addEventListener('click', function () { select(document.getElementById(a.getAttribute('data-tab'))); });
    });
  }

  // "Beraten lassen" füllt das Thema im Formular vor
  var thema = $('#f-thema');
  $$('[data-thema]').forEach(function (a) {
    a.addEventListener('click', function () {
      var wert = a.getAttribute('data-thema');
      var opt = $$('option', thema).filter(function (o) { return o.value === wert; })[0];
      if (!opt) { opt = new Option(wert, wert); thema.add(opt, 2); }
      thema.value = wert;
      setTimeout(function () { $('#f-name').focus({ preventScroll: true }); }, 600);
    });
  });

  // Formular: öffnet das E-Mail-Programm mit vorbereiteter Nachricht
  var form = $('#form');
  if (form) {
    var msg = $('#form-msg');
    var f = form.elements;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = f.name.value.trim();
      var mail = f.mail.value.trim();
      if (!name || !/^\S+@\S+\.\S+$/.test(mail)) {
        msg.textContent = 'Bitte geben Sie Ihren Namen und eine gültige E-Mail-Adresse an.';
        (name ? f.mail : f.name).focus();
        return;
      }
      if (!$('#f-ok').checked) {
        msg.textContent = 'Bitte bestätigen Sie noch den Hinweis zum Datenschutz.';
        return;
      }
      var body = [
        'Name: ' + name,
        'Telefon: ' + (f.tel.value.trim() || '–'),
        'E-Mail: ' + mail,
        '',
        f.msg.value.trim()
      ].join('\n');
      location.href = 'mailto:michael.ulrich@kabelmail.de'
        + '?subject=' + encodeURIComponent('Anfrage: ' + f.thema.value)
        + '&body=' + encodeURIComponent(body);
      msg.textContent = 'Ihr E-Mail-Programm öffnet sich mit der fertigen Nachricht – nur noch absenden.';
    });
  }

  // Einblenden beim Scrollen
  var items = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var sibs = $$('.reveal', el.parentNode).filter(function (s) { return s.parentNode === el.parentNode; });
        el.style.transitionDelay = Math.min(sibs.indexOf(el), 5) * 70 + 'ms';
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  var jahr = $('#jahr');
  if (jahr) jahr.textContent = new Date().getFullYear();
})();
