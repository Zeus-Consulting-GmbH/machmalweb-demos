// Gemeinsamer Zugriff auf den Upstash-Redis-Speicher (Vercel -> Storage).
// Zugangsdaten kommen ausschließlich aus den Umgebungsvariablen des
// Vercel-Projekts, nie aus dem Repo (das ist öffentlich).

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const bereit = () => Boolean(URL_ && TOKEN);

// Mehrere Befehle in einem Rutsch: [['HSET', ...], ['EXPIRE', ...]]
async function befehle(liste) {
  const antwort = await fetch(`${URL_}/pipeline`, {
    method: 'POST',
    headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify(liste),
  });
  if (!antwort.ok) throw new Error(`Speicher antwortet ${antwort.status}`);
  return (await antwort.json()).map(z => z.result);
}

module.exports = { bereit, befehle };
