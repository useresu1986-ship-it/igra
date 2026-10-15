const fs=require('fs'),vm=require('vm'),assert=require('assert');const noop=()=>{};
const nodes={};function fake(){return {textContent:'',innerHTML:'',value:'70',children:[{},{}],dataset:{},classList:{add:noop,remove:noop,toggle:noop},setAttribute:noop,remove:noop,insertBefore:noop,insertAdjacentHTML:noop,focus:noop,addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],style:{}}}
const document={querySelector:s=>nodes[s]||(nodes[s]=fake()),querySelectorAll:()=>[],addEventListener:noop,createElement:fake};const ctx={document,localStorage:{getItem:()=>null,setItem:noop},window:{},console,Math,JSON,Number,String,Array,Object,Date,Intl,setTimeout:noop,clearTimeout:noop};vm.createContext(ctx);
for(const name of ['game.js','economy.js','expansion.js','world.js','systems.js','minigames.js','platform.js','simulation_v8.js','finance_v9.js','strategy_v10.js','contracts_v11.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+name,'utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
assert.equal(run('Object.keys(TASK_BLUEPRINTS).length'),24);
assert(run('Object.keys(TASK_BLUEPRINTS).every(id=>WORK.some(w=>w.id===id))'));
run('S.cash=200000;S.hours=12;S.energy=100');
function take(id,script,success=true){run('S.hours=12;S.energy=100');run(`startWork('${id}')`);assert.equal(run('modal.type'),'career12');assert(run('document.querySelector("#modal").innerHTML.includes("Мини-игра")'));const before=run('S.workCount');script();assert.equal(run('S.workCount'),before+1);assert.equal(run('modal'),null);}
take('w0',()=>{run('careerAction12("1")');run('careerAction12("2")');run('careerAction12("0")')});
take('w1',()=>{['1','0','2','1'].forEach(x=>run(`careerAction12('${x}')`))});
take('w5',()=>run('careerAction12("1")'));
take('w6',()=>{['1','3','0','2'].forEach(x=>run(`careerAction12('${x}')`))});
take('w9',()=>{run('careerAction12("0")');run('careerAction12("6")');run('careerAction12("submit")')});
take('w11',()=>run('careerAction12("0")'));
take('w17',()=>run('careerAction12("2")'));
take('w18',()=>{for(let i of [0,4,8,12])run(`careerAction12('0:${i}')`);for(let i of [4,12])run(`careerAction12('1:${i}')`);run('careerAction12("submit")')});
take('w23',()=>run('careerAction12("submit")'));
run('S.hours=12;S.energy=100;startWork("w20")');run('closeModal()');assert.equal(run('modal'),null);assert.equal(run('activeCareer'),null);
run('S.hours=12;S.energy=100;startWork("w21")');const before=run('S.workCount');run('careerAction12("0")');assert.equal(run('S.workCount'),before+1);
console.log('PASS v12: 24 career task definitions; 9 successful paths, 1 failure, cancel resets; ledger integration');
// Exhaustive solution test for all 24 task IDs.
for(let k=0;k<24;k++){
 const id='w'+k;run('S.hours=12;S.energy=100');run(`startWork('${id}')`);
 const mode=run('activeCareer.task.mode');const prior=run('S.workCount');
 if(mode==='route'){let n=run('activeCareer.task.steps.length');for(let i=0;i<n;i++){let j=run(`activeCareer.task.choices.indexOf(activeCareer.task.steps[${i}])`);run(`careerAction12('${j}')`);}}
 else if(mode==='classify'){let n=run('activeCareer.task.items.length');for(let i=0;i<n;i++){let j=run(`activeCareer.task.choices.indexOf(activeCareer.task.items[${i}][1])`);run(`careerAction12('${j}')`);}}
 else if(mode==='memory'){run('careerAction12("ready")');let n=run('activeCareer.task.sequence.length');for(let i=0;i<n;i++){let j=run(`activeCareer.task.choices.indexOf(activeCareer.task.sequence[${i}])`);run(`careerAction12('${j}')`);}}
 else if(mode==='math'){let j=run('activeCareer.task.choices.indexOf(activeCareer.task.answer)');run(`careerAction12('${j}')`);}
 else if(mode==='debug'||mode==='ad'){let j=run('activeCareer.task.correct');run(`careerAction12('${j}')`);}
 else if(mode==='proof'){let n=run('activeCareer.task.tokens.length');for(let i=0;i<n;i++){if(run(`activeCareer.task.tokens[${i}][1]`))run(`careerAction12('${i}')`)}run('careerAction12("submit")');}
 else if(mode==='timing'){const [lo,hi]=run('[...activeCareer.task.target]');nodes['#career-slider'].value=String(Math.round((lo+hi)/2));run('careerAction12("submit")');}
 else if(mode==='beats'){for(let i of [0,4,8,12])run(`careerAction12('0:${i}')`);for(let i of [4,12])run(`careerAction12('1:${i}')`);run('careerAction12("submit")');}
 else throw Error('Unknown mode '+mode);
 assert.equal(run('S.workCount'),prior+1,'Task did not settle: '+id);assert.equal(run('modal'),null,'Modal leaked: '+id);
}
console.log('PASS v12 exhaustive: all 24 careers can be completed; work settlement occurs exactly once');
