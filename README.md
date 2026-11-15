# GLK AI — Akıllı Sağlık Asistanı

Tarayıcıda çalışan, sağlık ve günlük yaşam kayıtlarını takip etmek için geliştirilmiş statik web uygulaması.

## Yerel çalıştırma

Uygulama klasöründe şu komutu çalıştırın:

```sh
python3 -m http.server 8770
```

Ardından `http://localhost:8770/` adresini açın. Aynı ağdaki cihazlar için gerekirse `--bind 0.0.0.0` kullanın. Dosyayı doğrudan `file://` ile açmak yerine HTTP sunucusu kullanın.

## Yayınlama

Bu klasör statik olarak sunulabilir; yayın kökü `index.html` dosyasını içeren klasördür ve derleme komutu gerekmez. GitHub Pages veya statik site sunucusunda HTTPS kullanın. Proje alt dizinde yayınlanacaksa uygulamayı o dizinin köküne yerleştirin. Çevrimdışı çalışma ve güncellemeler servis çalışanına bağlıdır; sürüm değişikliklerinde `app.js` içindeki `SW_VERSION` ile `sw.js` içindeki `CACHE_VERSION` aynı tutulmalı ve değişen önbellekli dosyaların sürümlü adresleri güncellenmelidir.

## Veri

Kişisel kayıtlar tarayıcının yerel depolamasında tutulur; kod deposuna otomatik olarak aktarılmaz. Tarayıcı verilerinin silinmesi kayıtları etkileyebilir; uygulamanın yedekleme işlevini kullanın. Örnek test JSON dosyaları ve yerel yedekler Git dışında bırakılmıştır. Özel sağlık verilerini, API anahtarlarını veya kişisel yedekleri depoya eklemeyin.

YZ bağlantıları ve takvime aktarma gibi isteğe bağlı özellikler harici hizmetler açabilir. Yayınlamadan önce kullandığınız üçüncü taraf kütüphanelerin ve görsellerin dağıtım izinlerini değerlendirin.
