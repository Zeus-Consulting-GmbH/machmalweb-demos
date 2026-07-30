# machmalweb-demos

Demo-Webseiten für potenzielle Kunden. Jede Demo liegt als Ordner in `public/` und wird von Vercel automatisch unter einer eigenen Subdomain von `machmalweb.de` ausgeliefert.

## So wird eine Demo abgelegt

1. Ordner anlegen: `public/<slug>/`
2. Darin genau eine Datei ablegen: `index.html`
3. Auf `main` pushen — Vercel deployt automatisch, nichts weiter nötig.
4. Die Demo ist danach erreichbar unter `https://<slug>.machmalweb.de`

Beispiel: `public/fuchs/index.html` → `https://fuchs.machmalweb.de`

## Regeln für den Slug (Ordnername)

Der Ordnername ist gleichzeitig die Subdomain. Deshalb gilt:

- Nur Kleinbuchstaben, Ziffern und Bindestriche (`a-z`, `0-9`, `-`). Keine Umlaute, Leerzeichen, Punkte oder Unterstriche.
- `www` und `machmalweb` sind reserviert und funktionieren nicht als Demo-Slug.
- Beispiele aus dem Repo: `gegaj-galabau`, `maler-mueller`, `tc-gartenbau`

## Wichtig: Die index.html muss vollständig eigenständig sein

Die Middleware ([middleware.js](middleware.js)) leitet **jeden** Pfad einer Demo-Subdomain auf `/<slug>/index.html` um. Das heißt: Zusätzliche Dateien neben der `index.html` (Bilder, CSS, JS in Unterordnern wie `assets/`) werden **nicht ausgeliefert** — ein Request auf `https://<slug>.machmalweb.de/assets/logo.png` liefert wieder die `index.html` zurück.

Deshalb muss alles in der einen `index.html` stecken:

- CSS und JavaScript inline (`<style>` / `<script>` im HTML)
- Bilder als Data-URI (`data:image/...;base64,...`) oder von externen URLs (z. B. CDN)
- Schriften über externe URLs (z. B. Google Fonts) oder als Data-URI

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
