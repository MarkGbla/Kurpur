// Custom service worker code: push notifications (injected by next-pwa)
self.addEventListener("push", function (event) {
  if (!event.data) return;
  var payload = { title: "Kurpur", body: "" };
  try {
    var data = event.data.json();
    payload = { title: data.title || payload.title, body: data.body || "" };
  } catch (_) {
    payload.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "kurpur-notification",
      renotify: true,
      data: { url: payload.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      if (clientList.length > 0 && clientList[0].focus) {
        clientList[0].navigate(url);
        clientList[0].focus();
      } else if (self.clients.openWindow) {
        self.clients.openWindow(url);
      }
    })
  );
});
