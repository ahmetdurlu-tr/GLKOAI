const APP_GUIDE_DATA = [
  {
    id: 'settings',
    title: 'MENÜ',
    icon: 'ph-list',
    color: 'text-slate-300',
    desc: 'Hızlı analiz, doktor raporu oluşturma, veri yedekleme, geri yükleme ve sıfırlama işlemleri.',
    features: [
      '<span class="text-blue-400 font-bold">Ayarlar:</span> Uygulama tanıtımı, yedek alma, yedek yükleme, yemek veritabanını sıfırlama ve tüm verileri silme işlemlerini içerir.',
      '<span class="text-amber-400 font-bold">Yazdır:</span> Kayıtlı sağlık verilerinizi PDF formatında kaydedebilir veya doğrudan yazıcıdan çıktı alabilirsiniz. Bunun için kayıtlar listesinde “detaylı” görünüm seçili olmalıdır.',
      '<span class="text-emerald-400 font-bold">Raporu Kopyala:</span> Beslenme, şeker, tansiyon ölçümleri ve profil bilgilerinizle birlikte kapsamlı bir doktor raporu oluşturur ve panoya kopyalar. E-posta veya mesajlaşma uygulamalarına doğrudan yapıştırabilirsiniz.',
      '<span class="text-red-400 font-bold">Analiz Yapıştır:</span> Panoya kopyaladığınız doktor raporunu veya yapay zekâ analiz sonucunu arşivlemek ve daha sonra doktorunuza sunmak üzere saklamanızı sağlar.'
    ],
    scenarios: [
      'Verileriniz yalnızca cihazınızda saklanır. Uygulama herhangi bir veri toplamaz ve sunucuya göndermez.',
      'Veri güvenliğiniz için haftalık düzenli yedekleme yapmanız önerilir.',
      'Cihaz değişikliği yapmadan önce mutlaka yedek alınız.',
      'Aldığınız yedekleri dilediğiniz cihaza aktararak kullanmaya devam edebilirsiniz.',
      'Kayıtlar sekmesinde görünüm modunu değiştirerek (ikon + noktalar) verilerinizi özet veya detaylı şekilde yazdırabilirsiniz.'
    ]
  },
  {
    id: 'settings',
    title: 'AYARLAR & VERİ',
    icon: 'ph-gear',
    color: 'text-slate-300',
    desc: 'Veri yedekleme, geri yükleme, sıfırlama yönetimi ve offline çalışma.',
    features: [
      '<span class="text-blue-400 font-bold">Tanıtımı İzle:</span> Uygulamanın temel özelliklerini bilgilendirme kartları halinde görüntüler.',
      '<span class="text-blue-400 font-bold">Yedek Kaydet:</span> Verilerinizi "G{tarih-saat}.json" formatında cihazınıza kaydeder.',
      '<span class="text-amber-400 font-bold">Yedeği Yükle:</span> Daha önce almış olduğunuz yedek dosyasını seçerek verilerinizi geri yükler.',
      '<span class="text-emerald-400 font-bold">Yemekleri Sıfırla:</span> Oluşturduğunuz kişisel yemek kütüphanesini temizler ve varsayılan listeye döndürür.',
      '<span class="text-red-400 font-bold">Her Şeyi Sil:</span> Tüm kayıtları ve ayarları kalıcı olarak siler. (Varsa) önceden alınan yedekten geri yükleme yapılabilir.',
      '<span class="text-purple-400 font-bold">Offline Mod:</span> İnternet bağlantısı olmadan çalışır. Tüm veriler cihazınızda saklanır.',
      '<span class="text-indigo-400 font-bold">Ana Ekrana Ekle (PWA):</span> Uygulamayı telefonunuza yükleyerek daha hızlı erişim ve tam ekran deneyimi elde edebilirsiniz.'
    ],
    scenarios: [
      'Uygulama kullanımını tanıtım kartlarından hızlıca öğrenebilirsiniz.',
      'Kütüphanede bulunmayan ve sık tükettiğiniz yemekleri ekledikçe kişisel listeniz oluşur; sık kullanılanlar otomatik olarak üst sıralara yerleşir.',
      'Verileriniz şifrelenmeden, yalnızca cihazınızın yerel hafızasında saklanır.',
      'İnternet olmadan da tüm özellikleri kullanabilirsiniz.',
      'Telefona yükledikten sonra uygulama simgesi ana ekranınızda belirir.'
    ]
  },
  {
    id: 'profile',
    title: 'KLİNİK PROFİL & TIBBİ GEÇMİŞ',
    icon: 'ph-file-text',
    color: 'text-blue-400',
    desc: 'Kişisel sağlık verileri, detaylı tıbbi anamnez, laboratuvar sonuçları ve doktor raporu merkezi.',
    features: [
      '<span class="text-indigo-400 font-bold">Vücut Analizi:</span> Vücut Kitle İndeksi (BMI), vücut yağ oranı, kas kütlesi ve Bazal Metabolizma Hızı (BMR) hesaplamaları.',
      '<span class="text-emerald-400 font-bold">İlaç Yönetimi:</span> Diyabet, tansiyon ve kan sulandırıcı ilaçların detaylı takibi, kullanım endikasyonları ve renk kodlaması.',
      '<span class="text-rose-400 font-bold">Travma & Yoğun Bakım:</span> Kaza geçmişi, kırık detayları (femur, kalça vb.), organ yaralanmaları, implantlar ve yoğun bakım süreçleri.',
      '<span class="text-amber-400 font-bold">Risk Analizi:</span> Sigara (paket/yıl hesabı), alkol tüketimi, insülin direnci (HOMA-IR) ve hipertansiyon hedef organ hasarı takibi.',
      '<span class="text-teal-400 font-bold">Lab & Taramalar:</span> HbA1c, kolesterol, kreatinin değerleri; oftalmolojik, podolojik ve kardiyolojik taramalar ile aşı takvimi.',
      '<span class="text-orange-400 font-bold">Diyet Sihirbazı:</span> Beslenme planınızı yapay zekâya hazırlattırın. Diyete uygun lezzetli tarifleri seçeneklerini görebilirsiniz.',
      '<span class="text-cyan-400 font-bold">Hedef Modu Hızlı Değiştirme:</span> Hedef kutusu (70-180) üzerine tıklayarak Sıkı (70-140), Standart (70-180) ve Esnek (90-200) modları arasında hızlıca geçiş yapabilirsiniz.',
      '<span class="text-blue-400 font-bold">Doktor Raporu:</span> Tüm klinik verilerinizi ve son 30 günlük ölçüm istatistiklerinizi içeren profesyonel bir PDF raporu oluşturur.'
    ],
    scenarios: [
      'Profilinizi doğru ve eksiksiz bilgilerle doldurunuz. Doktor raporu, hızlı analiz ve yapay zekâ yorumları bu verileri temel alır.',
      'Aktivite düzeyi, günlük su ve kalori hedeflerinizi belirleyin. Vücut kompozisyonu verileri eklendikçe otomatik hesaplanır; dilerseniz manuel giriş de yapabilirsiniz.',
      'Diyabet, tansiyon ve kan sulandırıcı ilaçlar bölümüne tanı tarihini, kullanılan ilaçları ve kullanım amaçlarını kaydedin.',
      'Diğer ilaçlarınızı "Klinik Detaylar" bölümünden sisteme ekleyebilirsiniz.',
      'Doktor randevunuzdan önce son laboratuvar sonuçlarınızı ve tıbbi geçmişinizi rapora işleyin.',
      'Acil durumlar için alerji, implant ve kronik hastalık bilgilerinizin güncel olduğundan emin olun.',
      'Kilo kontrolü hedefleriniz için vücut yağ oranı ve kas kütlesi değişimlerini izleyin.'
    ]
  },
  {
    id: 'print',
    title: 'YAZDIR',
    icon: 'ph-printer',
    color: 'text-emerald-400',
    desc: 'Raporları fiziksel çıktı almak üzere hazırlayın.',
    features: [
      'Yazıcınız mevcutsa doğrudan renkli baskı alabilirsiniz.',
      'Ölçüm sonuçlarını yazdırmak için "Kayıtlar" bölümünde ilgili kayıtların görünür olması gerekir. Yalnızca belirli bir kategoriyi (şeker, tansiyon vb.) yazdırmak isterseniz, filtreleme ikonlarını kullanın.',
      'Kayıtlar bölümünde “Tümü”, “Son 7 Gün”, “Son 15 Gün” veya “Son 30 Gün” seçeneklerinden birini belirleyerek çıktı alabilirsiniz.',
      'PDF Kaydı: Yazıcı seçim ekranında “PDF olarak kaydet” seçeneğini kullanabilirsiniz.'
    ],
    scenarios: [
      'Doktor kontrolüne gitmeden önce son 30 günlük verilerin çıktısını almanız önerilir.',
      '“Rapor Al” bölümünü kullanarak doğrudan PDF formatında rapor oluşturabilirsiniz.'
    ]
  },
  {
    id: 'copy',
    title: 'RAPORU KOPYALA',
    icon: 'ph-copy',
    color: 'text-indigo-400',
    desc: 'Doktor raporu ve yapay zekâ analizi için verilerinizi kopyalayın.',
    features: [
      'Akıllı Özet: Son verileri, istatistikleri ve profil özetini düz metne dönüştürür.',
      'AI Formatı: ChatGPT, Claude gibi dil modellerine yapıştırmaya uygun formatta (prompt) metin hazırlar.',
      'Hızlı Erişim: Menü > Raporu Kopyala ile tek tıkla panoya kopyalama.'
    ],
    scenarios: [
      'Doktorunuzla paylaşmak için raporu kopyalayıp e-posta veya mesajla gönderebilirsiniz.',
      'Yapay zekâ araçlarına (ChatGPT, Gemini, Claude) yapıştırarak analiz yaptırabilirsiniz.',
      'Kopyalanan metin otomatik olarak cihazınızın panosuna kaydedilir.'
    ]
  },
  {
    id: 'paste-analysis',
    title: 'ANALİZ YAPIŞTIR',
    icon: 'ph-clipboard-text',
    color: 'text-rose-400',
    desc: 'Yapay zekâ analiz sonuçlarını veya raporları uygulamada saklayın.',
    features: [
      'Markdown Desteği: Yapay zekâ yanıtlarını Markdown formatında görüntüler.',
      'Arşivleme: Analizlerinizi saklar, istediğiniz zaman geri okuyabilirsiniz.',
      'Otomatik veya Manuel: Panodaki metni otomatik algılar veya manuel yapıştırabilirsiniz.',
      'Paylaşım: Kaydedilen analizi doktorunuza gösterebilir veya yazdırabilirsiniz.'
    ],
    scenarios: [
      'Yapay zekâdan aldığınız sağlık analizini kopyalayıp buraya yapıştırın.',
      'Menü > Analiz Yapıştır seçeneği ile panodan otomatik okur.',
      'Kaydedilen analizleri daha sonra Menü > Geçmiş Analizler bölümünden görüntüleyebilirsiniz.',
      'Doktor randevunuzda telefonu göstererek analiz sonuçlarını paylaşabilirsiniz.'
    ]
  },
  {
    id: 'reports',
    title: 'HIZLI ANALİZ',
    icon: 'ph-chart-line-up',
    color: 'text-blue-400',
    desc: 'Hızlı istatistikler ve grafiksel veri analizi.',
    features: [
      'Bu veriler mutlaka bir hekim tarafından değerlendirilmelidir. Hekiminizin talimatları her zaman esastır.',
      'Hatalı kullanım veya yanlış yorumlama tamamen kullanıcının sorumluluğundadır. Analiz sonuçları kesin tanı içermez, yalnızca tahmini bilgi sunar.',
      'Glikoz ortalaması: Girilen geçerli ölçümlerin ortalamasıdır; laboratuvar HbA1c sonucu değildir.',
      'Varyasyon (CV): Şeker değerlerinin dalgalanma/değişkenlik oranı.',
      'Tansiyon Yükü: Yüksek tansiyon ölçümlerinin toplam ölçümler içindeki oranı.',
      'Trend Grafiği: Şeker ve tansiyon değerlerinin zaman içindeki değişim eğrisi.',
      '<span class="text-emerald-400 font-bold">Grafik Zoom & Kaydırma:</span> Grafikte fare tekerleği veya parmakla yakınlaştırma (pinch zoom) ve kaydırma yapabilirsiniz.',
      '<span class="text-purple-400 font-bold">Grafik Detayları:</span> Grafiğe 1 saniye basılı tutarak mavi/kırmızı/pembe çizgilerin ne anlama geldiğini öğrenebilirsiniz.'
    ],
    scenarios: [
      'Kayıtlı verilerinize dayanarak ölçümlerinizin genel seyrini hızlıca görüntüleyin.',
      'Grafikteki dar zaman aralıklarını incelemek için zoom yapabilirsiniz.',
      'Grafiğe uzun basarak çizgilerin anlamını görebilirsiniz.',
      'Tedavi ve takipler mutlaka doktor kontrolünde sürdürülmelidir.',
      'Sunulan analizler yalnızca fikir verme amaçlıdır.',
      'Sonuçların klinik yorumu doktorunuz tarafından yapılmalıdır.'
    ]
  },
  {
    id: 'card-sorting',
    title: 'VERİ GİRİŞ KARTLARI SIRALAMA',
    icon: 'ph-arrows-out-cardinal',
    color: 'text-amber-400',
    desc: 'Glikoz, tansiyon, beslenme, aktivite ve hissiyat kartlarını istediğiniz sıraya göre düzenleyin.',
    features: [
      '<span class="text-blue-400 font-bold">Sürükle-Bırak:</span> Her kartın sol kenarındaki altı noktalı ikonu tutup sürükleyerek kartları yeniden sıralayabilirsiniz.',
      '<span class="text-emerald-400 font-bold">Özel Düzen:</span> Sıralama tercihiniz cihazınızda saklanır, bir sonraki açılışta aynı düzende görünür.',
      '<span class="text-purple-400 font-bold">Kolay Erişim:</span> En sık kullandığınız kartları üste taşıyarak hızlı veri girişi yapabilirsiniz.'
    ],
    scenarios: [
      'Örneğin tansiyon takibi yapıyorsanız tansiyon kartını en üste taşıyabilirsiniz.',
      'Kartların sırası değiştiğinde otomatik olarak kaydedilir.'
    ]
  },
  {
    id: 'nutrition',
    title: 'BESLENME SEÇİMİ',
    icon: 'ph-carrot',
    color: 'text-blue-400',
    desc: 'Öğün takibi ve kalori yönetimi.',
    features: [
      'Akıllı Arama: Veritabanında hızlı yemek arama.',
      'Diyet Sihirbazı: Yapay zekâ desteğiyle yemek listesi önerileri oluşturma.',
      'Kalori Hesabı: Seçilen porsiyona göre otomatik kalori hesaplama.',
      'Su ve Kalori Takibi: Günlük su ve toplam kalori tüketimini kaydetme.'
    ],
    scenarios: [
      'Tükettiğiniz yemeği aratın, porsiyonu seçin ve “Tamam” butonuna basın. Vazgeçerseniz “-” (eksi) tuşuyla miktarı sıfırlayabilirsiniz.',
      'Listede bulunmayan bir yemek eklediğinizde, bu öğün kalori hesabına yansımaz. Listeden en yakın muadili seçerseniz yaklaşık kalori hesaplanır.',
      'Hatalı eklenen bir yemeği silmek için ilgili öğeye uzun basınız.',
      'Profilde tanımladığınız ilaçlar burada listelenir. İlacı aldığınızda işaretleyerek kayıt kartına ekleyebilirsiniz. Kullanılan ilaçlar, seçilen renkte kayıt kartlarında ve “Hissiyat / Belirti” sekmesinde renkli nokta ile temsil edilir.'
    ]
  },
  {
    id: 'activity',
    title: 'AKTİVİTE',
    icon: 'ph-person-simple-run',
    color: 'text-orange-400',
    desc: 'Egzersiz ve fiziksel aktivite kaydı.',
    features: [
      'Aktivite Türleri: Yürüyüş, koşu, yüzme vb. seçenekler.',
      'Süre: Dakika bazında süre girişi.',
      'Özelleştirme: Yeni aktivite türleri tanımlama.'
    ],
    scenarios: [
      'Egzersiz sonrasında süreyi girerek aktivitenizi kaydedin.'
    ]
  },
  {
    id: 'glucose',
    title: 'GLİKOZ ÖLÇÜMÜ',
    icon: 'ph-drop',
    color: 'text-teal-400',
    desc: 'Kan şekeri ölçüm kayıtları.',
    features: [
      'Kategoriler: Açlık, tokluk, yemek öncesi ve kontrol ölçümleri.',
      'İlaç Seçimi: Profilinizde tanımlı şeker ilaçları burada listelenir.',
      'Risk Uyarısı: Düşük (kırmızı), normal (yeşil) ve yüksek (sarı) değerlerde renkli görsel uyarı.'
    ],
    scenarios: [
      'Ölçüm sonucunu girin, ilgili kategoriyi seçin ve kaydedin.',
      'Açlık ve tokluk takibi için “yemek öncesi” kategorisini seçtiğinizde, uygulama 2. saat tokluk ölçümü için alarm kurmanızı önerir.',
      'Ölçüm esnasında aldığınız ilacı işaretleyerek ilaç uyumunuzu takip edebilirsiniz.',
      'Hedef aralığınız (Standart: 70-180 mg/dL, Esnek: 90-200 mg/dL, Sıkı: 70-140 mg/dL) doktor önerisine göre ayarlanabilir. Anlık değerler renk kodlarıyla gösterilir.'
    ]
  },
  {
    id: 'bp',
    title: 'TANSİYON',
    icon: 'ph-heartbeat',
    color: 'text-rose-500',
    desc: 'Tansiyon ve nabız takibi.',
    features: [
      'Sistolik/Diastolik: Büyük ve küçük tansiyon veri girişi.',
      'Nabız: Dakikadaki kalp atış hızı.',
      'Risk Uyarısı: Yüksek değerlerde görsel uyarı sistemi.'
    ],
    scenarios: [
      'Tansiyon ilacınızı aldıysanız kayda işlemeyi unutmayın.',
      'Ölçüm ile eş zamanlı kullanılan ilaçları işaretleyerek takip edebilirsiniz.',
      'Anormal değerlerde vakit kaybetmeden doktorunuza başvurunuz.'
    ]
  },
  {
    id: 'symptoms',
    title: 'HİSSİYAT VE BELİRTİLER',
    icon: 'ph-warning-octagon',
    color: 'text-amber-400',
    desc: 'Fiziksel durum ve semptom kaydı.',
    features: [
      'Hızlı Seçim: Baş ağrısı, halsizlik gibi yaygın belirtiler.',
      'Özel Belirti: Listede olmayan şikayetleri manuel ekleme.',
      'Çoklu Seçim: Birden fazla belirtiyi aynı anda kaydedebilme.'
    ],
    scenarios: [
      'Belirtileri; ölçüm ve beslenme kayıtlarıyla ilişkilendirerek kaydedebilirsiniz.'
    ]
  },
  {
    id: 'assistant',
    title: 'AKILLI ASİSTAN',
    icon: 'ph-bell-ringing',
    color: 'text-violet-400',
    desc: 'İlaç ve ölçüm hatırlatıcıları.',
    features: [
      'Hatırlatıcılar: Kartları takvime aktarabilirsiniz. Bildirimler takvim uygulamasının destek ve ayarlarına bağlıdır.',
      'Notlar: Doktorunuza soracaklarınız veya günlük notlar.',
      'Takvim Entegrasyonu: Hatırlatmaları telefon takvimine senkronize etme (ICS dosyası ile Google Calendar, Outlook vb.).',
      'Günlük Seçimi: Her alarm için haftanın istediğiniz günlerini seçerek özelleştirin.',
      'Otomatik Sıralama: Alarmlar zaman sırasına göre otomatik olarak düzenlenir.'
    ],
    scenarios: [
      'Sabah ilaçlarınız için tekrarlı alarm kurabilirsiniz.',
      'Günlük beslenme, egzersiz ve su tüketim hedeflerinizi kaydederek uyarılar alabilirsiniz.',
      'Alarm kartlarında günleri seçerek haftanın belirli günlerinde hatırlatma ayarlayabilirsiniz.',
      '"Takvime Aktar" butonu ile tüm alarmlarınızı bir seferde telefon takviminize aktarabilirsiniz.',
      'İndirilen ICS dosyasına tıklayarak alarmları takvim uygulamanıza içe aktarın.'
    ]
  },
  {
    id: 'ai',
    title: 'YAPAY ZEKÂ ANALİZİ',
    icon: 'ph-sparkle',
    color: 'text-indigo-400',
    desc: 'Verilerin yapay zekâ destekli yorumlanması.',
    features: [
      'Model Seçimi: Gemini, GPT, Claude vb. modeller arası tercih.',
      'Otomatik Prompt: Verilerinizi analiz için optimize edilmiş metne dönüştürür.',
      'Yönlendirme: Seçilen yapay zekâ servisine tek dokunuşla geçiş.',
      'Analiz Geçmişi: Yapılan analizleri kaydetme ve sonradan görüntüleme.',
      'Sonuç Görüntüleyici: Yapay zekâ yanıtlarını Markdown formatında okuma.'
    ],
    scenarios: [
      'Haftalık veya aylık verilerinizi yorumlatmak için kullanabilirsiniz.',
      'Geçmiş analizlerinizi inceleyerek sağlık sürecindeki ilerlemenizi karşılaştırabilirsiniz.'
    ]
  },
  {
    id: 'records',
    title: 'KAYITLAR',
    icon: 'ph-list-dashes',
    color: 'text-slate-300',
    desc: 'Geçmiş veri listesi ve filtreleme seçenekleri.',
    features: [
      'Görünüm Modları: Gizli (👁️‍🗨️), Özet/Günlük (▦), Detaylı (☰) - ikon + nokta göstergeleriyle.',
      'Filtreleme: Şeker, Tansiyon, Beslenme, Egzersiz, Hissiyat/Belirti.',
      'Tarih Aralığı: Son 7, 15, 30 gün veya Tümü.'
    ],
    scenarios: [
      'Kayıtları ihtiyacınıza göre farklı modlarda görüntüleyebilirsiniz.',
      'Kategori bazlı filtreleme yaparak aradığınız verilere kolayca ulaşabilirsiniz.'
    ]
  },
  {
    id: 'cards',
    title: 'KAYIT KARTLARI',
    icon: 'ph-cards',
    color: 'text-slate-400',
    desc: 'Tekil kayıt detayları ve yönetimi.',
    features: [
      'Günlük Görünüm: Kart başlığında tarih, günlük su tüketimi, yapılan ölçümler ve adetleri özetlenir.',
      'Gün Kartı: Başlığa tıklandığında o güne ait tüm kayıtlar açılır. Her kartta ölçüm saati, kategori, içerik, kullanılan ilaç renk göstergeleri ile düzenleme ve silme ikonları bulunur.',
      'Beslenme Kartı: Tıklandığında tüketilen besinler, toplam kalori ve varsa kullanılan ilaçlar görüntülenir.',
      'Şeker / Tansiyon Kartı: Ölçüm değeri, kullanılan ilaç ve eklenen hissiyat/belirti bilgileri yer alır.',
      'Egzersiz / Hissiyat Kartı: Aktivite süresi ve detaylı belirti bilgileri görüntülenir.',
      'Düzenleme: Kalem ikonu ile kayıtlarda değişiklik yapma.',
      'Silme: Çöp kutusu ikonu ile kaydı silme.',
      'Görsel İpuçları: Kategorilere özgü renkli kenarlıklarla kolay ayrım.'
    ],
    scenarios: [
      'Hatalı girilen bir değeri düzeltmek için ilgili karta tıklayarak düzenleme yapabilirsiniz.'
    ]
  }
];

// YENİ: TANITIM KARTLARI (ONBOARDING)
const ONBOARDING_SLIDES = [
  {
    // 1. KART: Giriş
    image: 'assets/img/karşılama.png', // Varsa görsel yolu, yoksa boş bırakın ikon görünür
    icon: 'ph-hand-waving',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    title: 'KONTROL SİZDE',
    desc: 'Sağlıklı bir yaşam yolculuğuna adım atın <br> Ölçümleyin, analiz edin, yönetin... '
  },
  {
    // 2. KART: Video
    // Video dosyanızın yolunu buraya yazın (Örn: assets/img/intro.mp4)
    image: 'assets/img/intro-uyumlu.mp4', 
    title: 'YAPAY ZEKA DESTEKLİ ANALİZ',
    desc: 'Sağlıklı biGemini ve GPT entegrasyonu ile verilerinizi işleyin, saniyeler içinde tıbbi içgörü kazanın.',
    // Aşağıdakiler video modunda kullanılmaz ama hata vermemesi için kalabilir
    icon: 'ph-play', color: 'text-white', bg: 'bg-black'
  },
   {
    // 3. KART: Kullanım Kılavuzu
    image: 'assets/img/kklogo.png',
    icon: 'ph-rocket-launch',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    title: 'Kılavuz için logoya tıklayın',
    desc: 'GLKOAI uygulamasının tüm yeteneklerini keşfedin.'
  },
  {
    // 3. KART: Bitiş
    image: 'assets/img/son.png',
    icon: 'ph-rocket-launch',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    title: 'Klinik Profilinizi Oluşturun',
    desc: 'Bugünün eksiksiz verileri, yarının sağlığıdır.<br> GLKOAI ile yönetime başlayın...'
  }
];