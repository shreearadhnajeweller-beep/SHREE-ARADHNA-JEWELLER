import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wtsdorhnjmphrwwvmfiq.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zKjqNEXu-yvWfQWMlZkEww_ZFS5yMqC';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY || 'BJ1f59sigjz474wgQzxDlE3V4ShJPnfOd2EH5xJIbpyJWo7Wlq4wyNxlFM3C2t9nxdB9zUK3nsVfBGpvKs0aQBk';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'PukYBGfImssXUD0iPf0DkxBQAIp5Xl3wPf2sSOtRm9U';

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
