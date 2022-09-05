const cacheName = `infinisweeper-v2.3a`;
const filesToCache = [
    "./index.html",
    "./changelog.txt",
    "./design/global.css",
    "./design/title.css",
    "./design/game.css",
    "./design/defer.css",

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

    "./audio/ding.mp3",
    "./audio/dang.mp3",
    "./audio/dingdong.mp3",
    "./audio/ilovedagirl.mp3",
    "./audio/woo.mp3",
    "./audio/woo_reverse.mp3",

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
];
console.log(cacheName);
caches.keys().then(keys => {
    keys.forEach(key => {
        if (cacheName !== key) caches.delete(key);
    });
});

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll(filesToCache);
        }).catch(err => console.log(err))
    );
});
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request)
        }).catch(err => console.log(err, event))
    );
});