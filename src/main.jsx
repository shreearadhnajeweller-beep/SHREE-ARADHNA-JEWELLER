import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { supabase } from './lib/supabase'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Helper utility to convert VAPID public key string into Uint8Array format
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Function to upload new background push subscription objects to Supabase
async function saveSubscriptionToStorage(subscription) {
  try {
    const endpoint = subscription.endpoint;
    const subId = 'SUB_' + Math.random().toString(36).substring(2, 9).toUpperCase();

    // 1. Try DB Table Insert / Upsert
    try {
      await supabase.from('push_subscriptions').upsert({
        id: subId,
        endpoint: endpoint,
        subscription_json: subscription,
        created_at: new Date().toISOString()
      }, { onConflict: 'endpoint' });
    } catch (dbErr) {
      console.warn('Push DB sync note:', dbErr.message);
    }

    // 2. Storage Bucket Sync Backup
    const bucketName = 'payment_screenshots';
    const fileName = 'push_subscriptions.json';
    const { data, error } = await supabase.storage.from(bucketName).download(fileName);
    let subscriptions = [];
    if (!error && data) {
      const text = await data.text();
      try { subscriptions = JSON.parse(text); } catch (e) { subscriptions = []; }
    }
    
    const exists = subscriptions.some(s => s.endpoint === endpoint);
    if (!exists) {
      subscriptions.push(subscription);
      const fileBlob = new Blob([JSON.stringify(subscriptions)], { type: 'application/json' });
      await supabase.storage.from(bucketName).upload(fileName, fileBlob, { upsert: true });
    }
    console.log('Push subscription synced successfully!');
  } catch (err) {
    console.error('Error syncing push subscription:', err.message);
  }
}

// Helper function to explicitly request Push permissions on user gesture (required for iOS Safari)
window.subscribeUserToPush = async () => {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    alert('Web Push notifications are not supported on this browser version.');
    return;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const applicationServerKey = urlB64ToUint8Array('BJ1f59sigjz474wgQzxDlE3V4ShJPnfOd2EH5xJIbpyJWo7Wlq4wyNxlFM3C2t9nxdB9zUK3nsVfBGpvKs0aQBk');
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        try { await existingSub.unsubscribe(); } catch (e) {}
      }
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      await saveSubscriptionToStorage(subscription);
      alert('🔔 Rate notifications enabled successfully on this device!');
    } else {
      alert('Notification permission was denied. Please enable notifications in your browser settings.');
    }
  } catch (err) {
    console.error('Subscription error:', err);
    alert('Error enabling notifications: ' + err.message);
  }
};

// Register PWA Service Worker (with active Push/Notification API integration)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('PWA Service Worker registered successfully', reg);
        if ('Notification' in window && Notification.permission === 'granted') {
          if ('PushManager' in window && reg.pushManager) {
            const applicationServerKey = urlB64ToUint8Array('BJ1f59sigjz474wgQzxDlE3V4ShJPnfOd2EH5xJIbpyJWo7Wlq4wyNxlFM3C2t9nxdB9zUK3nsVfBGpvKs0aQBk');
            reg.pushManager.getSubscription().then(async (existingSub) => {
              if (existingSub) {
                try { await existingSub.unsubscribe(); } catch (e) {}
              }
              return reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
              });
            }).then((subscription) => {
              console.log('Client subscribed to push notification engine:', subscription);
              saveSubscriptionToStorage(subscription);
            }).catch((err) => {
              console.warn('Push manager subscription note:', err.message);
            });
          }
        }
      })
      .catch((err) => console.error('PWA Service Worker registration failed', err));
  });
}
