// Build sürümünü her yayın sonrası güncelleyin; SW değişmezse yeni sürüm alınmaz.
// Format: YYYYMMDD-Vxx-sss (sss: 001-999)
const CACHE_VERSION = '20260208-66-224';
const CACHE_NAME = `GLKOAI-${CACHE_VERSION}`;
// HTTP Range header pattern - video kısmi indirme (206 Partial Content) için
const RANGE_PATTERN = /bytes=(\d+)-(\d+)?/;
const ASSETS = [
    './',
    './index.html',
    './app.js?v=66.224',
    './food-nutrients.js?v=66.219',
    './health-report.js?v=66.222',
    './alternative-report.js',
    './profile-wizard.js',
    './food-lists.js',
    './diet-plan.js',
    './food-lists/turkey.json?v=7',
    './food-lists/uk.json?v=7',
    './food-lists/germany.json?v=7',
    './food-lists/france.json?v=7',
    './food-lists/italy.json?v=7',
    './food-lists/india.json?v=7',
    './food-lists/mediterranean.json?v=5',
    './food-lists/vegetarian.json?v=5',
    './food-lists/vegan.json?v=5',
    './food-lists/dash.json?v=1',
    './food-lists/keto.json?v=1',
    './food-lists/paleo.json?v=1',
    './food-lists/low_carb.json?v=1',
    './food-lists/low_fat.json?v=1',
    './food-lists/high_protein.json?v=1',
    './custom-cuisine.js',
    './language-test.js?v=66.223',
    './app-utils.js?v=66.216',
    './language.js',
    './style.css?v=66.222',
    './yemekler.js',
    './guide_content.js',
    './guide-en.js',
    './manifest.json',
    './assets/img/intro-uyumlu.mp4',
    './assets/img/karşılama.png',
    './assets/img/kklogo.png',
    './assets/img/son.png',
    './icon-192.png',
    './icon-512.png',
    // Yerel kütüphaneler (CDN kaldırıldı)
    './assets/libs/tailwindcss.js',
    './assets/libs/chart.js',
    './assets/libs/chartjs-adapter-date-fns.bundle.min.js',
    './assets/libs/hammer.min.js',
    './assets/libs/chartjs-plugin-zoom.min.js',
    './assets/libs/pdfmake.min.js',
    './assets/libs/vfs_fonts.js',
    './assets/libs/marked.min.js',
    './assets/libs/sortable.min.js',
    './assets/libs/phosphor/ph-regular.css',
    './assets/libs/phosphor/ph-thin.css',
    './assets/libs/phosphor/ph-light.css',
    './assets/libs/phosphor/ph-bold.css',
    './assets/libs/phosphor/ph-fill.css',
    './assets/libs/phosphor/ph-duotone.css',
    // Font dosyaları
    './assets/libs/inter.css',
    './assets/libs/fonts/inter-400.ttf',
    './assets/libs/fonts/inter-500.ttf',
    './assets/libs/fonts/inter-600.ttf',
    './assets/libs/fonts/inter-700.ttf',
    './assets/libs/fonts/inter-800.ttf',
    './assets/libs/fonts/inter-900.ttf',
    './assets/libs/phosphor/phosphor.woff2',
    './assets/libs/phosphor/phosphor-thin.woff2',
    './assets/libs/phosphor/phosphor-light.woff2',
    './assets/libs/phosphor/phosphor-bold.woff2',
    './assets/libs/phosphor/phosphor-fill.woff2',
    './assets/libs/phosphor/phosphor-duotone.woff2',
    './favicon.ico'
];

// Kurulum: Dosyaları önbelleğe al ve beklemeden aktif ol (Sessiz Güncelleme)
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Kullanıcıyı bekletmeden yeni versiyona geç
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// Aktifleştirme: Eski önbellekleri temizle ve kontrolü ele al
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.map((key) => {
                if (key.startsWith('GLKOAI-') && key !== CACHE_NAME) return caches.delete(key);
            })
        )).then(async () => {
            await self.clients.claim();
            // Aktif olunca cache adını tüm istemcilere bildir
            const allClients = await self.clients.matchAll({ includeUncontrolled: true });
            allClients.forEach(client => client.postMessage({ cacheName: CACHE_NAME }));
        }) // Sayfa yenilenmeden kontrolü al
    );
});

// Uygulama isteyince cache adını gönder
self.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'get-cache-name' && event.source) {
        event.source.postMessage({ cacheName: CACHE_NAME });
    }
});

// Fetch: İnternet yoksa önbellekten getir
self.addEventListener('fetch', (event) => {
    // Sayfa geçişleri için
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match('./index.html'))
        );
        return;
    }
    
    // 2. VİDEO İNDİRME OPTİMİZASYONU (.mp4)
    // HTTP Range header desteği: Kullanıcı video'yu scrub ederken kısmi indirme yapabilir
    // Offline durumda: Cache'den kısmi içerik sunulur (206 Partial Content)
    if (event.request.url.endsWith('.mp4')) {
        event.respondWith((async () => {
            const rangeHeader = event.request.headers.get('range');
            const cache = await caches.open(CACHE_NAME);

            // Cache'den tam video dosyasını al (URL bazlı eşleşme)
            const cached = await cache.match(event.request.url);

            if (rangeHeader && cached) {
                const size = cached.headers.get('content-length');
                const bytes = RANGE_PATTERN.exec(rangeHeader);
                if (bytes && size) {
                    const start = Number(bytes[1]);
                    const end = bytes[2] ? Number(bytes[2]) : Number(size) - 1;
                    const chunk = await cached.arrayBuffer().then((buf) => buf.slice(start, end + 1));
                    return new Response(chunk, {
                        status: 206,
                        statusText: 'Partial Content',
                        headers: {
                            'Content-Range': `bytes ${start}-${end}/${size}`,
                            'Content-Length': String(chunk.byteLength),
                            'Content-Type': 'video/mp4'
                        }
                    });
                }
            }

            if (cached && !rangeHeader) return cached;

            try {
                const networkResponse = await fetch(event.request);
                if (networkResponse && networkResponse.ok) {
                    cache.put(event.request.url, networkResponse.clone());
                }
                return networkResponse;
            } catch (err) {
                // Ağ yoksa cache'e düş
                if (cached) return cached;
                return new Response('', { status: 503, statusText: 'Offline' });
            }
        })());
        return;
    }

    // 3. DİĞER DOSYALAR (Dinamik Cache-First Strateji)
    // Önbellekte varsa kullan, yoksa ağdan çek ve cache'le (güvenlik filtreli)
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Adım 1: Önbellekte varsa hemen döndür (offline uyumlu)
            if (response) return response;

            // Adım 2: Ağdan çek ve güvenlik kontrolünden geçir
            return response || fetch(event.request).then((networkResponse) => {
                // GÜVENLİK FİLTRESİ: İçerik doğrulama
                // ✓ Geçerli HTTP 200 yanıtı
                // ✓ GET metodu (POST/DELETE vb. cache'lenmesin)
                // ✓ HTTPS/HTTP protokolü (blob: , data: vb. yoksay)
                // ✗ Chrome eklentilerinden gelen istekler filtrelenir
                if (
                    !networkResponse ||
                    networkResponse.status !== 200 ||
                    event.request.method !== 'GET' ||
                    !event.request.url.startsWith('http')
                ) {
                    return networkResponse;
                }

                // Geçerliyse kopyasını alıp cache'e at
                const responseToCache = networkResponse.clone();
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                    return networkResponse;
                });
            });
        })
    );
});
