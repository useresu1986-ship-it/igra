'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),noop=()=>{},KEY='iz_nulya_v3_state';
const scripts=[...fs.readFileSync(__dirname+'/index.html','utf8').matchAll(/<script src="([^"]+)"/g)].map(x=>x[1]);
function load(raw,options={}){
 const storage=new Map(raw===undefined?[]:[[KEY,typeof raw==='string'?raw:JSON.stringify(raw)]]),nodes={},inputs=[],downloads=[],writes=[];
 const fake=()=>({textContent:'',innerHTML:'',dataset:{},handlers:{},classList:{add:noop,remove:noop,toggle:noop},addEventListener(type,fn){this.handlers[type]=fn;},insertAdjacentHTML:noop,insertBefore:noop,querySelector:()=>null,querySelectorAll:()=>[],style:{},focus:noop,setSelectionRange:noop,click:noop});
 const document={querySelector:q=>nodes[q]||(nodes[q]=fake()),getElementById:q=>nodes['#'+q]||(nodes['#'+q]=fake()),querySelectorAll:()=>[],addEventListener:noop,createElement:type=>{const n=fake();if(type==='input')inputs.push(n);return n;},head:fake()};
 class FileReader{readAsText(file){this.result=file.content;this.onload();}}
 const ctx={document,window:{},localStorage:{getItem:k=>{if(options.readError)throw Error('Storage denied');return storage.get(k)??null;},setItem:(k,v)=>{if(options.writeError)throw Error('Quota exceeded');storage.set(k,v);writes.push({key:k,value:v});}},console,Math,JSON,Number,String,Array,Object,Date,Intl,setTimeout:noop,clearTimeout:noop,FileReader,TextEncoder,confirm:()=>true};vm.createContext(ctx);
 let bootError;try{for(const file of scripts)vm.runInContext(fs.readFileSync(__dirname+'/'+file,'utf8'),ctx,{filename:file});}catch(e){bootError=e;}
 const run=code=>vm.runInContext(code,ctx),read=()=>JSON.parse(run('JSON.stringify(S)'));
 if(!bootError){ctx.download=(name,content,type)=>downloads.push({name,content,type});run('download=globalThis.download');}
 return {run,read,storage,nodes,inputs,downloads,writes,bootError,options,reload:()=>load(storage.get(KEY)),import:content=>{run("act('importjson')");const input=inputs.at(-1);input.files=[{content:typeof content==='string'?content:JSON.stringify(content)}];input.onchange();}};
}
const seed=()=>load().read(),cases=[],test=(name,fn)=>cases.push([name,fn]);
test('ordinary save and reload preserve money, assets, business, debt and ledger',()=>{
 const g=load();g.run("S.cash=100000;openProject('p19');buyAsset(0);book('Оплата клиентов',1000,'Клиент','');save()");const s=g.read(),r=g.reload();assert(!r.bootError);for(const key of ['cash','debt','owned','projects','ledger'])assert.deepEqual(r.read()[key],s[key]);
});
test('corrupt JSON is visible, preserved and cannot be overwritten by autosave',()=>{
 const g=load('{broken');assert(!g.bootError);g.run('initializeGame();save()');assert.equal(g.storage.get(KEY),'{broken');assert(g.nodes['#main'].innerHTML.includes('Сохранение требует восстановления'));
});
test('unsupported version is retained rather than replaced with a new game',()=>{
 const s=seed();s.version=99;s.cash=123456;const g=load(s);assert(!g.bootError);g.run('initializeGame();save()');assert.equal(JSON.parse(g.storage.get(KEY)).cash,123456);assert(g.nodes['#main'].innerHTML.includes('99'));
});
test('missing optional fields and partial economy are repaired without deleting progress',()=>{
 const s=seed();s.cash=12345;s.economy={};delete s.skills;delete s.events;delete s.energy;const g=load(s);assert(!g.bootError);assert(Number.isFinite(g.run('v9Forecast(1).end.cash')));assert.equal(g.read().cash,12345);assert(Array.isArray(g.read().events));assert(g.storage.has(KEY+'_recovery'));
});
test('missing essential money or assets is rejected instead of inventing resources',()=>{
 for(const key of ['cash','debt','owned','projects','ledger','day']){const s=seed();delete s[key];const raw=JSON.stringify(s),g=load(raw);assert(!g.bootError,key);g.run('initializeGame();save()');assert.equal(g.storage.get(KEY),raw,key);assert(g.nodes['#main'].innerHTML.includes(key),key);}
});
test('invalid nested structures never crash module initialization',()=>{
 for(const change of [s=>s.projects.p19=null,s=>s.economy.receivables={},s=>s.economy.expansion.world.claimed={},s=>s.economy.business14={byProject:{p19:{stock:-5}},history:[]}]){const s=seed();change(s);const raw=JSON.stringify(s),g=load(raw);assert(!g.bootError,g.bootError?.stack);g.run('initializeGame();save()');assert.equal(g.storage.get(KEY),raw);}
});
test('bad import preserves both live progress and primary local save',()=>{
 const g=load();g.run("book('Оплата клиентов',1234,'Клиент','');save()");const before=g.read(),raw=g.storage.get(KEY);g.import({version:3,cash:900,ledger:[],owned:[],projects:null});assert.deepEqual(g.read(),before);assert.equal(g.storage.get(KEY),raw);
});
test('import render failure rolls back state and storage',()=>{
 const g=load();g.run('save()');const before=g.read(),raw=g.storage.get(KEY),s=seed();s.cash=23456;g.run("render=()=>{save();throw Error('render failed')}");g.import(s);assert.deepEqual(g.read(),before);assert.equal(g.storage.get(KEY),raw);
});
test('quota failure returns false and save button does not claim success',()=>{
 const g=load(undefined,{writeError:true});assert.equal(g.run('save()'),false);g.nodes['#savebtn'].handlers.click();assert.notEqual(g.nodes['#toast'].textContent,'Сохранено на этом устройстве');assert(g.nodes['#savebtn'].textContent.includes('Не сохранено'));
});
test('unavailable localStorage shows recovery screen and does not overwrite',()=>{
 const g=load(undefined,{readError:true});assert(!g.bootError);g.run('initializeGame()');assert(g.nodes['#main'].innerHTML.includes('Сохранение требует восстановления'));
});
test('legacy active contract is safely released without paying or changing resources',()=>{
 const s=seed(),c=s.economy.contracts11;c.active={id:100,job:'w11',quote:3000};c.offers=[{id:100,job:'w11',quote:3000,expires:3,delay:1,risk:0,taken:false}];const g=load(s);assert(!g.bootError);assert.equal(g.run('contracts11().active'),null);assert.equal(g.read().cash,s.cash);assert.deepEqual(g.read().ledger,s.ledger);
});
test('legacy unfinished urgent task does not leak bonus into an ordinary shift',()=>{
 const s=seed(),w=s.economy.expansion.world;w.opportunities=[{id:7,job:'w11',issued:1,expires:3,bonus:9999,status:'accepted'}];w.activeOffer=w.opportunities[0];const g=load(s);assert(!g.bootError);g.run("startWork('w11');workResult(true)");assert.equal(g.run("S.ledger.filter(x=>x.category==='Премия за заказ').length"),0);
});
test('missing counters are restored above all existing obligation IDs',()=>{
 const s=seed();s.economy.seq=undefined;s.economy.receivables=[{id:80,project:'p0',gross:100,due:4,created:1,label:'Клиент'}];s.economy.invoiceSettlements={90:'paid'};const g=load(s);assert(!g.bootError);assert.equal(g.run("econInvoice('p0',100,'Новый счёт',2).id"),91);
});
test('missing paid reward markers are rebuilt from explicit ledger links',()=>{
 const s=seed();s.workCount=1;delete s.economy.expansion.world.claimed;s.ledger=[{id:1,day:1,category:'Награда за достижение',amount:700,source:'Игровая цель',note:'',missionId:'start'}];const g=load(s);const before=g.read().cash;g.run("claimMission('start')");assert.equal(g.read().cash,before);
});
test('old ambiguous reward history is rejected when claim markers are missing',()=>{
 const s=seed();delete s.economy.expansion.world.claimed;s.ledger=[{id:1,day:1,category:'Награда за достижение',amount:1000,source:'Игровая цель'}];const raw=JSON.stringify(s),g=load(raw);assert(!g.bootError);g.run('initializeGame();save()');assert.equal(g.storage.get(KEY),raw);
});
test('JSON round trip retains active business inventory, staff, debts and unknown fields',()=>{
 const g=load();g.run("S.cash=100000;openProject('p19');window.Inventory23.buy('p19',5);window.Team27.hireRole('p19','operations');S.customFuture={flag:'preserve'};save()");g.run("act('exportjson')");const exported=JSON.parse(g.downloads.at(-1).content),other=load();other.import(exported);const restored=other.reload();for(const key of ['cash','debt','owned','projects','ledger','customFuture'])assert.deepEqual(restored.read()[key],exported[key]);
});
test('prototype keys and nonfinite JSON numbers are rejected before state replacement',()=>{
 for(const raw of ['{"version":3,"__proto__":{}}','{"version":3,"cash":1e999}']){const g=load();g.run('save()');const old=g.storage.get(KEY);g.import(raw);assert.equal(g.storage.get(KEY),old);}
});
test('cloud uses the same validation and never replaces progress with malformed data',async()=>{
 const g=load();g.run('save()');const raw=g.storage.get(KEY),before=g.read();g.run("yandexPlayer={getData:async()=>({izNulyaSave:JSON.stringify({version:3,cash:500,day:1,owned:[],projects:{},ledger:[],economy:{receivables:{}}})})}");await g.run('cloudLoadV8()');assert.deepEqual(g.read(),before);assert.equal(g.storage.get(KEY),raw);
});
test('one completed contract writes only the final state, never a temporary wage',()=>{
 const g=load();g.run("initializeGame();S.cash=10000;contracts11().offers=[{id:999,job:'w11',quote:3000,delay:1,risk:0,expires:2,taken:false}];takeContract11(999)");
 g.writes.length=0;g.run('workResult(true)');const commits=g.writes.filter(x=>x.key===KEY);assert.equal(commits.length,1);
 const s=JSON.parse(commits[0].value);assert.equal(s.cash,9900);assert.equal(s.economy.contracts11.pending.length,1);assert(s.ledger.some(r=>r.category==='Перевод в дебиторскую задолженность'));
});
test('failed financial work rolls back memory and leaves persisted state unchanged',()=>{
 const g=load();g.run("initializeGame();startWork('w11')");const before=g.read(),raw=g.storage.get(KEY);g.run("const oldBook=book;book=(category,...rest)=>{if(category==='Рабочие издержки')throw Error('posting failed');return oldBook(category,...rest)}");
 assert.throws(()=>g.run('workResult(true)'));assert.deepEqual(g.read(),before);assert.equal(g.storage.get(KEY),raw);
});
test('cloud round trip uses v3 and preserves resources without repeated operations',async()=>{
 const g=load();g.run("S.cash=90000;openProject('p19');window.Inventory23.buy('p19',5);save();let cloudData;yandexPlayer={setData:async data=>{cloudData=data},getData:async()=>cloudData}");
 const before=g.read();await g.run('cloudSaveV8()');await g.run('cloudLoadV8()');for(const key of ['cash','debt','ledger','owned','projects'])assert.deepEqual(g.read()[key],before[key]);
 await g.run('cloudLoadV8()');assert.equal(g.read().cash,before.cash);
});
test('new reward links survive reload even if claimed list is missing',()=>{
 const g=load();g.run("S.workCount=1;claimMission('start')");const s=g.read();assert.equal(s.ledger.at(-1).missionId,'start');delete s.economy.expansion.world.claimed;
 const r=load(s);const cash=r.read().cash;r.run("claimMission('start')");assert.equal(r.read().cash,cash);
});
test('missing action resources in progressed save are rejected rather than granted anew',()=>{
 const s=seed();s.day=10;delete s.energy;const raw=JSON.stringify(s),g=load(raw);assert(!g.bootError);g.run('initializeGame();save()');assert.equal(g.storage.get(KEY),raw);
});
test('damaged published video is rejected before a day can generate NaN progress',()=>{
 const s=seed();s.projects.p3={open:true,posts:1,audience:20,staff:0,automation:0};s.economy.yt15={channels:{p3:{videos:[{id:1,quality:'bad'}],subscribers:20}},seq:2,history:[],method:'simulation'};
 const raw=JSON.stringify(s),g=load(raw);assert(!g.bootError);g.run('initializeGame();save()');assert.equal(g.storage.get(KEY),raw);assert(g.nodes['#main'].innerHTML.includes('Сохранение требует восстановления'));
});
test('missing warehouse stock cannot silently delete previously purchased goods',()=>{
 const s=seed();s.projects.p19={open:true,posts:0,audience:0,staff:0,automation:0};s.economy.business14={history:[],byProject:{p19:{unitsSold:0}},round:0};
 const raw=JSON.stringify(s),g=load(raw);assert(!g.bootError);g.run('initializeGame();save()');assert.equal(g.storage.get(KEY),raw);
});
test('missing tax records with a retained NPD payment cannot erase payment markers',()=>{
 const s=seed();s.ledger=[{id:1,day:1,category:'Учебная уплата НПД',amount:-100,source:'Налог'}];delete s.economy.expansion.realism18.tax.records;
 const raw=JSON.stringify(s),g=load(raw);assert(!g.bootError);g.run('initializeGame();save()');assert.equal(g.storage.get(KEY),raw);
});
test('failed backup or commit does not install imported progress',()=>{
 const g=load();g.run('save()');const before=g.read(),raw=g.storage.get(KEY),candidate=seed();candidate.cash=50000;g.options.writeError=true;g.import(candidate);
 assert.deepEqual(g.read(),before);assert.equal(g.storage.get(KEY),raw);
});
test('late advertising callback cannot reward a different game after reset',()=>{
 const g=load();g.run("let adCallbacks;yandexSDK={adv:{showRewardedVideo:o=>{adCallbacks=o.callbacks}},features:{}};watchRewarded();act('reset')");
 const before=g.read();g.run('adCallbacks.onRewarded()');assert.equal(g.read().energy,before.energy);assert.equal(g.run('sys().lastAdDay'),undefined);
});
(async()=>{let failed=0;for(const [name,fn] of cases){try{await fn();console.log('PASS '+name)}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack)}}console.log(`Save recovery: ${cases.length-failed}/${cases.length} passed; ${failed} failed`);if(failed)process.exitCode=1;})();
