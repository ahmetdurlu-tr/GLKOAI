# Ülke gıda listeleri: araştırma ve mevcut durum

Tarih: 10 Kasım 2026. Bu dosya uygulamanın tüketim listesi değildir; araştırma notudur.

## Ürün kararı

- Her ülke listesi o ülkedeki güncel tüketim araştırmaları ve yerel yemek tarifleri ayrı incelenerek hazırlanacak. Geleneksel yemekler ile günlük yaygın tüketim birbirine eşit sayılmayacak.
- Uygulama dili ve yemek listesinin dili bağımsız olacak. Bir ülke listesindeki gıda adı o listenin yerel adıyla gösterilecek; aynı malzemenin farklı ülkelerdeki kayıtları birbirinden bağımsız olacak. Arama için gerektiğinde başka dillerde takma adlar eklenebilecek.
- Hazır yemeklerde farklı tarifler ve pişirme biçimleri ayrı kayıt olacak. Kalori değeri yenebilir, hazır ürünün 100 g veya 100 ml'si için açıkça yaklaşık değer olacak. Kaynak, ürün veya tarif, varsayım ve birim kayıt altında tutulacak.
- Ülkeler içindeki bölgesel ve bireysel farklılıklar korunacak. Hindistan için tek bir Hint dili veya tek bir mutfak varsayılmayacak; adların dili ya da romanizasyonu belirtilerek bölgeye göre alt listeler değerlendirilecek.
- Sıklık verisi olmayan bir yiyecek 'en çok tüketilen' diye etiketlenmeyecek. Beslenme tavsiyeleri, tüketim araştırmalarındaki fiilî tüketim olarak sunulmayacak.
- Var olan kullanıcı yemekleri, kayıtlar ve tarihî kalori değerleri korunacak. Eski ortak liste kayıtlarının geçişi kullanıcı verileri kaybedilmeden ayrıca tasarlanacak.

## Kaynaklar ve kapsamları

### Türkiye
Sağlık Bakanlığı Türkiye Beslenme ve Sağlık Araştırması (TBSA) 2017; besin grupları ve tüketim sıklığı verilerini içerir. Araştırmanın kapsadığı yıl ile yayın tarihi karıştırılmamalı.
https://hsgm.saglik.gov.tr/depo/birimler/saglikli-beslenme-ve-hareketli-hayat-db/Dokumanlar/Kitaplar/Turkiye_Beslenme_ve_Saglik_Arastirmasi_TBSA_2017.pdf

### Almanya
Max Rubner Enstitüsü NVS II / NEMONIT çalışmaları ekmek ve tahıl ürünleri, et ve et ürünleri, sebze ve süt ürünleri gibi grupları inceler. NVS II saha verileri 2005–2007 tarihlidir; günümüzdeki her yemeğin sıklığının doğrudan kanıtı değildir.
https://www.mri.bund.de/de/institute/ernaehrungsverhalten/forschungsprojekte/nvsii/
https://www.mri.bund.de/de/institute/ernaehrungsverhalten/forschungsprojekte/nemonit/

### Hindistan
ICMR-NIN What India Eats raporları bölgeler, kırsal/kentsel yerleşim ve yaş grupları arasında belirgin beslenme farklılıkları gösterir. Gıda gruplarına ilişkin bulgular tek tek yemeklerin popülerlik sıralaması olarak kullanılmamalı.
https://www.nin.res.in/nutrition2020/what_india_eats.pdf
https://www.nin.res.in/downloads/What_India_Eats%20Report_13th_April_23.pdf

### İtalya
CREA tüketim çalışmaları; ekmek, makarna, pizza ve zeytinyağı gibi gruplar hakkında bulgular sunar. Öğün ve ürün düzeyindeki araştırma ayrıntıları kullanılırken veri dönemi ve örneklem kontrol edilmeli.
https://www.crea.gov.it/web/alimenti-e-nutrizione/-/iv-scai-studio-sui-consumi-alimentari-in-italia
https://www.crea.gov.it/documents/59764/0/1_monografia_scai_parte_b_risultati_mod_21_2_2012.pdf/a6fd71f6-eb75-d5fb-839f-3266f559861f?t=1550822429591

### Fransa
ANSES INCA 3 raporu, yetişkinlerde kahvaltı tüketiminde ekmek, kahvaltılık tahıllar, hamur işleri ve sıcak içecekler gibi gruplara ilişkin veriler içerir. Bu sonuç her kişinin aynı kahvaltıyı yaptığını veya her örneğin aynı sıklıkta tüketildiğini göstermez.
https://www.anses.fr/sites/default/files/NUT2014SA0234Ra.pdf?download=1

### Birleşik Krallık
Ulusal beslenme araştırması (NDNS) 2019–2023 tüketim verilerini; Family Food ise satın alma miktarlarını raporlar. Satın alma miktarı ile kişilerin tüketim sıklığı aynı ölçüm değildir.
https://www.gov.uk/government/statistics/national-diet-and-nutrition-survey-2019-to-2023/national-diet-and-nutrition-survey-2019-to-2023-report
https://www.gov.uk/government/statistics/family-food-fye-2024/family-food-fye-2024

## Mevcut uygulamanın denetimi

- Altı ülkenin mevcut JSON dosyaları sırasıyla Türkiye 52, Almanya 44, Hindistan 45, İtalya 44, Fransa 43 ve Birleşik Krallık 47 kayıt içeriyor. Bunların miktarı, ulusal sıklık verisiyle tek tek doğrulandıkları anlamına gelmez.
- Ortak kimlikli 'water', 'tomato' gibi öğeler ülke listeleri arasında paylaşılıyor. `app.js` içindeki `displayedFoodName` bu öğelerin adını ülkeye göre değil, Türkçe/İngilizce arayüz diline göre seçiyor.
- Hindistan dosyasında genel ürünlerin yanında ayrı bir 'Dahi' kaydı da var. Kullanıcıya gösterilecek örtüşmeler ülke ve hazırlama türü bakımından incelenmeli.
- İtalya dosyasındaki genel 'beans' kaydının Türkçe adı 'Kuru fasulye'; bu ad pişmiş Türk yemeğiyle karışabilecek kadar belirsiz. Ülkeye ve hazırlanışa özgü açık adlandırma gerekli.
- Birçok kalori kaydı `generic_estimate` ve kaynağı doğrulanmamış olarak işaretli. Bu değerler güvenilir bir ülke tarifine dayandığı varsayılarak sunulmamalı.
- Mevcut listeler kapsamlı, kanıta dayalı en sık tüketilen yiyecek sıralaması olarak doğrulanmadı. Sadece adlarını çevirerek sorun çözülmez.

## Devam için doğrulama

Ülke başına en az 30–40 kayıt hazırlanırken kaynakların gıda veya yemek düzeyinde neyi gerçekten gösterdiği tek tek incelenecek; yerel isimler, hazırlanışlar, 100 g/ml kalori kaynakları ve veri lisansları belgelenecek. İstatistiksel dayanak yoksa sıralama iddiasında bulunulmayacak. Sonrasında ülke kimliği ve yerel ad desteği, kullanıcının geçmiş kayıtları ve elle eklenen gıdaları korunarak uygulanacak ve test edilecek.

## 10 Kasım 2026: günlük gıdaların eklenmesi

Türkiye, Almanya, Hindistan, İtalya, Fransa ve Birleşik Krallık paketlerine ekmek, süt, kahvaltılık, içecek ve sebze gibi başlangıç gıdaları eklendi. Bu seçimler ülkelere ait tüketim araştırmalarının **gıda grubu** bulgularından ve ülke diliyle kullanılan adlardan yararlanılarak hazırlandı; tek tek tüm gıdaların ulusal tüketim sıklığı doğrulanmış değildir. Liste turistik yemeklerin ulusal sıklık sıralaması olduğu iddiasında bulunmaz.

Her ülkeye özgü kimlik ve yerel ad uygulama dilinden bağımsız tutulmaktadır. Hindistan'da Roman harfli bazı Hintçe adların yanında anlaşılırlık için İngilizce açıklama vardır; ülkenin çok dilli ve bölgesel yapısı nedeniyle bunlar tüm Hindistan dilleri için tek doğru isim iddiası taşımaz. Kullanılmayan eski liste kayıtları kullanıcı kayıtlarını korumak amacıyla arşivlenir; geçmiş yemek kayıtları otomatik olarak silinmez.

Az sayıda temel gıda için USDA referans eşleştirmesi eklenmiştir (ör. haşlanmış yumurta, muz, havuç ve sade pirinç). Çok sayıda, özellikle karma yemeklerde, sayısal kalori değerleri hâlâ kaynağı tek tek doğrulanmamış yaklaşık tahmindir. Kullanıcı arayüzündeki uyarı bu sınırlamayı açıklar. Bu eksik kaynak eşleştirmesi tamamlanmadan tüm liste kalori değerleri doğrulanmış olarak nitelendirilemez.
