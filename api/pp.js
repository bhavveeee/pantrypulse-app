// /api/pp — server-side proxy for the PP assistant.
// The browser never sees the Anthropic key; it lives in Vercel as ANTHROPIC_API_KEY.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in Vercel environment variables' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const system = String((body && body.system) || '').slice(0, 4000);
  const question = String((body && body.question) || '').slice(0, 120000);
  if (!question) return res.status(400).json({ error: 'question is required' });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, system, messages: [{ role: 'user', content: question }] })
    });
    const j = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: (j && j.error && j.error.message) || 'upstream error' });
    const text = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(502).json({ error: String(e && e.message || e) });
  }
};
