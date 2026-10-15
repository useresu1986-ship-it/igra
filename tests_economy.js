const fs=require('fs'),vm=require('vm'),assert=require('assert');
const noop=()=>{};
const nodes={};
function fake(){return {textContent:'',innerHTML:'',dataset:{},classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],style:{},insertBefore:noop,appendChild:noop,focus:noop,setSelectionRange:noop};}
let main=fake();const document={querySelector:q=>q==='#main'?main:(nodes[q]||(nodes[q]=fake())),querySelectorAll:()=>[],createElement:()=>fake(),addEventListener:noop};
const localStorage={getItem:()=>null,setItem:noop};
const ctx={document,localStorage,window:{},console,Math,JSON,Number,String,Array,Object,Date,Intl,setTimeout:noop,clearTimeout:noop};vm.createContext(ctx);
for(const f of ['game.js','economy.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+f,'utf8'),ctx);
const ex=s=>vm.runInContext(s,ctx);
assert.equal(ex('PROJECTS.length'),24);
assert.equal(ex('WORK.length'),24);
assert.equal(ex('S.cash'),1500);
ex('S.cash=200000');ex("openProject('p0')");ex("produce('p0')");
assert.equal(ex('S.projects.p0.posts'),1);
assert.equal(ex('S.projects.p0.metrics.content'),1);
ex("econInvoice('p0',2500,'Тестовый заказ',2)");
assert.equal(ex('outstanding()'),2500);
let before=ex('S.cash'); ex('advanceDay()');
assert.equal(ex('outstanding()'),2500);
assert.equal(ex('S.day'),2);
ex('advanceDay()');assert.equal(ex('S.day'),3);
assert.equal(ex("ensureEconomy().receivables.some(x=>x.label==='Тестовый заказ')"),false); // другие случайные счета допустимы
assert.equal(ex("S.ledger.some(x=>x.category==='Оплата клиентов'&&x.amount===2500)"),true);
assert.equal(ex('incomeStatement(999).income>=2500'),true);
assert.equal(ex('incomeStatement(999).capital'),7000);
assert.equal(ex('incomeStatement(999).operating>0'),true);
assert.equal(ex('incomeStatement(999).living'),900);
assert.equal(ex('incomeStatement(999).netCash'),ex('incomeStatement(999).income-incomeStatement(999).operating-incomeStatement(999).living-incomeStatement(999).capital'));
ex("tab='econ';render()");assert(main.innerHTML.includes('Экономический аудит'));
// Проверяем режим отсутствия гарантированных рекламных выплат для RU Shorts
ex("openProject('p2'); S.projects.p2.posts=10; S.projects.p2.audience=20000");
let count=ex("S.ledger.filter(x=>x.project==='p2'&&x.category==='Платформа (модель)').length");
for(let i=0;i<10;i++)ex("runProjectDay('p2',S.projects.p2)");
assert.equal(ex("S.ledger.filter(x=>x.project==='p2'&&x.category==='Платформа (модель)').length"),count);
console.log('PASS: 48 careers, invoice delays, payment collection, capex, living costs, operating result, audit UI, RU monetization restriction');
