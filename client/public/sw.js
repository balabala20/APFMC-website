/* Service Worker for Smart PF Dashboard */
self.addEventListener('push', function(event) {
  let data = { title: 'Notification', body: '' };
  try { data = event.data ? event.data.json() : data; } catch(e){}
  const options = {
    body: data.body,
    icon: '/icon.png',
    badge: '/badge.png',
    data: data
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then( clientList => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
