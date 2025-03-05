// sw.js - Service Worker to block the server list request
self.addEventListener('fetch', function(event) {
  if (event.request.url.includes('nadgames.com/PHP/Combat5/bl_GetServerList2.php')) {
    console.log('Service Worker blocking request:', event.request.url);
    event.respondWith(
      new Response(null, { status: 403, statusText: 'Forbidden' })
    );
    return;
  }
  event.respondWith(fetch(event.request));
});
