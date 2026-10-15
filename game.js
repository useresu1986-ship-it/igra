'use strict';
/* ИЗ НУЛЯ v0.3 — all prices/rates illustrative SIMULATION PARAMETERS, not measured wages */
const WORK=[
['Курьер','🚴','Офлайн',4,850,120,'route','Доставка, маршрут, ожидание заказов'],['Сотрудник ПВЗ','📦','Офлайн',5,1250,45,'sort','Сортировка и выдача посылок'],['Бариста','☕','Офлайн',5,1100,80,'timing','Приготовление напитков'],['Склад','🏭','Офлайн',6,1350,120,'memory','Комплектация заказов'],['Промоутер','📄','Офлайн',3,630,40,'timing','Раздача листовок'],['Репетитор','📚','Гибрид',3,1200,70,'logic','Проведение занятий'],['Монтаж Shorts','🎬','Онлайн',4,1350,70,'sort','Сборка коротких видео'],['Монтаж длинных видео','🎞️','Онлайн',6,2200,110,'memory','Монтаж и правки'],['Дизайн обложек','🎨','Онлайн',3,980,45,'sort','Подбор композиции'],['Копирайтинг','✍️','Онлайн',4,1000,40,'logic','Тексты и правки'],['Переводы','🌍','Онлайн',4,1100,50,'memory','Локализация текстов'],['Создание сайтов','💻','Онлайн',6,2300,100,'logic','Вёрстка и тестирование'],['Тестировщик','🧪','Онлайн',5,1550,50,'logic','Поиск ошибок'],['Транскрибация','🎧','Онлайн',3,570,25,'memory','Расшифровка речи'],['Дизайн карточек','🛒','Онлайн',4,1050,45,'sort','Карточки маркетплейсов'],['Менеджер соцсетей','📱','Онлайн',5,1550,65,'timing','Контент-планы и публикации'],['Оператор поддержки','🎙️','Онлайн',5,1200,45,'memory','Обработка обращений'],['Настройка рекламы','📊','Онлайн',5,1750,100,'logic','Кампании и отчёты'],['Создание битов на заказ','🎹','Онлайн',5,1550,110,'timing','Аранжировка и сведение'],['Модератор','🛡️','Онлайн',4,900,30,'sort','Проверка контента'],['Ремонт техники','🔧','Офлайн',5,1600,210,'logic','Диагностика и ремонт'],['Перепродажа вещей','♻️','Гибрид',4,1100,380,'memory','Поиск и продажа вещей'],['Уборка квартир','🧹','Офлайн',5,1700,160,'timing','Выезд и уборка'],['Фото и ретушь','📸','Гибрид',4,1450,100,'sort','Съёмка и обработка']
].map((a,i)=>({id:'w'+i,name:a[0],icon:a[1],category:a[2],hours:a[3],base:a[4],cost:a[5],mechanic:a[6],description:a[7]}));
const PROJECTS=[
['Биты для RU-артистов','🎹','Музыка',7000,450,200,0.035,'music'],['Биты на зарубежный рынок','🎧','Музыка',11500,850,320,0.03,'music'],['YouTube Shorts RU','📱','Контент',3000,250,90,0.025,'media'],['YouTube Shorts EN','🌐','Контент',4500,400,140,0.025,'media'],['YouTube без лица RU','🎥','Контент',8000,700,190,0.032,'media'],['YouTube без лица EN','🌎','Контент',12000,1150,280,0.027,'media'],['Личный видеоблог','📷','Контент',4500,430,145,0.031,'media'],['Стриминг','🔴','Контент',13000,850,240,0.027,'media'],['Нарезки стримеров','✂️','Контент',3000,250,100,0.027,'media'],['Канал VK Клипы','▶️','Контент',2700,250,105,0.028,'media'],['Сообщество VK','👥','Контент',4200,370,125,0.031,'media'],['Блог Дзен','📝','Контент',2600,290,105,0.036,'media'],['Telegram-канал','✈️','Контент',5000,460,140,0.03,'media'],['Продюсирование авторов','🎬','Услуги',26000,2400,480,0.025,'agency'],['Студия монтажа','🎞️','Услуги',18000,1450,340,0.034,'agency'],['Дизайн-агентство','🎨','Услуги',21000,1750,370,0.033,'agency'],['Веб-студия','🖥️','Услуги',32000,2450,490,0.035,'agency'],['Рекламное агентство','📈','Услуги',29000,2600,560,0.04,'agency'],['Арбитраж трафика','🎯','Реклама',17000,2450,690,0.04,'ads'],['Товарный бизнес','📦','Торговля',25000,2200,520,0.035,'commerce'],['Магазин на маркетплейсе','🛍️','Торговля',36000,3150,620,0.036,'commerce'],['Кофейный островок','☕','Офлайн-бизнес',115000,4100,850,0.026,'offline'],['Пункт выдачи заказов','🏪','Офлайн-бизнес',145000,4400,950,0.023,'offline'],['Микро-SaaS','⚙️','IT',42000,3600,750,0.036,'saas']
].map((a,i)=>({id:'p'+i,name:a[0],icon:a[1],category:a[2],startup:a[3],upkeep:a[4],potential:a[5],growth:a[6],type:a[7]}));
const ASSETS=[['Б/у ноутбук','💻',18000,13500,'Открывает цифровые возможности.'],['Современный ноутбук','🖥️',65000,47000,'Мощное рабочее место.'],['Микрофон','🎤',5500,3500,'Для озвучки и стримов.'],['Наушники','🎧',3500,1800,'Работа со звуком.'],['Велосипед','🚲',16000,10000,'Для передвижения и доставки.'],['Музыкальная клавиатура','🎹',8500,5200,'Музыкальное оборудование.']];
const money=n=>Math.round(n||0).toLocaleString('ru-RU')+' ₽'; const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));const rnd=(a,b)=>a+Math.random()*(b-a);
const KEY='iz_nulya_v3_state';const initial=()=>({version:3,day:1,cash:1500,debt:0,energy:90,stress:12,hours:12,rep:0,skills:{},owned:[],projects:{},ledger:[],nextLedgerId:1,events:[],tab:'home',workCount:0,lastBonus:0,seed:0,pendingAction:null});
// Единая граница загрузки v3: проверяем копию до передачи игровым модулям.
function prepareSaveState(input){
 const state=typeof input==='string'?JSON.parse(input):JSON.parse(JSON.stringify(input)),warnings=[];
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),fail=p=>{throw Error('Повреждено поле '+p);};
 const object=(o,p)=>{if(!o||typeof o!=='object'||Array.isArray(o))fail(p);return o;};
 function tree(o,p='save',depth=0){if(depth>80)fail(p+' (слишком большая вложенность)');if(typeof o==='number'&&!Number.isFinite(o))fail(p);if(o&&typeof o==='object')for(const k of Object.keys(o)){if(['__proto__','prototype','constructor'].includes(k))fail(p+'.'+k);tree(o[k],p+'.'+k,depth+1);}}
 tree(state);object(state,'save');if(state.version!==3)throw Error('Версия сохранения '+String(state.version)+' не поддерживается; ожидается версия 3');
 const copy=x=>JSON.parse(JSON.stringify(x));
 function shape(o,defaults,p){object(o,p);for(const [k,v] of Object.entries(defaults)){
  if(!own(o,k)){o[k]=copy(v);warnings.push('Отсутствовало '+p+'.'+k+' — задано значение по умолчанию');continue;}
  const value=o[k];if(Array.isArray(v)){if(!Array.isArray(value))fail(p+'.'+k);}
  else if(v&&typeof v==='object')shape(value,v,p+'.'+k);
  else if(v!==null&&(typeof value!==typeof v||typeof v==='number'&&!Number.isFinite(value)))fail(p+'.'+k);
 }return o;}
 const finite=(o,k,p,minimum=-Infinity)=>{if(!Number.isFinite(o[k])||o[k]<minimum)fail(p+'.'+k);};
 const array=(a,p)=>{if(!Array.isArray(a))fail(p);return a;};
 const records=(a,defaults,p)=>array(a,p).map((r,i)=>shape(r,typeof defaults==='function'?defaults(r):defaults,p+'['+i+']'));
 const map=(o,p,fn)=>{object(o,p);for(const [k,v] of Object.entries(o))fn(object(v,p+'.'+k),p+'.'+k,k);};
 for(const k of ['day','cash','debt','owned','projects','ledger'])if(!own(state,k))fail(k+' (обязательное поле, нельзя восстановить без догадки)');
 finite(state,'day','save',1);if(!Number.isInteger(state.day))fail('day');finite(state,'cash','save');finite(state,'debt','save',0);
 const progressed=state.day>1||state.ledger?.length||state.owned?.length||Object.keys(state.projects||{}).length||state.workCount>0;
 if(progressed)for(const key of ['energy','stress','hours','skills'])if(!own(state,key))fail(key+' (ресурсы после начала игры нельзя восстановить догадкой)');
 shape(state,initial(),'save');
 for(const k of ['energy','stress','hours','rep','workCount','lastBonus'])finite(state,k,'save',0);
 for(const id of state.owned)if(!Number.isInteger(id)||!ASSETS[id])fail('owned');
 for(const [id,n] of Object.entries(state.skills))if(!WORK.some(w=>w.id===id)||!Number.isFinite(n)||n<0)fail('skills.'+id);
 records(state.events,{day:state.day,msg:''},'events');
 records(state.ledger,{},'ledger').forEach((r,i)=>{finite(r,'amount','ledger['+i+']');finite(r,'day','ledger['+i+']',1);if(typeof r.category!=='string')fail('ledger['+i+'].category');for(const key of ['source','note','project'])if(own(r,key)&&typeof r[key]!=='string')fail('ledger['+i+'].'+key);});
 if(state.ledger.some(r=>r.category==='Учебная уплата НПД')&&!state.economy?.expansion?.realism18?.tax?.records)fail('tax.records (связи уже уплаченного налога отсутствуют)');
 if(state.ledger.some(r=>r.category==='Награда за достижение')){if(!state.economy)state.economy={};if(!state.economy.expansion)state.economy.expansion={};}
 for(const r of state.ledger)if(['Закупка партии','Товарная выручка','Возврат покупателю','Предоплата поставщику'].includes(r.category)&&r.project&&!state.economy?.business14?.byProject?.[r.project])fail('business14.byProject.'+r.project+' (история товарных операций без складских данных)');
 map(state.projects,'projects',(p,path,id)=>{
  if(!PROJECTS.some(x=>x.id===id)||typeof p.open!=='boolean')fail(path+'.open/ID');
  shape(p,{posts:0,audience:0,staff:0,automation:0,metrics:{views:0,orders:0,paidOrders:0,followers:p.audience||0,returns:0,content:0}},path);
  for(const k of ['posts','audience','staff','automation'])finite(p,k,path,0);
  for(const key of ['team27','competition30'])if(own(p,key))object(p[key],path+'.'+key);
  if(p.team27){const t=p.team27;if(!own(t,'members'))fail(path+'.team27.members');shape(t,{members:[],history:[],nextId:1},path+'.team27');records(t.members,{hired:state.day},path+'.team27.members').forEach(m=>{if(!['operations','marketing','procurement'].includes(m.role))fail(path+'.team27.role');finite(m,'id',path,1);for(const k of ['dailyBonus','xp','training','burnoutDays'])if(own(m,k))finite(m,k,path,0);});t.nextId=Math.max(t.nextId,...t.members.map(m=>m.id+1));}
  if(p.competition30)shape(p.competition30,{campaignUntil:0,spent:0,sales:0,lost:0,history:[]},path+'.competition30');
 });
 if(own(state,'economy')){object(state.economy,'economy');
  const e=shape(state.economy,{receivables:[],stats:{},losses:0,history:[],settings:{strategy:'balanced'},seq:1},'economy');
  for(const key of ['expansion','systems','labour8','contracts11','strategy10','business14','yt15','youtubeBusiness17','invoiceSettlements'])if(own(e,key))object(e[key],'economy.'+key);
  records(e.receivables,{status:'pending',created:state.day,label:'',project:''},'economy.receivables').forEach(r=>{finite(r,'gross','receivables',0);finite(r,'due','receivables',1);if(!['pending','disputed','paid','lost','cancelled','written_off'].includes(r.status))fail('receivables.status');});
  records(e.history,{},'economy.history');
  if(e.invoiceSettlements)object(e.invoiceSettlements,'economy.invoiceSettlements');
  const invoiceIds=[...e.receivables.map(r=>Number(r.id)),...Object.keys(e.invoiceSettlements||{}).map(Number),...state.ledger.filter(r=>r.invoiceId!=null||/^Погашена дебиторская задолженность #\d+$/.test(r.note||'')).map(r=>Number(r.invoiceId??r.note.split('#')[1]))].filter(Number.isSafeInteger);
  e.seq=Math.max(e.seq,1,...invoiceIds.map(n=>n+1));
  if(e.expansion){
   const x=shape(e.expansion,{living:'normal',contracts:{},channels:{},costBreakdown:{},deals:[],statistics:{},settings:{foreignEligibility:'only_verified'},credit:{principal:0,rate:.0006},log:[]},'economy.expansion');
   for(const key of ['world','labour19','realism18'])if(own(x,key))object(x[key],'expansion.'+key);
   map(x.contracts,'expansion.contracts',(r,p)=>shape(r,{status:'none'},p));map(x.channels,'expansion.channels',(r,p)=>shape(r,{clicks:0,impressions:0,views:0,adGross:0,fees:0,adNet:0,organicIncome:0,uploads:0,checks:0},p));
   const rewardRows=state.ledger.filter(r=>r.category==='Награда за достижение');
   if(rewardRows.length&&!x.world)x.world={};
   if(x.world){
    const w=object(x.world,'world');if(!own(w,'claimed')&&rewardRows.some(r=>!r.missionId))throw Error('Невозможно восстановить world.claimed: у старых наград нет однозначной ссылки; исходное сохранение сохранено');
    shape(w,{home:'dorm',claimed:[],opportunities:[],nextOffer:1,dayExpenses:[],lastDay:0},'world');
    if(!['dorm','room','flat'].includes(w.home))fail('world.home');for(const r of rewardRows)if(r.missionId&&!w.claimed.includes(r.missionId))w.claimed.push(r.missionId);
    for(const id of w.claimed)if(typeof id!=='string')fail('world.claimed');
    records(w.opportunities,{status:'open'},'world.opportunities').forEach(r=>{if(!WORK.some(j=>j.id===r.job))fail('world.opportunities.job');for(const k of ['id','bonus','expires'])finite(r,k,'world.opportunities',0);});
    w.nextOffer=Math.max(w.nextOffer,1,...w.opportunities.map(r=>(Number(r.id)||0)+1));
    if(w.activeOffer){object(w.activeOffer,'world.activeOffer');const offer=w.opportunities.find(o=>o.id===w.activeOffer.id);if(offer&&offer.status==='accepted')offer.status='open';w.activeOffer=null;warnings.push('Незавершённый срочный заказ можно начать заново; премия не начислялась');}
   }
   if(x.labour19)shape(x.labour19,{sessions:[]},'labour19');
   if(x.realism18){const r=shape(x.realism18,{region:'regional',priceIndex:1,priceMode:'fixed',anchorDay:state.day,tax:{records:{},status:'none'}},'realism18');finite(r,'priceIndex','realism18',.000001);if(!['regional','moscow','spb','rostov'].includes(r.region))fail('realism18.region');map(r.tax.records,'tax.records',(t,p)=>{if(!['individual','business','exclude'].includes(t.kind)||typeof t.paid!=='boolean')fail(p);if(own(t,'paidTax'))finite(t,'paidTax',p,0);});}
  }
  if(e.systems)shape(e.systems,{taxMode:'simulation',taxAccrued:0,yearIncome:0,creditsPaid:0,training:{},story:[],daily:[],settings:{}},'systems');
  if(e.labour8){const l=shape(e.labour8,{offers:[],lastDay:0,seq:0,completed:0},'labour8');records(l.offers,{},'labour8.offers').forEach(r=>{if(!WORK.some(j=>j.id===r.job))fail('labour8.offers.job');});l.seq=Math.max(l.seq,0,...l.offers.map(r=>Number(r.id)||0));}
  if(e.contracts11){
   const c=object(e.contracts11,'contracts11');if(!own(c,'pending')&&Array.isArray(c.history))c.pending=c.history.filter(r=>['pending','disputed'].includes(r.status)).map(copy);
   if(!own(c,'history')&&Array.isArray(c.pending))c.history=c.pending.map(copy);
   shape(c,{offers:[],active:null,history:[],pending:[],lastDay:0,seq:0},'contracts11');
   for(const key of ['offers','history','pending'])records(c[key],{},'contracts11.'+key).forEach(r=>{if(!WORK.some(j=>j.id===r.job))fail('contracts11.'+key+'.job');finite(r,'id','contracts11.'+key,1);if(key!=='offers'){finite(r,'gross','contracts11.'+key,0);finite(r,'due','contracts11.'+key,1);if(!['pending','disputed','paid','lost','cancelled'].includes(r.status))fail('contracts11.'+key+'.status');if(r.status==='pending'){finite(r,'risk','contracts11.'+key,0);if(r.risk>1)fail('contracts11.'+key+'.risk');}}});
   c.seq=Math.max(c.seq,0,...[...c.offers,...c.history,...c.pending].map(r=>r.id));
   if(c.active){object(c.active,'contracts11.active');c.active=null;warnings.push('Незавершённый договор можно начать заново; доход и расходы не начислялись');}
  }
  if(e.strategy10)shape(e.strategy10,{choices:{},history:[],sequence:0},'strategy10');
  if(e.business14){
   const b=shape(e.business14,{history:[],byProject:{},round:0},'business14');map(b.byProject,'business14.byProject',(w,p)=>{
    if(!own(w,'stock'))fail(p+'.stock (количество оплаченного товара неизвестно)');
    const hadDeliveries=own(w,'deliveries');shape(w,{stock:0,unitsSold:0,waitingStock:0,deliveries:[]},p);for(const k of ['stock','unitsSold','waitingStock','refundable'])if(own(w,k)){finite(w,k,p,0);if(!Number.isInteger(w[k]))fail(p+'.'+k);}
    if(!hadDeliveries&&state.ledger.some(r=>r.project===p.split('.').at(-1)&&r.category==='Предоплата поставщику'))fail(p+'.deliveries (оплаченные поставки нельзя восстановить догадкой)');
    records(w.deliveries,{},p+'.deliveries').forEach(d=>{finite(d,'count',p,0);finite(d,'due',p,1);if(!Number.isInteger(d.count)||!['transit','delivered'].includes(d.status))fail(p+'.deliveries.status/count');});
    w.nextShipmentId=Math.max(w.nextShipmentId||1,...w.deliveries.map(d=>(Number(d.id)||0)+1));
    if(w.warehouseVersion===1&&!own(w,'sales')){if(w.unitsSold>0&&!own(w,'refundable'))fail(p+'.sales (нет данных о праве возврата)');delete w.warehouseVersion;warnings.push('Восстановлена старая история возвратов '+p);}
    if(own(w,'sales'))records(w.sales,{},p+'.sales').forEach(s=>{for(const k of ['count','good','damaged'])finite(s,k,p+'.sales',0);if(s.good+s.damaged>s.count)fail(p+'.sales.count');if(s.price!==null)finite(s,'price',p+'.sales',0);});
   });
  }
  if(e.yt15){const y=shape(e.yt15,{channels:{},seq:1,history:[],method:'simulation'},'yt15');map(y.channels,'yt15.channels',(c,p,id)=>{if(!own(c,'videos')&&(c.views>0||c.production>0))fail(p+'.videos');shape(c,{videos:[],subscribers:state.projects[id]?.audience||0,impressions:0,views:0,adGross:0,mcnFees:0,paid:0,direct:0,production:0,day:state.day},p);
   records(c.videos,{},p+'.videos').forEach(v=>{for(const key of ['id','day','quality','ctr','retention','baseReach'])finite(v,key,p+'.videos',0);if(!['short','long'].includes(v.format)||!['ru','intl'].includes(v.region))fail(p+'.videos.format/region');shape(v,{age:0,impressions:0,views:0,subs:0,spent:0,adGross:0,fees:0,integrations:0,promo:0,claimed:false,title:'',traffic:{browse:0,search:0,suggested:0,external:0}},p+'.videos');});
  });y.seq=Math.max(y.seq,1,...Object.values(y.channels).flatMap(c=>c.videos.map(v=>(Number(v.id)||0)+1)));}
  if(e.youtubeBusiness17){const y=shape(e.youtubeBusiness17,{seq:1,contracts:[],calendar:[],history:[]},'youtubeBusiness17');records(y.contracts,{},'youtubeBusiness17.contracts');records(y.calendar,{},'youtubeBusiness17.calendar');y.seq=Math.max(y.seq,1,...[...y.contracts,...y.calendar].map(r=>(Number(r.id)||0)+1));}
 }
 if(state.pendingAction){object(state.pendingAction,'pendingAction');state.pendingAction=null;warnings.push('Незавершённое задание/черновик отменено без начислений; начните его заново');}
 function counters(o,p='save'){if(!o||typeof o!=='object')return;for(const [k,v] of Object.entries(o)){if(/^(seq|sequence|next[A-Z]\w*)$/.test(k)&&typeof v==='number'&&(!Number.isSafeInteger(v)||v<0))fail(p+'.'+k);if(v&&typeof v==='object')counters(v,p+'.'+k);}}
 counters(state);
 initializeLedgerIds(state);
 return {state,warnings};
}
// Миграция ID не проводит операции и не пересчитывает деньги/налоги.
function initializeLedgerIds(state){
 if(!Array.isArray(state.ledger))throw Error('Invalid financial ledger');
 const records=state.economy?.expansion?.realism18?.tax?.records;
 const valid=id=>Number.isSafeInteger(id)&&id>0;
 let next=valid(state.nextLedgerId)?state.nextLedgerId:1;
 // Резервируем также ID удалённых проводок, на которые ещё ссылается налоговый кабинет.
 for(const row of state.ledger)if(valid(Number(row.id)))next=Math.max(next,Number(row.id)+1);
 for(const key of Object.keys(records||{}))if(valid(Number(key)))next=Math.max(next,Number(key)+1);
 if(!valid(next)||next>=Number.MAX_SAFE_INTEGER)throw Error('Financial operation IDs exhausted');
 const seen=new Set();
 for(const row of state.ledger){
  const oldKey=String(row.id),id=Number(row.id);
  if(valid(id)&&!seen.has(id)){row.id=id;seen.add(id);continue;}
  if(next>=Number.MAX_SAFE_INTEGER)throw Error('Financial operation IDs exhausted');
  row.id=next++;seen.add(row.id);
  // При коллизии старая отметка относилась ко всем строкам с этим ID.
  // Сохраняем прежний смысл paid/kind для каждой строки, а не начисляем налог заново.
  if(records&&Object.prototype.hasOwnProperty.call(records,oldKey))records[String(row.id)]={...records[oldKey]};
 }
 state.nextLedgerId=next;
 return state;
}
function allocateLedgerId(){
 if(!Number.isSafeInteger(S.nextLedgerId)||S.nextLedgerId<1)initializeLedgerIds(S);
 const id=S.nextLedgerId;
 if(id>=Number.MAX_SAFE_INTEGER)throw Error('Financial operation IDs exhausted');
 S.nextLedgerId=id+1;
 return id;
}
let saveRecovery=null,loadWarnings=[],saveDepth=0,savePending=false,saveBoundariesInstalled=false;
function archiveSave(raw,replace=false){if(raw!=null&&(replace||localStorage.getItem(KEY+'_recovery')==null))localStorage.setItem(KEY+'_recovery',raw);}
function loadLocalState(){
 saveRecovery=null;let raw=null;
 try{raw=localStorage.getItem(KEY);if(raw===null)return initial();const prepared=prepareSaveState(raw);loadWarnings=prepared.warnings;
  if(JSON.stringify(prepared.state)!==JSON.stringify(JSON.parse(raw)))archiveSave(raw);
  return prepared.state;
 }catch(error){saveRecovery={raw,error:error.message};return initial();}
}
let S=loadLocalState();let tab=S.tab||'home',filter='Все',query='',period=30,selectedFinance='all',modal=null;
function storageWarning(message){const b=document.querySelector('#savebtn');if(b){b.textContent='⚠ Не сохранено';b.title=message;}toast(message);}
function persistSnapshot(state){
 const json=JSON.stringify(state),previous=localStorage.getItem(KEY);
 if(previous!==null&&previous!==json)localStorage.setItem(KEY+'_backup',previous);
 localStorage.setItem(KEY,json);
 const b=document.querySelector('#savebtn');if(b){b.textContent='↧ Сохранить';b.title='';}return true;
}
function recoveryScreen(){
 const cloud=typeof yandexPlayer!=='undefined'&&!!yandexPlayer?.getData;
 const main=document.querySelector('#main');main.innerHTML=`<div class="card"><h1>Сохранение требует восстановления</h1><p role="alert">${esc(saveRecovery.error)}</p><p>Исходные данные не заменены новой игрой. Автосохранение и игровые действия заблокированы. Скачайте исходный файл или импортируйте исправленное сохранение.</p><div class="btnrow"><button data-recovery="raw">Скачать исходное сохранение</button><button data-recovery="backup">Скачать резервную копию</button><button data-recovery="retry">Повторить загрузку</button><button data-recovery="import">Импортировать сохранение</button><button data-recovery="cloud" ${cloud?'':'disabled'}>Восстановить из облака Яндекс Игр</button><button data-recovery="reset">Начать новую игру с подтверждением</button></div></div>`;
 for(const id of ['cash','day','net','energy']){const el=document.querySelector('#'+id);if(el)el.textContent='—';}
}
function downloadSaveCopy(key){try{const raw=key==='raw'&&saveRecovery?.raw!=null?saveRecovery.raw:localStorage.getItem(KEY+(key==='backup'?'_backup':key==='archive'?'_recovery':''));if(raw===null)return toast('Резервная копия не найдена');download('iz_nulya_'+key+'.json',raw,'application/json');}catch(e){toast('Не удалось прочитать копию: '+e.message);}}
function restoreSaveState(raw,{home=true}={}){
 const prepared=prepareSaveState(raw),candidate=prepared.state;
 window.BusinessV14?.warehouse?.migrateAll(candidate);
 const previous=S,previousTab=tab,previousRecovery=saveRecovery,previousWarnings=loadWarnings,previousPending=savePending;
 saveDepth++;
 try{
  const previousRaw=localStorage.getItem(KEY);if(previousRaw!==null)archiveSave(previousRaw,true);else if(prepared.warnings.length)archiveSave(typeof raw==='string'?raw:JSON.stringify(raw));
  S=candidate;tab=home?'home':candidate.tab;S.tab=tab;saveRecovery=null;loadWarnings=prepared.warnings;
  if(typeof refreshHousing18==='function')refreshHousing18();
  render(); // Невалидный экран не должен попасть в основное хранилище.
  persistSnapshot(S);
 }catch(error){S=previous;tab=previousTab;saveRecovery=previousRecovery;loadWarnings=previousWarnings;try{if(typeof refreshHousing18==='function')refreshHousing18();render();}catch{}throw error;}
 finally{saveDepth--;savePending=previousPending;}
 closeModal();window.VideoEditorV16?.cancelDraft?.();savePending=false;return prepared;
}
function markPendingAction(kind,id){if(saveRecovery)return;if(S.pendingAction?.kind===kind&&S.pendingAction?.id===id)return;S.pendingAction={kind,id,day:S.day};save();}
function installSaveBoundaries(){
 if(saveBoundariesInstalled)return;saveBoundariesInstalled=true;
 const draw=render;render=function(){if(saveRecovery)return recoveryScreen();const value=draw();if(loadWarnings.length)document.querySelector('#main').insertAdjacentHTML('afterbegin',`<div class="notice" role="status" data-save-notice>Восстановление сохранения: ${loadWarnings.slice(0,12).map(esc).join('; ')}${loadWarnings.length>12?' …':''}. Исходная копия доступна в справочнике.</div>`);return value;};
 // Внутренние обёртки не записывают временную зарплату до её отмены договором.
 for(const name of ['workResult','advanceDay']){
  const operation=name==='workResult'?workResult:advanceDay;
  const wrapped=function(...args){const snapshot=JSON.stringify(S);let success=false;saveDepth++;try{const result=operation(...args);success=true;return result;}catch(error){S=JSON.parse(snapshot);savePending=false;throw error;}finally{saveDepth--;if(success&&!saveDepth&&savePending){savePending=false;save();}}};
  if(name==='workResult')workResult=wrapped;else advanceDay=wrapped;
 }
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.recovery){e.preventDefault();e.stopImmediatePropagation();const a=b.dataset.recovery;
  if(a==='raw'||a==='backup')downloadSaveCopy(a);
  if(a==='cloud'&&typeof cloudLoadV8==='function')cloudLoadV8();if(a==='import')act('importjson');if(a==='reset')act('reset');
  if(a==='retry'){S=loadLocalState();if(!saveRecovery){window.BusinessV14?.warehouse?.migrateAll(S);tab=S.tab||'home';}render();}
  return;
 }
 if(saveRecovery){e.preventDefault();e.stopImmediatePropagation();}
},true);
// Скрипты регистрируют экраны и расширяют render синхронно, в порядке index.html.
// Первый экран показываем только после завершения этой фазы: ранний render
// не знает вкладок, добавленных последующими модулями.
let gameInitialized=false;
function initializeGame(){
 if(gameInitialized)return;
 installSaveBoundaries();
 if(saveRecovery){recoveryScreen();gameInitialized=true;return;}
 window.BusinessV14?.warehouse?.migrateAll();
 const availableTabs=Array.from(document.querySelectorAll('#nav button[data-tab]'),button=>button.dataset.tab);
 tab=availableTabs.includes(S.tab)?S.tab:'home';
 S.tab=tab;
 render();
 gameInitialized=true;
}
document.addEventListener('DOMContentLoaded',initializeGame,{once:true});
const has=id=>S.owned.includes(id),pr=id=>S.projects[id],sum=(rows,fn)=>rows.reduce((a,b)=>a+fn(b),0);
function book(category,amount,source,note='',project=''){amount=Math.round(amount);if(!Number.isFinite(amount))throw Error('Invalid transaction');const id=allocateLedgerId();S.cash+=amount;S.ledger.push({id,day:S.day,category,amount,source,note,project});if(S.ledger.length>12000)S.ledger=S.ledger.slice(-10000)}
function toast(t){const e=document.querySelector('#toast');e.textContent=t;e.classList.add('visible');clearTimeout(window.__toast);window.__toast=setTimeout(()=>e.classList.remove('visible'),2900)}
function save(){if(saveRecovery)return false;if(saveDepth){savePending=true;return true;}try{S.tab=tab;return persistSnapshot(S);}catch(e){storageWarning('Не удалось сохранить прогресс: '+e.message+'. Экспортируйте JSON до закрытия страницы.');return false;}}
function assetValue(){return sum(S.owned,id=>ASSETS[id]?.[3]||0)+sum(Object.entries(S.projects),( [id,p])=>p.open?Math.round((PROJECTS.find(x=>x.id===id)?.startup||0)*.45):0)}
function net(){return S.cash+assetValue()-S.debt}
function ledgerTotals(days=Infinity,project='all'){let arr=(typeof actualFinancialRows==='function'?actualFinancialRows():S.ledger).filter(x=>S.day-x.day<days&&(project==='all'||x.project===project));return {income:sum(arr,x=>x.amount>0?x.amount:0),outgo:sum(arr,x=>x.amount<0?-x.amount:0),net:sum(arr,x=>x.amount),count:S.ledger.filter(x=>S.day-x.day<days&&(project==='all'||x.project===project)).length}}
function spend(n){return S.cash>=n}function notice(msg){S.events.unshift({day:S.day,msg});S.events=S.events.slice(0,20)}
function advanceDay(){S.day++;S.hours=12;S.energy=clamp(S.energy+52,0,100);S.stress=clamp(S.stress-16,0,100);let living=450;book('Личная жизнь',-living,'Проживание','Еда, связь, жильё');for(let [id,p] of Object.entries(S.projects)){if(!p.open)continue;let cfg=PROJECTS.find(x=>x.id===id);book('Операционные расходы',-cfg.upkeep,'Расходы: '+cfg.name,'Сервисы, поддержка, материалы',id);if(p.staff)book('Оплата сотрудников',-p.staff*650,'Зарплаты: '+cfg.name,'Игровой расчёт ежедневных выплат',id);let audience=p.audience||0;let maturity=Math.log1p(audience)/Math.log(1000);let mult=clamp(maturity,0,5);let gross=Math.round(cfg.potential*mult*rnd(.55,1.42)*(0.25+Math.min(1,p.posts/12)*.75));if(cfg.type==='media'&&p.posts<3)gross=0;if(cfg.type==='music'&&p.posts<2)gross=0;if(cfg.type==='ads')gross=Math.round(gross*rnd(.4,1.6));if(gross>0){book('Выручка проекта',gross,cfg.name,'Модель спроса (не подтвержденная статистика)',id);let tax=Math.round(gross*.06);book('Модель налога',-tax,'Налог: '+cfg.name,'Условная ставка для игрового баланса, не налоговая консультация',id)}p.audience=Math.max(0,Math.round(audience*(1+rnd(-.004,.018))+p.posts*rnd(0,2)));}
if(S.day%7===0){let events=[['Заболел на пару дней: расходы на лекарства',-850],['Внезапный ремонт телефона',-2200],['Вернули старый долг',1100],['Подработка по рекомендации',1200],['Заменил изношенную обувь',-1450]];let e=events[Math.floor(Math.random()*events.length)];book('Событие',e[1],'Жизненное событие',e[0]);notice(e[0]+' ('+money(e[1])+')')}
if(S.cash<0){S.debt+=-S.cash;S.cash=0;notice('Нехватка денег: образовался долг на обязательные расходы')}
if(S.debt){let interest=Math.max(1,Math.round(S.debt*.0006));S.debt+=interest;notice('Начислены условные проценты по долгу: '+money(interest))}
}
function rest(){advanceDay();save();render();toast('Новый день: расходы и бизнесы рассчитаны')}
function buyAsset(i){const a=ASSETS[i];if(has(i))return toast('Уже куплено');if(!spend(a[2]))return toast('Недостаточно денег');book('Приобретение активов',-a[2],a[0],'Капитальные затраты');S.owned.push(i);save();render();toast('Куплено: '+a[0])}
function openProject(id){const cfg=PROJECTS.find(x=>x.id===id);if(!cfg||pr(id)?.open)return;if(!spend(cfg.startup))return toast('Не хватает стартового капитала');book('Инвестиции',-cfg.startup,'Запуск: '+cfg.name,'Создание проекта',id);S.projects[id]={open:true,posts:0,audience:0,staff:0,automation:0};save();render();toast('Проект открыт: '+cfg.name)}
function produce(id){const cfg=PROJECTS.find(x=>x.id===id),p=pr(id);if(!p?.open)return;if(S.hours<3||S.energy<17)return toast('Недостаточно времени или энергии');S.hours-=3;S.energy-=17;S.stress=clamp(S.stress+5,0,100);p.posts++;let gain=Math.round((12+Math.pow(p.posts,.7)*6)*(1+p.staff*.22+p.automation*.15)*rnd(.45,2.3));p.audience+=gain;notice(cfg.name+': новая публикация / заказ, +'+gain+' к потенциалу аудитории');save();render();toast('Работа выполнена • аудитория +'+gain)}
function hire(id){const p=pr(id);if(!p?.open)return;let cost=9500+p.staff*5000;if(!spend(cost))return toast('Не хватает денег на найм и запуск');book('Найм и настройка',-cost,'Подбор сотрудника','В модели учтены стартовые расходы',id);p.staff++;save();render();toast('Сотрудник нанят. Ежедневные выплаты добавятся')}
function financeData(){const first=Math.max(1,S.day-period+1),rows=[],actual=typeof actualFinancialRows==='function'?actualFinancialRows():S.ledger;for(let d=first;d<=S.day;d++){let entries=actual.filter(x=>x.day===d&&(selectedFinance==='all'||x.project===selectedFinance));rows.push({day:d,inc:sum(entries,x=>Math.max(x.amount,0)),out:sum(entries,x=>Math.max(-x.amount,0))})}return rows}
function chart(canvas,rows){if(!canvas)return;let w=canvas.clientWidth||600,h=260,dpr=window.devicePixelRatio||1;canvas.width=w*dpr;canvas.height=h*dpr;let c=canvas.getContext('2d');c.scale(dpr,dpr);c.clearRect(0,0,w,h);let pad=34,max=Math.max(1,...rows.map(x=>Math.max(x.inc,x.out)));c.strokeStyle='#354963';c.fillStyle='#96accb';c.font='11px Manrope,Arial';for(let i=0;i<=4;i++){let y=10+(h-40)*i/4;c.beginPath();c.moveTo(pad,y);c.lineTo(w-8,y);c.stroke();c.fillText(Math.round(max*(4-i)/4/1000)+'к',2,y+3)}function line(key,color){c.strokeStyle=color;c.lineWidth=2.5;c.beginPath();rows.forEach((r,i)=>{let x=pad+(w-pad-10)*i/Math.max(1,rows.length-1),y=10+(h-40)*(1-r[key]/max);i?c.lineTo(x,y):c.moveTo(x,y)});c.stroke()}line('inc','#5ce2ad');line('out','#ffb66c')}
function header(title,sub,action=''){return `<div class="headrow"><div><h1>${title}</h1><div class="muted">${sub}</div></div>${action}</div>`}
function home(){let t=ledgerTotals(7);return header('Твой путь начинается здесь','19 лет • Россия • начальный этап взрослой жизни',`<button class="primary" data-act="nextday">☾ Завершить день</button>`)+`<div class="grid four"><div class="card"><div class="mini">Доступно сегодня</div><div class="statnum">${S.hours} ч</div><span class="tag">Рабочее время</span></div><div class="card"><div class="mini">Энергия</div><div class="statnum">${S.energy}/100</div><div class="bar"><span style="width:${S.energy}%"></span></div></div><div class="card"><div class="mini">Расходы за 7 дней</div><div class="statnum neg">${money(t.outgo)}</div><span class="mini">С учётом инвестиций</span></div><div class="card"><div class="mini">Активные проекты</div><div class="statnum">${Object.values(S.projects).filter(x=>x.open).length}</div><span class="tag green">Связанные бизнесы</span></div></div><div class="split" style="margin-top:16px"><div class="card"><h2>Комната студента</h2><div class="scene"><div class="shelf">📚🪴</div><div class="bed">🛏️</div><div class="desk">🪑💻</div><div class="person">🧍</div><span class="floor">ОБЩЕЖИТИЕ • ДЕНЬ ${S.day}</span><button class="primary" data-tab="work">Взяться за работу →</button></div><div class="actionbar"><button class="ghost" data-tab="life">Улучшить быт</button><button class="ghost" data-tab="market">Начать проект</button><button class="ghost" data-tab="finance">Финансовый отчёт</button></div></div><div class="card"><h2>События и задачи</h2><div class="notice">Ежедневное проживание: 450 ₽ — <b>условный баланс</b>. Работай, отдыхай, инвестируй и следи за кассовыми разрывами.</div><div class="lines">${(S.events.length?S.events:[{day:1,msg:'Первый день. За спиной — учеба, впереди — рынок труда.'}]).slice(0,7).map(x=>`<div class="line"><span>${x.msg}</span><span class="mini">День ${x.day}</span></div>`).join('')}</div></div></div>`}
function works(){let jobs=WORK.filter(x=>(filter==='Все'||x.category===filter)&&x.name.toLowerCase().includes(query.toLowerCase()));return header('Биржа подработок','24 способа заработать. Суммы — модель игры, не подтверждённые рыночные ставки.')+`<div class="toolbar"><input id="search" placeholder="Поиск профессии…" value="${esc(query)}"><select id="filter">${['Все','Онлайн','Офлайн','Гибрид'].map(x=>`<option ${x===filter?'selected':''}>${x}</option>`).join('')}</select></div><div class="listcards">${jobs.map(x=>`<div class="card job"><div class="row-between"><span class="emoji">${x.icon}</span><span class="tag">${x.category}</span></div><strong>${x.name}</strong><div class="mini grow">${x.description}</div><div class="mini">⏱ ${x.hours} ч · валовая оплата ≈ ${money(x.base)} · издержки ≈ ${money(x.cost)}</div><div class="bottom"><span class="tag yellow">Навык: ${S.skills[x.id]||0}</span><button class="primary" data-work="${x.id}" ${S.hours<x.hours||S.energy<15?'disabled':''}>Взять заказ</button></div></div>`).join('')}</div>`}
function market(){return header('Рынок идей и предприятий','24 самостоятельных проекта; один человек может вести несколько направлений')+`<div class="listcards">${PROJECTS.map(x=>`<div class="card job"><div class="row-between"><span class="emoji">${x.icon}</span><span class="tag">${x.category}</span></div><strong>${x.name}</strong><div class="mini grow">Запуск: ${money(x.startup)} · условные ежедневные затраты: ${money(x.upkeep)}</div><div class="bottom"><span class="tag ${pr(x.id)?.open?'green':''}">${pr(x.id)?.open?'Уже открыт':'Риск убытка'}</span><button class="primary" data-open="${x.id}" ${pr(x.id)?.open||S.cash<x.startup?'disabled':''}>${pr(x.id)?.open?'Открыт':'Запустить'}</button></div></div>`).join('')}</div>`}
function projects(){let active=PROJECTS.filter(x=>pr(x.id)?.open);return header('Мои проекты','Публикации, аудитория, управление, зарплатные расходы и ежедневная выручка')+(active.length?`<div class="listcards">${active.map(x=>{let p=pr(x.id),f=ledgerTotals(Infinity,x.id);return `<div class="card job"><div class="row-between"><strong>${x.icon} ${x.name}</strong><span class="tag green">Работает</span></div><div class="grid"><div><div class="mini">Аудитория</div><b>${money(p.audience).replace(' ₽','')}</b></div><div><div class="mini">Работы</div><b>${p.posts}</b></div><div><div class="mini">Сотрудники</div><b>${p.staff}</b></div></div><div class="project-note">Денежный результат с запуска: <b class="${f.net>=0?'pos':'neg'}">${money(f.net)}</b>. Затраты на запуск включены.</div><div class="btnrow"><button class="primary" data-produce="${x.id}" ${S.hours<3||S.energy<17?'disabled':''}>+ Сделать работу (3 ч)</button><button class="ghost" data-hire="${x.id}">Нанять (${money(9500+p.staff*5000)})</button><button class="ghost" data-fproject="${x.id}">Аналитика</button></div></div>`}).join('')}</div>`:`<div class="card"><h2>Пока нет собственных проектов</h2><p>Сначала заработай стартовый капитал на подработках, затем выбери направление: биты, YouTube, VK, Дзен, веб-студия, маркетплейсы, реклама и другие.</p><button class="primary" data-tab="market">Посмотреть все идеи</button></div>`)}
function finance(){let t=ledgerTotals(period,selectedFinance),rows=S.ledger.filter(x=>S.day-x.day<period&&(selectedFinance==='all'||x.project===selectedFinance)).slice().reverse().slice(0,100);return header('Финансовый центр','Единый журнал — поступления, денежный поток, капитальные затраты и долги')+`<div class="toolbar"><select id="period"><option value="7" ${period===7?'selected':''}>7 дней</option><option value="30" ${period===30?'selected':''}>30 дней</option><option value="90" ${period===90?'selected':''}>90 дней</option><option value="99999" ${period===99999?'selected':''}>Всё время</option></select><select id="finproject"><option value="all">Все направления</option>${PROJECTS.filter(x=>pr(x.id)?.open).map(x=>`<option value="${x.id}" ${selectedFinance===x.id?'selected':''}>${x.name}</option>`).join('')}</select><button class="ghost" data-act="exportcsv">Скачать CSV</button><button class="ghost" data-act="exportjson">Сохранение JSON</button></div><div class="grid four"><div class="card"><div class="mini">Денежные поступления</div><div class="statnum pos">${money(t.income)}</div></div><div class="card"><div class="mini">Денежные выплаты</div><div class="statnum neg">${money(t.outgo)}</div></div><div class="card"><div class="mini">Чистый денежный поток</div><div class="statnum">${money(t.net)}</div></div><div class="card"><div class="mini">Имущество / долг</div><div class="statnum">${money(assetValue())}</div><span class="mini">Долг: ${money(S.debt)}</span></div></div><div class="card" style="margin-top:16px"><h2>Динамика денежных потоков</h2><div class="legend"><span><i class="dot" style="background:#5ce2ad"></i>Поступления</span><span><i class="dot" style="background:#ffb66c"></i>Выплаты</span></div><canvas id="financechart" class="chart"></canvas><div class="notice">Денежный поток ≠ бухгалтерская прибыль. Запуск бизнеса и покупка оборудования сейчас учитываются как денежные инвестиции. Оценка активов носит условный характер.</div></div><div class="card" style="margin-top:16px"><h2>Журнал операций (${t.count} записей)</h2><div class="tablewrap"><table><thead><tr><th>День</th><th>Событие</th><th>Статья</th><th>Сумма</th><th>Примечание</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${x.day}</td><td>${esc(x.source)}</td><td>${esc(x.category)}</td><td class="${x.amount>=0?'pos':'neg'}">${money(x.amount)}</td><td>${esc(x.note)}</td></tr>`).join('')||'<tr><td colspan="5">Операций пока нет</td></tr>'}</tbody></table></div></div>`}
function life(){return header('Быт, активы и обязательства','Покупки уменьшают деньги, но техника остаётся частью имущества')+`<div class="grid"><div class="card"><div class="mini">Деньги</div><div class="statnum">${money(S.cash)}</div></div><div class="card"><div class="mini">Долги</div><div class="statnum neg">${money(S.debt)}</div></div><div class="card"><div class="mini">Чистый капитал</div><div class="statnum">${money(net())}</div></div></div><div class="headrow" style="margin-top:26px"><h2>Оборудование</h2></div><div class="listcards">${ASSETS.map((x,i)=>`<div class="card job"><div class="row-between"><b>${x[1]} ${x[0]}</b><span class="tag">${money(x[2])}</span></div><div class="mini grow">${x[4]} · Условная стоимость перепродажи ${money(x[3])}</div><button class="primary" data-asset="${i}" ${has(i)||S.cash<x[2]?'disabled':''}>${has(i)?'Уже куплено':'Купить'}</button></div>`).join('')}</div><div class="card" style="margin-top:15px"><h3>Обязательные личные расходы</h3><p>Ежедневно списывается условная стоимость жизни 450 ₽. Это ускоренный игровой эквивалент аренды, питания, связи и бытовых расходов, а не проверенная сумма по какому-либо городу.</p><button class="ghost" data-act="nextday">Перейти к следующему дню</button></div>`}
function guide(){return header('Справочник модели','Прозрачность и ограничения реализованной экономической симуляции')+`<div class="card"><h2>Что реально, а что смоделировано?</h2><p>Все игровые ставки по работам, стартовые вложения, стоимость жизни, коэффициенты спроса и ежедневная выручка сейчас являются <b>игровыми сценарными параметрами</b>. Их нельзя выдавать за подтверждённые зарплаты, рыночные цены или вероятности.</p><p>В реальной российской экономике значения зависят от региона, занятости, налогового режима, договоров, вычетов, сезонности и доступности платформ. Следующая исследовательская версия должна снабжать каждый параметр датой, географией и источником.</p><h3>Подтверждённые официальные материалы</h3><p><a href="https://yandex.ru/dev/games/doc/ru/sdk" target="_blank" rel="noopener" style="color:#92c2ff">Яндекс Игры — SDK</a> · <a href="https://yandex.ru/dev/games/doc/ru/sdk/sdk-adv" target="_blank" rel="noopener" style="color:#92c2ff">Реклама в SDK</a> · <a href="https://npd.nalog.ru/" target="_blank" rel="noopener" style="color:#92c2ff">ФНС — налог на профессиональный доход</a></p><h3>Системы симуляции</h3><p>Доходы и расходы; журнал операций; имущество и капитал; энергия и время; проекты, персонал, аудитория; денежные риски и случайные события. Налог в проектах — упрощённый игровой сценарий, а не универсальная ставка для всех бизнесов.</p><div class="notice">Облако и реклама доступны только при подключённом SDK и необходимых возможностях Яндекс Игр. Реальные покупки в прототипе не реализованы; локально рекламные награды не имитируются.</div><div class="actionbar"><button class="ghost" data-act="exportjson">Экспортировать сохранение</button><button class="ghost" data-act="importjson">Импортировать сохранение</button><button class="ghost" data-act="backupjson">Скачать резервную копию</button><button class="ghost" data-act="archivejson">Скачать исходник до восстановления</button><button class="ghost" data-act="reset">Начать новую жизнь</button></div></div>`}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function render(){document.querySelector('#cash').textContent=money(S.cash);document.querySelector('#day').textContent=S.day;document.querySelector('#net').textContent=money(net());document.querySelector('#energy').textContent=S.energy+'%';document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));document.querySelector('#main').innerHTML=({home,work:works,projects,market,finance,life,guide})[tab]();if(tab==='finance')chart(document.querySelector('#financechart'),financeData());}
function showModal(html){if(modal?.id)markPendingAction('work',modal.id);document.querySelector('#modal').innerHTML=`<div class="modal"><div class="modalhead"><h2>Мини-игра: рабочая смена</h2><button class="close" data-act="closemodal">✕</button></div>${html}</div>`;document.querySelector('#modal').classList.remove('hidden')}
function closeModal(){document.querySelector('#modal').classList.add('hidden');modal=null;if(S.pendingAction){S.pendingAction=null;save();}}
function startWork(id){let job=WORK.find(x=>x.id===id);if(!job)return;if(S.hours<job.hours||S.energy<15)return toast('Недостаточно времени или энергии');modal={id,type:job.mechanic,score:0,tries:0};let intro=`<div class="muted">${job.icon} ${job.name} · ${job.hours} ч · возможны издержки ${money(job.cost)}. Результат влияет на оплату.</div>`;if(job.mechanic==='sort'){modal.answers=Array.from({length:4},()=>Math.floor(rnd(1,5)));let target=modal.answers[0];modal.correct=target;showModal(intro+`<p>Найди карточку с номером <b>${target}</b>. Один правильный ответ — выполненный заказ.</p><div class="tiles gameboard">${[1,2,3,4].map(n=>`<button class="tile" data-answer="${n}">${n}</button>`).join('')}</div>`)}else if(job.mechanic==='logic'){let a=Math.floor(rnd(5,35)),b=Math.floor(rnd(4,20));modal.correct=a+b;let opts=[a+b,a+b+3,a+b-2,a+b+5].sort(()=>Math.random()-.5);showModal(intro+`<p>Клиенту нужен точный расчёт: <b>${a} + ${b} = ?</b></p><div class="tiles gameboard">${opts.map(n=>`<button class="tile" data-answer="${n}">${n}</button>`).join('')}</div>`)}else if(job.mechanic==='memory'){let seq=Array.from({length:4},()=>Math.floor(rnd(1,5)));modal.seq=seq;modal.phase='memorize';showModal(intro+`<p>Запомни порядок ячеек: <b>${seq.join(' → ')}</b></p><button class="primary" data-act="memoryready">Запомнил — проверить</button>`)}else if(job.mechanic==='route'){let a=Math.floor(rnd(3,9)),b=Math.floor(rnd(7,13)),c=Math.floor(rnd(2,6));modal.correct=a+c;showModal(intro+`<p>Два маршрута: через центр — ${a+b} минут; через двор — ${a+c} минут. Какой быстрее?</p><div class="btnrow gameboard"><button class="ghost" data-answer="${a+b}">Через центр (${a+b} мин)</button><button class="ghost" data-answer="${a+c}">Через двор (${a+c} мин)</button></div>`)}else{modal.correct=3;showModal(intro+`<p>Нажми кнопку, когда шкала близка к зелёной зоне (60–80). Используй оценку времени.</p><input id="timerange" class="range" type="range" min="0" max="100" value="50"><div class="actionbar"><button class="primary" data-act="timing">Завершить операцию</button></div>`)} }
function workResult(success){if(!modal)return;let job=WORK.find(x=>x.id===modal.id);S.hours-=job.hours;S.energy=clamp(S.energy-(13+job.hours*3),0,100);S.stress=clamp(S.stress+Math.ceil(job.hours/2),0,100);let quality=success?rnd(.88,1.16):rnd(.38,.7);let gross=Math.round(job.base*quality*(1+Math.min(25,S.skills[job.id]||0)*.012));let cost=job.cost;book('Оплата труда',gross,job.name,'Результат мини-игры; игровая ставка');book('Рабочие издержки',-cost,job.name,'Транспорт, расходники и комиссии (модель)');S.skills[job.id]=(S.skills[job.id]||0)+1;S.workCount++;notice(job.name+': '+(success?'заказ выполнен':'часть задач выполнена')+', чистыми до личных расходов '+money(gross-cost));closeModal();save();render();toast((success?'Успешно! ':'Частично выполнено. ')+`Получено ${money(gross-cost)}`)}
function download(name,content,type){let blob=new Blob([content],{type});let url=URL.createObjectURL(blob);let a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function act(action){if(action==='nextday')rest();else if(action==='closemodal')closeModal();else if(action==='memoryready'&&modal){modal.phase='answer';modal.tries=0;document.querySelector('.modal .gameboard')?.remove();document.querySelector('.modal').innerHTML=`<div class="modalhead"><h2>Проверка памяти</h2><button class="close" data-act="closemodal">✕</button></div><p>Повтори последовательность из четырёх ячеек.</p><div class="tiles gameboard">${[1,2,3,4].map(n=>`<button class="tile" data-answer="${n}">${n}</button>`).join('')}</div><div id="sequencehint" class="mini">Введено: 0/4</div>`}else if(action==='timing'&&modal){let n=+document.querySelector('#timerange').value;workResult(n>=60&&n<=80)}else if(action==='exportcsv'){let text='День;Категория;Источник;Сумма;Примечание\n'+S.ledger.map(x=>[x.day,x.category,x.source,x.amount,x.note].map(y=>'"'+String(y).replaceAll('"','""')+'"').join(';')).join('\n');download('iz_nulya_finance.csv','\ufeff'+text,'text/csv;charset=utf-8')}else if(action==='exportjson')download('iz_nulya_save.json',JSON.stringify(S,null,2),'application/json');else if(action==='importjson'){
 let i=document.createElement('input');i.type='file';i.accept='.json,application/json';
 i.onchange=()=>{if(!i.files?.length)return;const r=new FileReader();r.onload=()=>{try{restoreSaveState(r.result);toast('Сохранение восстановлено');}catch(error){toast('Некорректный файл сохранения: '+error.message);}};r.onerror=()=>toast('Не удалось прочитать файл; текущий прогресс сохранён');r.readAsText(i.files[0]);};i.click();
 }else if(action==='backupjson')downloadSaveCopy('backup');else if(action==='archivejson')downloadSaveCopy('archive');
 else if(action==='reset'){
  if(confirm('Начать новую игру? Текущий прогресс будет заменён. Исходные данные останутся в резервной копии.')){
   try{const candidate=initial();restoreSaveState(candidate);loadWarnings=[];render();}catch(error){storageWarning('Новая игра не начата: '+error.message);}
  }
 }
}

document.addEventListener('click',e=>{let b=e.target.closest('button');if(!b)return;if(b.dataset.tab){tab=b.dataset.tab;filter='Все';query='';save();render();return}if(b.dataset.act){act(b.dataset.act);return}if(b.dataset.work){startWork(b.dataset.work);return}if(b.dataset.open){openProject(b.dataset.open);return}if(b.dataset.produce){produce(b.dataset.produce);return}if(b.dataset.hire){hire(b.dataset.hire);return}if(b.dataset.asset!==undefined){buyAsset(+b.dataset.asset);return}if(b.dataset.fproject){selectedFinance=b.dataset.fproject;tab='finance';render();return}if(b.dataset.answer!==undefined&&modal){let answer=+b.dataset.answer;if(modal.type==='memory'){if(answer===modal.seq[modal.tries]){modal.tries++;document.querySelector('#sequencehint').textContent='Введено: '+modal.tries+'/4';if(modal.tries===4)workResult(true)}else workResult(false)}else workResult(answer===modal.correct)} });
document.addEventListener('change',e=>{if(e.target.id==='filter'){filter=e.target.value;render()}if(e.target.id==='period'){period=+e.target.value;render()}if(e.target.id==='finproject'){selectedFinance=e.target.value;render()}});document.addEventListener('input',e=>{if(e.target.id==='search'){let p=e.target.selectionStart;query=e.target.value;render();let t=document.querySelector('#search');t.focus();t.setSelectionRange(p,p)}});
document.querySelector('#savebtn').addEventListener('click',()=>{if(save())toast('Сохранено на этом устройстве')});
window.GameTest={initial,book,advanceDay,ledgerTotals,net,WORK,PROJECTS,getState:()=>S,reset:()=>{S=initial();render()},openProject,produce,workResult};
