
'use strict';

// --- MODÜLER EKLENEN V12 ÖZELLİKLERİ --- //
function setupAccordionExclusivity() {
    const smokeAccordion = document.getElementById('smokeAccordion');
    const alcoholAccordion = document.getElementById('alcoholAccordion');
    if (smokeAccordion && alcoholAccordion) {
        smokeAccordion.addEventListener('toggle', () => {
            if (smokeAccordion.open) alcoholAccordion.open = false;
        });
        alcoholAccordion.addEventListener('toggle', () => {
            if (alcoholAccordion.open) smokeAccordion.open = false;
        });
    }
}

function applyExerciseTargetToActivityGoal(targetValue) {
    const actGoalInput = document.getElementById('actGoal');
    if (!actGoalInput) return;
    if (targetValue === undefined || targetValue === null || targetValue === '') return;
    const parsed = parseInt(targetValue, 10);
    actGoalInput.value = Number.isNaN(parsed) ? targetValue : parsed;
}

function setupExerciseTargetSync() {
    const exTargetInput = document.getElementById('profileExerciseTarget');
    const actGoalInput = document.getElementById('actGoal');
    if (exTargetInput && actGoalInput) {
        let userOverrode = false;
        exTargetInput.addEventListener('input', () => {
            if (!userOverrode) {
                actGoalInput.value = exTargetInput.value;
            }
        });
        actGoalInput.addEventListener('input', () => {
            if (actGoalInput.value !== exTargetInput.value) {
                userOverrode = true;
            } else {
                userOverrode = false;
            }
        });
        if (!actGoalInput.value || actGoalInput.value === '0') {
            actGoalInput.value = exTargetInput.value;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupAccordionExclusivity();
    setupExerciseTargetSync();

    // Tahlil Tarihi kutusuna otomatik olarak bugünün tarihini ekle
    const labDateInput = document.getElementById('labDate');
    if (labDateInput && !labDateInput.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        labDateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    // Tansiyon (S/D) alanına otomatik '/' ekle
    const bpInput = document.getElementById('vitalBP');
    if (bpInput) {
        bpInput.addEventListener('input', function(e) {
            let val = bpInput.value.replace(/[^0-9/]/g, '');
            // Eğer zaten '/' varsa, birden fazla olmasın
            const parts = val.split('/');
            if (parts.length > 2) {
                val = parts[0] + '/' + parts[1];
            }
            // Otomatik ekleme: ilk 3 rakamdan sonra '/' ekle (eğer yoksa)
            if (val.length === 3 && !val.includes('/')) {
                val = val + '/';
            }
            // Eğer kullanıcı 3 rakamdan fazla girip '/' koymadıysa otomatik ekle
            if (val.length > 3 && !val.includes('/')) {
                val = val.slice(0,3) + '/' + val.slice(3);
            }
            bpInput.value = val;
        });
    }
});

// Utility functions and diet profiles moved to app-utils.js

const AppConfig = {
    AI_LINKS: { 
        'gemini': 'https://gemini.google.com/app', 
        'chatgpt': 'https://chatgpt.com', 
        'claude': 'https://claude.ai/new', 
        'grok': 'https://x.com/i/grok', 
        'deepseek': 'https://chat.deepseek.com' 
    },
    TARGETS: { 
        'strict': { min: 70, max: 140, label: 'Sıkı', desc: '70-140' }, 
        'std': { min: 70, max: 180, label: 'Standart', desc: '70-180' }, 
        'flex': { min: 90, max: 200, label: 'Esnek', desc: '90-200' } 
    },
    CATEGORIES: {
        fasting: { id: 'fasting', label: 'Sabah Açlık', color: 'orange', icon: 'ph-sun-horizon' },
        pre_meal: { id: 'pre_meal', label: 'Yemek Öncesi', color: 'yellow', icon: 'ph-hamburger' },
        post_meal: { id: 'post_meal', label: 'Yemek Sonrası', color: 'emerald', icon: 'ph-bowl-food' },
        control: { id: 'control', label: 'Kontrol', color: 'purple', icon: 'ph-target' }
    },
    DIET_PROFILES: typeof BUILT_DIET_PROFILES !== 'undefined' ? BUILT_DIET_PROFILES : [],
    DIET_PROFILE_MAP: typeof DIET_PROFILE_MAP !== 'undefined' ? DIET_PROFILE_MAP : {},
    DIET_PROMPTS: typeof DIET_PROMPT_MAP !== 'undefined' ? DIET_PROMPT_MAP : {},
    JSON_FORMAT: 'Yanıtı yalnızca JSON olarak ver. Yapı: {"lists":[{"code":"KHK","label":"Kahvaltı","items":[{"ad":"...","birim":"gr","katsayi":50,"bazKalori":120,"nutrients":{"protein":4,"carbohydrate":15,"sugar":2,"fat":5,"salt":0.3}}]}]}. Her yiyecekte kalori kcal, protein, karbonhidrat, şeker, yağ ve tuz gram cinsinden 100 g veya 100 ml için yaklaşık değer olsun. Şeker karbonhidratın içindedir. Bilinmeyen değerlere null yaz, kaynak uydurma.'
};

// Public English codes are mapped back to the existing internal profile codes on import.
const DIET_INTERNATIONAL_CODES = Object.freeze({
    general: 'GEN', breakfast: 'BRK', low_gi: 'LGI', diabetic: 'DIA',
    dash: 'DSH', mind: 'MND', akdeniz: 'MED', keto: 'KET',
    low_carb: 'LCB', intermittent: 'IMF', vegan: 'VEG', gluten_free: 'GLF', anti_inflam: 'AIF'
});

let dietMenuDismissAttached = false;
let dietToggleInitialized = false;

function markSelectedDietOption(value) {
    const menu = document.getElementById('customDietList');
    if (!menu) return;
    const options = menu.querySelectorAll('[data-diet-key]');
    options.forEach(opt => opt.classList.remove('diet-option-active'));
    if (!value) return;
    const active = Array.from(options).find(opt => opt.dataset.dietKey === value);
    if (active) active.classList.add('diet-option-active');
}

// Localize display names only; profile IDs, codes and AI prompts remain unchanged.
function localizedDietProfile(profile, language) {
    if (language !== 'en') return profile.label;
    const labels = {
        general: 'General Nutrition', breakfast: 'Breakfast', low_gi: 'Low Glycemic Index',
        diabetic: 'Diabetes-Friendly (General)', dash: 'DASH Diet', mind: 'MIND Diet',
        akdeniz: 'Mediterranean Diet', keto: 'Ketogenic Diet', low_carb: 'Low-Carbohydrate',
        intermittent: 'Intermittent Fasting (Light)', vegan: 'Vegan', gluten_free: 'Gluten-Free',
        anti_inflam: 'Anti-Inflammatory'
    };
    return labels[profile.id] || profile.label;
}
function localizedDietSection(section, language) {
    if (language !== 'en') return section;
    return ({
        '🌍 Genel Beslenme': '🌍 General Nutrition', '🩸 Şeker (Diyabet)': '🩸 Diabetes',
        '❤️ Tansiyon & Kalp': '❤️ Blood Pressure & Heart', '⚖️ Kilo Kontrolü': '⚖️ Weight Management',
        '🥗 Özel & Alerji': '🥗 Special Diets & Allergies'
    })[section] || section;
}
function updateDietSelectionLabel(value) {
    const labelEl = document.getElementById('dietSelectedLabel');
    if (!labelEl) return;
    const english = window.GLKOAITestLanguage?.currentLang === 'en';
    const profile = AppConfig.DIET_PROFILE_MAP[value];
    if (profile) {
        labelEl.textContent = `${profile.code} - ${localizedDietProfile(profile, english ? 'en' : 'tr')}`;
        labelEl.classList.remove('text-blue-400');
        labelEl.classList.add('text-white');
        labelEl.classList.remove('uppercase');
    } else {
        labelEl.textContent = english ? 'CHOOSE A DIET LIST ➔' : 'DİYET LİSTESİ SEÇİNİZ  ➔';
        labelEl.classList.add('text-blue-400', 'uppercase');
        labelEl.classList.remove('text-white');
    }
}

function setCustomDiet(value) {
    const selector = document.getElementById('dietTypeSelector');
    if (selector) selector.value = value;
    updateDietSelectionLabel(value);
    markSelectedDietOption(value);
    const menu = document.getElementById('customDietList');
    if (menu) menu.classList.add('hidden');
}

function renderDietProfileMenu() {
    const menu = document.getElementById('customDietList');
    if (!menu) return;
    menu.innerHTML = '';
    const visibleProfiles = AppConfig.DIET_PROFILES.filter(p => !p.hidden);
    const sectionCounts = new Map();
    visibleProfiles.forEach((profile, idx) => {
        const sectionKey = profile.section || 'default';
        const count = sectionCounts.get(sectionKey) || 0;
        const isFirstInSection = count === 0;
        if (profile.section && isFirstInSection && !(profile.section === '🌍 Genel Beslenme' && idx === 0)) {
            const header = document.createElement('div');
            header.className = 'bg-slate-900/80 p-2 text-[10px] text-slate-500 font-black uppercase tracking-widest sticky top-0 backdrop-blur-sm';
            header.dataset.testTr = profile.section;
            header.dataset.testEn = localizedDietSection(profile.section, 'en');
            header.textContent = window.GLKOAITestLanguage?.currentLang === 'en' ? header.dataset.testEn : header.dataset.testTr;
            menu.appendChild(header);
        }
        sectionCounts.set(sectionKey, count + 1);

        const item = document.createElement('div');
        const classes = ['p-3', 'border-b', 'border-slate-700', 'hover:bg-slate-700', 'cursor-pointer', 'text-xs', 'transition', 'flex', 'items-center', 'gap-2'];
        if (isFirstInSection && (idx === 0 || profile.section === '🌍 Genel Beslenme')) {
            classes.push('text-slate-200', 'font-bold');
        } else {
            classes.push('text-slate-300', 'ml-2', 'border-l', 'border-slate-700');
        }
        item.className = classes.join(' ');
        item.dataset.dietKey = profile.id;
        item.innerHTML = `${profile.icon ? `<span class="shrink-0">${profile.icon}</span>` : ''}<span class="flex-1 text-left leading-tight diet-profile-label"></span>`;
        const optionLabel = item.querySelector('.diet-profile-label');
        if (optionLabel) {
            optionLabel.dataset.testTr = `${profile.code} - ${profile.label}`;
            optionLabel.dataset.testEn = `${profile.code} - ${localizedDietProfile(profile, 'en')}`;
            optionLabel.textContent = window.GLKOAITestLanguage?.currentLang === 'en' ? optionLabel.dataset.testEn : optionLabel.dataset.testTr;
        }
        item.addEventListener('click', () => setCustomDiet(profile.id));
        menu.appendChild(item);
    });
    const selector = document.getElementById('dietTypeSelector');
    if (selector && selector.value) {
        markSelectedDietOption(selector.value);
    }
}

function attachDietMenuDismiss() {
    if (dietMenuDismissAttached) return;
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('customDietList');
        const labelWrapper = document.getElementById('dietSelectedLabel')?.parentElement;
        if (!menu || !labelWrapper) return;
        if (!menu.contains(e.target) && !labelWrapper.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });
    dietMenuDismissAttached = true;
}

function initDietSelectionUI() {
    renderDietProfileMenu();
    attachDietMenuDismiss();
    const selector = document.getElementById('dietTypeSelector');
    if (selector && selector.value) {
        updateDietSelectionLabel(selector.value);
        markSelectedDietOption(selector.value);
    }
    const toggleBtn = document.getElementById('dietSelectedLabel')?.parentElement;
    if (toggleBtn && !dietToggleInitialized) {
        toggleBtn.addEventListener('click', () => {
            const menu = document.getElementById('customDietList');
            if (!menu) return;
            requestAnimationFrame(() => {
                if (!menu.classList.contains('hidden')) {
                    const current = document.getElementById('dietTypeSelector')?.value;
                    if (current) markSelectedDietOption(current);
                }
            });
        }, { once: false });
        dietToggleInitialized = true;
    }
}

window.setCustomDiet = setCustomDiet;

// ==========================================
// 2. YARDIMCI ARAÇLAR (Parser)
// ==========================================
const SmartParser = {
    keywords: { 'yarım': 0.5, 'çeyrek': 0.25, 'tek': 1, 'bir': 1, 'iki': 2, 'üç': 3, 'dört': 4, 'beş': 5, 'one': 1, 'two': 2, 'three': 3, 'half': 0.5 },
    formatName(value) {
        const locale = window.GLKOAITestLanguage?.currentLang === 'en' ? 'en' : 'tr';
        return String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase(locale)
            .replace(/(^|[\s\-])([\p{L}])/gu, (_, before, letter) => before + letter.toLocaleUpperCase(locale));
    },
    normalizeUnit(unit) {
        const key = String(unit || '').trim().toLocaleLowerCase('tr');
        const units = { g:'gr', gr:'gr', gram:'gr', grams:'gr', kg:'gr', kilogram:'gr', ml:'ml', mililitre:'ml', milliliter:'ml', l:'ml', litre:'ml', liter:'ml', adet:'Adet', tane:'Adet', piece:'Adet', pieces:'Adet', kase:'Kase', 'kâse':'Kase', bowl:'Kase', bowls:'Kase', bardak:'Bardak', glass:'Bardak', glasses:'Bardak', dilim:'Dilim', slice:'Dilim', slices:'Dilim', porsiyon:'Porsiyon', portion:'Porsiyon', portions:'Porsiyon', serving:'Porsiyon', servings:'Porsiyon', fincan:'Fincan', cup:'Fincan', cups:'Fincan' };
        return units[key] || null;
    },
    parse(input) {
        if (typeof input !== 'string' || !input.trim()) return null;
        let rest = input.trim().replace(/\s+/g, ' '), amount = 1, amountSpecified = false, explicitUnit = false, unit = null;
        const number = rest.match(/^(-?\d+(?:[.,]\d+)?|½)(?=\s|[a-zA-ZğüşöçıİĞÜŞÖÇ]|$)/u);
        if (number) {
            amount = number[1] === '½' ? .5 : Number(number[1].replace(',', '.'));
            amountSpecified = true; rest = rest.slice(number[0].length).trim();
        } else {
            const first = rest.match(/^[\p{L}]+(?=\s|$)/u);
            const key = first?.[0].toLocaleLowerCase('tr');
            if (key && Object.prototype.hasOwnProperty.call(this.keywords, key)) {
                amount = this.keywords[key]; amountSpecified = true; rest = rest.slice(first[0].length).trim();
            }
        }
        const firstUnit = rest.match(/^[\p{L}]+(?=\s|$)/u);
        if (firstUnit) {
            const normalized = this.normalizeUnit(firstUnit[0]);
            if (normalized && rest.slice(firstUnit[0].length).trim()) {
                const raw = firstUnit[0].toLocaleLowerCase('tr');
                if (raw === 'kg' || raw === 'kilogram' || raw === 'l' || raw === 'litre' || raw === 'liter') amount *= 1000;
                unit = normalized; explicitUnit = true; amountSpecified = true; rest = rest.slice(firstUnit[0].length).trim();
            }
        }
        const lowerName = rest.toLocaleLowerCase('tr');
        if (!unit) {
            if (lowerName === 'su' || lowerName === 'bardak su') unit = 'Bardak';
            else if (/maden|soda|çay|kahve|ayran|süt/.test(lowerName)) unit = 'Bardak';
            else if (/yumurta|köfte|dolma|sarma|lahmacun|simit|meyve|ceviz|\begg\b/.test(lowerName)) unit = 'Adet';
            else if (/çorba|cacık|\bsoup\b/.test(lowerName)) unit = 'Kase';
            else if (/ekmek|karpuz|kek|börek|\bbread\b/.test(lowerName)) unit = 'Dilim';
            else unit = 'Porsiyon';
        }
        return { name: this.formatName(rest), amount, amountSpecified, explicitUnit, unit, invalidAmount: !Number.isFinite(amount) || amount <= 0, katsayi: ['gr', 'ml'].includes(unit) ? 50 : 0.5 };
    }
};

// ==========================================
// 2.1 UI GELİŞTİRİCİ (YENİ)
// ==========================================
const UIEnhancer = {
    init() {
        this.injectModals();
        this.setupBackdropClicks();
    },
    injectModals() {
        if(document.getElementById('customConfirmModal')) return;
        const div = document.createElement('div');
        div.id = 'customConfirmModal';
        div.className = 'fixed inset-0 bg-black/90 flex items-center justify-center z-[300] hidden p-4 backdrop-blur-sm animate-fade-in';
        div.innerHTML = `
            <div class="bg-slate-800 border border-slate-700 p-6 rounded-2xl max-w-sm w-full shadow-2xl transform transition-all scale-100">
                <div class="flex flex-col mb-6">
                    <div class="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mb-3 mx-auto">
                        <i class="ph-fill ph-warning text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-3 text-center" id="confirmTitle">Onay Gerekiyor</h3>
                    <p class="text-slate-400 text-sm whitespace-pre-line text-left" id="confirmMessage">Bu işlemi yapmak istediğinize emin misiniz?</p>
                </div>
                <div class="flex gap-3">
                    <button id="btnConfirmCancel" class="flex-1 py-3 rounded-xl border border-slate-600 text-slate-300 font-bold hover:bg-slate-700 transition">İptal</button>
                    <button id="btnConfirmOk" class="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition shadow-lg shadow-red-900/20">Sil</button>
                </div>
            </div>
        `;
        document.body.appendChild(div);
    },
    showConfirm(message, onConfirm, title = 'Onay Gerekiyor', btnText = 'Sil', btnColor = 'bg-red-600') {
        const modal = document.getElementById('customConfirmModal');
        if(!modal) return;
        
        const tr = value => window.GLKOAITestLanguage ? window.GLKOAITestLanguage.translate(value) : value;
        document.getElementById('confirmMessage').textContent = tr(message);
        document.getElementById('confirmTitle').textContent = tr(title);
        
        const okBtn = document.getElementById('btnConfirmOk');
        const cancelBtn = document.getElementById('btnConfirmCancel');
        
        // Listener temizliği için klonlama
        const newOk = okBtn.cloneNode(true);
        const newCancel = cancelBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOk, okBtn);
        cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
        
        newOk.textContent = tr(btnText);
        newCancel.textContent = tr('İptal');
        newOk.className = `flex-1 py-3 rounded-xl text-white font-bold transition shadow-lg ${btnColor} hover:opacity-90`;
        
        newOk.onclick = () => {
            modal.classList.add('hidden');
            if(onConfirm) onConfirm();
        };
        
        newCancel.onclick = () => {
            modal.classList.add('hidden');
        };
        
        modal.classList.remove('hidden');
    },
    setupBackdropClicks() {
        window.addEventListener('click', (e) => {
            const targetId = e.target.id;
            const modals = ['medicationModal', 'aiPromptModal', 'infoModal', 'symptomModal', 'activityModal', 'profileOverlay', 'settingsOverlay', 'medColorEditor', 'aiHistoryModal', 'mainMenuOverlay'];
            if (modals.includes(targetId)) {
                if(targetId === 'medColorEditor') closeModal('medColorEditor');
                else document.getElementById(targetId).style.display = 'none';
            }
            if (targetId === 'guideOverlay') {
                document.getElementById('guideOverlay').style.display = 'none';
            }
            if(targetId === 'customConfirmModal') document.getElementById('customConfirmModal').classList.add('hidden');
        });
    }
};

// ==========================================
// 2.2 TOOLTIP YÖNETİCİSİ (YENİ)
// ==========================================
const TooltipManager = {
    el: null,
    init() {
        if(document.querySelector('.modern-tooltip')) return;
        this.el = document.createElement('div');
        this.el.className = 'modern-tooltip';
        document.body.appendChild(this.el);
        
        // Sadece mouse kullanan cihazlarda aktif et (Dokunmatikte zaten tıklayınca modal açılıyor)
        if (window.matchMedia("(pointer: fine)").matches) {
            document.addEventListener('mouseover', (e) => {
                const target = e.target.closest('[data-tooltip]');
                if (target) this.show(e, target.getAttribute('data-tooltip'));
            });
            document.addEventListener('mouseout', (e) => {
                const target = e.target.closest('[data-tooltip]');
                if (target) this.hide();
            });
            document.addEventListener('mousemove', (e) => {
                if (this.el.classList.contains('show')) this.move(e);
            });
        }
    },
    show(e, text) { this.el.innerHTML = text; this.el.classList.add('show'); this.move(e); },
    hide() { this.el.classList.remove('show'); },
    move(e) {
        this.el.style.left = `${e.clientX}px`; this.el.style.top = `${e.clientY}px`;
    }
};

// ==========================================
// 3. YEMEK KÜTÜPHANESİ YÖNETİCİSİ
// ==========================================
function displayedFoodName(item) {
    if (!item) return '';
    if (item.foodLocalName) return item.foodLocalName;
    const english = window.GLKOAITestLanguage?.currentLang === 'en';
    if (item.foodCatalogNames && typeof item.foodCatalogNames === 'object') return item.foodCatalogNames[english ? 'en' : 'tr'] || item.ad;
    return english ? (window.GLKOAITestLanguage?.translate(item.ad) || item.ad) : item.ad;
}
function displayFoodRecord(value) {
    const match = typeof value === 'string' && value.match(/^(.*) \(([\d.,]+)\s+([^()]*)\)$/);
    if (!match) return value;
    const name = match[1].trim();
    const item = typeof FoodLibraryManager !== 'undefined' ? FoodLibraryManager.library.find(food => String(food.ad || '').toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr')) : null;
    const translated = displayedFoodName(item) || (window.GLKOAITestLanguage?.translate(name) || name);
    const unit = window.GLKOAITestLanguage?.translate(match[3].trim()) || match[3].trim();
    return `${translated} (${match[2]} ${unit})`;
}
function isFoodMetricUnit(unit) { return ['gr', 'g', 'gram', 'grams', 'ml'].includes(String(unit || '').trim().toLocaleLowerCase('tr')); }
function foodCalories(base, unit, amount) {
    if (base === null || base === undefined || base === '' || !Number.isFinite(Number(base)) || Number(base) < 0) return null;
    const quantity = Number(amount); if (!Number.isFinite(quantity) || quantity < 0) return null;
    return Number(base) * quantity / (isFoodMetricUnit(unit) ? 100 : 1);
}

const FOOD_DIET_CODES = Object.freeze({ mediterranean:'AKD', vegetarian:'VEJ', vegan:'VGN', dash:'DASH', keto:'KETO', paleo:'PAL', low_carb:'DK', low_fat:'DY', high_protein:'YP' });

const FoodLibraryManager = {
    library: [],
    selectedFoods: {},
    editingItem: null,
    searchTimer: null,
    aiColorCursor: 0,
    aiColorPalette: [
        { bg: 'rgba(250, 204, 21, 0.18)', border: 'rgba(250, 204, 21, 0.65)' },
        { bg: 'rgba(253, 224, 71, 0.18)', border: 'rgba(253, 224, 71, 0.6)' },
        { bg: 'rgba(245, 158, 11, 0.18)', border: 'rgba(245, 158, 11, 0.6)' },
        { bg: 'rgba(234, 179, 8, 0.18)', border: 'rgba(234, 179, 8, 0.6)' },
        { bg: 'rgba(252, 211, 77, 0.18)', border: 'rgba(252, 211, 77, 0.6)' },
        { bg: 'rgba(217, 119, 6, 0.18)', border: 'rgba(217, 119, 6, 0.6)' }
    ],
    aiHighlights: {},
    aiGroupStyles: {
        low_gi: { key: 'low_gi', label: 'DGI', legend: 'Düşük Glisemik İndeks', badge: 'GI', border: 'rgba(56, 189, 248, 0.62)', background: 'rgba(56, 189, 248, 0.28)', halo: 'rgba(56, 189, 248, 0.36)' },
        diabetic: { key: 'diabetic', label: 'DDB', legend: 'Diyabet Dostu', badge: 'D', border: 'rgba(249, 115, 22, 0.64)', background: 'rgba(249, 115, 22, 0.3)', halo: 'rgba(249, 115, 22, 0.4)' }
    },
    aiGroupMeta: {
        low_gi: { code: 'DGI', label: 'Düşük Glisemik İndeks' },
        diabetic: { code: 'DDB', label: 'Diyabet Dostu' }
    },
    caloriePalette: {
        none: { key: 'none', bg: 'rgba(148, 163, 184, 0.03)', border: 'rgba(148, 163, 184, 0.16)', accent: '#94a3b8', accentBg: 'rgba(148, 163, 184, 0.12)', halo: '0 0 6px rgba(148, 163, 184, 0.1)' },
        sub100: { key: 'sub100', bg: 'rgba(64, 96, 109, 0.08)', border: 'rgba(64, 96, 109, 0.24)', accent: '#40606d', accentBg: 'rgba(64, 96, 109, 0.16)', halo: '0 0 8px rgba(64, 96, 109, 0.22)' },
        sub200: { key: 'sub200', bg: 'rgba(99, 95, 71, 0.08)', border: 'rgba(99, 95, 71, 0.26)', accent: '#635f47', accentBg: 'rgba(99, 95, 71, 0.16)', halo: '0 0 10px rgba(99, 95, 71, 0.22)' },
        sub300: { key: 'sub300', bg: 'rgba(99, 72, 95, 0.08)', border: 'rgba(99, 72, 95, 0.26)', accent: '#63485f', accentBg: 'rgba(99, 72, 95, 0.2)', halo: '0 0 10px rgba(99, 72, 95, 0.28)' }
    },

    init() {
        try {
            const stored = localStorage.getItem('customFoodLibrary');
            this.library = stored ? JSON.parse(stored) : [];

            const storedCursor = parseInt(localStorage.getItem('aiFoodColorCursor') || '0', 10);
            this.aiColorCursor = Number.isNaN(storedCursor) ? 0 : storedCursor;

            try {
                const storedHighlights = localStorage.getItem('aiFoodHighlights');
                this.aiHighlights = storedHighlights ? JSON.parse(storedHighlights) : {};
            } catch (err) {
                this.aiHighlights = {};
            }

            try {
                const storedMeta = localStorage.getItem('aiFoodGroupMeta');
                if (storedMeta) {
                    const parsedMeta = JSON.parse(storedMeta);
                    this.aiGroupMeta = { ...this.aiGroupMeta, ...parsedMeta };
                }
            } catch (err) {
                // Error handling - no logging in production
            }

            let highlightsChanged = false;
            let metaChanged = false;
            this.library.forEach(item => {
                if (item.aiColor) {
                    if (!this.aiHighlights[item.ad]) {
                        this.aiHighlights[item.ad] = item.aiColor;
                        highlightsChanged = true;
                    }
                    delete item.aiColor;
                }
            });
            if (this.aiHighlights && typeof this.aiHighlights === 'object') {
                Object.entries(this.aiHighlights).forEach(([foodName, highlightData]) => {
                    if (!highlightData || typeof highlightData !== 'object') return;
                    const groupKey = highlightData.group;
                    if (groupKey === 'low_gi' && highlightData.label === 'Düşük GI') {
                        highlightData.label = 'DGI';
                        highlightData.legend = highlightData.legend || 'Düşük Glisemik İndeks';
                        highlightsChanged = true;
                    }
                    if (groupKey === 'diabetic' && (!highlightData.label || highlightData.label === 'Diyabet Dostu' || highlightData.label === 'D')) {
                        highlightData.label = 'DDB';
                        highlightData.legend = highlightData.legend || 'Diyabet Dostu';
                        highlightsChanged = true;
                    }
                    if (groupKey) {
                        const style = this._resolveGroupStyle(groupKey);
                        const code = highlightData.label || (style && style.label) || this._normalizeGroupCode(groupKey);
                        const legend = highlightData.legend || (style && style.legend) || this._humanizeGroupLabel(groupKey);
                        if (!this.aiGroupMeta[groupKey] || this.aiGroupMeta[groupKey].code !== code || this.aiGroupMeta[groupKey].label !== legend) {
                            this.aiGroupMeta[groupKey] = { code, label: legend };
                            metaChanged = true;
                        }
                    }
                });
            }
            if (highlightsChanged) {
                this.persistHighlights();
                this.saveLib();
            }
            if (metaChanged) this.persistGroupMeta();

            this.renderGrid();
        } catch (e) {
            this.library = [];
        }
    },

    saveLib() {
        this.library.sort((a, b) => (b.freq || 0) - (a.freq || 0));
        localStorage.setItem('customFoodLibrary', JSON.stringify(this.library.filter(item => !item._pendingFood))); 
    },

    persistHighlights() {
        localStorage.setItem('aiFoodHighlights', JSON.stringify(this.aiHighlights));
    },

    persistGroupMeta() {
        localStorage.setItem('aiFoodGroupMeta', JSON.stringify(this.aiGroupMeta));
    },

    _wrapHighlight(baseColor, groupKey = null, badge = null, label = '', legend = '') {
        if (!baseColor) return null;
        const border = baseColor.border || baseColor.accent || 'rgba(96, 165, 250, 0.45)';
        const halo = baseColor.halo || baseColor.bg || border;
        const resolvedBadge = badge || baseColor.badge || '';
        const resolvedLabel = label || baseColor.label || '';
        const resolvedLegend = legend || baseColor.legend || '';
        return {
            border,
            halo,
            group: groupKey || baseColor.group || null,
            badge: resolvedBadge,
            label: resolvedLabel,
            legend: resolvedLegend
        };
    },

    _resolveGroupStyle(groupKey) {
        if (!groupKey) return null;
        return this.aiGroupStyles[groupKey] || null;
    },

    _slugifyGroupKey(key) {
        if (!key) return null;
        return String(key)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/gi, '_')
            .replace(/^_+|_+$/g, '');
    },

    _normalizeGroupCode(codeCandidate, fallbackLabel = '', fallbackKey = '') {
        let candidate = '';
        if (codeCandidate !== null && codeCandidate !== undefined) {
            candidate = String(codeCandidate).trim();
        }
        if (!candidate && fallbackLabel) {
            candidate = fallbackLabel
                .split(/\s+/)
                .map(word => word ? word[0] : '')
                .join('');
        }
        if (!candidate && fallbackKey) candidate = fallbackKey;
        candidate = candidate
            .replace(/[^a-zA-Z0-9ÇÖŞİĞÜİçöşğıü]/g, '')
            .toUpperCase();
        if (candidate.length > 3) candidate = candidate.slice(0, 3);
        if (!candidate && fallbackLabel) {
            const letters = fallbackLabel.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            candidate = letters.slice(0, 3);
        }
        return candidate || 'AI';
    },

    _humanizeGroupLabel(rawKey = '') {
        if (!rawKey) return '';
        const text = String(rawKey).replace(/[_\-]+/g, ' ').trim();
        if (!text) return '';
        return text
            .split(' ')
            .map(part => part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : '')
            .join(' ')
            .trim();
    },

    _extractJsonGroups(parsed) {
        if (!parsed) return [];
        if (Array.isArray(parsed)) return [{ key: 'default', items: parsed, meta: {} }];

        const groups = [];
        const usedKeys = new Set();
        const synonymMap = {
            low_gi: ['low_gi', 'dusuk_gi', 'dusuk_glisemik', 'dusuk_glisemik_index', 'dusuk_glisemik_indeks', 'low_glycemic', 'low_glycemic_index'],
            diabetic: ['diabetic', 'diabetic_friendly', 'diyabet', 'diyabet_dostu', 'diyabet_dostu_listesi', 'diabet_dostu']
        };

        const ensureGroup = (key, arr, meta = {}) => {
            if (!Array.isArray(arr) || arr.length === 0) return;
            groups.push({ key, items: arr, meta });
        };

        const readMetaFromEntry = (entryKey, entryValue = {}) => {
            const metaObj = entryValue && typeof entryValue === 'object' ? entryValue : {};
            const keyString = entryKey !== undefined && entryKey !== null ? String(entryKey).trim() : '';
            let inferredCode = '';
            let inferredLabel = '';
            if (keyString) {
                const parts = keyString.split(/\s*[-:]\s*/);
                if (parts.length >= 2) {
                    inferredCode = parts[0] || '';
                    inferredLabel = parts.slice(1).join(' ').trim();
                }
            }
            const labelCandidate = metaObj.label || metaObj.name || metaObj.title || metaObj.prompt || metaObj.description || metaObj.aciklama || metaObj.baslik || metaObj.legend || inferredLabel;
            const label = labelCandidate || this._humanizeGroupLabel(keyString);
            const codeCandidate = metaObj.code || metaObj.kod || metaObj.abbr || metaObj.abbreviation || metaObj.short || metaObj.shortcode || metaObj.kisa || metaObj.tag || inferredCode || keyString;
            const code = this._normalizeGroupCode(codeCandidate, label, keyString);
            return { code, label };
        };

        for (const [groupKey, candidates] of Object.entries(synonymMap)) {
            for (const candidate of candidates) {
                if (Array.isArray(parsed[candidate])) {
                    const style = this._resolveGroupStyle(groupKey) || {};
                    ensureGroup(groupKey, parsed[candidate], { code: style.label || this._normalizeGroupCode(groupKey), label: style.legend || this._humanizeGroupLabel(groupKey) });
                    usedKeys.add(candidate);
                    break;
                }
                const candidateObj = parsed[candidate];
                if (candidateObj && typeof candidateObj === 'object' && Array.isArray(candidateObj.items)) {
                    ensureGroup(groupKey, candidateObj.items, readMetaFromEntry(groupKey, candidateObj));
                    usedKeys.add(candidate);
                    break;
                }
            }
        }

        if (Array.isArray(parsed.yemekler) && !usedKeys.has('yemekler')) {
            ensureGroup('default', parsed.yemekler, {});
            usedKeys.add('yemekler');
        }

        if (Array.isArray(parsed.lists)) {
            usedKeys.add('lists');
            parsed.lists.forEach((entry, idx) => {
                if (!entry) return;
                const entryItems = Array.isArray(entry.items) ? entry.items : Array.isArray(entry.yemekler) ? entry.yemekler : null;
                if (!entryItems) return;
                const isEnglishFoodList = entryItems.some(item => item && typeof item.name === 'string' && !item.ad);
                const code = typeof entry.code === 'string' ? entry.code : '';
                const matchedProfileId = isEnglishFoodList
                    ? Object.keys(DIET_INTERNATIONAL_CODES).find(id => DIET_INTERNATIONAL_CODES[id] === code)
                    : null;
                const internalCode = matchedProfileId && AppConfig.DIET_PROFILE_MAP[matchedProfileId]?.code;
                const mappedEntry = internalCode ? { ...entry, code: internalCode } : entry;
                const rawKey = mappedEntry.key || mappedEntry.slug || mappedEntry.group || mappedEntry.code || mappedEntry.kod || `${mappedEntry.label || 'group'}_${idx}`;
                const normalizedKey = this._slugifyGroupKey(rawKey) || `group_${idx}`;
                ensureGroup(normalizedKey, entryItems, readMetaFromEntry(rawKey, mappedEntry));
            });
        }

        Object.entries(parsed).forEach(([key, value]) => {
            if (usedKeys.has(key)) return;
            if (Array.isArray(value)) {
                ensureGroup(key, value, readMetaFromEntry(key));
                return;
            }
            if (value && typeof value === 'object') {
                const candidateItems = Array.isArray(value.items) ? value.items : Array.isArray(value.yemekler) ? value.yemekler : null;
                if (candidateItems) {
                    ensureGroup(key, candidateItems, readMetaFromEntry(key, value));
                }
            }
        });

        return groups;
    },

    nextAiColor() {
        if (!Array.isArray(this.aiColorPalette) || this.aiColorPalette.length === 0) return null;
        const idx = this.aiColorCursor % this.aiColorPalette.length;
        const color = { ...this.aiColorPalette[idx] };
        this.aiColorCursor = (this.aiColorCursor + 1) % this.aiColorPalette.length;
        localStorage.setItem('aiFoodColorCursor', String(this.aiColorCursor));
        return color;
    },

    findInGlobalDB(searchName) {
        if (typeof YEMEK_VERITABANI === 'undefined' || !searchName) return null;
        const lowerSearch = searchName.toLocaleLowerCase('tr').trim();
        for (const root of YEMEK_VERITABANI.kokler) {
            for (const kw of root.anahtarKelimeler) {
                if (kw.toLocaleLowerCase('tr') === lowerSearch) return { item: root, type: 'exact' }; 
            }
        }
        for (const root of YEMEK_VERITABANI.kokler) {
            for (const kw of root.anahtarKelimeler) {
                if (kw.toLocaleLowerCase('tr').includes(lowerSearch)) return { item: root, type: 'fuzzy' }; 
            }
        }
        return null;
    },
    resolveCalorieBand(value) {
        const cal = Number(value);
        let key = 'none';
        if (Number.isFinite(cal) && cal > 0) {
            if (cal <= 100) key = 'sub100';
            else if (cal <= 200) key = 'sub200';
            else key = 'sub300';
        }
        const palette = this.caloriePalette[key] || this.caloriePalette.none;
        return { key, ...palette };
    },
    getCalorieClass(value) {
        const band = this.resolveCalorieBand(value);
        return `calorie-band-${band.key}`;
    },

    resolveParsedAmount(parsed, food, unit) {
        if (!parsed?.amountSpecified || parsed.invalidAmount || !parsed.name) return { amount: null, warning: false };
        const sourceUnit = SmartParser.normalizeUnit(parsed.unit) || parsed.unit;
        const targetUnit = SmartParser.normalizeUnit(unit) || unit;
        if (sourceUnit === targetUnit) return { amount: parsed.amount, warning: false };
        const words = { Adet: /(^|\s)(adet|tane|piece|pieces)(?=\s|$)/i, Kase: /(^|\s)(kase|kâse|bowl)(?=\s|$)/i, Bardak: /(^|\s)(bardak|glass)(?=\s|$)/i, Dilim: /(^|\s)(dilim|slice)(?=\s|$)/i, Porsiyon: /(^|\s)(porsiyon|serving|portion)(?=\s|$)/i };
        if (['gr', 'ml'].includes(targetUnit) && words[sourceUnit] && Array.isArray(food?.foodPortions)) {
            const matches = food.foodPortions.filter(part => Number.isFinite(Number(part.amount)) && Number(part.amount) > 0 && [part.tr, part.en].some(label => typeof label === 'string' && words[sourceUnit].test(label)));
            if (matches.length === 1) return { amount: parsed.amount * Number(matches[0].amount), warning: false };
        }
        return { amount: null, warning: true };
    },
    startEditing(name, unit, bazKalori, parsedInput = null) {
        const searchInput = document.getElementById('foodSearchInput');
        if (searchInput) searchInput.value = '';
        
        if (this.editingItem === name && !parsedInput?.amountSpecified) { this.closePanel(); return; }
        if (bazKalori === undefined) {
            const result = this.findInGlobalDB(name);
            if (result?.type === 'exact') bazKalori = result.item.bazKalori;
        }
        const archivedFood = this.library.find(item => item.ad === name && item.foodListArchived);
        if (archivedFood) { archivedFood.foodListArchived = false; archivedFood.foodCatalogId = undefined; this.saveLib(); if (typeof FoodLists !== 'undefined' && !FoodLists.active().includes('__manual__')) FoodLists.setActive('__manual__', true); }
        const food = this.library.find(item => item.ad === name);
        this.amountEditInitial = this.selectedFoods[name] ? {...this.selectedFoods[name]} : null;
        const quantity = this.resolveParsedAmount(parsedInput, food, unit);
        this.amountWarning = quantity.warning;
        if(!this.selectedFoods[name]) {
            let startVal = quantity.amount ?? (isFoodMetricUnit(unit) ? 100 : 1.0);
            this.selectedFoods[name] = { count: startVal, unit: unit };
            if(!this.library.find(l=>l.ad === name)) {
                this.library.unshift({ ad: name, birim: unit, bazKalori: bazKalori, freq: 1 });
                this.saveLib();
            }
        } else if (quantity.amount !== null) this.selectedFoods[name].count = quantity.amount;
        this.editingItem = name;
        this.updateEditorPanel();
        this.renderGrid(''); 
        updateHeaderStats(); 
    },

    changeAmount(delta) {
        const name = this.editingItem;
        if(!name || !this.selectedFoods[name]) return;
        
        const unit = String(this.selectedFoods[name].unit || '').trim().toLocaleLowerCase('tr');
        let step = isFoodMetricUnit(unit) ? 50 : (unit === 'adet' || unit === 'piece' ? 1 : 0.5);
        let nextVal = this.selectedFoods[name].count + (delta * step);
        if (nextVal < 0) nextVal = 0;
        this.selectedFoods[name].count = nextVal;
        if(nextVal === 0) { delete this.selectedFoods[name]; this.closePanel(); } 
        else { this.updateEditorPanel(); }
        this.renderGrid('');
        updateHeaderStats(); 
    },

    removeSelection(name) {
        if (!name) return;
        const key = Object.prototype.hasOwnProperty.call(this.selectedFoods, name)
            ? name
            : Object.keys(this.selectedFoods).find(k => k === name);
        if (!key) return;
        delete this.selectedFoods[key];
        if (this.editingItem === key) { this.closePanel(); return; }
        this.renderGrid('');
        updateHeaderStats();
    },
    cancelAmountPanel() {
        if (!this.quickWaterState && !this.pendingFoodDraft && this.editingItem) {
            if (this.amountEditInitial) this.selectedFoods[this.editingItem] = { ...this.amountEditInitial };
            else delete this.selectedFoods[this.editingItem];
        }
        this.closePanel();
    },

    replaceFoodDefinition(name, newName, unit, calories, nutrientValues = undefined) {
        const old = this.library.find(i => i.ad === name && !i.foodListArchived);
        if (!old) throw new Error('missing');
        const cleanName = String(newName || '').trim();
        const value = Number(calories);
        if (!cleanName || calories === '' || !Number.isFinite(value) || value < 0 || !unit) throw new Error('invalid');
        const sameName = cleanName === (displayedFoodName(old) || old.ad);
        const sameUnit = (SmartParser.normalizeUnit(old.birim) || old.birim) === (SmartParser.normalizeUnit(unit) || unit);
        if (sameName && sameUnit && old.bazKalori !== null && old.bazKalori !== undefined && Number(old.bazKalori) === value && (nutrientValues === undefined || JSON.stringify(FoodNutrients.validate(old.nutrients || {})) === JSON.stringify(nutrientValues))) return name;
        const normalize = x => String(x || '').toLocaleLowerCase('tr');
        let key = cleanName;
        let serial = 0;
        while (this.library.some(i => normalize(i.ad) === normalize(key))) key = `${cleanName} · v${Date.now()}${++serial > 1 ? '-' + serial : ''}`;
        const wasWater = old.foodIsWater === true || ['su', 'water'].includes(normalize(old.ad).trim());
        const next = { ...old, ...(nutrientValues === undefined ? {} : {nutrients:nutrientValues,nutrientSource:'user'}), ad: key, foodLocalName: cleanName, foodOriginalName: cleanName, source: 'user', birim: unit, bazKalori: value, calorieMethod: 'user', calorieSource: { tr: 'Kullanıcı tarafından girilen yaklaşık değer.', en: 'Approximate value entered by the user.' }, foodListArchived: false, foodHistorySnapshot: false, foodCatalogId: undefined, foodListTags: [], foodIsWater: sameName && wasWater };
        if (!sameName || !sameUnit) { next.foodRecipe = null; next.foodPortions = []; }
        const updated = this.library.map(i => i === old ? { ...i, foodListArchived: true, foodHistorySnapshot: true } : i);
        updated.unshift(next);
        const active = typeof FoodLists !== 'undefined' ? FoodLists.active() : null;
        const snapshots = ['foodListActive', 'customFoodLibrary'].map(k => [k, localStorage.getItem(k)]);
        try {
            if (active && !active.includes('__manual__')) localStorage.setItem('foodListActive', JSON.stringify([...active, '__manual__']));
            localStorage.setItem('customFoodLibrary', JSON.stringify(updated));
        } catch (e) {
            snapshots.forEach(([k,v]) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k,v); } catch (_) {} });
            throw e;
        }
        this.library = updated;
        if (this.selectedFoods[name]) {
            const selected = this.selectedFoods[name]; delete this.selectedFoods[name];
            this.selectedFoods[key] = { ...selected, unit, count: sameUnit ? selected.count : (isFoodMetricUnit(unit) ? 100 : 1) };
            if (!sameUnit) this.amountWarning = true;
        }
        if (this.editingItem === name) { this.editingItem = key; if (this.amountEditInitial && !sameUnit) this.amountEditInitial = { ...this.amountEditInitial, unit, count: isFoodMetricUnit(unit) ? 100 : 1 }; }
        return key;
    },
    openDefinitionEditor() {
        const food = this.library.find(i => i.ad === this.editingItem && !i.foodListArchived);
        if (!food) return;
        const form = document.getElementById('foodDefinitionForm');
        document.getElementById('foodDefinitionName').value = displayedFoodName(food) || food.ad;
        const select = document.getElementById('foodDefinitionUnit');
        const unit = SmartParser.normalizeUnit(food.birim) || food.birim;
        if (![...select.options].some(option => option.value === unit)) select.add(new Option(unit, unit));
        select.value = unit;
        document.getElementById('foodDefinitionCalories').value = food.bazKalori ?? '';
        FoodNutrients.keys.forEach(k=>{const el=document.getElementById('foodDefinition_'+k);if(el)el.value=food.nutrients?.[k] ?? '';});
        document.getElementById('foodDefinitionError').hidden = true;
        this.updateDefinitionCaloriesLabel();
        const dialog = document.getElementById('foodDefinitionDialog');
        if (!dialog.open) dialog.showModal();
    },
    updateDefinitionCaloriesLabel() {
        const unit = document.getElementById('foodDefinitionUnit').value;
        const en = window.GLKOAITestLanguage?.currentLang === 'en';
        document.getElementById('foodDefinitionCaloriesLabel').textContent = (en ? 'Approximate calories' : 'Yaklaşık kalori') + (isFoodMetricUnit(unit) ? (unit === 'ml' ? ' / 100 ml' : ' / 100 g') : (en ? ' / unit' : ' / birim'));
    },
    saveDefinition() {
        const en = window.GLKOAITestLanguage?.currentLang === 'en';
        try {
            this.replaceFoodDefinition(this.editingItem, document.getElementById('foodDefinitionName').value, document.getElementById('foodDefinitionUnit').value, document.getElementById('foodDefinitionCalories').value, FoodNutrients.validate(Object.fromEntries(FoodNutrients.keys.map(k=>[k,document.getElementById('foodDefinition_'+k)?.value]))));
            document.getElementById('foodDefinitionDialog').close();
            this.updateEditorPanel(); this.renderGrid(''); updateHeaderStats();
            showToast(en ? 'Updated' : 'Güncellendi', 'success');
        } catch (_) {
            const error = document.getElementById('foodDefinitionError'); error.textContent = en ? 'Could not save. Check the values and try again.' : 'Kaydedilemedi. Değerleri kontrol edip tekrar deneyin.'; error.hidden = false;
        }
    },
    requestDeleteDefinition(name = this.editingItem) {
        if (!this.library.some(i => i.ad === name && !i.foodListArchived)) return;
        this.pendingFoodDelete = name;
        const dialog = document.getElementById('foodDeleteDialog'); if (!dialog.open) dialog.showModal();
    },
    confirmDeleteDefinition() {
        const name = this.pendingFoodDelete;
        const updated = this.library.map(i => i.ad === name ? { ...i, foodListArchived: true, foodHistorySnapshot: true } : i);
        try { localStorage.setItem('customFoodLibrary', JSON.stringify(updated)); }
        catch (_) { showToast(window.GLKOAITestLanguage?.currentLang === 'en' ? 'Could not remove.' : 'Kaldırılamadı.', 'error'); return; }
        this.library = updated; delete this.selectedFoods[name]; this.pendingFoodDelete = null;
        document.getElementById('foodDeleteDialog').close();
        const definition=document.getElementById('foodDefinitionDialog');if(definition?.open)definition.close();
        if (this.editingItem === name) this.closePanel(); else { this.renderGrid(''); updateHeaderStats(); }
        showToast(window.GLKOAITestLanguage?.currentLang === 'en' ? 'Removed' : 'Kaldırıldı', 'success');
    },

    updateEditorPanel() {
        const panel = document.getElementById('foodEditorPanel');
        const name = this.editingItem;
        if(!name || !this.selectedFoods[name]) { panel.classList.add('hidden'); return; }
        const data = this.selectedFoods[name];
        const refItem = this.library.find(i => i.ad === name);
        if (refItem?._pendingFood) { renderPendingFoodPanel(panel, refItem, data); return; }
        const itemCal = refItem ? refItem.bazKalori : this.findInGlobalDB(name)?.item?.bazKalori;
        const totalCal = foodCalories(itemCal, data.unit, data.count);
        const isLowCal = itemCal !== null && itemCal !== undefined && Number(itemCal) <= 60;
        const calorieLabel = totalCal === null ? (window.GLKOAITestLanguage?.currentLang === 'en' ? 'Unknown' : 'Bilinmiyor') : Math.round(totalCal);
        const english = window.GLKOAITestLanguage?.currentLang === 'en';
        const langKey = english ? 'en' : 'tr';
        const portions = Array.isArray(refItem?.foodPortions) && isFoodMetricUnit(data.unit) && String(data.unit).toLocaleLowerCase('tr') !== 'ml' ? refItem.foodPortions.filter(entry => entry && Number.isFinite(Number(entry.amount)) && Number(entry.amount) > 0).slice(0, 5) : [];
        const dietTags = (Array.isArray(refItem?.foodListTags) ? refItem.foodListTags : []).filter(tag => FOOD_DIET_CODES[tag]);
        const dietHtml = dietTags.length ? `<button type="button" class="food-editor-diet-marker" aria-label="${english ? 'Show food lists' : 'Yiyeceğin listelerini göster'}"><span>${english ? 'THIS FOOD IS IN THE' : 'BU BESİN'}</span><strong>${dietTags.map(tag => FOOD_DIET_CODES[tag]).join(' · ')}</strong><span>${english ? (dietTags.length === 1 ? 'DIET LIST' : 'DIET LISTS') : (dietTags.length === 1 ? 'DİYET LİSTESİNDE' : 'DİYET LİSTELERİNDE')}</span></button>` : '';
        const portionsHtml = portions.length ? `<div class="food-portion-options">${portions.map(entry => `<button type="button" data-food-portion="${Number(entry.amount)}">${escapeHtml(entry[langKey] || '')} ≈ ${Number(entry.amount)} g</button>`).join('')}</div>` : '';

 
        
        panel.innerHTML = `
            <div class="food-editor-heading"><div class="ep-title">${escapeHtml(displayedFoodName(refItem) || name)}</div><button type="button" class="food-editor-close" onclick="FoodLibraryManager.closePanel()" aria-label="${english ? 'Close' : 'Kapat'}"><i class="ph-bold ph-x" aria-hidden="true"></i></button></div>
            <div class="editor-panel-inner">
                <button type="button" class="ep-btn ${isLowCal?'ep-style-red':'ep-style-green'}" aria-label="${english ? 'Decrease amount' : 'Miktarı azalt'}" onclick="FoodLibraryManager.changeAmount(-1)"><i class="ph-bold ph-minus" aria-hidden="true"></i></button>
                <div class="ep-center">
                    <div class="ep-dual-grid">
                        <div class="ep-cell"><span class="ep-val-big">${parseFloat(data.count.toFixed(1))}</span><span class="ep-val-label">${data.unit}</span></div>
                        <div class="ep-divider"></div>
                        <div class="ep-cell"><span class="ep-val-cal">${calorieLabel}</span><span class="ep-val-cal-label">kcal</span></div>
                    </div>
                </div>
                <button type="button" class="ep-btn ${isLowCal?'ep-style-green':'ep-style-red'}" aria-label="${english ? 'Increase amount' : 'Miktarı artır'}" onclick="FoodLibraryManager.changeAmount(1)"><i class="ph-bold ph-plus" aria-hidden="true"></i></button>
            </div>
            ${this.amountWarning ? `<p class="food-amount-warning" role="status">${english ? 'The entered unit cannot be converted automatically. Please choose an amount in the unit shown.' : 'Yazdığınız birim otomatik çevrilemedi. Lütfen miktarı gösterilen birimde seçin.'}</p>` : ''}
            ${portionsHtml}
            ${refItem ? FoodNutrients.describe(refItem, data.count, english) : ''}
            ${dietHtml}
            <div class="food-editor-actions"><div class="food-editor-tools"><button type="button" class="food-editor-delete" onclick="FoodLibraryManager.requestDeleteDefinition()" aria-label="${english ? 'Remove food from list' : 'Yiyeceği listeden kaldır'}" title="${english ? 'Remove food from list' : 'Yiyeceği listeden kaldır'}"><i class="ph-bold ph-trash" aria-hidden="true"></i></button><button type="button" class="food-editor-edit" onclick="FoodLibraryManager.openDefinitionEditor()" aria-label="${english ? 'Edit food' : 'Yiyeceği düzenle'}" title="${english ? 'Edit food' : 'Yiyeceği düzenle'}"><i class="ph-bold ph-pencil-simple" aria-hidden="true"></i></button></div><button type="button" class="ep-ok-btn" onclick="FoodLibraryManager.finishPanel()"><i class="ph-bold ph-check" aria-hidden="true"></i> ${english ? 'DONE' : 'TAMAM'}</button></div>`;
        panel.querySelector('[data-nutrient-info]')?.addEventListener('click', () => FoodNutrients.showInfo(refItem));
        panel.querySelector('.food-editor-diet-marker')?.addEventListener('click', () => this.openFoodListInfo(refItem, dietTags, FOOD_DIET_CODES));
        panel.querySelectorAll('[data-food-portion]').forEach(button => button.addEventListener('click', () => {
            const amount = Number(button.dataset.foodPortion); if (!Number.isFinite(amount) || amount <= 0 || !this.selectedFoods[name]) return;
            this.selectedFoods[name].count = amount; this.updateEditorPanel(); this.renderGrid(''); updateHeaderStats();
        }));
        panel.classList.remove('hidden');
        const dialog = document.getElementById('foodEditorDialog');
        if (dialog && !dialog.open) dialog.showModal();
    },

    finishPanel() {
        if (this.pendingFoodDraft && this.editingItem) {
            const food=this.library.find(item=>item.ad===this.editingItem && item._pendingFood),d=this.pendingFoodDraft;
            const error=document.getElementById('newFoodError');
            try {
                const calories=FoodNutrients.read(d.calories);
                if(!food||calories===null||Number.isNaN(calories))throw new Error('calories');
                const nutrients=FoodNutrients.validate(d.nutrients);
                food.bazKalori=calories;food.nutrients=nutrients;food.nutrientSource=d.source||'user';food.source='user';
                delete food._pendingFood;
                try { this.saveLib(); } catch(e) {food._pendingFood=true;throw e;}
                this.pendingFoodDraft=null;
                try { if(typeof FoodLists!=='undefined'&&!FoodLists.active().includes('__manual__')) FoodLists.setActive('__manual__',true); } catch (e) { console.error('Food list activation:',e); }
                this.closePanel();this.renderGrid('');updateHeaderStats();
                showToast(window.GLKOAITestLanguage?.currentLang==='en'?'Food added.':'Yemek eklendi.','success');return;
            } catch(e) {if(error){error.hidden=false;error.textContent=window.GLKOAITestLanguage?.currentLang==='en'?'Enter valid calories and non-negative nutrition values; sugar cannot exceed carbohydrate.':'Geçerli kalori ve sıfırdan küçük olmayan değerler girin; şeker karbonhidrattan fazla olamaz.';}return;}
        }
        if (!this.quickWaterState) { this.closePanel(); return; }
        const name = this.editingItem, food = this.library.find(item => item.ad === name);
        const selection = this.selectedFoods[name];
        if (!food || !selection || !Number.isFinite(Number(selection.count)) || Number(selection.count) <= 0 || waterCupsFor(name, selection.unit, selection.count) <= 0) {
            showToast(window.GLKOAITestLanguage?.currentLang === 'en' ? 'Choose an amount of water.' : 'Su miktarını seçin.', 'warn'); return;
        }
        const now = new Date();
        let id = now.getTime(); while (DataManager.getItem(id)) id++;
        const form = { dateStr: `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth()+1).padStart(2, '0')}.${now.getFullYear()}`, time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, timestamp: now.getTime(), diets: [`${name} (${Number(selection.count)} ${selection.unit})`], nutritionSnapshots: [FoodNutrients.snapshot(food, selection.count)] };
        const previous = DataManager.getAll().slice();
        try { DataManager.addOrUpdate(buildIndependentEntry('nutrition', form, {}, id)); }
        catch (_) { DataManager._data = previous; showToast(window.GLKOAITestLanguage?.currentLang === 'en' ? 'Could not save.' : 'Kaydedilemedi.', 'error'); return; }
        this.closePanel();
        try { renderList(); updateHeaderStats(); updateHeaderDots(); updateSaveButtonVisibility(); } catch (error) { console.error('Water display refresh failed:', error); }
        showToast(window.GLKOAITestLanguage?.currentLang === 'en' ? 'Saved.' : 'Kaydedildi.', 'success');
    },
    openQuickWater() {
        if (this.quickWaterState) return;
        if (document.body.classList.contains('edit-mode-active')) { showToast(window.GLKOAITestLanguage?.currentLang === 'en' ? 'Finish editing the record first.' : 'Önce kayıt düzenlemeyi tamamlayın.', 'warn'); return; }
        let food = this.library.find(item => !item.foodListArchived && (item.foodIsWater === true || ['su', 'water'].includes(String(item.ad || '').trim().toLocaleLowerCase('tr'))) && ['ml', 'bardak', 'glass'].includes(String(item.birim || '').trim().toLocaleLowerCase('tr')));
        if (!food) {
            let key = 'Su', suffix = 0;
            while (this.library.some(item => String(item.ad || '').toLocaleLowerCase('tr') === key.toLocaleLowerCase('tr'))) key = `Su · hızlı ${++suffix}`;
            food = { ad: key, foodLocalName: 'Su', birim: 'ml', bazKalori: 0, foodIsWater: true, calorieMethod: 'user' };
            try { localStorage.setItem('customFoodLibrary', JSON.stringify([food, ...this.library])); }
            catch (_) { showToast(window.GLKOAITestLanguage?.currentLang === 'en' ? 'Could not open water.' : 'Su açılamadı.', 'error'); return; }
            this.library.unshift(food);
        }
        const dialog = document.getElementById('foodEditorDialog');
        if (!dialog) return;
        this.quickWaterState = { selectedFoods: this.selectedFoods, parent: dialog.parentNode, next: dialog.nextSibling };
        this.selectedFoods = {};
        document.body.appendChild(dialog);
        this.editingItem = null;
        this.startEditing(food.ad, food.birim, food.bazKalori);
    },
    closePanel() {
        if(this.pendingFoodDraft){const pending=this.library.find(x=>x._pendingFood);if(pending){delete this.selectedFoods[pending.ad];this.library=this.library.filter(x=>x!==pending);}this.pendingFoodDraft=null;}
        const quick = this.quickWaterState;
        this.quickWaterState = null;
        if (quick) this.selectedFoods = quick.selectedFoods;
        this.editingItem = null;
        this.amountEditInitial = null;
        this.amountWarning = false;
        document.getElementById('foodEditorPanel').classList.add('hidden');
        const dialog = document.getElementById('foodEditorDialog');
        if (dialog?.open) dialog.close();
        if (quick && dialog && quick.parent) quick.parent.insertBefore(dialog, quick.next && quick.next.parentNode === quick.parent ? quick.next : null);
        this.renderGrid('');
        updateHeaderStats(); 
    },

    renderGrid(filter = '') {
        const container = document.getElementById('foodGridContainer');
        if(!container) return;
        container.innerHTML = '';
        const parsedFilter = SmartParser.parse(filter);
        const lowerFilter = (parsedFilter?.amountSpecified && parsedFilter.name ? parsedFilter.name : filter).toLocaleLowerCase('tr').trim();
        const activeFoodLists = typeof FoodLists === 'undefined' ? null : FoodLists.active();
        let displayList = [];
        if (lowerFilter.length === 0) { displayList = this.library.filter(item => typeof FoodLists === 'undefined' || FoodLists.visible(item, activeFoodLists)); } 
        else {
            const localMatches = this.library.filter(item => (typeof FoodLists === 'undefined' || FoodLists.visible(item, activeFoodLists)) && [item.ad, item.foodLocalName, item.foodCatalogNames?.tr, item.foodCatalogNames?.en, displayedFoodName(item)].some(value => typeof value === 'string' && value.toLocaleLowerCase('tr').includes(lowerFilter)));
            displayList = [...localMatches];
            if (typeof YEMEK_VERITABANI !== 'undefined' && YEMEK_VERITABANI.kokler && (typeof FoodLists === 'undefined' || activeFoodLists.includes('__database__'))) {
                const existingNames = new Set(displayList.map(i => i.ad.toLocaleLowerCase('tr')));
                YEMEK_VERITABANI.kokler.forEach(root => {
                    if (root.anahtarKelimeler.some(kw => kw.toLocaleLowerCase('tr').includes(lowerFilter))) {
                        const standardName = root.anahtarKelimeler[0];
                        if (!existingNames.has(standardName.toLocaleLowerCase('tr'))) {
                            const parsedData = SmartParser.parse(standardName);
                            displayList.push({ ad: standardName, birim: parsedData ? parsedData.unit : 'Porsiyon', bazKalori: root.bazKalori, isDbSuggestion: true });
                            existingNames.add(standardName.toLocaleLowerCase('tr'));
                        }
                    }
                });
            }
        }

        displayList.sort((a, b) => (this.selectedFoods[b.ad]?.count || 0) - (this.selectedFoods[a.ad]?.count || 0) || (Number(b.freq) || 0) - (Number(a.freq) || 0) || Number(Boolean(b.cuisineCategory)) - Number(Boolean(a.cuisineCategory)));
        let grandTotal = 0, waterTotal = 0, unknownSelectedCalories = 0;
        const selectedNames = [];
        Object.keys(this.selectedFoods).forEach(fname => {
            const sel = this.selectedFoods[fname];
            if (sel.count > 0) {
            selectedNames.push(fname);
                // [REAKTİF] Su kontrolü burada
                waterTotal += waterCupsFor(fname, sel.unit, sel.count);
                
                const ref = this.library.find(i => i.ad === fname) || (this.findInGlobalDB(fname)?.item);
                const cal = foodCalories(ref?.bazKalori, sel.unit, sel.count);
                if (cal === null) unknownSelectedCalories++; else grandTotal += cal;
            }
        });

        const totalWrapper = document.getElementById('liveTotalWrapper');
        const labelEl = document.getElementById('totalLabel');
        if (labelEl) labelEl.innerHTML = '';
        if (totalWrapper) {
            if (selectedNames.length > 0) { 
                totalWrapper.classList.remove('hidden'); totalWrapper.classList.add('flex');
                let displayHTML = `<span class="text-base font-black tabular-nums block leading-none">≈ ${Math.round(grandTotal)}</span><span class="text-[8px] font-bold opacity-70 block mt-0.5">kcal</span>`;
                if (waterTotal > 0) {
                     const currentMl = Math.round(waterTotal * 250);
                     displayHTML += `<div class="w-full h-[1px] bg-white/20 my-1"></div><span class="text-sm font-black tabular-nums block leading-none text-cyan-300">${currentMl}</span><span class="text-[8px] font-bold opacity-70 block mt-0.5 text-cyan-200">ml ${window.GLKOAITestLanguage?.currentLang === 'en' ? 'Water' : 'Su'}</span>`;
                }
                if (unknownSelectedCalories > 0) displayHTML += `<span class="food-calorie-unknown">${window.GLKOAITestLanguage?.currentLang === 'en' ? 'Some calories unknown' : 'Eksik kalori bilgisi'}</span>`;
                document.getElementById('liveTotalValue').innerHTML = displayHTML;
                if (labelEl && selectedNames.length > 0) {
                    const fragment = document.createDocumentFragment();
                    selectedNames.forEach(name => {
                        const row = document.createElement('div');
                        row.className = 'selected-food-row';

                        const removeBtn = document.createElement('button');
                        removeBtn.type = 'button';
                        removeBtn.className = 'selected-food-remove';
                        removeBtn.innerHTML = '<i class="ph-bold ph-x" aria-hidden="true"></i>';
                        const removeText = window.GLKOAITestLanguage?.currentLang === 'en' ? 'Remove from selection' : 'Seçimden çıkar';
                        removeBtn.setAttribute('aria-label', removeText); removeBtn.title = removeText;
                        removeBtn.addEventListener('click', (ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            this.removeSelection(name);
                        });

                        const nameSpan = document.createElement('span');
                        nameSpan.className = 'selected-food-name';
                        nameSpan.textContent = displayedFoodName(this.library.find(item => item.ad === name)) || name;

                        row.appendChild(removeBtn);
                        row.appendChild(nameSpan);
                        fragment.appendChild(row);
                    });
                    labelEl.appendChild(fragment);
                }
            } else { totalWrapper.classList.add('hidden'); totalWrapper.classList.remove('flex'); }
        }

        const emptyMsg = document.getElementById('emptyStateMsg');
        const addContainer = document.getElementById('addFoodContainer');
        const noMatches = displayList.length === 0;
        if (addContainer) addContainer.hidden = !(lowerFilter && noMatches);
        if (emptyMsg) {
            emptyMsg.className = noMatches ? 'block text-center text-slate-500 text-xs py-4' : 'hidden';
            emptyMsg.dataset.testTr = lowerFilter ? 'Yiyecek bulunamadı. İsterseniz yemek ekleyebilirsiniz.' : 'Liste boş. Arayabilir veya liste seçebilirsiniz.';
            emptyMsg.dataset.testEn = lowerFilter ? 'No food found. You can add it.' : 'The list is empty. Search or choose a list.';
            emptyMsg.textContent = window.GLKOAITestLanguage?.currentLang === 'en' ? emptyMsg.dataset.testEn : emptyMsg.dataset.testTr;
        }

        displayList.forEach(item => {
            const btn = document.createElement('div');
            let pressTimer;
            let isLongPress = false; 

            const startPress = (e) => {
                if (e.button !== 0 && e.type === 'mousedown') return; 
                isLongPress = false;
                btn.style.transform = "scale(0.95)"; 
                
                pressTimer = setTimeout(() => {
                    isLongPress = true; 
                    if (navigator.vibrate) navigator.vibrate(50); 
                    if(this.library.find(l => l.ad === item.ad)) {
                        this.startEditing(item.ad, item.birim, item.bazKalori);
                    }
                    btn.style.transform = "scale(1)";
                }, 800);
            };

            const endPress = (e) => {
                clearTimeout(pressTimer);
                btn.style.transform = "scale(1)";
                
                if (!isLongPress && e.type !== 'pointercancel' && e.type !== 'mouseleave') {
                    const typed = SmartParser.parse(document.getElementById('foodSearchInput')?.value || '');
                    if (typed?.invalidAmount) { showToast(window.GLKOAITestLanguage?.currentLang === 'en' ? 'Enter an amount greater than zero.' : 'Sıfırdan büyük bir miktar girin.', 'warn'); return; }
                    this.startEditing(item.ad, item.birim, item.bazKalori, typed);
                }
            };
            
            btn.addEventListener('pointerdown', startPress);
            btn.addEventListener('pointerup', endPress);
            btn.addEventListener('pointerleave', () => { clearTimeout(pressTimer); btn.style.transform = "scale(1)"; });

            const count = this.selectedFoods[item.ad]?.count || 0;
            const isEditing = (this.editingItem === item.ad);
            let calDisplay = (item.bazKalori !== undefined && item.bazKalori !== null) ? `≈ ${item.bazKalori} kcal${isFoodMetricUnit(item.birim) ? (String(item.birim).toLocaleLowerCase('tr') === 'ml' ? ' / 100 ml' : ' / 100 g') : ''}` : (window.GLKOAITestLanguage?.currentLang === 'en' ? 'Calories unknown' : 'Kalori bilinmiyor');
            if(count > 0) {
                let tCal = foodCalories(item.bazKalori, item.birim, count);
                calDisplay = tCal === null ? (window.GLKOAITestLanguage?.currentLang === 'en' ? 'Calories unknown' : 'Kalori bilinmiyor') : `(≈ ${Math.round(tCal)} kcal)`;
            }
            const band = this.resolveCalorieBand(item.bazKalori);
            const highlight = this.aiHighlights[item.ad] || null;
            let groupKey = item.aiGroup || (highlight && highlight.group) || null;
            const groupStyle = groupKey ? this._resolveGroupStyle(groupKey) : null;
            let accentColor = (highlight && highlight.border) || (groupStyle && groupStyle.border) || null;
            let haloColor = (highlight && highlight.halo) || (groupStyle && groupStyle.halo) || accentColor;
            const highlightOnly = !!highlight && !groupKey;
            const datasetGroup = groupKey || (highlightOnly ? 'ai-highlight' : null);
            const resolvedAccent = accentColor || 'rgba(148, 163, 184, 0.55)';
            const resolvedHalo = haloColor || resolvedAccent;
            const labelText = datasetGroup ? ((groupStyle && groupStyle.label) || (highlight && highlight.label) || (datasetGroup === 'ai-highlight' ? 'AI' : '')) : '';
            let chipHtml = '';
            const classes = ['food-item-btn'];
            if (highlight) classes.push('ai-food');
            if (count > 0) classes.push('selected');
            if (isEditing) classes.push('border-indigo-500', 'ring-2', 'ring-indigo-500/50');
            btn.className = classes.join(' ');
            const nameClass = count > 0 ? 'font-bold text-white' : 'text-white';
            const subClass = count > 0 ? 'text-red-300 font-bold' : 'text-red-400 opacity-80';
            if (datasetGroup && labelText) {
                btn.style.setProperty('--ai-chip-color', resolvedAccent);
                btn.style.setProperty('--ai-chip-bg', resolvedHalo);
                chipHtml = `<span class="ai-group-chip">${escapeHtml(labelText)}</span>`;
            } else {
                btn.style.removeProperty('--ai-chip-color');
                btn.style.removeProperty('--ai-chip-bg');
            }
            const dietCodes = FOOD_DIET_CODES;
            const dietTags = (Array.isArray(item.foodListTags) ? item.foodListTags : []).filter(tag => dietCodes[tag]);
            const dietMarkers = dietTags.map(tag => dietCodes[tag]);
            const dietHtml = dietMarkers.length ? `<button type="button" class="food-diet-marker" aria-label="${window.GLKOAITestLanguage?.currentLang === 'en' ? 'Show food lists' : 'Yiyeceğin listelerini göster'}">${dietMarkers.join(' · ')}</button>` : '';
            btn.innerHTML = `${chipHtml}${dietHtml}<div class="flex flex-col items-center justify-center leading-tight w-full px-1 pointer-events-none select-none"><span class="text-center text-[11px] leading-tight break-words w-full ${nameClass}">${escapeHtml(displayedFoodName(item))}</span><span class="text-[9px] ${subClass} mt-0.5">${calDisplay}</span></div>`;
            const marker = btn.querySelector('.food-diet-marker');
            if (marker) {
                for (const type of ['pointerdown','pointerup','pointercancel']) marker.addEventListener(type, event => event.stopPropagation());
                marker.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); this.openFoodListInfo(item,dietTags,dietCodes); });
            }
            btn.dataset.calorieBand = band.key;
            btn.style.removeProperty('background');
            btn.style.removeProperty('background-color');
            btn.style.removeProperty('border-color');
            btn.style.removeProperty('box-shadow');

            let shadowBase = 'rgba(99, 72, 95, 0.24)';
            let shadowAccent = 'rgba(99, 72, 95, 0.36)';
            if (band.key === 'sub100') {
                shadowBase = 'rgba(64, 96, 109, 0.26)';
                shadowAccent = 'rgba(64, 96, 109, 0.36)';
            } else if (band.key === 'sub200') {
                shadowBase = 'rgba(99, 95, 71, 0.26)';
                shadowAccent = 'rgba(99, 95, 71, 0.36)';
            } else if (band.key === 'none') {
                shadowBase = 'rgba(148, 163, 184, 0.2)';
                shadowAccent = 'rgba(148, 163, 184, 0.3)';
            }

            let boxShadow = `0 6px 16px ${shadowBase}`;
            if (count > 0) boxShadow += `, 0 0 14px ${shadowAccent}`;

            if (datasetGroup) {
                btn.dataset.aiGroup = datasetGroup;
            } else {
                delete btn.dataset.aiGroup;
                btn.style.removeProperty('--ai-chip-color');
                btn.style.removeProperty('--ai-chip-bg');
            }

            if(/^#[0-9a-f]{6}$/i.test(item.cuisineColor||''))btn.style.borderColor=item.cuisineColor;
            btn.style.boxShadow = boxShadow;
            if(count > 0) { const badge = document.createElement('span'); badge.className = 'food-badge'; badge.textContent = parseFloat(count.toFixed(1)); btn.appendChild(badge); }
            container.appendChild(btn);
        });
        this.renderAiLegend();
        updateSaveButtonVisibility();
    },

    openFoodListInfo(item,tags,codes) {
        const dialog=document.getElementById('foodListInfoDialog'), title=document.getElementById('foodListInfoTitle'), list=document.getElementById('foodListInfoItems');
        if(!dialog||!title||!list)return;
        const english=window.GLKOAITestLanguage?.currentLang==='en';
        title.textContent=displayedFoodName(item)||item.ad;
        list.replaceChildren();
        const catalogs=typeof FoodLists!=='undefined'?FoodLists.allCatalogs():[];
        tags.forEach(tag=>{const entry=catalogs.find(x=>x.id===tag);const row=document.createElement('li'),code=document.createElement('strong'),label=document.createElement('span');code.textContent=codes[tag]||tag;label.textContent=entry?(entry[english?'en':'tr']||entry.tr):tag;row.append(code,label);list.appendChild(row);});
        if(!dialog.open)dialog.showModal();
    },

    renderAiLegend() {
        const legendEl = document.getElementById('aiGroupLegend');
        if (!legendEl) return;

        const legendMap = new Map();
        this.library.filter(item => !item.foodListArchived).forEach(item => {
            const highlight = this.aiHighlights[item.ad];
            const groupKey = item.aiGroup || (highlight && highlight.group);
            if (!groupKey || groupKey === 'ai-highlight') return;
            const style = this._resolveGroupStyle(groupKey);
            const meta = this.aiGroupMeta[groupKey] || {};
            const code = (highlight && highlight.label) || meta.code || (style && style.label) || this._normalizeGroupCode(groupKey);
            const label = (highlight && highlight.legend) || meta.label || (style && style.legend) || this._humanizeGroupLabel(groupKey);
            const color = (highlight && highlight.border) || (style && style.border) || 'rgba(148, 163, 184, 0.55)';
            legendMap.set(groupKey, { code, label, color });
        });

        const labels = { mediterranean: ['AKD', 'Akdeniz tipi beslenme', 'Mediterranean-style eating'], vegetarian: ['VEJ', 'Vejetaryen', 'Vegetarian'], vegan: ['VGN', 'Vegan', 'Vegan'] };
        this.library.filter(item => !item.foodListArchived).forEach(item => (Array.isArray(item.foodListTags) ? item.foodListTags : []).forEach(tag => {
            if (labels[tag] && !legendMap.has(`food-${tag}`)) { const entry = labels[tag]; legendMap.set(`food-${tag}`, { code: entry[0], label: window.GLKOAITestLanguage?.currentLang === 'en' ? entry[2] : entry[1], color: '#fdba74' }); }
        }));
        if (legendMap.size === 0) {
            legendEl.classList.add('hidden');
            legendEl.innerHTML = '';
            return;
        }

        const legendHtml = Array.from(legendMap.values()).map(({ code, label, color }) => {
            const safeCode = escapeHtml(code);
            const safeLabel = escapeHtml(label);
            return `<div class="ai-legend-item" style="--ai-legend-color:${color}"><span class="ai-legend-code">${safeCode}</span><span class="ai-legend-label">${safeLabel}</span></div>`;
        }).join('');

        legendEl.innerHTML = legendHtml;
        legendEl.classList.remove('hidden');
    },

    addFromSearch() {
        const input = document.getElementById('foodSearchInput');
        const val = input.value.trim();
        if (this.searchTimer) { clearTimeout(this.searchTimer); this.searchTimer = null; }
        
        if(!val) {
            // Boşsa input'a odaklan ve uyarı göster
            input.focus();
            showToast('Lütfen bir yemek adı girin', 'warn');
            return;
        }
        
        const parsed = SmartParser.parse(val);
        if (!parsed?.name || parsed.invalidAmount) { showToast(window.GLKOAITestLanguage?.currentLang === 'en' ? 'Enter a food name and an amount greater than zero.' : 'Yemek adı ve sıfırdan büyük bir miktar girin.', 'warn'); return; }
        const key = parsed.name.toLocaleLowerCase('tr');
        let item = this.library.find(i => !i.foodListArchived && [i.ad, i.foodLocalName, i.foodCatalogNames?.tr, i.foodCatalogNames?.en].some(name => typeof name === 'string' && name.toLocaleLowerCase('tr') === key));
        
        if(!item) {
            let foundCal = null;
            const result = this.findInGlobalDB(parsed.name);
            if (result?.type === 'exact' && (SmartParser.normalizeUnit(SmartParser.parse(result.item.anahtarKelimeler?.[0] || parsed.name)?.unit) === SmartParser.normalizeUnit(parsed.unit))) foundCal = result.item.bazKalori;
            
            let storageName = parsed.name;
            let suffix = 0;
            while (this.library.some(i => String(i.ad || '').toLocaleLowerCase('tr') === storageName.toLocaleLowerCase('tr'))) storageName = `${parsed.name} · v${Date.now()}-${++suffix}`;
            item = {
                ad: storageName,
                foodLocalName: parsed.name,
                birim: parsed.unit,
                katsayi: parsed.katsayi,
                freq: 1,
                bazKalori: foundCal
            };
            item._pendingFood=true;
            this.pendingFoodDraft={calories:foundCal===null?'':String(foundCal),nutrients:{protein:'',carbohydrate:'',sugar:'',fat:'',salt:''},aiOpen:false,aiService:'gemini',reply:'',source:'user'};
            this.library.unshift(item);
            input.value='';this.startEditing(item.ad,item.birim,item.bazKalori,parsed);return;
        }
        
        this.saveLib();
        // Input'u temizle ve odaklan
        input.value = '';
        this.startEditing(item.ad, item.birim, item.bazKalori, parsed);
        
        // Başarı mesajı göster
        showToast(`"${parsed.name}" eklendi`, 'success');
    },
    
    handleSearch(query) { if (this.searchTimer) clearTimeout(this.searchTimer); this.searchTimer = setTimeout(() => this.renderGrid(query), 500); },
    _normalizeJsonSnippet(rawTxt) {
        if (!rawTxt) return '';
        let txt = rawTxt.trim();
        if (!txt) return '';
        // strip optional code fences and smart quotes the AI might include
        txt = txt.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
        txt = txt.replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'");
        txt = txt.replace(/\u00a0/g, ' ');
        return txt;
    },
    _deriveJsonCandidates(baseTxt) {
        const candidates = new Set();
        if (!baseTxt) return candidates;
        const pushCandidate = val => { if (val && !candidates.has(val)) candidates.add(val); };
        pushCandidate(baseTxt);
        const withoutTrailingCommas = baseTxt.replace(/,\s*([}\]])/g, '$1');
        pushCandidate(withoutTrailingCommas);
        if (!baseTxt.includes('"') && baseTxt.includes("'")) {
            const swappedQuotes = withoutTrailingCommas.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (match, inner) => `"${inner.replace(/"/g, '\\"')}"`);
            pushCandidate(swappedQuotes);
        }
        const arrayStart = baseTxt.indexOf('[');
        const arrayEnd = baseTxt.lastIndexOf(']');
        if (arrayStart !== -1 && arrayEnd > arrayStart) {
            pushCandidate(baseTxt.slice(arrayStart, arrayEnd + 1));
        }
        const objectStart = baseTxt.indexOf('{');
        const objectEnd = baseTxt.lastIndexOf('}');
        if (objectStart !== -1 && objectEnd > objectStart) {
            pushCandidate(baseTxt.slice(objectStart, objectEnd + 1));
        }
        return candidates;
    },
    _parseImportedJson(rawTxt) {
        const base = this._normalizeJsonSnippet(rawTxt);
        const candidates = Array.from(this._deriveJsonCandidates(base));
        for (const candidate of candidates) {
            try {
                return JSON.parse(candidate);
            } catch (err) { /* try next candidate */ }
        }
        return null;
    },
    _normalizeEnglishFood(item) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
        // Existing Turkish-format entries retain their prior behavior.
        if (item.ad) { const nutrients=FoodNutrients.validate(item.nutrients||{}); const calories=FoodNutrients.read(item.bazKalori); if(calories===null||Number.isNaN(calories))throw new Error('INVALID_ENGLISH_FOOD'); return {...item,bazKalori:calories,nutrients}; }
        const hasEnglishKeys = ['name', 'unit', 'step', 'baseCalories'].some(key => Object.prototype.hasOwnProperty.call(item, key));
        if (!hasEnglishKeys) return item;
        const units = { g: 'gr', gr: 'gr', gram: 'gr', grams: 'gr', ml: 'ml', milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml', piece: 'Adet', glass: 'Bardak', serving: 'Porsiyon', portion: 'Porsiyon', slice: 'Dilim', bowl: 'Kase' };
        const name = typeof item.name === 'string' ? item.name.trim() : '';
        const unit = typeof item.unit === 'string' ? units[item.unit.trim().toLowerCase()] : null;
        const step = item.step;
        const calories = item.baseCalories;
        if (!name || !unit || typeof step !== 'number' || !Number.isFinite(step) || step <= 0 || typeof calories !== 'number' || !Number.isFinite(calories) || calories < 0) {
            throw new Error('INVALID_ENGLISH_FOOD');
        }
        return { ad: name, birim: unit, katsayi: step, bazKalori: calories, nutrients:FoodNutrients.validate(item.nutrients||{}) };
    },
    setImportStatus(tr, en, kind = 'info') {
        const status = document.getElementById('foodImportStatus');
        if (!status) return;
        status.textContent = window.GLKOAITestLanguage?.currentLang === 'en' ? en : tr;
        status.dataset.kind = kind;
        status.hidden = !status.textContent;
    },
    previewImport() {
        const area = document.getElementById('jsonImportArea');
        const value = area?.value?.trim() || '';
        if (!value) { this.setImportStatus('', ''); return; }
        const parsed = this._parseImportedJson(value);
        const groups = parsed && this._extractJsonGroups(parsed);
        if (!Array.isArray(groups) || !groups.length) {
            this.setImportStatus('Liste henüz okunamadı. Yanıtın tamamını kopyaladığınızı kontrol edin.', 'The list could not be read yet. Check that you copied the entire response.', 'warn');
            return;
        }
        const items = groups.flatMap(group => group.items || []);
        const count = items.filter(item => item && typeof (item.ad || item.name) === 'string' && (item.ad || item.name).trim()).length;
        if (!count || count !== items.length) {
            this.setImportStatus('Bazı yemeklerin adı okunamadı. Yapay zekâ yanıtını kontrol edin.', 'Some food names could not be read. Check the AI response.', 'warn');
            return;
        }
        this.setImportStatus(`${count} yemek bulundu. Listeye ekleyebilirsiniz.`, `${count} foods found. You can add the list.`, 'ready');
    },
    async pasteImport() {
        const area = document.getElementById('jsonImportArea');
        if (!area) return;
        if (area.value.trim()) {
            this.setImportStatus('Kutuda metin var. Değiştirmek için önce metni silin.', 'The box already contains text. Clear it before replacing it.', 'warn');
            area.focus();
            return;
        }
        try {
            if (!navigator.clipboard?.readText) throw new Error('clipboard unavailable');
            const value = await navigator.clipboard.readText();
            if (!value.trim()) throw new Error('clipboard empty');
            if (area.value.trim()) {
                this.setImportStatus('Kutuda metin var. Değiştirmek için önce metni silin.', 'The box already contains text. Clear it before replacing it.', 'warn');
                return;
            }
            area.value = value;
            this.previewImport();
        } catch (_) {
            this.setImportStatus('Panoya erişilemedi. Kutuyu seçip Ctrl+V ile veya basılı tutarak yapıştırın.', 'Clipboard unavailable. Select the box and paste with Ctrl+V or touch and hold.', 'warn');
            area.focus();
        }
    },
    importJSON() {
        const area = document.getElementById('jsonImportArea');
        const txt = area ? area.value : '';
        try {
            const parsed = this._parseImportedJson(txt);
            if (!parsed) throw new Error('Invalid JSON');
            const groupEntries = this._extractJsonGroups(parsed);
            if (!Array.isArray(groupEntries) || groupEntries.length === 0) throw new Error('Invalid payload');
            // Validate all new-format items before changing library or highlight data.
            groupEntries.forEach(group => { group.items = group.items.map(item => this._normalizeEnglishFood(item)); });
            let addedCount = 0;
            let updatedCount = 0;
            const importedFoods = new Set();
            let highlightChanged = false;
            let metaChanged = false;
            groupEntries.forEach(({ key, items, meta }) => {
                if (!Array.isArray(items)) return;
                const normalizedKey = key === 'default' ? null : (this._slugifyGroupKey(key) || key);
                const style = normalizedKey ? this._resolveGroupStyle(normalizedKey) : null;
                const resolvedGroupKey = style ? style.key : normalizedKey;
                const metaInfo = meta || {};
                const groupCode = metaInfo.code || (style && style.label) || (resolvedGroupKey ? this._normalizeGroupCode(resolvedGroupKey) : 'AI');
                const groupLegend = metaInfo.label || (style && style.legend) || (resolvedGroupKey ? this._humanizeGroupLabel(resolvedGroupKey) : 'Yapay Zeka');

                items.forEach(i => {
                    if (!i || !i.ad) return;
                    const originalName = String(i.ad).trim();
                    if (!originalName) return;
                    const normalizeName = name => String(name || '').trim().toLocaleLowerCase('tr');
                    // Imported portions can differ from an existing catalog food with the same name.
                    // Reuse only an item from the same imported list; keep the catalog and its history intact.
                    const existing = this.library.find(l => !l.foodHistorySnapshot && l.source === 'json' && (l.aiGroup || null) === resolvedGroupKey && normalizeName(l.foodOriginalName || l.foodLocalName || l.ad) === normalizeName(originalName));

                    let storageName = originalName;
                    let suffix = 1;
                    while (!existing && this.library.some(l => normalizeName(l.ad) === normalizeName(storageName))) {
                        storageName = `${originalName} · ${resolvedGroupKey || 'json'}${suffix > 1 ? ` ${suffix}` : ''}`;
                        suffix++;
                    }

                    const newItem = {
                        ad: storageName,
                        foodLocalName: originalName,
                        foodOriginalName: originalName,
                        birim: i.birim || 'Porsiyon',
                        bazKalori: i.bazKalori === null || i.bazKalori === undefined || i.bazKalori === '' || !Number.isFinite(Number(i.bazKalori)) ? null : Number(i.bazKalori),
                        katsayi: i.katsayi || 1,
                        freq: 0,
                        source: 'json', nutrients: FoodNutrients.validate(i.nutrients || {}), nutrientSource: i.nutrientSource || 'ai_estimate'
                    };

                    if (resolvedGroupKey) {
                        newItem.aiGroup = resolvedGroupKey;
                        const existingMeta = this.aiGroupMeta[resolvedGroupKey] || {};
                        if (!existingMeta.code || existingMeta.code !== groupCode || existingMeta.label !== groupLegend) {
                            this.aiGroupMeta[resolvedGroupKey] = { code: groupCode, label: groupLegend };
                            metaChanged = true;
                        }
                    }

                    let highlightCache = null;
                    const getHighlight = () => {
                        if (highlightCache) return highlightCache;
                        if (style) {
                            highlightCache = this._wrapHighlight(style, style.key, style.badge, groupCode, groupLegend);
                            return highlightCache;
                        }
                        if (existing && this.aiHighlights[existing.ad]) {
                            const prev = { ...this.aiHighlights[existing.ad] };
                            prev.group = resolvedGroupKey || prev.group || null;
                            prev.label = groupCode;
                            prev.legend = groupLegend;
                            highlightCache = prev;
                            return highlightCache;
                        }
                        highlightCache = this._wrapHighlight(this.nextAiColor(), resolvedGroupKey, null, groupCode, groupLegend);
                        return highlightCache;
                    };

                    if (existing) {
                        importedFoods.add(existing.ad);
                        let changed = false;
                        const incoming=FoodNutrients.validate(i.nutrients||{});
                        if (!existing.nutrients) existing.nutrients={};
                        if (existing.nutrientSource !== 'user' && existing.nutrientSource !== 'user_modified_ai') {
                            for(const key of FoodNutrients.keys) if((existing.nutrients[key]===null||existing.nutrients[key]===undefined)&&incoming[key]!==null){existing.nutrients[key]=incoming[key];changed=true;}
                            if(changed&&!existing.nutrientSource)existing.nutrientSource=i.nutrientSource||'ai_estimate';
                        }
                        if (existing.foodListArchived) { existing.foodListArchived = false; changed = true; }
                        if (resolvedGroupKey && existing.aiGroup !== resolvedGroupKey) {
                            existing.aiGroup = resolvedGroupKey;
                            changed = true;
                        }
                        const nextHighlight = getHighlight();
                        if (nextHighlight) {
                            const prevHighlight = this.aiHighlights[existing.ad];
                            const serializedPrev = prevHighlight ? JSON.stringify(prevHighlight) : '';
                            const serializedNext = JSON.stringify(nextHighlight);
                            if (serializedPrev !== serializedNext) {
                                this.aiHighlights[existing.ad] = nextHighlight;
                                highlightChanged = true;
                                changed = true;
                            }
                        }
                        if (changed) updatedCount++;
                        return;
                    }

                    const nextHighlight = getHighlight();
                    if (nextHighlight) {
                        this.aiHighlights[newItem.ad] = nextHighlight;
                        highlightChanged = true;
                    }

                    this.library.push(newItem);
                    importedFoods.add(newItem.ad);
                    addedCount++;
                });
            });
            if (highlightChanged) this.persistHighlights();
            if (metaChanged) this.persistGroupMeta();
            this.saveLib();
            if (importedFoods.size && typeof FoodLists !== 'undefined' && !FoodLists.active().includes('__manual__')) FoodLists.setActive('__manual__', true);
            this.renderGrid();
            if (importedFoods.size > 0) {
                const english = window.GLKOAITestLanguage?.currentLang === 'en';
                showToast(english ? `${importedFoods.size} foods in the list.` : `Listede ${importedFoods.size} yemek var.`, 'success');
                this.setImportStatus(`${importedFoods.size} yemek listeye hazır.`, `${importedFoods.size} foods are ready in the list.`, 'ready');
                if (area) area.value = '';
                AiWizard.collapse(true);
            } else {
                this.setImportStatus('Yemek bulunamadı. Yanıtın tamamını tekrar yapıştırın.', 'No foods found. Paste the complete response again.', 'warn');
                showToast('Zaten listenizde var.', 'warn');
            }
        } catch (e) {
            if (e && e.message === 'INVALID_ENGLISH_FOOD') {
                this.setImportStatus('Bazı yemeklerin birimi, miktarı veya kalorisi geçersiz. Yapay zekâ yanıtını kontrol edin.', 'Some food units, amounts or calories are invalid. Check the AI response.', 'warn');
                showToast(localizedPlaceholder('İngilizce yemek verisi geçersiz: ad, birim, artış ve kalori değerlerini kontrol edin.', 'Invalid English food data: check name, unit, step, and calories.'), 'error');
            } else {
                this.setImportStatus('Liste okunamadı. Yapay zekâ yanıtının tamamını tekrar yapıştırın.', 'The list could not be read. Paste the entire AI response again.', 'warn');
                showToast('JSON Hatası', 'error');
            }
        }
    },
    getSelectedTags() { return Object.entries(this.selectedFoods).filter(([_,d])=>d.count>0).map(([n,d])=>`${n} (${parseFloat(d.count.toFixed(1))} ${d.unit})`); },
    loadSelectionsFromEdit(list) { this.selectedFoods={}; if(list) list.forEach(d=>{ const m=d.match(/(.*) \(([\d\.]+)\s+(.*)\)/); if(m) this.selectedFoods[m[1]]={count:parseFloat(m[2]), unit:m[3]}; }); this.renderGrid(); updateHeaderStats(); }
};

window.addEventListener('load', () => {
    document.getElementById('foodDefinitionForm')?.addEventListener('submit', event => { event.preventDefault(); FoodLibraryManager.saveDefinition(); });
    document.getElementById('foodDefinitionUnit')?.addEventListener('change', () => FoodLibraryManager.updateDefinitionCaloriesLabel());
    const button = document.getElementById('foodImportPasteButton');
    const hint = document.getElementById('foodImportManualHint');
    const clipboardAvailable = window.isSecureContext && typeof navigator.clipboard?.readText === 'function';
    if (button) button.hidden = !clipboardAvailable;
    if (hint) hint.hidden = !!clipboardAvailable;
    const editorDialog = document.getElementById('foodEditorDialog');
    if (editorDialog) editorDialog.addEventListener('cancel', event => { event.preventDefault(); FoodLibraryManager.closePanel(); });
});

// ==========================================
// 4. VERİ YÖNETİCİSİ
// ==========================================
const DataManager = {
    _data: [], _profile: {},
    init() {
        this._data = this._safeRead('sugarData', []);
        this._profile = this._safeRead('userProfile', {});
    },
    getAll() { return this._data; },
    getProfile() { return this._profile; },
    saveProfile(p) { this._profile = p; localStorage.setItem('userProfile', JSON.stringify(this._profile)); },
    addOrUpdate(entry) {
        if (entry.id) { const i = this._data.findIndex(x => x.id == entry.id); if (i > -1) this._data[i] = entry; else this._data.unshift(entry); } 
        else { entry.id = Date.now(); this._data.unshift(entry); }
        this._sortAndSave();
    },
    delete(id) { this._data = this._data.filter(i => i.id != id); this._sortAndSave(); },
    getItem(id) { return this._data.find(i => i.id == id); },
    _sortAndSave() { this._data.sort((a,b) => b.timestamp - a.timestamp); localStorage.setItem('sugarData', JSON.stringify(this._data)); },
    _safeRead(key, fallback) {
        const expectsArray = Array.isArray(fallback);
        const raw = localStorage.getItem(key);
        if (!raw) return expectsArray ? [] : {};
        try {
            const parsed = JSON.parse(raw);
            if (expectsArray) return Array.isArray(parsed) ? parsed : [];
            if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
            return parsed;
        } catch (err) {
            return expectsArray ? [] : {};
        }
    },
    
    getStats(limit = 30) {
        let subset;
        if (limit === 'all') {
            subset = this._data;
        } else {
            const d = new Date();
            d.setDate(d.getDate() - parseInt(limit));
            d.setHours(0,0,0,0);
            subset = this._data.filter(item => item.timestamp >= d.getTime());
        }
        const glikozData = subset.filter(d => d.type !== 'pressure' && d.type !== 'activity' && d.type !== 'nutrition_only' && d.type !== 'symptom_only' && d.type !== 'medication_only');
        const vals = glikozData.map(d => Number(d.val)).filter(v => Number.isFinite(v) && v > 0);
        const avg = vals.length ? vals.reduce((a,b)=>a+b,0) / vals.length : 0;
        
        let cv = '-';
        if(vals.length > 1 && avg > 0) {
            const squareDiffs = vals.map(value => Math.pow(value - avg, 2));
            const avgSquareDiff = squareDiffs.reduce((a,b)=>a+b,0) / (vals.length - 1); 
            const stdDev = Math.sqrt(avgSquareDiff);
            cv = ((stdDev / avg) * 100).toFixed(1);
        }

        const bpData = subset.filter(d => d.type === 'pressure');
        let avgSys=0, avgDia=0, avgPulse=0, loadPercent=0, abnormalPercent=0, avgPP=0;
        if(bpData.length) {
            avgSys = Math.round(bpData.reduce((s,d)=>s+parseInt(d.sys),0)/bpData.length);
            avgDia = Math.round(bpData.reduce((s,d)=>s+parseInt(d.dia),0)/bpData.length);
            const pulses = bpData.filter(d=>d.pulse).map(d=>parseInt(d.pulse));
            if(pulses.length) avgPulse = Math.round(pulses.reduce((a,b)=>a+b,0)/pulses.length);
            const highCount = bpData.filter(d => parseInt(d.sys) > 140 || parseInt(d.dia) > 90).length;
            const abnCount = bpData.filter(d => parseInt(d.sys) < 90 || parseInt(d.dia) < 60 || (d.pulse && (parseInt(d.pulse) < 50 || parseInt(d.pulse) > 100))).length;
            loadPercent = Math.round((highCount / bpData.length) * 100);
            abnormalPercent = Math.round((abnCount / bpData.length) * 100);
            avgPP = avgSys - avgDia;
        }

        const chartSubset = subset.filter(d => d.type !== 'activity' && d.type !== 'nutrition_only' && d.type !== 'symptom_only' && d.type !== 'medication_only').reverse();

        return { 
            count: this._data.length, subsetCount: subset.length, 
            glikoz: { avg, count: vals.length, cv: cv }, 
            bp: { avgSys, avgDia, avgPulse, loadPercent, abnormalPercent, avgPP }, 
            chartData: { 
                gluc: chartSubset.filter(d => d.type !== 'pressure').map(d => ({x: d.timestamp, y: d.val})),
                sys: chartSubset.filter(d => d.type === 'pressure').map(d => ({x: d.timestamp, y: parseInt(d.sys)})),
                dia: chartSubset.filter(d => d.type === 'pressure').map(d => ({x: d.timestamp, y: parseInt(d.dia)}))
            } 
        };
    },
    
    prepareDataForAI() {
        // 1. Kullanıcı Bağlamını Belirle (Klinik vs Sağlıklı Yaşam)
        const profile = DataManager.getProfile();
        const historyAll = DataManager.getAll();
        
        const hasDiabetesProfile = profile.diabetesType && profile.diabetesType !== '';
        const hasMeds = profile.medications && profile.medications.some(m => m.isDiabetesMed || m.isBpMed);
        const hasClinicalMeasurements = historyAll.some(h => (h.val !== undefined && h.val !== null) || h.type === 'pressure');
        
        const isClinicalContext = hasDiabetesProfile || hasMeds || hasClinicalMeasurements;

        // YENİ: İnsülin Kullanımı Kontrolü
        const hasInsulin = profile.medications && profile.medications.some(m => {
            const n = (m.name || '').toLowerCase();
            return n.includes('insülin') || n.includes('insulin') || n.includes('lantus') || n.includes('humalog') || n.includes('novorapid') || n.includes('levemir') || n.includes('toujeo') || n.includes('tresiba') || n.includes('apidra') || n.includes('actrapid') || n.includes('humulin');
        });

        // 2. Doktor Raporunu Al
        let doctorReport = generateDoctorReport(false);
        // İsim bilgisini gizle (Privacy)
        doctorReport = doctorReport.replace(/(?:Ad Soyad|Full Name):.*?\n/, "Ad Soyad: [GİZLENMİŞTİR]\n");

        // 3. Günlük Ölçüm Verilerini Hazırla
        const history = historyAll.slice(0, 60); // Son 60 kayıt yeterli
        let dailyLogs = "";
        const categorizedRecords = {};

        // Kayıtları günlere göre grupla
        history.slice().reverse().forEach(h => {
            const dateKey = h.dateStr;
            if (!categorizedRecords[dateKey]) categorizedRecords[dateKey] = [];
            
            let line = "";
            if (h.val !== undefined && h.val !== null) {
                // Şeker
                line = `⏰ ${h.time} | ŞEKER: ${h.val} mg/dL (${AppConfig.CATEGORIES[h.category]?.label || h.category})`;
                if (h.diets && h.diets.length) line += ` | Yenen: ${h.diets.join(', ')}`;
            } else if (h.type === 'pressure') {
                // Tansiyon
                line = `⏰ ${h.time} | TANSİYON: ${h.sys}/${h.dia} mmHg`;
                if(h.pulse) line += ` Nabız: ${h.pulse}`;
            } else if (h.type === 'activity') {
                // Aktivite
                line = `⏰ ${h.time} | AKTİVİTE: ${h.name} (${h.duration} dk)`;
            } else if (h.type === 'nutrition_only' || (h.diets && h.diets.length)) {
                // Sadece Beslenme
                line = `⏰ ${h.time} | BESLENME: ${h.diets.join(', ')}`;
            } else if (h.type === 'symptom_only') {
                // Sadece Belirti
                line = `⏰ ${h.time} | BELİRTİ: ${h.symptoms.join(', ')}`;
            } else if (h.type === 'medication_only') {
                line = `⏰ ${h.time} | İLAÇ: ${h.drugs || ''}`;
            }
            
            if(line) categorizedRecords[dateKey].push(line);
        });

        // Tarihleri yeniden eskiye sırala
        const sortedDates = Object.keys(categorizedRecords).sort((a, b) => {
            const da = a.split('.').reverse().join('-');
            const db = b.split('.').reverse().join('-');
            return new Date(db) - new Date(da);
        });

        dailyLogs += `\n[ GÜNLÜK AKTİVİTE VE BESLENME GÜNLÜĞÜ (Son 60 Kayıt) ]\n`;
        sortedDates.forEach(d => {
            dailyLogs += `\n--- ${d} ---\n`;
            dailyLogs += categorizedRecords[d].join('\n') + '\n';
        });

        // 4. AI Talimatları (Dinamik)
        let aiInstructions = `\n\n<!-- YZ TALİMATI: \n`;
        
        if (isClinicalContext) {
            // KLİNİK / HASTA MODU
            aiInstructions += `Yukarıdaki "DOKTOR RAPORU" hastanın klinik geçmişini, "GÜNLÜK GÜNLÜK" ise son verilerini içerir.\n`;
            aiInstructions += `Bu iki veri setini birleştirerek TIBBİ ve BÜTÜNCÜL bir analiz yap:\n`;
            aiInstructions += `1. Kan şekeri regülasyonu ve dalgalanmaları nasıl? (Hipoglisemi/Hiperglisemi riski var mı?)\n`;
            
            if (hasInsulin) {
                aiInstructions += `   * İnsülin veya diğer ilaçların dozunu değerlendirme ya da doz değişikliği önerme; soruları hekime yönlendir.\n`;
            }

            aiInstructions += `2. Tansiyon seyri ve şeker ile ilişkisi nedir?\n`;
            aiInstructions += `3. Beslenme alışkanlıkları ve ölçüm sonuçları arasındaki ilişkiyi değerlendir.\n`;
            aiInstructions += `4. Mevcut klinik tabloya (hastalıklar, ilaçlar) göre riskler nelerdir?\n`;
            aiInstructions += `5. Hastanın yaşam kalitesini artırmak için 5 somut, uygulanabilir öneri ver.\n`;
        } else {
            // SAĞLIKLI YAŞAM / FITNESS MODU
            aiInstructions += `Yukarıdaki veriler, sağlıklı yaşam, beslenme ve egzersiz takibi yapan bir kullanıcının kayıtlarıdır.\n`;
            aiInstructions += `Bu verileri analiz ederek kişisel bir SAĞLIK KOÇU ve BESLENME UZMANI gibi davran:\n`;
            aiInstructions += `1. Beslenme alışkanlıklarını (Öğün içeriği, zamanlama, çeşitlilik) değerlendir. Dengeli mi?\n`;
            aiInstructions += `2. Aktivite düzeyi ve egzersiz rutini yeterli mi? Geliştirilebilir mi?\n`;
            aiInstructions += `3. Su tüketimi ve genel hidrasyon durumu nasıl?\n`;
            aiInstructions += `4. Vücut kompozisyonu hedeflerine (Kilo kontrolü, kas kazanımı vb.) ulaşmak için stratejik öneriler.\n`;
            aiInstructions += `5. Daha enerjik ve fit olmak için 5 somut "Bio-hacking" veya yaşam tarzı tavsiyesi ver.\n`;
        }
        
        aiInstructions += `Yanıtını doğrudan kullanıcıya hitaben, motive edici, pozitif ve profesyonel bir dille yaz. -->\n`;

        // Hepsini Birleştir
        const finalPrompt = doctorReport + dailyLogs + aiInstructions;

        showAiModal(finalPrompt, { openAiTab: true, successMessage: 'Analiz promptu panoya kopyalandı.' });
    },

    clearAll() {
        const keys = [
            'sugarData',
            'userProfile',
            'customFoodLibrary',
            'activityList',
            'customSymptoms',
            'assistantData',
            'aiAnalysisHistory',
            'hasSeenOnboarding_v3',
            'cardOrder',
            'appLanguage',
            'foodListSetupCompleted',
            'foodListSelection',
            'foodListActive',
            'foodListDownloaded',
            'customCuisineLists'
        ];
        keys.forEach(key => localStorage.removeItem(key));
        location.reload();
    },
    async exportJSON() {
        const dataStr = JSON.stringify({ 
            sugarData: this._data, 
            userProfile: this._profile, 
            customFoodLibrary: FoodLibraryManager.library,
            assistantData: safeParseStorage('assistantData', []),
            foodListSelection: safeParseStorage('foodListSelection', []),
            foodListActive: localStorage.getItem('foodListActive') === null ? null : safeParseStorage('foodListActive', []),
            foodListSetupCompleted: localStorage.getItem('foodListSetupCompleted') === '1',
            foodListDownloaded: safeParseStorage('foodListDownloaded', {}),
            customCuisineLists: safeParseStorage('customCuisineLists', [])
        }, null, 2);

        const d = new Date();
        const fileName = `G${d.getFullYear().toString().slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}.json`;
        
        try {
            if (window.showSaveFilePicker) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{ description: 'GLKOAI Yedek Dosyası', accept: { 'application/json': ['.json'] } }],
                });
                const writable = await handle.createWritable();
                await writable.write(dataStr);
                await writable.close();
                markBackupCompleted();
                showToast('Yedek kaydedildi.', 'success');
                return;
            }
        } catch (err) {
            if (err.name === 'AbortError') return;
        }

        const blob = new Blob([dataStr], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        markBackupCompleted();
        showToast('Yedek kaydedildi.', 'success');
    },
    importJSON(event) {
        const file = event.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => { 
            try { 
                const j = JSON.parse(e.target.result); 
                if (Object.prototype.hasOwnProperty.call(j, 'assistantData') && !Array.isArray(j.assistantData)) throw new Error('Invalid reminder data');
                if (Object.prototype.hasOwnProperty.call(j, 'assistantData')) localStorage.setItem('assistantData', JSON.stringify(j.assistantData));
                if(j.sugarData) this._data = j.sugarData; 
                if(j.userProfile) this.saveProfile(j.userProfile);
                if(j.customFoodLibrary) { FoodLibraryManager.library = j.customFoodLibrary; FoodLibraryManager.saveLib(); }
                if (Array.isArray(j.customCuisineLists)) localStorage.setItem('customCuisineLists', JSON.stringify(j.customCuisineLists));
                if (Array.isArray(j.foodListSelection)) localStorage.setItem('foodListSelection', JSON.stringify(j.foodListSelection));
                if (Array.isArray(j.foodListActive)) localStorage.setItem('foodListActive', JSON.stringify(j.foodListActive));
                else if (Object.prototype.hasOwnProperty.call(j, 'foodListActive') && j.foodListActive === null) localStorage.removeItem('foodListActive');
                if (typeof j.foodListSetupCompleted === 'boolean') localStorage.setItem('foodListSetupCompleted', j.foodListSetupCompleted ? '1' : '0');
                if (j.foodListDownloaded && typeof j.foodListDownloaded === 'object' && !Array.isArray(j.foodListDownloaded)) localStorage.setItem('foodListDownloaded', JSON.stringify(j.foodListDownloaded));
                this._sortAndSave(); location.reload(); 
            } catch { alert('Dosya hatası.'); } 
        }; 
        reader.readAsText(file);
    },
};

// ==========================================
// KANSER ÖYKÜSÜ YÖNETİMİ
// ==========================================

// Fixed placeholder strings only; never translate input values.
function localizedPlaceholder(turkish, english) {
    return window.GLKOAITestLanguage?.currentLang === 'en' ? english : turkish;
}

const CancerHistoryManager = {
    types: {
        mother: [],
        father: []
    },

    // Kanser türü ekleme fonksiyonu
    addType(parent) {
        const listId = parent + 'CancerList';
        const list = document.getElementById(listId);
        if (!list) return;
        
        const index = this.types[parent].length;
        const newItem = { id: Date.now() + index, type: '' };
        this.types[parent].push(newItem);
        
        const div = document.createElement('div');
        div.className = 'flex items-center gap-0.5 mb-0.5';
        div.innerHTML = `
            <input type="text" 
                   class="flex-1 min-w-0 p-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500" 
                   placeholder="${localizedPlaceholder('Kanser türü (örn: Meme kanseri)', 'Cancer type (e.g. breast cancer)')}" data-test-placeholder-tr="Kanser türü (örn: Meme kanseri)" data-test-placeholder-en="Cancer type (e.g. breast cancer)"
                   data-id="${newItem.id}"
                   oninput="CancerHistoryManager.updateType('${parent}', ${newItem.id}, this.value)">
            <button onclick="CancerHistoryManager.removeType('${parent}', ${newItem.id})" 
                    class="flex-shrink-0 text-red-400 hover:text-red-300 p-1 transition">
                <i class="ph-fill ph-trash"></i>
            </button>
        `;
        
        list.appendChild(div);
        this.save();
    },

    // Kanser türü güncelleme fonksiyonu
    updateType(parent, id, value) {
        const index = this.types[parent].findIndex(item => item.id === id);
        if (index !== -1) {
            this.types[parent][index].type = value;
            this.save();
        }
    },

    // Kanser türü silme fonksiyonu
    removeType(parent, id) {
        this.types[parent] = this.types[parent].filter(item => item.id !== id);
        this.save();
        this.render(parent);
    },

    // Kanser türlerini render et
    render(parent) {
        const listId = parent + 'CancerList';
        const list = document.getElementById(listId);
        if (!list) return;
        
        list.innerHTML = '';
        this.types[parent].forEach(item => {
            const div = document.createElement('div');
            div.className = 'flex items-center gap-0.5 mb-0.5';
            div.innerHTML = `
                <input type="text" 
                       class="flex-1 min-w-0 p-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white" 
                       value="${item.type}"
                       placeholder="${localizedPlaceholder('Kanser türü (örn: Meme kanseri)', 'Cancer type (e.g. breast cancer)')}" data-test-placeholder-tr="Kanser türü (örn: Meme kanseri)" data-test-placeholder-en="Cancer type (e.g. breast cancer)"
                       data-id="${item.id}"
                       oninput="CancerHistoryManager.updateType('${parent}', ${item.id}, this.value)">
                <button onclick="CancerHistoryManager.removeType('${parent}', ${item.id})" 
                        class="flex-shrink-0 text-red-400 hover:text-red-300 p-1 transition">
                    <i class="ph-fill ph-trash"></i>
                </button>
            `;
            list.appendChild(div);
        });
    },

    // Kanser türlerini kaydet
    save() {
        const profile = DataManager.getProfile();
        if (!profile.medicalHistory) profile.medicalHistory = {};
        profile.medicalHistory.cancerTypes = this.types;
        DataManager.saveProfile(profile);
    },

    // Kanser türlerini yükle
    load() {
        const profile = DataManager.getProfile();
        if (profile.medicalHistory && profile.medicalHistory.cancerTypes) {
            this.types = profile.medicalHistory.cancerTypes;
            this.render('mother');
            this.render('father');
        }
    }
};


// ==========================================
// 3.5 LAB KAYIT YÖNETİCİSİ (YENİ)
// ==========================================
const LabHistoryManager = {
    entries: [],
    editingId: null,
    elements: {
        a1c: null,
        ldl: null,
        hdl: null,
        trig: null,
        cholesterol: null,
        gfr: null,
        date: null,
        notes: null,
        checkupEye: null,
        checkupFoot: null,
        checkupCardio: null,
        checkupDental: null,
        vacFlu: null,
        vacPneumonia: null,
        vacTetanus: null,
        vacHepB: null,
        entryId: null,
        saveBtn: null,
        resetBtn: null,
        list: null,
        empty: null,
        count: null,
        form: null
    },

    init() {
        const refs = {
            a1c: 'labA1c', ldl: 'labLDL', hdl: 'labHDL', trig: 'labTrig', cholesterol: 'labCholesterol', gfr: 'labGFR',
            date: 'labDate', notes: 'labNotes', checkupEye: 'checkupEye', checkupFoot: 'checkupFoot',
            checkupCardio: 'checkupCardio', checkupDental: 'checkupDental', vacFlu: 'vacFlu',
            vacPneumonia: 'vacPneumonia', vacTetanus: 'vacTetanus', vacHepB: 'vacHepB', entryId: 'labEntryId',
            saveBtn: 'labSaveBtn', resetBtn: 'labResetBtn', list: 'labHistoryList', empty: 'labHistoryEmpty',
            count: 'labHistoryCount', form: 'labEntryForm'
        };

        Object.entries(refs).forEach(([key, id]) => {
            this.elements[key] = document.getElementById(id);
        });

        if (!this.elements.form) return; // Klinik kart henüz oluşturulmadı

        this.bindEvents();
        this.renderList();
    },

    bindEvents() {
        this.elements.saveBtn?.addEventListener('click', () => this.handleSave());
        this.elements.resetBtn?.addEventListener('click', () => this.clearForm());
        this.elements.list?.addEventListener('click', (event) => this.handleListInteraction(event));
    },

    handleSave() {
        const entry = this.collectFormData();
        if (!entry) return;

        if (this.editingId) {
            const idx = this.entries.findIndex(item => item.id === this.editingId);
            if (idx > -1) {
                entry.createdAt = this.entries[idx].createdAt;
                this.entries[idx] = entry;
            }
        } else {
            entry.createdAt = Date.now();
            this.entries.push(entry);
        }

        this.sortEntries();
        this.renderList();
        this.clearForm();
        showToast('Kaydedildi.', 'success');
    },

    handleListInteraction(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;

        const card = button.closest('[data-id]');
        if (!card) return;
        const id = card.dataset.id;

        if (button.dataset.action === 'edit') {
            this.populateForm(id);
        } else if (button.dataset.action === 'delete') {
            if (typeof UIEnhancer !== 'undefined') {
                UIEnhancer.showConfirm('Seçili laboratuvar kaydını silmek istiyor musunuz?', () => this.deleteEntry(id), 'Lab Kaydı Silinsin mi?', 'Sil', 'bg-red-600');
            } else {
                if (confirm('Kaydı silmek istiyor musunuz?')) this.deleteEntry(id);
            }
        }
    },

    deleteEntry(id) {
        this.entries = this.entries.filter(item => item.id !== id);
        if (this.editingId === id) this.clearForm();
        this.renderList();
        showToast('Laboratuvar kaydı silindi.', 'warn');
    },

    collectFormData() {
        const getVal = (el) => el ? el.value.trim() : '';
        const getNum = (el) => {
            if (!el) return null;
            const raw = el.value.trim();
            if (raw === '') return null;
            const num = Number(raw);
            return Number.isFinite(num) ? num : null;
        };
        const getCheck = (el) => el ? !!el.checked : false;

        const dateValue = getVal(this.elements.date);
        if (!dateValue) {
            showToast('Lütfen laboratuvar tarihi seçin.', 'warn');
            return null;
        }

        const entry = {
            id: this.editingId || `lab-${Date.now()}`,
            date: dateValue,
            dateStamp: this.toTimestamp(dateValue),
            notes: getVal(this.elements.notes),
            // Tüm laboratuvar alanları:
            glucose: getNum(document.getElementById('labGlucose')),
            a1c: getNum(this.elements.a1c),
            insulin: getNum(document.getElementById('labInsulin')),
            ldl: getNum(this.elements.ldl),
            hdl: getNum(this.elements.hdl),
            trig: getNum(this.elements.trig),
            cholesterol: getNum(this.elements.cholesterol),
            vitalBP: getVal(document.getElementById('vitalBP')),
            vitalPulse: getNum(document.getElementById('vitalPulse')),
            vitalWeight: getNum(document.getElementById('vitalWeight')),
            creatinine: getNum(document.getElementById('labCreatinine')),
            gfr: getNum(this.elements.gfr),
            alt: getNum(document.getElementById('labALT')),
            hgb: getNum(document.getElementById('labHgb')),
            tsh: getNum(document.getElementById('labTSH')),
            vitd: getNum(document.getElementById('labVitD')),
            vitb12: getNum(document.getElementById('labVitB12')),
            ferritin: getNum(document.getElementById('labFerritin')),
            checkups: {
                eye: getVal(this.elements.checkupEye),
                foot: getVal(this.elements.checkupFoot),
                cardio: getVal(this.elements.checkupCardio),
                dental: getVal(this.elements.checkupDental)
            },
            vaccinations: {
                flu: getCheck(this.elements.vacFlu),
                pneumonia: getCheck(this.elements.vacPneumonia),
                tetanus: getCheck(this.elements.vacTetanus),
                hepb: getCheck(this.elements.vacHepB)
            }
        };

        return entry;
    },

    populateForm(id) {
        const entry = this.entries.find(item => item.id === id);
        if (!entry) return;

        this.editingId = id;
        if (this.elements.entryId) this.elements.entryId.value = id;

        // Tüm laboratuvar alanlarını forma geri yaz
        this.setInputValue(document.getElementById('labGlucose'), entry.glucose);
        this.setInputValue(this.elements.a1c, entry.a1c);
        this.setInputValue(document.getElementById('labInsulin'), entry.insulin);
        this.setInputValue(this.elements.ldl, entry.ldl);
        this.setInputValue(this.elements.hdl, entry.hdl);
        this.setInputValue(this.elements.trig, entry.trig);
        this.setInputValue(this.elements.cholesterol, entry.cholesterol);
        this.setInputValue(document.getElementById('vitalBP'), entry.vitalBP);
        this.setInputValue(document.getElementById('vitalPulse'), entry.vitalPulse);
        this.setInputValue(document.getElementById('vitalWeight'), entry.vitalWeight);
        this.setInputValue(document.getElementById('labCreatinine'), entry.creatinine);
        this.setInputValue(this.elements.gfr, entry.gfr);
        this.setInputValue(document.getElementById('labALT'), entry.alt);
        this.setInputValue(document.getElementById('labHgb'), entry.hgb);
        this.setInputValue(document.getElementById('labTSH'), entry.tsh);
        this.setInputValue(document.getElementById('labVitD'), entry.vitd);
        this.setInputValue(document.getElementById('labVitB12'), entry.vitb12);
        this.setInputValue(document.getElementById('labFerritin'), entry.ferritin);

        this.setInputValue(this.elements.date, entry.date);
        this.setInputValue(this.elements.notes, entry.notes || '');

        this.setInputValue(this.elements.checkupEye, entry.checkups?.eye || '');
        this.setInputValue(this.elements.checkupFoot, entry.checkups?.foot || '');
        this.setInputValue(this.elements.checkupCardio, entry.checkups?.cardio || '');
        this.setInputValue(this.elements.checkupDental, entry.checkups?.dental || '');

        this.setCheckValue(this.elements.vacFlu, entry.vaccinations?.flu);
        this.setCheckValue(this.elements.vacPneumonia, entry.vaccinations?.pneumonia);
        this.setCheckValue(this.elements.vacTetanus, entry.vaccinations?.tetanus);
        this.setCheckValue(this.elements.vacHepB, entry.vaccinations?.hepb);

        if (this.elements.saveBtn) {
            this.elements.saveBtn.innerHTML = '<i class="ph-bold ph-floppy-disk"></i> Güncelle';
            this.elements.saveBtn.classList.add('bg-emerald-600');
        }
    },

    clearForm() {
        Object.values(this.elements).forEach(el => {
            if (!el) return;
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.type === 'checkbox') {
                    el.checked = false;
                } else if (el.type !== 'hidden') {
                    el.value = '';
                }
            }
        });
        // Tahlil tarihi kutusuna bugünün tarihini ata
        if (this.elements.date) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            this.elements.date.value = `${yyyy}-${mm}-${dd}`;
        }
        if (this.elements.entryId) this.elements.entryId.value = '';
        this.editingId = null;
        if (this.elements.saveBtn) {
            this.elements.saveBtn.innerHTML = '<i class="ph-bold ph-floppy-disk"></i> Kaydet';
            this.elements.saveBtn.classList.remove('bg-emerald-600');
        }
    },

    sortEntries() {
        this.entries.sort((a, b) => {
            if (b.dateStamp !== a.dateStamp) return b.dateStamp - a.dateStamp;
            return (b.createdAt || 0) - (a.createdAt || 0);
        });
    },

    renderList() {
        if (!this.elements.list) return;
        this.sortEntries();
        this.elements.list.innerHTML = '';

        const hasEntries = this.entries.length > 0;
        if (this.elements.empty) this.elements.empty.classList.toggle('hidden', hasEntries);
        if (this.elements.count) this.elements.count.textContent = hasEntries ? `${this.entries.length} kayıt` : '';

        if (!hasEntries) return;

        this.entries.forEach(entry => {
            const details = document.createElement('details');
            details.className = 'lab-history-card border border-slate-700/60 rounded-2xl bg-slate-900/50 p-0 space-y-0 shadow-md shadow-slate-900/20';
            details.dataset.id = entry.id;

            const summary = document.createElement('summary');
            summary.className = 'flex flex-wrap items-start justify-between gap-3 p-4 cursor-pointer select-none';
            summary.innerHTML = `
                <div>
                    <div class="text-sm font-black text-blue-200 tracking-wide">${entry.date ? this.formatDate(entry.date) : 'Tarih belirtilmedi'}</div>
                    ${entry.notes ? `<p class="text-[11px] text-slate-400 mt-1 leading-snug">${escapeHtml(entry.notes)}</p>` : ''}
                </div>
                <div class="flex items-center gap-2">
                    <button type="button" data-action="edit" class="lab-card-btn text-emerald-300 hover:text-emerald-200"><i class="ph-bold ph-pencil"></i></button>
                    <button type="button" data-action="delete" class="lab-card-btn text-red-300 hover:text-red-200"><i class="ph-bold ph-trash"></i></button>
                </div>
            `;
            details.appendChild(summary);

            // Tüm başlıkları ve değerleriyle metrics listesi
            const metrics = [
                { label: 'Lab.Glu(mg/.)', value: entry.glucose },
                { label: 'HbA1c', value: entry.a1c, suffix: '%' },
                { label: 'Lab.İns(Aç)', value: entry.insulin },
                { label: 'LDL', value: entry.ldl },
                { label: 'HDL', value: entry.hdl },
                { label: 'Trigliserid', value: entry.trig },
                { label: 'Kolesterol-T', value: entry.cholesterol },
                { label: 'Tansiyon (S/D)', value: entry.vitalBP },
                { label: 'Nabız', value: entry.vitalPulse },
                { label: 'Kilo (kg)', value: entry.vitalWeight },
                { label: 'Kreatin', value: entry.creatinine },
                { label: 'eGFR', value: entry.gfr },
                { label: 'ALT', value: entry.alt },
                { label: 'Hgb', value: entry.hgb },
                { label: 'TSH', value: entry.tsh },
                { label: 'Vit D', value: entry.vitd },
                { label: 'Vit B12', value: entry.vitb12 },
                { label: 'Ferritin', value: entry.ferritin }
            ];

            const metricsHtml = metrics
                .filter(metric => metric.value !== null && metric.value !== undefined && metric.value !== '')
                .map(metric => `<div class="lab-metric"><span>${metric.label}</span><strong>${metric.value}${metric.suffix || ''}</strong></div>`)
                .join('');

            const checkupLines = [];
            if (entry.checkups?.eye) checkupLines.push(`<span>Göz: ${this.formatDate(entry.checkups.eye)}</span>`);
            if (entry.checkups?.cardio) checkupLines.push(`<span>Kardiyoloji: ${this.formatDate(entry.checkups.cardio)}</span>`);
            if (entry.checkups?.foot) checkupLines.push(`<span>Dahiliye: ${this.formatDate(entry.checkups.foot)}</span>`);
            if (entry.checkups?.dental) checkupLines.push(`<span>Diş: ${this.formatDate(entry.checkups.dental)}</span>`);

            const vaccineBadges = [];
            if (entry.vaccinations?.flu) vaccineBadges.push('Grip');
            if (entry.vaccinations?.pneumonia) vaccineBadges.push('Pnömokok');
            if (entry.vaccinations?.tetanus) vaccineBadges.push('Tetanoz');
            if (entry.vaccinations?.hepb) vaccineBadges.push('Hep-B');

            const detailsBody = document.createElement('div');
            detailsBody.className = 'p-4 pt-0';
            detailsBody.innerHTML = `
                ${metricsHtml ? `<div class="lab-metric-grid">${metricsHtml}</div>` : ''}
                ${checkupLines.length ? `<div class="lab-meta-row">${checkupLines.join('')}</div>` : ''}
                ${vaccineBadges.length ? `<div class="lab-vaccine-row">${vaccineBadges.map(name => `<span>${name}</span>`).join('')}</div>` : ''}
            `;
            details.appendChild(detailsBody);

            this.elements.list.appendChild(details);
        });
    },

    setInputValue(el, value) {
        if (!el) return;
        if (el.type === 'checkbox') {
            el.checked = !!value;
        } else if (el.type === 'range' && el.id === 'sleepHours') {
            el.value = value ?? '';
            const shv = document.getElementById('sleepHoursValue');
            if (shv) shv.textContent = value;
        } else {
            el.value = value ?? '';
        }
    },

    setCheckValue(el, value) {
        if (!el) return;
        el.checked = !!value;
    },

    toTimestamp(dateStr) {
        if (!dateStr) return 0;
        const parsed = new Date(dateStr);
        const stamp = parsed.getTime();
        return Number.isNaN(stamp) ? 0 : stamp;
    },

    formatDate(value) {
        if (!value) return '-';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return value;
        return parsed.toLocaleDateString('tr-TR');
    },

    hydrate(entries = []) {
        if (!Array.isArray(entries)) entries = [];
        this.entries = entries.map(item => ({
            id: item.id || `lab-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            createdAt: item.createdAt || Date.now(),
            date: item.date || '',
            dateStamp: item.dateStamp || this.toTimestamp(item.date || ''),
            notes: item.notes || '',
            glucose: this.asNumber(item.glucose),
            a1c: this.asNumber(item.a1c),
            insulin: this.asNumber(item.insulin),
            ldl: this.asNumber(item.ldl),
            hdl: this.asNumber(item.hdl),
            trig: this.asNumber(item.trig),
            cholesterol: this.asNumber(item.cholesterol),
            vitalBP: item.vitalBP || '',
            vitalPulse: this.asNumber(item.vitalPulse),
            vitalWeight: this.asNumber(item.vitalWeight),
            creatinine: this.asNumber(item.creatinine),
            gfr: this.asNumber(item.gfr),
            alt: this.asNumber(item.alt),
            hgb: this.asNumber(item.hgb),
            tsh: this.asNumber(item.tsh),
            vitd: this.asNumber(item.vitd),
            vitb12: this.asNumber(item.vitb12),
            ferritin: this.asNumber(item.ferritin),
            checkups: {
                eye: item.checkups?.eye || '',
                foot: item.checkups?.foot || '',
                cardio: item.checkups?.cardio || '',
                dental: item.checkups?.dental || ''
            },
            vaccinations: {
                flu: !!item.vaccinations?.flu,
                pneumonia: !!item.vaccinations?.pneumonia,
                tetanus: !!item.vaccinations?.tetanus,
                hepb: !!item.vaccinations?.hepb
            }
        }));
        this.renderList();
    },

    hydrateFromLegacy(legacy = {}) {
        const fallback = [];
        if (legacy.labs || legacy.screenings || legacy.vaccinations) {
            fallback.push({
                id: `lab-${Date.now()}`,
                createdAt: Date.now(),
                date: legacy.labs?.date || '',
                dateStamp: this.toTimestamp(legacy.labs?.date || ''),
                notes: legacy.labs?.notes || '',
                a1c: this.asNumber(legacy.labs?.a1c),
                ldl: this.asNumber(legacy.labs?.ldl),
                hdl: this.asNumber(legacy.labs?.hdl),
                trig: this.asNumber(legacy.labs?.trig),
                cholesterol: this.asNumber(legacy.labs?.cholesterol ?? legacy.labs?.creatinine),
                gfr: this.asNumber(legacy.labs?.gfr),
                checkups: {
                    eye: legacy.screenings?.eye || '',
                    foot: legacy.screenings?.foot || '',
                    cardio: legacy.screenings?.cardio || '',
                    dental: legacy.screenings?.dental || ''
                },
                vaccinations: {
                    flu: !!legacy.vaccinations?.flu,
                    pneumonia: !!legacy.vaccinations?.pneumonia,
                    tetanus: !!legacy.vaccinations?.tetanus,
                    hepb: !!legacy.vaccinations?.hepb
                }
            });
        }
        this.hydrate(fallback);
    },

    asNumber(value) {
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
    },

    getEntries() {
        return this.entries.map(item => ({ ...item }));
    }
};

// ==========================================
// 4. ANAMNEZ YÖNETİMİ
// ==========================================
const AnamnezManager = {
    getFormData() {
        const getVal = (id) => document.getElementById(id)?.value || '';
        const getCheck = (id) => document.getElementById(id)?.checked || false;

        const data = {
            cancerTypes: CancerHistoryManager.types, // Global kanser verisini dahil et
            // Ana öykü
            anamnezMain: getVal('anamnezMain'),
            
            // Mevcut alanlar
            famDiabetes: getVal('famDiabetes'),
            famCancer: getVal('famCancer'),
            smoking: getVal('smoking'),
            smokingDuration: getVal('smokingDuration'),
            smokingAmount: getVal('smokingAmount'),
            alcohol: {
                type: getVal('alcohol'),
                frequency: getVal('alcoholFrequency'),
                intensity: getVal('alcoholIntensity'),
                weeklyDays: getVal('alcoholWeeklyDays'),
                fixedAmount: getVal('alcoholFixedAmount'),
                routineYears: getVal('alcoholRoutineYears'),
                start: getVal('alcoholStart'),
                end: getVal('alcoholEnd'),
                amount: getVal('alcoholAmount'),
                doubleYears: getVal('alcoholDoubleYears'),
                intermittent: getCheck('alcoholIntermittent'),
                frequentDays: getVal('frequentDays'),
                minAmount: getVal('minAmount'),
                maxAmount: getVal('maxAmount'),
                consumptionTime: getVal('consumptionTime')
            },
            physicalActivity: getVal('physicalActivity'),
            sleepHours: getVal('sleepHours'),
            // YENİ: Vücut Kompozisyonu
            bodyFat: getVal('profBodyFat'),
            muscleMass: getVal('profMuscleMass'),
            bmr: getVal('profBMR'),
            
            stressLevel: getVal('stressLevel'),
            comorbidities: getVal('comorbidities'),
            otherMeds: getVal('otherMeds'),
            allergies: getVal('allergies'),
            surgeryHistory: getVal('surgeryHistory'),
            gynecologicalHistory: getVal('gynecologicalHistory'),
            
            // YENİ: Travma ve kaza öyküsü
            trauma: {
                date: getVal('traumaDate'),
                type: getVal('traumaType'),
                disabilityRate: parseInt(getVal('disabilityRate')) || 0,
                fractures: {
                    femur: getCheck('fractureFemur'),
                    hip: getCheck('fractureHip'),
                    coccyx: getCheck('fractureCoccyx'),
                    foot: getCheck('fractureFoot'),
                    arm: getCheck('fractureArm'),
                    shoulder: getCheck('fractureShoulder'),
                    vertebrae: getCheck('fractureVertebrae'),
                    ribs: getCheck('fractureRibs')
                },
                injuries: {
                    lung: getCheck('injuryLung'),
                    spleen: getCheck('injurySpleen'),
                    liver: getCheck('injuryLiver'),
                    other: getCheck('injuryOther')
                },
                implantDetails: getVal('implantDetails')
            },
            
            // YENİ: Yoğun bakım öyküsü
            intensiveCare: {
                icuDays: parseInt(getVal('icuDays')) || 0,
                hospitalDays: parseInt(getVal('hospitalDays')) || 0,
                notes: getVal('icuNotes')
            },
            
            // YENİ: Detaylı sigara öyküsü
            smokingDetails: {
                start: getVal('smokingStart'),
                end: getVal('smokingEnd'),
                amount: parseInt(getVal('smokingAmount')) || 0,
                packYears: getVal('smokingPackYears'),
                intermittent: getCheck('smokingIntermittent')
            },
            
            // YENİ: Ailede kanser öyküsü
            familyCancer: {
                type: getVal('familyCancerType'),
                relation: getVal('familyCancerRelation'),
                age: parseInt(getVal('familyCancerAge')) || 0
            },
            
            // YENİ: İnsülin direnci
            insulinResistance: {
                homair: parseFloat(getVal('homairValue')) || 0,
                date: getVal('homairDate'),
                symptoms: {
                    weightGain: getCheck('irWeightGain'),
                    fatigue: getCheck('irFatigue'),
                    acanthosis: getCheck('irAcanthosis'),
                    pcos: getCheck('irPcos')
                }
            },
            
            // YENİ: Detaylı tansiyon öyküsü
            hypertensionDetails: {
                date: getVal('hypertensionDate'),
                maxReading: getVal('hypertensionMax'),
                type: getVal('hypertensionType'),
                targetOrganDamage: {
                    heart: getCheck('targetHeart'),
                    kidney: getCheck('targetKidney'),
                    eye: getCheck('targetEye'),
                    brain: getCheck('targetBrain')
                }
            },
            
            // YENİ: Nörolojik durum
            neurological: {
                symptoms: {
                    pain: getCheck('neuroPain'),
                    numbness: getCheck('neuroNumbness'),
                    weakness: getCheck('neuroWeakness'),
                    balance: getCheck('neuroBalance')
                },
                notes: getVal('neuroNotes')
            },
            
            // YENİ: Kan sulandırıcı kullanımı
            anticoagulant: {
                start: getVal('anticoagulantStart'),
                reason: getVal('anticoagulantReason')
            },
            
            // YENİ: Laboratuvar geçmişi
            labHistory: LabHistoryManager.getEntries()
        };
        
        return data;
    },

    loadForm() {
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (val === null || val === undefined) { el.value = ''; return; }

            // Ön doğrulama: input türüne göre uygun format/arayüzleme yap
            const t = el.type;
            let out = '';
            try {
                const sval = String(val);
                // Eğer gelen değer YYYY-MM veya YYYY-MM-DD formuna benziyorsa
                // ama element tipiyle uyuşmuyorsa sessizce devam et (log kaldırıldı).
                // (Önceden burada uyarı veriliyordu.)
                if (t === 'date') {
                    const s = String(val);
                    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
                        // min/max kontrolü (lexicographic karşılaştırma ISO tarihler için geçerli)
                        if (el.min && s < el.min) { out = ''; }
                        else if (el.max && s > el.max) { out = ''; }
                        else out = s;
                    } else {
                        out = '';
                    }
                } else if (t === 'month') {
                    let s = String(val);
                    if (/^\d{4}-\d{2}$/.test(s)) out = s;
                    else {
                        const m = s.match(/^(\d{4})-(\d{2})/);
                        out = m ? (m[1] + '-' + m[2]) : '';
                    }
                } else if (t === 'number') {
                    const n = Number(val);
                    if (Number.isFinite(n)) {
                        if (el.min !== undefined && el.min !== '' && n < Number(el.min)) out = '';
                        else if (el.max !== undefined && el.max !== '' && n > Number(el.max)) out = '';
                        else out = String(n);
                    } else out = '';
                } else {
                    out = String(val);
                }

                // Nihai atama - tarayıcı hata fırlatırsa catch bloğu yakalar
                el.value = out;
            } catch (err) {
                // Çok nadir: yine de atama başarısız olursa boş bırak ve küçük log
                try { el.value = ''; } catch (e) {}
            }
        };
        const setCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };

        // Yardımcı dönüşümler: tarih/ay ve sayı benzeri değerleri güvenli forma sok
        const coerceDateValue = (v) => {
            if (v === null || v === undefined || v === '') return '';
            const s = String(v).trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
            if (/^\d{4}-\d{2}$/.test(s)) return s + '-01';
            if (/^\d{4}$/.test(s)) return s + '-01-01';
            return '';
        };

        const coerceNumberLike = (v) => {
            if (v === null || v === undefined || v === '') return '';
            const s = String(v).trim();
            const m = s.match(/^(\d{4})/);
            if (m) return m[1];
            const n = Number(s);
            return Number.isFinite(n) ? String(parseInt(n,10)) : '';
        };

        const profile = DataManager.getProfile();
        
        // Kanser türlerini yükle
        CancerHistoryManager.load();

        if (!profile.medicalHistory) return;
        
        const data = profile.medicalHistory;
        
        setVal('anamnezMain', data.anamnezMain);
        
        // Mevcut yükleme kodları
        setVal('famDiabetes', data.famDiabetes || 'yok');
        setVal('famCancer', data.famCancer || 'yok');
        setVal('smoking', data.smoking);
        setVal('smokingDuration', data.smokingDuration);
        setVal('smokingAmount', data.smokingAmount);
        setVal('alcohol', data.alcohol?.type || data.alcohol);
        if (data.alcohol && typeof data.alcohol === 'object') {
            setVal('alcoholFrequency', data.alcohol.frequency);
            setVal('alcoholIntensity', data.alcohol.intensity);
            setVal('alcoholWeeklyDays', data.alcohol.weeklyDays);
            setVal('alcoholFixedAmount', data.alcohol.fixedAmount);
            setVal('alcoholRoutineYears', data.alcohol.routineYears);
            setVal('alcoholStart', coerceNumberLike(data.alcohol.start));
            setVal('alcoholEnd', coerceNumberLike(data.alcohol.end));
            setVal('alcoholAmount', data.alcohol.amount);
            setVal('alcoholDoubleYears', data.alcohol.doubleYears);
            setCheck('alcoholIntermittent', data.alcohol.intermittent);
            setVal('frequentDays', data.alcohol.frequentDays);
            setVal('minAmount', data.alcohol.minAmount);
            setVal('maxAmount', data.alcohol.maxAmount);
            setVal('consumptionTime', data.alcohol.consumptionTime);
        }
        setVal('physicalActivity', data.physicalActivity);
        const shSlider = document.getElementById('sleepHours');
        const shv = document.getElementById('sleepHoursValue');
        if (shSlider && data.sleepHours) {
            shSlider.value = data.sleepHours;
            if (shv) shv.textContent = data.sleepHours;
            // programatik olarak tetikliyoruz
            shSlider.dispatchEvent(new Event('input'));
        }
        setVal('profBodyFat', data.bodyFat);
        setVal('profMuscleMass', data.muscleMass);
        setVal('profBMR', data.bmr);

        if (data.stressLevel) {
            setVal('stressLevel', data.stressLevel);
            const slv = document.getElementById('stressLevelValue'); if(slv) slv.textContent = data.stressLevel;
        }
        setVal('comorbidities', data.comorbidities);
        setVal('otherMeds', data.otherMeds);
        setVal('allergies', data.allergies);
        setVal('surgeryHistory', data.surgeryHistory);
        if (data.gynecologicalHistory) {
            setVal('gynecologicalHistory', data.gynecologicalHistory);
            const gs = document.getElementById('gynecologicalSection'); if(gs) gs.classList.remove('hidden');
        }
        
        // YENİ: Travma ve kaza öyküsü
        if (data.trauma) {
            setVal('traumaDate', coerceDateValue(data.trauma.date));
            setVal('traumaType', data.trauma.type);
            setVal('disabilityRate', data.trauma.disabilityRate);
            if (data.trauma.fractures) {
                setCheck('fractureFemur', data.trauma.fractures.femur);
                setCheck('fractureHip', data.trauma.fractures.hip);
                setCheck('fractureCoccyx', data.trauma.fractures.coccyx);
                setCheck('fractureFoot', data.trauma.fractures.foot);
                setCheck('fractureArm', data.trauma.fractures.arm);
                setCheck('fractureShoulder', data.trauma.fractures.shoulder);
                setCheck('fractureVertebrae', data.trauma.fractures.vertebrae);
                setCheck('fractureRibs', data.trauma.fractures.ribs);
            }
            if (data.trauma.injuries) {
                setCheck('injuryLung', data.trauma.injuries.lung);
                setCheck('injurySpleen', data.trauma.injuries.spleen);
                setCheck('injuryLiver', data.trauma.injuries.liver);
                setCheck('injuryOther', data.trauma.injuries.other);
            }
            setVal('implantDetails', data.trauma.implantDetails);
        }
        
        // YENİ: Yoğun bakım öyküsü
        if (data.intensiveCare) {
            setVal('icuDays', data.intensiveCare.icuDays);
            setVal('hospitalDays', data.intensiveCare.hospitalDays);
            setVal('icuNotes', data.intensiveCare.notes);
        }
        
        // YENİ: Detaylı sigara öyküsü
        if (data.smokingDetails) {
            setVal('smokingStart', coerceNumberLike(data.smokingDetails.start));
            setVal('smokingEnd', coerceNumberLike(data.smokingDetails.end));
            setVal('smokingAmount', data.smokingDetails.amount);
            setVal('smokingPackYears', data.smokingDetails.packYears);
            setCheck('smokingIntermittent', data.smokingDetails.intermittent);
        }
        
        // YENİ: Ailede kanser öyküsü
        if (data.familyCancer) {
            setVal('familyCancerType', data.familyCancer.type);
            setVal('familyCancerRelation', data.familyCancer.relation);
            setVal('familyCancerAge', data.familyCancer.age);
        }
        
        // YENİ: İnsülin direnci
        if (data.insulinResistance) {
            setVal('homairValue', data.insulinResistance.homair);
            setVal('homairDate', coerceDateValue(data.insulinResistance.date));
            if (data.insulinResistance.symptoms) {
                setCheck('irWeightGain', data.insulinResistance.symptoms.weightGain);
                setCheck('irFatigue', data.insulinResistance.symptoms.fatigue);
                setCheck('irAcanthosis', data.insulinResistance.symptoms.acanthosis);
                setCheck('irPcos', data.insulinResistance.symptoms.pcos);
            }
        }
        
        // YENİ: Detaylı tansiyon öyküsü
        if (data.hypertensionDetails) {
            setVal('hypertensionDate', coerceDateValue(data.hypertensionDetails.date));
            setVal('hypertensionMax', data.hypertensionDetails.maxReading);
            setVal('hypertensionType', data.hypertensionDetails.type);
            if (data.hypertensionDetails.targetOrganDamage) {
                setCheck('targetHeart', data.hypertensionDetails.targetOrganDamage.heart);
                setCheck('targetKidney', data.hypertensionDetails.targetOrganDamage.kidney);
                setCheck('targetEye', data.hypertensionDetails.targetOrganDamage.eye);
                setCheck('targetBrain', data.hypertensionDetails.targetOrganDamage.brain);
            }
        }
        
        // YENİ: Nörolojik durum
        if (data.neurological) {
            if (data.neurological.symptoms) {
                setCheck('neuroPain', data.neurological.symptoms.pain);
                setCheck('neuroNumbness', data.neurological.symptoms.numbness);
                setCheck('neuroWeakness', data.neurological.symptoms.weakness);
                setCheck('neuroBalance', data.neurological.symptoms.balance);
            }
            setVal('neuroNotes', data.neurological.notes);
        }
        
        // YENİ: Kan sulandırıcı kullanımı
        if (data.anticoagulant) {
            setVal('anticoagulantStart', data.anticoagulant.start);
            setVal('anticoagulantReason', data.anticoagulant.reason);
        }

        if (typeof LabHistoryManager !== 'undefined') {
            if (Array.isArray(data.labHistory) && data.labHistory.length > 0) {
                LabHistoryManager.hydrate(data.labHistory);
            } else if (data.labs || data.screenings || data.vaccinations) {
                LabHistoryManager.hydrateFromLegacy({
                    labs: data.labs,
                    screenings: data.screenings,
                    vaccinations: data.vaccinations
                });
            } else {
                LabHistoryManager.hydrate([]);
            }
            LabHistoryManager.clearForm();
        }
        
        // Alkol detaylarını göster
        toggleAlcoholDetails();
        
        // Sigara detaylarını göster
        toggleSmokingDetails();
        toggleAlcoholDetails();
    }
};

// ==========================================
// 5. YARDIMCI UI FONKSİYONLARI
// ==========================================
function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }

// PAKET-YIL HESAPLAMA FONKSİYONU
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
    
    // Ay farkını hesapla
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                   (endDate.getMonth() - startDate.getMonth());
    
    if (months <= 0) return;
    
    const years = months / 12;
    const packYears = (amount * years) / 20; // 1 paket = 20 sigara
    
    resultEl.value = packYears.toFixed(1);
}

// Alkol risk analizi
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

// Düzenli alkol risk analizi
function calculateAlcoholRegularRisk() {
    const days = parseInt(document.getElementById('alcoholWeeklyDays')?.value) || 0;
    const amount = parseInt(document.getElementById('alcoholFixedAmount')?.value) || 0;
    const msgEl = document.getElementById('alcoholRegularRiskMessage');
    
    if (!msgEl) return;
    
    const ky = days * amount * 52; // Kümülatif Yük
    let risk = 'Bilinmiyor';
    let message = '';
    
    // Basit risk hesabı (örnek)
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

// Sık sık alkol risk analizi
function calculateAlcoholFrequentRisk() {
    const days = document.getElementById('frequentDays')?.value;
    const minAmount = parseInt(document.getElementById('minAmount')?.value) || 0;
    const maxAmount = parseInt(document.getElementById('maxAmount')?.value) || 0;
    const time = document.getElementById('consumptionTime')?.value;
    const msgEl = document.getElementById('alcoholFrequentRiskMessage');
    
    if (!msgEl) return;
    
    let message = '';
    let risk = 'Düşük';
    
    // Risk hesabı: Üst sınır >5 birim ise yüksek risk
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
    
    // Gün sayısına göre ek uyarı
    if (days === 'haftada5-6' || days === 'haftada7') {
        message += ' Haftada sık tüketim, bağımlılık riskini artırabilir.';
    }
    
    // Zamanlamaya göre ek bilgi
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

// Sigara alanları değişince paket-yılı hesapla
document.addEventListener('DOMContentLoaded', () => {
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

function toggleDetails(id) {
    const el = document.getElementById(id); if (!el) return;
    const isOpen = el.classList.toggle('details-open');
    if (isOpen && el.parentElement) setTimeout(() => alignOpenedSection(el.parentElement), 100);
}

function alignOpenedSection(section) {
    if (!section || !section.isConnected) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const behavior = reduced ? 'auto' : 'smooth';
    const modal = section.closest('dialog, [role="dialog"], #profileOverlay, #guideOverlay');
    let parent = section.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
        const overflow = getComputedStyle(parent).overflowY;
        if ((overflow === 'auto' || overflow === 'scroll') && parent.scrollHeight > parent.clientHeight + 1) {
            const top = Math.max(0, parent.scrollTop + section.getBoundingClientRect().top - parent.getBoundingClientRect().top - 10);
            parent.scrollTo({ top, behavior });
            return;
        }
        if (parent === modal) break;
        parent = parent.parentElement;
    }
    if (modal) return;
    const sticky = document.getElementById(mainCurrentView === 'history' ? 'historyControls' : 'stickyHeader');
    const rect = sticky?.getBoundingClientRect();
    const stickyStyle = sticky && rect ? getComputedStyle(sticky) : null;
    const offset = rect && stickyStyle && ['sticky', 'fixed'].includes(stickyStyle.position) && rect.height > 0 && rect.top <= 1 && rect.bottom > 0 ? rect.bottom : 0;
    window.scrollTo({ top: Math.max(0, section.getBoundingClientRect().top + window.scrollY - offset - 10), behavior });
}

document.addEventListener('click', event => {
    if (!event.isTrusted || !(event.target instanceof Element)) return;
    const summary = event.target.closest('summary');
    const section = summary?.parentElement;
    if (!summary || !section || section.tagName !== 'DETAILS' || section.open) return;
    const interactive = event.target.closest('button, a, input, select, textarea');
    if (interactive && summary.contains(interactive)) return;
    setTimeout(() => { if (section.isConnected && section.open) alignOpenedSection(section); }, 120);
}, true);

function closeExpandedSections(container) {
    if (!container) return;
    Array.from(container.querySelectorAll('details[open]')).reverse().forEach(section => section.removeAttribute('open'));
    if (container.tagName === 'DETAILS' && container.open) container.removeAttribute('open');
}

function toggleSmartSection(id, event) {
    if (event) event.preventDefault();
    const target = document.getElementById(id);
    const allIds = ['glucoseDetails', 'bpDetails', 'nutDetails', 'activityDetails', 'statusDetails'];
    if (target.hasAttribute('open')) { closeExpandedSections(target); return; }
    allIds.forEach(oid => { if (oid !== id) closeExpandedSections(document.getElementById(oid)); });
    target.setAttribute('open', '');
    if (id === 'bpDetails') renderHomeBpTarget();
}

function renderHomeBpTarget() {
    const card = document.getElementById('bpHomeTargetCard');
    if (!card) return;
    const answers = DataManager.getProfile()?.clinicalWizard?.topics?.hypertension?.answers || {};
    const value = typeof answers.bpHomeTarget === 'string' ? answers.bpHomeTarget.trim() : '';
    const show = answers.bpHomeTargetKnown === 'yes' && !!value && ['current', 'past'].includes(answers.status);
    card.hidden = !show;
    if (!show) return;
    const en = window.GLKOAITestLanguage?.currentLang === 'en';
    document.getElementById('bpHomeTargetLabel').textContent = en ? 'DOCTOR’S HOME BLOOD PRESSURE TARGET' : 'DOKTORUN BELİRTTİĞİ EV TANSİYONU HEDEFİ';
    document.getElementById('bpHomeTargetValue').textContent = value;
    document.getElementById('bpHomeTargetNote').textContent = en ? 'Your recorded target; assess readings with your healthcare professional.' : 'Kaydettiğin hedef; ölçümlerini sağlık uzmanıyla değerlendir.';
}
window.renderHomeBpTarget = renderHomeBpTarget;

// 6. ANA UI DEĞİŞKENLERİ VE FONKSİYONLARI
let selectedCategory = '', selectedActivity = '', selectedActivityMood = '', activeFilters = new Set(['glucose', 'pressure', 'nutrition', 'activity', 'symptom', 'medication']), historyViewMode = 1, currentMedicationIndex = -1;

function setCategory(btn, cat) {
    document.querySelectorAll('.cat-btn').forEach(b => { b.classList.remove('btn-active-cat', 'border-blue-500', 'bg-blue-900/20'); b.classList.add('border-slate-600', 'bg-slate-800'); });
    if (selectedCategory === cat) { selectedCategory = ''; document.getElementById('alarmSection')?.classList.add('hidden'); } 
    else { selectedCategory = cat; btn.classList.remove('border-slate-600', 'bg-slate-800'); btn.classList.add('btn-active-cat'); }
    updateSaveButtonVisibility();
}

function applyMainMedVisual(btn, shouldActivate) {
    if (!btn) return false;
    const isActive = btn.classList.contains('btn-active-med');
    if (isActive === shouldActivate) return false;
    const activeColor = btn.dataset.color || getMedColor(btn.dataset.name || '');
    const baseBorder = btn.dataset.baseBorder || '#334155';
    if (shouldActivate) {
        btn.classList.add('btn-active-med');
        btn.classList.remove('bg-slate-800');
        btn.style.borderColor = activeColor;
        btn.style.boxShadow = `0 0 15px ${activeColor}40`;
    } else {
        btn.classList.remove('btn-active-med');
        if (!btn.classList.contains('bg-slate-800')) btn.classList.add('bg-slate-800');
        btn.style.borderColor = baseBorder;
        btn.style.boxShadow = 'none';
    }
    return true;
}

function applySecondaryMedVisual(btn, shouldActivate) {
    if (!btn) return false;
    const isActive = btn.classList.contains('active');
    if (isActive === shouldActivate) return false;
    const color = btn.dataset.color || getMedColor(btn.dataset.name || '');
    if (shouldActivate) {
        btn.classList.add('active');
        btn.classList.remove('border-slate-700/50', 'bg-slate-800/40');
        btn.style.borderColor = color;
        btn.style.backgroundColor = color + '33';
        btn.style.boxShadow = `0 0 15px ${color}40`;
    } else {
        btn.classList.remove('active');
        if (!btn.classList.contains('border-slate-700/50')) btn.classList.add('border-slate-700/50');
        if (!btn.classList.contains('bg-slate-800/40')) btn.classList.add('bg-slate-800/40');
        btn.style.borderColor = '';
        btn.style.backgroundColor = '';
        btn.style.boxShadow = '';
    }
    return true;
}

function setMedicationSelection(name, shouldActivate) {
    if (!name) return;
    const targetKey = normalizeMedName(name);
    if (!targetKey) return;
    let hasChanged = false;
    document.querySelectorAll('.med-btn, .glucose-med-btn, .bp-med-btn, .nutrition-med-btn').forEach(btn => {
        if (!btn || !btn.dataset || !btn.dataset.name) return;
        if (normalizeMedName(btn.dataset.name) !== targetKey) return;
        if (btn.classList.contains('med-btn')) {
            if (applyMainMedVisual(btn, shouldActivate)) hasChanged = true;
        } else if (applySecondaryMedVisual(btn, shouldActivate)) {
            hasChanged = true;
        }
    });
    if (hasChanged) {
        updateHeaderDots();
        updateSaveButtonVisibility();
    }
}

// GLİKOZ EKRANI İLAÇ SEÇİMİ
function toggleGlucoseMed(btn) {
    if (!btn) return;
    const shouldActivate = !btn.classList.contains('active');
    setMedicationSelection(btn.dataset.name, shouldActivate);
}

// TANSİYON EKRANI İLAÇ SEÇİMİ
function toggleBpMed(btn) {
    if (!btn) return;
    const shouldActivate = !btn.classList.contains('active');
    setMedicationSelection(btn.dataset.name, shouldActivate);
}

// BESLENME EKRANI İLAÇ SEÇİMİ
function toggleNutritionMed(btn) {
    if (!btn) return;
    const shouldActivate = !btn.classList.contains('active');
    setMedicationSelection(btn.dataset.name, shouldActivate);
}

function setActivity(btn, actName) {
    document.querySelectorAll('.act-btn').forEach(b => { 
        b.classList.remove('btn-active-act', 'border-[#edb015]', 'bg-[#edb015]/20'); 
        b.classList.add('bg-slate-800', 'border-slate-600'); 
    });
    
    if (selectedActivity === actName) { 
        selectedActivity = ''; 
        selectedActivityMood = '';
        applyActivityMoodSelection('');
    } else { 
        selectedActivity = actName; 
        btn.classList.remove('bg-slate-800', 'border-slate-600'); 
        btn.classList.add('btn-active-act', 'border-[#edb015]', 'bg-[#edb015]/20'); 
        selectedActivityMood = '';
        applyActivityMoodSelection('');
    }
    updateSaveButtonVisibility();
}

function applyActivityMoodSelection(moodKey) {
    const buttons = document.querySelectorAll('.act-mood-btn');
    buttons.forEach(button => {
        const highlightBorder = button.dataset.highlightBorder;
        const highlightBg = button.dataset.highlightBg;
        const highlightText = button.dataset.highlightText;

        if (highlightBorder) button.classList.remove(highlightBorder);
        if (highlightBg) button.classList.remove(highlightBg);
        if (highlightText) button.classList.remove(highlightText);

        if (!button.classList.contains('bg-slate-800')) button.classList.add('bg-slate-800');
        if (!button.classList.contains('border-slate-600')) button.classList.add('border-slate-600');
        button.classList.remove('border-emerald-500', 'border-amber-500', 'border-rose-500');
        if (!button.classList.contains('text-white')) button.classList.add('text-white');
        button.classList.remove('text-emerald-200', 'text-amber-200', 'text-rose-200');
    });

    if (!moodKey) return;

    const activeBtn = Array.from(buttons).find(btn => btn.dataset.mood === moodKey);
    if (!activeBtn) return;

    const highlightBorder = activeBtn.dataset.highlightBorder;
    const highlightBg = activeBtn.dataset.highlightBg;
    const highlightText = activeBtn.dataset.highlightText;

    activeBtn.classList.remove('bg-slate-800', 'border-slate-600', 'text-white');
    if (highlightBorder) activeBtn.classList.add(highlightBorder);
    if (highlightBg) activeBtn.classList.add(highlightBg);
    if (highlightText) activeBtn.classList.add(highlightText);
}

function setActivityMood(btn, moodKey) {
    if (!btn) return;
    if (selectedActivityMood === moodKey) {
        selectedActivityMood = '';
        applyActivityMoodSelection('');
    } else {
        selectedActivityMood = moodKey;
        applyActivityMoodSelection(moodKey);
    }
    updateSaveButtonVisibility();
}

// AKTİVİTE YÖNETİMİ
function renderActivityButtons() {
    const container = document.getElementById('activityButtons');
    if (!container) return;
    
    let activities = safeParseStorage('activityList', []);
    if (!activities || activities.length === 0) {
        activities = ['Pedal', 'Yürüyüş'];
        localStorage.setItem('activityList', JSON.stringify(activities));
    }
    
    container.innerHTML = '';
    
    activities.forEach(act => {
        const btn = document.createElement('button');
        btn.className = 'act-btn w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white p-2 rounded-xl flex items-center justify-start gap-3 group transition text-left select-none touch-none';
        btn.onclick = function() { setActivity(this, act); };
        
        // İkon belirleme
        let icon = 'ph-person-simple-run';
        const lower = act.toLowerCase();
        if(lower.includes('pedal') || lower.includes('bisiklet')) icon = 'ph-bicycle';
        else if(lower.includes('yürü')) icon = 'ph-footprints';
        else if(lower.includes('yüz')) icon = 'ph-waves';
        else if(lower.includes('ağırlık') || lower.includes('fitness') || lower.includes('egzersiz')) icon = 'ph-barbell';
        else if(lower.includes('yoga')) icon = 'ph-person-simple-tai-chi';
        else if(lower.includes('araba') || lower.includes('sürüş')) icon = 'ph-car';
        
        btn.innerHTML = `
            <div class="w-8 h-8 rounded-lg bg-[#edb015]/15 flex items-center justify-center text-[#edb015] group-hover:scale-110 transition shrink-0">
                <i class="ph-fill ${icon} text-lg"></i>
            </div>
            <div class="text-xs font-bold activity-display"></div>
        `;
        
        const activityLabel = btn.querySelector('.activity-display');
        if (activityLabel) {
            const translated = typeof window.GLKOAITestLanguage?.translateStaticToEnglish === 'function' ? window.GLKOAITestLanguage.translateStaticToEnglish(act) : act;
            activityLabel.dataset.testTr = act;
            activityLabel.dataset.testEn = translated;
            activityLabel.textContent = window.GLKOAITestLanguage?.currentLang === 'en' ? translated : act;
        }

        // Uzun basma ile silme
        let pressTimer;
        const startPress = (e) => { if (e.type === 'mousedown' && e.button !== 0) return; btn.style.transform = "scale(0.95)"; pressTimer = setTimeout(() => { if (navigator.vibrate) navigator.vibrate(50); deleteActivity(act); btn.style.transform = "scale(1)"; }, 800); };
        const cancelPress = () => { clearTimeout(pressTimer); btn.style.transform = "scale(1)"; };
        btn.addEventListener('pointerdown', startPress); btn.addEventListener('pointerup', cancelPress); btn.addEventListener('pointerleave', cancelPress);
        
        container.appendChild(btn);
    });
}

function openActivityModal() {
    document.getElementById('activityModal').style.display = 'flex';
    document.getElementById('newActivityInput').focus();
}

function saveNewActivity() {
    const input = document.getElementById('newActivityInput'); const val = input.value.trim(); if (!val) return;
    let list = safeParseStorage('activityList', []); if(!list.includes(val)) { list.push(val); localStorage.setItem('activityList', JSON.stringify(list)); }
    renderActivityButtons(); input.value = ''; closeModal('activityModal');
}

function deleteActivity(name) {
    UIEnhancer.showConfirm(`"${name}" aktivitesi silinsin mi?`, () => {
        let list = safeParseStorage('activityList', []);
        list = list.filter(i => i !== name);
        localStorage.setItem('activityList', JSON.stringify(list));
        renderActivityButtons();
        showToast('Aktivite silindi', 'success');
    });
}

const symptomSeveritySelection = new Map();
let activeSymptomButton = null;
function symptomButtonName(button) { const label=button.querySelector('span'); return (label?.dataset.symptomOriginal || label?.textContent || '').trim(); }
function renderSymptomSeverity() {
    const en=window.GLKOAITestLanguage?.currentLang==='en',labels={mild:en?'Mild':'Hafif',moderate:en?'Moderate':'Orta',severe:en?'Severe':'Şiddetli'};
    const buttons=Array.from(document.querySelectorAll('.sym-btn')), selected=buttons.filter(button=>button.classList.contains('btn-active-sym')).map(symptomButtonName);
    for(const name of symptomSeveritySelection.keys()) if(!selected.includes(name)) symptomSeveritySelection.delete(name);
    for(const button of buttons){const existing=button.querySelector('[data-severity-badge]');if(existing)existing.remove();const level=symptomSeveritySelection.get(symptomButtonName(button));if(button.classList.contains('btn-active-sym')&&labels[level]){const badge=document.createElement('span');badge.dataset.severityBadge='';badge.className='symptom-level-badge';badge.textContent=labels[level];button.appendChild(badge)}}
}
function paintSymptomSeverityDialog() {
    if(!activeSymptomButton)return;const name=symptomButtonName(activeSymptomButton),en=window.GLKOAITestLanguage?.currentLang==='en',heading=document.getElementById('symptomSeverityTitle'),area=document.getElementById('symptomSeverityOptions');
    if(!heading||!area)return;const text=activeSymptomButton.querySelector('span');heading.textContent=(en?text?.dataset.testEn:text?.dataset.testTr)||text?.textContent||name;area.replaceChildren();
    const options=[['mild','Hafif','Mild','ph-smiley-blank','#34d399'],['moderate','Orta','Moderate','ph-smiley-meh','#edb015'],['severe','Şiddetli','Severe','ph-smiley-nervous','#fb7185']];
    for(const [value,tr,eng,icon,color] of options){const button=document.createElement('button');button.type='button';button.className='symptom-dialog-option';button.style.color=color;button.style.borderColor=color;const active=symptomSeveritySelection.get(name)===value;button.style.background=active?color+'33':'#172338';button.setAttribute('aria-pressed',String(active));const glyph=document.createElement('i');glyph.className='ph-fill '+icon;glyph.setAttribute('aria-hidden','true');const label=document.createElement('span');label.textContent=en?eng:tr;button.append(glyph,label);button.addEventListener('click',()=>{if(symptomSeveritySelection.get(name)===value)symptomSeveritySelection.delete(name);else symptomSeveritySelection.set(name,value);paintSymptomSeverityDialog();renderSymptomSeverity()});area.appendChild(button)}
}
function openSymptomSeverity(button) {
    activeSymptomButton=button;paintSymptomSeverityDialog();const dialog=document.getElementById('symptomSeverityDialog');if(dialog&&!dialog.open)dialog.showModal();
}
function closeSymptomSeverity(){const dialog=document.getElementById('symptomSeverityDialog');if(dialog?.open)dialog.close();activeSymptomButton=null;}
function removeSymptomSelection(){const button=activeSymptomButton;closeSymptomSeverity();if(button?.classList.contains('btn-active-sym'))toggleTag(button,'sym',false);}
function toggleTag(el, type, openSeverity = true) {
    const activeClass=type==='diet'?'btn-active-food':'btn-active-sym';
    if(type==='sym'&&openSeverity&&el.classList.contains(activeClass)){openSymptomSeverity(el);return;}
    if(el.classList.contains(activeClass)){el.classList.remove(activeClass);el.classList.add('text-slate-300','bg-slate-900','border-slate-700');}else{el.classList.add(activeClass);el.classList.remove('text-slate-300','bg-slate-900','border-slate-700');}
    if(type==='sym'){renderSymptomSeverity();if(openSeverity&&el.classList.contains(activeClass))openSymptomSeverity(el);}
    updateSaveButtonVisibility();
}
function alignHistoryControls() {
    const controls = document.getElementById('historyControls');
    if (!controls || mainCurrentView !== 'history') return;
    const top = controls.getBoundingClientRect().top;
    if (top > 1) window.scrollTo({ top: Math.max(0, window.scrollY + top), behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
function toggleFilter(type) { if (activeFilters.has(type)) activeFilters.delete(type); else activeFilters.add(type); updateFilterButtons(); renderList(); }
function updateFilterButtons() {
    const controls = { glucose: ['Gluc', 'gluc'], pressure: ['Bp', 'bp'], nutrition: ['Nut', 'nut'], activity: ['Act', 'act'], symptom: ['Sym', 'sym'], medication: ['Med', 'med'] };
    Object.entries(controls).forEach(([type, [id, style]]) => {
        const button = document.getElementById('btnFilter' + id); if (!button) return;
        const active = activeFilters.has(type);
        button.classList.toggle('filter-btn-active', active); button.classList.toggle('filter-' + style, active);
        button.setAttribute('aria-pressed', String(active));
    });
}
function historyRecordMatchesFilters(item, filters) {
    if (!item || !filters || !filters.size) return false;
    const type = item.type;
    const glucose = type !== 'pressure' && type !== 'activity' && type !== 'nutrition_only' && type !== 'symptom_only' && type !== 'medication_only' && (Number(item.val || item.glucoseVal) > 0 || !!item.category);
    const pressure = type === 'pressure' || (Number(item.sys || item.bpSys) > 0 && Number(item.dia || item.bpDia) > 0);
    const nutrition = type === 'nutrition_only' || (Array.isArray(item.diets) && item.diets.length > 0);
    const activity = type === 'activity' || Number(item.actDuration || item.duration) > 0;
    const symptom = type === 'symptom_only' || (Array.isArray(item.symptoms) && item.symptoms.length > 0);
    const medication = type === 'medication_only' || (typeof item.drugs === 'string' && item.drugs.trim().length > 0);
    return (glucose && filters.has('glucose')) || (pressure && filters.has('pressure')) || (nutrition && filters.has('nutrition')) || (activity && filters.has('activity')) || (symptom && filters.has('symptom')) || (medication && filters.has('medication'));
}

// --- İLAÇ RENKLERİ ---
function stringToColor(str) {
    if (!str) return '#94a3b8';
    let lower = str.toLocaleLowerCase('tr');
    const normalized = lower.replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/i̇/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');
    if(normalized.includes('glifor') || normalized.includes('metformin') || normalized.includes('diaformin') || normalized.includes('matofin') || normalized.includes('jardiance')) return '#10b981';
    if(normalized.includes('tansiyon') || normalized.includes('delix') || normalized.includes('beloc') || normalized.includes('vasoxen')) return '#ef4444';
    if(normalized.includes('aspirin') || normalized.includes('ecopirin') || normalized.includes('coraspin')) return '#eab308';
    const palette = ['#3b82f6', '#8b5cf6', '#d946ef', '#f97316', '#06b6d4', '#84cc16'];
    let hash = 0; for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
}

// ==========================================
// İLAÇ İSİM NORMALİZASYON FONKSİYONU (YENİ)
// ==========================================
function normalizeMedName(name) {
  if (!name || typeof name !== 'string') return '';
  
  return name
    .toLocaleLowerCase('tr-TR')
    .replace(/\s*[-–]\s*\(.*?\)\s*/g, ' ')      // "- (AÇ)" gibi parantezli kısımları kaldır
    .replace(/\s*\(\s*(aç|tok|sabah|akşam|gece|acik|açık)\s*\)\s*/gi, ' ')  // Zaman belirten parantezler
    .replace(/\s*\d+\s*(mg|ml|gr|mg\/ml|tablet|hap|kapsül|cc|mcg)\s*/gi, ' ')  // Dozaj bilgilerini kaldır
    .replace(/\s+/g, ' ')                     // Çoklu boşlukları tek boşluk yap
    .trim()
    .normalize('NFKD')                        // Unicode normalizasyonu
    .replace(/[^\wçğıöşü]/gi, '')             // Özel karakterleri ve boşlukları kaldır
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/i̇/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .trim();
}

// ==========================================
// İLAÇ MİGRASYON FONKSİYONU (YENİ)
// ==========================================
function migrateMedications() {
  try {
    const profile = safeGetProfile();
    if (!profile?.medications?.length) return;
    
    const uniqueMeds = new Map();
    let hasChanges = false;
    
    // Mevcut listeyi tara ve birleştir
    for (const med of profile.medications) {
        if (!med?.name) continue;

        const normalizedKey = normalizeMedName(med.name);
        if (!normalizedKey) continue;

        if (uniqueMeds.has(normalizedKey)) {
            // Eşleşme bulundu: Mevcut kayıtla birleştir
            const existing = uniqueMeds.get(normalizedKey);
            
            // 1. Aliasları birleştir (Takma adlar)
            const combinedAliases = new Set([
                ...(existing.aliases || []),
                ...(med.aliases || []),
                existing.name,
                med.name,
                normalizedKey
            ]);
            existing.aliases = Array.from(combinedAliases).filter(a => a && a.trim().length > 0);

            // 2. Eksik bilgileri tamamla (Renk, Doz)
            if (!existing.dose && med.dose) existing.dose = med.dose;
            if (!existing.strengthText && med.strengthText) existing.strengthText = med.strengthText;
            if (!existing.wizardSourceId && med.wizardSourceId) existing.wizardSourceId = med.wizardSourceId;
            if (!existing.color && med.color) existing.color = med.color;
            
            // 3. Kategori bayraklarını birleştir (OR mantığı)
            existing.isDiabetesMed = existing.isDiabetesMed || med.isDiabetesMed;
            existing.isGlucoseMed = existing.isGlucoseMed || med.isGlucoseMed;
            existing.isBpMed = existing.isBpMed || med.isBpMed;
            existing.isAnticoagulantMed = existing.isAnticoagulantMed || med.isAnticoagulantMed;
            existing.isOtherMed = existing.isOtherMed || med.isOtherMed;

            hasChanges = true;
        } else {
            // Yeni kayıt olarak ekle
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
    
    // Değişiklik varsa kaydet
    if (hasChanges || uniqueMeds.size !== profile.medications.length) {
        profile.medications = Array.from(uniqueMeds.values());
        safeSaveProfile(profile);
        return true;
    }
  } catch (e) { /* Migration error - no logging */ }
}

// ==========================================
// YEMEK KÜTÜPHANESİ MİGRASYONU (YENİ)
// ==========================================
function migrateFoodLibrary() {
    if (typeof YEMEK_VERITABANI === 'undefined' || !FoodLibraryManager.library) return;
    
    let hasChanges = false;
    const uniqueFoods = new Map();

    // Mevcut kütüphaneyi tara
    FoodLibraryManager.library.forEach(item => {
        if (!item || !item.ad) return;
        
        let finalName = item.ad.trim();
        
        // 1. Veritabanından tam eşleşme (Case-insensitive) bul ve düzelt
        for (const root of YEMEK_VERITABANI.kokler) {
            const match = root.anahtarKelimeler.find(k => k.toLocaleLowerCase('tr') === finalName.toLocaleLowerCase('tr'));
            if (match) {
                // DB'deki yazım şeklini al (Örn: "tavuk sote" -> "Tavuk Sote")
                if (finalName !== match) {
                    finalName = match;
                    hasChanges = true;
                }
                // Kalori eksikse tamamla
                if (item.bazKalori === undefined && root.bazKalori !== undefined) {
                    item.bazKalori = root.bazKalori;
                    hasChanges = true;
                }
                break;
            }
        }

        // 2. Mükerrer kayıtları birleştir
        const key = finalName.toLocaleLowerCase('tr');
        if (uniqueFoods.has(key)) {
            const existing = uniqueFoods.get(key);
            existing.freq = (existing.freq || 0) + (item.freq || 0);
            // Kalori güncellemesi (Eğer mevcut olanda yoksa)
            if (existing.bazKalori === undefined && item.bazKalori !== undefined) existing.bazKalori = item.bazKalori;
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

// YENİ: Profilden kayıtlı rengi kontrol eden fonksiyon (akıllı normalizasyonlu)
function getMedColor(medName) {
  if (!medName || typeof medName !== 'string') {
    return '#94a3b8';
  }
  
  try {
    const profile = (typeof DataManager !== 'undefined') ? DataManager.getProfile() : safeGetProfile();
    
    if (profile?.medications?.length) {
      const searchLower = medName.trim().toLocaleLowerCase('tr-TR');
      const normalizedSearch = normalizeMedName(medName);

      // 1. Adım: İsim üzerinden tam eşleşme (Case insensitive)
      const nameMatch = profile.medications.find(med => 
        med && med.name && med.name.trim().toLocaleLowerCase('tr-TR') === searchLower
      );
      if (nameMatch?.color) return nameMatch.color;

      // 2. Adım: Normalize edilmiş isim üzerinden tam eşleşme
      if (normalizedSearch) {
          const normalizedNameMatch = profile.medications.find(med => 
            med && med.name && normalizeMedName(med.name) === normalizedSearch
          );
          if (normalizedNameMatch?.color) return normalizedNameMatch.color;
      }

      // 3. Adım: Aliases (Takma adlar) üzerinden kontrol
      // Hem ham alias hem de normalize edilmiş alias kontrolü
      const aliasMatch = profile.medications.find(med => {
          if (!med || !med.aliases || !Array.isArray(med.aliases)) return false;
          
          return med.aliases.some(alias => {
              if (!alias) return false;
              // Ham alias kontrolü
              if (alias.trim().toLocaleLowerCase('tr-TR') === searchLower) return true;
              // Normalize alias kontrolü
              if (normalizedSearch && normalizeMedName(alias) === normalizedSearch) return true;
              return false;
          });
      });
      
      if (aliasMatch?.color) return aliasMatch.color;
    }
  } catch (error) {
    // Error handling - no logging
  }
  
  // 4. Hiç eşleşme yoksa otomatik renk
  return stringToColor(medName);
}

// ==========================================
// KAYDET BUTONU GÖRÜNÜRLÜK YÖNETİMİ
// ==========================================
function updateSaveButtonVisibility() {
    const symptomSave=document.querySelector('[data-independent-save="symptom"]');if(symptomSave)symptomSave.hidden=document.querySelectorAll('.sym-btn.btn-active-sym').length===0;
    const panel = document.getElementById('bottomActionPanel');
    if (!panel) return;
    if (!document.body.classList.contains('edit-mode-active')) { panel.classList.add('hidden'); return; }

    const glucoseVal = document.getElementById('glucoseValue')?.value;
    const bpSys = document.getElementById('bpSys')?.value;
    const bpDia = document.getElementById('bpDia')?.value;
    const actDur = document.getElementById('actDuration')?.value;
    const actGoal = document.getElementById('actGoal')?.value;
    const moodSelected = selectedActivityMood && selectedActivityMood.trim() !== '';
    
    const hasGlucose = glucoseVal && glucoseVal.trim() !== '';
    const hasBp = (bpSys && bpSys.trim() !== '') || (bpDia && bpDia.trim() !== '');
    const hasFood = (typeof FoodLibraryManager !== 'undefined' && FoodLibraryManager.selectedFoods && Object.keys(FoodLibraryManager.selectedFoods).length > 0);
    const hasActivity = (typeof selectedActivity !== 'undefined' && selectedActivity !== '') || (actDur && actDur.trim() !== '') || (actGoal && actGoal.trim() !== '') || moodSelected;
    const hasSymptoms = document.querySelectorAll('.sym-btn.btn-active-sym').length > 0;
    const hasMeds = document.querySelectorAll('.med-btn.btn-active-med, .glucose-med-btn.active, .bp-med-btn.active, .nutrition-med-btn.active').length > 0;
    const isEditMode = document.body.classList.contains('edit-mode-active');

    if (hasGlucose || hasBp || hasFood || hasActivity || hasSymptoms || hasMeds || isEditMode) panel.classList.remove('hidden');
    else panel.classList.add('hidden');
}

const WATER_UNIT_ML = 250;
let reportAverageRange = 7;
let reportAverageFontSyncTimer = null;
const avgNumberFormatter = new Intl.NumberFormat('tr-TR');

// Preserve existing glass convention while treating explicit millilitres as millilitres.
function waterCupsFor(name, unit, amount) {
    if (typeof name !== 'string' || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return 0;
    const normalizedName = name.trim().toLocaleLowerCase('tr');
    if (normalizedName !== 'su' && normalizedName !== 'water' && !(typeof FoodLibraryManager !== 'undefined' && FoodLibraryManager.library.some(food => food.ad === name && food.foodIsWater === true))) return 0;
    const normalizedUnit = String(unit || '').trim().toLocaleLowerCase('tr');
    if (normalizedUnit === 'ml') return Number(amount) / WATER_UNIT_ML;
    if (normalizedUnit === 'bardak' || normalizedUnit === 'glass') return Number(amount);
    return 0;
}

function computeDailyNutritionTotals(records) {
    const totals = { waterCups: 0, waterMl: 0, calories: 0, unknownCalories: 0 };
    if (!Array.isArray(records) || records.length === 0) return totals;

    records.forEach(record => {
        if (!record || !Array.isArray(record.diets)) return;
        record.diets.forEach(dietStr => {
            if (typeof dietStr !== 'string' || dietStr.trim() === '') return;
            const match = dietStr.match(/(.*) \(([\d\.,]+)\s+(.*)\)/);
            let name = dietStr.trim();
            let amount = 0;
            let unit = '';
            if (match) {
                name = match[1].trim();
                amount = parseFloat(match[2].replace(',', '.'));
                unit = match[3].trim();
            }

            const lowerName = name.toLocaleLowerCase('tr');
            const snap = Array.isArray(record.nutritionSnapshots) ? record.nutritionSnapshots.find(x=>x && x.name===name && x.unit===unit) : null;
            totals.waterCups += snap?.isWater === true ? (unit.toLocaleLowerCase('tr')==='ml' ? amount/WATER_UNIT_ML : (['bardak','glass'].includes(unit.toLocaleLowerCase('tr')) ? amount : 0)) : waterCupsFor(name, unit, amount);

            if (!match || !Number.isFinite(amount) || amount <= 0) return;
            if (snap && Object.prototype.hasOwnProperty.call(snap,'calories')) {
                const stored = snap.calories === null || !Number.isFinite(Number(snap.calories)) || Number(snap.calories)<0 ? null : foodCalories(Number(snap.calories),unit,amount);
                if (stored===null) totals.unknownCalories++; else totals.calories+=stored;
                return;
            }

            let refItem = null;
            if (typeof FoodLibraryManager !== 'undefined' && Array.isArray(FoodLibraryManager.library)) {
                refItem = FoodLibraryManager.library.find(entry => entry?.ad && entry.ad.toLocaleLowerCase('tr') === lowerName) || null;
            }
            if (!refItem && typeof FoodLibraryManager !== 'undefined' && typeof FoodLibraryManager.findInGlobalDB === 'function') {
                const lookup = FoodLibraryManager.findInGlobalDB(name);
                if (lookup && lookup.item) refItem = lookup.item;
            }
            if (!refItem && typeof YEMEK_VERITABANI !== 'undefined') {
                refItem = YEMEK_VERITABANI.kokler.find(f => f.anahtarKelimeler.some(kw => kw.toLocaleLowerCase('tr') === lowerName)) || null;
                if (!refItem) {
                    refItem = YEMEK_VERITABANI.kokler.find(f => f.anahtarKelimeler.some(kw => lowerName.includes(kw.toLocaleLowerCase('tr')))) || null;
                }
            }

            const value = foodCalories(refItem?.bazKalori, unit, amount);
            if (value === null) totals.unknownCalories++; else totals.calories += value;
        });
    });

    totals.waterMl = Math.round(totals.waterCups * WATER_UNIT_ML);
    return totals;
}

function initReportAverageControls() {
    const buttons = document.querySelectorAll('.avg-range-btn');
    if (!buttons.length) return;

    const applyActiveState = (activeRange) => {
        buttons.forEach(btn => {
            const val = parseInt(btn.dataset.averageRange, 10);
            if (Number.isFinite(val) && val === activeRange) {
                btn.classList.add('avg-range-active');
                btn.setAttribute('aria-pressed', 'true');
            } else {
                btn.classList.remove('avg-range-active');
                btn.setAttribute('aria-pressed', 'false');
            }
        });
    };

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const nextRange = parseInt(btn.dataset.averageRange, 10);
            if (!Number.isFinite(nextRange) || nextRange === reportAverageRange) return;
            reportAverageRange = nextRange;
            applyActiveState(reportAverageRange);
            updateReportAverageCards();
        });
    });

    applyActiveState(reportAverageRange);
    updateReportAverageCards();

    const reportSection = document.getElementById('reportSection');
    if (reportSection && typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!reportSection.classList.contains('hidden')) {
                        scheduleAverageFontSync();
                    }
                }
            }
        });
        observer.observe(reportSection, { attributes: true });
    }

    window.addEventListener('resize', scheduleAverageFontSync);
}

function updateReportAverageCards() {
    const waterEl = document.getElementById('avgWaterValue');
    const calEl = document.getElementById('avgCalorieValue');
    const activityEl = document.getElementById('avgActivityValue');
    const captionEl = document.getElementById('avgRangeCaption');
    if (!waterEl || !calEl || !activityEl || !captionEl) return;

    const allData = DataManager.getAll();
    const hasData = Array.isArray(allData) && allData.length > 0;
    if (!hasData) {
        waterEl.textContent = '--';
        calEl.textContent = '--';
        activityEl.textContent = '--';
        captionEl.textContent = `Son ${reportAverageRange} gün - veri yok`;
        scheduleAverageFontSync();
        return;
    }

    const msPerDay = 24 * 60 * 60 * 1000;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startTime = today.getTime() - ((reportAverageRange - 1) * msPerDay);

    const dayBuckets = new Map();

    allData.forEach(item => {
        if (!item || typeof item.timestamp !== 'number') return;
        if (item.timestamp < startTime) return;

        let dayKey = item.dateStr;
        if (!dayKey) {
            const dt = new Date(item.timestamp);
            if (Number.isNaN(dt.getTime())) return;
            const dd = String(dt.getDate()).padStart(2, '0');
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            dayKey = `${dd}.${mm}.${dt.getFullYear()}`;
        }

        if (!dayBuckets.has(dayKey)) {
            dayBuckets.set(dayKey, { waterCups: 0, calories: 0, activityMinutes: 0 });
        }

        const bucket = dayBuckets.get(dayKey);

        if (Array.isArray(item.diets) && item.diets.length > 0) {
            const totals = computeDailyNutritionTotals([item]);
            bucket.waterCups += Number.isFinite(totals.waterCups) ? totals.waterCups : 0;
            bucket.calories += Number.isFinite(totals.calories) ? totals.calories : 0;
        }

        if (item.type === 'activity') {
            const duration = parseFloat(item.duration ?? item.actDuration);
            if (Number.isFinite(duration) && duration > 0) {
                bucket.activityMinutes += duration;
            }
        }
    });

    const dayCount = dayBuckets.size;
    if (dayCount === 0) {
        waterEl.textContent = '--';
        calEl.textContent = '--';
        activityEl.textContent = '--';
        captionEl.textContent = `Son ${reportAverageRange} gün - veri yok`;
        scheduleAverageFontSync();
        return;
    }

    let totalWaterMl = 0;
    let totalCalories = 0;
    let totalActivity = 0;

    dayBuckets.forEach(bucket => {
        totalWaterMl += bucket.waterCups * WATER_UNIT_ML;
        totalCalories += bucket.calories;
        totalActivity += bucket.activityMinutes;
    });

    const avgWaterMl = Math.round(totalWaterMl / dayCount);
    const avgCalories = Math.round(totalCalories / dayCount);
    const avgActivity = Math.round(totalActivity / dayCount);

    waterEl.textContent = `${avgNumberFormatter.format(Math.max(avgWaterMl, 0))} ml/gün`;
    calEl.textContent = `${avgNumberFormatter.format(Math.max(avgCalories, 0))} kcal/gün`;
    activityEl.textContent = `${avgNumberFormatter.format(Math.max(avgActivity, 0))} dk/gün`;
    captionEl.textContent = `Son ${reportAverageRange} gün - ${dayCount} gün kayıt`;
    scheduleAverageFontSync();
}

function syncAverageCardFontSize() {
    const ids = ['avgWaterValue', 'avgCalorieValue', 'avgActivityValue'];
    const reference = document.getElementById('cvValue') || document.getElementById('recordStatus');
    let fontSize = '';
    let lineHeight = '';

    if (reference) {
        const computed = window.getComputedStyle(reference);
        if (computed) {
            if (computed.fontSize && parseFloat(computed.fontSize) > 0) fontSize = computed.fontSize;
            if (computed.lineHeight && computed.lineHeight !== 'normal') lineHeight = computed.lineHeight;
        }
    }

    if (!fontSize) fontSize = '1.125rem';
    if (!lineHeight) lineHeight = '1.35';

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.fontSize = fontSize;
            el.style.lineHeight = lineHeight;
        }
    });
}

function scheduleAverageFontSync() {
    if (reportAverageFontSyncTimer) clearTimeout(reportAverageFontSyncTimer);
    reportAverageFontSyncTimer = setTimeout(syncAverageCardFontSize, 120);
}

function markBackupCompleted() {
    const now = Date.now();
    try {
        localStorage.setItem('lastBackupAt', String(now));
    } catch (err) {
        // Backup timestamp error - no logging
    }
}

function checkWeeklyBackupReminder(force = false) {
    try {
        const now = new Date();
        const todayKey = now.toISOString().split('T')[0];
        const msPerDay = 86400000;

        if (!force && now.getDay() !== 0) return;

        if (!force) {
            const lastPromptKey = localStorage.getItem('backupReminderLastPrompt');
            if (lastPromptKey === todayKey) return;
        }

        const lastBackupTs = parseInt(localStorage.getItem('lastBackupAt') || '0', 10);
        let shouldPrompt = force;

        if (!shouldPrompt) {
            if (!lastBackupTs) {
                shouldPrompt = true;
            } else if (Number.isFinite(lastBackupTs)) {
                const lastBackupDate = new Date(lastBackupTs);
                const lastBackupKey = Number.isNaN(lastBackupDate.getTime()) ? '' : lastBackupDate.toISOString().split('T')[0];
                if (lastBackupKey !== todayKey) {
                    const diffDays = (now.getTime() - lastBackupTs) / msPerDay;
                    if (diffDays >= 6) shouldPrompt = true;
                }
            }
        }

        if (!shouldPrompt) return;

        if (!force) localStorage.setItem('backupReminderLastPrompt', todayKey);

        UIEnhancer.showConfirm(
            'Verilerinizi haftalık olarak yedeklemenizi öneriyoruz. Şimdi bir kopya oluşturmak ister misiniz?',
            () => { DataManager.exportJSON(); },
            'Veri Yedekleme Zamanı',
            'Şimdi Yedekle',
            'bg-emerald-600'
        );
    } catch (err) {
        // Backup reminder error - no logging
    }
}

// --- MOBİL UYUMLU SU/KALORİ BARI (DÜZELTİLMİŞ) ---
let todaySummaryDisplayedDay = '';
function updateTodaySummaryClock(now = new Date()) {
    const clock = document.getElementById('todaySummaryClock');
    const dateLabel = document.getElementById('todaySummaryDate');
    const english = window.GLKOAITestLanguage?.currentLang === 'en';
    const dayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    if (clock) clock.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const pageClock = document.getElementById('mainSectionClock');
    if (pageClock) pageClock.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (dateLabel) {
        const formatted = new Intl.DateTimeFormat(english ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
        dateLabel.textContent = english ? `${formatted} measurements` : `${formatted} ölçümleri`;
    }
    if (todaySummaryDisplayedDay && todaySummaryDisplayedDay !== dayKey) updateHeaderStats();
    todaySummaryDisplayedDay = dayKey;
}
document.addEventListener('DOMContentLoaded', () => {
    updateTodaySummaryClock();
    const schedule = () => setTimeout(() => { updateTodaySummaryClock(); schedule(); }, 60000 - (Date.now() % 60000));
    schedule();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) updateTodaySummaryClock(); });
}, { once: true });

function initTodaySummaryDetails() {
    const overlay = document.getElementById('todayDetailOverlay');
    const title = document.getElementById('todayDetailTitle');
    const content = document.getElementById('todayDetailContent');
    const close = document.getElementById('todayDetailClose');
    const rows = document.querySelectorAll('#todaySummary .today-summary-row');
    if (!overlay || !title || !content || !close) return;
    let opener = null;
    const hide = () => { overlay.style.display = 'none'; if (opener) opener.focus(); };
    const open = (row, index) => {
        opener = row;
        title.textContent = row.querySelector('[data-test-tr][data-test-en]')?.textContent || '';
        content.replaceChildren();
        const now = new Date();
        const key = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
        const records = DataManager.getAll().filter(item => item && item.dateStr === key).slice().sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
        const lines = [];
        let caloriesUnavailable = false;
        const english = window.GLKOAITestLanguage?.currentLang === 'en';
        if (index <= 2) {
            const totals = computeDailyNutritionTotals(records);
            const activity = records.reduce((sum, item) => { const value = Number(item.actDuration || item.duration || 0); return sum + (Number.isFinite(value) && value > 0 ? value : 0); }, 0);
            const total = index === 0 ? `${totals.waterMl} ml` : index === 1 ? `≈ ${Math.round(totals.calories)} kcal` : `${activity} ${english ? 'min' : 'dk'}`;
            lines.push(`${english ? 'Daily total' : 'Günlük toplam'}: ${total}`);
        }
        let entryCount = 0;
        records.forEach(item => {
            let entries = [];
            if (index === 0 || index === 1) entries = (Array.isArray(item.diets) ? item.diets : []).filter(value => typeof value === 'string' && (index === 1 || (() => { const match = value.match(/^(.*) \(([\d.,]+)\s+([^()]*)\)$/); return !!match && waterCupsFor(match[1].trim(), match[3].trim(), Number(match[2].replace(',', '.'))) > 0; })()));
            if (index === 2 && Number(item.actDuration || item.duration) > 0) entries = [`${item.actName || item.name || ''} · ${item.actDuration || item.duration} ${window.GLKOAITestLanguage?.currentLang === 'en' ? 'min' : 'dk'}`];
            if (index === 3 && Number(item.val || item.glucoseVal) > 0) entries = [`${item.val || item.glucoseVal} mg/dL`];
            if (index === 4 && Number(item.sys || item.bpSys) > 0 && Number(item.dia || item.bpDia) > 0) entries = [`${item.sys || item.bpSys}/${item.dia || item.bpDia}${Number(item.pulse || item.bpPulse) > 0 ? ` · ${english ? 'Pulse' : 'Nabız'}: ${item.pulse || item.bpPulse}` : ''}`];
            if (index === 5 && Array.isArray(item.symptoms)) entries = item.symptoms.filter(Boolean).map(value => window.GLKOAITestLanguage?.translate(value) || value);
            if (index === 6 && typeof item.drugs === 'string') entries = item.drugs.split(',').map(value => value.trim()).filter(Boolean);
            entries.forEach(value => {
                entryCount++;
                if (index === 1) {
                    const result = computeDailyNutritionTotals([{ diets: [value] }]);
                    const kcal = result.calories;
                    if (result.unknownCalories) caloriesUnavailable = true;
                    const amount = !result.unknownCalories ? `≈ ${Math.round(kcal)} kcal` : (window.GLKOAITestLanguage?.currentLang === 'en' ? 'calories unavailable' : 'kalori bilgisi yok');
                    lines.push(`${item.time || '—'} · ${displayFoodRecord(value)} · ${amount}`);
                } else lines.push(`${item.time || '—'} · ${value}`);
            });
        });
        if (index === 1 && caloriesUnavailable) lines.push(window.GLKOAITestLanguage?.currentLang === 'en' ? 'The total excludes foods with unavailable calorie information.' : 'Kalori bilgisi olmayan yiyecekler toplama dahil değildir.');
        if (!entryCount) lines.push(english ? 'No records today.' : 'Bugün kayıt yok.');
        const detailIcons = ['ph-drop', 'ph-fire', 'ph-person-simple-run', 'ph-drop', 'ph-heartbeat', 'ph-smiley-nervous', 'ph-pill'];
        lines.forEach(line => {
            const card = document.createElement('div');
            card.className = `today-detail-card today-detail-kind-${index}`;
            const icon = document.createElement('i');
            icon.className = `ph-fill ${detailIcons[index] || 'ph-info'} today-detail-icon${index === 4 ? ' today-detail-heart' : ''}`;
            icon.setAttribute('aria-hidden', 'true');
            const text = document.createElement('span');
            text.textContent = line;
            card.append(icon, text);
            content.appendChild(card);
        });
        overlay.style.display = 'flex'; close.focus();
    };
    rows.forEach((row, index) => { row.tabIndex = 0; row.setAttribute('role', 'button'); row.setAttribute('aria-haspopup', 'dialog'); row.addEventListener('click', () => open(row, index)); row.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(row, index); } }); });
    const waterAdd = document.getElementById('todayWaterAdd');
    if (waterAdd) { waterAdd.addEventListener('click', event => { event.stopPropagation(); FoodLibraryManager.openQuickWater(); }); waterAdd.addEventListener('keydown', event => event.stopPropagation()); }
    close.addEventListener('click', hide);
    overlay.addEventListener('click', event => { if (event.target === overlay) hide(); });
    overlay.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
}
document.addEventListener('DOMContentLoaded', initTodaySummaryDetails, { once: true });

function updateHeaderStats() {
    const storedProfile = safeGetProfile();
    const TARGET_WATER = storedProfile.waterTarget || 2500;
    const TARGET_CAL = storedProfile.calorieTarget || 2000;
    const now = new Date();
    const todayKey = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    const records = DataManager.getAll();
    const todayRecords = Array.isArray(records) ? records.filter(item => item && item.dateStr === todayKey) : [];
    const todayTotals = computeDailyNutritionTotals(todayRecords);
    const summaryWater = document.getElementById('todaySummaryWater');
    const summaryCalories = document.getElementById('todaySummaryCalories');
    if (summaryWater) summaryWater.textContent = `${todayTotals.waterMl} / ${TARGET_WATER} ml`;
    if (summaryCalories) { summaryCalories.textContent = `≈ ${Math.round(todayTotals.calories)} / ${TARGET_CAL} kcal${todayTotals.unknownCalories ? ' *' : ''}`; summaryCalories.title = todayTotals.unknownCalories ? (window.GLKOAITestLanguage?.currentLang === 'en' ? 'Some calorie values are unknown.' : 'Bazı yiyeceklerin kalorisi bilinmiyor.') : ''; }
    const setSummaryBar = (id, amount, target) => {
        const bar = document.getElementById(id);
        const percent = Number(target) > 0 ? Math.max(0, Math.min(100, Number(amount) / Number(target) * 100)) : 0;
        if (bar) bar.style.width = `${Number.isFinite(percent) ? percent : 0}%`;
    };
    setSummaryBar('todaySummaryWaterBar', todayTotals.waterMl, TARGET_WATER);
    setSummaryBar('todaySummaryCaloriesBar', todayTotals.calories, TARGET_CAL);
    const english = window.GLKOAITestLanguage?.currentLang === 'en';
    const putSummary = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    const activityMinutes = todayRecords.reduce((sum, item) => { const value = Number(item.actDuration || item.duration || 0); return sum + (Number.isFinite(value) && value > 0 ? value : 0); }, 0);
    const activityTarget = Number(storedProfile.exerciseTarget) || 0;
    putSummary('todaySummaryActivity', `${activityMinutes}${activityTarget > 0 ? ` / ${activityTarget}` : ''} ${english ? 'min' : 'dk'}`);
    setSummaryBar('todaySummaryActivityBar', activityMinutes, activityTarget);
    const latest = predicate => todayRecords.filter(predicate).sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0))[0];
    const glucose = latest(item => Number(item.val || item.glucoseVal) > 0);
    const pressure = latest(item => Number(item.sys || item.bpSys) > 0 && Number(item.dia || item.bpDia) > 0);
    putSummary('todaySummaryGlucose', glucose ? `${glucose.val || glucose.glucoseVal} mg/dL${glucose.time ? ` · ${glucose.time}` : ''}` : '—');
    putSummary('todaySummaryPressure', pressure ? `${pressure.sys || pressure.bpSys}/${pressure.dia || pressure.bpDia}${pressure.time ? ` · ${pressure.time}` : ''}` : '—');
    const symptomRecord = latest(item => Array.isArray(item.symptoms) && item.symptoms.some(Boolean));
    const symptomNames = symptomRecord ? symptomRecord.symptoms.filter(Boolean).map(value => window.GLKOAITestLanguage?.translate(value) || value) : [];
    putSummary('todaySummarySymptoms', symptomNames.length ? `${symptomNames.join(', ')}${symptomRecord.time ? ` · ${symptomRecord.time}` : ''}` : '—');
    const medRecord = latest(item => typeof item.drugs === 'string' && item.drugs.trim());
    putSummary('todaySummaryMedication', medRecord ? `${medRecord.drugs.replace(/\s*\[.*?\]/g, '').trim()}${medRecord.time ? ` · ${medRecord.time}` : ''}` : '—');
    const alertBox = document.getElementById('todayAlerts');
    const alertText = document.getElementById('todayCalorieAlert');
    const exceeded = Number(TARGET_CAL) > 0 && todayTotals.calories > Number(TARGET_CAL);
    if (alertBox) alertBox.classList.toggle('hidden', !exceeded);
    if (alertText) alertText.textContent = exceeded ? (english ? `Daily calorie target exceeded by ${Math.round(todayTotals.calories - TARGET_CAL)} kcal.` : `Günlük kalori hedefi ${Math.round(todayTotals.calories - TARGET_CAL)} kcal aşıldı.`) : '';
    
    const dateInput = document.getElementById('manualDate');
    let targetDateStr = '';
    if (dateInput && dateInput.value) { targetDateStr = dateInput.value.split('-').reverse().join('.'); } 
    else { const today = new Date(); const d = String(today.getDate()).padStart(2, '0'); const m = String(today.getMonth() + 1).padStart(2, '0'); const y = today.getFullYear(); targetDateStr = `${d}.${m}.${y}`; }

    let dailyWaterCups = 0; 
    let dailyCalories = 0; 

    // 1. KAYITLI VERİLERİ TOPLA
    const sugarData = DataManager.getAll();
    if (Array.isArray(sugarData)) {
        const targetItems = sugarData.filter(i => i.dateStr === targetDateStr);
        const storedTotals = computeDailyNutritionTotals(targetItems);
        dailyWaterCups += storedTotals.waterCups;
        dailyCalories += storedTotals.calories;
    }

    // 2. CANLI VERİLERİ TOPLA
    if (typeof FoodLibraryManager !== 'undefined' && FoodLibraryManager.selectedFoods) {
        Object.keys(FoodLibraryManager.selectedFoods).forEach(fname => {
            const item = FoodLibraryManager.selectedFoods[fname];
            if (item.count > 0) {
                dailyWaterCups += waterCupsFor(fname, item.unit, item.count);

                const refLib = FoodLibraryManager.library.find(i => i.ad === fname);
                const refDb = !refLib && FoodLibraryManager.findInGlobalDB ? FoodLibraryManager.findInGlobalDB(fname)?.item : null;
                const value = foodCalories((refLib || refDb)?.bazKalori, item.unit, item.count);
                if (value !== null) dailyCalories += value;
            }
        });
    }

    // Su Barı Güncelleme
    const currentWaterMl = Math.round(dailyWaterCups * WATER_UNIT_ML);
    let waterPct = (currentWaterMl / TARGET_WATER) * 100; if(waterPct > 100) waterPct = 100;

    const elWaterVal = document.getElementById('liveWaterVal');
    const elWaterBar = document.getElementById('liveWaterBar');
    
    if(elWaterVal && elWaterBar) {
        elWaterVal.innerText = `${currentWaterMl} / ${TARGET_WATER} ml`;
        elWaterBar.style.width = `${waterPct}%`;
        
        if (currentWaterMl < (TARGET_WATER * 0.2)) {
            elWaterBar.className = 'h-full transition-all duration-700 ease-out bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
        } else {
            elWaterBar.className = 'h-full transition-all duration-700 ease-out bg-gradient-to-r from-cyan-400 to-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
        }
    }

    // Kalori Barı Güncelleme
    let calPct = (dailyCalories / TARGET_CAL) * 100; if(calPct > 100) calPct = 100;
    const elCalVal = document.getElementById('liveCalVal');
    const elCalBar = document.getElementById('liveCalBar');
    
    if(elCalVal && elCalBar) {
        elCalVal.innerText = `${Math.round(dailyCalories)} / ${TARGET_CAL} kcal`;
        elCalBar.style.width = `${calPct}%`;
        
        if (dailyCalories > TARGET_CAL) { 
            elCalBar.className = 'h-full transition-all duration-700 ease-out bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'; 
        } else { 
            elCalBar.className = 'h-full transition-all duration-700 ease-out bg-gradient-to-r from-orange-300 to-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.5)]'; 
        }
    }
}

function updateHeaderDots() {
    const container = document.getElementById('headerMedDots'); 
    const wrapper = document.getElementById('headerMedWrapper');
    const countEl = document.getElementById('headerMedCount');
    if(!container) return;
    container.innerHTML = '';
    if(wrapper) wrapper.classList.add('hidden');
    if(countEl) {
        countEl.textContent = '0';
        countEl.classList.add('opacity-40');
    }
    const takenMeds = new Set();
    const allData = DataManager.getAll();
    const todayStr = new Date().toLocaleDateString('tr-TR');
    
    allData.forEach(d => {
        if(d.dateStr === todayStr && d.drugs) { 
            d.drugs.split(',').forEach(raw => { 
                let cleanName = raw.replace(/\s*\(.*?\)/g, '').replace(/\s*\[.*?\]/g, '').trim().replace(/\s*-\s*$/, ''); 
                if(cleanName.length > 1) takenMeds.add(cleanName); 
            }); 
        }
    });

    document.querySelectorAll('.med-btn.btn-active-med').forEach(btn => { 
        takenMeds.add(btn.dataset.name); 
    });
    
    if(takenMeds.size === 0) return;
    if(wrapper) wrapper.classList.remove('hidden');
    if(countEl) {
        countEl.textContent = takenMeds.size;
        countEl.classList.remove('opacity-40');
    }
    
        takenMeds.forEach(name => {
        const color = getMedColor(name); // DEĞİŞTİRİLDİ
        const dot = document.createElement('div');
        dot.className = 'w-2.5 h-2.5 rounded-full shadow-md border border-white/10 transition-transform hover:scale-150 cursor-help';
        dot.style.backgroundColor = color; 
        dot.style.boxShadow = `0 0 8px ${color}`; 
        dot.title = name;
        if(container.children.length > 0) {
            dot.style.marginLeft = '3px';
        }
        container.appendChild(dot);
    });
}

// 7. ANA LİSTELEME VE GEÇMİŞ
function updateViewModeIndicator() {
    const indicator = document.getElementById('viewModeIndicator');
    if (indicator && indicator.children.length === 3) {
        const dots = indicator.children;
        // Her mod için farklı aktif renk
        const activeColors = ['#94a3b8', '#60a5fa', '#34d399']; // slate-400, blue-400, emerald-400
        const inactiveColor = 'rgba(51, 65, 85, 0.5)'; // slate-700/50
        
        for (let i = 0; i < 3; i++) {
            if (i === historyViewMode) {
                dots[i].className = 'w-2 h-2 rounded-full shadow-sm transition-all';
                dots[i].style.backgroundColor = activeColors[historyViewMode];
            } else {
                dots[i].className = 'w-2 h-2 rounded-full transition-all';
                dots[i].style.backgroundColor = inactiveColor;
            }
        }
    }
}

function cycleHistoryView() { 
    historyViewMode = (historyViewMode + 1) % 3; 
    const eyeIcon = document.getElementById('eyeIcon');
    const btn = document.getElementById('viewToggleBtn');
    const filterBar = document.getElementById('filterBar');
    const commonClasses = "text-xl transition-transform duration-300 group-hover:scale-110";
    const baseBtnClasses = "flex-1 h-10 px-4 rounded-xl border-2 border-dashed font-bold transition flex items-center justify-center gap-2 uppercase text-[10px] tracking-wide group";

    if (btn) {
        if (historyViewMode === 0) { 
            btn.className = `${baseBtnClasses} border-slate-600 text-slate-400 hover:border-slate-500 hover:bg-slate-500/10`;
            btn.title = "Görünüm: Gizli";
            if(eyeIcon) eyeIcon.className = `ph-fill ph-eye-slash ${commonClasses} text-slate-500`; 
            if(filterBar) { filterBar.style.opacity = '0.1'; filterBar.style.pointerEvents = 'none'; }
        } 
        else if (historyViewMode === 1) { 
            btn.className = `${baseBtnClasses} border-blue-500 text-blue-400 hover:bg-blue-500/10`;
            btn.title = "Görünüm: Özet (Günlük)";
            if(eyeIcon) eyeIcon.className = `ph-fill ph-squares-four ${commonClasses} text-blue-400`; 
            if(filterBar) { filterBar.style.opacity = '1'; filterBar.style.pointerEvents = 'auto'; }
        } 
        else { 
            btn.className = `${baseBtnClasses} border-emerald-500 text-emerald-400 hover:bg-emerald-500/10`;
            btn.title = "Görünüm: Detaylı";
            if(eyeIcon) eyeIcon.className = `ph-fill ph-list-dashes ${commonClasses} text-emerald-400`; 
            if(filterBar) { filterBar.style.opacity = '1'; filterBar.style.pointerEvents = 'auto'; }
        }
        
        updateViewModeIndicator();
    }
    renderList(); 
}

function confirmDeleteRecord(id) {
    UIEnhancer.showConfirm('Bu kayıt kalıcı olarak silinsin mi?', () => {
        DataManager.delete(id);
        renderList();
        showToast('Kayıt silindi', 'success');
    });
}

function renderList() {
    const list = document.getElementById('historyList'); 
    const filterVal = document.getElementById('filterSelect').value;
    let data = DataManager.getAll();
    if(filterVal !== 'all') { const d = new Date(); d.setDate(d.getDate() - parseInt(filterVal)); d.setHours(0,0,0,0); data = data.filter(item => item.timestamp >= d.getTime()); }
    const filteredData = data.filter(item => historyRecordMatchesFilters(item, activeFilters));
    
    // Listeyi çizmeden ÖNCE güncelle
    updateViewModeIndicator();
    updateHeaderStats();
    updateCharts();

    // Asistan Analizini Güncelle
    if(typeof AssistantManager !== 'undefined') AssistantManager.generateInsight();

    if (historyViewMode === 0) { list.classList.add('hidden'); return; }
    list.classList.remove('hidden');
    if (filteredData.length === 0) { const en = window.GLKOAITestLanguage?.currentLang === 'en'; const message = !activeFilters.size ? (en ? 'Select a filter to see records.' : 'Kayıtları görmek için filtre seçin.') : (en ? 'No matching records.' : 'Bu filtrelere uygun kayıt yok.'); list.innerHTML = `<div class="text-center text-slate-500 py-10 opacity-70" role="status"><i class="ph-fill ph-notebook text-4xl mb-2"></i><p>${message}</p></div>`; return; }

    const groups = {}; filteredData.forEach(item => { if (!groups[item.dateStr]) groups[item.dateStr] = []; groups[item.dateStr].push(item); });
    let html = '';
    const dayProfile = safeGetProfile();
    const targetWater = dayProfile.waterTarget || 2500;
    const targetCal = dayProfile.calorieTarget || 2000;
    
    // Tarihleri yeniden eskiye sırala
    const sortedDates = Object.keys(groups).sort((a, b) => {
        const da = a.split('.').reverse().join('-');
        const db = b.split('.').reverse().join('-');
        return new Date(db) - new Date(da);
    });

    sortedDates.forEach(date => {
        const items = groups[date];
        const allDayItems = data.filter(d => d.dateStr === date);
        const distinctMeds = new Set();
        allDayItems.forEach(i => { if(i.drugs) { i.drugs.split(',').forEach(raw => { let name = raw.replace(/\s*\(.*?\)/g, '').replace(/\s*\[.*?\]/g, '').trim().replace(/\s*-\s*$/, ''); if(name.length > 1) distinctMeds.add(name); }); } });
        const dailyTotals = computeDailyNutritionTotals(allDayItems);
        const dailyWaterCups = dailyTotals.waterCups;
        const totalMl = dailyTotals.waterMl;
        const totalCaloriesRaw = dailyTotals.calories;
        const totalCalories = Math.round(totalCaloriesRaw);
        const clampPct = (value) => Math.max(0, Math.min(100, value));
        const activityItems = allDayItems.filter(i => i.type === 'activity' || Number(i.actDuration) > 0);
        const toNumber = (value) => {
            if (typeof value === 'string') value = value.replace(',', '.');
            const num = Number.parseFloat(value);
            return Number.isFinite(num) ? num : 0;
        };
        const totalActivityDurationRaw = activityItems.reduce((sum, item) => sum + toNumber(item.duration ?? item.actDuration), 0);
        // Each entry stores the same daily goal: use the most recent saved goal once.
        const recentGoals = activityItems.filter(item => toNumber(item.goal ?? item.actGoal) > 0).slice().sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
        const totalActivityGoalRaw = recentGoals.length ? toNumber(recentGoals[0].goal ?? recentGoals[0].actGoal) : Math.max(0, toNumber(dayProfile.exerciseTarget));
        const activityPctRaw = totalActivityGoalRaw > 0 ? (totalActivityDurationRaw / totalActivityGoalRaw) * 100 : 0;
        const activityPct = Number.isFinite(activityPctRaw) ? clampPct(activityPctRaw) : 0;
        let activityBarColor = 'bg-gradient-to-r from-[#edb015] to-[#f6d067] shadow-[0_0_10px_rgba(237,176,21,0.5)]';
        if (totalActivityGoalRaw > 0) {
            if (totalActivityDurationRaw >= totalActivityGoalRaw) activityBarColor = 'bg-gradient-to-r from-[#edb015] to-[#f6d067] shadow-[0_0_12px_rgba(237,176,21,0.6)]';
            else if (activityPct < 50) activityBarColor = 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
        }
        const englishSummary = window.GLKOAITestLanguage?.currentLang === 'en';
        const minuteLabel = englishSummary ? 'min' : 'dk';
        const activityInfoText = totalActivityGoalRaw > 0 ? `${Math.round(totalActivityDurationRaw)} ${minuteLabel} | ${englishSummary ? 'Goal' : 'Hedef'} ${Math.round(totalActivityGoalRaw)} ${minuteLabel}` : `${Math.round(totalActivityDurationRaw)} ${minuteLabel}`;
        const showActivityBar = activeFilters.has('activity') && (totalActivityDurationRaw > 0 || activityItems.length > 0);
        const waterPctRaw = targetWater > 0 ? (totalMl / targetWater) * 100 : (totalMl > 0 ? 100 : 0);
        const waterPct = Number.isFinite(waterPctRaw) ? clampPct(waterPctRaw) : 0;
        const calPctRaw = targetCal > 0 ? (totalCaloriesRaw / targetCal) * 100 : (totalCaloriesRaw > 0 ? 100 : 0);
        const calPct = Number.isFinite(calPctRaw) ? clampPct(calPctRaw) : 0;
        const waterBarColor = (totalMl > 0 && waterPct < 20) ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-gradient-to-r from-cyan-400 to-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
        const calBarColor = (targetCal > 0 && totalCaloriesRaw > targetCal) ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-gradient-to-r from-orange-300 to-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.5)]';
        const waterInfoText = targetWater ? `${englishSummary ? "Consumed" : "Tüketilen"} ${totalMl} ml | ${englishSummary ? "Goal" : "Hedef"} ${targetWater} ml` : `${englishSummary ? "Consumed" : "Tüketilen"} ${totalMl} ml`;
        const calInfoText = (targetCal ? `${englishSummary ? "Consumed" : "Tüketilen"} ${totalCalories} kcal | ${englishSummary ? "Goal" : "Hedef"} ${targetCal} kcal` : `${englishSummary ? "Consumed" : "Tüketilen"} ${totalCalories} kcal`) + (dailyTotals.unknownCalories ? ' *' : '');
        const showWaterBar = targetWater > 0 || totalMl > 0;
        const showCalBar = targetCal > 0 || totalCaloriesRaw > 0;
        const shouldShowBars = showWaterBar || showCalBar || showActivityBar;
        const activityBarHtml = showActivityBar ? `<div class="relative h-[18px] bg-slate-800 border border-slate-700 rounded-full overflow-hidden">
                    <div class="${activityBarColor} absolute inset-y-0 left-0 h-full transition-all duration-700 ease-out" style="width:${activityPct.toFixed(1)}%;"></div>
                    <div class="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-bold pointer-events-none">
                        <span class="text-[#f6d067] uppercase tracking-wide flex items-center gap-1"><i class="ph-fill ph-person-simple-run text-[11px]"></i> ${englishSummary ? "Activity" : "Aktivite"}</span>
                        <span class="text-slate-200 font-semibold normal-case whitespace-nowrap">${activityInfoText}</span>
                    </div>
                </div>` : '';
        const waterBarHtml = showWaterBar ? `<div class="relative h-[18px] bg-slate-800 border border-slate-700 rounded-full overflow-hidden">
                    <div class="${waterBarColor} absolute inset-y-0 left-0 h-full transition-all duration-700 ease-out" style="width:${waterPct.toFixed(1)}%;"></div>
                    <div class="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-bold pointer-events-none">
                        <span class="text-cyan-200 uppercase tracking-wide">${englishSummary ? "Water" : "Su"}</span>
                        <span class="text-slate-200 font-semibold normal-case whitespace-nowrap">${waterInfoText}</span>
                    </div>
                </div>` : '';
        const calBarHtml = showCalBar ? `<div class="relative h-[18px] bg-slate-800 border border-slate-700 rounded-full overflow-hidden">
                    <div class="${calBarColor} absolute inset-y-0 left-0 h-full transition-all duration-700 ease-out" style="width:${calPct.toFixed(1)}%;"></div>
                    <div class="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-bold pointer-events-none">
                        <span class="text-orange-200 uppercase tracking-wide">${englishSummary ? "Calories" : "Kalori"}</span>
                        <span class="text-slate-200 font-semibold normal-case whitespace-nowrap">${calInfoText}</span>
                    </div>
                </div>` : '';
        const barsHtml = shouldShowBars ? `<div class="mt-3 flex flex-col gap-2">
            ${activityBarHtml}
            ${waterBarHtml}
            ${calBarHtml}
            </div>` : '';
        
        let dotsHtml = '';
         if(activeFilters.has('medication') && distinctMeds.size > 0) { 
        dotsHtml += `<div class="flex items-center gap-1.5 mr-3 bg-slate-800 border border-slate-700 px-2 py-1.5 rounded-xl shadow-sm">`; 
        dotsHtml += `<span class="text-[9px] font-bold text-slate-500 uppercase tracking-wide">${englishSummary ? "MEDICATIONS" : "İLAÇLAR"}</span><i class="ph-bold ph-caret-right text-slate-600 text-[10px]"></i>`;
        distinctMeds.forEach(name => { 
            const color = getMedColor(name); // DEĞİŞTİRİLDİ
            dotsHtml += `<div class="w-2.5 h-2.5 rounded-full transition-transform hover:scale-150" style="background-color: ${color}; box-shadow: 0 0 8px ${color};" title="${name}"></div>`; 
        }); 
        dotsHtml += `</div>`; 
    }

        const countMatching = type => activeFilters.has(type) ? items.filter(item => historyRecordMatchesFilters(item, new Set([type]))).length : 0;
        const cS = countMatching('symptom');
        const cG = countMatching('glucose');
        const cB = countMatching('pressure');
        const cN = countMatching('nutrition');
        const cA = countMatching('activity');
        const cM = countMatching('medication');
        const isOpen = (historyViewMode === 2 || (historyViewMode === 1 && date === new Date().toLocaleDateString('tr-TR'))) ? 'open' : '';

        html += `<details class="group mb-4" ${isOpen}>
            <summary class="block bg-slate-900 p-3 rounded-2xl border border-slate-800 cursor-pointer select-none mb-2 hover:bg-slate-800 transition">
                <div class="flex justify-between items-center">
                    <span class="flex flex-col leading-tight">
                        <span class="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><i class="ph-fill ph-calendar-blank"></i> ${getHumanDate(date)}</span>
                        <span class="text-[10px] font-bold text-slate-600 ml-6 mt-0.5">${getWeekdayLabel(date)}</span>
                    </span>
                    <div class="flex items-center gap-2 md:gap-3">
                        <div class="flex items-center gap-2 mr-2">
                            ${cG ? `<span class="text-teal-400 text-[10px] font-bold bg-teal-900/20 px-1.5 py-0.5 rounded border border-teal-500/20"><i class="ph-fill ph-drop"></i> ${cG}</span>`:''}
                            ${cB ? `<span class="text-rose-400 text-[10px] font-bold bg-rose-900/20 px-1.5 py-0.5 rounded border border-rose-500/20"><i class="ph-fill ph-heartbeat"></i> ${cB}</span>`:''}
                            ${cN ? `<span class="text-orange-400 text-[10px] font-bold bg-orange-900/20 px-1.5 py-0.5 rounded border border-orange-500/20"><i class="ph-fill ph-carrot"></i> ${cN}</span>`:''}
                            ${cA ? `<span class="text-[#facc15] text-[10px] font-bold bg-[#facc15]/15 px-1.5 py-0.5 rounded border border-[#facc15]/20"><i class="ph-fill ph-person-simple-run"></i> ${cA}</span>`:''}
                            ${cS ? `<span class="text-[#c6a34a] text-[10px] font-bold bg-[#c6a34a]/20 px-1.5 py-0.5 rounded border border-[#c6a34a]/20"><i class="ph-fill ph-smiley-nervous"></i> ${cS}</span>`:''}
                            ${cM ? `<span class="text-violet-400 text-[10px] font-bold bg-violet-900/20 px-1.5 py-0.5 rounded border border-violet-500/20"><i class="ph-fill ph-pill"></i> ${cM}</span>`:''}
                        </div>
                        <i class="ph-bold ph-caret-down arrow-icon text-slate-500 transition-transform group-open:rotate-180"></i>
                    </div>
                </div>
                ${(barsHtml || dotsHtml) ? `<div class="history-full-day-label">${window.GLKOAITestLanguage?.currentLang === 'en' ? 'FULL DAY SUMMARY' : 'GÜNÜN TAMAMI'}</div>` : ''}
                ${barsHtml}
                ${dotsHtml ? `<div class="mt-2 pt-2 border-t border-slate-800">${dotsHtml.replace('mr-3', '')}</div>` : ''}
            </summary>
            <div class="space-y-2">${items.map(i => createMeasurementCard(i, false)).join('')}</div>
        </details>`;
    });
    list.innerHTML = html; 
}

function createMeasurementCard(item, isHero) {
    const display = value => window.GLKOAITestLanguage ? window.GLKOAITestLanguage.translate(value) : value;
    const displayDiet = value => {
        const m = typeof value === 'string' && value.match(/^(.*) \(([\d.,]+)\s+([^()]*)\)$/);
        return m ? displayFoodRecord(value) : display(value);
    };
    let dietHtml = '';
    const dietSimple = item.diets ? item.diets.map(d => escapeHtml(displayDiet(d))).join(', ') : '';
    if (item.diets && item.diets.length > 0) {
        dietHtml = `<div class="flex flex-col gap-1 mt-1">`;
        let totalCal = 0;
        item.diets.forEach(d => {
            const m = d.match(/(.*) \(([\d\.,]+)\s+(.*)\)/);
            if(m) {
                const rawName = m[1].trim();
                let amount = parseFloat(m[2].replace(',', '.'));
                if (Number.isNaN(amount)) amount = 0;
                const rawUnit = m[3].trim();
                const lowerUnit = rawUnit.toLocaleLowerCase('tr');
                const lowerName = rawName.toLocaleLowerCase('tr');
                const catalogFood = typeof FoodLibraryManager !== 'undefined' ? FoodLibraryManager.library.find(food => String(food.ad || '').toLocaleLowerCase('tr') === lowerName) : null;
                const displayName = escapeHtml(displayedFoodName(catalogFood) || display(rawName));
                const unitLabel = escapeHtml(display(rawUnit));
                const displayAmount = Number.isInteger(amount) ? amount : parseFloat(amount.toFixed(1));
                let displayUnit = `${displayAmount} ${unitLabel}`;
                if ((lowerName === 'su' || lowerName === 'water') && lowerUnit === 'bardak') { const mlVal = Math.round(amount * 250); displayUnit = `${displayAmount} ${unitLabel} <span class="text-cyan-400 font-bold ml-1">(${mlVal}ml)</span>`; }
                let refItem = null;
                if (typeof FoodLibraryManager !== 'undefined' && Array.isArray(FoodLibraryManager.library)) { refItem = FoodLibraryManager.library.find(i => (i.ad || '').toLocaleLowerCase('tr') === lowerName) || null; }
                if (!refItem && typeof FoodLibraryManager !== 'undefined' && typeof FoodLibraryManager.findInGlobalDB === 'function') { const lookup = FoodLibraryManager.findInGlobalDB(rawName); if (lookup && lookup.item) refItem = lookup.item; }
                if (!refItem && typeof YEMEK_VERITABANI !== 'undefined') {
                    refItem = YEMEK_VERITABANI.kokler.find(f => f.anahtarKelimeler.some(kw => kw.toLocaleLowerCase('tr') === lowerName)) || null;
                    if (!refItem) refItem = YEMEK_VERITABANI.kokler.find(f => f.anahtarKelimeler.some(kw => lowerName.includes(kw.toLocaleLowerCase('tr')))) || null;
                }
                const foodResult = computeDailyNutritionTotals([{ diets: [d] }]);
                let cal = foodResult.calories;
                if (cal < 0.01) cal = 0;
                const bandInfo = (typeof FoodLibraryManager !== 'undefined' && typeof FoodLibraryManager.resolveCalorieBand === 'function') ? FoodLibraryManager.resolveCalorieBand(cal) : { key: 'none', bg: 'transparent', border: 'rgba(71, 85, 105, 0.4)', accent: '#34d399', accentBg: 'rgba(16, 185, 129, 0.18)' };
                const colorMap = {
                    sub100: 'rgb(0, 255, 200)',
                    sub200: '#fff5ba',
                    sub300: '#ff5757',
                    none: '#4be4ff'
                };
                const calorieColor = colorMap[bandInfo.key] || '#00f7ff';
                const badgeClass = bandInfo.key === 'sub100' ? 'calorie-band-low' : bandInfo.key === 'sub200' ? 'calorie-band-mid' : bandInfo.key === 'sub300' ? 'calorie-band-high' : 'calorie-band-low';
                const kcalBadge = foodResult.unknownCalories ? `<span class="calorie-pill">${escapeHtml(localizedPlaceholder('Kalori bilinmiyor', 'Calories unknown'))}</span>` : `<span class="calorie-pill ${badgeClass}" style="color:${calorieColor}">➦ ≈ ${Math.round(cal)} KCAL</span>`;
                totalCal += cal;
                dietHtml += `<div class="flex justify-between items-center gap-2 calorie-row" data-calorie-band="${bandInfo.key}"><span class="text-slate-300 font-medium">${escapeMedicationText(displayName)}</span><div class="text-right flex items-center justify-end gap-2"><span class="text-slate-500 text-[10px]">${displayUnit}</span>${kcalBadge}</div></div>`;
            } else dietHtml += `<div class="text-slate-300 text-xs">${escapeHtml(displayDiet(d))}</div>`;
        });
        if(totalCal>0) {
            dietHtml += `<div class="flex justify-between items-center mt-2 pt-2 border-t border-slate-600 total-energy-row"><span class="text-blue-400 font-black text-[10px] uppercase">${display('TOPLAM ENERJİ')}</span><span class="total-energy-pill" style="color:#7bbfff;">≈ ${Math.round(totalCal)} KCAL</span></div>`;
        }
        dietHtml += `</div>`;
    }

    const sym = item.symptoms ? item.symptoms.map(value => { const sev=item.symptomSeverities?.[value], tr={mild:'Hafif',moderate:'Orta',severe:'Şiddetli'}[sev], en={mild:'Mild',moderate:'Moderate',severe:'Severe'}[sev], level=window.GLKOAITestLanguage?.currentLang==='en'?en:tr; return escapeHtml(display(value))+(level?' · '+escapeHtml(level):''); }).join(', ') : '';
    const meds = item.drugs ? escapeHtml(item.drugs) : '';
    const uniqueId = `detail-${isHero ? 'hero' : 'list'}-${item.id}`;
    const detailBtn = `<button onclick="event.stopPropagation(); editItem(${item.id})" class="text-slate-500 hover:text-blue-400 transition ml-2"><i class="ph-fill ph-pencil-simple text-xl"></i></button><button onclick="event.stopPropagation(); confirmDeleteRecord(${item.id})" class="text-slate-500 hover:text-red-400 transition ml-2"><i class="ph-fill ph-trash text-xl"></i></button>`;
    const footer = `<div id="${uniqueId}" class="details-wrapper border-t border-slate-700/0 transition-colors"><div class="details-inner"><div class="p-3 bg-slate-900/50 text-xs text-slate-400 space-y-2">${dietHtml ? `<div>${dietHtml}</div>` : ''}${sym?`<div class="flex gap-2 items-center text-orange-300 bg-orange-900/20 p-2 rounded-lg"><i class="ph-fill ph-warning"></i> ${sym}</div>`:''}${meds?`<div class="flex gap-2 items-center text-blue-300 bg-blue-900/20 p-2 rounded-lg"><i class="ph-fill ph-pill"></i> ${meds}</div>`:''}</div></div></div>`;
    const heroHeader = isHero ? `<div class="hero-header" style="justify-content: flex-start; gap: 10px;"><span class="hero-title">${display('SON ÖLÇÜM')}</span><span class="hero-date font-bold text-white text-[11px]">${item.dateStr} ${item.time} <span class="text-slate-400">${getWeekdayLabel(item.dateStr)}</span></span></div>` : '';


// Badge fonksiyonunun içini şöyle değiştirin:
    const badge = (c,t, item) => {
            let dotsHtml = '';
            if (item.drugs) {
                const distinctMeds = new Set(); 
                item.drugs.split(',').forEach(raw => { 
                    let name = raw.replace(/\s*\(.*?\)/g, '').replace(/\s*\[.*?\]/g, '').trim().replace(/\s*-\s*$/, ''); 
                    if(name.length > 1) distinctMeds.add(name); 
            });
            if (distinctMeds.size > 0) { 
            dotsHtml += `<div class="flex items-center gap-1.5 mr-2">`; 
            distinctMeds.forEach(name => { 
                const color = getMedColor(name); // DEĞİŞTİRİLDİ
                dotsHtml += `<div class="w-2.5 h-2.5 rounded-full" style="background-color: ${color}; box-shadow: 0 0 6px ${color};" title="${name}"></div>`; 
            }); 
            dotsHtml += `</div>`; 
        }
    }
        return `<div class="absolute top-0 right-0 px-3 py-1 bg-black/60 backdrop-blur-sm border-l border-b border-white/10 rounded-bl-xl shadow-lg flex items-center ${c}">${dotsHtml}<span class="text-[9px] font-black">${display(t)}</span></div>`;
    };

    if (item.type === 'medication_only') return `<div class="bg-slate-800/50 border border-slate-700/50 border-l-4 border-l-violet-500 rounded-2xl overflow-hidden relative">${heroHeader}<div class="flex justify-between items-center p-3 cursor-pointer" onclick="toggleDetails('${uniqueId}')"><div class="flex items-center gap-3"><i class="ph-fill ph-pill text-3xl text-violet-400"></i><div><span class="font-bold text-white block">${escapeHtml(item.time || '')}</span><span class="text-xs text-violet-300">${display('İLAÇ')}</span></div></div><div class="flex-1 px-4 text-xs text-slate-300">${escapeHtml(item.drugs || '')}</div>${detailBtn}</div>${footer}</div>`;
    if (item.type === 'nutrition_only') return `<div class="${isHero?'bg-slate-800 border-l-4 border-l-orange-500 shadow-2xl rounded-3xl':'bg-slate-800/50 border border-slate-700/50 border-l-4 border-l-orange-500 rounded-2xl'} overflow-hidden relative">${badge('text-orange-400', 'BESLENME', item)}${heroHeader}<div class="flex justify-between items-center ${isHero?'p-5':'p-3'} cursor-pointer" onclick="toggleDetails('${uniqueId}')"><div class="flex items-center gap-4"><div class="w-12 h-12 flex items-center justify-center"><i class="ph-fill ph-carrot text-3xl text-orange-500"></i></div><div><span class="font-bold text-white tabular-nums block">${item.time}</span><span class="text-[10px] text-orange-500 uppercase tracking-wide">${display('BESLENME')}</span></div></div><div class="flex-1 px-4 text-[10px] text-slate-400 uppercase font-bold truncate">${dietSimple}</div><div class="flex items-center">${detailBtn}</div></div>${footer}</div>`;
    if (item.type === 'activity') {
        const activityGoalRaw = (item.goal ?? item.actGoal ?? null);
        const hasGoal = activityGoalRaw !== null && activityGoalRaw !== '';
        const moodKey = item.mood || item.actMood || '';
        const moodMeta = {
            happy: { icon: 'ph-smiley', label: 'Rahat', color: 'text-emerald-200', bg: 'bg-emerald-500/15 border-emerald-500/20' },
            neutral: { icon: 'ph-smiley-meh', label: 'İdeal', color: 'text-[#edb015]', bg: 'bg-[#edb015]/15 border-[#edb015]/30' },
            tired: { icon: 'ph-smiley-nervous', label: 'Yorucu', color: 'text-rose-200', bg: 'bg-rose-500/15 border-rose-500/30' }
        }[moodKey] || null;
        const formatMinutes = (value) => {
            if (value === undefined || value === null || value === '') return '';
            const num = Number.parseFloat(value);
            if (Number.isFinite(num)) return Math.round(num);
            return value;
        };
        const moodIconHtml = moodMeta ? `<div class="w-10 h-10 rounded-xl flex items-center justify-center ${moodMeta.bg} shadow-inner" title="${display(moodMeta.label)}"><i class="ph-fill ${moodMeta.icon} text-2xl ${moodMeta.color}"></i></div>` : '';
        const durationValue = formatMinutes(item.duration);
        const goalValue = hasGoal ? formatMinutes(activityGoalRaw) : '';
        const durationLabel = durationValue !== '' ? `${durationValue} ${window.GLKOAITestLanguage?.currentLang === 'en' ? 'min' : 'dk'}` : '';
        const goalLabel = hasGoal && goalValue !== '' ? ` - ${window.GLKOAITestLanguage?.currentLang === 'en' ? 'goal' : 'hedef'} ${goalValue} ${window.GLKOAITestLanguage?.currentLang === 'en' ? 'min' : 'dk'}` : '';
        const durationGoalHtml = `<div class="text-xs text-[#edb015] font-bold">${durationLabel}${goalLabel}</div>`;
        return `<div class="${isHero?'bg-slate-800 border-l-4 border-l-[#facc15] shadow-2xl rounded-3xl':'bg-slate-800/50 border border-slate-700/50 border-l-4 border-l-[#facc15] rounded-2xl'} overflow-hidden relative">${badge('text-[#facc15]', 'AKTİVİTE', item)}${heroHeader}<div class="flex justify-between items-center ${isHero?'p-5':'p-3'} cursor-pointer" onclick="toggleDetails('${uniqueId}')"><div class="flex items-center gap-4"><div class="w-12 h-12 flex items-center justify-center"><i class="ph-fill ph-person-simple-run text-3xl text-[#facc15]"></i></div><div><span class="font-bold text-white tabular-nums block">${item.time}</span><span class="text-[10px] text-[#facc15] uppercase tracking-wide">${display('AKTİVİTE')}</span></div></div><div class="text-center flex flex-col items-center gap-1"><div class="flex items-center gap-2"><div class="text-lg font-black text-white uppercase">${escapeHtml(display(item.name))}</div>${moodIconHtml}</div>${durationGoalHtml}</div><div class="flex items-center">${detailBtn}</div></div>${footer}</div>`;
    }
    if (item.type === 'symptom_only') return `<div class="${isHero?'bg-slate-800 border-l-4 border-l-[#c6a34a] shadow-2xl rounded-3xl':'bg-slate-800/50 border border-slate-700/50 border-l-4 border-l-[#c6a34a] rounded-2xl'} overflow-hidden relative">${badge('text-[#c6a34a]', 'BELİRTİ', item)}${heroHeader}<div class="flex justify-between items-center ${isHero?'p-5':'p-3'} cursor-pointer" onclick="toggleDetails('${uniqueId}')"><div class="flex items-center gap-4"><div class="w-12 h-12 flex items-center justify-center"><i class="ph-fill ph-smiley-nervous text-3xl text-[#c6a34a]"></i></div><div><span class="font-bold text-white tabular-nums block">${item.time}</span><span class="text-[10px] text-[#c6a34a] uppercase tracking-wide">${display('DURUM')}</span></div></div><div class="flex-1 px-4 text-[10px] text-slate-400 uppercase font-bold truncate">${sym}</div><div class="flex items-center">${detailBtn}</div></div>${footer}</div>`;
    if (item.type === 'pressure') {
        const s = parseInt(item.sys), d = parseInt(item.dia), p = parseInt(item.pulse||0);
        let bc='border-emerald-500', st='NORMAL', sc='text-emerald-400', pc='text-emerald-300', pa='';
        if (s>140||d>90) { bc='border-red-600'; st='YÜKSEK'; sc='text-red-400'; pc='text-red-500'; pa='animate-ping'; }
        else if (s<90||d<60||(p>0&&(p<50||p>100))) { bc='border-orange-500'; st='ANORMAL'; sc='text-orange-400'; pc='text-orange-400'; if(p>100||p<50) pa='animate-ping'; }
        const sysColor = s > 140 ? 'bp-input-high' : s < 90 ? 'bp-input-low' : 'bp-input-normal';
        const diaColor = d > 90 ? 'bp-input-high' : d < 60 ? 'bp-input-low' : 'bp-input-normal';
        const pulseColor = p > 100 ? 'bp-input-tachycardia' : p < 50 ? 'bp-input-bradycardia' : 'bp-input-normal';
        return `<div class="${isHero?'bg-slate-800 border-l-4 border-l-red-500 shadow-2xl rounded-3xl':'bg-slate-800/50 border border-slate-700/50 border-l-4 border-l-red-500 rounded-2xl'} overflow-hidden relative">${badge(sc,st, item)}${heroHeader}<div class="flex justify-between items-center ${isHero?'p-5':'p-3'} cursor-pointer" onclick="toggleDetails('${uniqueId}')"><div class="flex items-center gap-4"><div class="w-12 h-12 flex items-center justify-center"><i class="ph-fill ph-heartbeat text-3xl text-red-500"></i></div><div><span class="font-bold text-white tabular-nums block">${item.time}</span><span class="text-[10px] text-red-300 uppercase tracking-wide">${display('TANSİYON')}</span></div></div><div class="flex items-center gap-3"><div class="text-center"><span class="text-2xl font-black tabular-nums"><span class="${sysColor}">${item.sys}</span>/<span class="${diaColor}">${item.dia}</span></span></div>${item.pulse?`<div class="flex flex-col items-center"><i class="ph-fill ph-heart ${pc} text-xs ${pa}"></i><span class="text-xs font-bold tabular-nums ${pulseColor}">${item.pulse}</span></div>`:''}</div><div class="flex items-center">${detailBtn}</div></div>${footer}</div>`;
    }
    const prof = DataManager.getProfile(); const mode = prof.targetMode||'std'; const t = AppConfig.TARGETS[mode];
    let col='text-emerald-400', stat='NORMAL'; if(item.val<t.min){col='text-red-400'; stat='DÜŞÜK';} else if(item.val>t.max){col='text-red-400'; stat='YÜKSEK';}
    const cat = AppConfig.CATEGORIES[item.category];
    return `<div class="${isHero?'bg-slate-800 border-l-4 border-l-emerald-500 shadow-2xl rounded-3xl':'bg-slate-800/50 border border-slate-700/50 border-l-4 border-l-emerald-500 rounded-2xl'} overflow-hidden relative">${badge(col,stat, item)}${heroHeader}<div class="flex justify-between items-center ${isHero?'p-5':'p-3'} cursor-pointer" onclick="toggleDetails('${uniqueId}')"><div class="flex items-center gap-4"><div class="w-12 h-12 flex items-center justify-center"><i class="ph-fill ph-drop text-3xl text-teal-400"></i></div><div><span class="font-bold text-white tabular-nums block">${item.time}</span><span class="text-[10px] text-slate-500 uppercase tracking-wide">${cat?cat.label:'-'}</span></div></div><div class="text-3xl font-black ${col} tabular-nums">${item.val}</div><div class="flex items-center">${detailBtn}</div></div>${footer}</div>`;
}

// 8. KAYIT VE FORM İŞLEMLERİ
function getFormData(medicationScope = null) {
    const d = document.getElementById('manualDate').value;
    const t = document.getElementById('manualTime').value;

    if (!d || !t) {
        throw new Error('Geçerli bir tarih ve saat seçiniz');
    }

    const tsDate = new Date(`${d}T${t}`);
    const ts = tsDate.getTime();
    if (!Number.isFinite(ts)) {
        throw new Error('Geçerli bir tarih ve saat seçiniz');
    }
    
    // İlaçları topla (Hem ana listeden hem glikoz ekranından)
    const medsMap = new Map();
    const addMed = (el) => {
        const name = el.dataset.name;
        const strength = (el.dataset.strength || (el.dataset.dose ? el.dataset.dose+' mg' : '')).replace(/,/g,'.');
        // Aynı ürün birden fazla alanda seçilse bile tek kayıt oluşur.
        const key = normalizeMedName(name);
        const entry = `${name}${strength?` (${strength})`:''} [${t}]`;
        
        // Eğer ilaç zaten listede varsa ve yeni gelen doz bilgisi içeriyorsa, onu tercih et
        if (medsMap.has(key)) {
            const existing = medsMap.get(key);
            if (!existing.includes(' (') && strength) {
                medsMap.set(key, entry);
            }
        } else {
            medsMap.set(key, entry);
        }
    };
    if (medicationScope === 'glucose') document.querySelectorAll('.glucose-med-btn.active').forEach(addMed);
    else if (medicationScope === 'pressure') document.querySelectorAll('.bp-med-btn.active').forEach(addMed);
    else {
        document.querySelectorAll('.med-btn.btn-active-med').forEach(addMed);
        document.querySelectorAll('.glucose-med-btn.active').forEach(addMed);
        document.querySelectorAll('.bp-med-btn.active').forEach(addMed);
        document.querySelectorAll('.nutrition-med-btn.active').forEach(addMed);
    }
    const meds = Array.from(medsMap.values());

    const syms = []; document.querySelectorAll('.sym-btn.btn-active-sym').forEach(e=>{ const s=e.querySelector('span'); syms.push(s ? (s.dataset.symptomOriginal || s.textContent) : e.textContent.trim()); });
    const diets = FoodLibraryManager.getSelectedTags();
    let actName = selectedActivity;
    const actGoalInput = document.getElementById('actGoal')?.value || '';
    let actGoal = null;
    if (actGoalInput.trim() !== '') {
        const parsedGoal = parseInt(actGoalInput, 10);
        if (!Number.isNaN(parsedGoal)) actGoal = parsedGoal;
    }
    return { editId: document.getElementById('editingId').value, dateStr: d.split('-').reverse().join('.'), time: t, timestamp: ts, symptoms: syms, symptomSeverities: Object.fromEntries(syms.filter(name=>symptomSeveritySelection.has(name)).map(name=>[name,symptomSeveritySelection.get(name)])), drugs: meds.join(', '), diets: diets, bpSys: document.getElementById('bpSys').value, bpDia: document.getElementById('bpDia').value, bpPulse: document.getElementById('bpPulse').value, glucoseVal: parseInt(document.getElementById('glucoseValue').value), actDuration: document.getElementById('actDuration').value, actName: actName, actGoal: actGoal, actMood: selectedActivityMood, nutritionSnapshots: Object.entries(FoodLibraryManager.selectedFoods).filter(([_,selection])=>selection.count>0).map(([name,selection])=>{const previous=DataManager.getItem(document.getElementById('editingId').value)?.nutritionSnapshots?.find(x=>x?.name===name&&x.unit===selection.unit);if(previous)return {...previous,amount:Number(selection.count)};const food=FoodLibraryManager.library.find(x=>x.ad===name);return food?FoodNutrients.snapshot(food,selection.count):null;}).filter(Boolean) };
}

// Create a single independent entry without copying unrelated form fields.
function buildIndependentEntry(kind, form, choices, id) {
    if (!form || !choices || !form.dateStr || !form.time || !Number.isFinite(form.timestamp)) throw new Error('Geçerli bir tarih ve saat seçiniz');
    const base = { id, dateStr: form.dateStr, time: form.time, timestamp: form.timestamp };
    if (kind === 'glucose') {
        const value = Number(form.glucoseVal);
        if (!Number.isFinite(value) || value <= 0 || !choices.category) throw new Error('Kan şekeri ve ölçüm türünü seçiniz');
        return { ...base, val: value, glucoseVal: value, category: choices.category };
    }
    if (kind === 'pressure') {
        const sys = Number(form.bpSys), dia = Number(form.bpDia), pulse = form.bpPulse === '' ? null : Number(form.bpPulse);
        if (!Number.isFinite(sys) || sys <= 0 || !Number.isFinite(dia) || dia <= 0 || (pulse !== null && (!Number.isFinite(pulse) || pulse <= 0))) throw new Error('Geçerli tansiyon değerleri giriniz');
        return { ...base, type: 'pressure', sys, dia, pulse, bpSys: sys, bpDia: dia, bpPulse: pulse };
    }
    if (kind === 'nutrition') {
        if (!Array.isArray(form.diets) || !form.diets.length) throw new Error('Yemek veya içecek seçiniz');
        return { ...base, type: 'nutrition_only', diets: form.diets.slice(), nutritionSnapshots:Array.isArray(form.nutritionSnapshots)?form.nutritionSnapshots:[] };
    }
    if (kind === 'activity') {
        const duration = Number(form.actDuration);
        if (!choices.activity || !Number.isFinite(duration) || duration <= 0 || !choices.mood) throw new Error('Aktivite, süre ve hissiyat seçiniz');
        return { ...base, type: 'activity', name: choices.activity, duration, goal: form.actGoal, mood: choices.mood, actName: choices.activity, actDuration: duration, actGoal: form.actGoal, actMood: choices.mood };
    }
    if (kind === 'symptom') {
        if (!Array.isArray(form.symptoms) || !form.symptoms.length) throw new Error('Belirti seçiniz');
        return { ...base, type: 'symptom_only', symptoms: form.symptoms.slice(), symptomSeverities: {...(form.symptomSeverities||{})} };
    }
    if (kind === 'medication') {
        if (typeof form.drugs !== 'string' || !form.drugs.trim()) throw new Error('İlaç seçiniz');
        return { ...base, type: 'medication_only', drugs: form.drugs };
    }
    throw new Error('Bilinmeyen kayıt türü');
}

function saveIndependentEntry(kind, medicationScope = null) {
    if (document.body.classList.contains('edit-mode-active')) return;
    const english = window.GLKOAITestLanguage?.currentLang === 'en';
    let entry;
    try {
        const form = getFormData(medicationScope);
        if (mainCurrentView === 'measurements' || mainCurrentView === 'lifestyle') {
            const now = new Date();
            form.dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
            form.time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            form.timestamp = now.getTime();
            if (kind === 'medication' && form.drugs) form.drugs = form.drugs.replace(/\[\d{2}:\d{2}\]/g, `[${form.time}]`);
        }
        let id = Date.now();
        while (DataManager.getItem(id)) id++;
        entry = buildIndependentEntry(kind, form, { category: selectedCategory, activity: selectedActivity, mood: selectedActivityMood }, id);
        if (kind === 'glucose' && entry.category === 'pre_meal') entry.postMealReminderAt = entry.timestamp + 2 * 60 * 60 * 1000;
    } catch (error) {
        showToast(english ? 'Check the required fields for this entry.' : error.message, 'error');
        return;
    }
    const previous = DataManager.getAll().slice();
    try { DataManager.addOrUpdate(entry); }
    catch (error) {
        DataManager._data = previous;
        showToast(english ? 'Could not save the entry.' : 'Kayıt kaydedilemedi.', 'error');
        return;
    }
    try {
        if (kind === 'glucose') {
            document.getElementById('glucoseValue').value = '';
            selectedCategory = '';
            document.querySelectorAll('.cat-btn').forEach(button => { button.classList.remove('btn-active-cat', 'border-blue-500', 'bg-blue-900/20'); button.classList.add('border-slate-600', 'bg-slate-800'); });
            document.getElementById('alarmSection')?.classList.add('hidden');
        } else if (kind === 'pressure') {
            ['bpSys', 'bpDia', 'bpPulse'].forEach(id => { const field = document.getElementById(id); if (field) field.value = ''; });
        } else if (kind === 'nutrition') {
            try {
                Object.keys(FoodLibraryManager.selectedFoods).forEach(name => { const food = FoodLibraryManager.library.find(item => item.ad === name); if (food && FoodLibraryManager.selectedFoods[name].count > 0) food.freq = (Number(food.freq) || 0) + 1; });
                FoodLibraryManager.saveLib();
            } catch (error) { console.error('Food frequency could not be saved:', error); }
            FoodLibraryManager.selectedFoods = {};
            FoodLibraryManager.closePanel();
            FoodLibraryManager.renderGrid();
        } else if (kind === 'activity') {
            selectedActivity = ''; selectedActivityMood = '';
            const duration = document.getElementById('actDuration'); if (duration) duration.value = '';
            document.querySelectorAll('.act-btn').forEach(button => { button.classList.remove('btn-active-act', 'border-[#edb015]', 'bg-[#edb015]/20'); button.classList.add('bg-slate-800', 'border-slate-600'); });
            applyActivityMoodSelection('');
        } else if (kind === 'symptom') {
            document.querySelectorAll('.sym-btn.btn-active-sym').forEach(button => toggleTag(button, 'sym', false));
        } else if (kind === 'medication') {
            const selectedScope=medicationScope==='glucose'?'.glucose-med-btn.active':medicationScope==='pressure'?'.bp-med-btn.active':'.med-btn.btn-active-med, .glucose-med-btn.active, .bp-med-btn.active, .nutrition-med-btn.active';
            document.querySelectorAll(selectedScope).forEach(button => setMedicationSelection(button.dataset.name, false));
        }
        renderList(); updateHeaderStats(); updateHeaderDots(); updateSaveButtonVisibility(); schedulePostMealReminder();
    } catch (error) { console.error('Saved entry refresh failed:', error); }
    showToast(entry.postMealReminderAt ? (english ? 'Saved. Reminder in 2 hours.' : 'Kaydedildi. 2 saat sonra hatırlatma.') : (english ? 'Saved.' : 'Kaydedildi.'), 'success');
    if (kind === 'nutrition') showNutritionMedicationHint();
}

const reminderCategories = {
    glucose: { color: '#2dd4bf', tr: 'Kan şekeri ölçümü', en: 'Blood glucose measurement' },
    pressure: { color: '#fb7185', tr: 'Tansiyon ölçümü', en: 'Blood pressure measurement' },
    nutrition: { color: '#fb923c', tr: 'Yemek', en: 'Meal' },
    water: { color: '#22d3ee', tr: 'Su içme', en: 'Drink water' },
    activity: { color: '#facc15', tr: 'Aktivite', en: 'Activity' },
    symptom: { color: '#c6a34a', tr: 'Hissiyat / belirti', en: 'Feeling / symptom' },
    medication: { color: '#a78bfa', tr: 'İlaç', en: 'Medication' }
};
function reminderCategoryColor(category) { return reminderCategories[category]?.color || ''; }
function reminderLabel(item) { const info = reminderCategories[item.category]; return item.defaultCategoryLabel && info ? (window.GLKOAITestLanguage?.currentLang === 'en' ? info.en : info.tr) : item.label; }
function initSectionReminderButtons() {
    const targets = [['glucoseDetails','glucose'], ['bpDetails','pressure'], ['nutDetails','nutrition'], ['activityDetails','activity'], ['statusDetails','symptom']];
    targets.forEach(([id, category]) => {
        const section = document.getElementById(id), summary = section?.querySelector(':scope > summary');
        if (!summary || section.querySelector(':scope > .section-reminder-bell')) return;
        const button = document.createElement('button'); button.type = 'button'; button.className = 'section-reminder-bell';
        button.style.setProperty('--reminder-color', reminderCategoryColor(category));
        button.dataset.testTitleTr = `${reminderCategories[category].tr} hatırlatması ekle`; button.dataset.testTitleEn = `Add ${reminderCategories[category].en.toLowerCase()} reminder`;
        const english = window.GLKOAITestLanguage?.currentLang === 'en'; button.title = english ? button.dataset.testTitleEn : button.dataset.testTitleTr; button.setAttribute('aria-label', button.title);
        button.innerHTML = '<i class="ph-bold ph-bell-ringing" aria-hidden="true"></i>'; button.addEventListener('click', () => openSectionReminder(category));
        section.classList.add('has-section-reminder'); summary.after(button);
    });
    const nutrition = document.getElementById('nutDetails');
    const foodTitle = document.getElementById('foodSelectHeading');
    if (foodTitle && !nutrition.querySelector('.section-water-bell')) {
        const heading = document.createElement('div'); heading.className = 'section-water-heading'; foodTitle.before(heading); heading.appendChild(foodTitle);
        const button = document.createElement('button'); button.type = 'button'; button.className = 'section-reminder-bell section-water-bell'; button.style.setProperty('--reminder-color', reminderCategoryColor('water'));
        button.dataset.testTitleTr = 'Su hatırlatması ekle'; button.dataset.testTitleEn = 'Add water reminder'; button.title = window.GLKOAITestLanguage?.currentLang === 'en' ? button.dataset.testTitleEn : button.dataset.testTitleTr; button.setAttribute('aria-label', button.title);
        button.innerHTML = '<i class="ph-bold ph-bell-ringing" aria-hidden="true"></i>'; button.addEventListener('click', () => openSectionReminder('water')); heading.appendChild(button);
    }
    const med = document.getElementById('nutritionMedsSection');
    if (med && !med.querySelector('.section-medication-bell')) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'section-reminder-bell section-medication-bell'; button.style.setProperty('--reminder-color', reminderCategoryColor('medication'));
        button.dataset.testTitleTr = 'İlaç hatırlatması ekle'; button.dataset.testTitleEn = 'Add medication reminder'; button.title = window.GLKOAITestLanguage?.currentLang === 'en' ? button.dataset.testTitleEn : button.dataset.testTitleTr; button.setAttribute('aria-label', button.title);
        button.innerHTML = '<i class="ph-bold ph-bell-ringing" aria-hidden="true"></i>'; button.addEventListener('click', () => openSectionReminder('medication')); med.classList.add('has-section-reminder'); med.prepend(button);
    }
}
function setReminderScheduleChoice(id, value) {
    if (!['once', 'repeat'].includes(value)) return;
    const field = document.getElementById(id);
    if (!field) return;
    field.value = value;
    if (id === 'sectionReminderType') updateSectionReminderFields();
    else if (id === 'reminderScheduleType') updateReminderFormType();
}
function updateSectionReminderFields() {
    const repeat = document.getElementById('sectionReminderType').value === 'repeat';
    document.getElementById('sectionReminderOnce').hidden = repeat; document.getElementById('sectionReminderRepeat').hidden = !repeat;
}
let sectionReminderCategory = '';
function openSectionReminder(category) {
    if (!reminderCategories[category]) return;
    sectionReminderCategory = category;
    const english = window.GLKOAITestLanguage?.currentLang === 'en';
    const info = reminderCategories[category];
    const form = document.getElementById('sectionReminderForm'); form.reset(); document.getElementById('sectionReminderType').value = 'once'; updateSectionReminderFields();
    document.getElementById('sectionReminderTitle').textContent = english ? `${info.en} reminder` : `${info.tr} hatırlatması`;
    document.getElementById('sectionReminderName').value = category === 'activity' && selectedActivity ? selectedActivity : (english ? info.en : info.tr);
    const at = new Date(Date.now() + 3600000), pad = n => String(n).padStart(2,'0');
    document.getElementById('sectionReminderDate').value = `${at.getFullYear()}-${pad(at.getMonth()+1)}-${pad(at.getDate())}T${pad(at.getHours())}:${pad(at.getMinutes())}`;
    document.getElementById('sectionReminderTime').value = `${pad(at.getHours())}:${pad(at.getMinutes())}`;
    const dialog = document.getElementById('sectionReminderDialog'); dialog.style.setProperty('--reminder-color', info.color); dialog.showModal();
}
function saveSectionReminder(form) {
    const english = window.GLKOAITestLanguage?.currentLang === 'en', category = sectionReminderCategory;
    if (!reminderCategories[category]) return;
    const label = document.getElementById('sectionReminderName').value.trim();
    if (!label) { showToast(english ? 'Enter a reminder name.' : 'Hatırlatma adını girin.', 'warn'); return; }
    let id = Date.now(); while (AssistantManager.data.some(item => item.id === id)) id++;
    let item;
    if (document.getElementById('sectionReminderType').value === 'repeat') {
        const time = document.getElementById('sectionReminderTime').value;
        const days = Array.from(form.querySelectorAll('input[name="sectionReminderDay"]:checked')).map(input => Number(input.value));
        const match = /^(\d{2}):(\d{2})$/.exec(time);
        if (!match || Number(match[1]) > 23 || Number(match[2]) > 59 || !days.length) { showToast(english ? 'Select a time and at least one day.' : 'Saat ve en az bir gün seçin.', 'warn'); return; }
        item = { id, type: 'alarm', time, label, category, active: true, days };
    } else {
        const raw = document.getElementById('sectionReminderDate').value, dueAt = raw ? new Date(raw).getTime() : NaN;
        if (!Number.isFinite(dueAt) || dueAt <= Date.now()) { showToast(english ? 'Choose a future date and time.' : 'Gelecekte bir tarih ve saat seçin.', 'warn'); return; }
        item = { id, type: 'one_time', label, category, dueAt, dismissed: false };
    }
    const info = reminderCategories[category]; item.defaultCategoryLabel = label === (english ? info.en : info.tr);
    const previous = AssistantManager.data.slice(); AssistantManager.data.push(item);
    try { AssistantManager.save(); } catch (_) { AssistantManager.data = previous; showToast(english ? 'Could not save reminder.' : 'Hatırlatma kaydedilemedi.', 'error'); return; }
    document.getElementById('sectionReminderDialog').close();
    try { AssistantManager.render(); schedulePostMealReminder(); } catch (error) { console.error('Reminder saved but refresh failed:', error); }
    showToast(english ? 'Reminder saved.' : 'Hatırlatma kaydedildi.', 'success');
}
document.addEventListener('DOMContentLoaded', initSectionReminderButtons, { once: true });

let postMealReminderTimer = null;
const notifiedPostMealReminderIds = new Set();
function hasDuePostMealReminder(now = Date.now()) {
    return DataManager.getAll().some(item => item && Number.isFinite(item.postMealReminderAt) && item.postMealReminderAt <= now && !item.postMealReminderDismissed);
}
function enableReminderSwipe(card, canDismiss, dismiss) {
    let startX = null, startY = null, pointerId = null, dragging = false;
    const reset = () => { card.classList.remove('is-dragging'); card.style.transform = ''; startX = null; startY = null; pointerId = null; dragging = false; };
    card.addEventListener('pointerdown', event => {
        if (event.button !== undefined && event.button !== 0) return;
        if (event.target.closest?.('button, input, select, textarea, [contenteditable="true"]')) return;
        startX = event.clientX; startY = event.clientY; pointerId = event.pointerId;
        try { card.setPointerCapture(pointerId); } catch (_) {}
    });
    card.addEventListener('pointermove', event => {
        if (startX === null || event.pointerId !== pointerId) return;
        const dx = event.clientX - startX, dy = event.clientY - startY;
        if (!dragging && Math.abs(dx) < 6) return;
        if (!dragging && Math.abs(dy) > Math.abs(dx)) { reset(); return; }
        dragging = true; card.classList.add('is-dragging');
        const distance = canDismiss() ? dx : Math.max(-60, Math.min(60, dx * 0.4));
        card.style.transform = `translateX(${distance}px)`;
    });
    card.addEventListener('pointerup', event => {
        if (startX === null || event.pointerId !== pointerId) return;
        const dx = event.clientX - startX;
        const shouldDismiss = dragging && Math.abs(dx) >= 60 && canDismiss();
        card.classList.remove('is-dragging');
        if (shouldDismiss) { card.style.transform = `translateX(${dx > 0 ? '110%' : '-110%'})`; setTimeout(() => { if (canDismiss()) dismiss(); else reset(); }, 220); }
        else reset();
        startX = null; startY = null; pointerId = null; dragging = false;
    });
    card.addEventListener('pointercancel', reset);
    card.addEventListener('lostpointercapture', () => { if (startX !== null) reset(); });
}
function nextRecurringOccurrence(item, after) {
    if (!item || item.active === false || !Array.isArray(item.days) || !item.days.length || !/^\d{2}:\d{2}$/.test(item.time || '')) return null;
    const [hour, minute] = item.time.split(':').map(Number);
    if (hour > 23 || minute > 59) return null;
    const first = new Date(after); first.setHours(0, 0, 0, 0);
    for (let offset = 0; offset <= 7; offset++) {
        const candidate = new Date(first); candidate.setDate(first.getDate() + offset); candidate.setHours(hour, minute, 0, 0);
        if (candidate.getHours() === hour && candidate.getMinutes() === minute && item.days.includes(candidate.getDay()) && candidate.getTime() > after) return candidate.getTime();
    }
    return null;
}
function validNoteTimestamp(value) { return Number.isFinite(value) && Number.isFinite(new Date(value).getTime()); }
function noteReminderExpired(item, now) {
    return item.durationType === 'timed' && Number.isFinite(item.notifyAt) && Number.isFinite(item.durationMinutes) && now >= item.notifyAt + item.durationMinutes * 60000;
}
function schedulePostMealReminder() {
    if (postMealReminderTimer) clearTimeout(postMealReminderTimer);
    const now = Date.now();
    const reminders = DataManager.getAll().filter(item => item && Number.isFinite(item.postMealReminderAt) && !item.postMealReminderDismissed).map(item => ({ source: 'measurement', item, dueAt: item.postMealReminderAt }));
    let recurringChanged = false, catchUpPending = false;
    const changed = [];
    const recurring = AssistantManager.data.filter(item => item.type === 'alarm' && item.active !== false);
    recurring.forEach(item => {
        const previous = { item, nextOccurrenceAt: item.nextOccurrenceAt, pendingOccurrences: item.pendingOccurrences };
        let next = item.nextOccurrenceAt;
        if (!Number.isFinite(next)) next = nextRecurringOccurrence(item, now);
        const pending = Array.isArray(item.pendingOccurrences) ? item.pendingOccurrences.filter(Number.isFinite) : [];
        let steps = 0;
        while (Number.isFinite(next) && next <= now && steps < 366) {
            if (!pending.includes(next)) pending.push(next);
            const following = nextRecurringOccurrence(item, next);
            if (following === null || following <= next) { next = null; break; }
            next = following; steps++;
        }
        if (Number.isFinite(next) && next <= now) catchUpPending = true;
        if (next !== item.nextOccurrenceAt || pending.length !== (item.pendingOccurrences?.length || 0)) {
            changed.push(previous); item.nextOccurrenceAt = next; item.pendingOccurrences = pending; recurringChanged = true;
        }
    });
    if (recurringChanged) {
        try { AssistantManager.save(); }
        catch (_) {
            changed.forEach(old => { if (old.nextOccurrenceAt === undefined) delete old.item.nextOccurrenceAt; else old.item.nextOccurrenceAt = old.nextOccurrenceAt; if (old.pendingOccurrences === undefined) delete old.item.pendingOccurrences; else old.item.pendingOccurrences = old.pendingOccurrences; });
            showToast(window.GLKOAITestLanguage?.currentLang === 'en' ? 'Could not schedule reminders.' : 'Hatırlatmalar planlanamadı.', 'error');
        }
    }
    recurring.forEach(item => {
        (Array.isArray(item.pendingOccurrences) ? item.pendingOccurrences : []).filter(Number.isFinite).forEach(dueAt => reminders.push({ source: 'recurring', item, dueAt }));
        if (Number.isFinite(item.nextOccurrenceAt) && !(Array.isArray(item.pendingOccurrences) && item.pendingOccurrences.includes(item.nextOccurrenceAt))) reminders.push({ source: 'recurring', item, dueAt: item.nextOccurrenceAt });
    });
    AssistantManager.data.filter(item => item.type === 'one_time' && Number.isFinite(item.dueAt) && !item.dismissed).forEach(item => reminders.push({ source: 'one_time', item, dueAt: item.dueAt }));
    AssistantManager.data.filter(item => item.type === 'note' && item.notify && validNoteTimestamp(item.notifyAt) && !item.notificationDismissed).forEach(item => reminders.push({ source: 'note', item, dueAt: item.notifyAt }));
    reminders.sort((a, b) => {
        const aDue = a.source === 'note' ? noteReminderExpired(a.item, now) : a.dueAt <= now, bDue = b.source === 'note' ? noteReminderExpired(b.item, now) : b.dueAt <= now;
        if (aDue !== bDue) return aDue ? 1 : -1;
        return aDue ? b.dueAt - a.dueAt : a.dueAt - b.dueAt;
    });
    const english = window.GLKOAITestLanguage?.currentLang === 'en';
    const near = reminders.filter(reminder => reminder.dueAt <= now + 24 * 60 * 60 * 1000);
    const badge = document.getElementById('reminderBellBadge');
    const bell = document.getElementById('btnReminderBell');
    if (badge) { badge.hidden = near.length === 0; badge.textContent = near.length > 99 ? '99+' : String(near.length); badge.classList.toggle('is-due', near.some(reminder => reminder.source === 'note' ? noteReminderExpired(reminder.item, now) : reminder.dueAt <= now)); }
    if (bell) bell.setAttribute('aria-label', english ? `Reminders, ${near.length} due or within 24 hours` : `Hatırlatıcılar, zamanı gelen veya 24 saat içindeki ${near.length} hatırlatma`);
    const list = document.getElementById('homeReminderList');
    if (!list) return;
    list.replaceChildren();
    const endToday = new Date(now); endToday.setHours(23, 59, 59, 999);
    const visibleReminders = reminders.filter(reminder => (reminder.source !== 'note' || reminder.dueAt <= now) && (reminder.item.category !== 'activity' || reminder.dueAt <= endToday.getTime()));
    list.hidden = visibleReminders.length === 0;
    list.style.display = mainCurrentView === 'home' && visibleReminders.length ? '' : 'none';
    let dueToastShown = false;
    visibleReminders.forEach(reminder => {
        const { item, dueAt, source } = reminder;
        const arrived = dueAt <= now;
        const due = source === 'note' ? noteReminderExpired(item, now) : arrived;
        const remaining = Math.max(0, Math.ceil((dueAt - now) / 60000));
        const at = new Date(dueAt);
        const time = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
        const isToday = at.toDateString() === new Date(now).toDateString();
        const when = isToday ? time : `${new Intl.DateTimeFormat(english ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'short' }).format(at)} ${time}`;
        const card = document.createElement('div');
        card.className = `home-reminder-card${due ? ' is-due' : ''}`;
        const categoryColor = source === 'note' ? '#a78bfa' : reminderCategoryColor(source === 'measurement' ? 'glucose' : item.category); if (categoryColor) card.style.setProperty('--reminder-color', categoryColor);
        const icon = document.createElement('i'); icon.className = 'ph-bold ph-bell-ringing home-reminder-icon'; icon.setAttribute('aria-hidden', 'true');
        const body = document.createElement('div'); body.className = 'home-reminder-body';
        const label = document.createElement('div'); label.className = `home-reminder-title${source === 'note' ? ' note-reminder-title' : ''}`; label.textContent = source === 'note' ? item.text : source === 'measurement' ? (english ? 'Post-meal glucose measurement' : 'Yemek sonrası kan şekeri ölçümü') : (['Yeni Hatırlatma', 'Sabah İlacı'].includes(item.label) ? (window.GLKOAITestLanguage?.translate(item.label) || item.label) : reminderLabel(item));
        const status = document.createElement('div'); status.className = 'home-reminder-status';
        const duration = remaining >= 60 ? `${Math.floor(remaining / 60)} ${english ? 'h' : 'sa'} ${String(remaining % 60).padStart(2, '0')} ${english ? 'min' : 'dk'}` : `${String(remaining).padStart(2, '0')} ${english ? 'min' : 'dk'}`;
        status.textContent = source === 'note' ? (due ? (english ? `Expired: ${when}` : `${when} · Süresi doldu`) : (english ? `Note reminder · ${when}` : `Not bildirimi · ${when}`)) : due ? (english ? `Due: ${when}` : `${when} · Zamanı geldi`) : (english ? `${when} · ${duration} remaining` : `${when} · ${duration} kaldı`);
        body.appendChild(label);
        if (due) {
            const warning = document.createElement('div'); warning.className = 'home-reminder-overdue-label';
            const warningIcon = document.createElement('i'); warningIcon.className = 'ph-bold ph-warning-circle'; warningIcon.setAttribute('aria-hidden', 'true');
            const warningText = document.createElement('span'); warningText.textContent = english ? 'Overdue' : 'Süresi geçti';
            warning.append(warningIcon, warningText); body.appendChild(warning);
        }
        body.appendChild(status); card.append(icon, body);
        const dismiss = () => {
                if (Date.now() < dueAt) return;
                if (source === 'note') {
                    const current = AssistantManager.data.find(value => value.type === 'note' && value.id === item.id);
                    if (!current || current.notifyAt !== dueAt || current.notificationDismissed) { schedulePostMealReminder(); return; }
                    const previous = current.notificationDismissed; current.notificationDismissed = true;
                    try { AssistantManager.save(); } catch (_) { current.notificationDismissed = previous; showToast(english ? 'Could not dismiss reminder.' : 'Bildirim kapatılamadı.', 'error'); return; }
                    schedulePostMealReminder(); return;
                }
                if (source === 'recurring') {
                    const current = AssistantManager.data.find(value => value.type === 'alarm' && value.id === item.id);
                    if (!current || !Array.isArray(current.pendingOccurrences) || !current.pendingOccurrences.includes(dueAt)) { schedulePostMealReminder(); return; }
                    const previous = current.pendingOccurrences;
                    current.pendingOccurrences = previous.filter(value => value !== dueAt);
                    try { AssistantManager.save(); } catch (_) { current.pendingOccurrences = previous; showToast(english ? 'Could not dismiss reminder.' : 'Hatırlatma kapatılamadı.', 'error'); return; }
                    schedulePostMealReminder(); return;
                }
                if (source === 'one_time') {
                    const current = AssistantManager.data.find(value => value.type === 'one_time' && value.id === item.id);
                    if (!current || current.dueAt !== dueAt) { schedulePostMealReminder(); return; }
                    const oldValue = current.dismissed; current.dismissed = true;
                    try { AssistantManager.save(); } catch (_) { current.dismissed = oldValue; showToast(english ? 'Could not dismiss reminder.' : 'Hatırlatma kapatılamadı.', 'error'); return; }
                    schedulePostMealReminder(); return;
                }
                const current = DataManager.getItem(item.id);
                if (!current || current.postMealReminderAt !== dueAt) { schedulePostMealReminder(); return; }
                const previous = DataManager.getAll().slice();
                try { DataManager.addOrUpdate({ ...current, postMealReminderDismissed: true }); } catch (_) { DataManager._data = previous; showToast(english ? 'Could not dismiss reminder.' : 'Hatırlatma kapatılamadı.', 'error'); return; }
                schedulePostMealReminder();
            };
        enableReminderSwipe(card, () => Date.now() >= dueAt, dismiss);
        if (due || (source === 'note' && arrived)) {
            const button = document.createElement('button'); button.type = 'button'; button.className = 'home-reminder-dismiss'; button.textContent = source === 'note' ? (english ? 'Read' : 'Okudum') : (english ? 'Dismiss' : 'Kapat'); button.addEventListener('click', dismiss); card.appendChild(button);
            const notificationKey = `${source}:${item.id}:${dueAt}`;
            if (!notifiedPostMealReminderIds.has(notificationKey)) { notifiedPostMealReminderIds.add(notificationKey); if (!dueToastShown) { dueToastShown = true; showToast(source !== 'measurement' ? (english ? 'Reminder is due.' : 'Hatırlatmanın zamanı geldi.') : (english ? 'Post-meal glucose reminder is due.' : 'Yemek sonrası ölçüm hatırlatmasının zamanı geldi.'), 'warn'); } }
        }
        list.appendChild(card);
    });
    const transitionTimes = reminders.flatMap(reminder => {
        const result = reminder.dueAt > now ? [reminder.dueAt] : [];
        if (reminder.source === 'note' && reminder.item.durationType === 'timed' && Number.isFinite(reminder.item.durationMinutes)) { const end = reminder.dueAt + reminder.item.durationMinutes * 60000; if (end > now) result.push(end); }
        return result;
    });
    const nextTransition = transitionTimes.length ? Math.min(...transitionTimes) : null;
    if (catchUpPending) postMealReminderTimer = setTimeout(schedulePostMealReminder, 1000);
    else if (nextTransition !== null) postMealReminderTimer = setTimeout(schedulePostMealReminder, Math.min(nextTransition - now + 20, 60000));
    renderOneTimeReminders();
    syncRecurringReminderDueStyles();
}

function updateReminderFormType() {
    const repeating = document.getElementById('reminderScheduleType')?.value === 'repeat';
    const single = document.getElementById('singleReminderFields');
    const recurring = document.getElementById('recurringReminderFields');
    if (single) single.hidden = repeating;
    if (recurring) recurring.hidden = !repeating;
}
function syncRecurringReminderDueStyles() {
    const container = document.getElementById('reminderCardsArea');
    if (!container) return;
    const english = window.GLKOAITestLanguage?.currentLang === 'en';
    container.querySelectorAll('[data-reminder-alarm-id]').forEach(card => {
        const item = AssistantManager.data.find(entry => entry.type === 'alarm' && String(entry.id) === card.dataset.reminderAlarmId);
        const pending = item?.active === false ? 0 : (Array.isArray(item?.pendingOccurrences) ? item.pendingOccurrences.filter(value => Number.isFinite(value) && value <= Date.now()).length : 0);
        const overdue = pending > 0 || (item?.active !== false && Number.isFinite(item?.nextOccurrenceAt) && item.nextOccurrenceAt <= Date.now());
        card.classList.toggle('is-due', overdue);
        const badge = card.querySelector('.reminder-overdue-count');
        if (badge) { badge.hidden = !overdue; badge.textContent = english ? `Overdue: ${pending || 1}` : `Süresi geçen: ${pending || 1}`; }
    });
}
function refreshReminderEmptyState() {
    const empty = document.getElementById('reminderListEmpty');
    if (!empty) return;
    const hasMeasurement = DataManager.getAll().some(item => item && Number.isFinite(item.postMealReminderAt));
    const hasManual = AssistantManager.data.some(item => item && (item.type === 'one_time' || item.type === 'alarm' || (item.type === 'note' && item.notify && validNoteTimestamp(item.notifyAt))));
    empty.hidden = hasMeasurement || hasManual;
}
function renderOneTimeReminders(force = false) {
    const container = document.getElementById('oneTimeRemindersArea');
    if (!container || (!force && container.querySelector('.reminder-editing'))) return;
    const english = window.GLKOAITestLanguage?.currentLang === 'en';
    const items = DataManager.getAll().filter(item => item && Number.isFinite(item.postMealReminderAt)).map(item => ({ source: 'measurement', item, dueAt: item.postMealReminderAt }));
    AssistantManager.data.filter(item => item && item.type === 'one_time' && Number.isFinite(item.dueAt)).forEach(item => items.push({ source: 'one_time', item, dueAt: item.dueAt }));
    AssistantManager.data.filter(item => item && item.type === 'note' && item.notify && validNoteTimestamp(item.notifyAt)).forEach(item => items.push({ source: 'note', item, dueAt: item.notifyAt }));
    items.sort((a, b) => a.dueAt - b.dueAt);
    container.replaceChildren();
    items.forEach(({ source, item, dueAt }) => {
        if (source === 'note') {
            const now = Date.now(), expired = noteReminderExpired(item, now);
            const card = document.createElement('div'); card.className = `one-time-reminder${expired && !item.notificationDismissed ? ' is-due' : ''}`; card.style.setProperty('--reminder-color', '#a78bfa');
            const heading = document.createElement('div'); heading.className = 'one-time-reminder-heading';
            const label = document.createElement('span'); label.className = 'one-time-reminder-label note-reminder-title'; label.textContent = item.text;
            const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'one-time-reminder-action'; edit.setAttribute('aria-label', english ? 'Edit note' : 'Notu düzenle'); edit.innerHTML = '<i class="ph-bold ph-pencil" aria-hidden="true"></i>'; edit.addEventListener('click', () => openNoteEditor(item.id));
            const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'one-time-reminder-action'; remove.setAttribute('aria-label', english ? 'Remove reminder' : 'Bildirimi kaldır'); remove.innerHTML = '<i class="ph-bold ph-trash" aria-hidden="true"></i>';
            const removeReminder = () => {
                const current = AssistantManager.data.find(value => value.type === 'note' && value.id === item.id);
                if (!current) return;
                const previous = current.notify; current.notify = false;
                try { AssistantManager.save(); } catch (_) { current.notify = previous; showToast(english ? 'Could not remove reminder.' : 'Bildirim kaldırılamadı.', 'error'); return; }
                AssistantManager.render(); schedulePostMealReminder();
            };
            remove.addEventListener('click', () => UIEnhancer.showConfirm(english ? 'Remove the reminder? The note will be kept.' : 'Bildirim kaldırılsın mı? Not korunacak.', removeReminder));
            heading.append(label, edit, remove); card.appendChild(heading);
            const date = document.createElement('p'); date.className = 'one-time-reminder-date';
            const when = new Intl.DateTimeFormat(english ? 'en-GB' : 'tr-TR', {dateStyle:'medium', timeStyle:'short'}).format(new Date(dueAt));
            const state = item.notificationDismissed ? (english ? 'read' : 'okundu') : expired ? (english ? 'overdue' : 'süresi geçti') : dueAt <= now ? (english ? 'active' : 'gösteriliyor') : (english ? 'pending' : 'bekliyor');
            date.textContent = `${when} · ${state}`; card.appendChild(date);
            enableReminderSwipe(card, () => expired && !item.notificationDismissed, () => { card.style.transform = ''; removeReminder(); });
            container.appendChild(card); return;
        }
        const card = document.createElement('div'); card.className = 'one-time-reminder';
        const categoryColor = reminderCategoryColor(source === 'measurement' ? 'glucose' : item.category); if (categoryColor) card.style.setProperty('--reminder-color', categoryColor);
        const heading = document.createElement('div'); heading.className = 'one-time-reminder-heading';
        const label = document.createElement('span'); label.className = 'one-time-reminder-label'; label.textContent = source === 'measurement' ? (english ? 'Post-meal glucose measurement' : 'Yemek sonrası kan şekeri ölçümü') : reminderLabel(item);
        const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'one-time-reminder-action'; edit.setAttribute('aria-label', english ? 'Edit reminder' : 'Hatırlatmayı düzenle'); edit.innerHTML = '<i class="ph-bold ph-pencil" aria-hidden="true"></i>';
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'one-time-reminder-action'; remove.setAttribute('aria-label', english ? 'Delete reminder' : 'Hatırlatmayı sil'); remove.innerHTML = '<i class="ph-bold ph-trash" aria-hidden="true"></i>';
        heading.append(label, edit, remove); card.appendChild(heading);
        const at = new Date(dueAt), dismissed = source === 'measurement' ? item.postMealReminderDismissed : item.dismissed;
        if (dueAt <= Date.now()) card.classList.add('is-due');
        const display = document.createElement('p'); display.className = 'one-time-reminder-date';
        const dateText = new Intl.DateTimeFormat(english ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at);
        display.textContent = `${dateText} · ${dismissed ? (english ? 'dismissed' : 'kapatıldı') : (dueAt <= Date.now() ? (english ? 'due' : 'zamanı geldi') : (english ? 'pending' : 'bekliyor'))}`; card.appendChild(display);
        const editor = document.createElement('div'); editor.className = 'one-time-reminder-editor'; editor.hidden = true;
        let nameInput = null;
        if (source === 'one_time') { nameInput = document.createElement('input'); nameInput.type = 'text'; nameInput.maxLength = 100; nameInput.value = reminderLabel(item); nameInput.setAttribute('aria-label', english ? 'Reminder name' : 'Hatırlatma adı'); editor.appendChild(nameInput); }
        const input = document.createElement('input'); input.type = 'datetime-local'; input.setAttribute('aria-label', english ? 'Reminder date and time' : 'Hatırlatma tarihi ve saati');
        input.value = `${at.getFullYear()}-${String(at.getMonth()+1).padStart(2,'0')}-${String(at.getDate()).padStart(2,'0')}T${String(at.getHours()).padStart(2,'0')}:${String(at.getMinutes()).padStart(2,'0')}`;
        const save = document.createElement('button'); save.type = 'button'; save.textContent = english ? 'Save' : 'Kaydet';
        const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = english ? 'Cancel' : 'İptal';
        editor.append(input, save, cancel); card.appendChild(editor);
        edit.addEventListener('click', () => { card.classList.add('reminder-editing'); editor.hidden = false; (nameInput || input).focus(); });
        cancel.addEventListener('click', () => { card.classList.remove('reminder-editing'); editor.hidden = true; });
        const currentItem = () => source === 'measurement' ? DataManager.getItem(item.id) : AssistantManager.data.find(value => value.type === 'one_time' && value.id === item.id);
        const currentDue = value => source === 'measurement' ? value.postMealReminderAt : value.dueAt;
        save.addEventListener('click', () => {
            const value = new Date(input.value).getTime(), newName = nameInput ? nameInput.value.trim() : '';
            if (!input.value || !Number.isFinite(value) || (nameInput && !newName)) { showToast(english ? 'Enter a name and valid date and time.' : 'Ad ve geçerli tarih ve saat girin.', 'error'); return; }
            const current = currentItem();
            if (!current || currentDue(current) !== dueAt) { showToast(english ? 'Reminder has changed. Please review it again.' : 'Hatırlatma değişti. Lütfen tekrar kontrol edin.', 'warn'); renderOneTimeReminders(true); return; }
            if (source === 'measurement') {
                const previous = DataManager.getAll().slice();
                try { DataManager.addOrUpdate({ ...current, postMealReminderAt: value, postMealReminderDismissed: false }); }
                catch (_) { DataManager._data = previous; showToast(english ? 'Could not save reminder.' : 'Hatırlatma kaydedilemedi.', 'error'); return; }
            } else {
                const previous = AssistantManager.data.slice();
                AssistantManager.data = AssistantManager.data.map(entry => entry === current ? { ...current, label: newName, defaultCategoryLabel: current.defaultCategoryLabel && newName === reminderLabel(current), dueAt: value, dismissed: false } : entry);
                try { AssistantManager.save(); } catch (_) { AssistantManager.data = previous; showToast(english ? 'Could not save reminder.' : 'Hatırlatma kaydedilemedi.', 'error'); return; }
            }
            notifiedPostMealReminderIds.delete(`${source}:${item.id}:${dueAt}`); schedulePostMealReminder(); renderOneTimeReminders(true);
        });
        const deleteReminder = () => {
            const current = currentItem();
            if (!current || currentDue(current) !== dueAt) { renderOneTimeReminders(true); return; }
            if (source === 'measurement') {
                const updated = { ...current }; delete updated.postMealReminderAt; delete updated.postMealReminderDismissed;
                const previous = DataManager.getAll().slice();
                try { DataManager.addOrUpdate(updated); } catch (_) { DataManager._data = previous; showToast(english ? 'Could not delete reminder.' : 'Hatırlatma silinemedi.', 'error'); return; }
            } else {
                const previous = AssistantManager.data.slice(); AssistantManager.data = AssistantManager.data.filter(value => value !== current);
                try { AssistantManager.save(); } catch (_) { AssistantManager.data = previous; showToast(english ? 'Could not delete reminder.' : 'Hatırlatma silinemedi.', 'error'); return; }
            }
            notifiedPostMealReminderIds.delete(`${source}:${item.id}:${dueAt}`); schedulePostMealReminder(); renderOneTimeReminders(true);
        };
        remove.addEventListener('click', () => UIEnhancer.showConfirm(source === 'measurement' ? (english ? 'Delete this reminder? The measurement will be kept.' : 'Bu hatırlatma silinsin mi? Ölçüm kaydı korunacak.') : (english ? 'Delete this reminder?' : 'Bu hatırlatma silinsin mi?'), deleteReminder));
        enableReminderSwipe(card, () => Date.now() >= dueAt && !card.classList.contains('reminder-editing'), () => { card.style.transform = ''; deleteReminder(); });
        container.appendChild(card);
    });
    refreshReminderEmptyState();
}

function initIndependentSaveButtons() {
    const configs = [
        ['glucoseDetails', 'glucose', 'Kan şekerini kaydet', 'Save blood glucose'],
        ['bpDetails', 'pressure', 'Tansiyonu kaydet', 'Save blood pressure'],
        ['nutDetails', 'nutrition', 'Öğünü Kaydet', 'Save meal'],
        ['nutDetails', 'medication', 'Seçtiğim İlaç ve Takviyeleri Kaydet', 'Save selected medicines and supplements'],
        ['activityDetails', 'activity', 'Aktiviteyi kaydet', 'Save activity'],
        ['statusDetails', 'symptom', 'Belirtileri kaydet', 'Save symptoms']
    ];
    configs.forEach(([sectionId, kind, trText, enText]) => {
        const section = document.getElementById(sectionId);
        if (!section || section.querySelector(`[data-independent-save="${kind}"]`)) return;
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'independent-save-button';
        button.dataset.independentSave = kind;
        if(kind==='symptom') button.hidden=document.querySelectorAll('.sym-btn.btn-active-sym').length===0;
        button.dataset.testTr = trText; button.dataset.testEn = enText;
        button.textContent = window.GLKOAITestLanguage?.currentLang === 'en' ? enText : trText;
        button.addEventListener('click', () => saveIndependentEntry(kind));
        const medsContainer = document.getElementById('nutritionMedsContainer');
        const medsSection = document.getElementById('nutritionMedsSection');
        if ((kind === 'nutrition' || kind === 'medication') && medsContainer && medsContainer.parentElement) {
            button.classList.add('independent-save-inline');
            if (kind === 'nutrition' && medsSection) medsSection.before(button);
            else medsContainer.after(button);
        } else section.appendChild(button);
    });
    syncNutritionMedicationSaveVisibility();
}

let mainCurrentView = 'home';
function updateMainSectionHeading() {
    const labels = { measurements: ['ÖLÇÜMLER', 'MEASUREMENTS'], lifestyle: ['YEMEK & SPOR', 'FOOD & EXERCISE'], history: ['KAYITLAR', 'RECORDS'], reminders: ['HATIRLATICILAR', 'REMINDERS'] };
    const heading = document.getElementById('mainSectionHeading');
    const title = document.getElementById('mainSectionTitle');
    const label = labels[mainCurrentView];
    if (heading) heading.style.display = label ? 'flex' : 'none';
    if (title && label) title.textContent = label[window.GLKOAITestLanguage?.currentLang === 'en' ? 1 : 0];
}
function setMainView(view, scroll = true) {
    const valid = ['home', 'measurements', 'lifestyle', 'history', 'reminders', 'edit', 'analysis'];
    if (!valid.includes(view)) return;
    const previousView = mainCurrentView;
    if (previousView !== view) {
        const containers = {
            measurements: ['glucoseContainer', 'bpContainer', 'statusContainer'],
            lifestyle: ['nutritionContainer', 'activityContainer'],
            reminders: ['assistantContainer'],
            edit: ['glucoseContainer', 'bpContainer', 'statusContainer', 'nutritionContainer', 'activityContainer'],
            history: ['historySection']
        };
        (containers[previousView] || []).forEach(id => closeExpandedSections(document.getElementById(id)));
    }
    mainCurrentView = view;
    updateMainSectionHeading();
    const setVisible = (id, visible) => { const el = document.getElementById(id); if (el) el.style.display = visible ? '' : 'none'; };
    setVisible('todaySummary', view === 'home');
    const reminderList = document.getElementById('homeReminderList');
    if (reminderList) reminderList.style.display = view === 'home' && !reminderList.hidden ? '' : 'none';
    setVisible('inputForm', ['measurements', 'lifestyle', 'reminders', 'edit'].includes(view));
    setVisible('stickyHeader', view === 'edit');
    setVisible('glucoseContainer', view === 'measurements' || view === 'edit');
    setVisible('bpContainer', view === 'measurements' || view === 'edit');
    setVisible('statusContainer', view === 'measurements' || view === 'edit');
    setVisible('nutritionContainer', view === 'lifestyle' || view === 'edit');
    setVisible('activityContainer', view === 'lifestyle' || view === 'edit');
    setVisible('assistantContainer', view === 'reminders');
    setVisible('historySection', view === 'history');
    if (view === 'history' && previousView !== view) renderList();
    const report = document.getElementById('reportSection');
    if (report) report.classList.toggle('hidden', view !== 'analysis');
    document.querySelectorAll('[data-main-view]').forEach(button => {
        if (button.dataset.mainView === view) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
    });
    if (scroll) window.scrollTo({ top: 0, behavior: 'auto' });
}
function initMainNavigation() {
    const historyControls = document.getElementById('historyControls');
    historyControls?.addEventListener('click', event => {
        // Let the native date-range selector stay open; align after selection instead.
        if (event.target.closest('select')) return;
        requestAnimationFrame(alignHistoryControls);
    });
    document.getElementById('filterSelect')?.addEventListener('change', () => requestAnimationFrame(alignHistoryControls));
    document.querySelectorAll('[data-main-view]').forEach(button => button.addEventListener('click', () => setMainView(button.dataset.mainView)));
    const bell = document.getElementById('btnReminderBell');
    if (bell) bell.addEventListener('click', () => setMainView('reminders'));
    setMainView('home', false);
}
document.addEventListener('DOMContentLoaded', initMainNavigation, { once: true });
function syncNutritionMedicationSaveVisibility() {
    const button = document.querySelector('[data-independent-save="medication"]');
    if (!button) return;
    const meds = DataManager.getProfile()?.medications;
    const hasMeds = Array.isArray(meds) && meds.some(med => typeof med?.name === 'string' && med.name.trim());
    button.hidden = !hasMeds;
    document.getElementById('nutritionMedsSection')?.classList.toggle('hidden', !hasMeds);
}
document.addEventListener('DOMContentLoaded', initIndependentSaveButtons, { once: true });

function validateAndSave() {
    const saveBtn = document.getElementById('saveButton');
    const isEdit = document.body.classList.contains('edit-mode-active');

    if(saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> KAYDEDİLİYOR...'; }
    
    const resetBtn = () => {
        if(saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `<i class="ph-bold ph-check"></i> <span id="saveBtnText">${isEdit ? 'GÜNCELLE' : 'KAYDET'}</span>`;
        }
    };

    try {
        const f = getFormData();
        const previousEntry = f.editId ? DataManager.getItem(f.editId) : null;
        if (previousEntry && Number.isFinite(previousEntry.postMealReminderAt) && selectedCategory === 'pre_meal') {
            const sameTime = Number(previousEntry.timestamp) === Number(f.timestamp);
            f.postMealReminderAt = sameTime ? previousEntry.postMealReminderAt : f.timestamp + 2 * 60 * 60 * 1000;
            f.postMealReminderDismissed = sameTime && previousEntry.postMealReminderDismissed === true;
        }
        const updateFoodFrequency = () => {
            try {
                let changed = false;
                Object.keys(FoodLibraryManager.selectedFoods).forEach(name => {
                    if (FoodLibraryManager.selectedFoods[name].count > 0) {
                        const food = FoodLibraryManager.library.find(item => item.ad === name);
                        if (food) { food.freq = (food.freq || 0) + 1; changed = true; }
                    }
                });
                if (changed) FoodLibraryManager.saveLib();
            } catch (error) { console.error('Yemek sıklığı güncellenemedi:', error); }
        };
        // Öğünler yalnızca seçildikleri kayda yazılır; önceki öğünün kopyalanması günlük toplamı iki kez artırabilir.
        if(selectedActivity && f.actDuration) {
            if(!selectedActivityMood || selectedActivityMood.trim() === '') {
                showToast('Lütfen hissiyat seçiniz', 'warn');
                resetBtn();
                return;
            }
            DataManager.addOrUpdate({
                id: f.editId || Date.now(),
                type: 'activity',
                name: f.actName,
                duration: f.actDuration,
                goal: f.actGoal,
                mood: f.actMood,
                ...f
            });
            updateFoodFrequency();
            reload();
            return;
        }
        if(f.bpSys && f.bpDia) { DataManager.addOrUpdate({id:f.editId||Date.now(), type:'pressure', sys:f.bpSys, dia:f.bpDia, pulse:f.bpPulse, ...f}); updateFoodFrequency(); reload(); return; }
        
        if(!f.glucoseVal || isNaN(f.glucoseVal)) { 
            if(f.diets.length>0) { DataManager.addOrUpdate({id:f.editId||Date.now(), type:'nutrition_only', ...f}); updateFoodFrequency(); reload(); return; } 
            if(f.symptoms.length>0) { DataManager.addOrUpdate({id:f.editId||Date.now(), type:'symptom_only', ...f}); updateFoodFrequency(); reload(); return; }
            if(f.drugs) { DataManager.addOrUpdate({id:f.editId||Date.now(), type:'medication_only', ...f}); reload(); return; }
            showToast('Veri Giriniz', 'error'); 
            resetBtn();
            return; 
        }
        if(!selectedCategory) { 
            showToast('Kategori Seçiniz', 'warn'); 
            resetBtn();
            return; 
        }
        DataManager.addOrUpdate({id:f.editId||Date.now(), val:f.glucoseVal, category:selectedCategory, ...f});
        updateFoodFrequency();
        reload();
    } catch (e) {
        showToast('Kayıt hatası: ' + e.message, 'error');
        resetBtn();
    }
}

function reload() { 
    // OFFLINE DESTEĞİ: İnternet yoksa sayfayı yenileme, UI'ı temizle (Soft Reload)
    if (!navigator.onLine) {
        showToast('Kaydedildi (çevrimdışı).', 'success');
        
        // 1. Form Alanlarını Temizle
        const inputs = ['glucoseValue', 'bpSys', 'bpDia', 'bpPulse', 'actDuration', 'actGoal'];
        inputs.forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
        
        // 2. Kategori ve Aktivite Seçimlerini Sıfırla
        selectedCategory = '';
        selectedActivity = '';
        selectedActivityMood = '';
        document.querySelectorAll('.cat-btn, .act-btn').forEach(b => {
            b.classList.remove('btn-active-cat', 'btn-active-act', 'border-blue-500', 'bg-blue-900/20', 'border-[#edb015]', 'bg-[#edb015]/20');
            b.classList.add('border-slate-600', 'bg-slate-800');
        });
        applyActivityMoodSelection('');
        
        // 3. İlaç ve Belirti Seçimlerini Sıfırla
        document.querySelectorAll('.med-btn').forEach(b => {
            b.classList.remove('btn-active-med');
            b.classList.add('bg-slate-800');
            const baseBorder = b.dataset.baseBorder || '#334155';
            b.style.borderColor = baseBorder;
            b.style.boxShadow = 'none';
        });
        document.querySelectorAll('.glucose-med-btn, .bp-med-btn, .nutrition-med-btn').forEach(b => {
            b.classList.remove('active');
            b.classList.add('border-slate-700/50', 'bg-slate-800/40');
            b.style.borderColor = '';
            b.style.backgroundColor = '';
            b.style.boxShadow = '';
        });
        document.querySelectorAll('.sym-btn').forEach(b => {
            b.classList.remove('btn-active-sym');
            b.classList.add('text-slate-300', 'bg-slate-900', 'border-slate-700');
        });

        symptomSeveritySelection.clear(); renderSymptomSeverity();

        // 4. Yemek Seçimlerini Sıfırla
        if(typeof FoodLibraryManager !== 'undefined') {
            FoodLibraryManager.selectedFoods = {};
            FoodLibraryManager.closePanel();
            FoodLibraryManager.renderGrid();
        }

        // 5. Edit Modunu ve Panelleri Kapat
        document.body.classList.remove('edit-mode-active');
        document.getElementById('editingId').value = '';
        document.getElementById('editModeAlert').classList.add('hidden');
        document.getElementById('cancelEditBtn').classList.add('hidden');
        document.getElementById('resetBtnMain').classList.remove('hidden');
        document.querySelectorAll('details').forEach(d => d.removeAttribute('open'));
        
        // 6. Listeleri ve Grafikleri Güncelle
        renderList();
        updateHeaderStats();
        updateHeaderDots();
        updateSaveButtonVisibility();
        
        // 7. Kaydet Butonunu Normale Döndür
        const saveBtn = document.getElementById('saveButton');
        if(saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `<i class="ph-bold ph-check"></i> <span id="saveBtnText">KAYDET</span>`;
        }
        
        // Saat kontrolünü sıfırla ve saati güncelle
        isTimeManuallySet = false;
        const now = new Date();
        const tInput = document.getElementById('manualTime');
        if(tInput) tInput.value = now.toTimeString().slice(0,5);

        return;
    }

    // ONLINE İSE NORMAL YENİLEME
    // Reload öncesi tüm pending DOM operations'ı cancel et - Violation önlemek için
    if (reportAverageFontSyncTimer) clearTimeout(reportAverageFontSyncTimer);
    if (FoodLibraryManager?.searchTimer) clearTimeout(FoodLibraryManager.searchTimer);
    
    
    if (isMobile()) {
        setTimeout(() => {
            const nextUrl = new URL(window.location.href);
            nextUrl.hash = '';
            nextUrl.searchParams.set('t', String(Date.now()));
            window.location.href = nextUrl.href;
        }, 500);
    } else {
        setTimeout(() => location.reload(), 500);
    }
}

function editItem(id) {
    const item = DataManager.getItem(id); if(!item) return;
    setMainView('edit', false);
    document.body.classList.add('edit-mode-active'); document.getElementById('editingId').value=item.id;
    document.getElementById('editModeAlert').classList.remove('hidden'); document.getElementById('saveBtnText').textContent='GÜNCELLE';
    document.getElementById('cancelEditBtn').classList.remove('hidden'); document.getElementById('resetBtnMain').classList.add('hidden');
    const [d,m,y] = item.dateStr.split('.'); document.getElementById('manualDate').value=`${y}-${m}-${d}`; document.getElementById('manualTime').value=item.time;
    document.querySelectorAll('details').forEach(d=>d.open=false);
    document.querySelectorAll('[data-edit-symptom-temporary]').forEach(button => button.remove());
    document.querySelectorAll('.sym-btn.btn-active-sym').forEach(button => toggleTag(button, 'sym', false));
    if (Array.isArray(item.symptoms)) {
        item.symptoms.filter(value => typeof value === 'string' && value.trim()).forEach(value => {
            let button = Array.from(document.querySelectorAll('.sym-btn')).find(candidate => {
                const label = candidate.querySelector('span');
                return (label?.dataset.symptomOriginal || label?.textContent || '').trim() === value.trim();
            });
            if (!button) {
                const area = document.getElementById('customSymptomsArea');
                if (!area) return;
                button = document.createElement('button');
                button.type = 'button';
                button.className = 'sym-btn w-full p-2 rounded-xl border border-slate-700 bg-slate-800 text-left';
                button.setAttribute('data-edit-symptom-temporary', '');
                const label = document.createElement('span');
                label.dataset.symptomOriginal = value;
                label.textContent = value;
                button.appendChild(label);
                button.addEventListener('click', () => toggleTag(button, 'sym'));
                area.appendChild(button);
            }
            if (!button.classList.contains('btn-active-sym')) toggleTag(button, 'sym', false);
        });
    }

    symptomSeveritySelection.clear();
    if(item.symptomSeverities && typeof item.symptomSeverities === 'object') for(const [name,value] of Object.entries(item.symptomSeverities)) if((item.symptoms||[]).includes(name) && ['mild','moderate','severe'].includes(value)) symptomSeveritySelection.set(name,value);
    renderSymptomSeverity();

    // İlaç butonlarını sıfırla
    document.querySelectorAll('.med-btn').forEach(b => {
        b.classList.remove('btn-active-med');
        b.classList.add('bg-slate-800');
        const baseBorder = b.dataset.baseBorder || '#334155';
        b.style.borderColor = baseBorder;
        b.style.boxShadow = 'none';
    });
    document.querySelectorAll('.glucose-med-btn, .bp-med-btn, .nutrition-med-btn').forEach(b => {
        b.classList.remove('active');
        b.classList.add('border-slate-700/50', 'bg-slate-800/40');
        b.style.borderColor = '';
        b.style.backgroundColor = '';
        b.style.boxShadow = '';
    });

    if(item.type==='pressure') { document.getElementById('bpSys').value=item.sys; document.getElementById('bpDia').value=item.dia; document.getElementById('bpPulse').value=item.pulse||''; document.getElementById('bpDetails').open=true; }
    else if(item.type==='activity') {
        document.getElementById('activityDetails').open = true;
        const durationEl = document.getElementById('actDuration');
        if (durationEl) durationEl.value = item.duration || '';
        const goalEl = document.getElementById('actGoal');
        if (goalEl) {
            const storedGoal = (item.goal ?? item.actGoal);
            goalEl.value = (storedGoal !== undefined && storedGoal !== null) ? storedGoal : '';
        }
        renderActivityButtons();
        const moodKey = item.mood || item.actMood || '';
        setTimeout(() => {
            document.querySelectorAll('.act-btn').forEach(b => { if(b.textContent.includes(item.name)) setActivity(b, item.name); });
            if (moodKey) {
                selectedActivityMood = moodKey;
                applyActivityMoodSelection(moodKey);
            }
        }, 100);
    }
    else if(item.type==='nutrition_only') { document.getElementById('nutDetails').open=true; }
    else if(item.type==='symptom_only') { document.getElementById('statusDetails').open=true; }
    else if(item.type==='medication_only') { document.getElementById('nutDetails').open=true; }
    else { document.getElementById('glucoseDetails').open=true; document.getElementById('glucoseValue').value=item.val; handleInputTheme(item.val); setCategory(document.getElementById('btn-cat-'+item.category), item.category); }
    if(item.diets && item.diets.length > 0) { document.getElementById('nutDetails').open=true; FoodLibraryManager.loadSelectionsFromEdit(item.diets); }
    
    // Kayıtlı ilaçları geri yükle
    if (item.drugs) {
        const drugList = item.drugs.split(',').map(d => {
            const match = d.match(/^([^\(\[]+)/);
            return match ? match[1].trim() : '';
        }).filter(n => n);

        const normalizedSet = new Set();
        drugList.forEach(name => {
            const normalized = normalizeMedName(name);
            if (!normalized || normalizedSet.has(normalized)) return;
            normalizedSet.add(normalized);
            setMedicationSelection(name, true);
        });
    }

    window.scrollTo({top:0, behavior:'smooth'});
    updateSaveButtonVisibility();
}

function handleInputTheme(v) { const el=document.getElementById('glucoseValue'); const prof = DataManager.getProfile(); const mode = prof.targetMode||'std'; const t = AppConfig.TARGETS[mode]; if(v<t.min || v>t.max) el.style.color='#ef4444'; else el.style.color='#10b981'; updateSaveButtonVisibility(); }
function handleBpTheme() {
    const sysEl = document.getElementById('bpSys'); const diaEl = document.getElementById('bpDia'); const pulseEl = document.getElementById('bpPulse');
    const sys = parseInt(sysEl.value); const dia = parseInt(diaEl.value); const pulse = parseInt(pulseEl.value);
    const classList = ['bp-input-normal', 'bp-input-high', 'bp-input-low', 'bp-input-tachycardia', 'bp-input-bradycardia'];
    sysEl.classList.remove(...classList); if (sys) { if (sys > 140) sysEl.classList.add('bp-input-high'); else if (sys < 90) sysEl.classList.add('bp-input-low'); else sysEl.classList.add('bp-input-normal'); }
    diaEl.classList.remove(...classList); if (dia) { if (dia > 90) diaEl.classList.add('bp-input-high'); else if (dia < 60) diaEl.classList.add('bp-input-low'); else diaEl.classList.add('bp-input-normal'); }
    pulseEl.classList.remove(...classList); if (pulse) { if (pulse > 100) pulseEl.classList.add('bp-input-tachycardia'); else if (pulse < 50) pulseEl.classList.add('bp-input-bradycardia'); else pulseEl.classList.add('bp-input-normal'); }
    updateSaveButtonVisibility();
}

function updateCharts() {
    const fVal = document.getElementById('filterSelect').value;
    const stats = DataManager.getStats(fVal === 'all' ? 'all' : parseInt(fVal));
    setText('gmiValue', stats.glikoz.count ? `${Math.round(stats.glikoz.avg)} mg/dL (${stats.glikoz.count})` : 'Veri yok');
    setText('cvValue', stats.glikoz.cv === '-' ? '-%' : "%" + stats.glikoz.cv);
    setText('recordStatus', stats.subsetCount);
    if (stats.bp.avgSys > 0) { setText('bpAvgDisplay', `${stats.bp.avgSys}/${stats.bp.avgDia}`); setText('bpPulseDisplay', `Nabız: ${stats.bp.avgPulse}`); setText('bpLoadDisplay', `%${stats.bp.loadPercent}`); setText('bpAbnormalDisplay', `%${stats.bp.abnormalPercent}`); setText('bpPpDisplay', `${stats.bp.avgPP}`); } 
    else { setText('bpAvgDisplay', '--/--'); setText('bpPulseDisplay', 'Nabız: --'); setText('bpLoadDisplay', '-%'); setText('bpAbnormalDisplay', '-%'); setText('bpPpDisplay', '--'); }

    updateReportAverageCards();

    const ctx = document.getElementById('trendChart');
    if (ctx) {
        if (window.myChart) window.myChart.destroy();
        if(stats.chartData.gluc.length === 0 && stats.chartData.sys.length === 0) return;
        try {
            const toggleTooltip = (chart, enabled) => {
                if (!chart?.options?.plugins?.tooltip) return;
                if (chart.options.plugins.tooltip.enabled === enabled) return;
                chart.options.plugins.tooltip.enabled = enabled;
                if (!enabled && chart.tooltip) {
                    chart.tooltip.setActiveElements([], { x: 0, y: 0 });
                }
                chart.update('none');
            };

            window.myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [
                        { 
                            label: 'Glikoz', data: stats.chartData.gluc, borderColor: '#3b82f6', 
                            backgroundColor: (context) => { const ctx = context.chart.ctx; const gradient = ctx.createLinearGradient(0, 0, 0, 200); gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)'); gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)'); return gradient; },
                            borderWidth: 3, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#1e293b', pointBorderColor: '#3b82f6', pointBorderWidth: 2, fill: true, spanGaps: true
                        },
                        { label: 'Tansiyon (Sys)', data: stats.chartData.sys, borderColor: '#ef4444', borderWidth: 2, tension: 0.4, pointRadius: 3, spanGaps: true }, 
                        { label: 'Tansiyon (Dia)', data: stats.chartData.dia, borderColor: '#fca5a5', borderWidth: 2, tension: 0.4, pointRadius: 3, spanGaps: true }
                    ]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    interaction: { mode: 'nearest', axis: 'x', intersect: false }, 
                    scales: { 
                        x: { type: 'time', time: { unit: 'day', displayFormats: { day: 'dd.MM', hour: 'HH:mm' }, tooltipFormat: 'dd.MM.yyyy HH:mm' }, display: true, grid: { color: '#334155', tickLength: 5 }, ticks: { color: '#94a3b8', font: {size: 10}, maxRotation: 0, autoSkip: true } }, 
                        y: { grid: { color: '#334155', tickLength: 0 }, ticks: { color: '#94a3b8', font: {size: 10} }, beginAtZero: false } 
                    }, 
                    plugins: { 
                        legend: { display: false },
                        zoom: {
                            pan: {
                                enabled: true,
                                mode: 'x',
                                onPanStart: ({ chart }) => toggleTooltip(chart, false),
                                onPanComplete: ({ chart }) => toggleTooltip(chart, true),
                                onPanRejected: ({ chart }) => toggleTooltip(chart, true)
                            },
                            zoom: {
                                wheel: { enabled: true },
                                pinch: { enabled: true },
                                mode: 'x',
                                onZoomStart: ({ chart }) => toggleTooltip(chart, false),
                                onZoomComplete: ({ chart }) => toggleTooltip(chart, true),
                                onZoomRejected: ({ chart }) => toggleTooltip(chart, true)
                            }
                        }
                    } 
                }
            });
        } catch (err) { /* Chart error - no logging */ }
    }
}

// 9. PROFİL YÖNETİMİ
// Profil dışındaki ölçüm kayıtları ve listeler korunur.
function clearClinicalProfile() {
    const en = window.GLKOAITestLanguage?.currentLang === 'en';
    const message = en ? 'Clear the entire clinical profile? This removes wizard answers, personal details, profile medication list and targets. Measurement records and food lists remain. Export a backup first. Continue?' : 'Klinik profilin tamamı silinsin mi? Sihirbaz cevapları, kişisel bilgiler, profil ilaç listesi ve hedefler silinir. Ölçüm kayıtları ve yemek listeleri korunur. Önce veri yedeği almanız önerilir. Devam edilsin mi?';
    if (!confirm(message)) return;
    try { localStorage.removeItem('userProfile'); DataManager._profile = {}; location.reload(); }
    catch (e) { showToast(en ? 'Profile could not be cleared.' : 'Profil temizlenemedi.', 'error'); }
}

function loadProfile() {
    const p = DataManager.getProfile() || {};
    const welcome = document.getElementById('welcomeUser');
    if (welcome && p.name) welcome.textContent = p.name;
    if (p.exerciseTarget) applyExerciseTargetToActivityGoal(p.exerciseTarget);
    calcAge(false);
}

// The displayed range always comes from the profile, never an inferred clinical target.
function calcAge() {
    const target = document.getElementById('targetDisplay');
    if (!target) return;
    const profile = DataManager.getProfile() || {};
    const mode = AppConfig.TARGETS[profile.targetMode] ? profile.targetMode : 'std';
    const item = AppConfig.TARGETS[mode];
    const color = mode === 'strict' ? 'text-amber-400' : mode === 'flex' ? 'text-blue-400' : 'text-emerald-400';
    target.className = `mt-3 text-sm font-black tracking-tight bg-slate-900 px-4 py-2 rounded-xl border border-slate-700/50 shadow-inner inline-block transition-all duration-300 ${color} text-center cursor-pointer hover:scale-105 active:scale-95 select-none`;
    translateProfileReadouts();
}
function translateProfileReadouts() {
    const target = document.getElementById('targetDisplay');
    if (!target) return;
    const profile = DataManager.getProfile() || {};
    const mode = AppConfig.TARGETS[profile.targetMode] ? profile.targetMode : 'std';
    const item = AppConfig.TARGETS[mode];
    const english = window.GLKOAITestLanguage?.currentLang === 'en';
    const label = english ? ({strict:'Strict',std:'Standard',flex:'Flexible'}[mode]) : item.label;
    target.innerHTML = `${english ? 'TARGET' : 'HEDEF'}: ${item.desc} mg/dL <span class="opacity-50 text-xs block mt-0.5 font-normal">(${label})</span>`;
}

// DOKTOR RAPORUNA YENİ BÖLÜMLER EKLE
function generateDoctorReport(includeDailyLogs = true) {
    const reportLabel = value => window.GLKOAITestLanguage ? window.GLKOAITestLanguage.translate(value) : value;
    const profile = DataManager.getProfile();
    const anamnez = profile.medicalHistory || {};
    const today = new Date().toLocaleDateString('tr-TR');
    
    // Yardımcı: Değer varsa sonuna birim ekle, yoksa null dön
    const valOr = (v, suffix='') => v ? `${v}${suffix}` : null;
    
    let r = `${reportLabel("| GLKOAI | Akıllı Sağlık Asistanı ")}\n`; 
    r += `${reportLabel("DOKTOR RAPORU")}\n`;
    r += `${reportLabel("Tarih: ")}${today}\n`;
    r += `================================================\n\n`;

    // 1. GENEL BİLGİLER
    r += `${reportLabel("[ GENEL BİLGİLER ]")}\n`;
    r += `${reportLabel("Ad Soyad: ")}${profile.name || 'Belirtilmemiş'}\n`;
    
    let ageInfo = '';
    if(profile.birth) {
        const ageDifMs = Date.now() - new Date(profile.birth).getTime();
        const age = Math.abs(new Date(ageDifMs).getUTCFullYear() - 1970);
        ageInfo = ` (${age} Yaş)`;
    }
    r += `${reportLabel("Doğum Tarihi: ")}${profile.birth ? profile.birth.split('-').reverse().join('.') + ageInfo : '-'}\n`;
    r += `${reportLabel("Cinsiyet: ")}${capitalize(profile.gender) || '-'}\n`;
    
    // BMI Hesapla
    let bmi = '';
    if(profile.weight && profile.height) {
        const hM = profile.height/100;
        const bmiVal = (profile.weight / (hM*hM)).toFixed(1);
        bmi = `${bmiVal} (kg/m²)`;
    }
    
    r += `${reportLabel("Boy: ")}${valOr(profile.height, ' cm') || '-'}\n`;
    r += `${reportLabel("Kilo: ")}${valOr(profile.weight, ' kg') || '-'}\n`;
    r += `${reportLabel("Vücut Kitle İndeksi (BMI): ")}${bmi || '-'}\n`;
    r += `${reportLabel("Bel Çevresi: ")}${valOr(profile.waist, ' cm') || '-'}\n`;
    
    // BMR Mantığı: Kullanıcı girdisi varsa onu kullan, yoksa hesapla
    let bmrVal = anamnez.bmr;
    if(!bmrVal && profile.weight && profile.height && profile.birth && ['erkek','kadın'].includes(profile.gender)) {
        const ageDifMs = Date.now() - new Date(profile.birth).getTime();
        const age = Math.abs(new Date(ageDifMs).getUTCFullYear() - 1970);
        let baseBmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * age);
        bmrVal = (profile.gender === 'kadın') ? (baseBmr - 161) : (baseBmr + 5);
        bmrVal = Math.round(bmrVal);
    }
    if(bmrVal) r += `${reportLabel("Bazal Metabolizma (BMR): ")}${bmrVal} kcal\n`;
    
    if(anamnez.bodyFat) r += `${reportLabel("Vücut Yağ Oranı: ")}%${anamnez.bodyFat}\n`;
    if(anamnez.muscleMass) r += `${reportLabel("Kas Kütlesi: ")}${anamnez.muscleMass} kg\n`;
    
    const activityMap = { 'sedentary': 'Hareketsiz', 'light': 'Hafif Aktif', 'moderate': 'Orta Aktif', 'heavy': 'Çok Aktif' };
    if(profile.lifestyleType) r += `${reportLabel("Aktivite Düzeyi: ")}${activityMap[profile.lifestyleType] || profile.lifestyleType}\n`;
    
    r += `\n`;

    // 2. KLİNİK ÖZET & ANAMNEZ
    r += `${reportLabel("[ KLİNİK ÖYKÜ ]")}\n`;
    if(anamnez.anamnezMain) r += `${reportLabel("Başvuru Nedeni: ")}${anamnez.anamnezMain}\n`;
    if(profile.diabetesType) r += `${reportLabel("Diyabet Tanısı: ")}${profile.diabetesType} (Tanı: ${profile.diagYear || '?'})\n`;
    if(anamnez.hypertensionDetails?.date || anamnez.comorbHypertension) r += `${reportLabel("Hipertansiyon: Mevcut")}\n`;
    
    if(anamnez.freeText) {
        r += `\n${reportLabel("Öykü Detayı:")}\n${anamnez.freeText}\n`;
    }
    r += `\n`;

    // Sihirbaz cevapları kullanıcı beyanıdır; eski profil alanlarını değiştirmez.
    const wizardSummary = window.ClinicalProfileWizard?.reportText(profile, window.GLKOAITestLanguage?.currentLang === 'en');
    if (wizardSummary) r += `\n${window.GLKOAITestLanguage?.currentLang === 'en' ? '[ PROFILE WIZARD — USER REPORTED ]' : '[ PROFİL SİHİRBAZI — KULLANICI BEYANI ]'}\n${wizardSummary}\n\n`;

    // 3. İLAÇLAR
    if(profile.medications && profile.medications.length > 0) {
        r += `${window.GLKOAITestLanguage?.currentLang === 'en' ? '[ CURRENT MEDICINES AND SUPPLEMENTS ]' : '[ KULLANILAN İLAÇ VE TAKVİYELER ]'}\n`;
        profile.medications.forEach(m => {
            let line = `- ${m.name}`;
            if(formatMedicationStrength(m)) line += ` (${formatMedicationStrength(m)})`;
            // Kullanım nedeni çıkarımı
            const reasons = [];
            if(m.isDiabetesMed) reasons.push('Diyabet');
            if(m.isBpMed) reasons.push('Tansiyon');
            if(m.isAnticoagulantMed) reasons.push('Kan Sulandırıcı');
            if(reasons.length > 0) line += ` [${reasons.join(', ')}]`;
            r += `${line}\n`;
        });
        if(anamnez.anticoagulant?.reason) r += `${reportLabel("* Kan Sulandırıcı Nedeni: ")}${anamnez.anticoagulant.reason}\n`;
        r += `\n`;
    }

    // 4. ALIŞKANLIKLAR & YAŞAM TARZI
    const habits = [];
    if(anamnez.smoking && anamnez.smoking !== 'hic') {
        let s = `Sigara: ${anamnez.smoking}`;
        if(anamnez.smokingAmount) s += ` (${anamnez.smokingAmount} adet/gün)`;
        if(anamnez.smokingDetails?.packYears) s += ` | ${anamnez.smokingDetails.packYears} Paket-Yıl`;
        habits.push(s);
    }
    if(anamnez.alcohol && anamnez.alcohol !== 'icmiyor') {
        habits.push(`Alkol: ${anamnez.alcohol}`);
    }
    if(anamnez.sleepHours) habits.push(`Uyku: ${anamnez.sleepHours} saat/gün`);
    if(anamnez.stressLevel) habits.push(`Stres Seviyesi: ${anamnez.stressLevel}/10`);
    
    if(habits.length > 0) {
        r += `${reportLabel("[ YAŞAM TARZI & ALIŞKANLIKLAR ]")}\n`;
        r += habits.join('\n') + `\n\n`;
    }

    // 5. AİLE ÖYKÜSÜ
    const fam = [];
    if(anamnez.famDiabetes && anamnez.famDiabetes !== 'yok') fam.push(`Diyabet: ${anamnez.famDiabetes}`);
    if(anamnez.famHypertension && anamnez.famHypertension !== 'yok') fam.push(`Tansiyon: ${anamnez.famHypertension}`);
    if(anamnez.famCancer && anamnez.famCancer !== 'yok') fam.push(`Kanser: ${anamnez.famCancer}`);
    if(anamnez.familyCancer?.type) fam.push(`* Kanser Detay: ${anamnez.familyCancer.type} (${anamnez.familyCancer.relation})`);
    
    // YENİ: Detaylı Kanser Öyküsü
    if (anamnez.cancerTypes) {
        if (anamnez.cancerTypes.mother && anamnez.cancerTypes.mother.length > 0) {
            const types = anamnez.cancerTypes.mother.map(i => i.type).join(', ');
            fam.push(`Anne Tarafı Kanser: ${types}`);
        }
        if (anamnez.cancerTypes.father && anamnez.cancerTypes.father.length > 0) {
            const types = anamnez.cancerTypes.father.map(i => i.type).join(', ');
            fam.push(`Baba Tarafı Kanser: ${types}`);
        }
    }

    if(fam.length > 0) {
        r += `${reportLabel("[ AİLE ÖYKÜSÜ ]")}\n`;
        r += fam.join('\n') + `\n\n`;
    }

    // 6. KLİNİK DETAYLAR (Varsa)
    let hasClinical = false;
    let cReport = `${reportLabel("[ KLİNİK DETAYLAR ]")}\n`;
    
    // Travma
    if(anamnez.trauma && (anamnez.trauma.type || anamnez.trauma.date)) {
        hasClinical = true;
        cReport += `${reportLabel("TRAVMA: ")}${anamnez.trauma.type || 'Belirtilmemiş'} (${anamnez.trauma.date || 'Tarih yok'})\n`;
        const fracs = [];
        if(anamnez.trauma.fractures) {
            for(const [k,v] of Object.entries(anamnez.trauma.fractures)) { if(v) fracs.push(k); }
        }
        if(fracs.length) cReport += `${reportLabel("- Kırıklar: ")}${fracs.join(', ')}\n`;
        if(anamnez.trauma.implantDetails) cReport += `${reportLabel("- İmplant: ")}${anamnez.trauma.implantDetails}\n`;
        if(anamnez.trauma.disabilityRate) cReport += `${reportLabel("- Engellilik: ")}%${anamnez.trauma.disabilityRate}\n`;
        cReport += `\n`;
    }

    const labHistory = Array.isArray(anamnez.labHistory) ? [...anamnez.labHistory] : [];
    labHistory.sort((a, b) => {
        const dateDiff = (b.dateStamp || 0) - (a.dateStamp || 0);
        if (dateDiff !== 0) return dateDiff;
        return (b.createdAt || 0) - (a.createdAt || 0);
    });

    const fmtDate = (value) => {
        if (!value) return '-';
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('tr-TR');
    };

    const latestLab = labHistory[0];
    const legacyLab = anamnez.labs;
    const legacyScreenings = anamnez.screenings;
    const legacyVacc = anamnez.vaccinations;

    if (latestLab) {
        hasClinical = true;
        cReport += `${reportLabel("LABORATUVAR (")}${fmtDate(latestLab.date)})\n`;
        if (latestLab.a1c !== null && latestLab.a1c !== undefined) cReport += `- HbA1c: %${latestLab.a1c}\n`;
        if (latestLab.ldl !== null && latestLab.ldl !== undefined) cReport += `- LDL: ${latestLab.ldl}\n`;
        if (latestLab.hdl !== null && latestLab.hdl !== undefined) cReport += `- HDL: ${latestLab.hdl}\n`;
        if (latestLab.trig !== null && latestLab.trig !== undefined) cReport += `${reportLabel("- Trigliserid: ")}${latestLab.trig}\n`;
        if (latestLab.cholesterol !== null && latestLab.cholesterol !== undefined) cReport += `${reportLabel("- Kolesterol (Toplam): ")}${latestLab.cholesterol}\n`;
        if (latestLab.gfr !== null && latestLab.gfr !== undefined) cReport += `- eGFR: ${latestLab.gfr}\n`;
        if (latestLab.notes) cReport += `${reportLabel("- Not: ")}${latestLab.notes}\n`;
        if (labHistory.length > 1) cReport += `${reportLabel("- Toplam kayıt: ")}${labHistory.length}\n`;
        cReport += `\n`;

        const checkups = latestLab.checkups || {};
        if (checkups.eye || checkups.cardio || checkups.foot || checkups.dental) {
            cReport += `${reportLabel("TARAMALAR (Güncel)")}\n`;
            if (checkups.eye) cReport += `${reportLabel("- Göz: ")}${fmtDate(checkups.eye)}\n`;
            if (checkups.cardio) cReport += `${reportLabel("- Kardiyoloji: ")}${fmtDate(checkups.cardio)}\n`;
            if (checkups.foot) cReport += `${reportLabel("- Dahiliye: ")}${fmtDate(checkups.foot)}\n`;
            if (checkups.dental) cReport += `${reportLabel("- Diş: ")}${fmtDate(checkups.dental)}\n`;
            cReport += `\n`;
        }

        const vaccinations = latestLab.vaccinations || {};
        const vaccineList = [];
        if (vaccinations.flu) vaccineList.push('Grip');
        if (vaccinations.pneumonia) vaccineList.push('Pnömokok');
        if (vaccinations.tetanus) vaccineList.push('Tetanoz');
        if (vaccinations.hepb) vaccineList.push('Hepatit-B');
        if (vaccineList.length) {
            cReport += `${reportLabel("AŞILAR: ")}${vaccineList.join(', ')}\n\n`;
        }
    } else if (legacyLab && (legacyLab.a1c || legacyLab.cholesterol || legacyLab.creatinine || legacyLab.ldl || legacyLab.gfr)) {
        hasClinical = true;
        cReport += `${reportLabel("LABORATUVAR (")}${legacyLab.date || '-'})\n`;
        if (legacyLab.a1c) cReport += `- HbA1c: %${legacyLab.a1c}\n`;
        if (legacyLab.ldl) cReport += `- LDL: ${legacyLab.ldl}\n`;
        if (legacyLab.hdl) cReport += `- HDL: ${legacyLab.hdl}\n`;
        if (legacyLab.trig) cReport += `${reportLabel("- Trigliserid: ")}${legacyLab.trig}\n`;
        const legacyChol = legacyLab.cholesterol ?? legacyLab.creatinine;
        if (legacyChol) cReport += `${reportLabel("- Kolesterol (Toplam): ")}${legacyChol}\n`;
        if (legacyLab.gfr) cReport += `- eGFR: ${legacyLab.gfr}\n`;
        cReport += `\n`;
    }

    if (!latestLab && legacyScreenings && (legacyScreenings.eye || legacyScreenings.cardio || legacyScreenings.foot)) {
        hasClinical = true;
        cReport += `${reportLabel("TARAMALAR (Son Tarihler)")}\n`;
        if (legacyScreenings.eye) cReport += `${reportLabel("- Göz: ")}${legacyScreenings.eye}\n`;
        if (legacyScreenings.cardio) cReport += `${reportLabel("- Kardiyoloji: ")}${legacyScreenings.cardio}\n`;
        if (legacyScreenings.foot) cReport += `${reportLabel("- Dahiliye: ")}${legacyScreenings.foot}\n`;
        if (legacyScreenings.dental) cReport += `${reportLabel("- Diş: ")}${legacyScreenings.dental}\n`;
        cReport += `\n`;
    }

    if (!latestLab && legacyVacc) {
        const vaccines = [];
        if (legacyVacc.flu) vaccines.push('Grip');
        if (legacyVacc.pneumonia) vaccines.push('Pnömokok');
        if (legacyVacc.tetanus) vaccines.push('Tetanoz');
        if (legacyVacc.hepb) vaccines.push('Hepatit-B');
        if (vaccines.length) {
            hasClinical = true;
            cReport += `${reportLabel("AŞI DURUMU: ")}${vaccines.join(', ')}\n\n`;
        }
    }

    // Diğer
    if(anamnez.allergies) { hasClinical = true; cReport += `${reportLabel("ALERJİLER: ")}${anamnez.allergies}\n`; }
    if(anamnez.surgeryHistory) { hasClinical = true; cReport += `${reportLabel("CERRAHİ ÖYKÜ: ")}${anamnez.surgeryHistory}\n`; }
    if(anamnez.comorbidities) { hasClinical = true; cReport += `${reportLabel("EK HASTALIKLAR: ")}${anamnez.comorbidities}\n`; }

    if(hasClinical) r += cReport;

    // 7. SON 30 GÜNLÜK ORTALAMALAR (YENİ)
    const stats = DataManager.getStats(30);
    r += `------------------------------------------------\n`;
    r += `${reportLabel("SON 30 GÜNLÜK DETAYLI ANALİZ")}\n`;
    r += `${reportLabel("• Ortalama Şeker: ")}${Math.round(stats.glikoz.avg)} mg/dL\n`;
    r += stats.glikoz.count ? `${reportLabel("• Girilen glikoz ölçümleri ortalaması: ")}${Math.round(stats.glikoz.avg)} mg/dL (${stats.glikoz.count}${reportLabel(" ölçüm; laboratuvar HbA1c değildir")})\n` : '• Glikoz ölçümü: Veri yok\n';
    r += `${reportLabel("• Varyasyon (CV): ")}%${stats.glikoz.cv} (Hedef: <%36)\n`;
    r += `${reportLabel("• Toplam Kayıt: ")}${stats.subsetCount}\n`;
    
    if (stats.bp.avgSys > 0) {
        r += `\n${reportLabel("[ TANSİYON ANALİZİ ]")}\n`;
        r += `${reportLabel("• Ortalama: ")}${stats.bp.avgSys}/${stats.bp.avgDia} mmHg\n`;
        r += `${reportLabel("• Ortalama Nabız: ")}${stats.bp.avgPulse} bpm\n`;
        r += `${reportLabel("• Yüksek Tansiyon Yükü: ")}%${stats.bp.loadPercent}\n`;
        r += `${reportLabel("• Anormal Değer Oranı: ")}%${stats.bp.abnormalPercent}\n`;
        r += `${reportLabel("• Nabız Basıncı: ")}${stats.bp.avgPP} mmHg\n`;
    }
    r += `================================================\n`;

    // 8. GÜNLÜK SEYİR VE BESLENME ÖZETİ (YENİ)
    if (includeDailyLogs) {
    r += `\n${reportLabel("[ GÜNLÜK SEYİR VE BESLENME ÖZETİ (Son 30 Gün) ]")}\n`;
    
    const history = DataManager.getAll();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyGroups = {};
    
    history.forEach(h => {
        let recDate = new Date(h.timestamp);
        if (isNaN(recDate.getTime())) { const parts = h.dateStr.split('.'); recDate = new Date(parts[2], parts[1]-1, parts[0]); }
        
        if (recDate >= thirtyDaysAgo) {
            if (!dailyGroups[h.dateStr]) dailyGroups[h.dateStr] = { gluc: [], bp: [], foods: [] };
            
            if (h.val !== undefined && h.val !== null && (!h.type || (h.type !== 'pressure' && h.type !== 'activity' && h.type !== 'nutrition_only'))) {
                dailyGroups[h.dateStr].gluc.push({val: h.val, time: h.time});
            }
            if (h.type === 'pressure') {
                dailyGroups[h.dateStr].bp.push({s: parseInt(h.sys), d: parseInt(h.dia), p: h.pulse, time: h.time});
            }
            if (h.diets && h.diets.length > 0) dailyGroups[h.dateStr].foods.push(...h.diets);
        }
    });

    const sortedDates = Object.keys(dailyGroups).sort((a,b) => {
        const da = a.split('.').reverse().join('-');
        const db = b.split('.').reverse().join('-');
        return new Date(db) - new Date(da);
    });

    sortedDates.forEach(date => {
        const d = dailyGroups[date];
        if (d.gluc.length === 0 && d.bp.length === 0 && d.foods.length === 0) return;

        r += `\n--- ${date} ---\n`;
        
        // Zaman sıralaması
        d.gluc.sort((a,b) => a.time.localeCompare(b.time));
        d.bp.sort((a,b) => a.time.localeCompare(b.time));

        if (d.gluc.length > 0) {
            const glucStr = d.gluc.map(g => {
                const isAbnormal = g.val < 70 || g.val > 180;
                return `${g.val} (${g.time})${isAbnormal ? ' (!)' : ''}`;
            }).join(', ');
            r += `${reportLabel("• Şeker: ")}${glucStr}\n`;
        }
        if (d.bp.length > 0) {
            const bpStr = d.bp.map(b => {
                const isAbnormal = b.s > 140 || b.d > 90;
                const pStr = b.p ? ` Nbz:${b.p}` : '';
                return `${b.s}/${b.d}${pStr} (${b.time})${isAbnormal ? ' (!)' : ''}`;
            }).join(', ');
            r += `${reportLabel("• Tansiyon: ")}${bpStr}\n`;
        }
        if (d.foods.length > 0) {
            let dailyCal = computeDailyNutritionTotals([{ diets: d.foods }]).calories;
            const cleanFoods = d.foods.map(f => displayFoodRecord(f).replace(/\s*\(.*?\)/g, '').trim()).filter(f => f);
            const uniqueFoods = [...new Set(cleanFoods)];
            if (uniqueFoods.length > 0) { const incomplete = computeDailyNutritionTotals([{ diets: d.foods }]).unknownCalories; r += `${reportLabel("• Beslenme Toplam Kalori : ")}${Math.round(dailyCal)}${incomplete ? (window.GLKOAITestLanguage?.currentLang === 'en' ? ' (incomplete: calories unknown)' : ' (eksik: kalori bilgisi yok)') : ''} - ${uniqueFoods.join(', ')}\n`; }
        }
    });
    }

    return r;
}

// YENİ: PDF İNDİRME FONKSİYONU
async function downloadDoctorReportPDF() {
    const report = generateDoctorReport();
    
    if (typeof pdfMake === 'undefined') {
        showToast('PDF modülü yüklenemedi. İnternet bağlantınızı kontrol edin.', 'error');
        return;
    }
    
    showToast('Rapor hazırlanıyor, lütfen bekleyin...', 'info');

    // Grafik yakalama hazırlığı
    const reportSection = document.getElementById('reportSection');
    const wasHidden = reportSection.classList.contains('hidden');
    let chartDataUrl = null;

    if (wasHidden) {
        // Görünür yap ama ekran dışına al (Kullanıcı görmesin ama çizilsin)
        reportSection.style.position = 'absolute';
        reportSection.style.left = '-9999px';
        reportSection.style.width = '600px'; // Sabit genişlik ver ki grafik düzgün çizilsin
        reportSection.classList.remove('hidden');
        
        // Grafiği çizdir
        updateCharts();
        // Render için kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const canvas = document.getElementById('trendChart');
    if (canvas) {
        chartDataUrl = canvas.toDataURL('image/png');
    }

    // Eski haline getir
    if (wasHidden) {
        reportSection.classList.add('hidden');
        reportSection.style.position = '';
        reportSection.style.left = '';
        reportSection.style.width = '';
    }

    const splitKey = "\n[ GÜNLÜK SEYİR VE BESLENME ÖZETİ (Son 30 Gün) ]\n";
    const parts = report.split(splitKey);
    
    const docContent = [];
    
    // 1. Bölüm: Genel Bilgiler ve İstatistikler
    if(parts.length > 0) docContent.push({ text: parts[0], fontSize: 10, preserveLeadingSpaces: true });

    if (chartDataUrl) {
        docContent.push({ text: '\nGRAFİK ANALİZİ (Son 30 Gün)', style: 'header', fontSize: 12, bold: true, margin: [0, 10, 0, 5] });
        docContent.push({ image: chartDataUrl, width: 500 });
        docContent.push({ 
            text: 'Grafik Açıklaması:\n• Mavi Alan: Kan Şekeri (mg/dL)\n• Kırmızı Çizgi: Büyük Tansiyon (Sistolik)\n• Pembe Çizgi: Küçük Tansiyon (Diastolik)', 
            fontSize: 9, 
            color: '#555',
            margin: [0, 5, 0, 10]
        });
    }
    
    // 2. Bölüm: Günlük Seyir Listesi (Grafikten Sonra)
    if(parts.length > 1) {
        docContent.push({ text: splitKey + parts[1], fontSize: 10, preserveLeadingSpaces: true });
    }

    const docDefinition = {
        content: docContent,
        styles: {
            header: {
                fontSize: 18,
                bold: true
            }
        }
    };

    pdfMake.createPdf(docDefinition).download(`Doktor_Raporu_${new Date().toLocaleDateString('tr-TR')}.pdf`);
    showToast('PDF Raporu İndiriliyor...', 'success');
}

// 10. MODAL İŞLEMLERİ
// Ürün gücü kutudaki değer; kullanım miktarı ayrı bir bilgidir.
function formatMedicationStrength(m) {
    const text=String(m?.strengthText||'').trim();
    return text || (m?.dose ? String(m.dose).trim()+' mg' : '');
}
function normalizeMedicationStrength(value) {
    const raw=String(value||'').trim();
    if(!raw)return {strengthText:'',dose:''};
    const strengthText=/^[0-9]+(?:[.,][0-9]+)?(?:\s*\/\s*[0-9]+(?:[.,][0-9]+)?)*$/.test(raw)?raw+' mg':raw;
    const match=strengthText.match(/^([0-9]+(?:[.,][0-9]+)?(?:\s*\/\s*[0-9]+(?:[.,][0-9]+)?)*)\s*mg$/i);
    return {strengthText,dose:match?match[1].replace(/\s/g,''):''};
}
function escapeMedicationText(value) { return String(value||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function syncProfileProductToWizard(profile,product) {
    if(!product?.wizardSourceId)return;
    const entry=profile.clinicalWizard?.topics?.medications?.entries?.find(item=>item.id===product.wizardSourceId);
    if(!entry)return;
    entry.answers={...(entry.answers||{}),name:product.name,strength:formatMedicationStrength(product)};
    entry.updatedAt=new Date().toISOString();
}
function openMedModal(med = null, isFromDiabetes = false, isFromBp = false, isFromAnticoagulant = false, isFromOther = false) {
    editingMedName = '';
    const originalNameInput = document.getElementById('medOriginalName');
    if (originalNameInput) originalNameInput.value = '';
    
    // Diyabet ilacı olup olmadığını takip et
    const isDiabetesInput = document.getElementById('medIsDiabetes');
    if (isDiabetesInput) {
        isDiabetesInput.value = med ? (med.isDiabetesMed || false) : isFromDiabetes;
    }

    // Tansiyon ilacı olup olmadığını takip et
    const isBpInput = document.getElementById('medIsBp');
    if (isBpInput) {
        isBpInput.value = med ? (med.isBpMed || false) : isFromBp;
    }

    // Antikoagülan ilacı olup olmadığını takip et
    const isAnticoagulantInput = document.getElementById('medIsAnticoagulant');
    if (isAnticoagulantInput) {
        isAnticoagulantInput.value = med ? (med.isAnticoagulantMed || false) : isFromAnticoagulant;
    }

    // Diğer ilaç olup olmadığını takip et
    const isOtherInput = document.getElementById('medIsOther');
    if (isOtherInput) {
        isOtherInput.value = med ? (med.isOtherMed || false) : isFromOther;
    }

    const normalButtons = document.getElementById('medButtonsNormal');
    const editButtons = document.getElementById('medButtonsEdit');
    
    if (med) {
        // Düzenleme modu
        document.getElementById('medInputName').value = med.name;
        document.getElementById('medInputDose').value = formatMedicationStrength(med);
        document.getElementById('medInputColor').value = med.color || '';
        editingMedName = med.name;
        if (originalNameInput) originalNameInput.value = med.name;
        
        // Renk seçicisini ayarla
        selectMedColor(med.color || '#3b82f6');
        
        document.getElementById('medModalTitle').textContent = 'İlacı Düzenle';
        if(normalButtons) normalButtons.classList.add('hidden');
        if(editButtons) editButtons.classList.remove('hidden');
    } else {
        // Yeni ekleme modu
        document.getElementById('medInputName').value = '';
        document.getElementById('medInputDose').value = '';
        document.getElementById('medInputColor').value = '';
        selectMedColor('#3b82f6'); // Varsayılan renk
        document.getElementById('medModalTitle').textContent = 'İlaç Ekle';
        if(normalButtons) normalButtons.classList.remove('hidden');
        if(editButtons) editButtons.classList.add('hidden');
    }
    
    const m = document.getElementById('medicationModal');
    if(m) {
        m.style.display = 'flex';
        setTimeout(() => document.getElementById('medInputName').focus(), 100);
    }
}

function saveMed() {
  const originalName = editingMedName;
  const name = document.getElementById('medInputName').value.trim();
  const strength = normalizeMedicationStrength(document.getElementById('medInputDose').value);
  const dose = strength.dose;
  
  // DEĞİŞTİRİLDİ: medInputColor elementinin varlığını kontrol et
  const medInputColorEl = document.getElementById('medInputColor');
  let color = selectedMedColor || getMedColor(name); // Varsayılan
  
  if (medInputColorEl && medInputColorEl.value) {
    color = medInputColorEl.value;
  }
  
  const isDiabetesMed = document.getElementById('medIsDiabetes')?.value === 'true';
  const isBpMed = document.getElementById('medIsBp')?.value === 'true';
  const isAnticoagulantMed = document.getElementById('medIsAnticoagulant')?.value === 'true';
  const isOtherMed = document.getElementById('medIsOther')?.value === 'true';
  
  if (!name) {
    showToast('İlaç adı boş olamaz', 'warn');
    return;
  }
  if (name.includes(',')) {
    showToast(window.GLKOAITestLanguage?.currentLang === 'en' ? 'Do not use commas in product names.' : 'Ürün adında virgül kullanmayın.', 'warn');
    return;
  }
  
  const p = DataManager.getProfile();
  if (!p.medications) p.medications = [];
  
  // Normalize edilmiş isimleri al
  const normalizedNewName = normalizeMedName(name);
  const normalizedOriginalName = originalName ? normalizeMedName(originalName) : '';
  
  if (originalName && normalizedOriginalName) {
    // DÜZENLEME MODU
    // Eski ilacı bul (normalize edilmiş isimle)
    const oldIndex = p.medications.findIndex(m => 
      m.name && normalizeMedName(m.name) === normalizedOriginalName
    );
    
    if (oldIndex > -1) {
      // Yeni isimle başka bir ilaç var mı? (kendisi hariç)
      const existingIndex = p.medications.findIndex((m, idx) => 
        idx !== oldIndex && m.name && normalizeMedName(m.name) === normalizedNewName
      );
      
      if (existingIndex > -1) {
        showToast('Bu isimde başka bir ilaç zaten var', 'error');
        return;
      }
      
      // İlacı güncelle
      p.medications[oldIndex] = { 
        ...p.medications[oldIndex],
        name, 
        ...strength, 
        color,
        isDiabetesMed,
        isBpMed,
        isAnticoagulantMed,
        isOtherMed,
        // Benzersiz alias listesi oluştur
        aliases: [...new Set([
            ...(p.medications[oldIndex].aliases || []), 
            originalName, 
            name, 
            normalizeMedName(originalName), 
            normalizeMedName(name)
        ].filter(a => a && a.trim()))]
      };
      
      syncProfileProductToWizard(p,p.medications[oldIndex]);
      showToast(`"${originalName}" ilacı güncellendi`, 'success');
    } else {
      showToast('Düzenlenecek ilaç bulunamadı', 'error');
      return;
    }
  } else {
    // YENİ EKLEME MODU
    // Aynı normalizasyona sahip ilaç var mı?
    const existingIndex = p.medications.findIndex(m => 
      m.name && normalizeMedName(m.name) === normalizedNewName
    );
    
    if (existingIndex > -1) {
      const previousStrength=formatMedicationStrength(p.medications[existingIndex]);
      if(previousStrength && strength.strengthText && previousStrength.replace(/\s/g,'').toLocaleLowerCase('tr')!==strength.strengthText.replace(/\s/g,'').toLocaleLowerCase('tr')) { showToast(window.GLKOAITestLanguage?.currentLang === 'en' ? 'A product with this name and a different strength exists. Use a distinct name.' : 'Bu adla farklı güçte ürün var. Ayırt edici bir ad kullanın.', 'warn'); return; }
      // Aynı ürünün seçilen kategorilerini birleştir.
      p.medications[existingIndex] = { ...p.medications[existingIndex], name, ...strength, color, isDiabetesMed: p.medications[existingIndex].isDiabetesMed || isDiabetesMed, isBpMed: p.medications[existingIndex].isBpMed || isBpMed, isAnticoagulantMed: p.medications[existingIndex].isAnticoagulantMed || isAnticoagulantMed, isOtherMed: p.medications[existingIndex].isOtherMed || isOtherMed };
      syncProfileProductToWizard(p,p.medications[existingIndex]);
      showToast('İlaç güncellendi', 'success');
    } else {
      // Yeni ilaç ekle
      p.medications.push({ name, ...strength, color, isDiabetesMed, isBpMed, isAnticoagulantMed, isOtherMed });
      showToast('İlaç eklendi', 'success');
    }
  }
  
  DataManager.saveProfile(p);
  renderMainPageMeds();
  renderProfileMeds();
  renderProfileBpMeds();
  renderProfileAnticoagulantMeds();
  renderProfileOtherMeds();
  closeModal('medicationModal');
  
  // Geçmiş kayıtları yeniden render et (renkler güncellenecek)
  setTimeout(() => {
    renderList();
    updateHeaderDots();
  }, 100);
}

function deleteMed() {
    if (!editingMedName) return;
    
    UIEnhancer.showConfirm(`"${editingMedName}" ürününü profil listesinden ve sihirbazdan kaldırmak istiyor musunuz? Önceki alım kayıtları korunur.`, () => {
        const p = DataManager.getProfile();
        if (!p.medications) return;
        
        // Ürünün profil ve sihirbaz kaydını kaldır; geçmiş alım kayıtları korunur.
        const removed=p.medications.filter(m => normalizeMedName(m.name) === normalizeMedName(editingMedName));
        const sourceIds=new Set(removed.map(m=>m.wizardSourceId).filter(Boolean));
        p.medications = p.medications.filter(m => normalizeMedName(m.name) !== normalizeMedName(editingMedName));
        const wizardMeds=p.clinicalWizard?.topics?.medications;
        if(wizardMeds?.entries)wizardMeds.entries=wizardMeds.entries.filter(entry=>!sourceIds.has(entry.id));
        DataManager.saveProfile(p);
        renderMainPageMeds();
        renderProfileMeds();
        renderProfileBpMeds();
        renderProfileAnticoagulantMeds();
        renderProfileOtherMeds();
        closeModal('medicationModal');
        showToast('İlaç silindi', 'success');
    });
}

// İlaç renklerini düzenlemek için yeni fonksiyonlar
function openMedColorEditor() {
    const profile = DataManager.getProfile();
    const meds = profile.medications || [];
    
    let editorHtml = `
        <div id="medColorEditor" class="fixed inset-0 bg-black/90 flex items-center justify-center z-[130] p-4">
            <div class="bg-slate-800 border border-blue-500/50 p-6 rounded-3xl max-w-md w-full max-h-[80vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-black text-white">İlaç Renklerini Düzenle</h3>
                    <button onclick="closeModal('medColorEditor')" class="text-slate-400 hover:text-white">
                        <i class="ph-bold ph-x text-xl"></i>
                    </button>
                </div>
                <div class="space-y-3">
    `;
    
    meds.forEach((med, index) => {
        const currentColor = getMedColor(med.name); // stringToColor yerine getMedColor
        editorHtml += `
            <div class="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl">
                <div class="flex-1">
                    <div class="text-sm font-bold text-white">${med.name}</div>
                    ${formatMedicationStrength(med) ? `<div class="text-xs text-slate-400">${escapeMedicationText(formatMedicationStrength(med))}</div>` : ''}
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full border border-white/20" style="background-color: ${currentColor};" id="medColor-${index}"></div>
                    <select onchange="updateMedColor(${index}, this.value)" class="bg-slate-900 text-white text-xs p-1 rounded border border-slate-700">
                        <option value="" ${!med.color ? 'selected' : ''}>Otomatik</option>
                        <option value="#10b981" ${med.color === '#10b981' ? 'selected' : ''}>Yeşil</option>
                        <option value="#ef4444" ${med.color === '#ef4444' ? 'selected' : ''}>Kırmızı</option>
                        <option value="#eab308" ${med.color === '#eab308' ? 'selected' : ''}>Sarı</option>
                        <option value="#3b82f6" ${med.color === '#3b82f6' ? 'selected' : ''}>Mavi</option>
                        <option value="#8b5cf6" ${med.color === '#8b5cf6' ? 'selected' : ''}>Mor</option>
                        <option value="#d946ef" ${med.color === '#d946ef' ? 'selected' : ''}>Pembe</option>
                        <option value="#f97316" ${med.color === '#f97316' ? 'selected' : ''}>Turuncu</option>
                        <option value="#06b6d4" ${med.color === '#06b6d4' ? 'selected' : ''}>Camgöbeği</option>
                        <option value="#84cc16" ${med.color === '#84cc16' ? 'selected' : ''}>Açık Yeşil</option>
                    </select>
                </div>
            </div>
        `;
    });
    
    editorHtml += `
                </div>
                <div class="mt-6 flex gap-2">
                    <button onclick="closeModal('medColorEditor')" class="flex-1 py-3 rounded-xl border border-slate-600 text-slate-300 font-bold hover:bg-slate-700">Kapat</button>
                    <button onclick="resetAllMedColors()" class="flex-1 py-3 rounded-xl border border-orange-600 text-orange-300 font-bold hover:bg-orange-900/20">Otomatik Yap</button>
                </div>
            </div>
        </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = editorHtml;
    document.body.appendChild(container);
}

// Güncellenmiş updateMedColor fonksiyonu (mobil uyumlu)
function updateMedColor(index, color) {
    try {
        const profile = safeGetProfile();
        if (profile.medications && profile.medications[index]) {
            profile.medications[index].color = color;
            safeSaveProfile(profile);
            
            // Mobilde hemen render yap
            if (isMobile()) {
                // Renk önizlemesini güncelle
                const preview = document.getElementById(`medColor-${index}`);
                if (preview) {
                    preview.style.backgroundColor = color || getMedColor(profile.medications[index].name);
                }
                
                // Tüm sayfayı güncelle
                renderMainPageMeds();
                renderList();
                updateHeaderDots();
                updateCharts();
                
                // Kullanıcıya geri bildirim
                showToast('İlaç rengi güncellendi', 'success');
            } else {
                // PC'de normal güncelleme
                renderMainPageMeds();
                
                // Renk önizlemesini güncelle
                const preview = document.getElementById(`medColor-${index}`);
                if (preview) {
                    preview.style.backgroundColor = color || getMedColor(profile.medications[index].name);
                }
            }
        }
    } catch (error) {
        showToast('Renk güncellenirken hata oluştu', 'error');
    }
}

function resetAllMedColors() {
    const profile = DataManager.getProfile();
    if (profile.medications) {
        profile.medications.forEach(med => {
            delete med.color;
        });
        DataManager.saveProfile(profile);
        renderMainPageMeds();
        closeModal('medColorEditor');
        showToast('Tüm ilaç renkleri sıfırlandı', 'success');
    }
}

// Renk seçme fonksiyonu
function selectMedColor(color, btnEl = null) {
    selectedMedColor = color;
    const preview = document.getElementById('selectedColorPreview');
    const hexLabel = document.getElementById('selectedColorHex');
    const colorInput = document.getElementById('medInputColor');
    
    if(preview) preview.style.backgroundColor = color;
    if(hexLabel) hexLabel.textContent = color;
    if(colorInput) {
        colorInput.value = color;
    }
    
    // Tüm renk butonlarından border'ı kaldır
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('border-white', 'scale-110');
        btn.classList.add('border-transparent');
    });
    
    // Eğer buton elemanı gönderildiyse onu vurgula
    if (btnEl) {
        btnEl.classList.remove('border-transparent');
        btnEl.classList.add('border-white', 'scale-110');
    }
}

function openSymptomModal() {
    document.getElementById('symptomModal').style.display = 'flex';
    document.getElementById('newSymptomInput').focus();
    
}
function saveCustomSymptom() {
    const input = document.getElementById('newSymptomInput'); const val = input.value.trim(); if (!val) return;
    let list = safeParseStorage('customSymptoms', []); if(!list.includes(val)) { list.push(val); localStorage.setItem('customSymptoms', JSON.stringify(list)); }
    renderCustomSymptoms(); input.value = ''; closeModal('symptomModal');
}

function renderCustomSymptoms() {
    const container = document.getElementById('customSymptomsArea'); if (!container) return; container.innerHTML = ''; 
    const list = safeParseStorage('customSymptoms', []);
    list.forEach(text => {
        const btn = document.createElement('button');
        btn.className = 'sym-btn w-full group p-2 rounded-xl border border-slate-700 bg-slate-800 transition flex flex-row items-center justify-start gap-3 hover:bg-slate-700 select-none touch-none';

        const icon = document.createElement('i');
        icon.className = 'ph-fill ph-star text-2xl text-[#c1a981] group-hover:scale-110 transition shrink-0 pointer-events-none';
        btn.appendChild(icon);

        const label = document.createElement('span');
        label.className = 'text-xs font-bold text-slate-300 pointer-events-none';
        label.textContent = text;
        btn.appendChild(label);

        let pressTimer;
        const startPress = (e) => { if (e.type === 'mousedown' && e.button !== 0) return; btn.style.transform = "scale(0.95)"; pressTimer = setTimeout(() => { if (navigator.vibrate) navigator.vibrate(50); 
            UIEnhancer.showConfirm(`"${text}" silinsin mi?`, () => { const newList = list.filter(i => i !== text); localStorage.setItem('customSymptoms', JSON.stringify(newList)); renderCustomSymptoms(); showToast('Belirti silindi', 'success'); });
            btn.style.transform = "scale(1)"; }, 800); };
        const cancelPress = () => { clearTimeout(pressTimer); btn.style.transform = "scale(1)"; };
        btn.addEventListener('pointerdown', startPress); btn.addEventListener('pointerup', cancelPress); btn.addEventListener('pointerleave', cancelPress);
        btn.onclick = function() { toggleTag(this, 'sym'); }; container.appendChild(btn);
    });
}

function renderMainPageMeds() {
    const medsListDiv = document.getElementById('medsList');
    if (!medsListDiv) return;
    
    medsListDiv.innerHTML = '';
    const profile = DataManager.getProfile();
    const meds = profile.medications || [];
    const history = DataManager.getAll();
    const todayStr = new Date().toLocaleDateString('tr-TR');
    const section = document.getElementById('medsSection');
    
    if(section && meds.length > 0) {
        section.classList.remove('hidden');
    } else if(section) {
        section.classList.add('hidden');
    }
    
    meds.forEach((m, index) => {
        // Hassas ilaç eşleştirme (Normalize edilmiş tam isim kontrolü)
        const lastLog = history.find(h => {
            if (!h.drugs) return false;
            const normalizedTarget = normalizeMedName(m.name);
            return h.drugs.split(',').some(raw => {
                const cleanName = raw.replace(/\s*\(.*?\)/g, '').replace(/\s*\[.*?\]/g, '').trim();
                return normalizeMedName(cleanName) === normalizedTarget;
            });
        });
        
        let isTakenToday = false, lastTakenLabel = "Henüz yok", badgeHtml = '';
        
        if (lastLog) {
            if (lastLog.dateStr === todayStr) {
                isTakenToday = true;
                lastTakenLabel = `Bugün ${lastLog.time}`;
                badgeHtml = `<div class="med-status-badge med-taken"><i class="ph-bold ph-check"></i></div>`;
            } else {
                const yest = new Date(Date.now() - 86400000).toLocaleDateString('tr-TR');
                lastTakenLabel = (lastLog.dateStr === yest) ? "Dün alındı" : lastLog.dateStr;
            }
        }
        
        const borderClass = isTakenToday ? 'border-emerald-500/30' : 'border-slate-700';
        const color = m.color || getMedColor(m.name);
        
        const btn = document.createElement('button');
        btn.className = `med-btn group p-2 rounded-xl border ${borderClass} bg-slate-800 transition flex flex-col items-center gap-1 select-none touch-none relative`;
        btn.innerHTML = `
            ${badgeHtml}
            <i class="ph-fill ph-pill text-2xl group-hover:scale-110 transition pointer-events-none"
               style="color: ${isTakenToday ? '#34d399' : color}"></i>
            <div class="flex flex-col items-center leading-none pointer-events-none w-full">
                <span class="text-[9px] font-bold ${isTakenToday ? 'text-emerald-100' : 'text-slate-300'} text-center break-words w-full">
                    ${m.name}
                </span>
                ${formatMedicationStrength(m) ? `<span class="text-[8px] text-slate-500 font-medium mt-0.5">${escapeMedicationText(formatMedicationStrength(m))}</span>` : ''}
                <span class="last-taken-text text-[8px] text-slate-600 mt-1">${lastTakenLabel}</span>
            </div>
        `;
        
        // Sadece tıklama efekti (basınca küçülme)
        btn.addEventListener('pointerdown', () => btn.style.transform = "scale(0.95)");
        btn.addEventListener('pointerup', () => btn.style.transform = "scale(1)");
        btn.addEventListener('pointerleave', () => btn.style.transform = "scale(1)");
        
        btn.dataset.name = m.name;
        btn.dataset.dose = m.dose || '';
        btn.dataset.strength = formatMedicationStrength(m);
        btn.dataset.color = color;
        btn.dataset.baseBorder = isTakenToday ? 'rgba(16, 185, 129, 0.3)' : '#334155';

        btn.onclick = function() {
            if(this.style.transform === "scale(0.95)") return;
            const shouldActivate = !this.classList.contains('btn-active-med');
            setMedicationSelection(m.name, shouldActivate);
        };
        medsListDiv.appendChild(btn);
    });
    
    updateHeaderDots();
    renderGlucoseEntryMeds(); // Glikoz ekranındaki ilaçları da güncelle
    renderBpEntryMeds(); // Tansiyon ekranındaki ilaçları güncelle
    renderNutritionMeds(); // Beslenme ekranındaki ilaçları güncelle
    renderActivityButtons(); // Aktiviteleri yükle
}

function syncMeasurementMedicationAction(container,scope,hasMeds) {
    if(!container)return;
    const id=scope==='glucose'?'glucoseMedicationSave':'pressureMedicationSave';
    let wrapper=document.getElementById(id);
    if(!wrapper){
        wrapper=document.createElement('div');wrapper.id=id;wrapper.className='measurement-medication-action w-full';
        const note=document.createElement('p');note.className='measurement-medication-note';
        note.dataset.testTr='Aldığınız ilacı seçip ilaç alımını ayrıca kaydedin.';
        note.dataset.testEn='Select the medicine you took and save it separately.';
        note.textContent=window.GLKOAITestLanguage?.currentLang==='en'?note.dataset.testEn:note.dataset.testTr;
        const button=document.createElement('button');button.type='button';button.className='independent-save-button independent-save-inline';
        button.dataset.independentSave='medication-'+scope;
        button.dataset.testTr='SEÇTİĞİM İLACI KAYDET';button.dataset.testEn='SAVE SELECTED MEDICINE';
        button.textContent=window.GLKOAITestLanguage?.currentLang==='en'?button.dataset.testEn:button.dataset.testTr;
        button.addEventListener('click',()=>saveIndependentEntry('medication',scope));wrapper.append(note,button);container.after(wrapper);
    }
    wrapper.hidden=!hasMeds;
}

function renderGlucoseEntryMeds() {
    const container = document.getElementById('glucoseMedsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    const profile = DataManager.getProfile();
    // Sadece Diyabet bölümünden eklenen ilaçları filtrele
    const diabetesMeds = (profile.medications || []).filter(m => m.isDiabetesMed === true || m.isGlucoseMed === true);
    
    syncMeasurementMedicationAction(container, 'glucose', diabetesMeds.length > 0);
    if (diabetesMeds.length === 0) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    
    diabetesMeds.forEach(m => {
        const color = m.color || getMedColor(m.name);
        const btn = document.createElement('button');
        btn.className = 'glucose-med-btn w-full flex items-center gap-3 bg-slate-800/40 p-2 rounded-xl border border-slate-700/50 hover:border-emerald-500/30 transition-all text-left group';
        btn.dataset.name = m.name;
        btn.dataset.dose = m.dose || '';
        btn.dataset.strength = formatMedicationStrength(m);
        btn.dataset.color = color;
        btn.onclick = function() { toggleGlucoseMed(this); };
        
        btn.innerHTML = `
            <div class="w-1.5 h-8 rounded-full shrink-0 transition-all" style="background-color: ${color}; box-shadow: 0 0 8px ${color}40"></div>
            <div class="flex flex-col leading-tight">
                <span class="text-[11px] font-bold text-white">${escapeMedicationText(m.name)}</span>
                ${formatMedicationStrength(m) ? `<span class="text-[9px] text-slate-500 font-medium">${escapeMedicationText(formatMedicationStrength(m))}</span>` : ''}
            </div>
        `;
        container.appendChild(btn);
    });
}

function renderBpEntryMeds() {
    const container = document.getElementById('bpMedsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    const profile = DataManager.getProfile();
    // Sadece Tansiyon bölümünden eklenen ilaçları filtrele
    const bpMeds = (profile.medications || []).filter(m => m.isBpMed === true);
    
    syncMeasurementMedicationAction(container, 'pressure', bpMeds.length > 0);
    if (bpMeds.length === 0) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    
    bpMeds.forEach(m => {
        const color = m.color || getMedColor(m.name);
        const btn = document.createElement('button');
        btn.className = 'bp-med-btn w-full flex items-center gap-3 bg-slate-800/40 p-2 rounded-xl border border-slate-700/50 hover:border-rose-500/30 transition-all text-left group';
        btn.dataset.name = m.name;
        btn.dataset.dose = m.dose || '';
        btn.dataset.strength = formatMedicationStrength(m);
        btn.dataset.color = color;
        btn.onclick = function() { toggleBpMed(this); };
        
        btn.innerHTML = `
            <div class="w-1.5 h-8 rounded-full shrink-0 transition-all" style="background-color: ${color}; box-shadow: 0 0 8px ${color}40"></div>
            <div class="flex flex-col leading-tight">
                <span class="text-[11px] font-bold text-white">${escapeMedicationText(m.name)}</span>
                ${formatMedicationStrength(m) ? `<span class="text-[9px] text-slate-500 font-medium">${escapeMedicationText(formatMedicationStrength(m))}</span>` : ''}
            </div>
        `;
        container.appendChild(btn);
    });
}

let nutritionMedicationHintTimer = null;
function showNutritionMedicationHint() {
    const container = document.getElementById('nutritionMedsContainer');
    const hint = document.getElementById('nutritionMedicationHint');
    if (!hint || !container?.querySelector('.nutrition-med-btn')) return;
    const details = document.getElementById('nutritionMedsDetails'); if (details) details.open = true;
    if (nutritionMedicationHintTimer) clearTimeout(nutritionMedicationHintTimer);
    hint.hidden = false;
    hint.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    nutritionMedicationHintTimer = setTimeout(() => { hint.hidden = true; nutritionMedicationHintTimer = null; }, 10000);
}

function renderNutritionMeds() {
    const container = document.getElementById('nutritionMedsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    const profile = DataManager.getProfile();
    const userMeds = profile.medications || [];
    syncNutritionMedicationSaveVisibility();

    if (userMeds.length === 0) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    container.className = 'flex flex-wrap gap-2 mt-4 pt-2 border-t border-slate-700/30 mb-3';
    const hintBox = document.createElement('div');
    hintBox.id = 'nutritionMedicationHint';
    hintBox.hidden = true;
    hintBox.setAttribute('role', 'status');
    hintBox.className = 'nutrition-med-reminder w-full flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 mb-1';
    const hintIcon = document.createElement('i');
    hintIcon.className = 'ph-fill ph-info text-amber-400 text-lg shrink-0';
    hintIcon.setAttribute('aria-hidden', 'true');
    const hint = document.createElement('p');
    hint.className = 'text-xs text-amber-100 font-semibold leading-relaxed';
    hint.dataset.testTr = 'Bu öğünle ilişkili aldığınız ilaç ve takviyeleri seçin.';
    hint.dataset.testEn = 'Select medicines and supplements taken with this meal.';
    hint.textContent = window.GLKOAITestLanguage?.currentLang === 'en' ? hint.dataset.testEn : hint.dataset.testTr;
    hintBox.append(hintIcon, hint);
    container.appendChild(hintBox);
    
    userMeds.forEach(med => {
        if (!med || !med.name) return;
        
        const displayName = med.name;
        const color = med.color || getMedColor(displayName);

        const btn = document.createElement('button');
        btn.className = 'nutrition-med-btn flex-1 min-w-[22%] flex items-center gap-2 bg-slate-800/40 p-2 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-all text-left group';
        btn.dataset.name = displayName;
        btn.dataset.dose = med.dose || '';
        btn.dataset.strength = formatMedicationStrength(med);
        btn.dataset.color = color;
        btn.onclick = function() { toggleNutritionMed(this); };
        
        btn.innerHTML = `
            <div class="w-1.5 h-6 rounded-full shrink-0 transition-all" style="background-color: ${color}; box-shadow: 0 0 8px ${color}40"></div>
            <div class="flex flex-col leading-tight">
                <span class="text-[10px] font-bold text-white">${escapeMedicationText(displayName)}</span>
                ${formatMedicationStrength(med) ? `<span class="text-[9px] text-slate-400">${escapeMedicationText(formatMedicationStrength(med))}</span>` : ''}
            </div>
        `;
        container.appendChild(btn);
    });
}

function renderProfileMeds() {
    const listDiv = document.getElementById('profileMedsList');
    if (!listDiv) return;
    
    listDiv.innerHTML = '';
    const profile = DataManager.getProfile();
    const meds = (profile.medications || []).filter(m => m.isDiabetesMed === true);
    
    if (meds.length === 0) {
        listDiv.innerHTML = '<div class="text-[10px] text-slate-600 italic py-2">Henüz ilaç eklenmemiş.</div>';
        return;
    }
    
    meds.forEach((m) => {
        const color = m.color || getMedColor(m.name);
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between bg-slate-800/40 p-2 rounded-xl border border-slate-700/50 group hover:border-emerald-500/30 transition-all';
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex items-center gap-3';
        infoDiv.innerHTML = `
            <div class="w-1.5 h-6 rounded-full" style="background-color: ${color}; box-shadow: 0 0 8px ${color}40"></div>
            <div class="flex flex-col leading-tight">
                <span class="text-[11px] font-bold text-white">${escapeMedicationText(m.name)}</span>
                ${formatMedicationStrength(m) ? `<span class="text-[9px] text-slate-500 font-medium">${escapeMedicationText(formatMedicationStrength(m))}</span>` : ''}
            </div>
        `;
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'p-1 text-blue-400 hover:bg-blue-400/10 rounded-lg transition';
        editBtn.innerHTML = '<i class="ph-fill ph-pencil-simple text-sm"></i>';
        editBtn.onclick = () => openMedModal(m);
        
        const delBtn = document.createElement('button');
        delBtn.className = 'p-1 text-red-400 hover:bg-red-400/10 rounded-lg transition';
        delBtn.innerHTML = '<i class="ph-fill ph-trash text-sm"></i>';
        delBtn.onclick = () => { editingMedName = m.name; deleteMed(); };
        
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(delBtn);
        div.appendChild(infoDiv);
        div.appendChild(actionsDiv);
        listDiv.appendChild(div);
    });
}

function renderProfileBpMeds() {
    const listDiv = document.getElementById('profileBpMedsList');
    if (!listDiv) return;
    
    listDiv.innerHTML = '';
    const profile = DataManager.getProfile();
    const meds = (profile.medications || []).filter(m => m.isBpMed === true);
    
    if (meds.length === 0) {
        listDiv.innerHTML = '<div class="text-[10px] text-slate-600 italic py-2">Henüz ilaç eklenmemiş.</div>';
        return;
    }
    
    meds.forEach((m) => {
        const color = m.color || getMedColor(m.name);
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between bg-slate-800/40 p-2 rounded-xl border border-slate-700/50 group hover:border-emerald-500/30 transition-all';
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex items-center gap-3';
        infoDiv.innerHTML = `
            <div class="w-1.5 h-6 rounded-full" style="background-color: ${color}; box-shadow: 0 0 8px ${color}40"></div>
            <div class="flex flex-col leading-tight">
                <span class="text-[11px] font-bold text-white">${escapeMedicationText(m.name)}</span>
                ${formatMedicationStrength(m) ? `<span class="text-[9px] text-slate-500 font-medium">${escapeMedicationText(formatMedicationStrength(m))}</span>` : ''}
            </div>
        `;
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'p-1 text-blue-400 hover:bg-blue-400/10 rounded-lg transition';
        editBtn.innerHTML = '<i class="ph-fill ph-pencil-simple text-sm"></i>';
        editBtn.onclick = () => openMedModal(m);
        
        const delBtn = document.createElement('button');
        delBtn.className = 'p-1 text-red-400 hover:bg-red-400/10 rounded-lg transition';
        delBtn.innerHTML = '<i class="ph-fill ph-trash text-sm"></i>';
        delBtn.onclick = () => { editingMedName = m.name; deleteMed(); };
        
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(delBtn);
        div.appendChild(infoDiv);
        div.appendChild(actionsDiv);
        listDiv.appendChild(div);
    });
}

function renderProfileAnticoagulantMeds() {
    const listDiv = document.getElementById('profileAnticoagulantMedsList');
    if (!listDiv) return;
    
    listDiv.innerHTML = '';
    const profile = DataManager.getProfile();
    const meds = (profile.medications || []).filter(m => m.isAnticoagulantMed === true);
    
    if (meds.length === 0) {
        listDiv.innerHTML = '<div class="text-[10px] text-slate-600 italic py-2">Henüz ilaç eklenmemiş.</div>';
        return;
    }
    
    meds.forEach((m) => {
        const color = m.color || getMedColor(m.name);
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between bg-slate-800/40 p-2 rounded-xl border border-slate-700/50 group hover:border-emerald-500/30 transition-all';
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex items-center gap-3';
        infoDiv.innerHTML = `
            <div class="w-1.5 h-6 rounded-full" style="background-color: ${color}; box-shadow: 0 0 8px ${color}40"></div>
            <div class="flex flex-col leading-tight">
                <span class="text-[11px] font-bold text-white">${escapeMedicationText(m.name)}</span>
                ${formatMedicationStrength(m) ? `<span class="text-[9px] text-slate-500 font-medium">${escapeMedicationText(formatMedicationStrength(m))}</span>` : ''}
            </div>
        `;
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'p-1 text-blue-400 hover:bg-blue-400/10 rounded-lg transition';
        editBtn.innerHTML = '<i class="ph-fill ph-pencil-simple text-sm"></i>';
        editBtn.onclick = () => openMedModal(m);
        
        const delBtn = document.createElement('button');
        delBtn.className = 'p-1 text-red-400 hover:bg-red-400/10 rounded-lg transition';
        delBtn.innerHTML = '<i class="ph-fill ph-trash text-sm"></i>';
        delBtn.onclick = () => { editingMedName = m.name; deleteMed(); };
        
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(delBtn);
        div.appendChild(infoDiv);
        div.appendChild(actionsDiv);
        listDiv.appendChild(div);
    });
}

function renderProfileOtherMeds() {
    const listDiv = document.getElementById('profileOtherMedsList');
    if (!listDiv) return;
    
    listDiv.innerHTML = '';
    const profile = DataManager.getProfile();
    // Diğer ilaçlar VEYA sınıflandırılmamış ilaçlar (kategorisi olmayanlar burada görünsün)
    const meds = (profile.medications || []).filter(m => m.isOtherMed === true || (!m.isDiabetesMed && !m.isBpMed && !m.isAnticoagulantMed));
    
    if (meds.length === 0) {
        listDiv.innerHTML = '<div class="text-[10px] text-slate-600 italic py-2">Henüz ilaç eklenmemiş.</div>';
        return;
    }
    
    meds.forEach((m) => {
        const color = m.color || getMedColor(m.name);
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between bg-slate-800/40 p-2 rounded-xl border border-slate-700/50 group hover:border-yellow-500/30 transition-all';
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex items-center gap-3';
        infoDiv.innerHTML = `
            <div class="w-1.5 h-6 rounded-full" style="background-color: ${color}; box-shadow: 0 0 8px ${color}40"></div>
            <div class="flex flex-col leading-tight">
                <span class="text-[11px] font-bold text-white">${escapeMedicationText(m.name)}</span>
                ${formatMedicationStrength(m) ? `<span class="text-[9px] text-slate-500 font-medium">${escapeMedicationText(formatMedicationStrength(m))}</span>` : ''}
            </div>
        `;
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'p-1 text-blue-400 hover:bg-blue-400/10 rounded-lg transition';
        editBtn.innerHTML = '<i class="ph-fill ph-pencil-simple text-sm"></i>';
        editBtn.onclick = () => openMedModal(m);
        
        const delBtn = document.createElement('button');
        delBtn.className = 'p-1 text-red-400 hover:bg-red-400/10 rounded-lg transition';
        delBtn.onclick = () => { editingMedName = m.name; deleteMed(); };
        delBtn.innerHTML = '<i class="ph-fill ph-trash text-sm"></i>';
        
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(delBtn);
        div.appendChild(infoDiv);
        div.appendChild(actionsDiv);
        listDiv.appendChild(div);
    });
}

function setCalendarAlarm() {
    const now = new Date();
    const startTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); 
    const endTime = new Date(startTime.getTime() + 15 * 60 * 1000);
    const toISO = (d) => d.toISOString().replace(/[-:.]/g, ''); 
    const event = { title: 'Kan Şekeri Kontrolü', description: 'Yemekten 2 saat sonraki tokluk kan şekerinizi ölçmeyi unutmayın.', start: toISO(startTime), end: toISO(endTime) };
    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.start}/${event.end}&details=${encodeURIComponent(event.description)}`;
    window.open(googleCalendarUrl, '_blank');
    showToast('Takvim etkinliği oluşturuluyor...', 'success');
}

function confirmResetFoodLibrary(evt) {
    if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation();
    const english = window.GLKOAITestLanguage?.currentLang === 'en';
    UIEnhancer.showConfirm(
        english ? 'All food lists and personal foods will be removed from view. Past records will be kept. Continue?' : 'Tüm gıda listeleri ve kişisel yiyecekler görünümden kaldırılacak. Geçmiş kayıtlar korunacak. Devam edilsin mi?',
        () => resetFoodLibrary(),
        english ? 'Clear food list' : 'Yemek listesini temizle',
        english ? 'Clear' : 'Temizle',
        'bg-red-600'
    );
}

function resetFoodLibrary() {
    const english = window.GLKOAITestLanguage?.currentLang === 'en';
    const archived = FoodLibraryManager.library.map(item => ({ ...item, foodListArchived: true }));
    const keys = ['customFoodLibrary', 'foodListSelection', 'foodListActive', 'customCuisineLists'];
    const previous = keys.map(key => localStorage.getItem(key));
    try {
        localStorage.setItem('customFoodLibrary', JSON.stringify(archived));
        localStorage.setItem('foodListSelection', '[]');
        localStorage.setItem('customCuisineLists', '[]');
        localStorage.setItem('foodListActive', JSON.stringify(['__manual__']));
    } catch (_) {
        keys.forEach((key, index) => { try { if (previous[index] === null) localStorage.removeItem(key); else localStorage.setItem(key, previous[index]); } catch (_) {} });
        showToast(english ? 'Could not clear the list.' : 'Liste temizlenemedi.', 'error');
        return;
    }
    FoodLibraryManager.library = archived;
    FoodLibraryManager.selectedFoods = {};
    FoodLibraryManager.editingItem = null;
    FoodLibraryManager.renderGrid();
    if (typeof FoodLists !== 'undefined') FoodLists.renderManager();
    const importArea = document.getElementById('jsonImportArea');
    if (importArea) importArea.value = '';
    showToast(english ? 'Food list cleared.' : 'Yemek listesi temizlendi.', 'success');
}

// ==========================================
// 11. YENİ MODÜL: TAKİP ASİSTANI YÖNETİCİSİ (AKILLI KARTLAR)
// ==========================================
const AssistantManager = {
    data: [],
    editingAlarmId: null,
    activeTimeEditId: null,
    activeTimeOriginalTime: null,
    
    // Gün Tanımları (Pazartesi'den Pazar'a)
    dayMap: [
        { label: 'Pzt', val: 1, ics: 'MO' },
        { label: 'Sal', val: 2, ics: 'TU' },
        { label: 'Çar', val: 3, ics: 'WE' },
        { label: 'Per', val: 4, ics: 'TH' },
        { label: 'Cum', val: 5, ics: 'FR' },
        { label: 'Cmt', val: 6, ics: 'SA' },
        { label: 'Paz', val: 0, ics: 'SU' }
    ],

    init() {
        const storedRaw = localStorage.getItem('assistantData');
        if (storedRaw) {
            this.data = safeParseStorage('assistantData', []);
            // Eski verilerde 'days' yoksa varsayılan olarak her günü ekle
            this.data.forEach(item => {
                if (item.type === 'alarm' && !item.days) {
                    item.days = [0, 1, 2, 3, 4, 5, 6]; 
                }
            });
        } else { 
            this.data = [];
            this.save(); 
        }
        this.render();
    },
    save() { localStorage.setItem('assistantData', JSON.stringify(this.data)); },
    toggleAlarmEditor(id) { this.editingAlarmId = this.editingAlarmId === id ? null : id; this.render(); },
    beginTimeEdit(id) {
        this.activeTimeEditId = id;
        const item = this.data.find(x => x.id === id);
        this.activeTimeOriginalTime = item ? item.time : null;
    },
    handleTimeKey(id, event, inputEl) {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (inputEl && typeof inputEl.blur === 'function') inputEl.blur();
        }
    },
    finalizeTimeEdit(id, value) {
        const item = this.data.find(x => x.id === id);
        const originalTime = this.activeTimeOriginalTime ?? (item ? item.time : null);
        this.activeTimeEditId = null;
        this.activeTimeOriginalTime = null;
        if (!item) return;

        const isValid = typeof value === 'string' && /^\d{2}:\d{2}$/.test(value);
        const finalValue = isValid ? value : originalTime;

        if (!finalValue) {
            this.render();
            return;
        }

        const dataNeedsUpdate = item.time !== finalValue;
        if (dataNeedsUpdate) {
            item.time = finalValue;
        }

        const timeChanged = originalTime !== finalValue;

        if (!timeChanged) {
            if (dataNeedsUpdate) this.save();
            if (!isValid) this.render();
            return;
        }

        this.rescheduleAlarm(item, true);
    },
    rescheduleAlarm(item, notify = true) {
        if (!item) return;
        item.nextOccurrenceAt = nextRecurringOccurrence(item, Date.now());
        const previousIndex = this.data.findIndex(x => x.id === item.id);
        this.data = this.data.filter(x => x.id !== item.id);
        const insertPosition = this.findAlarmPosition(item.time);
        this.data.splice(insertPosition, 0, item);
        this.save();
        this.render();
        schedulePostMealReminder();
        if (notify) {
            showToast(`Alarm ${item.time} saatine taşındı`, 'info');
        }
    },
    // YENİ: Alarmları zaman sırasına göre sıralayan fonksiyon
    sortAlarms() {
        // Note'ları başta tut, alarmları zaman sırasına göre sırala
        const insights = this.data.filter(item => item.type === 'insight');
        const notes = this.data.filter(item => item.type === 'note').sort((a, b) => (Number(b.createdAt) || Number(b.id) || 0) - (Number(a.createdAt) || Number(a.id) || 0));
        const alarms = this.data.filter(item => item.type === 'alarm');
        
        // Alarmları zaman sırasına göre sırala (00:00 - 23:59)
        alarms.sort((a, b) => {
            const timeA = a.time.split(':').map(Number);
            const timeB = b.time.split(':').map(Number);
            
            if (timeA[0] !== timeB[0]) {
                return timeA[0] - timeB[0]; // Saatlere göre
            }
            return timeA[1] - timeB[1]; // Dakikalara göre
        });
        
        // Insight + Note'lar + sıralı alarmlar
        this.data = [...insights, ...notes, ...this.data.filter(item => !['insight', 'note', 'alarm'].includes(item.type)), ...alarms];
        this.save();
    },
    
    // YENİ: Alarm için doğru pozisyonu bulan fonksiyon
    findAlarmPosition(newTime) {
        const alarms = this.data.filter(item => item.type === 'alarm');
        const notesCount = this.data.filter(item => item.type === 'note').length;
        
        // Eğer alarm yoksa, note'lardan sonraki ilk pozisyon
        if (alarms.length === 0) return notesCount;
        
        // Yeni alarmın zamanını sayıya çevir
        const [newHour, newMinute] = newTime.split(':').map(Number);
        const newTimeInMinutes = newHour * 60 + newMinute;
        
        // Mevcut alarmları kontrol et
        for (let i = 0; i < alarms.length; i++) {
            const [hour, minute] = alarms[i].time.split(':').map(Number);
            const timeInMinutes = hour * 60 + minute;
            
            // Eğer yeni alarm daha erkense, bu pozisyona ekle
            if (newTimeInMinutes < timeInMinutes) {
                return notesCount + i;
            }
        }
        
        // En sona ekle
        return notesCount + alarms.length;
    },
    
    // Alarm kartı ekle (otomatik sıralamalı)
    createReminderFromForm(form) {
        if (document.getElementById('reminderScheduleType')?.value === 'repeat') return this.createRecurringReminder(form);
        const english = window.GLKOAITestLanguage?.currentLang === 'en';
        const label = document.getElementById('recurringReminderName')?.value.trim() || '';
        const input = document.getElementById('singleReminderDate');
        const dueAt = input?.value ? new Date(input.value).getTime() : NaN;
        if (!label || !Number.isFinite(dueAt) || dueAt <= Date.now()) {
            showToast(english ? 'Enter a name and a future date and time.' : 'Ad ve gelecekte bir tarih ve saat girin.', 'warn'); return;
        }
        let id = Date.now(); while (this.data.some(item => item.id === id)) id++;
        const previous = this.data.slice();
        this.data.push({ id, type: 'one_time', label, dueAt, dismissed: false });
        try { this.save(); } catch (_) { this.data = previous; showToast(english ? 'Could not save reminder.' : 'Hatırlatma kaydedilemedi.', 'error'); return; }
        form.reset(); document.getElementById('reminderScheduleType').value = 'once'; updateReminderFormType();
        const panel = document.getElementById('recurringReminderCreate'); if (panel) panel.open = false;
        this.render(); schedulePostMealReminder();
        showToast(english ? 'Reminder saved.' : 'Hatırlatma kaydedildi.', 'success');
    },
    createRecurringReminder(form) {
        const english = window.GLKOAITestLanguage?.currentLang === 'en';
        const nameInput = document.getElementById('recurringReminderName');
        const timeInput = document.getElementById('recurringReminderTime');
        const label = nameInput?.value.trim() || '';
        const time = timeInput?.value || '';
        const match = /^(\d{2}):(\d{2})$/.exec(time);
        const days = Array.from(form.querySelectorAll('input[name="reminderDay"]:checked')).map(input => Number(input.value)).filter(day => Number.isInteger(day) && day >= 0 && day <= 6);
        if (!label || !match || Number(match[1]) > 23 || Number(match[2]) > 59 || !days.length) {
            showToast(english ? 'Enter a name, time, and at least one day.' : 'Ad, saat ve en az bir gün seçin.', 'warn');
            return;
        }
        let id = Date.now(); while (this.data.some(item => item.id === id)) id++;
        const previous = this.data.slice();
        this.data.push({ id, type: 'alarm', time, label, active: true, days: Array.from(new Set(days)) });
        try { this.save(); }
        catch (_) { this.data = previous; showToast(english ? 'Could not save reminder.' : 'Hatırlatma kaydedilemedi.', 'error'); return; }
        form.reset(); document.getElementById('reminderScheduleType').value = 'once'; updateReminderFormType();
        const panel = document.getElementById('recurringReminderCreate'); if (panel) panel.open = false;
        try { this.render(); } catch (error) { console.error('Reminder saved but view refresh failed:', error); }
        schedulePostMealReminder();
        showToast(english ? 'Reminder saved.' : 'Hatırlatma kaydedildi.', 'success');
    },
    addAlarmCard() { 
        const now = new Date();
        const defaultTime = now.getHours().toString().padStart(2, '0') + ':' + 
                           now.getMinutes().toString().padStart(2, '0');
        
        const newAlarm = { 
            id: Date.now(), 
            type: 'alarm', 
            time: defaultTime, 
            label: 'Yeni Hatırlatma', 
            active: true,
            days: [0, 1, 2, 3, 4, 5, 6] // Varsayılan: Her gün
        };
        
        // Doğru pozisyonu bul
        const insertPosition = this.findAlarmPosition(defaultTime);
        
        // Dizideki doğru pozisyona ekle
        this.data.splice(insertPosition, 0, newAlarm);
        
        this.save(); 
        this.render();
        
        // Kullanıcıya bildirim göster
        showToast(`Alarm ${defaultTime} saatine eklendi`, 'success');
    },
    
    // Note (hedef) kartı ekle
    addNoteCard() { openNoteEditor(); },

    // YENİ: Gün Tıklama İşlevi
    toggleDay(alarmId, dayVal) {
        const item = this.data.find(i => i.id === alarmId);
        if (item && item.type === 'alarm') {
            if (!item.days) item.days = [];
            
            if (item.days.includes(dayVal)) {
                // Varsa çıkar (Eğer son kalan günse çıkarma, en az 1 gün seçili olmalı)
                if (item.days.length > 1) {
                    item.days = item.days.filter(d => d !== dayVal);
                } else {
                    showToast('En az bir gün seçili olmalıdır.', 'warn');
                    return;
                }
            } else {
                // Yoksa ekle
                item.days.push(dayVal);
            }
            item.nextOccurrenceAt = nextRecurringOccurrence(item, Date.now());
            this.save();
            this.render();
            schedulePostMealReminder();
        }
    },

    generateInsight() {
        const todayStr = new Date().toLocaleDateString('tr-TR');
        const allData = DataManager.getAll();
        
        // Şeker ve Tansiyon verilerini ayır
        const todayGluc = allData.filter(d => d.dateStr === todayStr && d.val && (!d.type || (d.type !== 'pressure' && d.type !== 'activity' && d.type !== 'nutrition_only')));
        const todayBp = allData.filter(d => d.dateStr === todayStr && d.type === 'pressure');
        
        this.data = this.data.filter(i => i.type !== 'insight');
        
        if (todayGluc.length === 0 && todayBp.length === 0) {
            this.save();
            this.render();
            return;
        }

        // --- 1. ŞEKER ANALİZİ ---
        if (todayGluc.length > 0) {
        const vals = todayGluc.map(d => d.val);
        const avg = Math.round(vals.reduce((a,b)=>a+b,0) / vals.length);
        
        const msg = `${vals.length} ölçüm: ${vals.join(', ')} mg/dL. Ortalama tekil değerleri gizleyebilir.`;
        const color = 'blue';
        const icon = 'ph-chart-line';

        const card = {
            id: 'auto-insight',
            type: 'insight',
            val: avg,
            text: msg,
            color: color,
            icon: icon,
            time: new Date().toTimeString().slice(0,5),
            unit: 'mg/dL',
            title: 'ŞEKER ANALİZİ'
        };
        
        this.data.unshift(card);
        }

        // --- 2. TANSİYON ANALİZİ ---
        if (todayBp.length > 0) {
            const sysVals = todayBp.map(d => parseInt(d.sys));
            const avgSys = Math.round(sysVals.reduce((a,b)=>a+b,0) / sysVals.length);
            
            const msg = `${todayBp.length} ölçüm: ${todayBp.map(d => `${d.sys}/${d.dia}`).join(', ')} mmHg.`;
            const color = 'blue';
            const icon = 'ph-heartbeat';

            this.data.unshift({
                id: 'auto-insight-bp',
                type: 'insight',
                val: avgSys,
                text: msg,
                color: color,
                icon: icon,
                time: new Date().toTimeString().slice(0,5),
                unit: 'mmHg',
                title: 'TANSİYON ANALİZİ'
            });
        }

        this.save();
        this.render();
    },

    // YENİ: Not yazarken render yapmadan sessizce kaydet (Focus kaybını önler)
    handleNoteInput(id, value, el) {
        const item = this.data.find(x => x.id === id);
        if (item) {
            item.text = value;
            this.save();
            // Karakter sayısını manuel güncelle
            const container = el.closest('.group');
            if (container) { const countEl = container.querySelector('.char-count'); if (countEl) countEl.textContent = value.length + localizedPlaceholder(' karakter', ' characters'); }
        }
    },

    deleteCard(id) { UIEnhancer.showConfirm('Bu kart silinsin mi?', () => { this.data = this.data.filter(x => x.id !== id); this.save(); this.render(); schedulePostMealReminder(); showToast('Kart silindi', 'success'); }); },
    updateCard(id, field, value) {
        const index = this.data.findIndex(x => x.id === id);
        if (index === -1) return;

        const item = this.data[index];
        if (item[field] === value) return;

        item[field] = value;
        if (item.type === 'alarm' && field === 'label') item.defaultCategoryLabel = false;

        if (item.type === 'alarm' && field === 'time') {
            if (this.activeTimeEditId === id) {
                this.save();
                return;
            }
            this.rescheduleAlarm(item);
            return;
        }

        this.save();
        if (item.type === 'alarm') schedulePostMealReminder();
    },
    render() {
        const container = document.getElementById('reminderCardsArea'); 
        if (!container) return; 
        container.innerHTML = '';
        const notesContainer = document.getElementById('notesCardsArea');
        const insightContainer = document.getElementById('analysisInsightCards');
        if (notesContainer) notesContainer.innerHTML = '';
        if (insightContainer) insightContainer.innerHTML = '';
        
        // Alarmları zaman sırasına göre sırala
        this.sortAlarms();
        
        this.data.forEach(item => {
            if (!['note', 'insight', 'alarm'].includes(item.type)) return;
            const div = document.createElement('div');
            const target = item.type === 'note' ? notesContainer : item.type === 'insight' ? insightContainer : container;
            if (!target) return;
            
            if(item.type === 'insight') {
                const colorMap = {
                    'emerald': 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
                    'orange': 'from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-400',
                    'red': 'from-red-500/20 to-rose-500/20 border-red-500/30 text-red-400',
                    'amber': 'from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-400'
                };
                const theme = colorMap[item.color] || colorMap['emerald'];
                
                div.innerHTML = `
                    <div class="bg-gradient-to-br ${theme} rounded-xl border p-4 mb-3 relative overflow-hidden group animate-fade-in shadow-lg">
                        <div class="absolute top-0 right-0 p-3 opacity-10">
                            <i class="ph-fill ${item.icon} text-6xl"></i>
                        </div>
                        <div class="relative z-10">
                            <div class="flex justify-between items-start mb-2">
                                <div class="flex items-center gap-2">
                                    <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm shadow-inner">
                                        <i class="ph-fill ${item.icon} text-lg"></i>
                                    </div>
                                    <div>
                                        <div class="text-[10px] font-black uppercase tracking-wider opacity-70">${window.GLKOAITestLanguage ? window.GLKOAITestLanguage.translate(item.title || 'GÜNLÜK ANALİZ') : (item.title || 'GÜNLÜK ANALİZ')}</div>
                                        <div class="text-xs font-bold opacity-90">${item.time}</div>
                                    </div>
                                </div>
                                <div class="text-2xl font-black tabular-nums drop-shadow-sm">${item.val}<span class="text-[10px] font-bold ml-1 opacity-60">${item.unit || 'mg/dL'}</span></div>
                            </div>
                            <p class="text-xs font-medium leading-relaxed opacity-90 pr-8">
                                ${window.GLKOAITestLanguage ? window.GLKOAITestLanguage.translate(item.text) : item.text}
                            </p>
                        </div>
                    </div>`;
            } else if(item.type === 'note') {
                const english = window.GLKOAITestLanguage?.currentLang === 'en';
                const created = Number(item.createdAt) || Number(item.id);
                const date = Number.isFinite(created) && created >= 946684800000 && created < 4102444800000 ? new Intl.DateTimeFormat(english ? 'en-GB' : 'tr-TR', {dateStyle:'medium', timeStyle:'short'}).format(new Date(created)) : (english ? 'Date unavailable' : 'Tarih bilinmiyor');
                const preview = item.text?.trim() || (english ? 'Empty note' : 'Boş not');
                const badge = item.notify ? (english ? ' · Reminder' : ' · Bildirim') : '';
                const reminderInfo = item.notify && validNoteTimestamp(item.notifyAt) ? `${new Intl.DateTimeFormat(english ? 'en-GB' : 'tr-TR', {dateStyle:'medium', timeStyle:'short'}).format(new Date(item.notifyAt))} · ${item.durationType === 'continuous' ? (english ? 'Continuous' : 'Sürekli') : `${Number(item.durationMinutes) || 0} ${english ? 'min' : 'dk'}`} · ${item.notificationDismissed ? (english ? 'Read' : 'Okundu') : (english ? 'Reminder on' : 'Bildirim açık')}` : (english ? 'Reminder off' : 'Bildirim kapalı');
                div.innerHTML = `<details class="note-saved-card"><summary><i class="ph-bold ph-notebook text-indigo-300" aria-hidden="true"></i><span class="note-saved-summary"><span class="note-saved-preview">${escapeHtml(preview)}</span><span class="note-saved-date">${escapeHtml(date + badge)}</span></span><i class="ph-bold ph-caret-down" aria-hidden="true"></i></summary><div class="note-saved-body"><p class="note-saved-text">${escapeHtml(item.text || '')}</p><p class="note-saved-date">${escapeHtml(reminderInfo)}</p><div class="note-saved-actions"><button type="button" class="note-edit" aria-label="${english ? 'Edit' : 'Düzenle'}"><i class="ph-bold ph-pencil" aria-hidden="true"></i></button><button type="button" class="note-delete" aria-label="${english ? 'Delete' : 'Sil'}"><i class="ph-bold ph-trash" aria-hidden="true"></i></button></div></div></details>`;
                div.querySelector('.note-edit').addEventListener('click', () => openNoteEditor(item.id));
                div.querySelector('.note-delete').addEventListener('click', () => this.deleteCard(item.id));
            } else {
                // === GÜNCELLENMİŞ ALARM KARTI (GÜN SEÇİMLİ) ===
                let daysHtml = '<div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/30 gap-1">';
                this.dayMap.forEach(d => {
                    const isSelected = item.days && item.days.includes(d.val);
                    const btnClass = isSelected 
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40 border-violet-500' 
                        : 'bg-slate-900 text-slate-500 border-slate-700 hover:bg-slate-800';
                    daysHtml += `
                        <button onclick="AssistantManager.toggleDay(${item.id}, ${d.val})" 
                                class="flex-1 h-8 rounded-lg text-[9px] font-bold border transition-all ${btnClass}">
                            ${localizedPlaceholder(d.label, ({1:'Mon', 2:'Tue', 3:'Wed', 4:'Thu', 5:'Fri', 6:'Sat', 0:'Sun'})[d.val])}
                        </button>`;
                });
                daysHtml += '</div>';

                const defaultAlarmLabels = ['Yeni Hatırlatma', 'Sabah İlacı'];
                const alarmLabel = defaultAlarmLabels.includes(item.label) && window.GLKOAITestLanguage
                    ? window.GLKOAITestLanguage.translate(item.label) : reminderLabel(item);
                const dayNames = this.dayMap.every(day => item.days?.includes(day.val)) ? localizedPlaceholder('Her gün', 'Every day') : this.dayMap.filter(day => item.days?.includes(day.val)).map(day => localizedPlaceholder(day.label, ({1:'Mon', 2:'Tue', 3:'Wed', 4:'Thu', 5:'Fri', 6:'Sat', 0:'Sun'})[day.val])).join(', ');
                div.innerHTML = `
                    <div class="one-time-reminder" data-reminder-alarm-id="${escapeHtml(String(item.id))}" style="${reminderCategoryColor(item.category) ? `--reminder-color:${reminderCategoryColor(item.category)}` : ''}">
                        <div class="one-time-reminder-heading">
                            <span class="one-time-reminder-label">${escapeHtml(alarmLabel || '')}</span>
                            <button type="button" aria-label="Düzenle / Edit" onclick="AssistantManager.toggleAlarmEditor(${item.id})" class="one-time-reminder-action"><i class="ph-bold ph-pencil" aria-hidden="true"></i></button>
                            <button type="button" aria-label="Sil / Delete" onclick="AssistantManager.deleteCard(${item.id})" class="one-time-reminder-action"><i class="ph-bold ph-trash" aria-hidden="true"></i></button>
                        </div>
                        <p class="one-time-reminder-date">${escapeHtml(item.time || '')} · ${escapeHtml(dayNames)}</p>
                        <span class="reminder-overdue-count home-reminder-overdue-label" hidden></span>
                        <div class="one-time-reminder-editor" ${this.editingAlarmId === item.id ? '' : 'hidden'}>
                            <label class="text-xs text-slate-300 w-full">${localizedPlaceholder('Hatırlatma adı', 'Reminder name')}
                                <input type="text" value="${escapeHtml(item.label || '')}" onchange="AssistantManager.updateCard(${item.id}, 'label', this.value)" class="w-full mt-1">
                            </label>
                            <label class="text-xs text-slate-300 w-full">${localizedPlaceholder('Saat', 'Time')}
                                <input type="time" value="${escapeHtml(item.time || '')}" onfocus="AssistantManager.beginTimeEdit(${item.id})" onchange="AssistantManager.updateCard(${item.id}, 'time', this.value)" onblur="AssistantManager.finalizeTimeEdit(${item.id}, this.value)" onkeydown="AssistantManager.handleTimeKey(${item.id}, event, this)" class="w-full mt-1">
                            </label>
                            <div class="w-full">${daysHtml}</div>
                            <button type="button" onclick="AssistantManager.toggleAlarmEditor(${item.id})">${localizedPlaceholder('Bitti', 'Done')}</button>
                        </div>
                    </div>`;
            }
            
            const renderedCard = div.firstElementChild || div;
            target.appendChild(renderedCard);
            if (item.type === 'alarm') {
                const currentAlarm = () => this.data.find(value => value.type === 'alarm' && value.id === item.id);
                const dueOccurrences = () => (Array.isArray(currentAlarm()?.pendingOccurrences) ? currentAlarm().pendingOccurrences : []).filter(value => Number.isFinite(value) && value <= Date.now());
                enableReminderSwipe(renderedCard, () => this.editingAlarmId !== item.id && dueOccurrences().length > 0, () => {
                    renderedCard.style.transform = '';
                    const current = currentAlarm(), due = dueOccurrences();
                    if (!current || !due.length) { schedulePostMealReminder(); return; }
                    const previous = current.pendingOccurrences;
                    const index = previous.indexOf(Math.max(...due));
                    current.pendingOccurrences = previous.slice(); current.pendingOccurrences.splice(index, 1);
                    try { this.save(); } catch (_) { current.pendingOccurrences = previous; showToast(window.GLKOAITestLanguage?.currentLang === 'en' ? 'Could not dismiss reminder.' : 'Hatırlatma kapatılamadı.', 'error'); return; }
                    schedulePostMealReminder();
                });
            }
        });
        
        renderOneTimeReminders();
        syncRecurringReminderDueStyles();
    },
    exportToCalendar() {
        const english = window.GLKOAITestLanguage?.currentLang === 'en';
        const now = Date.now();
        const events = this.data.filter(item => item.type === 'alarm' && item.active !== false && item.days?.length)
            .map(item => ({ id: `alarm-${item.id}`, label: reminderLabel(item), at: item.nextOccurrenceAt > now ? item.nextOccurrenceAt : nextRecurringOccurrence(item, now), days: item.days }));
        this.data.filter(item => item.type === 'one_time' && !item.dismissed && item.dueAt > now)
            .forEach(item => events.push({ id: `once-${item.id}`, label: reminderLabel(item), at: item.dueAt }));
        DataManager.getAll().filter(item => item.postMealReminderAt > now && !item.postMealReminderDismissed)
            .forEach(item => events.push({ id: `glucose-${item.id}`, label: english ? 'Post-meal glucose measurement' : 'Yemek sonrası kan şekeri ölçümü', at: item.postMealReminderAt }));
        if (!events.length) { showToast(english ? 'No upcoming reminders to export.' : 'Aktarılacak yaklaşan hatırlatma yok.', 'warn'); return; }
        UIEnhancer.showConfirm(english ? `Download ${events.length} reminders as a calendar file? Open the downloaded file to import it into your calendar.` : `${events.length} hatırlatma takvim dosyası olarak indirilsin mi? İndirdiğiniz dosyayı açarak takviminize aktarabilirsiniz.`, () => {
            const escapeText = value => String(value || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
            const stamp = value => { const d = new Date(value), pad = n => String(n).padStart(2, '0'); return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`; };
            const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GLKOAI//Reminders//EN'];
            events.forEach(event => {
                if (!Number.isFinite(event.at)) return;
                const label = escapeText(event.label);
                lines.push('BEGIN:VEVENT', `UID:${event.id}@glkoai`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`, `DTSTART:${stamp(event.at)}`, 'DURATION:PT15M', `SUMMARY:${label}`);
                if (event.days) lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${event.days.map(day => this.dayMap.find(d => d.val === day)?.ics).filter(Boolean).join(',')}`);
                lines.push('BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', `DESCRIPTION:${label}`, 'END:VALARM', 'END:VEVENT');
            });
            lines.push('END:VCALENDAR');
            const url = URL.createObjectURL(new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' }));
            const a = document.createElement('a'); a.href = url; a.download = 'GLKOAI_Takvim.ics'; document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, english ? 'Export to calendar' : 'Takvime aktar', english ? 'Download' : 'İndir', 'bg-violet-600');
    }
};

// ==========================================
// 11.1 MARKDOWN VE HEDEF YÖNETİMİ (YENİ)
// ==========================================

let currentAiResponse = ''; // YENİ: Aktif analiz sonucunu tutar

// Markdown Sonuç Gösterici
function renderMarkdownResult(markdownText) {
    currentAiResponse = markdownText; // YENİ: İçeriği değişkene al
    const container = document.getElementById('aiResultContent');
    const modal = document.getElementById('aiResultModal');
    
    if (typeof marked === 'undefined') {
        showToast('Marked kütüphanesi yüklenemedi', 'error');
        return;
    }
    
    if (container && modal) {
        // Güvenilir bir temizleyici eklenene kadar yanıtı çalıştırılabilir HTML yerine metin olarak göster.
        container.textContent = markdownText;
        container.style.whiteSpace = 'pre-wrap';
        modal.style.display = 'flex';
    }
}

// YENİ: AI Geçmiş Yöneticisi
const AiHistoryManager = {
    key: 'aiAnalysisHistory',
    getAll() {
        return safeParseStorage(this.key, []);
    },
    save(content) {
        const list = this.getAll();
        // Aynı içerik zaten en başta varsa tekrar kaydetme
        if(list.length > 0 && list[0].content === content) {
            showToast('Bu analiz zaten kayıtlı', 'warn');
            return;
        }
        
        const newItem = {
            id: Date.now(),
            date: new Date().toLocaleDateString('tr-TR'),
            time: new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'}),
            content: content,
            preview: content.replace(/[#*`]/g, '').substring(0, 120) + '...'
        };
        list.unshift(newItem);
        localStorage.setItem(this.key, JSON.stringify(list));
        showToast('Analiz geçmişe kaydedildi', 'success');
    },
    delete(id) {
        UIEnhancer.showConfirm('Bu analiz kaydı silinsin mi?', () => {
            let list = this.getAll();
            list = list.filter(i => i.id !== id);
            localStorage.setItem(this.key, JSON.stringify(list));
            this.renderList();
            showToast('Analiz silindi', 'success');
        });
    },
    renderList() {
        const container = document.getElementById('aiHistoryList');
        if(!container) return;
        const list = this.getAll();
        
        if(list.length === 0) {
            container.innerHTML = '<div class="text-center text-slate-500 py-10 flex flex-col items-center gap-2"><i class="ph-fill ph-clock-counter-clockwise text-4xl opacity-50"></i><p>Henüz kayıtlı analiz yok.</p></div>';
            return;
        }
        
        container.innerHTML = list.map(item => `
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition group relative cursor-pointer" onclick="renderMarkdownResult(AiHistoryManager.getContent(${item.id})); closeModal('aiHistoryModal');">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                        <i class="ph-fill ph-calendar-blank text-indigo-400"></i>
                        <span class="text-xs font-bold text-slate-300">${item.date} <span class="opacity-50 font-normal">${item.time}</span></span>
                    </div>
                    <button onclick="event.stopPropagation(); AiHistoryManager.delete(${item.id})" class="text-slate-500 hover:text-red-400 p-1.5 hover:bg-slate-700 rounded-lg transition"><i class="ph-bold ph-trash"></i></button>
                </div>
                <div class="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    ${escapeHtml(item.preview)}
                </div>
            </div>
        `).join('');
    },
    getContent(id) {
        const item = this.getAll().find(i => i.id === id);
        return item ? item.content : '';
    }
};

function saveCurrentAnalysis() {
    if(!currentAiResponse) {
        showToast('Kaydedilecek içerik yok', 'warn');
        return;
    }
    AiHistoryManager.save(currentAiResponse);
}

function openAiHistory() {
    const m = document.getElementById('aiHistoryModal');
    if(m) {
        m.style.display = 'flex';
        AiHistoryManager.renderList();
    }
}

// Hedef Modunu Döngüsel Değiştir (Sıkı -> Standart -> Esnek)
function cycleTargetMode() {
    const p = DataManager.getProfile();
    const modes = ['strict', 'std', 'flex'];
    const currentMode = p.targetMode || 'std';
    
    let nextIndex = (modes.indexOf(currentMode) + 1) % modes.length;
    p.targetMode = modes[nextIndex];
    const goalAnswers = p.clinicalWizard?.topics?.restrictions?.answers;
    if (goalAnswers) goalAnswers.glucoseGoal = p.targetMode;
    DataManager.saveProfile(p);
    
    // UI Güncelle
    const modeSelect = document.getElementById('profMode');
    if(modeSelect) modeSelect.value = p.targetMode;
    
    calcAge(false); // Hedef kutusunu güncelle
    renderList();   // Listeyi ve renkleri güncelle
    updateCharts(); // Grafikleri güncelle
    
    const labels = { 'strict': 'Sıkı (70-140)', 'std': 'Standart (70-180)', 'flex': 'Esnek (90-200)' };
    showToast(`Hedef Modu: ${labels[p.targetMode]}`, 'success');
}

let editingNoteId = null;
function noteLocalDateTime(timestamp) {
    const date = new Date(timestamp), pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function updateNoteNotificationFields() {
    const enabled = document.getElementById('noteNotify').checked;
    document.getElementById('noteNotificationFields').hidden = !enabled;
    document.getElementById('noteDurationFields').hidden = !enabled || document.getElementById('noteDurationType').value !== 'timed';
}
function openNoteEditor(id = null) {
    const dialog = document.getElementById('noteEditorDialog');
    const note = id === null ? null : AssistantManager.data.find(item => item.type === 'note' && item.id === id);
    if (!dialog || (id !== null && !note)) return;
    editingNoteId = note ? note.id : null;
    document.getElementById('noteText').value = note?.text || '';
    document.getElementById('noteNotify').checked = !!note?.notify;
    document.getElementById('noteNotifyAt').value = noteLocalDateTime(validNoteTimestamp(note?.notifyAt) ? note.notifyAt : Date.now());
    document.getElementById('noteDurationType').value = note?.durationType === 'continuous' ? 'continuous' : 'timed';
    document.getElementById('noteDurationMinutes').value = note?.durationMinutes || 60;
    document.getElementById('noteEditorError').hidden = true;
    updateNoteNotificationFields();
    if (!dialog.open) dialog.showModal();
}
function saveNoteEditor(event) {
    event.preventDefault();
    const english = window.GLKOAITestLanguage?.currentLang === 'en';
    const error = document.getElementById('noteEditorError');
    const text = document.getElementById('noteText').value.trim();
    const notify = document.getElementById('noteNotify').checked;
    const rawAt = document.getElementById('noteNotifyAt').value;
    const notifyAt = notify && rawAt ? new Date(rawAt).getTime() : null;
    const durationType = document.getElementById('noteDurationType').value === 'continuous' ? 'continuous' : 'timed';
    const durationMinutes = Number(document.getElementById('noteDurationMinutes').value);
    if (!text || (notify && !Number.isFinite(notifyAt)) || (notify && durationType === 'timed' && (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 43200))) {
        error.textContent = english ? 'Enter a note, a valid date and a duration between 1 and 43,200 minutes.' : 'Notu, geçerli tarih ve saati; süreli bildirim için 1–43.200 dakika arasında bir süre girin.';
        error.hidden = false; return;
    }
    const existing = editingNoteId === null ? null : AssistantManager.data.find(item => item.type === 'note' && item.id === editingNoteId);
    if (editingNoteId !== null && !existing) { error.textContent = english ? 'Note not found.' : 'Not bulunamadı.'; error.hidden = false; return; }
    let id = existing?.id || Date.now();
    while (!existing && AssistantManager.data.some(item => item.id === id)) id++;
    const changedSchedule = !existing || existing.notify !== notify || existing.notifyAt !== notifyAt || existing.durationType !== durationType || (durationType === 'timed' && existing.durationMinutes !== durationMinutes);
    const oldCreated = Number(existing?.createdAt) || Number(existing?.id);
    const createdAt = existing ? (oldCreated >= 946684800000 && oldCreated < 4102444800000 ? oldCreated : null) : Date.now();
    const updated = { ...(existing || {}), id, type: 'note', text, createdAt, notify, notifyAt, durationType, durationMinutes: durationType === 'timed' ? durationMinutes : null, notificationDismissed: changedSchedule ? false : !!existing?.notificationDismissed };
    const previous = AssistantManager.data.slice();
    AssistantManager.data = existing ? AssistantManager.data.map(item => item === existing ? updated : item) : [...AssistantManager.data, updated];
    try { AssistantManager.save(); } catch (_) { AssistantManager.data = previous; error.textContent = english ? 'Could not save note.' : 'Not kaydedilemedi.'; error.hidden = false; return; }
    document.getElementById('noteEditorDialog').close();
    AssistantManager.render(); schedulePostMealReminder();
    showToast(english ? 'Note saved.' : 'Not kaydedildi.', 'success');
}
document.addEventListener('DOMContentLoaded', () => document.getElementById('noteEditorForm')?.addEventListener('submit', saveNoteEditor));

// ==========================================
// 12. PENCERE VE YARDIMCI FONKSİYONLAR
// ==========================================
let selectedAiService = 'gemini';
function selectAI(service) {
    selectedAiService = service;
    document.querySelectorAll('.ai-btn').forEach(btn => { btn.classList.remove('active', 'border-indigo-500', 'bg-slate-800', 'shadow-lg'); btn.classList.add('bg-slate-900', 'border-slate-700'); if(btn.id === 'btn-' + service) { btn.classList.add('active', 'border-indigo-500', 'bg-slate-800', 'shadow-lg'); btn.classList.remove('bg-slate-900', 'border-slate-700'); } });
}

const AiWizard = {
    stage: 1,
    _updating: false,
    cardSelect: null,
    cardImport: null,
    wizardRoot: null,
    setStage(stage = 1) {
        const cardSelect = this.cardSelect || document.getElementById('aiCardSelect');
        const cardImport = this.cardImport || document.getElementById('aiCardImport');
        if (!cardSelect || !cardImport) return;

        this.cardSelect = cardSelect;
        this.cardImport = cardImport;
        this.wizardRoot = this.wizardRoot || (cardSelect.parentElement ? cardSelect.parentElement.closest('details') : null);

        const nextStage = stage === 2 ? 2 : 1;
        cardImport.hidden = nextStage === 1;
        if (this.stage === nextStage && ((nextStage === 1 && !cardSelect.hidden && !cardImport.open) || (nextStage === 2 && cardImport.open && cardSelect.hidden))) {
            return;
        }

        this.stage = nextStage;
        this._updating = true;

        if (this.stage === 1) {
            cardSelect.hidden = false;
            if (cardImport.open) cardImport.open = false;
        } else {
            cardSelect.hidden = true;
            cardImport.hidden = false;
            if (!cardImport.open) cardImport.open = true;
            setTimeout(() => {
                const textarea = document.getElementById('jsonImportArea');
                if (textarea) textarea.focus();
            }, 60);
        }

        this._updating = false;
    },
    collapse(includeRoot = false) {
        const cardSelect = this.cardSelect || document.getElementById('aiCardSelect');
        const cardImport = this.cardImport || document.getElementById('aiCardImport');
        if (!cardSelect || !cardImport) return;

        const wizardRoot = this.wizardRoot || (cardSelect.parentElement ? cardSelect.parentElement.closest('details') : null);
        this.cardSelect = cardSelect;
        this.cardImport = cardImport;
        this.wizardRoot = wizardRoot;

        this._updating = true;
        cardSelect.hidden = true;
        cardImport.hidden = true;
        if (cardImport.open) cardImport.open = false;
        if (includeRoot && wizardRoot && wizardRoot.open) wizardRoot.open = false;
        this._updating = false;
        this.stage = 1;
    },
    init() {
        const cardSelect = document.getElementById('aiCardSelect');
        const cardImport = document.getElementById('aiCardImport');
        if (!cardSelect || !cardImport) return;

        this.cardSelect = cardSelect;
        this.cardImport = cardImport;
        this.wizardRoot = cardSelect.parentElement ? cardSelect.parentElement.closest('details') : null;

        cardImport.addEventListener('toggle', () => {
            if (this._updating) return;
            this.setStage(cardImport.open ? 2 : 1);
        });

        if (this.wizardRoot) {
            this.wizardRoot.addEventListener('toggle', () => {
                if (this._updating) return;
                if (this.wizardRoot.open) {
                    this.setStage(1);
                } else {
                    this.collapse(false);
                }
            });
        }

        const nutritionDetails = document.getElementById('nutDetails');
        if (nutritionDetails) {
            nutritionDetails.addEventListener('toggle', () => {
                if (!nutritionDetails.open) {
                    this.collapse(true);
                }
            });
        }

        this.setStage(1);
    }
};
window.AiWizard = AiWizard;

// YENİ: Hızlı AI Başlatma Fonksiyonu
function startAiAnalysis(service) {
    selectAI(service);
    DataManager.prepareDataForAI();
}

function initCuisinePreference() {
    const select = document.getElementById('dietCuisine');
    if (!select) return;
    try {
        const saved = localStorage.getItem('glkoaiCuisine');
        if (saved && Array.from(select.options).some(option => option.value === saved)) select.value = saved;
    } catch (_) {}
    select.addEventListener('change', () => {
        try { localStorage.setItem('glkoaiCuisine', select.value); } catch (_) {}
    });
}
document.addEventListener('DOMContentLoaded', initCuisinePreference);

function generateAndCopyDiet() {
    const dietType = document.getElementById('dietTypeSelector').value || 'general';
    const itemCount = parseInt(document.getElementById('dietItemCount')?.value || '10', 10);
    const validCount = Math.min(Math.max(itemCount, 3), 30);
    const profile = AppConfig.DIET_PROFILE_MAP[dietType] || AppConfig.DIET_PROFILE_MAP.general;
    const cuisine = document.getElementById('dietCuisine')?.value || 'any';
    const cuisineTR = { any: '', turkish: 'Türk mutfağına uygun, ', mediterranean: 'Akdeniz mutfağına uygun, ', italian: 'İtalyan mutfağına uygun, ', indian: 'Hint mutfağına uygun, ' };
    const cuisineEN = { any: '', turkish: ' inspired by Turkish cuisine', mediterranean: ' inspired by Mediterranean cuisine', italian: ' inspired by Italian cuisine', indian: ' inspired by Indian cuisine' };
    let focus = (profile && profile.prompt) || 'Sağlıklı beslenme';
    if (cuisine !== 'turkish' && profile?.id === 'breakfast') focus = 'kahvaltı';
    if (cuisine !== 'turkish' && profile?.id === 'general') focus = 'genel ev yemekleri';
    const codeHint = profile ? ` Seçili profil kodu "${profile.code}" ve adı "${profile.label}" olsun; JSON listesindeki "code" ve "label" alanlarını bununla doldur.` : '';
    let prompt;
    if (window.GLKOAITestLanguage?.currentLang === 'en') {
        // Only instructions and display labels are translated. JSON keys, profile code,
        // and supported units remain stable for the existing food importer.
        const focusByProfile = {
            general: 'a general home-style diet', breakfast: 'breakfast foods',
            low_gi: 'foods with a low glycemic index', diabetic: 'meals suitable for a general diabetes-friendly diet',
            dash: 'the DASH dietary pattern', mind: 'the MIND dietary pattern',
            akdeniz: 'the Mediterranean dietary pattern', keto: 'a ketogenic diet',
            low_carb: 'lower-carbohydrate meals', intermittent: 'a light intermittent fasting plan',
            vegan: 'a vegan diet', gluten_free: 'a gluten-free diet',
            anti_inflam: 'an anti-inflammatory dietary pattern'
        };
        const englishFocus = focusByProfile[profile?.id] || focusByProfile.general;
        const englishLabel = profile ? localizedDietProfile(profile, 'en') : 'General Nutrition';
        const profileCode = DIET_INTERNATIONAL_CODES[profile?.id] || 'GEN';
        prompt = `Prepare a one-day list of ${validCount} different foods${cuisineEN[cuisine] || ''}, focusing on ${englishFocus}. ` +
            `Return only valid JSON, without a code fence or additional text. Use the exact profile code "${profileCode}" and label "${englishLabel}". ` +
            `Use this structure: {"lists":[{"code":"${profileCode}","label":${JSON.stringify(englishLabel)},"items":[{"name":"...","unit":"g","step":10,"baseCalories":100,"nutrients":{"protein":4,"carbohydrate":15,"sugar":2,"fat":5,"salt":0.3}}]}]}. ` +
            `Keep these exact property names: lists, code, label, items, name, unit, step, baseCalories, nutrients, protein, carbohydrate, sugar, fat, salt. ` +
            `Use English food names. For unit, use only "g" for foods or "ml" for drinks. ` +
            `For each item provide a positive numeric step and numeric baseCalories in kcal per 100 g or per 100 ml, according to its unit. ` +
            `Use zero calories only for foods or drinks that truly have zero energy; omit items whose calorie value is unknown. ` +
            `Each item also has nutrients: {protein, carbohydrate, sugar, fat, salt}, each in grams per 100 g or 100 ml, estimated values, null when unknown. Sugar is part of carbohydrate. Salt is grams of salt, not sodium.`;
    } else {
        prompt = `${focus} odaklı, ${cuisineTR[cuisine] || ''}${validCount} farklı yemek içeren bir günlük yemek listesi hazırlar mısın?${codeHint} Ayrıca JSON formatında şu yapıda ver: ${AppConfig.JSON_FORMAT}`;
    }
    const field=document.getElementById('dietWizardPrompt'),fallback=document.getElementById('dietWizardFallback');
    field.value=prompt;fallback.hidden=false;
    FoodNutrients.copyPrompt(field).then(copied=>{
        if(!copied){fallback.hidden=false;field.focus();field.select();showToast(window.GLKOAITestLanguage?.currentLang==='en'?'Copy the selected text.':'Seçili metni kopyalayın.','warn');return;}
        fallback.hidden=true;AiWizard.setStage(2);showToast(window.GLKOAITestLanguage?.currentLang==='en'?'Prompt copied.':'İstem kopyalandı.','success');
        window.open(AppConfig.AI_LINKS[selectedAiService]||AppConfig.AI_LINKS.gemini,'_blank','noopener');
    });
}

function showAiModal(promptText, options = {}) {
    const { openAiTab = false, showPasteInstructions = false, successMessage = 'Metin panoya kopyalandı.', onSuccess = null } = options;
    const modal = document.getElementById('aiPromptModal');
    if (modal) modal.style.display = 'none';

    const textArea = document.getElementById('aiPromptOutput');
    if (textArea) textArea.value = promptText;

    const fallbackCopy = () => {
        const tempArea = document.createElement('textarea');
        tempArea.value = promptText;
        tempArea.style.position = 'fixed';
        tempArea.style.top = '-9999px';
        document.body.appendChild(tempArea);
        tempArea.focus();
        tempArea.select();
        const succeeded = document.execCommand('copy');
        document.body.removeChild(tempArea);
        return succeeded;
    };

    const handleSuccess = () => {
        if (typeof onSuccess === 'function') {
            try { onSuccess(); } catch (callbackError) { /* Callback error - no logging */ }
        }
        if (successMessage) showToast(successMessage, 'success');
        if (openAiTab) {
            if (showPasteInstructions) {
                showAiPasteInstructions();
            } else {
                stepTwoOpen();
            }
        }
    };

    const handleFailure = (error) => {
        showToast('Prompt kopyalanamadı, lütfen manuel kopyalayın.', 'error');
        AiWizard.setStage(1);
        if (typeof window.prompt === 'function') {
            window.prompt('Lütfen bu metni kopyalayın ve yapıştırın:', promptText);
        }
    };

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(promptText)
            .then(handleSuccess)
            .catch(err => {
                const fallbackSucceeded = fallbackCopy();
                if (fallbackSucceeded) handleSuccess();
                else handleFailure(err);
            });
    } else {
        const fallbackSucceeded = fallbackCopy();
        if (fallbackSucceeded) handleSuccess();
        else handleFailure(new Error('execCommand failed'));
    }
}

function showAiPasteInstructions() {
    const dialog = document.getElementById('aiPasteInstructions');
    if (!dialog) { stepTwoOpen(); return; }
    const english = window.GLKOAITestLanguage?.currentLang === 'en';
    document.getElementById('aiPasteTitle').textContent = english ? 'Prompt copied' : 'İstem kopyalandı';
    document.getElementById('aiPasteDescription').textContent = english
        ? 'On the AI page, paste the text into the message box and send it.'
        : 'Açılan yapay zekâ sayfasında metni mesaj kutusuna yapıştırıp gönderin.';
    document.getElementById('aiPasteComputer').textContent = english ? 'Computer: Ctrl+V' : 'Bilgisayar: Ctrl+V';
    document.getElementById('aiPastePhone').textContent = english ? 'Phone: touch and hold, then choose Paste.' : 'Telefon: Basılı tutup Yapıştır seçin.';
    document.getElementById('aiPasteOpen').textContent = english ? 'Open AI' : 'Yapay zekâyı aç';
    if (!dialog.open) dialog.showModal();
}

function openAiFromInstructions() {
    document.getElementById('aiPasteInstructions')?.close();
    stepTwoOpen();
}

function resetModalState() {
    const btn1 = document.getElementById('btn-step-1'); const btn2 = document.getElementById('btn-step-2');
    const hint = document.getElementById('step-hint'); const indicator = document.getElementById('step-indicator'); const stamp = document.getElementById('copy-stamp');
    if(stamp) stamp.classList.add('hidden');
    if(btn1) { btn1.className = "w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition shadow-lg shadow-indigo-900/30 relative overflow-hidden group"; btn1.innerHTML = `<span class="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span><span class="tracking-wide text-sm">ANALİZ METNİNİ KOPYALA</span><i class="ph-bold ph-copy text-lg"></i>`; btn1.disabled = false; btn1.style.display = ''; }
    if(btn2) { btn2.className = "w-full bg-slate-800 text-slate-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition cursor-not-allowed opacity-50 border border-slate-700"; btn2.disabled = true; }
    if(indicator) { indicator.innerText = "ADIM 1 / 2: Metni Kopyala"; indicator.className = "text-sm font-bold text-orange-400 mt-1"; }
    if(hint) hint.innerHTML = "Lütfen önce 1. butona basarak metni hafızaya alın.";
}

function stepOneCopy() {
    const copyText = document.getElementById("aiPromptOutput");
    const btn1 = document.getElementById('btn-step-1'); const btn2 = document.getElementById('btn-step-2');
    const hint = document.getElementById('step-hint'); const indicator = document.getElementById('step-indicator'); const stamp = document.getElementById('copy-stamp');
    const isHiddenForCopy = copyText && (copyText.offsetParent === null);
    if(copyText && !isHiddenForCopy) {
        copyText.select();
        copyText.setSelectionRange(0, 99999);
    }
    navigator.clipboard.writeText(copyText?.value || '').then(() => {
        if(stamp) stamp.classList.remove('hidden');
        if(btn1) { btn1.disabled = true; btn1.style.display = 'none'; }
        if(btn2) { btn2.disabled = false; btn2.className = "w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition shadow-xl shadow-violet-900/40 transform hover:scale-[1.02] cursor-pointer border border-white/10 animate-pulse"; }
        if(indicator) { indicator.innerText = "ADIM 2 / 2: Yapay Zekayı Başlat"; indicator.className = "text-base font-bold text-emerald-400 mt-1"; }
        if(hint) {
            hint.className = "text-center text-sm text-slate-300 font-medium bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-inner";
            hint.innerHTML = `<div class="flex flex-col gap-3"><span class="text-emerald-400 font-bold text-base block border-b border-slate-600 pb-2">✅ VERİLERİNİZ HAZIR!</span><div class="text-left space-y-2"><p>Şimdi en alttaki butona basınca site açılacak. O sayfada:</p><p>1. <span class="text-white font-bold">"Bir şeyler yazın"</span> kutusuna tıklayın.</p><p>2. <span class="text-orange-300">Telefonda:</span> Basılı tutup <strong>"Yapıştır"</strong> deyin.</p><p>3. <span class="text-blue-300">Bilgisayarda:</span> Sağ Tıklayıp <strong>"Yapıştır"</strong> deyin.</p><p>4. <strong>Kağıt Uçak (➤)</strong> ikonuna basın.</p></div></div>`;
        }
    }).catch(err => { alert("Kopyalama başarısız. Lütfen metni manuel seçin."); });
}

function stepTwoOpen() { const url = AppConfig.AI_LINKS[selectedAiService] || AppConfig.AI_LINKS['gemini']; window.open(url, '_blank'); }

function showInfoModal(type) {
    const modal = document.getElementById('infoModal'); const title = document.getElementById('infoModalTitle'); const text = document.getElementById('infoModalText');
    modal.style.display = 'flex';
    const messages = {
        'a1c': {t: 'Girilen ölçümlerin ortalaması', b: 'Seçili dönemdeki geçerli glikoz ölçümlerinin aritmetik ortalaması ve sayısıdır. Laboratuvar HbA1c sonucu değildir.'},
        'cv': {t: "Varyasyon Katsayısı (CV)", b: "Kan şekerinizin ne kadar dalgalandığını gösterir. Düşük olması (özellikle %36'nın altı) şekerinizin daha dengeli seyrettiği anlamına gelir."},
        'count': {t: "Kayıt Sayısı", b: "Analize dahil edilen toplam ölçüm sayısıdır. Daha fazla veri, yapay zeka ve istatistiklerin daha doğru sonuç vermesini sağlar."},
        'avg': {t: "Ortalama Tansiyon", b: "Seçilen dönemdeki tüm tansiyon ölçümlerinizin ortalamasıdır. Genel tansiyon seyri hakkında fikir verir."},
        'limit': {t: "Yüksek Tansiyon Yükü", b: "Ölçümlerinizin yüzde kaçının 140/90 mmHg sınırının üzerinde olduğunu gösterir. Bu oranın yüksek olması hipertansiyon kontrolünün yetersiz olabileceğine işaret eder."},
        'abnormal': {t: "Anormal Değerler", b: "Tansiyonun çok düşük (hipotansiyon) veya nabzın anormal (bradikardi/taşikardi) olduğu durumların yüzdesidir."},
        'pp': {t: "Nabız Basıncı", b: "Büyük (sistolik) ve küçük (diyastolik) tansiyon arasındaki farktır. Damar esnekliği hakkında bilgi verir. İdeal aralık genellikle 40-60 mmHg'dir."}
    };
    const tr = value => window.GLKOAITestLanguage ? window.GLKOAITestLanguage.translate(value) : value;
    if(messages[type]) { title.innerText = tr(messages[type].t); text.textContent = tr(messages[type].b); }
    else { title.innerText = tr('Bilgi'); text.innerText = tr('Detaylar için kayıt geçmişine bakınız.'); }
}

function showChartInfo() {
    const modal = document.getElementById('infoModal');
    const title = document.getElementById('infoModalTitle');
    const text = document.getElementById('infoModalText');
    if (!modal || !title || !text) return;
    modal.style.display = 'flex';
    if (window.GLKOAITestLanguage?.currentLang === 'en') {
        title.innerText = 'Chart analysis';
        text.innerHTML = `<div class="space-y-2"><p>This chart shows your recent measurements:</p><ul class="list-disc list-inside text-xs text-slate-400 ml-1 space-y-1"><li><span class="text-blue-400 font-bold">Blue area:</span> Blood glucose level. A flat, horizontal line is ideal.</li><li><span class="text-red-400 font-bold">Red line:</span> Systolic blood pressure.</li><li><span class="text-red-300 font-bold">Pink line:</span> Diastolic blood pressure.</li></ul><p class="mt-2 text-xs italic text-slate-500">Sudden rises and falls may be related to food or stress.</p></div>`;
        return;
    }
    title.innerText = "Grafik Analizi";
    text.innerHTML = `
        <div class="space-y-2">
            <p>Bu grafik son ölçümlerinizin seyrini gösterir:</p>
            <ul class="list-disc list-inside text-xs text-slate-400 ml-1 space-y-1">
                <li><span class="text-blue-400 font-bold">Mavi Alan:</span> Kan şekeri seviyesi. Düz ve yatay olması idealdir.</li>
                <li><span class="text-red-400 font-bold">Kırmızı Çizgi:</span> Büyük tansiyon (Sistolik).</li>
                <li><span class="text-red-300 font-bold">Pembe Çizgi:</span> Küçük tansiyon (Diyastolik).</li>
            </ul>
            <p class="mt-2 text-xs italic text-slate-500">Grafikteki ani yükseliş ve düşüşler, beslenme veya stres kaynaklı olabilir.</p>
        </div>`;
}

function initChartLongPress() {
    const container = document.getElementById('chartContainer');
    if (!container) return;

    let pressTimer;

    const startPress = (e) => {
        if (e.type === 'mousedown' && e.button !== 0) return;
        
        pressTimer = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(50);
            showChartInfo();
        }, 800);
    };

    const cancelPress = () => clearTimeout(pressTimer);

    container.addEventListener('pointerdown', startPress);
    container.addEventListener('pointerup', cancelPress);
    container.addEventListener('pointerleave', cancelPress);
    container.addEventListener('pointercancel', cancelPress);
}

function toggleSmokingDetails() {
    const smokingSelect = document.getElementById('smoking');
    const smokingDetails = document.getElementById('smokingDetails');
    
    if (!smokingSelect || !smokingDetails) return;

    if (smokingSelect.value === 'iciyor' || smokingSelect.value === 'birakti' || smokingSelect.value === 'aralikli') {
        smokingDetails.classList.remove('hidden');
        if (smokingSelect.value === 'iciyor') {
            const end = document.getElementById('smokingEnd');
            if (end) end.value = new Date().getFullYear();
        }
        // Hesaplamayı tetikle
        calculatePackYears();
    } else {
        smokingDetails.classList.add('hidden');
        const amount = document.getElementById('smokingAmount'); if(amount) amount.value = '';
        const start = document.getElementById('smokingStart'); if(start) start.value = '';
        const end = document.getElementById('smokingEnd'); if(end) end.value = '';
        const pack = document.getElementById('smokingPackYears'); if(pack) pack.value = '';
    }
}

function toggleAlcoholDetails() {
    const alcoholSelect = document.getElementById('alcohol');
    const alcoholDetails = document.getElementById('alcoholDetails');
    const socialAlcoholDetails = document.getElementById('socialAlcoholDetails');
    const regularAlcoholDetails = document.getElementById('regularAlcoholDetails');
    const frequentAlcoholDetails = document.getElementById('frequentAlcoholDetails');
    if (!alcoholSelect || !alcoholDetails || !socialAlcoholDetails || !regularAlcoholDetails || !frequentAlcoholDetails) return;
    
    if (alcoholSelect.value !== 'icmiyor' && alcoholSelect.value !== 'yok') {
        if (alcoholSelect.value === 'sosyal') {
            alcoholDetails.classList.add('hidden');
            socialAlcoholDetails.classList.remove('hidden');
            regularAlcoholDetails.classList.add('hidden');
            frequentAlcoholDetails.classList.add('hidden');
        } else if (alcoholSelect.value === 'duzenli') {
            alcoholDetails.classList.add('hidden');
            socialAlcoholDetails.classList.add('hidden');
            regularAlcoholDetails.classList.remove('hidden');
            frequentAlcoholDetails.classList.add('hidden');
            const end = document.getElementById('alcoholEnd');
            if (end) end.value = new Date().getFullYear();
            // Hesaplamayı tetikle
            calculateAlcoholUnits();
        } else if (alcoholSelect.value === 'sik') {
            alcoholDetails.classList.add('hidden');
            socialAlcoholDetails.classList.add('hidden');
            regularAlcoholDetails.classList.add('hidden');
            frequentAlcoholDetails.classList.remove('hidden');
        } else {
            alcoholDetails.classList.remove('hidden');
            socialAlcoholDetails.classList.add('hidden');
            regularAlcoholDetails.classList.add('hidden');
            frequentAlcoholDetails.classList.add('hidden');
            if (alcoholSelect.value === 'duzenli') {
                const end = document.getElementById('alcoholEnd');
                if (end) end.value = new Date().getFullYear();
            }
            // Hesaplamayı tetikle
            calculateAlcoholUnits();
        }
    } else {
        alcoholDetails.classList.add('hidden');
        socialAlcoholDetails.classList.add('hidden');
        regularAlcoholDetails.classList.add('hidden');
        frequentAlcoholDetails.classList.add('hidden');
        const amount = document.getElementById('alcoholAmount'); if(amount) amount.value = '';
        const start = document.getElementById('alcoholStart'); if(start) start.value = '';
        const end = document.getElementById('alcoholEnd'); if(end) end.value = '';
        const duble = document.getElementById('alcoholDoubleYears'); if(duble) duble.value = '';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        // Eğer medColorEditor ise, DOM'dan kaldır
        if (modalId === 'medColorEditor') {
            // parentElement'i kaldırmalıyız çünkü openMedColorEditor'da bir container div'i oluşturmuştuk.
            if(modal.parentElement) {
                setTimeout(() => modal.parentElement.remove(), 300);
            }
        }
    }
}

// Modal butonlarını kontrol et ve düzelt
function checkAndFixModalButtons() {
    const modal = document.getElementById('medicationModal');
    if (!modal) return;
    
    // Modal footer'ını bul veya oluştur
    let modalFooter = modal.querySelector('.modal-footer');
    if (!modalFooter) {
        // Modal footer yoksa, oluştur
        modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        
        // Modal içeriğine footer'ı ekle
        const modalContent = modal.querySelector('div:last-child');
        if (modalContent) {
            modalContent.appendChild(modalFooter);
        }
    }
    
    // medButtonsEdit var mı kontrol et
    let editButtons = document.getElementById('medButtonsEdit');
    if (!editButtons) {
        // medButtonsEdit yoksa, oluştur
        editButtons = document.createElement('div');
        editButtons.id = 'medButtonsEdit';
        editButtons.className = 'hidden grid grid-cols-3 gap-3 mt-6';
        editButtons.innerHTML = `
            <button onclick="deleteMed()" class="py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 flex items-center justify-center gap-2">
                <i class="ph-fill ph-trash"></i>
            </button>
            <button onclick="closeModal('medicationModal')" class="py-3 rounded-xl border border-slate-600 text-slate-300 font-bold hover:bg-slate-700">İptal</button>
            <button onclick="saveMed()" class="py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500">Güncelle</button>
        `;
        modalFooter.appendChild(editButtons);
    }
    
    // medButtonsNormal var mı kontrol et
    let normalButtons = document.getElementById('medButtonsNormal');
    if (!normalButtons) {
        // medButtonsNormal yoksa, oluştur
        normalButtons = document.createElement('div');
        normalButtons.id = 'medButtonsNormal';
        normalButtons.className = 'grid grid-cols-2 gap-3 mt-6';
        normalButtons.innerHTML = `
            <button onclick="closeModal('medicationModal')" class="py-3 rounded-xl border border-slate-600 text-slate-300 font-bold hover:bg-slate-700">İptal</button>
            <button onclick="saveMed()" class="py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500">Kaydet</button>
        `;
        modalFooter.appendChild(normalButtons);
    }
}

// ==========================================
// 13.5 KULLANIM REHBERİ YÖNETİCİSİ
// ==========================================
function openGuideModal() {
    const modal = document.getElementById('guideOverlay');
    if(modal) {
        modal.style.display = 'flex';
        renderGuide();
    }
}

function renderGuide() {
    const container = document.getElementById('guideContent');
    if(!container || typeof APP_GUIDE_DATA === 'undefined') return;
    
    // Önceki pinlenmiş kartı temizle (çift görünüm hatasını önler)
    const guideHeader = document.querySelector('#guideOverlay .guide-header');
    if (guideHeader) {
        guideHeader.innerHTML = '';
    }
    
    const guideEnglish = window.GLKOAITestLanguage?.currentLang === 'en';
    const guideItems = APP_GUIDE_DATA.map((item, index) => guideEnglish && typeof APP_GUIDE_EN !== 'undefined' && APP_GUIDE_EN[index] ? { ...item, ...APP_GUIDE_EN[index] } : item);
    container.innerHTML = guideItems.map((item, index) => `
        <details name="guide-accordion" class="group bg-slate-800/40 border border-slate-700/50 rounded-xl transition-all duration-300 open:bg-slate-800/60" data-guide-id="${item.id}-${index}" data-guide-order="${index}">
            <summary class="flex items-center justify-between p-4 cursor-pointer select-none">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shadow-inner border border-slate-700">
                        <i class="ph-fill ${item.icon} text-2xl ${item.color}"></i>
                    </div>
                    <div>
                        <h4 class="text-sm font-bold text-slate-200 uppercase tracking-wide">${item.title}</h4>
                        <p class="text-[10px] text-slate-500 font-medium">${item.desc}</p>
                    </div>
                </div>
                <i class="ph-bold ph-caret-down text-slate-500 group-open:rotate-180 transition-transform"></i>
            </summary>
            <div class="p-4 pt-0 border-t border-slate-700/30 mt-2 max-h-[400px] overflow-y-auto">
                <div class="mb-3">
                    <h5 class="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider">${guideEnglish ? 'Features' : 'Özellikler'}</h5>
                    <ul class="space-y-1">
                        ${item.features.map(f => `<li class="text-xs text-slate-300 flex items-start gap-2"><i class="ph-bold ph-check text-emerald-500 mt-0.5"></i><span>${f}</span></li>`).join('')}
                    </ul>
                </div>
                <div>
                    <h5 class="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider">${guideEnglish ? 'How to use' : 'Nasıl Kullanılır?'}</h5>
                    <div class="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                        <ul class="space-y-2">
                            ${item.scenarios.map(s => `<li class="text-xs text-slate-400 flex items-start gap-2"><i class="ph-fill ph-arrow-right text-indigo-400 mt-0.5"></i><span>${s}</span></li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        </details>
    `).join('');

    // guideHeader zaten yukarıda tanımlandı, tekrar tanımlamaya gerek yok
    if (!guideHeader) return;

    const panelKey = 'guidePinnedId';

    const placeBackToList = (panel) => {
        panel.classList.remove('guide-pinned');
        const order = parseInt(panel.dataset.guideOrder, 10);
        const siblings = Array.from(container.querySelectorAll('details'));
        const nextSibling = siblings.find(sib => parseInt(sib.dataset.guideOrder, 10) > order);
        if (nextSibling) container.insertBefore(panel, nextSibling);
        else container.appendChild(panel);
        panel.open = false;
    };

    const pinPanel = (panel) => {
        const previouslyPinned = guideHeader.querySelector('details');
        if (previouslyPinned && previouslyPinned !== panel) {
            localStorage.removeItem(panelKey);
            placeBackToList(previouslyPinned);
        }
        localStorage.setItem(panelKey, panel.dataset.guideId);
        panel.classList.add('guide-pinned');
        guideHeader.appendChild(panel);
        panel.open = true;
    };

    const stored = localStorage.getItem(panelKey);
    if (stored) {
        const pinnedPanel = container.querySelector(`[data-guide-id="${stored}"]`);
        if (pinnedPanel) {
            pinPanel(pinnedPanel);
        }
    }

    [...container.querySelectorAll('details'), ...guideHeader.querySelectorAll('details')].forEach(panel => {
        const summary = panel.querySelector('summary');
        if (!summary) return;

        summary.addEventListener('click', (event) => {
            event.preventDefault();
            const isPinned = guideHeader.contains(panel);

            if (isPinned) {
                localStorage.removeItem(panelKey);
                placeBackToList(panel);
                requestAnimationFrame(() => { panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
                return;
            }

            pinPanel(panel);
            requestAnimationFrame(() => { panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        });
    });
}

// ==========================================
// 14. ONBOARDING (KARŞILAMA) YÖNETİCİSİ
// ==========================================
const OnboardingManager = {
    currentSlide: 0,
    slides: (typeof ONBOARDING_SLIDES !== 'undefined') ? ONBOARDING_SLIDES : [],
    
    init() {
        if (!localStorage.getItem('hasSeenOnboarding_v3')) {
            const modal = document.getElementById('onboardingModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
                this.renderSlide(0);
                
                const nextBtn = document.getElementById('btnOnboardingNext');
                if (nextBtn) nextBtn.onclick = () => this.nextSlide();
                
                setTimeout(() => this.preloadImages(), 500);
            }
        }
    },

    // YENİ: Ses Aç/Kapa Fonksiyonu (Buton kaybolmaz, ikon değişir)
    toggleSound(btn) {
        const video = document.getElementById('introVideo');
        const icon = btn.querySelector('i');
        
        if (video) {
            video.muted = !video.muted; // Durumu tersine çevir
            
            if (video.muted) {
                // Sesi Kapattı
                icon.className = "ph-fill ph-speaker-slash text-xl group-hover:scale-110 transition-transform";
                showToast('Sessiz Mod', 'info');
            } else {
                // Sesi Açtı
                icon.className = "ph-fill ph-speaker-high text-xl group-hover:scale-110 transition-transform";
                video.volume = 1.0;
                showToast('Ses Açıldı', 'success');
            }
        }
    },

    renderSlide(index) {
        const currentSlide = this.slides[index];
        const browserLanguage = String(navigator.language || '').toLowerCase().split(/[-_]/)[0];
        let onboardingLanguage = browserLanguage === 'tr' ? 'tr' : 'en';
        try { const saved = localStorage.getItem('glkoaiLanguageTest'); if (saved === 'tr' || saved === 'en') onboardingLanguage = saved; } catch (_) {}
        if (window.GLKOAITestLanguage?.currentLang === 'tr' || window.GLKOAITestLanguage?.currentLang === 'en') onboardingLanguage = window.GLKOAITestLanguage.currentLang;
        const introEnglish = onboardingLanguage === 'en';
        const englishSlides = [
            { title: 'YOU ARE IN CONTROL', desc: 'Start your health journey. <br> Measure, analyze, manage...' },
            { title: 'AI-ASSISTED ANALYSIS', desc: 'Explore your data using an AI service. Review health-related findings with your clinician.' },
            { title: 'Tap the logo to open the guide', desc: 'Explore the features of GLKOAI.' },
            { title: 'Create your clinical profile', desc: 'Keep your information together.<br> Start tracking with GLKOAI...' }
        ];
        const slide = introEnglish ? { ...currentSlide, ...englishSlides[index] } : currentSlide;
        const modal = document.getElementById('onboardingModal');
        const modalInner = modal.firstElementChild; 
        const container = document.getElementById('onboardingContent');
        const footer = modalInner.querySelector('div:last-child');
        
        const isVideo = slide.image && (slide.image.toLowerCase().endsWith('.mp4') || slide.image.toLowerCase().endsWith('.webm'));

        if (isVideo) {
            // --- VİDEO MODU ---
            modalInner.className = "bg-black w-full h-full max-w-none rounded-none shadow-none overflow-hidden relative flex flex-col";
            if(footer) footer.style.display = 'none'; 
            container.className = "p-0 w-full h-full flex items-center justify-center bg-black relative";

            const isLast = index === this.slides.length - 1;
            const nextAction = isLast ? 'OnboardingManager.finish()' : 'OnboardingManager.nextSlide()';
            const nextLabel = introEnglish ? (isLast ? 'START' : 'NEXT') : (isLast ? 'BAŞLA' : 'İLERİ');
            const nextIcon = isLast ? 'ph-check' : 'ph-arrow-right';

            // HTML Şablonu
            container.innerHTML = `
                <div id="videoLoader" class="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
                    <i class="ph-bold ph-spinner animate-spin text-4xl text-indigo-500"></i>
                </div>
                
                <video id="introVideo" 
                       src="${slide.image}" 
                       class="w-full h-full object-cover md:object-contain relative z-10" 
                       style="background-color: black;"
                       playsinline autoplay muted preload="auto">
                </video>
                
                <div id="videoEndOverlay" class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-6 opacity-0 pointer-events-none transition-opacity duration-500 z-20 backdrop-blur-sm">
                    <div class="text-center mb-4 px-6">
                        <h3 class="text-3xl font-black text-white uppercase tracking-widest mb-2">${slide.title}</h3>
                        <p class="text-slate-400 text-sm leading-relaxed">${slide.desc}</p>
                    </div>
                    
                    <button onclick="OnboardingManager.replayVideo()" class="w-64 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold py-4 rounded-2xl backdrop-blur-md transition flex items-center justify-center gap-3 group active:scale-95">
                        <i class="ph-bold ph-arrow-counter-clockwise text-2xl group-hover:-rotate-90 transition-transform"></i>
                        <span>${introEnglish ? 'REPLAY' : 'TEKRAR OYNAT'}</span>
                    </button>
                    
                    <button onclick="${nextAction}" class="w-64 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-900/40 transition flex items-center justify-center gap-3 animate-pulse hover:animate-none hover:scale-105 active:scale-95">
                        <span>${nextLabel}</span>
                        <i class="ph-bold ${nextIcon} text-2xl"></i>
                    </button>
                </div>

                <button id="skipVideoBtn" onclick="${nextAction}" class="absolute top-8 right-6 text-white/80 hover:text-white text-xs font-bold z-40 bg-black/40 px-5 py-2.5 rounded-full backdrop-blur-md border border-white/20 transition-all shadow-lg active:scale-95">${introEnglish ? 'SKIP' : 'ATLA'}</button>
                
                <button id="audioToggleBtn" onclick="OnboardingManager.toggleSound(this)" class="absolute top-8 left-6 text-white/90 hover:text-white z-40 bg-black/40 hover:bg-black/60 p-3 rounded-full backdrop-blur-md border border-white/20 transition-all flex items-center justify-center shadow-lg active:scale-95 group">
                    <i id="audioIcon" class="ph-fill ph-speaker-slash text-xl group-hover:scale-110 transition-transform"></i>
                </button>
            `;

            const video = document.getElementById('introVideo');
            const loader = document.getElementById('videoLoader');
            const overlay = document.getElementById('videoEndOverlay');
            const skipBtn = document.getElementById('skipVideoBtn');
            const btnIcon = document.getElementById('audioIcon');

            // Video Oynatma Mantığı (Loader Yönetimi)
            video.addEventListener('canplay', () => {
                if(loader) loader.style.display = 'none';
            });

            // Video Olayları
            video.addEventListener('ended', () => {
                overlay.classList.remove('opacity-0', 'pointer-events-none');
                skipBtn.style.display = 'none';
                // Ses butonunu bitiş ekranında gizlemek isterseniz:
                const audioBtn = document.getElementById('audioToggleBtn');
                if(audioBtn) audioBtn.style.display = 'none';
            });

            // DÜZELTME 3: Otomatik Ses Açma Denemesi (Hack)
            // HTML yerleştikten hemen sonra çalışır
            setTimeout(() => {
                if (video) {
                    // Önce sesi aç
                    video.muted = false;
                    video.volume = 1.0;
                    
                    // Sonra oynatmayı dene
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            // Başarılı! İkonu 'Sesli' yap
                            if(btnIcon) btnIcon.className = "ph-fill ph-speaker-high text-xl group-hover:scale-110 transition-transform";
                        }).catch(error => {
                            // Tarayıcı izin vermedi, sessize dön
                            video.muted = true;
                            video.play();
                            // İkon zaten 'Sessiz' durumunda, dokunma
                        });
                    }
                }
            }, 100);

        } else {
            // --- STANDART KART MODU ---
            modalInner.className = "h-full w-full flex flex-col justify-between bg-slate-900 p-6";
            
            if(footer) {
                footer.style.display = 'flex';
                footer.className = "flex items-center justify-between w-full mt-auto";
            }
            container.className = "flex-1 w-full flex flex-col min-h-0";

            let visualContent = slide.image ? 
                `<div class="flex-1 w-full flex items-center justify-center min-h-0 py-4"><img src="${slide.image}" class="h-full w-full object-contain rounded-2xl" alt="${slide.title}"></div>` : 
                `<div class="flex-1 w-full flex items-center justify-center min-h-0 py-4"><div class="w-48 h-48 rounded-full ${slide.bg} flex items-center justify-center shadow-lg"><i class="ph-fill ${slide.icon} text-8xl ${slide.color}"></i></div></div>`;

            container.innerHTML = `
                ${visualContent}
                <div class="text-center mb-8">
                    <h1 class="text-2xl font-bold text-white mb-2 uppercase tracking-wide">${slide.title}</h1>
                    <p class="text-slate-400 text-sm font-medium px-2">${slide.desc}</p>
                </div>
            `;
            
            // Noktaları Güncelle
            const dotsContainer = document.getElementById('onboardingDots');
            if(dotsContainer) {
                dotsContainer.innerHTML = this.slides.map((_, i) => 
                    `<div class="h-1.5 rounded-full transition-all duration-300 ${i === index ? 'bg-indigo-600 w-6' : 'bg-slate-600 w-1.5'}"></div>`
                ).join('');
            }

            // Buton Güncelle
            const btn = document.getElementById('btnOnboardingNext');
            if(btn) {
                const baseClass = "px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-lg flex items-center gap-2 active:scale-95";
                if (index === this.slides.length - 1) {
                    btn.innerHTML = `<span>${introEnglish ? 'START' : 'BAŞLA'}</span> <i class="ph-bold ph-check"></i>`;
                    btn.className = baseClass.replace('bg-indigo-600', 'bg-emerald-600');
                } else {
                    btn.innerHTML = `<span>${introEnglish ? 'NEXT' : 'İLERİ'}</span> <i class="ph-bold ph-arrow-right"></i>`;
                    btn.className = baseClass;
                }
            }
        }
    },

    replayVideo() {
        const video = document.getElementById('introVideo');
        const overlay = document.getElementById('videoEndOverlay');
        const skipBtn = document.getElementById('skipVideoBtn');
        const audioBtn = document.getElementById('audioToggleBtn');
        
        if(video) {
            overlay.classList.add('opacity-0', 'pointer-events-none');
            skipBtn.style.display = 'block';
            if(audioBtn) audioBtn.style.display = 'flex'; // Tekrar oynatınca ses butonunu geri getir
            video.currentTime = 0;
            video.play();
        }
    },
    
    nextSlide() {
        if (this.currentSlide < this.slides.length - 1) {
            this.currentSlide++;
            this.renderSlide(this.currentSlide);
        } else {
            this.finish();
        }
    },
    
    finish() {
        document.getElementById('onboardingModal').style.display = 'none';
        localStorage.setItem('hasSeenOnboarding_v3', 'true');
        showToast('Hoş Geldiniz! 👋', 'success');
    },
    
    restart() {
        // Ayarlar menüsünü kapat
        const settingsOverlay = document.getElementById('settingsOverlay');
        if (settingsOverlay) settingsOverlay.style.display = 'none'
        // Onboarding'i sıfırla ve aç
        this.currentSlide = 0;
        const modal = document.getElementById('onboardingModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            this.renderSlide(0);
            const nextBtn = document.getElementById('btnOnboardingNext');
            if (nextBtn) nextBtn.onclick = () => this.nextSlide();
        }
    },

    preloadImages() {
        this.slides.forEach(s => {
            if(s.image && !s.image.endsWith('.mp4')) {
                const img = new Image(); img.src = s.image;
            }
        });
    }
};

// ==========================================
// 15. KART SIRALAMA (SÜRÜKLE BIRAK)
// ==========================================
function initSortableCards() {
    const el = document.getElementById('sortableCards');
    if (!el) return;

    // Kayıtlı sırayı yükle
    const savedOrder = safeParseStorage('cardOrder', []);
    if (savedOrder && Array.isArray(savedOrder)) {
        savedOrder.forEach(id => {
            const item = document.getElementById(id);
            if (item) el.appendChild(item);
        });
    }

    // Sortable başlat
    if (typeof Sortable !== 'undefined') {
        Sortable.create(el, {
            handle: '.drag-handle', // Sadece ikondan tutunca sürükle
            animation: 200, // Yumuşak geçiş animasyonu
            ghostClass: 'opacity-50', // Sürüklenen öğenin gölgesi
            onEnd: function () {
                // Sıralama değişince kaydet
                const order = Array.from(el.children).map(c => c.id);
                localStorage.setItem('cardOrder', JSON.stringify(order));
            }
        });
    }
}

// PERFORMANS DÜZELTMESİ: Tanıtımı video yüklenmesini beklemeden hemen başlat
document.addEventListener('DOMContentLoaded', () => {
    if(typeof OnboardingManager !== 'undefined') OnboardingManager.init();
});

// Global fonksiyon (HTML'den erişim için)
window.closeOnboarding = () => OnboardingManager.finish();

// ==========================================
// 13. BAŞLATMA VE BAĞLANTILAR
// ==========================================

window.onload = function() {
    const SW_VERSION = '20260208-66-228';
    try {
        // [UX] GLOBAL TİTREŞİM (Sadece mobil + kullanıcı etkileşimi + izin verilebilirse)
        let vibrateAvailable = false;
        let vibrateTested = false;
        
        document.addEventListener('pointerdown', (e) => {
            // İlk tıklamada vibrate capability'sini kontrol et
            if (!vibrateTested && navigator.vibrate) {
                vibrateTested = true;
                vibrateAvailable = true;
            }
            
            if (
                e.isTrusted &&
                isMobile() &&
                vibrateAvailable &&
                e.target.closest('button, a, input, select, summary, .clickable, .cat-btn, .act-btn, .food-item-btn')
            ) {
                try {
                    navigator.vibrate(15);
                } catch (err) {
                    vibrateAvailable = false; // Disable future attempts
                }
            }
        });

    const readPersistedVersion = () => {
        try {
            const cacheName = localStorage.getItem('lastCacheName') || '';
            const seq = parseInt(localStorage.getItem('lastBuildSeq') || '0', 10) || 0;
            return { cacheName, seq };
        } catch (_) { return { cacheName: '', seq: 0 }; }
    };

    const persistVersion = (cacheName, seq) => {
        try {
            localStorage.setItem('lastCacheName', cacheName);
            localStorage.setItem('lastBuildSeq', String(seq));
        } catch (_) {}
    };

    const computeBuildSeq = (cacheName) => {
        if (!cacheName) return 0;
        const parts = String(cacheName).split('-');
        const seqPart = parts[parts.length - 1];
        if (/^[0-9]{1,3}$/.test(seqPart)) return parseInt(seqPart, 10);
        return 1;
    };

    const formatCacheLabel = (cacheName, seq) => {
        const raw = String(cacheName || '').trim();
        const parts = raw.split('-');
        const pad = (n, len = 2) => String(n).padStart(len, '0');

        const datePart = parts.find((part) => /^[0-9]{8}$/.test(part)) || '';
        const majorPart = parts.find((part, idx) => idx > 0 && /^[0-9]{2,3}$/.test(part)) || '66';

        if (!datePart) return `${raw} V${majorPart}.${pad(seq || 0, 3)}`;
        const year = Number(datePart.slice(0, 4));
        const month = Number(datePart.slice(4, 6));
        const day = Number(datePart.slice(6, 8));
        if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
            return `${raw} V${majorPart}.${pad(seq || 0, 3)}`;
        }
        const date = `${pad(year % 100)}.${pad(month)}.${pad(day)}`;
        return `${date} V${majorPart}.${pad(seq || 0, 3)}`;
    };

    const updateFooterVersion = (cacheName) => {
        const footerEl = document.getElementById('footerVersion');
        if (footerEl && cacheName) {
            const seq = computeBuildSeq(cacheName);
            const label = formatCacheLabel(cacheName, seq);
            footerEl.textContent = label;
            persistVersion(cacheName, seq);
        }
    };

    const applyStoredCacheName = () => {
        try {
            const { cacheName, seq } = readPersistedVersion();
            if (cacheName && seq) {
                const footerEl = document.getElementById('footerVersion');
                const label = formatCacheLabel(cacheName, seq);
                if (footerEl) footerEl.textContent = label;
            }
        } catch (_) {}
    };

    // Yerel dosya açılışında servis çalışanı etkin olamaz.
    if (location.protocol === 'file:') {
        const footerEl = document.getElementById('footerVersion');
        if (footerEl) footerEl.textContent = 'V66 — yerel dosya (çevrimdışı kurulum etkin değil)';
    }

    // SW'den gerçek cache adını mesajla iste
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.cacheName) {
                updateFooterVersion(event.data.cacheName);
            }
        });

        const requestCacheName = () => {
            const controller = navigator.serviceWorker.controller;
            if (controller) controller.postMessage({ type: 'get-cache-name' });
        };

        if (navigator.serviceWorker.controller) {
            requestCacheName();
        } else {
            navigator.serviceWorker.ready.then(() => requestCacheName());
        }

        // Yedek: Servis worker mesajı gelmezse mevcut cache anahtarını tara
        if ('caches' in window) {
            caches.keys().then((keys) => {
                const latest = keys.filter(k => k.toUpperCase().startsWith('GLKOAI-')).sort();
                const newest = latest[latest.length - 1];
                if (newest) updateFooterVersion(newest);
            }).catch(() => {});
        }
    }

    // İlk yüklemede saklanan son versiyonu uygula
    if (location.protocol !== 'file:') {
        applyStoredCacheName();
        updateFooterVersion(`GLKOAI-${SW_VERSION}`);
    }

    // İLAÇ MİGRASYONU: Eski kayıtlardaki aynı ilaçları birleştir
    migrateMedications();

        DataManager.init();
        UIEnhancer.init();
        TooltipManager.init();

        // Tanıtım içeriği uyarısı (ilk açılışta video/görsel gecikmesi için bilgilendirme)
        try {
            const introNoticeKey = 'introNoticeShown';
            if (!localStorage.getItem(introNoticeKey)) {
                if (typeof showToast === 'function') {
                    showToast('Tanıtım yükleniyor, ilk açılışta birkaç saniye sürebilir.', 'info');
                }
                localStorage.setItem(introNoticeKey, '1');
            }
        } catch (err) { /* localStorage kapalıysa sessiz geç */ }
    initChartLongPress();
    initReportAverageControls();
    document.getElementById('actDuration')?.addEventListener('input', updateSaveButtonVisibility);
    document.getElementById('actGoal')?.addEventListener('input', updateSaveButtonVisibility);

    // UI Dinleyicilerini Başlat (Sadece bir kez)
    document.getElementById('stressLevel')?.addEventListener('input', function() {
        document.getElementById('stressLevelValue').textContent = this.value;
    });
    const sleepEl = document.getElementById('sleepHours');
    if (sleepEl) {
        sleepEl.addEventListener('input', function() {
            const shv = document.getElementById('sleepHoursValue'); if (shv) shv.textContent = this.value;
        });
    }

    if(typeof FoodLibraryManager !== 'undefined') {
        FoodLibraryManager.init();
        migrateFoodLibrary();
    }
    if(typeof AssistantManager !== 'undefined') AssistantManager.init();
    initDietSelectionUI();
    AiWizard.init();
    LabHistoryManager.init();
    initSortableCards(); // Kart sıralamasını başlat
    
    const now = new Date();
    document.getElementById('manualDate').value = [now.getFullYear(), String(now.getMonth()+1).padStart(2,'0'), String(now.getDate()).padStart(2,'0')].join('-');
    const tInput = document.getElementById('manualTime');
    tInput.value = now.toTimeString().slice(0,5);

    // Saat otomatik güncelleme mantığı
    tInput.addEventListener('input', () => { isTimeManuallySet = true; });
    setInterval(() => {
        if (!isTimeManuallySet && !document.body.classList.contains('edit-mode-active')) {
            document.getElementById('manualTime').value = new Date().toTimeString().slice(0,5);
        }
    }, 5000);
    
    // Görünürlük değişimi dinleyicisi (Uygulama ön plana çıkınca anında güncelle)
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === 'visible') {
            schedulePostMealReminder();
            if (!isTimeManuallySet && !document.body.classList.contains('edit-mode-active')) {
                 document.getElementById('manualTime').value = new Date().toTimeString().slice(0,5);
            }
        }
    });

    loadProfile();
    historyViewMode = 1; 
    schedulePostMealReminder();
    
    document.getElementById('eyeIcon').className = 'ph-fill ph-squares-four text-lg text-blue-400';
    document.getElementById('filterBar').style.opacity = '1';
    document.getElementById('filterBar').style.pointerEvents = 'auto';
    

    // Mobilde render işlemlerini güvenli şekilde yap
    if (isMobile()) {
        setTimeout(() => {
            renderList(); 
            renderCustomSymptoms(); 
            renderMainPageMeds();
            updateHeaderStats();
            updateCharts();
        }, 500);
    } else {
        renderList(); 
        renderCustomSymptoms(); 
        renderMainPageMeds();
    }
    
    // Modal butonlarını kontrol et ve düzelt
    checkAndFixModalButtons();

    checkWeeklyBackupReminder();

    // --- MENÜ İŞLEMLERİ ---
    
    // Menü Açma
    const btnOpenMenu = document.getElementById('btnOpenMenu');
    if (btnOpenMenu) btnOpenMenu.onclick = () => document.getElementById('mainMenuOverlay').style.display = 'flex';

    // Hızlı Analiz Butonu (Header)
    const btnHeaderReport = document.getElementById('btnHeaderReport');
    if (btnHeaderReport) btnHeaderReport.onclick = () => {
        const reportSection = document.getElementById('reportSection');
        reportSection.classList.remove('hidden');
        // scrollIntoView forced reflow'sunu önlemek için RAF kullan
        requestAnimationFrame(() => {
            reportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            scheduleAverageFontSync();
        });
    };

    // Raporlar Butonu (Menü)
    const menuBtnReport = document.getElementById('menuBtnReport');
    if (menuBtnReport) menuBtnReport.onclick = () => {
        document.getElementById('mainMenuOverlay').style.display = 'none';
        setMainView('analysis', false);
        const reportSection = document.getElementById('reportSection');
        reportSection.classList.remove('hidden');
        requestAnimationFrame(() => {
            reportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            scheduleAverageFontSync();
        });
    };

    // Rapor Kopyala Butonu (Menü)
    const menuBtnCopy = document.getElementById('menuBtnCopy');
    if (menuBtnCopy) menuBtnCopy.onclick = () => {
        document.getElementById('mainMenuOverlay').style.display = 'none';
        try {
            // includeDailyLogs=false → Binlerce kayıt varsa 4sn+ sürdüğü için optimizasyon
            const report = generateDoctorReport(false);
            navigator.clipboard.writeText(report).then(() => {
                showToast('📋 Doktor Raporu kopyalandı!', 'success');
            }).catch(err => {
                // Fallback
                const textArea = document.createElement('textarea');
                textArea.value = report;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showToast('📋 Doktor Raporu kopyalandı!', 'success');
            });
        } catch (error) {
            showToast('Rapor oluşturulamadı!', 'error');
        }
    };

    // Analiz Yapıştır Butonu (Menü)
    const menuBtnPaste = document.getElementById('menuBtnPaste');
    if (menuBtnPaste) menuBtnPaste.onclick = async () => {
        document.getElementById('mainMenuOverlay').style.display = 'none';
            try {
                const text = await navigator.clipboard.readText();
                if (text && text.trim().length > 0) {
                    renderMarkdownResult(text);
                    showToast('Analiz sonucu görüntülendi', 'success');
                } else {
                    showToast('Pano boş veya metin alınamadı', 'warn');
                }
            } catch (err) {
                // Fallback: Eğer pano izni yoksa kullanıcıdan manuel iste
                const manualInput = prompt("Otomatik yapıştırma başarısız oldu. Lütfen metni buraya yapıştırın:");
                if(manualInput) renderMarkdownResult(manualInput);
            }
    };

    // Yazdır Butonu (Menü)
    const menuBtnPrint = document.getElementById('menuBtnPrint');
    if (menuBtnPrint) menuBtnPrint.onclick = () => window.HealthReport.open('pdf');

    // Ayarlar Butonu (Menü)
    const menuBtnSettings = document.getElementById('menuBtnSettings');
    if (menuBtnSettings) menuBtnSettings.onclick = () => {
        document.getElementById('mainMenuOverlay').style.display = 'none';
        document.getElementById('settingsOverlay').style.display = 'flex';
    };

    // Eski butonların yerine geçen fonksiyonlar (Geriye dönük uyumluluk veya temizlik için)
    const btnToggleReport = document.getElementById('btnToggleReport');
    if (btnToggleReport) btnToggleReport.onclick = () => {
        const reportSection = document.getElementById('reportSection');
        reportSection.classList.toggle('hidden');
        if (!reportSection.classList.contains('hidden')) scheduleAverageFontSync();
    };
    
    const btnCloseReport = document.getElementById('btnCloseReport');
    if (btnCloseReport) btnCloseReport.onclick = () => setMainView('history');
    
    // Profil Butonu
    const btnOpenProfile = document.getElementById('btnOpenProfile');
    if (btnOpenProfile) btnOpenProfile.onclick = () => {
        document.getElementById('mainMenuOverlay').style.display = 'none';
        document.getElementById('profileOverlay').style.display = 'flex';
    };

    if (document.getElementById('cancelEditBtn')) document.getElementById('cancelEditBtn').onclick = () => location.reload();
    if (document.getElementById('resetBtnMain')) document.getElementById('resetBtnMain').onclick = () => location.reload();
    if (document.getElementById('saveButton')) document.getElementById('saveButton').onclick = validateAndSave;
    if (document.getElementById('btnModalCancel')) document.getElementById('btnModalCancel').onclick = ()=>document.getElementById('validationModal').style.display='none';
    if (document.getElementById('btnModalConfirm')) document.getElementById('btnModalConfirm').onclick = validateAndSave;
    if (document.getElementById('targetDisplay')) document.getElementById('targetDisplay').onclick = cycleTargetMode; // Hedef kutusuna tıklama özelliği

    const btnAnalyze = document.getElementById('btnAiAnalyze'); 
    if(btnAnalyze) {
        btnAnalyze.onclick = () => {
            UIEnhancer.showConfirm(
                "Mevcut verilerinizle yapay zeka analizi başlatılacak. Devam edilsin mi?",
                () => DataManager.prepareDataForAI(),
                "Analiz Başlatılıyor",
                "Başlat",
                "bg-indigo-600"
            );
        };
    }
    

    const aiSelect = document.getElementById('aiSelector'); if(aiSelect) aiSelect.onchange = function() { selectAI(this.value); };
    const btnDiet = document.getElementById('btnCopyDiet'); if(btnDiet) btnDiet.onclick = generateAndCopyDiet;

    // Doktor notları karakter sayacı
    // Profil içi dinamik olaylar (Tek seferlik tanımlama)
    document.getElementById('profGender')?.addEventListener('change', function() {
        if (this.value === 'kadın') {
            document.getElementById('gynecologicalSection').classList.remove('hidden');
        } else {
            document.getElementById('gynecologicalSection').classList.add('hidden');
            document.getElementById('gynecologicalHistory').value = '';
        }
    });
    
    // Profil Akordiyon Yönetimi (Tek açık kalma ve otomatik kaydırma)
    const profileDetails = document.querySelectorAll('#profileOverlay details');
    profileDetails.forEach(targetDetail => {
        targetDetail.addEventListener('toggle', () => {
            if (!targetDetail.open) return;

            const parent = targetDetail.parentElement;
            if (parent) {
                Array.from(parent.children)
                    .filter(el => el !== targetDetail && el.tagName === 'DETAILS' && el.hasAttribute('open'))
                    .forEach(openSibling => openSibling.removeAttribute('open'));
            }

        });
    });

    // ==========================================
    // PWA VE GÜNCELLEME YÖNETİMİ
    // ==========================================
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register(`./sw.js?v=${SW_VERSION}`).then(reg => {
            // Güncelleme bulunduğunda
            reg.onupdatefound = () => {
                const installingWorker = reg.installing;
                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Sessizce güncellendi
                    }
                };
            };
        }).catch(err => {
            // Service Worker registration error - no logging
        });

        // SW güncellendiğinde (skipWaiting tetiklendiğinde) sayfayı yenile
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            showToast('Uygulama güncellendi, yenileniyor...', 'success');
            setTimeout(() => window.location.reload(), 1000);
        });
    }

    // Otomatik Yükleme Önerisi (Tarayıcı izin verirse modal açar)
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        const deferredPrompt = e;
        
        // Özel yükleme modalını oluştur
        const div = document.createElement('div');
        div.id = 'pwaInstallModal';
        div.className = 'fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-6 animate-fade-in';
        div.innerHTML = `
            <div class="bg-slate-800 border border-indigo-500/50 p-6 rounded-3xl max-w-sm w-full text-center shadow-2xl relative">
                <button aria-label="Kapat / Close" onclick="document.getElementById('pwaInstallModal').remove()" class="absolute top-3 right-3 text-slate-500 hover:text-white"><i class="ph-bold ph-x text-xl"></i></button>
                <div class="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20"><i class="ph-fill ph-download-simple text-3xl text-indigo-400"></i></div>
                <h3 class="text-xl font-black text-white mb-2"><span lang="en" class="block">INSTALL THE APP</span><span lang="tr" class="block text-sm text-indigo-200 mt-1">UYGULAMAYI YÜKLE</span></h3>
                <div class="text-slate-400 text-sm mb-6 leading-relaxed space-y-2"><p lang="en">Add the app to your device for a full-screen experience.</p><p lang="tr" class="text-xs">Tam ekran deneyimi için uygulamayı cihazınıza ekleyin.</p></div>
                <button id="btnPwaInstall" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black tracking-wide shadow-lg shadow-indigo-900/40 transition-all active:scale-95"><span lang="en" class="block">ADD TO HOME SCREEN</span><span lang="tr" class="block text-xs font-semibold mt-1">ANA EKRANA EKLE</span></button>
            </div>
        `;
        document.body.appendChild(div);
        
        document.getElementById('btnPwaInstall').onclick = () => {
            div.remove();
            deferredPrompt.prompt();
        };
    });

  } catch (err) { alert("Başlatma hatası: " + err.message); }
};
