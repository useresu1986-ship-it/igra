const fs=require('fs'),vm=require('vm'),assert=require('assert');const noop=()=>{};
function fake(){return {textContent:'',innerHTML:'',dataset:{},classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],insertAdjacentHTML:noop,insertBefore:noop,style:{},focus:noop,setSelectionRange:noop}}
const d={};const document={querySelector:q=>d[q]||(d[q]=fake()),querySelectorAll:()=>[],addEventListener:noop,createElement:fake,head:fake()};const ctx={document,localStorage:{getItem:()=>null,setItem:noop},window:{},console,Math,JSON,Number,String,Array,Object,Date,Intl,setTimeout:noop,clearTimeout:noop};vm.createContext(ctx);
for(const file of ['game.js','economy.js','expansion.js','world.js','systems.js','minigames.js','platform.js','simulation_v8.js','finance_v9.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+file,'utf8'),ctx);
const run=x=>vm.runInContext(x,ctx);
assert.equal(run('v9DailyCosts().personal'),run('Object.values(houseExpenses()).reduce((a,b)=>a+b,0)'));
assert.equal(run('v9Forecast(7).series.length'),7);
assert(run('v9Audit().includes("Прогноз ликвидности")'));
assert(run('v9Forecast(14).end.cash')>=0);
run('econInvoice("p0",4000,"Тест",3)');assert(run('v9Forecast(5).receivables')>=4000);
run('S.cash=0;S.debt=0');assert(run('v9Forecast(5).end.debt')>0);
assert(run('v9Forecast(5).series.every(x=>x.cash>=0&&x.debt>=0)'));
console.log('PASS v0.9: forecast, household, receivables, debt, screen');
