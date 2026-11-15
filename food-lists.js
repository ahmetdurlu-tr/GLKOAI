/* Listeler yalnızca kullanıcı seçtiğinde yüklenir; mevcut veriler üzerine yazılmaz. */
const FoodLists = {
    catalogs: [
        { id: 'turkey', tr: 'Türkiye', en: 'Türkiye', group: 'country' },
        { id: 'uk', tr: 'Birleşik Krallık', en: 'United Kingdom', group: 'country' },
        { id: 'germany', tr: 'Almanya', en: 'Germany', group: 'country' },
        { id: 'france', tr: 'Fransa', en: 'France', group: 'country' },
        { id: 'italy', tr: 'İtalya', en: 'Italy', group: 'country' },
        { id: 'india', tr: 'Hindistan', en: 'India', group: 'country' },
        { id: 'dash', tr: 'DASH örnek yiyecekleri', en: 'DASH example foods', group: 'diet' },
        { id: 'keto', tr: 'Ketojenik örnek yiyecekler', en: 'Ketogenic example foods', group: 'diet' },
        { id: 'paleo', tr: 'Paleo örnek yiyecekler', en: 'Paleo example foods', group: 'diet' },
        { id: 'low_carb', tr: 'Düşük karbonhidrat örnek yiyecekler', en: 'Lower carbohydrate example foods', group: 'diet' },
        { id: 'low_fat', tr: 'Düşük yağ örnek yiyecekler', en: 'Lower fat example foods', group: 'diet' },
        { id: 'high_protein', tr: 'Yüksek protein örnek yiyecekler', en: 'Higher protein example foods', group: 'diet' },
        { id: 'mediterranean', tr: 'Akdeniz tipi beslenme', en: 'Mediterranean-style eating', group: 'diet' },
        { id: 'vegetarian', tr: 'Vejetaryen', en: 'Vegetarian', group: 'diet' },
        { id: 'vegan', tr: 'Vegan', en: 'Vegan', group: 'diet' }
    ],
    lang() { return window.GLKOAITestLanguage?.currentLang === 'en' ? 'en' : 'tr'; },
    message(tr, en) { return this.lang() === 'en' ? en : tr; },
    read(key, fallback) { try { const result = JSON.parse(localStorage.getItem(key)); return result ?? fallback; } catch (_) { return fallback; } },
    customCatalogs() { const value=this.read('customCuisineLists',[]); return Array.isArray(value)?value.filter(x=>x && typeof x.id==='string' && /^custom_[a-z0-9_-]+$/.test(x.id) && typeof x.tr==='string' && x.tr.trim() && typeof x.en==='string' && x.en.trim()):[]; },
    allCatalogs() { return [...this.catalogs,...this.customCatalogs()]; },
    installed() {
        const valid = new Set(this.allCatalogs().map(list => list.id));
        const selected = this.read('foodListSelection', []);
        const tags = FoodLibraryManager.library.flatMap(food => food.foodListArchived ? [] : (Array.isArray(food.foodListTags) ? food.foodListTags : []));
        return [...new Set([...(Array.isArray(selected) ? selected : []), ...tags])].filter(id => valid.has(id));
    },
    active() {
        const saved = this.read('foodListActive', null), installed = this.installed();
        return Array.isArray(saved) ? saved.filter(id => id === '__manual__' || id === '__database__' || installed.includes(id)) : [...installed, '__manual__', ...(installed.length ? [] : ['__database__'])];
    },
    visible(food, active = this.active()) {
        if (food.foodListArchived) return false;
        const fromList = Array.isArray(food.foodListTags) && food.foodListTags.some(tag => active.includes(tag));
        const manual = !food.foodCatalogId || food.calorieMethod === 'user' || food.source === 'json' || !!food.aiGroup;
        return Boolean(fromList || (manual && active.includes('__manual__')) || FoodLibraryManager.selectedFoods[food.ad]);
    },
    setActive(id, checked) {
        const active = this.active().filter(value => value !== id); if (checked) active.push(id);
        try { localStorage.setItem('foodListActive', JSON.stringify(active)); }
        catch (_) { showToast(this.message('Görünüm kaydedilemedi.', 'Could not save view.'), 'error'); this.renderManager(); return; }
        FoodLibraryManager.renderGrid(document.getElementById('foodSearchInput')?.value || '');
        this.renderManager();
    },
    renderManager() {
        const container = document.getElementById('foodLoadedLists'); if (!container) return;
        container.replaceChildren();
        const active = this.active(), ids = this.installed();
        const rows = this.allCatalogs().filter(list => ids.includes(list.id)).map(list => ({ id: list.id, name: list[this.lang()], color: list.color, removable: true }));
        rows.push({ id: '__manual__', name: this.message('Benim ve diğer yiyeceklerim', 'My and other foods'), removable: false });
        rows.push({ id: '__database__', name: this.message('Diğer yiyeceklerde ara', 'Search other foods'), removable: false });
        rows.forEach(row => {
            const line = document.createElement('div'), label = document.createElement('label'), input = document.createElement('input'), name = document.createElement('span');
            line.className = 'food-loaded-row'; if (/^#[0-9a-f]{6}$/i.test(row.color||'')) line.style.borderLeft='4px solid '+row.color; label.className = 'food-loaded-select'; input.type = 'checkbox'; input.checked = active.includes(row.id);
            input.addEventListener('change', () => this.setActive(row.id, input.checked)); name.textContent = row.name; label.append(input, name); line.appendChild(label);
            if (row.removable) { const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'food-loaded-remove'; remove.setAttribute('aria-label', this.message(`${row.name} listesini kaldır`, `Remove ${row.name} list`)); remove.innerHTML = '<i class="ph-bold ph-trash" aria-hidden="true"></i>'; remove.addEventListener('click', () => this.confirmRemove(row.id)); line.appendChild(remove); }
            container.appendChild(line);
        });
    },
    confirmRemove(id) {
        const info = this.allCatalogs().find(list => list.id === id); if (!info || !this.installed().includes(id)) return;
        const name = info[this.lang()];
        UIEnhancer.showConfirm(this.message(`“${name}” listesi kaldırılsın mı? Ortak ve kendi eklediğiniz yiyecekler ile geçmiş kayıtlar korunur.`, `Remove the “${name}” list? Shared and personal foods and past records will be kept.`), () => this.remove(id), this.message('Listeyi kaldır', 'Remove list'), this.message('Kaldır', 'Remove'));
    },
    remove(id) {
        if (!this.allCatalogs().some(list => list.id === id) || !this.installed().includes(id)) return;
        const ids = this.installed().filter(value => value !== id), active = this.active().filter(value => value !== id);
        const updated = FoodLibraryManager.library.map(item => {
            if (item.foodHistorySnapshot || !Array.isArray(item.foodListTags) || !item.foodListTags.includes(id)) return item;
            const tags = item.foodListTags.filter(tag => tag !== id);
            const archived = !tags.length && !!item.foodCatalogId && item.calorieMethod !== 'user' && item.source !== 'json' && !item.aiGroup;
            return { ...item, foodListTags: tags, foodListArchived: archived };
        });
        const downloaded = this.read('foodListDownloaded', {}); const copies = downloaded && typeof downloaded === 'object' && !Array.isArray(downloaded) ? { ...downloaded } : {}; delete copies[id];
        const keys = ['customFoodLibrary', 'foodListSelection', 'foodListActive', 'foodListDownloaded', 'customCuisineLists']; const previous = keys.map(key => localStorage.getItem(key));
        try {
            localStorage.setItem('customFoodLibrary', JSON.stringify(updated)); localStorage.setItem('foodListSelection', JSON.stringify(ids));
            localStorage.setItem('foodListActive', JSON.stringify(active)); localStorage.setItem('foodListDownloaded', JSON.stringify(copies));
            if(id.startsWith('custom_'))localStorage.setItem('customCuisineLists',JSON.stringify(this.customCatalogs().filter(x=>x.id!==id)));
        } catch (_) {
            keys.forEach((key, index) => { try { if (previous[index] === null) localStorage.removeItem(key); else localStorage.setItem(key, previous[index]); } catch (_) {} });
            showToast(this.message('Liste kaldırılamadı.', 'Could not remove the list.'), 'error'); return;
        }
        FoodLibraryManager.library = updated; this.renderManager(); FoodLibraryManager.renderGrid(document.getElementById('foodSearchInput')?.value || '');
        showToast(this.message('Liste kaldırıldı.', 'List removed.'), 'success');
    },
    open() {
        const dialog = document.getElementById('foodListsDialog'); if (!dialog) return;
        const selected = this.installed();
        for (const group of ['country', 'diet']) {
            const container = document.getElementById(group === 'country' ? 'foodCountryLists' : 'foodDietLists'); container.replaceChildren();
            this.catalogs.filter(list => list.group === group).forEach(list => {
                const label = document.createElement('label'), input = document.createElement('input'), name = document.createElement('span');
                input.type = 'checkbox'; input.value = list.id; input.checked = Array.isArray(selected) && selected.includes(list.id);
                name.textContent = list[this.lang()]; label.append(input, name); container.appendChild(label);
            });
        }
        document.getElementById('foodListsError').hidden = true;
        if (!dialog.open) dialog.showModal();
    },
    close() { document.getElementById('foodListsDialog')?.close(); },
    later() { try { localStorage.setItem('foodListSetupCompleted', '1'); } catch (_) {} this.close(); },
    openWizard() { this.later(); const wizard = document.getElementById('foodWizardDetails'); if (wizard) { wizard.open = true; wizard.scrollIntoView({ behavior: 'smooth', block: 'start' }); } },
    listVersion(id) { const list = this.catalogs.find(list => list.id === id); return list ? (['dash','keto','paleo','low_carb','low_fat','high_protein'].includes(id) ? 1 : ['turkey', 'uk', 'germany', 'france', 'italy', 'india'].includes(id) ? 7 : list.group === 'country' ? 6 : 5) : null; },
    validate(data, id) {
        if (!data || data.id !== id || data.version !== this.listVersion(id) || !Array.isArray(data.items) || data.items.length > 5000) throw new Error('invalid');
        return data.items.map(item => {
            if (!item || typeof item.id !== 'string' || !/^[a-z0-9_-]+$/.test(item.id) || typeof item.tr !== 'string' || !item.tr.trim() || typeof item.en !== 'string' || !item.en.trim() || !['gr', 'ml'].includes(item.unit) || !(typeof item.calories === 'number' && Number.isFinite(item.calories) && item.calories >= 0)) throw new Error('invalid');
            return { ...item };
        });
    },
    // Upgrade downloaded catalog estimates without replacing personal values or historical snapshots.
    async refreshNutritionEstimates() {
        const ids=this.installed().filter(id=>this.catalogs.some(c=>c.id===id));
        if(!ids.length)return;
        const downloaded=this.read('foodListDownloaded',{}), copies=downloaded&&typeof downloaded==='object'&&!Array.isArray(downloaded)?{...downloaded}:{};
        const updates=[];
        for(const id of ids){
            try {
                let data=copies[id];const version=this.listVersion(id);
                if(!data||data.version!==version){const response=await fetch(`./food-lists/${encodeURIComponent(id)}.json?v=${version}`);if(!response.ok)continue;data=await response.json();}
                const items=this.validate(data,id);copies[id]=data;updates.push(...items.map(item=>({...item,_listId:id})));
            } catch(e) { console.warn('Food nutrition update unavailable:',id); }
        }
        if(!updates.length)return;
        // Read the live array only after all awaits, so concurrent user edits are not lost.
        const currentIds=new Set(this.installed());
        const byId=new Map(updates.filter(item=>currentIds.has(item._listId)).map(item=>[item.id,item]));let changed=false;
        const next=FoodLibraryManager.library.map(food=>{
            const item=byId.get(food.foodCatalogId);
            if(!item||food.foodHistorySnapshot||food.foodListArchived)return food;
            if(item.foodGroup && food.foodGroup!==item.foodGroup){food={...food,foodGroup:item.foodGroup};changed=true;}
            if(food.calorieMethod==='user'||['user','user_modified_ai'].includes(food.nutrientSource))return food;
            const nutrients={...(food.nutrients||{})};let itemChanged=false;
            for(const key of FoodNutrients.keys){const v=item.nutrients?.[key];if((nutrients[key]===null||nutrients[key]===undefined)&&v!==null&&v!==undefined&&(key!=='fat'||Number(food.bazKalori)===Number(item.calories))){nutrients[key]=v;itemChanged=true;}}
            if(!itemChanged)return food;changed=true;return {...food,nutrients,nutrientSource:food.nutrientSource||item.nutrientSource};
        });
        // Add new Turkey catalog entries once when upgrading an installed list.
        if(currentIds.has('turkey') && copies.turkey?.version===7 && Number(downloaded?.turkey?.version||0)<7){
            const existingIds=new Set(next.map(food=>food.foodCatalogId));
            for(const item of updates.filter(x=>x._listId==='turkey' && x.id.startsWith('turkey__fish_'))){
                if(existingIds.has(item.id))continue;
                let storageName=item.tr;
                if(next.some(food=>String(food.ad||'').toLocaleLowerCase('tr')===storageName.toLocaleLowerCase('tr')))storageName=`${item.tr} · ${item.id}`;
                next.push({ad:storageName,birim:item.unit,bazKalori:item.calories,katsayi:50,freq:0,foodCatalogId:item.id,foodCatalogNames:{tr:item.tr,en:item.en},foodLocalName:item.localName||null,foodListTags:['turkey'],calorieSource:item.calorieSource,calorieMethod:item.calorieMethod,nutrients:item.nutrients||null,nutrientSource:item.nutrientSource||null,foodGroup:item.foodGroup});changed=true;
            }
        }
        const oldLibrary=localStorage.getItem('customFoodLibrary'),oldDownloads=localStorage.getItem('foodListDownloaded');
        const latestDownloaded=this.read('foodListDownloaded',{});const latestCopies=latestDownloaded&&typeof latestDownloaded==='object'&&!Array.isArray(latestDownloaded)?{...latestDownloaded}:{};
        for(const id of ids) if(currentIds.has(id)&&copies[id]?.version===this.listVersion(id))latestCopies[id]=copies[id];
        try { if(changed)localStorage.setItem('customFoodLibrary',JSON.stringify(next));localStorage.setItem('foodListDownloaded',JSON.stringify(latestCopies)); }
        catch(e){try{if(oldLibrary===null)localStorage.removeItem('customFoodLibrary');else localStorage.setItem('customFoodLibrary',oldLibrary);if(oldDownloads===null)localStorage.removeItem('foodListDownloaded');else localStorage.setItem('foodListDownloaded',oldDownloads);}catch(_){}return;}
        if(changed){FoodLibraryManager.library=next;FoodLibraryManager.renderGrid(document.getElementById('foodSearchInput')?.value||'');}
    },
    async apply(idsOverride = null) {
        const dialog = document.getElementById('foodListsDialog'), button = document.getElementById('foodListsApply'), error = document.getElementById('foodListsError');
        const ids = Array.isArray(idsOverride) ? [...new Set(idsOverride)] : Array.from(dialog.querySelectorAll('.food-list-options input:checked')).map(input => input.value);
        if (!ids.length) { error.textContent = this.message('En az bir liste seçin veya daha sonra seçin.', 'Choose at least one list or choose later.'); error.hidden = false; return false; }
        button.disabled = true; error.hidden = true;
        try {
            let downloaded = this.read('foodListDownloaded', {}); if (!downloaded || typeof downloaded !== 'object' || Array.isArray(downloaded)) downloaded = {};
            const copies = { ...downloaded }, all = [];
            for (const id of ids) {
                if (!this.catalogs.some(list => list.id === id)) throw new Error('invalid');
                let data = copies[id];
                const version = this.listVersion(id);
                if (!data || data.version !== version) { const response = await fetch(`./food-lists/${encodeURIComponent(id)}.json?v=${version}`); if (!response.ok) throw new Error('network'); data = await response.json(); }
                const items = this.validate(data, id); copies[id] = data; items.forEach(item => all.push({ ...item, list: id }));
            }
            const previouslyInstalled = this.installed(), currentActive = this.active();
            const installedIds = [...new Set([...previouslyInstalled, ...ids])];
            const initialDatabase = previouslyInstalled.length === 0 && localStorage.getItem('foodListActive') === null;
            const nextActive = [...new Set([...currentActive.filter(id => !(initialDatabase && id === '__database__')), ...ids.filter(id => !previouslyInstalled.includes(id))])];
            const existing = FoodLibraryManager.library;
            const updated = existing.map(item => ({ ...item, foodListTags: Array.isArray(item.foodListTags) ? [...item.foodListTags] : item.foodListTags }));
            // Remove stale list membership for catalog entries only; retain old records and personal foods.
            for (const id of ids) {
                if (!previouslyInstalled.includes(id)) continue;
                const incomingIds = new Set(all.filter(entry => entry.list === id).map(entry => entry.id));
                updated.forEach(food => {
                    if (!food.foodCatalogId || !Array.isArray(food.foodListTags) || !food.foodListTags.includes(id) || incomingIds.has(food.foodCatalogId)) return;
                    food.foodListTags = food.foodListTags.filter(tag => tag !== id);
                    if (!food.foodListTags.length && food.calorieMethod !== 'user' && food.source !== 'json' && !food.aiGroup) food.foodListArchived = true;
                });
            }
            for (const item of all) {
                const clean = value => String(value || '').trim().toLocaleLowerCase('tr');
                let match = updated.find(food => !food.foodHistorySnapshot && food.foodCatalogId === item.id);
                const isCountryDish = this.catalogs.some(list => list.id === item.list && list.group === 'country');
                // A name alone does not prove two recipes are the same dish.
                if (!match && !isCountryDish) match = updated.find(food => !food.foodHistorySnapshot && !food.foodCatalogId && (clean(food.ad) === clean(item.tr) || clean(food.ad) === clean(item.en)));
                if (match) {
                    match.foodListArchived = false;
                    if (match.foodCatalogId === item.id && item.localName) match.foodLocalName = item.localName;
                    if (match.foodCatalogId === item.id && item.foodGroup) match.foodGroup = item.foodGroup;
                    if (match.foodCatalogId === item.id && item.nutrients && !['user','user_modified_ai'].includes(match.nutrientSource) && match.calorieMethod !== 'user') {
                        const incoming = {...(match.nutrients || {})};
                        for (const key of FoodNutrients.keys) {
                            if ((incoming[key] === null || incoming[key] === undefined) && item.nutrients[key] !== null && item.nutrients[key] !== undefined && (key !== 'fat' || Number(match.bazKalori) === Number(item.calories))) incoming[key] = item.nutrients[key];
                        }
                        match.nutrients = incoming; match.nutrientSource = match.nutrientSource || item.nutrientSource || null;
                    }
                    if (match.foodCatalogId === item.id && match.calorieMethod !== 'user' && item.calorieMethod === 'reference_comparable' && Number(match.bazKalori) === item.calories) { match.calorieSource = item.calorieSource; match.calorieMethod = item.calorieMethod; }
                    const tags = Array.isArray(match.foodListTags) ? match.foodListTags : []; if (!tags.includes(item.list)) match.foodListTags = [...tags, item.list];
                    if (match.foodCatalogId === item.id && (match.bazKalori === null || match.bazKalori === undefined)) {
                        match.bazKalori = item.calories; match.calorieSource = item.calorieSource; match.calorieMethod = item.calorieMethod; match.foodRecipe = item.recipe || null; match.foodPortions = item.portions || [];
                    }
                    continue;
                }
                // `ad` is a historical storage key; keep it unique without changing the visible name.
                let storageName = item.tr;
                if (updated.some(food => clean(food.ad) === clean(storageName))) storageName = `${item.tr} · ${item.id}`;
                updated.push({ ad: storageName, birim: item.unit, bazKalori: item.calories, katsayi: item.unit === 'gr' || item.unit === 'ml' ? 50 : 1, freq: 0, foodCatalogId: item.id, foodCatalogNames: { tr: item.tr, en: item.en }, foodLocalName: item.localName || null, foodListTags: [item.list], calorieSource: item.calorieSource, calorieMethod: item.calorieMethod, foodRecipe: item.recipe || null, foodPortions: item.portions || [], nutrients: item.nutrients || null, nutrientSource: item.nutrientSource || null, foodGroup: item.foodGroup || null, cuisineCategory: item.cuisineCategory || null });
            }
            const keys = ['customFoodLibrary', 'foodListSelection', 'foodListActive', 'foodListDownloaded', 'foodListSetupCompleted'];
            const previous = keys.map(key => localStorage.getItem(key));
            try {
                localStorage.setItem('customFoodLibrary', JSON.stringify(updated));
                localStorage.setItem('foodListSelection', JSON.stringify(installedIds));
                localStorage.setItem('foodListActive', JSON.stringify(nextActive));
                localStorage.setItem('foodListDownloaded', JSON.stringify(copies));
                localStorage.setItem('foodListSetupCompleted', '1');
            } catch (err) { keys.forEach((key, index) => { try { if (previous[index] === null) localStorage.removeItem(key); else localStorage.setItem(key, previous[index]); } catch (_) {} }); throw new Error('storage'); }
            FoodLibraryManager.library = updated; FoodLibraryManager.renderGrid(document.getElementById('foodSearchInput')?.value || '');
            this.renderManager(); if (!Array.isArray(idsOverride)) { this.close(); showToast(this.message('Gıda listeleri eklendi.', 'Food lists added.'), 'success'); }
            return true;
        } catch (err) {
            error.textContent = err.message === 'storage' ? this.message('Listeler kaydedilemedi. Cihazdaki saklama alanını kontrol edin.', 'Could not save lists. Check device storage.') : err.message === 'invalid' ? this.message('Gıda listesi geçersiz. Mevcut yiyecekleriniz korunuyor.', 'Invalid food list. Your existing foods are unchanged.') : this.message('Gıda listesi yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.', 'Could not load the food list. Check your connection and try again.');
            error.hidden = false;
            return false;
        } finally { button.disabled = false; }
    }
};
window.addEventListener('load', () => {
    const section = document.getElementById('nutDetails'); if (!section) return;
    const offer = () => { try { if (section.open && localStorage.getItem('foodListSetupCompleted') !== '1') FoodLists.open(); } catch (_) {} };
    FoodLists.renderManager(); FoodLists.refreshNutritionEstimates().catch(e=>console.warn('Food nutrition update failed',e)); section.addEventListener('toggle', offer); if (section.open) offer();
});
