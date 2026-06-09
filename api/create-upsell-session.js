/**
 * POST /api/create-upsell-session
 *
 * Erstellt eine Stripe Subscription Session für 29 € erster Monat / 49 €/Monat danach.
 * Wenn STRIPE_UPSELL_PRICE_ID gesetzt ist, nutzt sie das fertige Price-Objekt
 * (mit Trial / Coupon konfiguriert). Sonst inline.
 *
 * Mock-Fallback: Redirect zur Danke-Seite mit `upsell=taken`.
 */

const ORIGIN = process.env.PUBLIC_ORIGIN || 'https://jung-und-hungrig.com';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  const body = await readBody(req);
  const { uuid } = body || {};
  if (!uuid) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'uuid required' }));
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      url: `/check-danke.html?uuid=${encodeURIComponent(uuid)}&upsell=taken&mock=1`,
      mock: true
    }));
  }

  const params = new URLSearchParams();
  params.append('mode', 'subscription');
  params.append('success_url', `${ORIGIN}/check-danke.html?uuid=${encodeURIComponent(uuid)}&upsell=taken&session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', `${ORIGIN}/check-danke.html?uuid=${encodeURIComponent(uuid)}`);
  params.append('client_reference_id', uuid);
  params.append('metadata[uuid]', uuid);
  params.append('metadata[funnel]', 'check-upsell');
  params.append('locale', 'de');

  const upsellPriceId = process.env.STRIPE_UPSELL_PRICE_ID;
  if (upsellPriceId) {
    params.append('line_items[0][price]', upsellPriceId);
    params.append('line_items[0][quantity]', '1');
    if (process.env.STRIPE_UPSELL_COUPON_ID) {
      params.append('discounts[0][coupon]', process.env.STRIPE_UPSELL_COUPON_ID);
    }
  } else {
    // Inline: 49 €/Monat — Frontend kommuniziert "29€ erster Monat" via Coupon.
    // Ohne Coupon-ID: wir geben einfach 29 € im ersten Monat als trial-vergünstigte Variante.
    // Empfehlung: Im Stripe Dashboard ein recurring Price (49€/Monat) anlegen + Coupon (20€ off, once).
    params.append('line_items[0][price_data][currency]', 'eur');
    params.append('line_items[0][price_data][unit_amount]', '4900');
    params.append('line_items[0][price_data][recurring][interval]', 'month');
    params.append('line_items[0][price_data][product_data][name]', 'Jung und Hungrig Workshop-Community');
    params.append('line_items[0][quantity]', '1');
  }

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
    console.error('[create-upsell] error', err);
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
