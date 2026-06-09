/**
 * GET /api/plan-status?uuid=...
 * Polling-Endpoint für check-generieren.html.
 */

const { getSubmissionByUuid } = require('../funnel/lib/supabase-store.js');

module.exports = async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const uuid = url.searchParams.get('uuid');
  if (!uuid) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'uuid required' }));
  }

  res.setHeader('Content-Type', 'application/json');
  try {
    const row = await getSubmissionByUuid(uuid);
    if (!row) {
      res.statusCode = 200;
      return res.end(JSON.stringify({ status: 'pending' }));
    }
    if (row.status === 'done' && row.plan) {
      res.statusCode = 200;
      return res.end(JSON.stringify({
        status: 'done',
        plan: row.plan,
        avatars: row.avatars
      }));
    }
    res.statusCode = 200;
    return res.end(JSON.stringify({ status: row.status || 'pending' }));
  } catch (err) {
    res.statusCode = 200;
    return res.end(JSON.stringify({ status: 'pending', warn: err.message }));
  }
};
