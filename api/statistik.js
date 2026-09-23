// Liefert die Besuche für statistik.machmalweb.de.
// Nur mit dem Schlüssel aus der Vercel-Umgebungsvariable STATISTIK_SCHLUESSEL.

const crypto = require('crypto');
const { bereit, befehle } = require('./_speicher');

function passt(eingabe, soll) {
  const a = crypto.createHash('sha256').update(String(eingabe)).digest();
  const b = crypto.createHash('sha256').update(String(soll)).digest();
  return crypto.timingSafeEqual(a, b);
}

module.exports = async (req, res) => {
  res.setHeader('cache-control', 'no-store');
  const soll = process.env.STATISTIK_SCHLUESSEL;
  if (!bereit() || !soll) {
    return res.status(503).json({ fehlt: !bereit() ? 'speicher' : 'schluessel' });
  }
  if (!passt(req.headers['x-schluessel'] || '', soll)) return res.status(401).json({ fehlt: 'anmeldung' });

  const [demos] = await befehle([['SMEMBERS', 'demos']]);
  const ids = await befehle(demos.map(d => ['ZREVRANGE', `besuche:${d}`, 0, 299]));
  const alle = ids.flat();
  const daten = alle.length ? await befehle(alle.map(id => ['HGETALL', `besuch:${id}`])) : [];

  const besuche = daten.map((feld, i) => {
    const b = { id: alle[i], klicks: {} };
    for (let j = 0; j < (feld || []).length; j += 2) {
      const [s, w] = [feld[j], feld[j + 1]];
      if (s.startsWith('klick:')) b.klicks[s.slice(6)] = Number(w);
      else b[s] = ['start', 'ende', 'sek', 'scroll'].includes(s) ? Number(w) : w;
    }
    return b;
  }).filter(b => b.demo); // abgelaufene Besuche fallen raus

  return res.status(200).json({ besuche });
};
