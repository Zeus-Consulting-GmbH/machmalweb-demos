// Nimmt die Meldungen von /mmw-zaehler.js entgegen: POST <slug>.machmalweb.de/api/t
// Die Demo ergibt sich aus der Subdomain, nicht aus dem, was der Browser schickt.

const { bereit, befehle } = require('./_speicher');

const HALTBAR = 60 * 60 * 24 * 180; // Besuche verfallen nach 180 Tagen
const KLICKS = ['Anruf machmalweb', 'Anruf-Button', 'WhatsApp-Button', 'Gefällt mir', 'Mail an machmalweb', 'Mail-Button'];

function demoAus(host) {
  const h = String(host || '').split(':')[0].toLowerCase();
  const m = h.match(/^([a-z0-9-]{1,63})\.machmalweb\.de$/);
  if (!m || ['www', 'machmalweb'].includes(m[1])) return null;
  return m[1];
}

const kurz = (w, n) => String(w || '').slice(0, n);

module.exports = async (req, res) => {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  if (!bereit()) return res.status(204).end();

  const demo = demoAus(req.headers.host);
  let d = req.body;
  if (typeof d === 'string' || Buffer.isBuffer(d)) {
    try { d = JSON.parse(String(d)); } catch (e) { d = null; }
  }
  if (!demo || !d || !/^[a-z0-9]{8,24}$/.test(d.id || '')) return res.status(204).end();

  const k = `besuch:${d.id}`;
  const jetzt = Date.now();
  const liste = [];

  if (d.a === 'start') {
    let ort = kurz(req.headers['x-vercel-ip-city'], 60);
    try { ort = decodeURIComponent(ort); } catch (e) { /* bleibt roh */ }
    liste.push(
      ['HSET', k, 'demo', demo, 'start', jetzt, 'ende', jetzt, 'sek', 0, 'scroll', 0,
        'geraet', d.geraet === 'Handy' ? 'Handy' : 'Computer',
        'ort', ort, 'land', kurz(req.headers['x-vercel-ip-country'], 2),
        'herkunft', kurz(d.herkunft, 80), 'seiten', kurz(d.seite, 80)],
      ['ZADD', `besuche:${demo}`, jetzt, d.id],
      ['SADD', 'demos', demo],
      ['ZREMRANGEBYSCORE', `besuche:${demo}`, 0, jetzt - HALTBAR * 1000],
    );
  } else if (d.a === 'zeit') {
    const sek = Math.max(0, Math.min(6 * 3600, parseInt(d.sek, 10) || 0));
    const scroll = Math.max(0, Math.min(100, parseInt(d.scroll, 10) || 0));
    liste.push(['HSET', k, 'sek', sek, 'scroll', scroll, 'ende', jetzt]);
  } else if (d.a === 'seite') {
    liste.push(['HSET', k, 'ende', jetzt], ['HSET', k, 'letzte', kurz(d.seite, 80)]);
  } else if (d.a === 'klick' && KLICKS.includes(d.art)) {
    liste.push(['HINCRBY', k, `klick:${d.art}`, 1], ['HSET', k, 'ende', jetzt]);
  } else {
    return res.status(204).end();
  }
  liste.push(['EXPIRE', k, HALTBAR]);

  try {
    // Nur Besuche fortschreiben, die mit "start" angelegt wurden
    if (d.a !== 'start') {
      const [gibt] = await befehle([['EXISTS', k]]);
      if (!gibt) return res.status(204).end();
    }
    await befehle(liste);
  } catch (e) {
    console.error(e.message);
  }
  return res.status(204).end();
};
