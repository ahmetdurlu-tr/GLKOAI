# 🧪 GLKOAI V66 - QA & DEPLOYMENT CHECKLIST

**Güncellenme:** 8 Şubat 2026  
**Durum:** Production-Hazırlık Aşamasında

---

## 1️⃣ SAYFALAR KONTROLÜ (5 dakika)

- [ ] **Ana Sayfa** → Load ok? Data görünüyor?
- [ ] **Ölçüm Ekle** → Form işliyor? Kayıt tutuluyor?
- [ ] **Beslenme** → Yemek ekleme çalışıyor? Silme ok?
- [ ] **Profil** → Bilgiler kaydediliyor? Save ok?
- [ ] **Rapor** → PDF çıktı alınıyor?
- [ ] **Ayarlar** → Export/Import işliyor?
- [ ] **Akıllı Hatırlatıcı** → Alarm ekleme/silme ok? Takvime Aktar butonuna tıkla → ICS indir + Takvim tab'ı aç?

---

## 2️⃣ MOBILE RESPONSIVE TEST (5 dakika)

**Chrome DevTools:**
1. F12 açıp `Ctrl+Shift+M` (Device Toggle)
2. iPhone 12, Pixel 5, Tablet modlarında test et

- [ ] Layout responsive?
- [ ] Butonlar tıklanabilir (minimum 44px)?
- [ ] Text readable (font size ≥12px)?
- [ ] Scroll smooth, hiçbir overflow?
- [ ] Tabbar mobilde accessible?

---

## 3️⃣ PWA MANIFEST & SERVICE WORKER (5 dakika)

**Chrome DevTools → Application Tab:**

- [ ] **Manifest.json** → Load ok? Icons gösteriyor?
- [ ] **Service Worker** → Registered? Active?
- [ ] **Cache Storage** → GLKOAI-* cache var mı?
- [ ] **Offline Indicator** → App çalışıyor mu?

---

## 4️⃣ OFFLINE MODE TEST (3 dakika)

**Chrome DevTools → Network → Offline seçip:**

- [ ] Sayfalar yüklenebiliyor?
- [ ] Data (ölçümler, yemekler) görünüyor?
- [ ] Form input'ları çalışıyor?
- [ ] "Offline" göstergesi var mı?

---

## 5️⃣ PRIVACY POLICY & TERMS (2 dakika)

- [ ] Footer'da "Gizlilik Politikası" linki?
- [ ] Footer'da "Şartlar & Koşullar" linki?
- [ ] İlgili sayfalar exist ve readable?

---

## 6️⃣ BULDUĞUN BUGS (DİNAMİK)

**Sorun bulursan buraya ekle:**

```
- [ ] [Bug Adı] - Çözüm: XXX
- [ ] [Responsive Issue] - Çözüm: XXX
- [ ] [Performance] - Çözüm: XXX
```

---

## 7️⃣ DEPLOYMENT CHECKLIST

### **Netlify** ✅ (Mevcut)
- [ ] URL test et: `https://?????.netlify.app`
- [ ] PWA install çalışıyor?
- [ ] Service Worker update ok mı?

### **Firebase**
- [ ] `firebase init` → config
- [ ] `firebase deploy` - Deploy et
- [ ] URL test: `https://glkoai.web.app`

### **Vercel**
- [ ] GitHub repo connect et
- [ ] `vercel deploy` veya web dashboard
- [ ] URL test: `https://glkoai.vercel.app`

### **PWA Builder (APK için)**
- [ ] https://pwabuilder.com → PWA URL gir
- [ ] APK indir
- [ ] Lokalde test et (emulator veya device)

### **Google Play Store**
- [ ] Publisher hesabı (Google Developer - $25)
- [ ] APK upload
- [ ] Gizlilik politikası URL ekle
- [ ] Screenshots ekle
- [ ] Description yaz
- [ ] Release → Production

---

## 📋 SONRAKI ADIMLAR

1. **QA Tamamla** (tüm itemleri check et)
2. **Bulduğun bugs'ları fix et**
3. **Firebase + Vercel deploy et**
4. **PWA Builder ile APK oluştur**
5. **Internal testing**: Telefonda test et
6. **Beta release**: 10-20 kişiye QR code paylaş
7. **Feedback topla**
8. **Play Store submission**

---

## 🔗 NETLIFY URL

**DEĞERLENDİR VE BURAYA YAPISTIR:**
```
https://?????.netlify.app
```

---

## ⚠️ ÖNEMLI NOTLAR

- **Service Worker versioning:** `CACHE_VERSION` kullanılıyor (`YYYYMMDD-Vxx-sss`)
- **Version bumping:** `node tools\bump-sw-version.js`
- **Takvim entegrasyonu:** ICS file + Google Calendar link
- **PWA manifest:** `manifest.json` - HTTPS gerekli

---

**Hazır mısın?** Başlayan zaman ilk todo'yu mark et: `manage_todo_list` ile güncelle.
