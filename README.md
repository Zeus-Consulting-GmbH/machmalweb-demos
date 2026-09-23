# machmalweb-demos

Demo-Webseiten für potenzielle Kunden. Jede Demo liegt als Ordner in `public/` und wird von Vercel automatisch unter einer eigenen Subdomain von `machmalweb.de` ausgeliefert.

## So wird eine Demo abgelegt

1. Ordner anlegen: `public/<slug>/`
2. Darin eine `index.html` ablegen. Weitere Dateien und Unterordner (Bilder, CSS, JS) sind erlaubt, siehe unten.
3. Auf `main` pushen — Vercel deployt automatisch, nichts weiter nötig.
4. Die Demo ist danach erreichbar unter `https://<slug>.machmalweb.de`

Beispiel: `public/fuchs/index.html` → `https://fuchs.machmalweb.de`

## Regeln für den Slug (Ordnername)

Der Ordnername ist gleichzeitig die Subdomain. Deshalb gilt:

- Nur Kleinbuchstaben, Ziffern und Bindestriche (`a-z`, `0-9`, `-`). Keine Umlaute, Leerzeichen, Punkte oder Unterstriche.
- `www` und `machmalweb` sind reserviert und funktionieren nicht als Demo-Slug.
- Beispiele aus dem Repo: `gegaj-galabau`, `maler-mueller`, `tc-gartenbau`

## Assets und Unterseiten

Die Middleware ([middleware.js](middleware.js)) bildet jeden Pfad einer Demo-Subdomain auf den Demo-Ordner ab:

- `https://<slug>.machmalweb.de/assets/logo.png` → `public/<slug>/assets/logo.png`
- `https://<slug>.machmalweb.de/` → `public/<slug>/index.html`
- `https://<slug>.machmalweb.de/datenschutz` → `public/<slug>/datenschutz/index.html` (Pfade ohne Dateiendung werden als Unterseite aufgelöst)

Daraus folgt für die Demo-Dateien:

- Asset-Pfade in der `index.html` relativ (`assets/logo.png`) oder root-absolut (`/assets/logo.png`) schreiben — beides landet im eigenen Demo-Ordner.
- Unterseiten als `unterordner/index.html` ablegen, verlinkt als `/unterordner`.
- Eine einzelne, in sich geschlossene `index.html` (CSS/JS inline, Bilder als Data-URI oder externe URLs) funktioniert natürlich weiterhin.

## Wie das Deployment funktioniert

- Vercel deployt dieses Repo als statisches Projekt: alles unter `public/` wird ausgeliefert. Es gibt keinen Build-Schritt.
- Auf dem Vercel-Projekt ist die Wildcard-Domain `*.machmalweb.de` verbunden. Die Middleware liest die Subdomain aus dem Host-Header und rewritet auf den passenden Ordner.
- Jeder Push auf `main` löst automatisch ein neues Deployment aus. Nach 1–2 Minuten ist die Änderung live.
- `public/404.html` leitet auf `machmalweb.de` weiter, `public/robots.txt` und die Middleware sperren alle Demos für Suchmaschinen (`Disallow: /`). Demos landen also nicht bei Google — das ist Absicht.

## Vor dem Push prüfen

```
node pruefe.js
```

Läuft ohne Abhängigkeiten und ohne Browser über alle Demos in `public/` und meldet sich, wenn ein Slug nicht als Subdomain taugt, eine `index.html` fehlt oder ein lokaler Verweis ins Leere zeigt (mit derselben Auflösung, die [middleware.js](middleware.js) live macht — Pfade ohne Endung als `unterordner/index.html`).

Zusätzlich stehen oben in der Datei unter `FAKTEN` je Demo die Angaben, die stimmen **müssen** (Telefonnummer, Öffnungszeiten, Bewertungen, bei `sjd` auch die acht Leistungen), und die, die **nicht** auftauchen dürfen. Das ist der Schutz davor, dass beim Umbauen still eine private Handynummer oder eine unbelegte Zahl auf einer Kundenseite landet. Neue Demos mit belegten Angaben dort eintragen.

Bekannte Altlasten (zwei alte Demos verlinken auf nie gebaute Rechtsseiten) sind in `ALTLASTEN` vermerkt, damit die Prüfung grün ist und neue Fehler auffallen.

## Besuche zählen

Eine Demo zählt ihre Besuche, wenn vor `</body>` diese Zeile steht:

```
<script src="/mmw-zaehler.js" defer></script>
```

Das Skript ([public/mmw-zaehler.js](public/mmw-zaehler.js)) setzt keine Cookies und speichert keine IP. Es meldet an [api/t.js](api/t.js): Beginn, sichtbare Verweildauer, Scrolltiefe, Handy oder Computer, grobe Stadt, Klicks auf Telefon, WhatsApp, Mail und „Gefällt mir“. Browser-Roboter (`navigator.webdriver`) zählen nicht.

Auswertung: `https://statistik.machmalweb.de` (Ordner `public/statistik/`, Daten über [api/statistik.js](api/statistik.js)).

Braucht im Vercel-Projekt einmalig:

- einen Upstash-Redis-Speicher (Storage → Upstash Redis, mit dem Projekt verbinden; setzt `KV_REST_API_URL` und `KV_REST_API_TOKEN`)
- die Umgebungsvariable `STATISTIK_SCHLUESSEL` mit einem Passwort für die Auswertung, mindestens 20 Zeichen (sonst bleibt die Seite zu). Nach 10 Fehlversuchen ist ein Anschluss 15 Minuten gesperrt, die Anmeldung gilt nur für den offenen Tab.

Eigene Besuche ausblenden: die Demo einmal mit `?nicht-zaehlen` aufrufen (gilt pro Browser und Demo), `?zaehlen` hebt es wieder auf.

## Demo entfernen

Ordner löschen und pushen. Die Subdomain liefert danach nichts Sinnvolles mehr aus; die Wildcard-Domain selbst bleibt bestehen.

## Achtung: Dieses Repo ist öffentlich

Was hier landet, sieht jeder. Deshalb:

- Keine Secrets, API-Keys oder Zugangsdaten — nirgends, auch nicht in HTML-Kommentaren oder JS. (GitHub Secret Scanning und Push Protection sind aktiv und blocken solche Pushes.)
- Keine echten Kundendaten, die nicht ohnehin öffentlich sind.
