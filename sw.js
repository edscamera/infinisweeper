const cacheName = `infinisweeper-v2.0b12`;
console.log(cacheName);
const addResourcesToCache = async (resources) => {
    const cache = await caches.open(cacheName);
    await cache.addAll(resources);
};
self.addEventListener("install", (event) => {
    event.waitUntil(
        addResourcesToCache([
            "./index.html",
            "./design/style.css",

            "./audio/blip_1.mp3",
            "./audio/blip_2.mp3",
            "./audio/blip_3.mp3",
            "./audio/blip_4.mp3",
            "./audio/blip_5.mp3",
            "./audio/blip_6.mp3",
            "./audio/blip_7.mp3",
            "./audio/blip_8.mp3",
            "./audio/confetti.mp3",
            "./audio/flag_up.mp3",
            "./audio/flag_down.mp3",
            "./audio/reveal.mp3",

            "./images/copy.ico",
            "./images/facebook.ico",
            "./images/twitter.ico",
            "./images/flag.png",
            "./images/flag_animation.png",
            "./images/incorrect_flag.png",

            "./source/Board.js",
            "./source/Camera.js",
            "./source/Canvas.js",
            "./source/GUIManager.js",
            "./source/Main.js",
            "./source/PoppedTile.js",
            "./source/Settings.js",
            "./source/Util.js",
        ])
    );
});
self.addEventListener("fetch", (e) => {
    e.respondWith((async () => {
        const r = await caches.match(e.request);
        if (r) return r;
        const response = await fetch(e.request);
        const cache = await caches.open(cacheName);
        cache.put(e.request, response.clone());
        return response;
    })());
});
self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then((keyList) => {
        return Promise.all(keyList.map((key) => {
            if (key === cacheName) { return; }
            return caches.delete(key);
        }))
    }));
});
/*
self.addEventListener('fetch', function (event) {
    event.respondWith(async function () {
        try {
            var res = await fetch(event.request);
            var cache = await caches.open('cache');
            cache.put(event.request.url, res.clone());
            return res;
        }
        catch (error) {
            return caches.match(event.request);
        }
    }());
});*/