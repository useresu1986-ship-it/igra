const fs=require('fs'),vm=require('vm'),assert=require('assert');const noop=()=>{};
function fake(){return {textContent:'',innerHTML:'',dataset:{},classList:{add:noop,remove:noop,toggle:noop},disabled:false,addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],insertAdjacentHTML:noop,insertBefore:noop,style:{},focus:noop,setSelectionRange:noop}}
const d={};const document={querySelector:q=>d[q]||(d[q]=fake()),querySelectorAll:()=>[],addEventListener:noop,createElement:fake,head:fake()};const ctx={document,localStorage:{getItem:()=>null,setItem:noop},window:{},console,Math,JSON,Number,String,Array,Object,Date,Intl,setTimeout:noop,clearTimeout:noop};vm.createContext(ctx);
for(const file of ['game.js','economy.js','expansion.js','world.js','systems.js','minigames.js','platform.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+file,'utf8'),ctx);
const run=x=>vm.runInContext(x,ctx);
assert(run('cityScreen().includes("Коворкинг")'));assert(run('careerScreen().includes("Обучение")'));assert(run('debtScreen().includes("задолженности")')||run('debtScreen().includes("Долг")'));assert(run('taxScreen().includes("2,4 млн")'));
assert.equal(run('Object.keys(window.CareerTasks).length'),24);assert(run('adsScreen().includes("Яндекс")'));
run('S.cash=12000;S.debt=7000');let n=run('net()');run('creditPayment(2500)');assert.equal(run('S.cash'),9500);assert.equal(run('S.debt'),4500);assert.equal(run('net()'),n);
let level=run("S.skills['w0']||0"),cash=run('S.cash');run("study('w0')");assert.equal(run("S.skills['w0']"),level+5);assert.equal(run('S.cash'),cash-1800);
let eng=run('S.energy');assert.equal(run('awardEnergy()'),true);assert.equal(run('awardEnergy()'),false);assert(run('S.energy')>=eng);
run('advanceDay()');assert.equal(run('sys().lastAdDay < S.day'),true);
console.log('PASS v0.7: map, training, tax reference, credit settlement, 12 specialized task links, optional platform reward');
