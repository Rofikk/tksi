const CACHE='kawan-bus-pramusapa-v0.11.0';
const ASSETS=['./','index.html','app.css','app.js','manifest.webmanifest','admin.html','admin.js','reliever.html','reliever.js','panduan.html','pedoman-bus.html','access.html','access-control.js','../assets/img/favicon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(fetch(event.request).then(response=>{
    const copy=response.clone();
    caches.open(CACHE).then(cache=>cache.put(event.request,copy));
    return response;
  }).catch(()=>caches.match(event.request).then(response=>response||caches.match('./'))));
});
