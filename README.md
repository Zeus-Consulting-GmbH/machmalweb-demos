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

## Demo entfernen

Ordner löschen und pushen. Die Subdomain liefert danach nichts Sinnvolles mehr aus; die Wildcard-Domain selbst bleibt bestehen.

## Achtung: Dieses Repo ist öffentlich

Was hier landet, sieht jeder. Deshalb:

- Keine Secrets, API-Keys oder Zugangsdaten — nirgends, auch nicht in HTML-Kommentaren oder JS. (GitHub Secret Scanning und Push Protection sind aktiv und blocken solche Pushes.)
- Keine echten Kundendaten, die nicht ohnehin öffentlich sind.
