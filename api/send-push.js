import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kxnsgrytvigymczzwaay.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_gGAW7HL89E33HEdfAEfRgQ_lKSoL-CN';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const publicVapidKey = 'BEXW6qmnlL19TYxTUbLNgawyJPLEe0dWursfi25_AxGvbBRu--RSdGIFU0OMfdd5mV5yOfSF19V7B0Jdwro497Y';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'W7V503jE1T1W7_5b6vX8v2f3_4a5b6c7d8e9f0a1b2c';

try {
  webpush.setVapidDetails(
    'mailto:shreearadhanajeweller@gmail.com',
    publicVapidKey,
    privateVapidKey
  );
} catch (e) {
  console.warn('VAPID initialization note:', e.message);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customTitle, customBody, gold24k, gold22k } = req.body || {};

  const title = customTitle || 'ARADHANA GOLD HOUSE';
  const body = customBody || (gold24k ? `🔔 Live Rates Updated! 24K: ₹${gold24k}/g | 22K: ₹${gold22k}/g` : 'Check today\'s latest gold & silver prices!');

  const payload = JSON.stringify({
    title,
    body,
    icon: '/assets/logo_badge.png',
    badge: '/assets/logo_badge.png'
  });

  try {
    const { data, error } = await supabase.storage.from('payment_screenshots').download('push_subscriptions.json');
    let subscriptions = [];

    if (!error && data) {
      const text = await data.text();
      try {
        subscriptions = JSON.parse(text);
      } catch (e) {
        subscriptions = [];
      }
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ success: true, count: 0, message: 'No subscribed devices found yet.' });
    }

    let sentCount = 0;
    await Promise.all(
      subscriptions.map(sub =>
        webpush.sendNotification(sub, payload).then(() => sentCount++).catch(err => {
          console.warn('Push dispatch note for device:', err.message);
        })
      )
    );

    return res.status(200).json({ success: true, count: sentCount, total: subscriptions.length });
  } catch (err) {
    console.error('Push broadcast error:', err);
    return res.status(500).json({ error: err.message });
  }
}
