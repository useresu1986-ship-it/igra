'use strict';
/* 0.23: controllable marketplace inventory. Scenario parameters, not observed prices. */
(function(){
 const UNIT=420,PRICE=990,FEE=.18,SHIP=110;
 function active(){return PROJECTS.filter(c=>c.type==='commerce'&&pr(c.id)?.open)}
 function record(id){const e=window.BusinessV14.state();if(!e.byProject[id])e.byProject[id]={stock:0,unitsSold:0};return e.byProject[id]}
 function stats(id){
  const r=record(id),stock=Math.max(0,Math.floor(Number(r.stock)||0));
  const price=Number(r.salePrice)||PRICE,fee=Math.round(price*FEE);
  const margin=price-UNIT-fee-SHIP;
  const locked=stock*UNIT;
  return {stock,price,fee,margin,locked,unitsSold:Number(r.unitsSold)||0,returned:Number(r.returned)||0};
 }
 function price(id,value){
  if(!active().some(c=>c.id===id))return {ok:false,error:'Проект закрыт'};
  const v=Number(value);
  if(!Number.isInteger(v)||v<490||v>5000)return {ok:false,error:'Цена должна быть от 490 до 5000 ₽'};
  record(id).salePrice=v;save();render();return {ok:true};
 }
 function buy(id,count){
  if(!active().some(c=>c.id===id))return {ok:false,error:'Проект закрыт'};
  if(![5,10,20].includes(Number(count)))return {ok:false,error:'Недопустимая партия'};
  const r=record(id),n=Number(count),cost=n*UNIT;
  if(S.cash<cost)return {ok:false,error:'Не хватает денег на закупку'};
  if((Number(r.stock)||0)+n>100)return {ok:false,error:'Склад вмещает 100 штук'};
  book('Закупка партии',-cost,'Закупка товара','Сценарий: '+n+' шт. × '+UNIT+' ₽',id);
  r.stock=(Number(r.stock)||0)+n;save();render();return {ok:true,cost};
 }
 function sell(id,count){
  if(!active().some(c=>c.id===id))return {ok:false,error:'Проект закрыт'};
  const n=Number(count),r=record(id),s=stats(id);
  if(!Number.isInteger(n)||n<1||n>10)return {ok:false,error:'За раз можно продать от 1 до 10 шт.'};
  if(s.stock<n)return {ok:false,error:'Недостаточно товара на складе'};
  if(S.hours<2||S.energy<10)return {ok:false,error:'Нужно 2 часа и 10 энергии'};
  const revenue=n*s.price,fees=n*s.fee,shipping=n*SHIP;
  S.hours-=2;S.energy-=10;
  book('Товарная выручка',revenue,'Продажа товара','Ручная игровая продажа '+n+' шт.',id);
  book('Комиссия площадки',-fees,'Маркетплейс','Сценарная комиссия 18%',id);
  book('Логистика',-shipping,'Маркетплейс','Сценарная логистика 110 ₽/шт.',id);
  r.stock-=n;r.unitsSold=(Number(r.unitsSold)||0)+n;
  r.refundable=(Number(r.refundable)||0)+n;
  r.refundPrice=s.price;
  save();render();return {ok:true,margin:n*s.margin};
 }
 function refund(id,count,condition='good'){
  if(!active().some(c=>c.id===id))return {ok:false,error:'Проект закрыт'};
  const r=record(id),n=Number(count);
  if(!Number.isInteger(n)||n<1||n>5)return {ok:false,error:'За один раз от 1 до 5 возвратов'};
  if(!['good','damaged'].includes(condition))return {ok:false,error:'Неверное состояние'};
  if((Number(r.refundable)||0)<n)return {ok:false,error:'Нет доступных к возврату ручных продаж'};
  const price=Number(r.refundPrice)||PRICE,amount=n*price;
  // Returned units can be restocked if salable; damaged units are written off.
  book('Возврат покупателю',-amount,'Товарный бизнес','Возврат '+n+' шт.',id);
  r.refundable-=n;r.returned=(Number(r.returned)||0)+n;
  if(condition==='good')r.stock=(Number(r.stock)||0)+n;
  else r.damaged=(Number(r.damaged)||0)+n;
  save();render();
  return {ok:true,amount,restocked:condition==='good'?n:0};
 }
 function screen(){
  const cfg=active();
  return header('Управление товарным бизнесом','Закупки, склад, цена и фактические денежные операции')+
  `<div class="notice">Цены, комиссии и спрос — <b>условный сценарий</b>, не реальные тарифы Ozon или Wildberries. Продажа по кнопке — учебная механика, не прогноз спроса. Товарная выручка возникает только после списания товара со склада; постоянные расходы списываются отдельно.</div>`+
  (cfg.length?cfg.map(c=>{const s=stats(c.id);return `<div class="card" style="margin-top:14px">
  <h2>${esc(c.name)}</h2><div class="grid four">
  <div><div class="mini">На складе</div><div class="statnum">${s.stock} шт.</div></div>
  <div><div class="mini">Капитал в товаре</div><div class="statnum">${money(s.locked)}</div></div>
  <div><div class="mini">Продано всего / возвраты</div><div class="statnum">${s.unitsSold} / ${s.returned} шт.</div></div>
  <div><div class="mini">Маржа за штуку до налогов и постоянных расходов</div><div class="statnum ${s.margin>=0?'pos':'neg'}">${money(s.margin)}</div></div></div>
  <p class="mini">Закупка ${money(UNIT)} · комиссия 18% (${money(s.fee)}) · логистика ${money(SHIP)} · цена ${money(s.price)}.</p>
  <div class="toolbar"><label>Цена продажи <select data-b23-price="${c.id}">${[690,790,890,990,1190,1490].map(v=>`<option value="${v}" ${v===s.price?'selected':''}>${money(v)}</option>`).join('')}</select></label>
  <button class="ghost" data-b23-buy="${c.id}" data-count="5">Закупить 5 шт. (${money(UNIT*5)})</button>
  <button class="ghost" data-b23-buy="${c.id}" data-count="10">Закупить 10 шт.</button>
  <button class="primary" data-b23-sell="${c.id}" data-count="1" ${s.stock<1?'disabled':''}>Продать 1 шт. (2 ч)</button>
  <button class="primary" data-b23-sell="${c.id}" data-count="5" ${s.stock<5?'disabled':''}>Продать 5 шт. (2 ч)</button></div>
  <p class="mini">Доступно для оформления возврата: ${Number(record(c.id).refundable)||0} шт. Возврат исправного товара пополняет склад; повреждённый списывается.</p>
  <div class="toolbar"><button class="ghost" data-b25-refund="${c.id}" data-condition="good" ${(Number(record(c.id).refundable)||0)<1?'disabled':''}>Возврат 1 шт. на склад</button>
  <button class="ghost" data-b25-refund="${c.id}" data-condition="damaged" ${(Number(record(c.id).refundable)||0)<1?'disabled':''}>Возврат повреждённого</button></div></div>`}).join(''):
  '<div class="card"><p>Открой товарный проект в «Маркетплейсе идей», чтобы управлять закупками и продажами.</p><button class="primary" data-tab="market">Выбрать проект</button></div>');
 }
 const previous=render;
 render=function(){
  if(tab==='inventory23'){
   for(const [id,val] of [['cash',money(S.cash)],['day',S.day],['net',money(net())],['energy',S.energy+'%']]){
    const el=document.querySelector('#'+id);if(el)el.textContent=val;
   }
   document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab==='inventory23'));
   document.querySelector('#main').innerHTML=screen();return;
  }
  return previous();
 };
 document.querySelector('#nav')?.insertAdjacentHTML('beforeend','<button data-tab="inventory23">📦 <span>Товарный бизнес</span></button>');
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  let result=null;
  if(b.dataset.b23Buy)result=buy(b.dataset.b23Buy,b.dataset.count);
  if(b.dataset.b23Sell)result=sell(b.dataset.b23Sell,b.dataset.count);
  if(b.dataset.b25Refund)result=refund(b.dataset.b25Refund,1,b.dataset.condition);
  if(result)toast(result.ok?'Операция проведена':result.error);
 });
 document.addEventListener('change',e=>{const id=e.target.dataset.b23Price;if(!id)return;const r=price(id,e.target.value);toast(r.ok?'Цена обновлена':r.error)});
 window.Inventory23={record,stats,buy,sell,refund,price,screen};
})();
