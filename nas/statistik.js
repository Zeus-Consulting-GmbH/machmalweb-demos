#!/usr/bin/env node
// Auswertung der Demo-Besuche, nur fürs Büronetz (läuft auf der NAS).
//
// Holt die Besuche, die api/t.js in Upstash Redis ablegt, mit einem
// Nur-Lese-Schlüssel ab und zeigt sie auf http://<nas>:8080. Nach außen
// wird nichts freigegeben: kein Login im Internet, keine Portfreigabe nötig.
//
// Umgebungsvariablen (aus Vercel → Storage → Upstash Redis → .env.local):
//   KV_REST_API_URL               https://….upstash.io
//   KV_REST_API_READ_ONLY_TOKEN   der Nur-Lese-Schlüssel, NICHT KV_REST_API_TOKEN

const http = require('http');
const fs = require('fs');
const path = require('path');

const URL_ = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_READ_ONLY_TOKEN;
const PORT = Number(process.env.PORT) || 8080;
const SEITE = fs.readFileSync(path.join(__dirname, 'index.html'));

async function befehle(liste) {
  const antwort = await fetch(`${URL_}/pipeline`, {
    method: 'POST',
    headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify(liste),
  });
  if (!antwort.ok) throw new Error(`Upstash antwortet ${antwort.status}`);
  return (await antwort.json()).map(z => z.result);
}

async function besuche() {
  const [demos] = await befehle([['SMEMBERS', 'demos']]);
  if (!demos.length) return [];
  const ids = await befehle(demos.map(d => ['ZREVRANGE', `besuche:${d}`, 0, 299]));
  const alle = ids.flat();
  const daten = alle.length ? await befehle(alle.map(id => ['HGETALL', `besuch:${id}`])) : [];
  return daten.map((feld, i) => {
    const b = { id: alle[i], klicks: {} };
    for (let j = 0; j < (feld || []).length; j += 2) {
      const [s, w] = [feld[j], feld[j + 1]];
      if (s.startsWith('klick:')) b.klicks[s.slice(6)] = Number(w);
      else b[s] = ['start', 'ende', 'sek', 'scroll'].includes(s) ? Number(w) : w;
    }
    return b;
  }).filter(b => b.demo); // abgelaufene Besuche fallen raus
}

const antworte = (res, status, typ, inhalt) => {
  res.writeHead(status, { 'content-type': typ, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(inhalt);
};

http.createServer(async (req, res) => {
  const pfad = req.url.split('?')[0];
  if (req.method !== 'GET') return antworte(res, 405, 'text/plain', '');
  if (pfad === '/') return antworte(res, 200, 'text/html; charset=utf-8', SEITE);
  if (pfad === '/daten') {
    if (!URL_ || !TOKEN) {
      return antworte(res, 500, 'application/json', JSON.stringify({ fehler: 'KV_REST_API_URL oder KV_REST_API_READ_ONLY_TOKEN fehlt in der .env des Containers.' }));
    }
    try {
      return antworte(res, 200, 'application/json', JSON.stringify({ besuche: await besuche() }));
    } catch (e) {
      console.error(e.message);
      return antworte(res, 502, 'application/json', JSON.stringify({ fehler: `Daten nicht abrufbar: ${e.message}` }));
    }
  }
  return antworte(res, 404, 'text/plain', '');
}).listen(PORT, () => console.log(`Statistik läuft auf Port ${PORT}`));
