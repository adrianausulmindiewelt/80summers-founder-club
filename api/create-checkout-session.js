/**
 * POST /api/create-checkout-session
 *
 * Body: { uuid, withBump }
 *
 * Erstellt eine Stripe Checkout Session für 97€ Hauptprodukt
 * (+ optional 37€ Order-Bump). Bei Erfolg redirect zum Checkout.
 *
 * Mock-Fallback: Wenn STRIPE_SECRET_KEY fehlt, wird ein Mock-URL zurückgegeben,
 * der direkt auf /check-upsell.html?uuid=...&mock=1 leitet — damit der Funnel
 * End-to-End klickbar bleibt.
 */

const { getSubmissionByUuid } = require('../funnel/lib/supabase-store.js');

const PRICE_MAIN_CENTS = 9700;
const PRICE_BUMP_CENTS = 3700;

const ORIGIN = process.env.PUBLIC_ORIGIN || 'https://jung-und-hungrig.com';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  const body = await readBody(req);
  const { uuid, withBump } = body || {};
  if (!uuid) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'uuid required' }));
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    // Mock — weiterleiten zum Upsell
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      url: `/check-upsell.html?uuid=${encodeURIComponent(uuid)}&mock=1`,
      mock: true
    }));
  }

  // Stripe REST direkt (kein SDK nötig)
  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('success_url', `${ORIGIN}/check-upsell.html?uuid=${encodeURIComponent(uuid)}&session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', `${ORIGIN}/check-plan.html?uuid=${encodeURIComponent(uuid)}&canceled=1`);
  params.append('client_reference_id', uuid);
  params.append('metadata[uuid]', uuid);
  params.append('metadata[funnel]', 'check');
  params.append('automatic_tax[enabled]', 'true');
  params.append('billing_address_collection', 'auto');
  params.append('locale', 'de');

  // Main item
  params.append('line_items[0][price_data][currency]', 'eur');
  params.append('line_items[0][price_data][unit_amount]', PRICE_MAIN_CENTS);
  params.append('line_items[0][price_data][product_data][name]', 'Digital-Reality-Check · 60-Tage-Plan + Eltern-Videokurs');
  params.append('line_items[0][quantity]', '1');

  // Order bump
  if (withBump) {
    params.append('line_items[1][price_data][currency]', 'eur');
    params.append('line_items[1][price_data][unit_amount]', PRICE_BUMP_CENTS);
    params.append('line_items[1][price_data][product_data][name]', 'Eltern-Gesprächsleitfaden Pro');
    params.append('line_items[1][quantity]', '1');
  }

  // Customer email (best-effort, falls Submission existiert)
  try {
    const row = await getSubmissionByUuid(uuid);
    if (row && row.contact_email) {
      params.append('customer_email', row.contact_email);
    }
  } catch (e) {}

  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    if (!stripeRes.ok) {
      const t = await stripeRes.text();
      throw new Error(`Stripe ${stripeRes.status}: ${t.slice(0, 300)}`);
    }
    const session = await stripeRes.json();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ url: session.url, id: session.id }));
  } catch (err) {
    console.error('[create-checkout] error', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: err.message }));
  }
};

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', c => { data += c; });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}
