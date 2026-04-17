async function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function registerServiceWorkerAndSubscribe(token) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error('Push not supported');
  const reg = await navigator.serviceWorker.register('/sw.js');
  const res = await fetch('/api/vapid-public');
  const j = await res.json();
  const applicationServerKey = await urlBase64ToUint8Array(j.publicKey);
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
  // send to server
  await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(sub) });
  return sub;
}

export default { registerServiceWorkerAndSubscribe };
