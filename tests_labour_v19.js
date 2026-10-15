const fs=require('fs'),vm=require('vm'),assert=require('assert'),noop=()=>{};
function fake(){return {textContent:'',innerHTML:'',dataset:{},classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,insertAdjacentHTML:noop,insertBefore:noop,querySelector:()=>null,querySelectorAll:()=>[],style:{},focus:noop,setSelectionRange:noop}}
const nodes={},document={querySelector:q=>nodes[q]||(nodes[q]=fake()),querySelectorAll:()=>[],getElementById:q=>nodes['#'+q]||(nodes['#'+q]=fake()),createElement:fake,addEventListener:noop,head:fake()};
const ctx={document,localStorage:{getItem:()=>null,setItem:noop},window:{},console,Math,JSON,Number,String,Array,Object,Date,Intl,setTimeout:noop,clearTimeout:noop};vm.createContext(ctx);
for(const f of ['game.js','economy.js','expansion.js','world.js','systems.js','minigames.js','platform.js','simulation_v8.js','finance_v9.js','strategy_v10.js','contracts_v11.js','deep_v13.js','business_v14.js','youtube_v15.js','video_editor_v16.js','youtube_business_v17.js','realism_v18.js','labour_v19.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+f,'utf8'),ctx);
const ex=s=>vm.runInContext(s,ctx);
assert.equal(ex('labourStats19(0).length'),0);
ex("S.cash=50000;S.hours=12;modal={id:'w0',type:'route',score:0,tries:0};workResult(true)");
assert.equal(ex('labourStats19(0)[0].count'),1);
assert.equal(ex('labourStats19(0)[0].hours'),4);
assert.equal(ex('labourStats19(0)[0].net'),ex('labourStats19(0)[0].gross-labourStats19(0)[0].costs'));
assert.equal(ex('labourStats19(0)[0].hourly'),ex('labourStats19(0)[0].net/4'));
ex("tab='labour19';render()");assert(nodes['#main'].innerHTML.includes('Аналитика подработок'));
assert(ex('labourScreen19().includes("Мало наблюдений")'));
console.log('PASS v19 labour journal, rates, hours, audit UI');
