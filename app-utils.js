'use strict';

/**
 * ============================================
 * GLKOAI V15 - UTILITY FUNCTIONS MODULE
 * ============================================
 * Tüm yardımcı fonksiyonlar, sabitler ve hesaplamaları içerir
 * App.js'den refactor edilmiştir
 */

// ==========================================
// SABITLER VE GLOBAL DEĞIŞKENLER
// ==========================================
const DIET_VOWELS = new Set(['a','e','ı','i','o','ö','u','ü','A','E','I','İ','O','Ö','U','Ü']);
const WEEKDAY_LABELS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

let selectedMedColor = '#3b82f6'; // Varsayılan renk
let editingMedName = ''; // Düzenlenen ilacın orijinal adı
let isTimeManuallySet = false; // Saat manuel mi ayarlandı kontrolü

// ==========================================
// DİYET PROFİL AYARLARI
// ==========================================
function deriveDietCode(label) {
    if (!label) return 'AI';
    const cleaned = String(label).replace(/[^\p{L}\p{Nl}\s-]+/gu, ' ').replace(/\s+/g, ' ').trim();
    if (!cleaned) return 'AI';
    const words = cleaned.split(' ').filter(Boolean);
    const firstWord = words[0];
    const upper = (ch) => ch ? ch.toLocaleUpperCase('tr-TR') : '';
    let code = '';
    code += upper(firstWord[0]);

    let secondChar = '';
    for (let i = 1; i < firstWord.length; i++) {
        const ch = firstWord[i];
        if (!DIET_VOWELS.has(ch)) { secondChar = ch; break; }
    }
    if (!secondChar) {
        for (let w = 1; w < words.length; w++) {
            if (words[w] && words[w].length) {
                const candidate = words[w][0];
                if (!DIET_VOWELS.has(candidate)) { secondChar = candidate; break; }
            }
        }
    }
    if (!secondChar && firstWord.length > 1) secondChar = firstWord[1];
    if (!secondChar) secondChar = firstWord[0];
    code += upper(secondChar);

    let thirdChar = '';
    if (words.length > 1) thirdChar = words[1][0];
    if (!thirdChar && words.length > 2) thirdChar = words[2][0];
    if (!thirdChar) {
        for (let i = 2; i < firstWord.length; i++) {
            if (firstWord[i]) { thirdChar = firstWord[i]; break; }
        }
    }
    if (!thirdChar) thirdChar = 'X';
    code += upper(thirdChar);
    return code.slice(0, 3);
}

const RAW_DIET_PROFILES = [
    { id: 'general', label: 'Genel Beslenme', prompt: 'Türkiye standartlarında genel bir ev yemekleri listesi', icon: '🍽️', section: '🌍 Genel Beslenme', hidden: true },
    { id: 'breakfast', label: 'Kahvaltı Kültürü', prompt: 'Türk kahvaltı kültürü', icon: '🥚', section: '🌍 Genel Beslenme' },
    { id: 'low_gi', label: 'Düşük Glisemik İndeks', prompt: 'Glisemik İndeksi düşük gıdalar', icon: '', section: '🩸 Şeker (Diyabet)' },
    { id: 'diabetic', label: 'Diyabet Dostu (Genel)', prompt: 'Tip 2 Diyabet dostu öğünler', icon: '', section: '🩸 Şeker (Diyabet)' },
    { id: 'dash', label: 'DASH Diyeti', prompt: 'Hipertansiyon için DASH diyeti', icon: '', section: '❤️ Tansiyon & Kalp' },
    { id: 'mind', label: 'MIND Diyeti', prompt: 'Beyin ve kalp sağlığı odaklı MIND diyeti', icon: '', section: '❤️ Tansiyon & Kalp' },
    { id: 'akdeniz', label: 'Akdeniz Diyeti', prompt: 'Akdeniz diyeti', icon: '', section: '❤️ Tansiyon & Kalp' },
    { id: 'keto', label: 'Keto (Ketojenik)', prompt: 'Ketojenik diyet', icon: '', section: '⚖️ Kilo Kontrolü' },
    { id: 'low_carb', label: 'Düşük Karbonhidrat', prompt: 'Karbonhidrat içeriği azaltılmış öğünler', icon: '', section: '⚖️ Kilo Kontrolü' },
    { id: 'intermittent', label: 'Aralıklı Oruç (Hafif)', prompt: 'Aralıklı oruç (hafif) planı', icon: '', section: '⚖️ Kilo Kontrolü' },
    { id: 'vegan', label: 'Tam Vegan', prompt: 'Vegan beslenme', icon: '', section: '🥗 Özel & Alerji' },
    { id: 'gluten_free', label: 'Glutensiz', prompt: 'Glutensiz diyet', icon: '', section: '🥗 Özel & Alerji' },
    { id: 'anti_inflam', label: 'Anti-İnflamatuar', prompt: 'Anti-inflamatuar etkili öğünler', icon: '', section: '🥗 Özel & Alerji' }
];

const BUILT_DIET_PROFILES = RAW_DIET_PROFILES.map(profile => ({ ...profile, code: deriveDietCode(profile.label) }));
const DIET_PROFILE_MAP = BUILT_DIET_PROFILES.reduce((acc, profile) => { acc[profile.id] = profile; return acc; }, {});
const DIET_PROMPT_MAP = BUILT_DIET_PROFILES.reduce((acc, profile) => { acc[profile.id] = profile.prompt; return acc; }, {});

// ==========================================
// CIHAZ VE STORAGE FONKSİYONLARI
// ==========================================

function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function safeParseStorage(key, fallback) {
    const expectsArray = Array.isArray(fallback);
    const cloneFallback = () => {
        if (expectsArray) return [];
        if (fallback && typeof fallback === 'object') return { ...fallback };
        return fallback;
    };

    const raw = localStorage.getItem(key);
    if (!raw) return cloneFallback();

    try {
        const parsed = JSON.parse(raw);
        if (expectsArray) return Array.isArray(parsed) ? parsed : [];
        if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch (error) {
        // Error handling - no logging in production
    }

    return cloneFallback();
}

function safeGetProfile() {
    try {
        return safeParseStorage('userProfile', {});
    } catch (error) {
        return {};
    }
}

function safeSaveProfile(profile) {
    try {
        localStorage.setItem('userProfile', JSON.stringify(profile));
        return true;
    } catch (error) {
        return false;
    }
}

// ==========================================
// METIN VE FORMATLANDIRMA FONKSİYONLARI
// ==========================================

function setText(id, text) { 
    const el = document.getElementById(id); 
    if (el) el.textContent = text; 
}

function showToast(msg, type) { 
    if (window.GLKOAITestLanguage) msg = window.GLKOAITestLanguage.translate(msg);
    const existing = document.querySelectorAll('.toast-msg');
    existing.forEach(e => e.remove());
    
    const div = document.createElement('div');
    div.className = 'toast-msg app-toast fixed top-1/2 left-1/2 text-white shadow-2xl z-[9999] text-sm font-bold animate-fade-in-centered transition-all duration-300 backdrop-blur-md';
    div.dataset.toastType = ['error', 'warn', 'info'].includes(type) ? type : 'success';
    div.setAttribute('role', type === 'error' || type === 'warn' ? 'alert' : 'status');
    const icon = document.createElement('i');
    icon.className = `ph-fill ${type==='error'?'ph-warning-circle':(type==='warn'?'ph-warning':(type==='info'?'ph-info':'ph-check-circle'))} app-toast-icon`;
    icon.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.className = 'app-toast-text';
    label.textContent = String(msg ?? '');
    label.title = label.textContent;
    div.append(icon, label);
    document.body.appendChild(div);
    const longMessage = label.scrollWidth > label.clientWidth;
    if (longMessage) label.tabIndex = 0;
    setTimeout(() => { div.style.opacity = '0'; div.style.transform = 'translate(-50%, -40%) scale(0.95)'; setTimeout(() => div.remove(), 300); }, longMessage ? 12000 : 4000);
}

function getHumanDate(dateStr) { 
    const today = new Date().toLocaleDateString('tr-TR'); 
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('tr-TR'); 
    if (dateStr === today) return window.GLKOAITestLanguage ? window.GLKOAITestLanguage.translate('Bugün') : 'Bugün'; 
    if (dateStr === yesterday) return window.GLKOAITestLanguage ? window.GLKOAITestLanguage.translate('Dün') : 'Dün'; 
    return dateStr; 
}

function getWeekdayLabel(dateStr) {
    try {
        const [day, month, year] = dateStr.split('.').map(Number);
        const date = new Date(year, (month || 1) - 1, day || 1);
        if (Number.isNaN(date.getTime())) return '';
        if (window.GLKOAITestLanguage && window.GLKOAITestLanguage.currentLang === 'en') return date.toLocaleDateString('en-US', { weekday: 'long' });
        return WEEKDAY_LABELS[date.getDay()] || '';
    } catch (err) {
        return '';
    }
}

function capitalize(s) { 
    return s && s[0].toUpperCase() + s.slice(1); 
}

function escapeHtml(text) { 
    if (!text) return text; 
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;"); 
}

// ==========================================
// SAĞLIK HESAPLAMALARI
// ==========================================

function calculatePackYears() {
    const startEl = document.getElementById('smokingStart');
    const endEl = document.getElementById('smokingEnd');
    const amountEl = document.getElementById('smokingAmount');
    const resultEl = document.getElementById('smokingPackYears');
    
    if (!startEl || !endEl || !amountEl || !resultEl) return;
    
    const start = startEl.value;
    const end = endEl.value;
    const amount = parseInt(amountEl.value) || 0;
    
    if (!start || !end || amount === 0) return;
    
    const startDate = new Date(start + '-01');
    const endDate = new Date(end + '-01');
    
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                   (endDate.getMonth() - startDate.getMonth());
    
    if (months <= 0) return;
    
    const years = months / 12;
    const packYears = (amount * years) / 20;
    
    resultEl.value = packYears.toFixed(1);
}

function calculateAlcoholRisk() {
    const freq = document.getElementById('alcoholFrequency')?.value;
    const intens = document.getElementById('alcoholIntensity')?.value;
    const msgEl = document.getElementById('alcoholRiskMessage');
    
    if (!msgEl) return;
    
    let message = '';
    
    if (freq === 'ozel' && intens === 'hafif') {
        message = 'Alkolün etkileri kişisel sağlık durumu ve ilaçlara göre değişebilir; sağlık uzmanına danışın.';
    } else if (freq === 'ayda1-2' && intens === 'yuksek') {
        message = 'Tek seferde yüksek tüketim, kullandığınız ilaçların etkisini değiştirebilir.';
    } else if (freq === '3-6ay' && intens === 'orta') {
        message = 'Bu seçim karaciğer açısından güvenli olduğu anlamına gelmez; sağlık uzmanına danışın.';
    } else if (freq && intens) {
        message = 'Seçiminiz klinik değerlendirme için kaydedildi.';
    }
    
    if (message) {
        msgEl.textContent = message;
        msgEl.classList.remove('hidden');
    } else {
        msgEl.classList.add('hidden');
    }
}

function calculateAlcoholRegularRisk() {
    const days = parseInt(document.getElementById('alcoholWeeklyDays')?.value) || 0;
    const amount = parseInt(document.getElementById('alcoholFixedAmount')?.value) || 0;
    const msgEl = document.getElementById('alcoholRegularRiskMessage');
    
    if (!msgEl) return;
    
    const ky = days * amount * 52;
    let risk = 'Bilinmiyor';
    let message = '';
    
    if (ky < 7) risk = 'Düşük';
    else if (ky > 14) risk = 'Yüksek';
    else risk = 'Orta';
    
    if (days > 5) {
        message = 'Karaciğer dinlendirme uyarısı: Haftada 5+ gün tüketim, vücudunuzun dinlenme süresi azalıyor.';
    } else {
        message = `Klinik risk: ${risk}. Kümülatif yük: ${ky} birim/yıl.`;
    }
    
    msgEl.textContent = message;
    msgEl.classList.remove('hidden');
}

function calculateAlcoholFrequentRisk() {
    const days = document.getElementById('frequentDays')?.value;
    const minAmount = parseInt(document.getElementById('minAmount')?.value) || 0;
    const maxAmount = parseInt(document.getElementById('maxAmount')?.value) || 0;
    const time = document.getElementById('consumptionTime')?.value;
    const msgEl = document.getElementById('alcoholFrequentRiskMessage');
    
    if (!msgEl) return;
    
    let message = '';
    let risk = 'Düşük';
    
    if (maxAmount > 5) {
        risk = 'Yüksek';
        message = 'Yüksek risk: Tek seferde 5+ birim tüketim, karaciğer ve genel sağlık için tehlikeli olabilir.';
    } else if (maxAmount > 2) {
        risk = 'Orta';
        message = 'Orta risk: Tüketim miktarı dikkat edilmesi gereken seviyede.';
    } else if (maxAmount > 0) {
        risk = 'Düşük';
        message = 'Düşük risk: Sağlıklı tüketim aralığında.';
    }
    
    if (days === 'haftada5-6' || days === 'haftada7') {
        message += ' Haftada sık tüketim, bağımlılık riskini artırabilir.';
    }
    
    if (time === 'gece') {
        message += ' Gece tüketimi uyku kalitesini etkileyebilir.';
    }
    
    if (message) {
        msgEl.textContent = message;
        msgEl.classList.remove('hidden');
    } else {
        msgEl.classList.add('hidden');
    }
}

function calculateAlcoholUnits() {
    const start = document.getElementById('alcoholStart')?.value;
    const end = document.getElementById('alcoholEnd')?.value;
    const amount = parseInt(document.getElementById('alcoholAmount')?.value) || 0;
    
    if (!start || !end || amount === 0) return;
    
    const startDate = new Date(start + '-01');
    const endDate = new Date(end + '-01');
    
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                   (endDate.getMonth() - startDate.getMonth());
    
    if (months <= 0) return;
    
    const years = months / 12;
    const doubleYears = amount * years;
    
    const el = document.getElementById('alcoholDoubleYears');
    if(el) el.value = doubleYears.toFixed(1);
}

// ==========================================
// İLAÇ YARDIMCI FONKSİYONLARI
// ==========================================

function normalizeMedName(name) {
    if (!name || typeof name !== 'string') return '';
    
    return name
        .toLocaleLowerCase('tr-TR')
        .replace(/\s*[-–]\s*\(.*?\)\s*/g, ' ')
        .replace(/\s*\(\s*(aç|tok|sabah|akşam|gece|acik|açık)\s*\)\s*/gi, ' ')
        .replace(/\s*\d+\s*(mg|ml|gr|mg\/ml|tablet|hap|kapsül|cc|mcg)\s*/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .normalize('NFKD')
        .replace(/[^\wçğıöşü]/gi, '')
        .replace(/ç/g, 'c')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .replace(/i̇/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .trim();
}

function stringToColor(str) {
    if (!str) return '#94a3b8';
    let lower = str.toLocaleLowerCase('tr');
    const normalized = lower
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/i̇/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
    
    if(normalized.includes('glifor') || normalized.includes('metformin') || 
       normalized.includes('diaformin') || normalized.includes('matofin') || 
       normalized.includes('jardiance')) return '#10b981';
    if(normalized.includes('tansiyon') || normalized.includes('delix') || 
       normalized.includes('beloc') || normalized.includes('vasoxen')) return '#ef4444';
    if(normalized.includes('aspirin') || normalized.includes('ecopirin') || 
       normalized.includes('coraspin')) return '#eab308';
    
    const palette = ['#3b82f6', '#8b5cf6', '#d946ef', '#f97316', '#06b6d4', '#84cc16'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
}

function getMedColor(medName) {
    if (!medName || typeof medName !== 'string') {
        return '#94a3b8';
    }
    
    try {
        const profile = (typeof DataManager !== 'undefined') ? DataManager.getProfile() : safeGetProfile();
        
        if (profile?.medications?.length) {
            const searchLower = medName.trim().toLocaleLowerCase('tr-TR');
            const normalizedSearch = normalizeMedName(medName);

            const nameMatch = profile.medications.find(med => 
                med && med.name && med.name.trim().toLocaleLowerCase('tr-TR') === searchLower
            );
            if (nameMatch?.color) return nameMatch.color;

            const normalizedMatch = profile.medications.find(med =>
                med && normalizeMedName(med.name) === normalizedSearch
            );
            if (normalizedMatch?.color) return normalizedMatch.color;

            const aliasMatch = profile.medications.find(med =>
                med?.aliases?.some(alias => normalizeMedName(alias) === normalizedSearch)
            );
            if (aliasMatch?.color) return aliasMatch.color;
        }
    } catch (error) {
        // Med color error - no logging
    }
    
    return stringToColor(medName);
}

function migrateMedications() {
    try {
        const profile = safeGetProfile();
        if (!profile?.medications?.length) return;
        
        const uniqueMeds = new Map();
        let hasChanges = false;
        
        for (const med of profile.medications) {
            if (!med?.name) continue;

            const normalizedKey = normalizeMedName(med.name);
            if (!normalizedKey) continue;

            if (uniqueMeds.has(normalizedKey)) {
                const existing = uniqueMeds.get(normalizedKey);
                
                const combinedAliases = new Set([
                    ...(existing.aliases || []),
                    ...(med.aliases || []),
                    existing.name,
                    med.name,
                    normalizedKey
                ]);
                existing.aliases = Array.from(combinedAliases).filter(a => a && a.trim().length > 0);

                if (!existing.dose && med.dose) existing.dose = med.dose;
                if (!existing.color && med.color) existing.color = med.color;
                
                existing.isDiabetesMed = existing.isDiabetesMed || med.isDiabetesMed;
                existing.isBpMed = existing.isBpMed || med.isBpMed;
                existing.isAnticoagulantMed = existing.isAnticoagulantMed || med.isAnticoagulantMed;
                existing.isOtherMed = existing.isOtherMed || med.isOtherMed;

                hasChanges = true;
            } else {
                if (!med.aliases || !Array.isArray(med.aliases)) {
                    med.aliases = [med.name, normalizedKey];
                    hasChanges = true;
                } else if (!med.aliases.includes(normalizedKey)) {
                    med.aliases.push(normalizedKey);
                    hasChanges = true;
                }
                uniqueMeds.set(normalizedKey, med);
            }
        }
        
        if (hasChanges || uniqueMeds.size !== profile.medications.length) {
            profile.medications = Array.from(uniqueMeds.values());
            safeSaveProfile(profile);
            return true;
        }
    } catch (e) { /* Migration error - no logging */ }
}

// ==========================================
// YEMEK KÜTÜPHANESİ MİGRASYONU
// ==========================================
function migrateFoodLibrary() {
    if (typeof YEMEK_VERITABANI === 'undefined' || !FoodLibraryManager.library) return;
    
    let hasChanges = false;
    const uniqueFoods = new Map();

    FoodLibraryManager.library.forEach(item => {
        if (!item || !item.ad) return;
        
        let finalName = item.ad.trim();
        
        for (const root of YEMEK_VERITABANI.kokler) {
            const match = root.anahtarKelimeler.find(k => k.toLocaleLowerCase('tr') === finalName.toLocaleLowerCase('tr'));
            if (match) {
                if (finalName !== match) {
                    finalName = match;
                    hasChanges = true;
                }
                if ((!item.bazKalori || item.bazKalori === 0) && root.bazKalori) {
                    item.bazKalori = root.bazKalori;
                    hasChanges = true;
                }
                break;
            }
        }

        const key = finalName.toLocaleLowerCase('tr');
        if (uniqueFoods.has(key)) {
            const existing = uniqueFoods.get(key);
            existing.freq = (existing.freq || 0) + (item.freq || 0);
            if (!existing.bazKalori && item.bazKalori) existing.bazKalori = item.bazKalori;
            hasChanges = true;
        } else {
            item.ad = finalName;
            uniqueFoods.set(key, item);
        }
    });

    if (hasChanges) {
        FoodLibraryManager.library = Array.from(uniqueFoods.values());
        FoodLibraryManager.saveLib();
    }
}

// ==========================================
// DOMContentLoaded EVENT LİSTENERLERI
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Sigara ve alkol hesaplamaları
    document.getElementById('smokingStart')?.addEventListener('input', calculatePackYears);
    document.getElementById('smokingEnd')?.addEventListener('input', calculatePackYears);
    document.getElementById('smokingAmount')?.addEventListener('input', calculatePackYears);
    document.getElementById('alcoholStart')?.addEventListener('input', calculateAlcoholUnits);
    document.getElementById('alcoholEnd')?.addEventListener('input', calculateAlcoholUnits);
    document.getElementById('alcoholAmount')?.addEventListener('input', calculateAlcoholUnits);
    document.getElementById('alcoholFrequency')?.addEventListener('change', calculateAlcoholRisk);
    document.getElementById('alcoholIntensity')?.addEventListener('change', calculateAlcoholRisk);
    document.getElementById('alcoholWeeklyDays')?.addEventListener('change', calculateAlcoholRegularRisk);
    document.getElementById('alcoholFixedAmount')?.addEventListener('change', calculateAlcoholRegularRisk);
    document.getElementById('frequentDays')?.addEventListener('change', calculateAlcoholFrequentRisk);
    document.getElementById('minAmount')?.addEventListener('input', calculateAlcoholFrequentRisk);
    document.getElementById('maxAmount')?.addEventListener('input', calculateAlcoholFrequentRisk);
    document.getElementById('consumptionTime')?.addEventListener('change', calculateAlcoholFrequentRisk);
});

// ==========================================
// DEBOUNCE UTILITY (Performance Optimization)
// ==========================================
/**
 * Debounce wrapper - delays function execution until specified time has passed
 * Useful for high-frequency events (input, scroll, resize) to avoid excessive calls
 * @param {Function} func - Function to debounce
 * @param {Number} wait - Wait time in milliseconds (default: 500ms)
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 500) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Debounced version of safeSaveProfile
 * Batches frequent saves (e.g., from multiple input changes) into single localStorage write
 * Reduces I/O and improves responsiveness
 */
const debouncedSaveProfile = debounce((profile) => {
    try {
        localStorage.setItem('userProfile', JSON.stringify(profile));
    } catch (error) {
        // Save error - no logging
    }
}, 500); // Wait 500ms after last change before saving

// Optional: Force immediate save when needed
function forceProfileSave(profile) {
    return safeSaveProfile(profile);
}
