/* Kullanıcının kendi seçtiği beslenme ve öğün düzeni; tıbbi plan üretmez. */
'use strict';
const DietPlan = (() => {
 const options = [
  {title:['Beslenme biçimleri','Eating patterns'],items:[['mediterranean','Akdeniz tipi','Mediterranean'],['dash','DASH','DASH'],['vegetarian','Vejetaryen','Vegetarian'],['vegan','Vegan','Vegan'],['keto','Ketojenik','Ketogenic'],['paleo','Paleo','Paleo'],['low_gi','Düşük glisemik indeks','Low glycemic index']]},
  {title:['Besin hedefleri','Nutrition goals'],items:[['calorie_control','Kalori kontrolü','Calorie tracking'],['low_carb','Düşük karbonhidrat','Low carbohydrate'],['low_fat','Düşük yağ','Low fat'],['high_protein','Yüksek protein','High protein']]},
  {title:['Özel beslenme planları','Special eating plans'],items:[['diabetes','Diyabet','Diabetes'],['kidney','Böbrek','Kidney'],['liver','Karaciğer','Liver'],['gluten_free','Glutensiz','Gluten free'],['lactose_free','Laktozsuz','Lactose free'],['fodmap','Düşük FODMAP','Low FODMAP'],['allergy','Alerji eliminasyonu','Allergy elimination'],['personal','Kişisel plan','Personal plan']]}
 ];
 const ids = new Set(options.flatMap(g=>g.items.map(x=>x[0])));
 const readyLists = new Set(['mediterranean','vegetarian','vegan','dash','keto','paleo','low_carb','low_fat','high_protein']);
 const wizardProfiles = {mediterranean:'akdeniz',dash:'dash',keto:'keto',low_carb:'low_carb',low_gi:'low_gi',diabetes:'diabetic',vegan:'vegan',gluten_free:'gluten_free'};
 const en=()=>window.GLKOAITestLanguage?.currentLang==='en';
 const t=(tr,eng)=>en()?eng:tr;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const profile=()=>DataManager.getProfile()||{};
 function updateSummary(){
  const node=document.getElementById('dietPlanSummary');if(!node)return;
  const p=profile(),d=p.dietPlan||{},labels=options.flatMap(g=>g.items).filter(x=>Array.isArray(d.selected)&&d.selected.includes(x[0])).map(x=>x[en()?2:1]);
  const modes={free:t('Serbest','Flexible'),meals:t('Öğün sayısı','Meal count'),window:t('Zaman aralığı','Eating window'),weekly:t('Haftalık düzen','Weekly schedule')};
  if(d.mealMode&&d.mealMode!=='free'&&modes[d.mealMode])labels.push(modes[d.mealMode]);
  if(Number(p.calorieTarget)>0)labels.push(`${Math.round(Number(p.calorieTarget))} kcal`);
  node.textContent=labels.length?labels.join(' · '):t('Henüz diyet veya öğün düzeni seçilmedi.','No diet or meal schedule selected yet.');
 }
 function open(){
  const dialog=document.getElementById('dietPlanDialog'),body=document.getElementById('dietPlanBody');if(!dialog||!body)return;
  const p=profile(),d=p.dietPlan||{},selected=Array.isArray(d.selected)?d.selected:[],mode=['free','meals','window','weekly'].includes(d.mealMode)?d.mealMode:'free';
  const cards=options.map((g,index)=>`<details class="diet-plan-group" ${index===0?'open':''}><summary>${esc(g.title[en()?1:0])}</summary><div class="diet-plan-choices">${g.items.map(([id,tr,eng])=>`<label><input type="checkbox" name="dietChoice" value="${id}" ${selected.includes(id)?'checked':''}><span>${esc(t(tr,eng))}</span></label>`).join('')}</div></details>`).join('');
  const weekdays=[['1','Pzt','Mon'],['2','Sal','Tue'],['3','Çar','Wed'],['4','Per','Thu'],['5','Cum','Fri'],['6','Cmt','Sat'],['0','Paz','Sun']];
  body.innerHTML=`<p class="diet-plan-hint">${t('Yemek listesi bulunan diyetler seçildiğinde örnek yiyecekler eklenir. Diğerleri için liste oluşturabilirsin. Önceden açık listeler de görünmeye devam eder.','Selecting a diet with a food list adds example foods. You can create lists for others. Other active lists remain visible.')}</p><p class="diet-plan-hint">${t('Örnek listeler kişisel tedavi veya uygunluk değerlendirmesi değildir; sağlık ekibinin planına ve yiyeceğin içeriğine göre düzenle.','Example lists are not personalized treatment or suitability assessments; adjust them to your care plan and food contents.')}</p>${cards}<div id="dietPlanListInfo" class="diet-plan-list-info" aria-live="polite"></div>
   <details class="diet-plan-group"><summary>${t('Öğün ve miktar düzeni','Meals and amounts')}</summary>
   <label class="diet-plan-field">${t('Düzen','Schedule')}<select id="dietMealMode"><option value="free">${t('Serbest','Flexible')}</option><option value="meals">${t('Öğün sayısı','Meal count')}</option><option value="window">${t('Aralıklı oruç / yeme aralığı','Intermittent fasting / eating window')}</option><option value="weekly">${t('Haftalık düzen (ör. 5:2)','Weekly schedule (e.g. 5:2)')}</option></select></label>
   <div id="dietMealCountFields" hidden><div class="diet-plan-two"><label class="diet-plan-field">${t('Ana öğün sayısı','Main meals')}<input id="dietMainMeals" type="number" inputmode="numeric" min="0" max="12" step="1" value="${esc(d.mainMeals??'')}"></label><label class="diet-plan-field">${t('Ara öğün sayısı','Snacks')}<input id="dietSnacks" type="number" inputmode="numeric" min="0" max="12" step="1" value="${esc(d.snacks??'')}"></label></div></div>
   <div id="dietWindowFields" hidden><label class="diet-plan-field">${t('Zamanlama','Timing')}<select id="dietWindowPattern"><option value="custom">${t('Kendim belirleyeceğim','Custom')}</option><option value="16:8">16:8</option><option value="14:10">14:10</option></select></label><div class="diet-plan-two"><label class="diet-plan-field">${t('Yeme başlangıcı','Eating starts')}<input id="dietWindowStart" type="time" value="${esc(d.windowStart||'')}"></label><label class="diet-plan-field">${t('Yeme bitişi','Eating ends')}<input id="dietWindowEnd" type="time" value="${esc(d.windowEnd||'')}"></label></div><p class="diet-plan-hint">${t('Başlangıç saatini sen seçersin; istersen bitiş saatini değiştirebilirsin.','Choose the start time; you can change the end time.')}</p></div>
   <div id="dietWeeklyFields" hidden><p class="diet-plan-hint">${t('Farklı plan uyguladığın günleri seç.','Choose days with a different plan.')}</p><div class="diet-plan-days">${weekdays.map(([id,tr,eng])=>`<label><input type="checkbox" name="dietWeekday" value="${id}" ${Array.isArray(d.weekdays)&&d.weekdays.includes(id)?'checked':''}><span>${t(tr,eng)}</span></label>`).join('')}</div><label class="diet-plan-field">${t('Bu günler için not','Note for these days')}<input id="dietWeeklyNote" type="text" maxlength="180" value="${esc(d.weeklyNote||'')}"></label></div>
   <p id="dietFastingNote" class="diet-plan-attention" hidden>${t('Diyabetin varsa veya kan şekerini düşüren ilaç kullanıyorsan açlık düzenini sağlık ekibinle değerlendir. İlaç saat ve dozları bu ayarla değiştirilmez.','If you have diabetes or use glucose-lowering medicines, discuss fasting with your care team. This setting does not change medication timing or doses.')}</p>
   <label class="diet-plan-field">${t('Günlük kalori hedefi (kcal)','Daily calorie goal (kcal)')}<input id="dietCalories" type="number" inputmode="numeric" min="1" max="20000" step="1" value="${esc(p.calorieTarget??'')}"></label><p class="diet-plan-hint">${t('Girdiğin hedef, uygulamadaki mevcut kalori hedefini günceller.','This updates the app’s existing calorie goal.')}</p>
   <label class="diet-plan-field">${t('Planım / doktorumun önerisi','My plan / clinician’s guidance')}<textarea id="dietPlanNote" rows="3" maxlength="1000">${esc(d.note||'')}</textarea></label></details>
   <p id="dietPlanError" class="diet-plan-error" role="alert" hidden></p>`;
  const select=document.getElementById('dietMealMode');select.value=mode;select.addEventListener('change',updateMode);updateMode();
  const pattern=document.getElementById('dietWindowPattern');pattern.value=['16:8','14:10'].includes(d.windowPattern)?d.windowPattern:'custom';
  pattern.addEventListener('change',updateWindowEnd);document.getElementById('dietWindowStart').addEventListener('change',updateWindowEnd);document.getElementById('dietWindowEnd').addEventListener('change',()=>{pattern.value='custom';});
  const groups=[...body.querySelectorAll('.diet-plan-group')];groups.forEach(group=>group.addEventListener('toggle',()=>{if(group.open)groups.forEach(other=>{if(other!==group)other.open=false;});}));
  body.querySelectorAll('input[name="dietChoice"]').forEach(input=>input.addEventListener('change',updateListInfo));updateListInfo();
  if(!dialog.open)dialog.showModal();
 }
 function updateListInfo(){
  const node=document.getElementById('dietPlanListInfo');if(!node)return;
  const selected=[...document.querySelectorAll('#dietPlanBody input[name="dietChoice"]:checked')].map(x=>x.value),items=options.flatMap(g=>g.items).filter(x=>selected.includes(x[0]));
  node.replaceChildren();
  for(const [id,tr,eng] of items){
   if(id==='calorie_control'||readyLists.has(id))continue;
   const row=document.createElement('div'),label=document.createElement('span');label.textContent=t(tr,eng)+t(': hazır liste yok',': no ready list');row.appendChild(label);
   const button=document.createElement('button');button.type='button';button.textContent=t('LİSTE OLUŞTUR','CREATE LIST');button.addEventListener('click',()=>openWizardFor(id));row.appendChild(button);
   node.appendChild(row);
  }
 }
 async function openWizardFor(id){
  if(!await save())return;
  const wizard=document.getElementById('foodWizardDetails');if(!wizard)return;wizard.open=true;
  if(wizardProfiles[id]&&typeof setCustomDiet==='function')setCustomDiet(wizardProfiles[id]);
  else {if(typeof setCustomDiet==='function')setCustomDiet('');showToast(t('Sihirbazda uygun bir liste seçin veya kendi yiyecek listenizi ekleyin.','Choose a suitable wizard list or add your own foods.'),'info');}
  wizard.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function updateMode(){const mode=document.getElementById('dietMealMode')?.value;for(const [id,active] of [['dietMealCountFields','meals'],['dietWindowFields','window'],['dietWeeklyFields','weekly']]){const el=document.getElementById(id);if(el)el.hidden=mode!==active;}const warning=document.getElementById('dietFastingNote');if(warning)warning.hidden=!['window','weekly'].includes(mode);}
 function updateWindowEnd(){const pattern=document.getElementById('dietWindowPattern').value,start=document.getElementById('dietWindowStart').value;if(!['16:8','14:10'].includes(pattern)||!/^\d{2}:\d{2}$/.test(start))return;const [h,m]=start.split(':').map(Number),minutes=(h*60+m+(pattern==='16:8'?8:10)*60)%1440;document.getElementById('dietWindowEnd').value=String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');}
 async function save(){
  const el=id=>document.getElementById(id),error=el('dietPlanError'),raw=el('dietCalories').value.trim(),cal=raw?Number(raw):null;
  if(raw&&(!Number.isInteger(cal)||cal<1||cal>20000)){error.textContent=t('Kalori hedefini geçerli bir sayı olarak gir.','Enter a valid calorie goal.');error.hidden=false;return;}
  const mode=el('dietMealMode').value;if(!['free','meals','window','weekly'].includes(mode))return;
  const mainRaw=el('dietMainMeals').value.trim(),snackRaw=el('dietSnacks').value.trim();
  if([mainRaw,snackRaw].some(v=>v!==''&&(!Number.isInteger(Number(v))||Number(v)<0||Number(v)>12))){error.textContent=t('Öğün sayısını 0 ile 12 arasında gir.','Enter meal counts from 0 to 12.');error.hidden=false;return;}
  const p=profile(),before={...p},old=p.dietPlan||{};
  const value={...old,selected:[...document.querySelectorAll('#dietPlanBody input[name="dietChoice"]:checked')].map(x=>x.value).filter(x=>ids.has(x)),mealMode:mode,mainMeals:mainRaw===''?null:Number(mainRaw),snacks:snackRaw===''?null:Number(snackRaw),windowPattern:el('dietWindowPattern').value,windowStart:el('dietWindowStart').value,windowEnd:el('dietWindowEnd').value,weekdays:[...document.querySelectorAll('#dietPlanBody input[name="dietWeekday"]:checked')].map(x=>x.value),weeklyNote:el('dietWeeklyNote').value.trim(),note:el('dietPlanNote').value.trim()};
  const requested=value.selected.filter(id=>readyLists.has(id)),installed=FoodLists.installed(),missing=requested.filter(id=>!installed.includes(id));
  if(missing.length){const ok=await FoodLists.apply(missing);if(!ok){error.textContent=t('Yemek listesi yüklenemedi. İnternet bağlantısını kontrol edip tekrar dene.','The food list could not be loaded. Check your connection and try again.');error.hidden=false;return;}}
  const previous=Array.isArray(old.selected)?old.selected.filter(id=>readyLists.has(id)):[];
  const active=FoodLists.active().filter(id=>!previous.includes(id)||requested.includes(id));
  try{localStorage.setItem('foodListActive',JSON.stringify([...new Set([...active,...requested])]));}catch(e){error.textContent=t('Liste seçimi kaydedilemedi.','Could not save the list selection.');error.hidden=false;return;}
  const next={...p,dietPlan:value};if(cal!==null)next.calorieTarget=cal;else delete next.calorieTarget;
  if(p.clinicalWizard?.topics?.restrictions){const cw=p.clinicalWizard,answers={...(cw.topics.restrictions.answers||{})};if(cal!==null)answers.calorieTarget=cal;else delete answers.calorieTarget;next.clinicalWizard={...cw,topics:{...cw.topics,restrictions:{...cw.topics.restrictions,answers}}};}
  try{DataManager.saveProfile(next);}catch(e){DataManager._profile=before;try{localStorage.setItem('foodListActive',JSON.stringify(active));}catch(_){}error.textContent=t('Kaydedilemedi. Tekrar dene.','Could not save. Try again.');error.hidden=false;return false;}
  updateSummary();try{FoodLists.renderManager();FoodLibraryManager.renderGrid(document.getElementById('foodSearchInput')?.value||'');if(typeof updateHeaderStats==='function')updateHeaderStats();if(typeof renderList==='function')renderList();}catch(e){console.error('Diet plan refresh:',e);}el('dietPlanDialog').close();
  return true;
 }
 window.addEventListener('load',updateSummary);
 return {open,save,updateSummary};
})();
window.DietPlan=DietPlan;
