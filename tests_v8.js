const fs=require('fs'),vm=require('vm'),assert=require('assert');const noop=()=>{};
function fake(){return {textContent:'',innerHTML:'',dataset:{},classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],insertAdjacentHTML:noop,insertBefore:noop,style:{},focus:noop,setSelectionRange:noop}}
const d={};const document={querySelector:q=>d[q]||(d[q]=fake()),querySelectorAll:()=>[],addEventListener:noop,createElement:fake,head:fake()};const ctx={document,localStorage:{getItem:()=>null,setItem:noop},window:{},console,Math,JSON,Number,String,Array,Object,Date,Intl,setTimeout:noop,clearTimeout:noop};vm.createContext(ctx);
for(const file of ['game.js','economy.js','expansion.js','world.js','systems.js','minigames.js','platform.js','simulation_v8.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+file,'utf8'),ctx);
const run=x=>vm.runInContext(x,ctx);
assert(run('labourScreen().includes("Открыто заказов")'));assert(run('auditV8().includes("Неполученные счета")'));
assert(run('labourState().offers.length')>=8);
let before=run('labourState().offers.length');run('refreshLabour()');assert.equal(run('labourState().offers.length'),before);
run('book("Оплата клиентов",5000,"Тест","", "p0")');run('book("Операционные расходы",-2000,"Тест","", "p0")');
assert.equal(run('financialRows().income')>=5000,true);assert.equal(run('financialRows().net')>=3000,true);
run('econInvoice("p0",4000,"Тестовая дебиторка",3)');assert(run('financialRows().receivables')>=4000);
let old=run('S.day');run('advanceDay()');assert.equal(run('S.day'),old+1);assert.equal(run('labourState().lastDay'),old+1);
console.log('PASS v0.8: finite contract market, offer persistence, financial ledger analysis, unpaid invoices, days');
