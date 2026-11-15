/* Personal cuisine lists: each uses its own tag and is included in JSON backups. */
'use strict';
const CustomCuisine = {
 draft:null,
 message(tr,en){return window.GLKOAITestLanguage?.currentLang==='en'?en:tr;},
 error(message){const el=document.getElementById('customCuisineError');el.textContent=message;el.hidden=!message;},
 open(){FoodLists.close();this.draft=null;document.getElementById('customCuisineName').value='';document.getElementById('customCuisineCount').value='10';document.getElementById('customCuisineReply').value='';document.getElementById('customCuisinePrompt').hidden=true;document.getElementById('customCuisineManualOpen').hidden=true;this.back();const dialog=document.getElementById('customCuisineDialog');if(!dialog.open)dialog.showModal();},
 close(){document.getElementById('customCuisineDialog')?.close();this.draft=null;this.mismatchSignature=null;},
 back(){document.getElementById('customCuisineRequest').hidden=false;document.getElementById('customCuisineResponse').hidden=true;this.error('');},
 response(){document.getElementById('customCuisineRequest').hidden=true;document.getElementById('customCuisineResponse').hidden=false;this.error('');document.getElementById('customCuisineReply').focus();},
 createPrompt(name,count){
  const shape={lists:[{code:'MUT',label:name,items:[{ad:'Örnek yemek',birim:'gr',katsayi:50,bazKalori:120,nutrients:{protein:4,carbohydrate:15,sugar:2,fat:5,salt:0.3}}]}]};
  return this.message(`"${name}" mutfağında günlük hayatta yaygın olarak tüketilen ${count} farklı yiyecek ve içecek hazırla. Diğer mutfakları tercüme ederek listeleme; yemekleri bu mutfağa özgü yerel adlarıyla yaz. Yalnızca geçerli JSON döndür. Biçim: ${JSON.stringify(shape)}. Her yemek için birim gr veya ml olsun; kalori kcal, besin değerleri gram cinsinden 100 gr veya 100 ml içindir. Değerler yaklaşık olabilir; bilinmeyen besin değerine null yaz. Şeker karbonhidratın içindedir; tuz sodyum değil tuz gramıdır. Bilinmeyen kalori için yemek ekleme ve kaynak uydurma.`,`Prepare ${count} foods and drinks commonly consumed in ${name}. Use their local cuisine names, not translated versions of another cuisine. Return only JSON: ${JSON.stringify(shape)}. Use gr or ml; calories in kcal and nutrients in grams per 100 g or 100 ml. Values are estimates; unknown nutrients must be null. Sugar is part of carbohydrate; salt means salt in grams, not sodium. Omit foods with unknown calories and do not invent sources.`);
 },
 async copyAndOpen(){
  const name=document.getElementById('customCuisineName').value.trim();const count=Number(document.getElementById('customCuisineCount').value);const service=document.getElementById('customCuisineAi').value;
  if(!name||!Number.isInteger(count)||count<3||count>30){this.error(this.message('Mutfak adını ve 3–30 arasında yiyecek sayısını girin.','Enter a cuisine name and a food count from 3 to 30.'));return;}
  const existing=FoodLists.allCatalogs().some(x=>[x.tr,x.en].some(n=>String(n).trim().toLocaleLowerCase('tr')===name.toLocaleLowerCase('tr')));
  if(existing){this.error(this.message('Bu isimle bir liste zaten var.','A list with this name already exists.'));return;}
  this.draft={name,count,service};const prompt=document.getElementById('customCuisinePrompt');prompt.hidden=false;prompt.value=this.createPrompt(name,count);const copied=await FoodNutrients.copyPrompt(prompt);
  if(!copied){this.error(this.message('İstem seçildi. Kopyalayıp YAPAY ZEKÂYI AÇ düğmesine basın.','Copy the selected prompt and select OPEN AI.'));document.getElementById('customCuisineManualOpen').hidden=false;return;}
  this.response();showToast(this.message('İstem kopyalandı.','Prompt copied.'),'success');window.open(AppConfig.AI_LINKS[service]||AppConfig.AI_LINKS.gemini,'_blank','noopener');
 },
 manualOpen(){if(!this.draft)return;this.response();window.open(AppConfig.AI_LINKS[this.draft.service]||AppConfig.AI_LINKS.gemini,'_blank','noopener');},
 save(){
  if(!this.draft){this.back();return;}
  try{
   const raw=document.getElementById('customCuisineReply').value;const parsed=FoodLibraryManager._parseImportedJson(raw);const groups=parsed&&FoodLibraryManager._extractJsonGroups(parsed);
   if(!Array.isArray(groups)||!groups.length)throw Error('format');
   const input=groups.flatMap(g=>g.items||[]);if(!input.length||input.length>100)throw Error('count');
   const signature=this.draft.name+'|'+this.draft.count+'|'+raw;
   if(input.length!==this.draft.count&&this.mismatchSignature!==signature){this.mismatchSignature=signature;this.error(this.message(`${this.draft.count} yiyecek istendi, yanıtta ${input.length} bulundu. Yine de eklemek için tekrar MUTFAĞI EKLE'ye basın.`,`Requested ${this.draft.count} foods, found ${input.length}. Select ADD CUISINE again to continue.`));return;}
   const normalized=input.map(item=>FoodLibraryManager._normalizeEnglishFood(item));const seen=new Set();
   const clean=normalized.map(item=>{if(!item||typeof item.ad!=='string'||!item.ad.trim())throw Error('name');const name=item.ad.trim();const key=name.toLocaleLowerCase('tr');if(seen.has(key))throw Error('duplicate');seen.add(key);const unit=SmartParser.normalizeUnit(item.birim);if(!unit)throw Error('unit');const calories=FoodNutrients.read(item.bazKalori);if(calories===null||Number.isNaN(calories))throw Error('calorie');return {name,unit,calories,nutrients:FoodNutrients.validate(item.nutrients||{})};});
   const catalogs=FoodLists.customCatalogs();if(FoodLists.allCatalogs().some(x=>[x.tr,x.en].some(n=>String(n).toLocaleLowerCase('tr')===this.draft.name.toLocaleLowerCase('tr'))))throw Error('existing');
   const id='custom_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);const colors=['#fb923c','#a78bfa','#2dd4bf','#f472b6','#60a5fa','#facc15'];const color=colors[catalogs.length%colors.length];
   const meta={id,tr:this.draft.name,en:this.draft.name,group:'custom',color};const existing=FoodLibraryManager.library.map(item=>({...item}));const names=new Set(existing.map(x=>String(x.ad||'').toLocaleLowerCase('tr')));
   const added=clean.map((item,index)=>{let key=item.name,suffix=0;while(names.has(key.toLocaleLowerCase('tr')))key=item.name+' · '+id+(++suffix>1?' '+suffix:'');names.add(key.toLocaleLowerCase('tr'));return {ad:key,foodLocalName:item.name,foodOriginalName:item.name,birim:item.unit,bazKalori:item.calories,katsayi:isFoodMetricUnit(item.unit)?50:1,freq:0,foodCatalogId:id+'_'+index,foodListTags:[id],source:'custom-cuisine',nutrients:item.nutrients,nutrientSource:'ai_estimate',cuisineColor:color};});
   const selected=FoodLists.installed(),active=FoodLists.active();const keys=['customFoodLibrary','customCuisineLists','foodListSelection','foodListActive','foodListSetupCompleted'];const before=keys.map(k=>localStorage.getItem(k));
   try{localStorage.setItem(keys[0],JSON.stringify([...existing,...added]));localStorage.setItem(keys[1],JSON.stringify([...catalogs,meta]));localStorage.setItem(keys[2],JSON.stringify([...new Set([...selected,id])]));localStorage.setItem(keys[3],JSON.stringify([...new Set([...active,id])]));localStorage.setItem(keys[4],'1');}catch(e){keys.forEach((k,i)=>{try{if(before[i]===null)localStorage.removeItem(k);else localStorage.setItem(k,before[i]);}catch(_){}});throw Error('storage');}
   FoodLibraryManager.library=[...existing,...added];this.close();FoodLists.renderManager();FoodLibraryManager.renderGrid(document.getElementById('foodSearchInput')?.value||'');showToast(this.message(`${added.length} yiyecek eklendi.`,`${added.length} foods added.`),'success');
  }catch(e){this.error(e.message==='storage'?this.message('Kaydedilemedi.','Could not save.'):e.message==='existing'?this.message('Bu isimle liste zaten var.','This list already exists.'):this.message('Yanıt okunamadı. Yemek adlarını, birimleri ve kalori bilgilerini kontrol edin.','Could not read the response. Check names, units and calories.'));}
 }
};
window.CustomCuisine=CustomCuisine;
