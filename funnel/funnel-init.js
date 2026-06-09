/**
 * funnel-init.js — DSGVO-konformes Tracking + Cookie-Banner
 *
 * Wird in jede Funnel-Page eingebunden:
 *   <script src="funnel/funnel-init.js" defer></script>
 *
 * Verhalten:
 * 1. Cookie-Banner zeigen, wenn noch keine Entscheidung getroffen wurde
 * 2. Bei Consent: Meta Pixel + GA4 laden
 * 3. Ohne Consent: nur first-party Events in window.dataLayer (lokal, ohne externes Tracking)
 *
 * Konfiguration über data-Attribute auf <body> oder window-globals VOR diesem Script:
 *   window.JH_TRACKING = { metaPixelId: '...', ga4MeasurementId: 'G-...' };
 *
 * Cookie-Konsens wird in localStorage als 'jh_consent_v1' gespeichert
 * mit den Werten 'all' | 'essential'.
 */

(function () {
  'use strict';
  const CONSENT_KEY = 'jh_consent_v1';
  const cfg = window.JH_TRACKING || {};

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function setConsent(v) {
    try { localStorage.setItem(CONSENT_KEY, v); } catch (e) {}
    if (v === 'all') loadTrackers();
  }

  // ── Cookie Banner ──────────────────────────────────
  function renderBanner() {
    if (getConsent()) {
      if (getConsent() === 'all') loadTrackers();
      return;
    }
    const css = `
      .jh-consent {
        position: fixed; left: 16px; right: 16px; bottom: 16px;
        max-width: 520px; margin: 0 auto;
        background: #fff;
        border-radius: 14px;
        box-shadow: 0 18px 48px rgba(0,0,0,.22);
        padding: 22px 24px;
        font-family: 'Poppins', -apple-system, system-ui, sans-serif;
        z-index: 99999;
        animation: jhConsentIn .4s cubic-bezier(.16,1,.3,1) both;
      }
      @keyframes jhConsentIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      .jh-consent__h { font-weight: 700; font-size: 1rem; color: #111010; margin-bottom: 8px; }
      .jh-consent__b { font-family: 'Bitter', serif; font-size: .9rem; line-height: 1.55; color: #6b6b6b; margin-bottom: 16px; }
      .jh-consent__b a { color: #8b1a1a; text-decoration: underline; }
      .jh-consent__row { display: flex; gap: 8px; flex-wrap: wrap; }
      .jh-consent__btn {
        font-family: inherit; font-weight: 600; font-size: .85rem;
        padding: 12px 20px; border-radius: 8px; cursor: pointer;
        border: 1.5px solid transparent;
      }
      .jh-consent__btn--primary { background: #8b1a1a; color: #fff; flex: 1; min-width: 140px; }
      .jh-consent__btn--primary:hover { background: #a52222; }
      .jh-consent__btn--secondary { background: #fff; color: #6b6b6b; border-color: #e2e0db; flex: 1; min-width: 140px; }
      .jh-consent__btn--secondary:hover { color: #111010; border-color: #6b6b6b; }
      @media (max-width: 480px) { .jh-consent { left: 8px; right: 8px; bottom: 8px; padding: 18px 20px; } }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const banner = document.createElement('div');
    banner.className = 'jh-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie-Einstellungen');
    banner.innerHTML = `
      <div class="jh-consent__h">Cookies &amp; Tracking</div>
      <div class="jh-consent__b">
        Wir nutzen Cookies und Pixel (Meta, Google) um zu messen, welche Inhalte für Eltern relevant sind. Du kannst die Marketing-Cookies ablehnen — der Funnel funktioniert weiterhin. <a href="/datenschutz">Datenschutz</a>.
      </div>
      <div class="jh-consent__row">
        <button class="jh-consent__btn jh-consent__btn--secondary" id="jh-consent-deny">Nur essenziell</button>
        <button class="jh-consent__btn jh-consent__btn--primary" id="jh-consent-allow">Alles erlauben</button>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('jh-consent-allow').addEventListener('click', () => {
      setConsent('all'); banner.remove();
    });
    document.getElementById('jh-consent-deny').addEventListener('click', () => {
      setConsent('essential'); banner.remove();
    });
  }

  // ── Meta Pixel + GA4 (laden nur nach Consent) ─────────
  function loadTrackers() {
    if (window.__JH_TRACKERS_LOADED__) return;
    window.__JH_TRACKERS_LOADED__ = true;

    if (cfg.metaPixelId) loadMetaPixel(cfg.metaPixelId);
    if (cfg.ga4MeasurementId) loadGA4(cfg.ga4MeasurementId);

    // Replay events from dataLayer (die vor Consent gepusht wurden)
    const dl = window.dataLayer || [];
    dl.forEach(replay);
    // Auto-replay future pushes
    const origPush = dl.push.bind(dl);
    dl.push = function (ev) { origPush(ev); replay(ev); };
  }

  function loadMetaPixel(id) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', id);
    window.fbq('track', 'PageView');
  }

  function loadGA4(id) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, { anonymize_ip: true, send_page_view: true });
  }

  function replay(ev) {
    if (!ev || !ev.event) return;
    // Map our generic events to Meta + GA4
    if (window.fbq) {
      switch (ev.event) {
        case 'InitiateQuizFunnel': window.fbq('trackCustom', 'InitiateQuizFunnel', ev); break;
        case 'Lead':                window.fbq('track', 'Lead', { content_name: 'check-stage-1' }); break;
        case 'ViewContent':         window.fbq('track', 'ViewContent', { content_name: ev.step || 'funnel' }); break;
        case 'InitiateCheckout':    window.fbq('track', 'InitiateCheckout', { value: ev.value || 0, currency: ev.currency || 'EUR' }); break;
        case 'Purchase':            window.fbq('track', 'Purchase', { value: ev.value || 97, currency: ev.currency || 'EUR' }); break;
        case 'Subscribe':           window.fbq('track', 'Subscribe', { value: ev.value || 29, currency: ev.currency || 'EUR' }); break;
        case 'CompleteRegistration':window.fbq('track', 'CompleteRegistration'); break;
      }
    }
    if (window.gtag) {
      window.gtag('event', ev.event, {
        funnel: ev.funnel || 'check',
        step: ev.step || null,
        value: ev.value || null,
        currency: ev.currency || null,
        uuid: ev.uuid || null
      });
    }
  }

  // ── Init ──────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBanner);
  } else {
    renderBanner();
  }
})();
