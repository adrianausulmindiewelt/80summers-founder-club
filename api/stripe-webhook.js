/**
 * POST /api/stripe-webhook
 *
 * Stripe Webhook Endpoint. Aktualisiert Supabase nach Kauf / Subscription-Start
 * und löst Brevo Auslieferungs-Email aus.
 *
 * Setup:
 *   1. Stripe Dashboard → Webhooks → Add endpoint:
 *      https://<your-domain>/api/stripe-webhook
 *   2. Events: checkout.session.completed, customer.subscription.created,
 *              customer.subscription.deleted
 *   3. Webhook signing secret in STRIPE_WEBHOOK_SECRET env var
 */

const crypto = require('crypto');
const { upsertSubmission, getSubmissionByUuid } = require('../funnel/lib/supabase-store.js');
const { upsertContact, triggerEvent, sendTransactional } = require('../funnel/lib/brevo-client.js');

// WICHTIG: Stripe Webhooks brauchen den RAW body — keine Body-Parser!
module.exports.config = { api: { bodyParser: false } };

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }

  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let raw = '';
  await new Promise((resolve) => {
    req.on('data', c => { raw += c; });
    req.on('end', resolve);
    req.on('error', resolve);
  });

  // Signatur prüfen (wenn secret konfiguriert)
  if (secret) {
    if (!verifyStripeSignature(raw, sig, secret)) {
      res.statusCode = 400;
      return res.end('Invalid signature');
    }
  }

  let event;
  try { event = JSON.parse(raw); } catch (e) { res.statusCode = 400; return res.end('Invalid JSON'); }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        // ignore
    }
  } catch (err) {
    console.error('[stripe-webhook] handler error', err);
    res.statusCode = 500;
    return res.end('Handler error');
  }

  res.statusCode = 200;
  return res.end(JSON.stringify({ received: true }));
};

async function handleCheckoutCompleted(session) {
  const uuid = session.client_reference_id || (session.metadata && session.metadata.uuid);
  if (!uuid) return;
  const isSubscription = session.mode === 'subscription';
  const status = isSubscription ? 'subscribed' : 'purchased';

  await upsertSubmission({
    uuid,
    contact: {},
    status,
    stripe_customer_id: session.customer,
    stripe_session_id: session.id,
    purchasedAt: !isSubscription ? new Date().toISOString() : null,
    upsellSubscribedAt: isSubscription ? new Date().toISOString() : null
  }).catch(e => console.warn('[webhook] supabase fail', e.message));

  // Email triggern
  const row = await getSubmissionByUuid(uuid).catch(() => null);
  if (row && row.contact_email) {
    await upsertContact({
      email: row.contact_email,
      firstName: row.contact_name,
      attrs: { QUIZ_STAGE: status }
    }).catch(() => {});
    if (!isSubscription) {
      await triggerEvent(row.contact_email, 'plan_purchased', { uuid }).catch(() => {});
      // Optional: Auslieferungs-Email direkt
      const deliveryTemplateId = parseInt(process.env.BREVO_DELIVERY_TEMPLATE_ID || '0');
      if (deliveryTemplateId) {
        await sendTransactional({
          to: row.contact_email,
          templateId: deliveryTemplateId,
          params: {
            CHILDNAME: row.contact_name,
            UUID: uuid,
            DOWNLOAD_URL: `${process.env.PUBLIC_ORIGIN || 'https://jung-und-hungrig.com'}/check-danke.html?uuid=${uuid}`
          }
        }).catch(() => {});
      }
    } else {
      await triggerEvent(row.contact_email, 'workshop_subscribed', { uuid }).catch(() => {});
    }
  }
}

async function handleSubscriptionCreated(sub) {
  const uuid = sub.metadata && sub.metadata.uuid;
  if (!uuid) return;
  await upsertSubmission({
    uuid,
    contact: {},
    status: 'subscribed',
    upsellSubscribedAt: new Date().toISOString()
  }).catch(e => console.warn('[webhook] sub create fail', e.message));
}

async function handleSubscriptionDeleted(sub) {
  const uuid = sub.metadata && sub.metadata.uuid;
  if (!uuid) return;
  await upsertSubmission({
    uuid,
    contact: {},
    status: 'subscription-canceled'
  }).catch(() => {});
}

function verifyStripeSignature(payload, header, secret) {
  if (!header) return false;
  const parts = header.split(',').reduce((m, p) => {
    const [k, v] = p.split('='); m[k] = v; return m;
  }, {});
  const t = parts.t;
  const sigs = [parts.v1].filter(Boolean);
  if (!t || sigs.length === 0) return false;
  const signedPayload = `${t}.${payload}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  return sigs.some(s => crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}
