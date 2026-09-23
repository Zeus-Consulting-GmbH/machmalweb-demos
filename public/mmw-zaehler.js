// Besuchszähler für Demos: node pruefe.js kennt diese Datei, middleware.js
// liefert sie auf jeder Demo-Subdomain unter /mmw-zaehler.js aus.
//
// Ohne Cookies und ohne IP: pro Browser-Tab eine zufällige Besuchs-ID
// (sessionStorage), dazu sichtbare Verweildauer, Scrolltiefe und Klicks auf
// Telefon, WhatsApp und Mail-Links. Die Auswertung steht auf
// statistik.machmalweb.de.
//
// Eigene Besuche ausblenden: einmal <slug>.machmalweb.de/?nicht-zaehlen
// aufrufen (gilt für diesen Browser und diese Demo), ?zaehlen hebt es auf.
(function () {
  'use strict';

  var ZIEL = '/api/t';
  var TAKT = 20; // Sekunden zwischen Zwischenständen

  function lies(speicher, schluessel) {
    try { return window[speicher].getItem(schluessel); } catch (e) { return null; }
  }
  function schreib(speicher, schluessel, wert) {
    try {
      if (wert === null) window[speicher].removeItem(schluessel);
      else window[speicher].setItem(schluessel, wert);
    } catch (e) { /* privater Modus: dann eben ohne */ }
  }

  var suche = location.search;
  if (/[?&]nicht-zaehlen\b/.test(suche)) schreib('localStorage', 'mmw-nicht-zaehlen', '1');
  if (/[?&]zaehlen\b/.test(suche)) schreib('localStorage', 'mmw-nicht-zaehlen', null);
  if (lies('localStorage', 'mmw-nicht-zaehlen') === '1') return;
  if (navigator.webdriver) return; // Vorschau-Roboter von Mailprogrammen

  function sende(daten) {
    var text = JSON.stringify(daten);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ZIEL, text)) return;
    } catch (e) { /* weiter mit fetch */ }
    try {
      fetch(ZIEL, { method: 'POST', body: text, keepalive: true, headers: { 'content-type': 'text/plain' } });
    } catch (e) { /* nichts zu tun */ }
  }

  // Ein Besuch = ein Tab. Neu laden oder Unterseiten zählen zum selben Besuch.
  var id = lies('sessionStorage', 'mmw-besuch');
  var neu = !id;
  if (neu) {
    id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    schreib('sessionStorage', 'mmw-besuch', id);
  }
  var sekunden = parseInt(lies('sessionStorage', 'mmw-sek') || '0', 10) || 0;
  var scroll = 0;
  var gemeldet = -1;
  var seitMeldung = 0;

  if (neu) {
    sende({
      a: 'start', id: id, seite: location.pathname,
      geraet: Math.min(screen.width, window.innerWidth) < 768 ? 'Handy' : 'Computer',
      herkunft: document.referrer ? new URL(document.referrer).hostname : '',
    });
  } else {
    sende({ a: 'seite', id: id, seite: location.pathname });
  }

  function messeScroll() {
    var hoehe = document.documentElement.scrollHeight - window.innerHeight;
    var p = hoehe > 0 ? Math.round(window.scrollY / hoehe * 100) : 100;
    if (p > scroll) scroll = Math.min(100, p);
  }
  window.addEventListener('scroll', messeScroll, { passive: true });
  messeScroll();

  function zwischenstand() {
    if (sekunden === gemeldet) return;
    gemeldet = sekunden;
    seitMeldung = 0;
    sende({ a: 'zeit', id: id, sek: sekunden, scroll: scroll });
  }

  // Gezählt wird nur, solange die Seite sichtbar ist.
  setInterval(function () {
    if (document.visibilityState !== 'visible') return;
    sekunden += 1;
    seitMeldung += 1;
    schreib('sessionStorage', 'mmw-sek', String(sekunden));
    if (sekunden === 5 || seitMeldung >= TAKT) zwischenstand();
  }, 1000);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') zwischenstand();
  });
  window.addEventListener('pagehide', zwischenstand);

  function art(href) {
    if (/^tel:\+?4915565586614/.test(href)) return 'Anruf machmalweb';
    if (/^tel:/.test(href)) return 'Anruf-Button';
    if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) return 'WhatsApp-Button';
    if (/^mailto:hallo@machmalweb\.de\?/.test(href)) return 'Gefällt mir';
    if (/^mailto:hallo@machmalweb\.de/.test(href)) return 'Mail an machmalweb';
    if (/^mailto:/.test(href)) return 'Mail-Button';
    return '';
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var k = art(a.getAttribute('href'));
    if (k) sende({ a: 'klick', id: id, art: k });
  }, true);
})();
