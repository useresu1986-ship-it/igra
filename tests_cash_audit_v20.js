'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),noop=()=>{};
function fake(){return {textContent:'',innerHTML:'',dataset:{},classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,insertAdjacentHTML:noop,insertBefore:noop,querySelector:()=>null,querySelectorAll:()=>[],style:{},focus:noop,setSelectionRange:noop}}
const nodes={},document={querySelector:q=>nodes[q]||(nodes[q]=fake()),querySelectorAll:()=>[],getElementById:q=>nodes['#'+q]||(nodes['#'+q]=fake()),createElement:fake,addEventListener:noop,head:fake()};
const ctx={document,localStorage:{getItem:()=>null,setItem:noop},window:{},console,Math,JSON,Number,String,Array,Object,Date,Intl,setTimeout:noop,clearTimeout:noop};vm.createContext(ctx);
const html=fs.readFileSync(__dirname+'/index.html','utf8');
for(const [,file] of html.matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync(__dirname+'/'+file,'utf8'),ctx,{filename:file});
const ex=s=>vm.runInContext(s,ctx);
ex("S.day=12;labour19().sessions=[{day:12,job:'w0',gross:1000,costs:100,hours:4},{day:12,job:'w1',gross:650,costs:50,hours:2}];contracts11().history=[{id:1,day:12,job:'w0',gross:1250,status:'pending'}]");
assert.equal(ex("cashAudit20()[0].earned"),1250);
assert.equal(ex("cashAudit20()[0].received"),0);
assert.equal(ex("cashAudit20()[0].waiting"),1250);
assert.equal(ex("cashAudit20().find(x=>x.id==='w1').received"),650);
ex("contracts11().history[0].status='paid'");assert.equal(ex("cashAudit20()[0].received"),1250);
ex("contracts11().history[0].status='lost'");assert.equal(ex("cashAudit20()[0].lost"),1250);assert.equal(ex("cashAudit20()[0].received"),0);
ex("tab='cash_audit20';render()");assert(nodes['#main'].innerHTML.includes('Аудит заработка'));
console.log('PASS v20 accrual/cash separation, disputed/lost, noncontract, UI');
