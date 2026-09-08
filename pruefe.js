#!/usr/bin/env node
// Prüft alle Demos unter public/, bevor sie live gehen: node pruefe.js
//
// Ohne Abhängigkeiten und ohne Browser — läuft überall in ein paar Sekunden.
// Geprüft wird das, was beim Deploy still kaputtgehen kann:
//   1. Slug taugt als Subdomain (der Ordnername IST die Subdomain)
//   2. jeder lokale Verweis löst sich so auf, wie middleware.js ihn auflöst
//   3. FAKTEN: Angaben, die stimmen MÜSSEN, und Angaben, die NICHT
//      auftauchen dürfen (etwa eine private Handynummer statt der Kanzleinummer)
//
// Nicht geprüft: Indexierung — dafür sorgen robots.txt und middleware.js
// bereits für alle Demos gemeinsam.

const fs = require('fs');
const path = require('path');

const WURZEL = path.join(__dirname, 'public');
const RESERVIERT = ['www', 'machmalweb'];

// Bekannte Altlasten aus früheren Demos: diese beiden verlinken auf
// Rechtsseiten, die es nie gab. Bis sie nachgezogen sind, bleiben sie
// hier stehen, damit die Prüfung neue Fehler sichtbar macht statt im
// Rauschen unterzugehen.
const ALTLASTEN = new Set([
  'fuchs/index.html -> impressum.html',
  'fuchs/index.html -> datenschutz.html',
  'maler-mueller/index.html -> impressum.html',
  'maler-mueller/index.html -> datenschutz.html',
]);

// Belegte Angaben je Demo. Kommt eine Zahl in "muss" nicht mehr vor oder
// taucht etwas aus "darfNicht" auf, schlägt die Prüfung fehl.
const FAKTEN = {
  sjd: {
    muss: [
      '(07802) 9295-0',      // Kanzleinummer von steuerberater-sjd.de
      'tel:+49780292950',
      '77704 Oberkirch',
      '07:00 – 19:00 Uhr',   // Mo–Fr, aus dem Leadmanager
      '5,0',                 // Google-Bewertung
      '7 Google-Bewertungen',
      'Anyali Rösch', 'Magdalena Kober', 'Volker Gmeiner', 'Stefan Schmiederer',
      'HRA 706793',          // Registernummer der KG, aus dem Originalimpressum
      'HRB 722486',          // Registernummer der Komplementär-GmbH, ebenda
      // Die acht Leistungen der Startseite. Sie stecken in der Karten-Bahn,
      // die man von Hand leicht um eine Karte kürzt — geschrieben wie im
      // Quelltext, das kaufmännische Und also als Entity.
      'Rechnungswesen &amp; Buchhaltung',
      'Lohn- und Gehaltsabrechnung',
      'Betriebswirtschaftliche Beratung',
      'Jahresabschluss &amp; Steuererklärungen',
      'Betriebsprüfung',
      'Unternehmensnachfolge &amp; Testamentsvollstreckung',
      'Internationales Steuerrecht',
      'Umstrukturierung &amp; Unternehmensverkauf',
    ],
    darfNicht: [
      '0178',                // private Handynummer aus dem Lead
      '+49 178',
    ],
  },
};

const fehler = [];
const meldung = (demo, text) => fehler.push(`${demo}: ${text}`);

// Bildet middleware.js nach: Pfad ohne Endung -> <pfad>/index.html
function loest(demoOrdner, verweis, quelleOrdner) {
  const roh = decodeURI(verweis.split('#')[0].split('?')[0]);
  if (!roh) return true;
  let ziel = roh.startsWith('/')
    ? path.join(demoOrdner, roh)
    : path.resolve(quelleOrdner, roh);
  if (ziel.endsWith('/')) ziel = path.join(ziel, 'index.html');
  else if (!path.extname(ziel)) ziel = path.join(ziel, 'index.html');
  return ziel.startsWith(demoOrdner) && fs.existsSync(ziel);
}

function htmlDateien(ordner) {
  return fs.readdirSync(ordner, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? htmlDateien(path.join(ordner, e.name))
      : e.name.endsWith('.html') ? [path.join(ordner, e.name)] : []);
}

const demos = fs.readdirSync(WURZEL, { withFileTypes: true })
  .filter(e => e.isDirectory()).map(e => e.name);

for (const demo of demos) {
  const ordner = path.join(WURZEL, demo);

  if (!/^[a-z0-9-]+$/.test(demo)) meldung(demo, 'Slug taugt nicht als Subdomain (nur a-z, 0-9, -)');
  if (RESERVIERT.includes(demo)) meldung(demo, 'Slug ist reserviert');
  if (!fs.existsSync(path.join(ordner, 'index.html'))) meldung(demo, 'index.html fehlt');

  let gesamt = '';
  for (const datei of htmlDateien(ordner)) {
    const kurz = path.relative(WURZEL, datei);
    const html = fs.readFileSync(datei, 'utf8');
    gesamt += html;

    // \s davor, damit data-src="…" und ähnliche Attribute nicht mitgelesen werden
    for (const [, verweis] of html.matchAll(/\s(?:src|href)="([^"]*)"/g)) {
      if (/^(https?:|mailto:|tel:|data:|#|\/\/)/.test(verweis)) continue;
      if (loest(ordner, verweis, path.dirname(datei))) continue;
      if (ALTLASTEN.has(`${kurz} -> ${verweis}`)) continue;
      meldung(demo, `${kurz} verweist ins Leere: ${verweis}`);
    }
  }

  const f = FAKTEN[demo];
  if (f) {
    for (const s of f.muss) if (!gesamt.includes(s)) meldung(demo, `belegte Angabe fehlt: ${s}`);
    for (const s of f.darfNicht) if (gesamt.includes(s)) meldung(demo, `darf nicht auftauchen: ${s}`);
  }
}

if (fehler.length) {
  console.error(fehler.map(z => '  ✗ ' + z).join('\n'));
  console.error(`\n${fehler.length} Beanstandung(en) in ${demos.length} Demos.`);
  process.exit(1);
}
console.log(`✓ ${demos.length} Demos geprüft, nichts zu beanstanden.`);
