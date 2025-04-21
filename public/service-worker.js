// public/service-worker.js

// Basic service worker to handle push events

self.addEventListener("push", function (event) {
  console.log("[Service Worker] Push Received.");
  console.log(`[Service Worker] Push had this data: "${event.data?.text()}"`); // Optional: Log payload

  const data = event.data?.json() ?? {}; // Safely parse JSON payload
  const title = data.title || "Push Notification";
  const options = {
    body: data.body || "Something happened!",
    icon: data.icon || "/icon-192x192.png", // Default icon
    badge: data.badge || "/badge-72x72.png", // Default badge (optional)
    // Add other options like actions, data, etc. if needed
    data: data.data || {}, // Pass along any extra data
  };

  console.log("Before notification");
  // Ensure the notification is shown
  const notificationPromise = self.registration.showNotification(
    title,
    options
  );
  event.waitUntil(notificationPromise);
  console.log(notificationPromise, "promise");
});

// Optional: Handle notification clicks
self.addEventListener("notificationclick", function (event) {
  console.log("[Service Worker] Notification click Received.");

  event.notification.close(); // Close the notification

  // Example: Focus or open a window
  // This example focuses an existing window or opens a new one
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true, // Important to find clients not controlled by this SW version
      })
      .then(function (clientList) {
        // Check if a window/tab matching the origin is already open
        for (const client of clientList) {
          // You might want more specific matching based on URL or data
          if (client.url === "/" && "focus" in client) {
            // Example: focus root if open
            return client.focus();
          }
        }
        // If no window is found, open a new one
        if (clients.openWindow) {
          // Use data from the notification if available
          const urlToOpen = event.notification.data?.url || "/";
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Basic install/activate listeners (can be expanded)
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Install");
  // event.waitUntil(self.skipWaiting()); // Optional: Force activation
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activate");
  // event.waitUntil(self.clients.claim()); // Optional: Take control immediately
});
