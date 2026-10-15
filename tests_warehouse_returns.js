'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),noop=()=>{};
const scripts=[...fs.readFileSync(__dirname+'/index.html','utf8').matchAll(/<script src="([^"]+)"/g)].map(x=>x[1]);
function load(saved){
 const storage=new Map(saved?[['iz_nulya_v3_state',JSON.stringify(saved)]]:[]),nodes={};
 const fake=()=>({textContent:'',innerHTML:'',dataset:{},classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,insertAdjacentHTML:noop,insertBefore:noop,querySelector:()=>null,querySelectorAll:()=>[],style:{},focus:noop,setSelectionRange:noop});
 const document={querySelector:q=>nodes[q]||(nodes[q]=fake()),getElementById:q=>nodes['#'+q]||(nodes['#'+q]=fake()),querySelectorAll:()=>[],createElement:fake,addEventListener:noop,head:fake()};
 const ctx={document,window:{},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},console,Math,JSON,Number,String,Array,Object,Date,Intl,setTimeout:noop,clearTimeout:noop,confirm:()=>true};vm.createContext(ctx);
 for(const file of scripts)vm.runInContext(fs.readFileSync(__dirname+'/'+file,'utf8'),ctx,{filename:file});
 const run=code=>vm.runInContext(code,ctx),read=()=>JSON.parse(run('JSON.stringify(S)'));
 return {run,read,ctx,reload:()=>{run('save()');return load(JSON.parse(storage.get('iz_nulya_v3_state')));}};
}
function game(){const g=load();g.run("S.cash=1000000;openProject('p19');window.Inventory23.record('p19')");return g;}
const cases=[];function test(name,fn){cases.push([name,fn]);}

test('manual purchase cannot consume space reserved by prepaid shipments',()=>{
 const g=game();g.run("for(let i=0;i<5;i++)window.Suppliers26.order('p19','budget',20)");
 const before=g.read();assert.equal(g.run("window.Inventory23.buy('p19',20).ok"),false);
 assert.equal(g.read().cash,before.cash);assert.equal(g.read().ledger.length,before.ledger.length);assert.equal(g.run("window.Inventory23.stats('p19').stock"),0);
});
test('refund of two prices equals the actual sale prices',()=>{
 const g=game();g.run("window.Inventory23.buy('p19',5);window.Inventory23.price('p19',690);window.Inventory23.sell('p19',1);window.Inventory23.price('p19',1490);window.Inventory23.sell('p19',1)");
 const before=g.read().cash;assert.equal(g.run("window.Inventory23.refund('p19',2).amount"),2180);assert.equal(g.read().cash,before-2180);
});
test('return at full capacity retains paid goods without exceeding 100 units',()=>{
 const g=game();g.run("window.Inventory23.buy('p19',5);window.Inventory23.sell('p19',5);for(let i=0;i<5;i++)window.Inventory23.buy('p19',20)");
 assert(g.run("window.Inventory23.refund('p19',1).ok"));assert.equal(g.run("window.Inventory23.stats('p19').stock"),100);assert.equal(g.run("window.Inventory23.record('p19').waitingStock"),1);
});

test('supplier rejects an oversized order without partial prepayment',()=>{
 const g=game();g.run("for(let i=0;i<5;i++)window.Inventory23.buy('p19',20)");const before=g.read();
 assert.equal(g.run("window.Suppliers26.order('p19','fast',5).ok"),false);assert.deepEqual(g.read(),before);
});
test('legacy prepaid overflow is queued, preserved across reload and delivered only once',()=>{
 const g=game(),s=g.read(),r=s.economy.business14.byProject.p19;
 r.stock=95;r.deliveries=[{id:1,count:20,unit:390,freight:450,due:1,status:'transit'}];delete r.warehouseVersion;delete r.sales;
 const restored=load(s),cash=restored.read().cash,ledger=restored.read().ledger;
 assert.equal(restored.run('window.Suppliers26.deliver().length'),1);
 assert.equal(restored.run("window.Inventory23.stats('p19').stock"),100);assert.equal(restored.run("window.Inventory23.stats('p19').waiting"),15);
 assert.equal(restored.run('window.Suppliers26.deliver().length'),0);assert.equal(restored.read().cash,cash);assert.deepEqual(restored.read().ledger,ledger);
 const again=restored.reload();assert.equal(again.run('window.Suppliers26.deliver().length'),0);
 assert.equal(again.run("window.Inventory23.stats('p19').waiting"),15);
 assert.equal(again.run('window.Suppliers26.inventoryValue().total'),115*420);
 assert(again.run("window.Inventory23.sell('p19',1).ok"));assert.equal(again.run("window.Inventory23.stats('p19').stock"),100);assert.equal(again.run("window.Inventory23.stats('p19').waiting"),14);
});
test('legacy stock above 100 migrates without losing units or creating cash operations',()=>{
 const g=game(),s=g.read();s.economy.business14.byProject.p19.stock=120;
 const restored=load(s);assert.equal(restored.run("window.Inventory23.stats('p19').stock"),100);assert.equal(restored.run("window.Inventory23.stats('p19').waiting"),20);
 assert.equal(restored.read().cash,s.cash);assert.deepEqual(restored.read().ledger,s.ledger);
 const again=restored.reload();assert.equal(again.run("window.Inventory23.stats('p19').waiting"),20);
});
test('good returns respect shipment reservations and cannot vanish on arrival',()=>{
 const g=game();g.run("window.Inventory23.buy('p19',5);window.Inventory23.sell('p19',5);for(let i=0;i<5;i++)window.Suppliers26.order('p19','budget',20);window.Inventory23.refund('p19',1)");
 assert.equal(g.run("window.Inventory23.stats('p19').stock"),0);assert.equal(g.run("window.Inventory23.stats('p19').transit"),100);assert.equal(g.run("window.Inventory23.stats('p19').waiting"),1);
 g.run('S.day=6;window.Suppliers26.deliver()');assert.equal(g.run("window.Inventory23.stats('p19').stock"),100);assert.equal(g.run("window.Inventory23.stats('p19').waiting"),1);
 assert.equal(g.run("window.Inventory23.buy('p19',5).ok"),false);
});
test('a selected sale refunds its own price; partial good and damaged returns cannot repeat',()=>{
 const g=game();g.run("window.Inventory23.buy('p19',5);window.Inventory23.price('p19',690);window.Inventory23.sell('p19',1);window.Inventory23.price('p19',1490)");
 const id=g.run("window.Inventory23.sell('p19',2).saleId");assert.equal(g.run(`window.Inventory23.refund('p19',1,'good',${id}).amount`),1490);
 const again=g.reload();assert.equal(again.run(`window.Inventory23.refund('p19',1,'damaged',${id}).amount`),1490);
 const before=again.read();assert.equal(again.run(`window.Inventory23.refund('p19',1,'good',${id}).ok`),false);assert.deepEqual(again.read(),before);
 assert.equal(again.run("window.Inventory23.stats('p19').damaged"),1);assert.equal(again.run("window.Inventory23.stats('p19').stock"),3);
 assert.equal(again.run("window.Inventory23.refund('p19',1).amount"),690);
});
test('insufficient cash cancels a refund without changing money, goods or return rights',()=>{
 const g=game();g.run("window.Inventory23.buy('p19',5);window.Inventory23.sell('p19',1);S.cash=0");const before=g.read();
 assert.equal(g.run("window.Inventory23.refund('p19',1).ok"),false);assert.deepEqual(g.read(),before);
});
test('old aggregate return rights migrate once using only the explicitly saved price',()=>{
 const g=game(),s=g.read(),r=s.economy.business14.byProject.p19;r.stock=3;r.refundable=2;r.refundPrice=1190;delete r.sales;delete r.warehouseVersion;
 const restored=load(s);assert.equal(restored.run("window.Inventory23.record('p19').sales[0].legacy"),true);
 assert.equal(restored.run("window.Inventory23.refund('p19',1).amount"),1190);const again=restored.reload();
 assert.equal(again.run("window.Inventory23.refund('p19',1,'damaged').amount"),1190);assert.equal(again.run("window.Inventory23.refund('p19',1).ok"),false);
 assert.equal(again.run("window.Inventory23.record('p19').sales.length"),1);assert.equal(again.run("window.Inventory23.stats('p19').stock"),4);
});
test('unknown legacy price never falls back to current price or blocks explicitly selected new sales',()=>{
 const g=game(),s=g.read(),r=s.economy.business14.byProject.p19;r.stock=5;r.refundable=1;delete r.refundPrice;delete r.sales;delete r.warehouseVersion;
 const restored=load(s);const id=restored.run("window.Inventory23.sell('p19',1).saleId"),before=restored.read();
 assert.equal(restored.run("window.Inventory23.refund('p19',2).ok"),false);assert.deepEqual(restored.read(),before);
 assert.equal(restored.run(`window.Inventory23.refund('p19',1,'good',${id}).amount`),990);
 assert.equal(restored.run("window.Inventory23.refund('p19',1).ok"),false);
});
test('financial reports and damaged stock reflect exact refunds, without refunding commission/shipping',()=>{
 const g=game(),before=g.read().cash;
 g.run("window.Inventory23.buy('p19',5);window.Inventory23.price('p19',690);window.Inventory23.sell('p19',1);window.Inventory23.price('p19',1490);window.Inventory23.sell('p19',1);window.Inventory23.refund('p19',1);window.Inventory23.refund('p19',1,'damaged')");
 assert.equal(g.read().cash-before,-2712);assert.equal(g.run('incomeStatement().netCash'),-25000-2712);
 assert.equal(g.run("window.Inventory23.stats('p19').stock"),4);assert.equal(g.run("window.Inventory23.stats('p19').damaged"),1);
 assert.equal(g.run("S.ledger.filter(x=>x.category==='Возврат покупателю').reduce((a,x)=>a+x.amount,0)"),-2180);
 const again=g.reload();assert.equal(again.read().cash,g.read().cash);assert.deepEqual(again.read().ledger,g.read().ledger);
});
test('business practice respects reservations before consuming resources or posting purchases',()=>{
 const g=game();g.run("for(let i=0;i<5;i++)window.Suppliers26.order('p19','budget',20)");const before=g.read();
 g.run("window.BusinessV14.start('p19');window.BusinessV14.act('small');window.BusinessV14.act('282')");
 assert.equal(g.run("window.BusinessV14.act('reserve').ok"),false);assert.deepEqual(g.read(),before);
});
test('failed immediate business refund rolls the entire commerce round back',()=>{
 const g=game();g.run('S.cash=4200');const before=g.read();
 g.run("window.BusinessV14.start('p19');window.BusinessV14.act('fake');window.BusinessV14.act('570')");
 assert.equal(g.run("window.BusinessV14.act('hide').ok"),false);assert.deepEqual(g.read(),before);
});
test('business practice automatic return consumes the recorded sale, not a reusable counter',()=>{
 const g=game();g.run("window.BusinessV14.start('p19');window.BusinessV14.act('fake');window.BusinessV14.act('570')");
 assert(g.run("window.BusinessV14.act('hide').ok"));const id=g.run("window.Inventory23.record('p19').sales.at(-1).id");
 assert.equal(g.run("window.Inventory23.record('p19').sales.at(-1).good"),1);assert.equal(g.run(`window.Inventory23.refund('p19',1,'good',${id}).ok`),false);
});
test('automatic demand and team operations record sales at actual prices',()=>{
 const g=game();g.run("window.Inventory23.buy('p19',20);window.Inventory23.price('p19',1190);pr('p19').posts=100;runProjectDay('p19',pr('p19'))");
 assert.equal(g.run("window.Inventory23.record('p19').sales.at(-1).channel"),'demand');
 assert.equal(g.run("window.Inventory23.record('p19').sales.at(-1).price"),1190);
 g.run("pr('p19').posts=0;window.Inventory23.buy('p19',5);window.Team27.hireRole('p19','operations');while(!window.Competition30.canSell('p19'))S.day++;window.Team27.workday()");
 assert.equal(g.run("window.Inventory23.record('p19').sales.at(-1).channel"),'team');
 const id=g.run("window.Inventory23.record('p19').sales.at(-1).id");assert.equal(g.run(`window.Inventory23.refund('p19',1,'good',${id}).amount`),1190);
});
test('procurement staff count pending goods and do not create duplicate automatic orders',()=>{
 const g=game();g.run("window.Team27.hireRole('p19','procurement');window.Team27.workday();window.Team27.workday()");
 assert.equal(g.run("window.Suppliers26.pending('p19').length"),1);assert.equal(g.run("window.Inventory23.stats('p19').transit"),5);
});
test('posting failures roll back sale and supplier prepayment without using resources',()=>{
 const g=game();g.run("window.Inventory23.buy('p19',5);S.nextLedgerId=Number.MAX_SAFE_INTEGER-1");let before=g.read();
 assert.equal(g.run("window.Inventory23.sell('p19',1).ok"),false);assert.deepEqual(g.read(),before);
 before=g.read();assert.equal(g.run("window.Suppliers26.order('p19','standard',5).ok"),false);assert.deepEqual(g.read(),before);
});

test('invalid quantities, condition and sale selection do not partially settle a refund',()=>{
 const g=game();g.run("window.Inventory23.buy('p19',5);window.Inventory23.sell('p19',2)");
 for(const operation of ["window.Inventory23.buy('p19',3)","window.Inventory23.sell('p19',1.5)","window.Inventory23.refund('p19',0)","window.Inventory23.refund('p19',1,'broken')","window.Inventory23.refund('p19',1,'good','missing')","window.Inventory23.refund('p19',3)"]){
  const before=g.read();assert.equal(g.run(operation+'.ok'),false);assert.deepEqual(g.read(),before);
 }
});
test('cloud restore uses the same lossless migration without paying again',async()=>{
 const source=game().read(),r=source.economy.business14.byProject.p19;r.stock=120;r.refundable=1;r.refundPrice=1190;delete r.warehouseVersion;delete r.sales;
 const g=load();g.ctx.cloudJSON=JSON.stringify(source);g.run('yandexPlayer={getData:async()=>({izNulyaSave:cloudJSON})}');await g.run('cloudLoadV8()');
 assert.equal(g.read().cash,source.cash);assert.deepEqual(g.read().ledger,source.ledger);
 assert.equal(g.run("window.Inventory23.stats('p19').stock"),100);assert.equal(g.run("window.Inventory23.stats('p19').waiting"),20);
 const again=g.reload();assert.equal(again.run("window.Inventory23.record('p19').sales.length"),1);assert.equal(again.run("window.Inventory23.record('p19').refundable"),1);
 assert.equal(again.read().cash,source.cash);assert.deepEqual(again.read().ledger,source.ledger);
});

(async()=>{
 let failed=0;for(const [name,fn] of cases){try{await fn();console.log('PASS warehouse: '+name);}catch(error){failed++;console.error('FAIL warehouse: '+name+'\n'+error.message);}}
 console.log(`WAREHOUSE: ${cases.length-failed}/${cases.length} passed`);if(failed)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
