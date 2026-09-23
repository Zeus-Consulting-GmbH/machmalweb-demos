// Liefert die Besuche für statistik.machmalweb.de.
//
// Schutz:
//   - nur mit dem Schlüssel aus der Vercel-Umgebungsvariable STATISTIK_SCHLUESSEL,
//     und der muss mindestens 20 Zeichen lang sein, sonst bleibt die Seite zu
//   - höchstens 10 Fehlversuche je Anschluss in 15 Minuten, danach gesperrt
//     (die IP wird dafür nur als Hash mit Tagessalz und 15 Minuten Lebensdauer gehalten)
//   - Vergleich in konstanter Zeit, Antwort nie zwischengespeichert

const crypto = require('crypto');
const { bereit, befehle } = require('./_speicher');

const MIN_LAENGE = 20;
const MAX_FEHLVERSUCHE = 10;
const SPERRZEIT = 15 * 60;

const hash = w => crypto.createHash('sha256').update(String(w)).digest();
const passt = (eingabe, soll) => crypto.timingSafeEqual(hash(eingabe), hash(soll));

function anschluss(req) {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unbekannt';
  const tag = new Date().toISOString().slice(0, 10);
  return hash(`${tag}:${ip}:${process.env.STATISTIK_SCHLUESSEL}`).toString('hex').slice(0, 32);
}

module.exports = async (req, res) => {
  res.setHeader('cache-control', 'no-store');
  res.setHeader('x-robots-tag', 'noindex');
  if (req.method !== 'GET') return res.status(405).end();

  const soll = process.env.STATISTIK_SCHLUESSEL || '';
  if (!bereit()) return res.status(503).json({ fehlt: 'speicher' });
  if (soll.length < MIN_LAENGE) return res.status(503).json({ fehlt: 'schluessel' });

  const sperre = `fehlversuche:${anschluss(req)}`;
  const [versuche] = await befehle([['GET', sperre]]);
  if (Number(versuche) >= MAX_FEHLVERSUCHE) return res.status(429).json({ fehlt: 'gesperrt' });

  if (!passt(req.headers['x-schluessel'] || '', soll)) {
    await befehle([['INCR', sperre], ['EXPIRE', sperre, SPERRZEIT]]);
    return res.status(401).json({ fehlt: 'anmeldung' });
  }

  const [demos] = await befehle([['SMEMBERS', 'demos']]);
  const ids = demos.length ? await befehle(demos.map(d => ['ZREVRANGE', `besuche:${d}`, 0, 299])) : [];
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
