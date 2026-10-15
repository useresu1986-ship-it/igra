'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const scripts=[...fs.readFileSync(__dirname+'/index.html','utf8').matchAll(/<script src="([^"]+)"/g)].map(x=>x[1]);
const KEY='iz_nulya_v3_state',noop=()=>{};

function load(save){
 const storage=new Map(save?[[KEY,JSON.stringify(save)]]:[]),nodes={},inputs=[];
 function fake(){return {textContent:'',innerHTML:'',dataset:{},classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,insertAdjacentHTML:noop,insertBefore:noop,querySelector:()=>null,querySelectorAll:()=>[],style:{},focus:noop,setSelectionRange:noop,click:noop};}
 const document={querySelector:q=>nodes[q]||(nodes[q]=fake()),querySelectorAll:()=>[],getElementById:q=>nodes['#'+q]||(nodes['#'+q]=fake()),createElement:type=>{const el=fake();if(type==='input')inputs.push(el);return el;},addEventListener:noop,head:fake()};
 class FileReader { readAsText(file){this.result=file.content;this.onload();} }
 const ctx={document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},window:{},console,Math,JSON,Number,String,Array,Object,Date,Intl,setTimeout:noop,clearTimeout:noop,FileReader,confirm:()=>true};
 vm.createContext(ctx);
 for(const file of scripts)vm.runInContext(fs.readFileSync(__dirname+'/'+file,'utf8'),ctx,{filename:file});
 return {run:code=>vm.runInContext(code,ctx),read:()=>JSON.parse(vm.runInContext('JSON.stringify(S)',ctx)),persisted:()=>JSON.parse(storage.get(KEY)),inputs,ctx};
}

function legacy(count=0){
 return {version:3,day:1,cash:1500+count,debt:0,energy:90,stress:12,hours:12,rep:0,skills:{},owned:[],projects:{},ledger:Array.from({length:count},(_,i)=>({id:i+1,day:1,category:'Историческая операция',amount:1,source:'Старое сохранение',note:'',project:''})),events:[],tab:'home',workCount:0,lastBonus:0,seed:0};
}

function collisionSave(paid=true){
 const s=legacy();s.cash=5900;
 s.ledger=[
  {id:7,day:1,category:'Оплата клиентов',amount:1000,source:'Первый клиент'},
  {id:7,day:1,category:'Оплата клиентов',amount:1500,source:'Второй клиент'},
  {id:8,day:1,category:'Оплата клиентов',amount:2000,source:'Организация'},
  {id:9,day:1,category:'Учебная уплата НПД',amount:-100,source:'Налоговый кабинет'},
 ];
 s.economy={seq:1,receivables:[],losses:0,stats:{},history:[],settings:{},expansion:{living:'normal',contracts:{},channels:{},statistics:{},log:[],realism18:{region:'regional',priceIndex:1,priceMode:'fixed',anchorDay:1,tax:{status:'none',records:{7:{kind:'individual',paid},8:{kind:'business',paid:false},70:{kind:'exclude',paid:true}}}}}};
 return s;
}

function unique(s){assert.equal(new Set(s.ledger.map(x=>x.id)).size,s.ledger.length);assert(s.ledger.every(x=>Number.isSafeInteger(x.id)&&x.id>0));}
const cases=[];
function test(name,fn){cases.push([name,fn]);}

test('30000 operations: IDs never repeat across multiple trims',()=>{
 const game=load();const result=JSON.parse(game.run(`JSON.stringify((()=>{const seen=new Set();for(let i=0;i<30000;i++){book('Тест',i%2?-1:3,'Тест');const id=S.ledger.at(-1).id;if(seen.has(id))throw Error('Duplicate ID '+id);seen.add(id);}return {count:seen.size,last:S.ledger.at(-1).id,next:S.nextLedgerId,cash:S.cash};})())`));
 assert.deepEqual(result,{count:30000,last:30000,next:30001,cash:31500});unique(game.read());
});

test('counter survives reload and complete removal of retained journal rows',()=>{
 const s=legacy(12000),game=load(s);game.run("book('Тест',10,'Тест');book('Тест',-2,'Тест');save()");
 const restored=load(game.persisted());assert.equal(restored.read().nextLedgerId,12003);
 restored.run("S.ledger=[];save()");const empty=load(restored.persisted());empty.run("book('Тест',1,'Тест')");assert.equal(empty.read().ledger[0].id,12003);
});

test('legacy saves without counter, with gaps or stale counter',()=>{
 for(const next of [undefined,2,8000]){
  const s=legacy(3);s.ledger.forEach((x,i)=>x.id=[2,20,500][i]);if(next!==undefined)s.nextLedgerId=next;
  const game=load(s);assert.equal(game.read().nextLedgerId,next===8000?8000:501);assert.equal(game.read().cash,s.cash);unique(game.read());
 }
 const game=load(legacy());assert.equal(game.read().nextLedgerId,1);
});

test('migration reserves future rows and repairs malformed or repeated IDs',()=>{
 const s=legacy(6);s.ledger.forEach((x,i)=>x.id=[1,1,2,0,null,'bad'][i]);const game=load(s);unique(game.read());
 assert.equal(game.read().ledger[2].id,2);assert.equal(game.read().ledger[1].id,3);
 const once=game.run('JSON.stringify(S)');game.run('initializeLedgerIds(S)');assert.equal(game.run('JSON.stringify(S)'),once);
});

test('duplicate paid tax links preserve prior paid/due totals without money movements',()=>{
 const s=collisionSave(),game=load(s),state=game.read();unique(state);
 assert.deepEqual(state.ledger.map(x=>x.id),[7,71,8,9]);
 assert.equal(state.cash,s.cash);assert.equal(state.debt,s.debt);assert.equal(state.ledger.length,s.ledger.length);
 assert.deepEqual(state.ledger.map(({id,...row})=>row),s.ledger.map(({id,...row})=>row));
 assert.equal(game.run('annualTax18().tax'),220);assert.equal(game.run('annualTax18().paid'),100);assert.equal(game.run('annualTax18().due'),120);
 game.run('save()');const saved=game.persisted();
 for(let i=0;i<3;i++){const again=load(saved);assert.equal(again.read().cash,s.cash);assert.deepEqual(again.read().ledger,state.ledger);assert.equal(again.run('annualTax18().due'),120);}
});

test('unpaid duplicate links remain independent after migration',()=>{
 const game=load(collisionSave(false));assert.equal(game.run('annualTax18().due'),220);
 game.run("classifyReceipt18(71,'exclude')");assert.equal(game.run('annualTax18().due'),160);
 assert.equal(game.read().economy.expansion.realism18.tax.records['7'].kind,'individual');
});

test('tax is paid once after migration and reload, new income gets no old tax mark',()=>{
 const game=load(collisionSave());game.run('payNpd18();save()');assert.equal(game.read().cash,5780);assert.equal(game.run('annualTax18().due'),0);
 const again=load(game.persisted());again.run('payNpd18()');assert.equal(again.read().cash,5780);assert.equal(again.read().ledger.length,5);
 again.run("book('Оплата клиентов',100,'Новый клиент')");assert.equal(again.run('receiptStatus18(S.ledger.at(-1))'),null);unique(again.read());
});

test('orphan tax IDs are reserved even with an empty ledger',()=>{
 const s=collisionSave();s.ledger=[];const game=load(s);game.run("book('Оплата клиентов',100,'Тест')");assert.equal(game.read().ledger[0].id,71);assert.equal(game.run('receiptStatus18(S.ledger[0])'),null);
});

test('JSON import uses the same migration before activating the save',()=>{
 const game=load();game.run("act('importjson')");game.inputs[0].files=[{content:JSON.stringify(collisionSave())}];game.inputs[0].onchange();
 unique(game.read());assert.equal(game.read().cash,5900);assert.equal(game.run('annualTax18().due'),120);assert.equal(game.persisted().nextLedgerId,72);
});

test('cloud load migrates IDs without replaying paid invoices or expenses',async()=>{
 const s=collisionSave();s.economy.contracts11={offers:[],active:null,history:[{id:9,job:'w0',day:1,due:1,gross:999,status:'paid'}],pending:[],lastDay:1,seq:9};
 const game=load();game.ctx.cloudJSON=JSON.stringify(s);game.run('yandexPlayer={getData:async()=>({izNulyaSave:cloudJSON})}');await game.run('cloudLoadV8()');
 unique(game.read());assert.equal(game.read().cash,5900);assert.equal(game.read().ledger.length,4);assert.equal(game.read().economy.contracts11.history[0].id,9);
 const again=load(game.persisted());assert.equal(again.read().cash,5900);assert.equal(again.read().ledger.length,4);
});

test('invalid amount or exhausted numeric IDs cannot change money or append a row',()=>{
 const game=load(),before=game.run('JSON.stringify(S)');assert.throws(()=>game.run("book('Тест',NaN,'Тест')"));assert.equal(game.run('JSON.stringify(S)'),before);
 game.run('S.nextLedgerId=Number.MAX_SAFE_INTEGER');const exhausted=game.run('JSON.stringify(S)');assert.throws(()=>game.run("book('Тест',100,'Тест')"),/exhausted/);assert.equal(game.run('JSON.stringify(S)'),exhausted);
});

test('contract settlement crossing trim reverses immediate pay and creates exactly one receivable',()=>{
 const s=legacy(12000);s.cash=50000;const game=load(s);
 const offer=game.run('contracts11().offers[0]');const cost=game.run(`WORK.find(x=>x.id===${JSON.stringify(offer.job)}).cost`);
 assert(game.run(`takeContract11(${offer.id})`));game.run('workResult(true)');
 assert.equal(game.read().cash,50000-cost);assert.equal(game.run('contracts11().pending.length'),1);assert.equal(game.run('contracts11().history.length'),1);
 assert.equal(game.read().ledger.filter(x=>x.id>=12001&&x.category==='Перевод в дебиторскую задолженность').length,1);
 assert(game.run('labour19().sessions.at(-1).gross')>0);unique(game.read());
 game.run('save()');const again=load(game.persisted());assert.equal(again.read().cash,50000-cost);assert.equal(again.run('contracts11().pending.length'),1);
});

test('ordinary shift analytics keep the new entries when the journal is trimmed',()=>{
 const game=load(legacy(12000)),before=game.read().cash;game.run("startWork('w0');workResult(true)");
 const session=game.read().economy.expansion.labour19.sessions.at(-1);assert(session.gross>0);assert.equal(session.costs,120);assert.equal(session.net,game.read().cash-before);unique(game.read());
});

(async()=>{
 for(const [name,fn] of cases){await fn();console.log('PASS ledger: '+name);}
 console.log('PASS ledger IDs: '+cases.length+' scenarios');
})().catch(error=>{console.error(error);process.exitCode=1;});
