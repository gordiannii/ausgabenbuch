/* Ausgabenbuch – Service Worker
   Cache-first für die App-Shell. Bei jeder Änderung an index.html
   die VERSION hochzählen, sonst liefert der Browser die alte Datei. */

var VERSION = "ausgabenbuch-v3";
var SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", function(ev){
  ev.waitUntil(
    caches.open(VERSION).then(function(c){
      return c.addAll(SHELL);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function(ev){
  ev.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        return k === VERSION ? null : caches.delete(k);
      }));
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function(ev){
  var req = ev.request;
  if(req.method !== "GET") return;
  if(new URL(req.url).origin !== self.location.origin) return;

  ev.respondWith(
    caches.match(req).then(function(hit){
      if(hit) return hit;
      return fetch(req).then(function(res){
        if(res && res.status === 200 && res.type === "basic"){
          var copy = res.clone();
          caches.open(VERSION).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){
        // Navigation ohne Netz: App-Shell ausliefern
        if(req.mode === "navigate") return caches.match("./index.html");
        throw new Error("offline");
      });
    })
  );
});
