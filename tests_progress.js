'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),noop=()=>{};
function load(saved){
 const storage=new Map(saved?[['iz_nulya_v3_state',JSON.stringify(saved)]]:[]),nodes={};
 const fake=()=>({textContent:'',innerHTML:'',dataset:{},classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,insertAdjacentHTML:noop,insertBefore:noop,querySelector:()=>null,querySelectorAll:()=>[],style:{},focus:noop,setSelectionRange:noop,click:noop});
 const document={querySelector:q=>nodes[q]||(nodes[q]=fake()),getElementById:q=>nodes[q]||(nodes[q]=fake()),querySelectorAll:()=>[],createElement:fake,addEventListener:noop,head:fake()};
 const random=Object.create(Math);random.random=()=>.5;
 const ctx={document,window:{},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},console,Math:random,JSON,Number,String,Array,Object,Date,Intl,setTimeout:noop,clearTimeout:noop};vm.createContext(ctx);
 for(const [,file] of fs.readFileSync(__dirname+'/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync(__dirname+'/'+file,'utf8'),ctx,{filename:file});
 const run=s=>vm.runInContext(s,ctx),read=()=>JSON.parse(run('JSON.stringify(S)'));
 return {run,read,reload:()=>load(read())};
}
const cases=[],test=(name,fn)=>cases.push([name,fn]);
test('fresh goal uses real course price and no model/render reads change game state',()=>{
 const g=load(),before=g.read(),m=g.run('window.ProgressUI.model()');assert.equal(m.id,'course');assert.equal(m.cost,1800);assert.equal(m.current,1500);assert.equal(m.remaining,300);assert.equal(m.action,'work');
 g.run('window.ProgressUI.panel();window.ProgressUI.resultCard();window.ProgressUI.model()');assert.deepEqual(g.read(),before);
});
test('skill multiplier remains exactly the established economic rule, including cap',()=>{
 const g=load();for(const skill of [0,1,6,25,50])assert.equal(g.run(`workSkillMultiplier('w0',{skills:{w0:${skill}}})`),1+Math.min(25,skill)*.012);
});
test('actual first shift feedback reconciles with postings and unlocks course action',()=>{
 const g=load(),before=g.read().cash;g.run("startWork('w0');workResult(true)");const r=g.run('window.ProgressUI.getResult()');
 assert.equal(r.gross,867);assert.equal(r.cost,120);assert.equal(r.net,g.read().cash-before);assert.equal(r.gross-r.cost,r.net);assert.equal(g.run('window.ProgressUI.model().action'),'course');assert.equal(g.read().ledger.length,2);
});
test('course charges once, preserves original resource costs, changes real pay multiplier and goal',()=>{
 const g=load();g.run("startWork('w0');workResult(true)");const before=g.read();g.run("study('w0')");const s=g.read(),r=g.run('window.ProgressUI.getResult()');
 assert.equal(s.cash,before.cash-1800);assert.equal(s.hours,before.hours-3);assert.equal(s.energy,before.energy-14);assert.equal(s.skills.w0,6);assert.equal(r.oldSkill,1);assert.equal(r.newSkill,6);assert.equal(r.oldFactor,1.012);assert.equal(r.newFactor,1.072);
 const m=g.run('window.ProgressUI.model()');assert.equal(m.id,'project');assert.equal(m.cost,2600);assert.equal(m.project.upkeep,290);
});
test('second equal-quality shift really benefits from existing training, no income invented',()=>{
 const g=load();g.run("startWork('w0');workResult(true);study('w0');startWork('w0');workResult(true)");const wages=g.read().ledger.filter(r=>r.category==='Оплата труда');assert.equal(wages[1].amount,Math.round(850*1.02*1.072));assert(wages[1].amount>wages[0].amount);assert.equal(g.read().cash,1500+g.read().ledger.reduce((n,r)=>n+r.amount,0));
});
test('reload and repeated goals/rendering never pay rewards or repeat course costs',()=>{
 let g=load();g.run("startWork('w0');workResult(true);study('w0');window.ProgressUI.selectGoal('project');save()");const before=g.read();g=g.reload();g.run('window.ProgressUI.panel();render();render();window.ProgressUI.model()');assert.equal(g.run('window.ProgressUI.model().id'),'project');for(const k of ['cash','debt','ledger','skills','owned'])assert.deepEqual(g.read()[k],before[k]);assert.equal(g.run('window.ProgressUI.getResult()'),null);
});
test('goal choice remains optional, persists and does not move money or grant awards',()=>{
 let g=load(),before=g.read();g.run("window.ProgressUI.selectGoal('free')");assert.equal(g.run('window.ProgressUI.model().id'),'free');g=g.reload();assert.equal(g.run('window.ProgressUI.model().id'),'free');assert.equal(g.read().cash,before.cash);assert.deepEqual(g.read().ledger,before.ledger);
});
test('insufficient energy uses the same quote and cannot buy a course',()=>{
 const g=load();g.run('S.cash=2000;S.energy=13');const before=g.read();assert.equal(g.run("trainingQuote('w0').available"),false);assert.equal(g.run('window.ProgressUI.model().action'),'rest');g.run("study('w0')");assert.deepEqual(g.read(),before);
});
test('capped skill is not advertised as a useful extra income purchase',()=>{
 const g=load();g.run('S.skills.w0=25');assert.equal(g.run('window.ProgressUI.model().id'),'project');assert.equal(g.run("trainingQuote('w0').afterMultiplier"),1.3);
});
test('contract feedback separates expected receivable from actual cash',()=>{
 const g=load();g.run("S.cash=10000;contracts11().offers=[{id:901,job:'w11',quote:3000,delay:1,risk:0,expires:2,taken:false}];takeContract11(901);workResult(true)");const r=g.run('window.ProgressUI.getResult()');assert.equal(r.gross,0);assert.equal(r.cost,100);assert.equal(r.net,-100);assert(r.pending>0);assert.equal(g.run('incomeStatement().income'),0);
});
test('asset purchase feedback uses existing ownership and actual debit only',()=>{
 const g=load();g.run('S.cash=4000;buyAsset(3)');const r=g.run('window.ProgressUI.getResult()');assert.equal(r.kind,'asset');assert.equal(r.cost,3500);assert.equal(g.read().cash,500);assert.deepEqual(g.read().owned,[3]);const before=g.read();g.run('buyAsset(3)');assert.deepEqual(g.read(),before);
});
test('unknown old UI preference falls back without rewriting saved progress',()=>{
 const g=load();g.run("S.progression={selectedGoal:'unknown',future:'preserve'}");const before=g.read();assert.equal(g.run('window.ProgressUI.model().choice'),'auto');assert.deepEqual(g.read(),before);
});
let failed=0;for(const [name,fn] of cases){try{fn();console.log('PASS '+name)}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack)}}console.log(`Progress: ${cases.length-failed}/${cases.length} passed; ${failed} failed`);if(failed)process.exitCode=1;
