/* Approximate, explicitly sourced nutrient values; unknown stays null. */
'use strict';
const FoodNutrients = {
  keys:['protein','carbohydrate','sugar','fat','salt'],
  read(value) { if(value===null||value===undefined||String(value).trim()==='') return null; const n=Number(String(value).replace(',','.')); return Number.isFinite(n)&&n>=0?n:NaN; },
  validate(raw) { const values={}; for(const k of this.keys){ values[k]=this.read(raw?.[k]); if(Number.isNaN(values[k])) throw new Error('invalid_'+k); } if(values.sugar!==null&&values.carbohydrate!==null&&values.sugar>values.carbohydrate+0.05) throw new Error('sugar_exceeds_carbs'); return values; },
  calculate(food,amount) { const factor=Number(amount)/(isFoodMetricUnit(food?.birim)?100:1); if(!Number.isFinite(factor)||factor<0)return null; const result={}; for(const k of this.keys){const base=this.read(food?.nutrients?.[k]); const grams=base===null||Number.isNaN(base)?null:base*factor; result[k]={grams,score:grams===null?null:grams/10};} return result; },
  describe(food,amount,en){
    const values=this.calculate(food,amount);if(!values)return '';
    const labels={protein:'Protein',carbohydrate:en?'Carbohydrate':'Karbonhidrat',sugar:en?'Sugar':'Şeker',fat:en?'Fat':'Yağ',salt:en?'Salt':'Tuz'};
    const known=this.keys.filter(k=>values[k].score!==null);
    const cells=this.keys.map(k=>`<div class="food-nutrient-item food-nutrient-${k}"><span>${labels[k]}</span><strong>${values[k].score===null?'—':Number(values[k].score.toFixed(2)).toLocaleString(en?'en-US':'tr-TR')}</strong></div>`).join('');
    const ai=String(food.nutrientSource||'').startsWith('ai_estimate');
    return `<section class="food-nutrient-card" aria-label="${en?'Nutrient information':'Besin bilgileri'}"><div class="food-nutrient-head"><span><i class="ph-bold ph-bowl-food" aria-hidden="true"></i> ${en?'NUTRIENT INFORMATION':'BESİN BİLGİLERİ'}</span><button type="button" class="food-nutrient-info" data-nutrient-info aria-label="${en?'Show information about these values':'Bu değerler hakkında bilgi göster'}">${ai?(en?'AI estimate':'YZ tahmini'):(en?'Approximate':'Yaklaşık')} <i class="ph-bold ph-info" aria-hidden="true"></i></button></div><div class="food-nutrient-caption">${en?'Approximate points for selected amount':'Seçilen miktar için yaklaşık puan'}</div><div class="food-nutrient-grid">${cells}</div>${known.length<this.keys.length?`<div class="food-nutrient-missing">${en?'— indicates missing information.':'— eksik bilgiyi gösterir.'}</div>`:''}</section>`;
  },
  showInfo(food) {
    const en=window.GLKOAITestLanguage?.currentLang==='en';
    const source=String(food?.nutrientSource||'');
    const ai=source.startsWith('ai_estimate');
    const dialog=document.getElementById('foodNutrientInfoDialog');
    const title=document.getElementById('foodNutrientInfoTitle');
    const content=document.getElementById('foodNutrientInfoText');
    const done=document.getElementById('foodNutrientInfoDone');
    if(!dialog||!title||!content||!done)return;
    title.textContent=ai?(en?'AI estimate':'YZ tahmini'):(en?'Approximate values':'Yaklaşık değerler');
    content.textContent=ai
      ? (source==='ai_estimate_energy_derived_fat'
        ? (en?'These are unverified AI estimates. Fat is derived from estimated calories.':'Bu değerler doğrulanmamış yapay zekâ tahminleridir. Yağ değeri yaklaşık kaloriden türetilmiştir.')
        : (en?'These nutrition values are approximate AI estimates and have not been independently verified.':'Bu besin değerleri yaklaşık yapay zekâ tahminleridir ve bağımsız olarak doğrulanmamıştır.'))
      : (en?'These nutrition values are approximate and depend on the available or entered information.':'Bu besin değerleri yaklaşıktır; mevcut veya girilen bilgilere dayanır.');
    done.textContent=en?'DONE':'TAMAM';
    if(!dialog.open)dialog.showModal();
  },
  snapshot(food,amount){const water=food.foodIsWater===true||['su','water'].includes(String(food.ad||'').trim().toLocaleLowerCase('tr')); const nutrients=water?Object.fromEntries(this.keys.map(k=>[k,0])):this.validate(food.nutrients); return {name:food.ad,unit:food.birim,amount:Number(amount),nutrients:{...nutrients},calories:water?0:this.read(food.bazKalori),isWater:water,basis:isFoodMetricUnit(food.birim)?100:1,estimated:true,source:food.nutrientSource||null,foodCatalogId:food.foodCatalogId||null,foodGroup:food.foodGroup||null};},
  async copyPrompt(field) {
    // Copy while the dialog still has focus; HTTP LAN pages may not expose Clipboard API.
    field.focus(); field.select();
    try { if(typeof document.execCommand==='function' && document.execCommand('copy')) return true; } catch (_) {}
    try { if(navigator.clipboard?.writeText){ await navigator.clipboard.writeText(field.value); return true; } } catch (_) {}
    field.focus(); field.select(); return false;
  },
  prompt(name,unit){const en=window.GLKOAITestLanguage?.currentLang==='en'; const basis=isFoodMetricUnit(unit)?(unit==='ml'?'100 ml':'100 g'):(en?'one '+unit:'1 '+unit);const schema=JSON.stringify({ad:name,birim:unit,bazKalori:120,nutrients:{protein:4,carbohydrate:15,sugar:2,fat:5,salt:0.3},nutrientSource:'approximate estimate'});return en?`Estimate nutrition for ${name}, ${basis}. Return only a JSON object with the following keys and numeric kcal and grams: ${schema}. All fields must refer to ${basis}; sugar is part of carbohydrate, salt is salt (not sodium). Provide approximate values, not invented sources; use null if unknown. Keep the same food name and unit.`:`${name} için ${basis} başına yaklaşık besin bilgilerini tahmin et. Sadece JSON nesnesi döndür; örnek şema: ${schema}. Sayısal değerler kcal ve gramdır. Tüm değerler ${basis} içindir. Şeker karbonhidratın içindedir; tuz alanı sodyum değil tuz gramıdır. Yaklaşık değer ver, kaynak uydurma; bilmediğine null yaz. Yemek adını ve birimi değiştirme.`; },
  parse(text,food){let raw=String(text||'').trim().replace(/```(?:json)?/gi,'').replace(/```/g,'').trim();try{return this.normalize(JSON.parse(raw),food);}catch(e){let a=raw.indexOf('{'),b=raw.lastIndexOf('}');if(a<0||b<=a)throw e;return this.normalize(JSON.parse(raw.slice(a,b+1)),food);}},
  normalize(obj,food){if(obj?.lists?.[0]?.items?.[0])obj=obj.lists[0].items[0];if(!obj||typeof obj!=='object')throw new Error('invalid');const name=String(obj.ad||obj.name||'').trim();if(name&&name.toLocaleLowerCase('tr')!==String(food.foodLocalName||food.ad).trim().toLocaleLowerCase('tr'))throw new Error('name_mismatch');const unit=SmartParser.normalizeUnit(obj.birim||obj.unit||food.birim);if(unit!==SmartParser.normalizeUnit(food.birim))throw new Error('unit_mismatch');const calories=this.read(obj.bazKalori??obj.baseCalories);if(calories===null||Number.isNaN(calories))throw new Error('calories');return {calories,nutrients:this.validate(obj.nutrients||obj)};},
};
window.FoodNutrients=FoodNutrients;
function renderPendingFoodPanel(panel,food,selection){
 const en=window.GLKOAITestLanguage?.currentLang==='en',t=(tr,eng)=>en?eng:tr,d=FoodLibraryManager.pendingFoodDraft;
 const label=isFoodMetricUnit(food.birim)?(food.birim==='ml'?'/ 100 ml':'/ 100 g'):(en?'/ unit':'/ birim');
 const val=x=>x===null||x===undefined?'':escapeHtml(String(x));
 const fields=[['protein','Protein'],['carbohydrate',t('Karbonhidrat','Carbohydrate')],['sugar',t('Toplam şeker','Total sugars')],['fat',t('Yağ','Fat')],['salt',t('Tuz','Salt')]];
 panel.innerHTML=`<div class="food-editor-heading"><div class="ep-title">${escapeHtml(food.foodLocalName||food.ad)}</div><button type="button" class="food-edit-action" onclick="FoodLibraryManager.closePanel()" aria-label="${t('Kapat','Close')}">✕</button></div><div class="editor-panel-inner"><button type="button" class="ep-btn ep-style-green" onclick="FoodLibraryManager.changeAmount(-1)" aria-label="${t('Azalt','Decrease')}">−</button><div class="ep-center"><div class="ep-val-big">${Number(selection.count)}</div><div class="ep-val-label">${escapeHtml(selection.unit)}</div></div><button type="button" class="ep-btn ep-style-red" onclick="FoodLibraryManager.changeAmount(1)" aria-label="${t('Artır','Increase')}">+</button></div><div class="food-new-details"><div id="newFoodFields"><label>${t('Birim','Unit')}<select id="newFoodUnit">${['Porsiyon','Adet','Dilim','Kase','Bardak','Fincan','gr','ml'].map(u=>`<option value="${u}" ${selection.unit===u?'selected':''}>${u}</option>`).join('')}</select></label>${d.unitChanged?`<p class="food-amount-warning" role="status">${t('Birim değişti; değerleri yeni birime göre kontrol edin.','Unit changed; check values for the new unit.')}</p>`:''}<p class="food-new-note">${t('Yaklaşık besin değerleri','Approximate nutrition')} <b>${label}</b></p><div class="food-new-grid"><label>${t('Kalori','Calories')} (kcal)<input type="number" id="newFoodCalories" min="0" step="any" inputmode="decimal" value="${val(d.calories)}" required></label>${fields.map(([k,l])=>`<label>${l} (g)<input type="number" data-nutrient="${k}" min="0" step="any" inputmode="decimal" value="${val(d.nutrients[k])}"></label>`).join('')}</div><p class="food-new-note">${t('Şeker toplam karbonhidratın içindedir. Bilinmeyen değerleri boş bırakın.','Sugar is included in total carbohydrate. Leave unknown values blank.')}</p></div><details class="food-ai-inline" ${d.aiOpen?'open':''} ${d.aiStep==='done'?'hidden':''}><summary>✦ ${t('YAPAY ZEKÂ İLE BESİN BİLGİLERİ','GET NUTRITION WITH AI')}</summary><div id="newFoodRequest"><label>${t('Yapay zekâ','AI service')}<select id="newFoodAi">${[['gemini','Gemini'],['chatgpt','ChatGPT'],['claude','Claude'],['deepseek','DeepSeek'],['grok','Grok']].map(([k,v])=>`<option value="${k}" ${d.aiService===k?'selected':''}>${v}</option>`).join('')}</select></label><p class="food-new-note">${t('İstemi kopyalayıp yapay zekâya gönderin; gelen cevabı aşağıya yapıştırın.','Copy the prompt to the AI service and paste the reply below.')}</p><textarea id="newFoodPrompt" rows="3" readonly></textarea><button type="button" id="newFoodCopy" class="food-ai-action">${t('İSTEMİ KOPYALA VE AÇ','COPY PROMPT AND OPEN')}</button><button type="button" id="newFoodOpen" class="food-ai-action" hidden>${t('YAPAY ZEKÂYI AÇ','OPEN AI')}</button></div><div id="newFoodResponse" hidden><p class="food-new-note">${t('Yapay zekâ cevabını aşağıya yapıştırın.','Paste the AI reply below.')}</p><textarea id="newFoodReply" rows="4" placeholder="${t('Yapay zekâ cevabını buraya yapıştırın','Paste the AI reply here')}">${val(d.reply)}</textarea><button type="button" id="newFoodApply" class="food-ai-action">${t('CEVABI ALANLARA AKTAR','FILL THE FIELDS')}</button></div></details><p id="newFoodError" class="food-amount-warning" role="status" hidden></p></div><div class="food-editor-actions"><button type="button" class="food-remove-selection" onclick="FoodLibraryManager.cancelAmountPanel()">${t('İPTAL','CANCEL')}</button><button type="button" class="ep-ok-btn" onclick="FoodLibraryManager.finishPanel()">✓ ${t('TAMAM','DONE')}</button></div>`;
 const unit=panel.querySelector('#newFoodUnit');unit.addEventListener('change',()=>{if(unit.value!==food.birim&&(d.calories!==''||Object.values(d.nutrients).some(v=>v!==''))){panel.querySelector('#newFoodError').hidden=false;panel.querySelector('#newFoodError').textContent=t('Birim değişti; değerleri yeni birime göre kontrol edin.','Unit changed; check values for the new unit.');}d.unitChanged=true;food.birim=unit.value;selection.unit=unit.value;selection.count=isFoodMetricUnit(unit.value)?100:1;FoodLibraryManager.updateEditorPanel();});
 panel.querySelector('#newFoodCalories').addEventListener('input',e=>{d.calories=e.target.value;if(d.source==='ai_estimate')d.source='user_modified_ai';});
 panel.querySelectorAll('[data-nutrient]').forEach(el=>el.addEventListener('input',e=>{d.nutrients[e.target.dataset.nutrient]=e.target.value;if(d.source==='ai_estimate')d.source='user_modified_ai';}));
 const details=panel.querySelector('.food-ai-inline');
 const syncStage=()=>{const active=details.open&&d.aiStep!=='done';panel.querySelector('#newFoodFields').hidden=active;panel.querySelector('.ep-ok-btn').hidden=active;panel.querySelector('.food-remove-selection').hidden=active;panel.querySelector('#newFoodRequest').hidden=active&&d.aiStep==='reply';panel.querySelector('#newFoodResponse').hidden=!active||d.aiStep!=='reply';};
 details.addEventListener('toggle',()=>{d.aiOpen=details.open;syncStage()});
 syncStage();
 panel.querySelector('#newFoodAi').addEventListener('change',e=>d.aiService=e.target.value);
 const prompt=panel.querySelector('#newFoodPrompt');prompt.value=FoodNutrients.prompt(food.foodLocalName||food.ad,food.birim);
 panel.querySelector('#newFoodReply').addEventListener('input',e=>d.reply=e.target.value);
 panel.querySelector('#newFoodCopy').addEventListener('click',async()=>{
  const copied=await FoodNutrients.copyPrompt(prompt);
  const error=panel.querySelector('#newFoodError');
  panel.querySelector('#newFoodOpen').hidden=false;
  if(!copied){error.hidden=false;error.textContent=t('Otomatik kopyalanamadı. Seçili metni kopyalayın, ardından düğmeye tekrar basın veya yapay zekâyı kendiniz açın.','Could not copy automatically. Copy the selected text, then retry or open the AI service yourself.');return;}
  error.hidden=true;d.aiStep='reply';syncStage();showToast(t('İstem kopyalandı.','Prompt copied.'),'success');
  const link=AppConfig.AI_LINKS[d.aiService]||AppConfig.AI_LINKS.gemini;
  window.open(link,'_blank','noopener');
 });
 panel.querySelector('#newFoodOpen').addEventListener('click',()=>{d.aiStep='reply';syncStage();panel.querySelector('#newFoodError').hidden=true;window.open(AppConfig.AI_LINKS[d.aiService]||AppConfig.AI_LINKS.gemini,'_blank','noopener');});
 panel.querySelector('#newFoodApply').addEventListener('click',()=>{try{const x=FoodNutrients.parse(d.reply,food);d.calories=String(x.calories);for(const k of FoodNutrients.keys)d.nutrients[k]=x.nutrients[k]===null?'':String(x.nutrients[k]);d.source='ai_estimate';d.aiStep='done';d.aiOpen=false;FoodLibraryManager.updateEditorPanel();showToast(t('Değerler aktarıldı.','Values filled.'),'success');}catch(e){const err=panel.querySelector('#newFoodError');err.hidden=false;err.textContent=t('Yanıt okunamadı. Yemek adını, birimi, kaloriyi ve değerleri kontrol edin.','Could not read reply. Check name, unit, calories and values.');}});
 panel.classList.remove('hidden');const dialog=document.getElementById('foodEditorDialog');if(dialog&&!dialog.open)dialog.showModal();
}
