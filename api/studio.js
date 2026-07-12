// Mud & Ember — cloud save endpoint (Vercel Serverless Function).
//
// Stores one JSON blob per "studio code" in a Redis store (Upstash/Vercel KV).
// No build step, no dependencies — talks to the Upstash REST API with fetch.
//
// Setup (done once, in the Vercel dashboard):
//   Project → Storage → create a Redis/KV database → connect to this project.
// That injects the REST URL + token as env vars, which this function reads
// below. Until then, the function replies { configured:false } and the game
// stays local-only.
//
// Endpoints (same origin):
//   GET  /api/studio?health=1     -> { ok, configured }
//   GET  /api/studio?id=CODE      -> { data } | { data:null }
//   POST /api/studio  {id,data}   -> { ok, savedAt }

const REST_URL =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.STORAGE_KV_REST_API_URL ||
  process.env.REDIS_REST_API_URL || '';
const REST_TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.STORAGE_KV_REST_API_TOKEN ||
  process.env.REDIS_REST_API_TOKEN || '';

const configured = () => !!(REST_URL && REST_TOKEN);
const KEY = id => `studio:${id}`;
const validId = id => typeof id === 'string' && /^[A-Za-z0-9-]{6,64}$/.test(id);

// Run one Redis command via the Upstash REST API: ["GET","k"] / ["SET","k","v"]
async function redis(cmd) {
  const r = await fetch(REST_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REST_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return (await r.json()).result;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET' && (req.query.health !== undefined)) {
      return res.status(200).json({ ok: true, configured: configured() });
    }
    if (!configured()) {
      return res.status(200).json({ ok: false, configured: false,
        error: 'Cloud storage not set up yet. Add a Redis/KV database to this Vercel project.' });
    }

    if (req.method === 'GET') {
      const id = req.query.id;
      if (!validId(id)) return res.status(400).json({ error: 'bad id' });
      const raw = await redis(['GET', KEY(id)]);
      return res.status(200).json({ data: raw ? JSON.parse(raw) : null });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const { id, data } = body;
      if (!validId(id)) return res.status(400).json({ error: 'bad id' });
      if (data == null || typeof data !== 'object') return res.status(400).json({ error: 'bad data' });
      const savedAt = Date.now();
      const payload = JSON.stringify({ ...data, savedAt });
      if (payload.length > 400_000) return res.status(413).json({ error: 'too large' });
      // keep studios for 1 year after last write
      await redis(['SET', KEY(id), payload, 'EX', 60 * 60 * 24 * 365]);
      return res.status(200).json({ ok: true, savedAt });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message || e) });
  }
}
