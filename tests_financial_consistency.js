'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),noop=()=>{};
function load(saved){
 const fake=()=>({textContent:'',innerHTML:'',dataset:{},classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,insertAdjacentHTML:noop,insertBefore:noop,querySelector:()=>null,querySelectorAll:()=>[],style:{},focus:noop,setSelectionRange:noop});
 const nodes={},document={querySelector:q=>nodes[q]||(nodes[q]=fake()),getElementById:q=>nodes[q]||(nodes[q]=fake()),querySelectorAll:()=>[],createElement:fake,addEventListener:noop,head:fake()};
 const random=Object.create(Math);random.random=()=>.99;
 const ctx={document,window:{},localStorage:{getItem:()=>saved?JSON.stringify(saved):null,setItem:noop},console,Math:random,JSON,Number,String,Array,Object,Date,Intl,setTimeout:noop,clearTimeout:noop};vm.createContext(ctx);
 for(const [,file] of fs.readFileSync(__dirname+'/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync(__dirname+'/'+file,'utf8'),ctx,{filename:file});
 const run=s=>vm.runInContext(s,ctx),read=()=>JSON.parse(run('JSON.stringify(S)'));
 return {run,read,reload:()=>load(read())};
}
const cases=[];const test=(name,fn)=>cases.push([name,fn]);
function contract(g){g.run("S.cash=100000;contracts11().offers=[{id:999,job:'w11',quote:3000,delay:1,risk:0,taken:false,expires:S.day+1}];takeContract11(999);workResult(true)");}
test('payroll forecast includes both staff systems and daily bonuses',()=>{
 const g=load();g.run("S.cash=100000;openProject('p19');pr('p19').staff=2;pr('p19').team27={members:[{id:1,role:'marketing',dailyBonus:190,morale:10},{id:2,role:'operations',morale:10}],history:[]}");
 const daily=g.run('v9DailyCosts()');assert.equal(daily.team,1470);const before=g.read().cash;g.run('advanceDay()');assert.equal(before-g.read().cash,daily.total);
});
test('automatic daily advertising spend is included without inventing future income',()=>{
 const g=load();g.run("S.cash=1000000;const ads=PROJECTS.find(x=>x.type==='ads');openProject(ads.id);pr(ads.id).posts=1");
 const p=g.run('riskProjection21({days:1,collection:100})'),before=g.read().cash;g.run('advanceDay()');assert.equal(before-g.read().cash,p.totalOut);assert.equal(p.totalExpected,0);
});
test('staff payment rounding remains identical to existing book rules',()=>{
 const g=load();g.run("S.cash=100000;openProject('p19');pr('p19').team27={members:[{id:1,role:'procurement',dailyBonus:157.5,morale:10}],history:[]}");
 assert.equal(g.run('v9DailyCosts().team'),787);g.run('window.Team27.workday()');assert.equal(g.run("S.ledger.at(-1).amount"),-787);
});
test('cash classification is shared by economic and management statements',()=>{
 const g=load();g.run("book('Оплата клиентов',5000,'Клиент','');book('Найм и настройка',-500,'Персонал','');book('Депозит за жильё',-1000,'Жильё','');book('Погашение долга',-300,'Банк','')");
 assert.equal(g.run('financialRows().net'),g.run('incomeStatement().personalResult'));
});
test('contract receivables appear once in balance and forecast, disputed stays out of scenario',()=>{
 const g=load();contract(g);const amount=g.run('contracts11().pending[0].gross');
 assert.equal(g.run('outstanding()'),amount);assert.equal(g.run('riskProjection21({days:1,collection:100}).totalExpected'),amount);
 assert.equal(g.run('v9Forecast(1).receivables'),amount);g.run("contracts11().pending[0].status='disputed'");assert.equal(g.run('outstanding()'),amount);assert.equal(g.run('riskProjection21({days:1,collection:100}).totalExpected'),0);
});
test('contract cash report excludes reversed temporary wages, preserves net flow',()=>{
 const g=load();contract(g);assert.equal(g.run('incomeStatement(30).income'),0);assert.equal(g.run('financialRows(30).income'),0);assert.equal(g.run('ledgerTotals().income'),0);
 assert.equal(g.run('incomeStatement(30).netCash'),g.read().cash-100000);
 g.run('S.day++;settleContracts11()');assert.equal(g.run('incomeStatement(30).income'),g.run('contracts11().history[0].gross'));
});
test('temporary wage is not eligible for NPD; both contract payment aliases are',()=>{
 const g=load();contract(g);assert.equal(g.run('eligibleReceipts18().length'),0);
 g.run("S.day++;settleContracts11();book('Оплата по договору',100,'Старый договор','')");assert.equal(g.run('eligibleReceipts18().length'),2);
});
test('cash chart and informational tax screen use actual contract receipts',()=>{
 const g=load();contract(g);assert.equal(g.run('financeData().at(-1).inc'),0);
 g.run('S.day++;settleContracts11()');assert(g.run("taxScreen().includes('<td>'+money(contracts11().history[0].gross)+'</td>')"));
});
test('JSON reload keeps paid contract history and cash audit synchronized',()=>{
 let g=load();contract(g);g=g.reload();g.run('S.day++;settleContracts11()');assert.equal(g.run('contracts11().history[0].status'),'paid');
 assert.equal(g.run('cashAudit20()[0].received'),g.run('contracts11().history[0].gross'));
 const before=g.read();g.run('settleContracts11()');assert.equal(g.read().cash,before.cash);assert.deepEqual(g.read().ledger,before.ledger);
});
test('same-day ordinary and contract shifts are identified by receipt, not job/date guess',()=>{
 const g=load();g.run("S.cash=100000;startWork('w11');workResult(true)");const ordinary=g.run("S.ledger.find(x=>x.category==='Оплата труда').amount");contract(g);
 assert.equal(g.run('cashAudit20()[0].received'),ordinary);assert.equal(g.run('labourStats19(0)[0].gross'),ordinary);
 g.run('S.day++;settleContracts11()');assert.equal(g.run('labourStats19(0)[0].gross'),ordinary+g.run('contracts11().history[0].gross'));
});
test('duplicate contract queue cannot collect twice, including after reload',()=>{
 let g=load();contract(g);g.run('contracts11().pending.push({...contracts11().pending[0]})');g=g.reload();g.run('S.day++;settleContracts11()');
 assert.equal(g.run("S.ledger.filter(x=>x.category==='Поступление по договору').length"),1);
 const s=g.read();s.economy.contracts11.pending=[{...s.economy.contracts11.history[0],status:'pending'}];g=load(s);g.run('settleContracts11()');assert.equal(g.read().cash,s.cash);
});
test('known contract cash comes after base debt interest, team after contract',()=>{
 const g=load();contract(g);g.run("openProject('p19');S.cash=0;S.debt=100;pr('p19').team27={members:[{id:1,role:'marketing',morale:10}],history:[]}");
 const p=g.run('riskProjection21({days:1,collection:100}).final');g.run('advanceDay()');assert.equal(g.read().cash,p.cash);assert.equal(g.read().debt,p.debt);
});
test('scenario is read-only even with contracts and team',()=>{
 const g=load();contract(g);g.run("openProject('p19');pr('p19').team27={members:[{role:'marketing',dailyBonus:190}],history:[]}");const s=g.read();g.run('v9Forecast();riskProjection21()');assert.deepEqual(g.read(),s);
});
test('planning fallback and stress module share exactly the same cash projection',()=>{
 const g=load();contract(g);g.run("openProject('p19');S.cash=0;pr('p19').team27={members:[{role:'marketing',dailyBonus:190}],history:[]}");
 const modern=JSON.parse(g.run('JSON.stringify(v9Forecast(7))'));g.run('riskProjection21=undefined');const fallback=JSON.parse(g.run('JSON.stringify(v9Forecast(7))'));assert.deepEqual(fallback,modern);
});
test('invoice and contract with the same numeric ID remain distinct obligations',()=>{
 const g=load();contract(g);g.run("ensureEconomy().receivables=[{id:999,project:'p0',gross:1000,due:S.day+1}]");assert.equal(g.run('outstanding()'),1000+g.run('contracts11().pending[0].gross'));
});
test('settled invoice remains settled when payment ledger has been trimmed',()=>{
 let g=load();g.run("ensureEconomy().receivables=[{id:5,gross:500,due:1}];collectInvoices();S.ledger=[]");g=g.reload();const before=g.read().cash;g.run("ensureEconomy().receivables.push({id:5,gross:500,due:1});collectInvoices()");assert.equal(g.read().cash,before);
});
test('dispute recovery or loss is recorded once and updates audit after JSON reload',()=>{
 for(const won of [true,false]){let g=load();contract(g);g.run("contracts11().pending[0].risk=1;S.day++;settleContracts11()");assert.equal(g.run('contracts11().history[0].status'),'disputed');
  g=g.reload();g.run(`Math.random=()=>${won?.1:.99};S.day=contracts11().pending[0].disputeUntil;settleContracts11()`);
  assert.equal(g.run('contracts11().history[0].status'),won?'paid':'lost');const s=g.read();g.run('settleContracts11()');assert.equal(g.read().cash,s.cash);assert.equal(g.run('outstanding()'),0);
 }
});
test('NPD staff restriction recognizes role-based team',()=>{
 const g=load();g.run("S.cash=100000;openProject('p0');pr('p0').team27={members:[{role:'marketing'}]};book('Оплата клиентов',1000,'Клиент','','p0')");assert.equal(g.run("classifyReceipt18(S.ledger.at(-1).id,'business')"),false);
});
test('old invoice terminal statuses and duplicate IDs cannot pay twice',()=>{
 let g=load();g.run("S.cash=10000;ensureEconomy().receivables=[{id:1,gross:1000,due:1,project:'p0'},{id:1,gross:1000,due:1,project:'p0'},{id:2,gross:500,due:1,status:'paid'},{id:3,gross:700,due:1,status:'disputed'}];collectInvoices()");assert.equal(g.read().cash,11000);
 g=g.reload();g.run("ensureEconomy().receivables.push({id:1,gross:1000,due:1,project:'p0'});collectInvoices()");assert.equal(g.read().cash,11000);
});
test('legacy paid tax on reversed wage is credited, never paid twice after reload',()=>{
 let g=load();contract(g);g.run("const wage=S.ledger.find(x=>x.category==='Оплата труда');realism18().tax.records[wage.id]={kind:'individual',paid:true};book('Учебная уплата НПД',-Math.round(wage.amount*.04),'Налог','Старая версия');S.day++;settleContracts11();classifyReceipt18(S.ledger.at(-1).id,'individual')");
 const tax=g.run('annualTax18()');assert.equal(tax.gross,g.run('contracts11().history[0].gross'));assert.equal(tax.due,Math.max(0,tax.tax-tax.paid));
 const before=g.read().cash;g.run('payNpd18()');assert.equal(g.read().cash,before-tax.due);g=g.reload();const paid=g.read();g.run('payNpd18()');assert.equal(g.read().cash,paid.cash);assert.equal(g.run('annualTax18().due'),0);
});
test('new NPD payment is manual, idempotent and respects 4/6 percent and year boundary',()=>{
 let g=load();g.run("S.cash=10000;book('Поступление по договору',1000,'Клиент','');classifyReceipt18(S.ledger.at(-1).id,'business')");assert.equal(g.run('annualTax18().due'),60);
 g.run('payNpd18()');g=g.reload();const s=g.read();g.run('payNpd18()');assert.equal(g.read().cash,s.cash);assert.deepEqual(g.read().ledger,s.ledger);
 g.run("S.day=366;book('Оплата клиентов',1000,'Клиент','');classifyReceipt18(S.ledger.at(-1).id,'individual')");assert.equal(g.run('annualTax18().due'),40);
});
test('legacy tax credit is consumed once across multiple subsequent payments',()=>{
 let g=load();g.run("S.cash=10000;book('Оплата труда',2500,'Старая работа','');book('Перевод в дебиторскую задолженность',-2500,'Старая работа','');realism18().tax.records[1]={kind:'individual',paid:true};book('Учебная уплата НПД',-100,'Налог','');book('Оплата по договору',3000,'Клиент','');classifyReceipt18(S.ledger.at(-1).id,'business');payNpd18()");
 assert.equal(g.run('annualTax18().due'),0);g=g.reload();const before=g.read().cash;
 g.run("book('Оплата клиентов',1000,'Клиент','');classifyReceipt18(S.ledger.at(-1).id,'individual')");assert.equal(g.run('annualTax18().due'),40);g.run('payNpd18()');assert.equal(g.read().cash,before+1000-40);
});
let failures=0;for(const [name,fn] of cases){try{fn();console.log('PASS '+name)}catch(e){failures++;console.error('FAIL '+name+'\n'+e.stack)}}
console.log(`Financial consistency: ${cases.length-failures}/${cases.length} passed; ${failures} failed`);if(failures)process.exitCode=1;
