'use strict';
/* 0.23: controllable marketplace inventory. Scenario parameters, not observed prices. */
(function(){
 const UNIT=420,warehouse=window.BusinessV14.warehouse;
 function active(){return PROJECTS.filter(c=>c.type==='commerce'&&pr(c.id)?.open)}
 function record(id){return warehouse.record(id)}
 function stats(id){
  const r=record(id),c=warehouse.capacity(id),q=warehouse.quote(id);
  return {...c,...q,locked:(c.stock+c.waiting)*UNIT,unitsSold:Number(r.unitsSold)||0,returned:Number(r.returned)||0,damaged:Number(r.damaged)||0};
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
  const result=warehouse.buy(id,Number(count));
  if(result.ok){save();render();}return result;
 }
 function sell(id,count){
  if(!active().some(c=>c.id===id))return {ok:false,error:'Проект закрыт'};
  const n=Number(count),s=stats(id);
  if(!Number.isInteger(n)||n<1||n>10)return {ok:false,error:'За раз можно продать от 1 до 10 шт.'};
  if(s.stock<n)return {ok:false,error:'Недостаточно товара на складе'};
  if(S.hours<2||S.energy<10)return {ok:false,error:'Нужно 2 часа и 10 энергии'};
  const result=warehouse.sell(id,n,s.price,'Продажа товара','Ручная игровая продажа '+n+' шт.');
  if(result.ok){S.hours-=2;S.energy-=10;save();render();}return result;
 }
 function refund(id,count,condition='good',saleId){
  if(!active().some(c=>c.id===id))return {ok:false,error:'Проект закрыт'};
  const result=warehouse.refund(id,Number(count),condition,saleId);
  if(result.ok){save();render();}return result;
 }
 function screen(){
  const cfg=active();
  return header('Управление товарным бизнесом','Закупки, склад, цена и фактические денежные операции')+
  `<div class="notice">Цены, комиссии и спрос — <b>условный сценарий</b>, не реальные тарифы Ozon или Wildberries. Продажа по кнопке — учебная механика, не прогноз спроса. Товарная выручка возникает только после списания товара со склада; постоянные расходы списываются отдельно.</div>`+
  (cfg.length?cfg.map(c=>{const s=stats(c.id),r=record(c.id);return `<div class="card" data-warehouse-project="${c.id}" style="margin-top:14px">
  <h2>${esc(c.name)}</h2><div class="grid four">
  <div><div class="mini">На складе</div><div class="statnum">${s.stock} шт.</div></div>
  <div><div class="mini">Капитал в товаре</div><div class="statnum">${money(s.locked)}</div></div>
  <div><div class="mini">Продано всего / возвраты</div><div class="statnum">${s.unitsSold} / ${s.returned} шт.</div></div>
  <div><div class="mini">Маржа за штуку до налогов и постоянных расходов</div><div class="statnum ${s.margin>=0?'pos':'neg'}">${money(s.margin)}</div></div></div>
  <p class="mini">Закупка ${money(UNIT)} · комиссия 18% (${money(s.fee)}) · логистика ${money(110)} · цена ${money(s.price)}.</p>
  <p data-warehouse-capacity="${c.id}">Вместимость: ${s.stock}/100 · В пути: ${s.transit} шт. · Ожидают размещения: ${s.waiting} шт. · Свободно для закупки: ${s.free} шт. · Повреждено: ${s.damaged} шт.</p>
  <div class="toolbar"><label>Цена продажи <select data-b23-price="${c.id}">${[690,790,890,990,1190,1490].map(v=>`<option value="${v}" ${v===s.price?'selected':''}>${money(v)}</option>`).join('')}</select></label>
  <button class="ghost" data-b23-buy="${c.id}" data-count="5" ${s.free<5||S.cash<UNIT*5?'disabled':''}>Закупить 5 шт. (${money(UNIT*5)})</button>
  <button class="ghost" data-b23-buy="${c.id}" data-count="10" ${s.free<10||S.cash<UNIT*10?'disabled':''}>Закупить 10 шт.</button>
  <button class="primary" data-b23-sell="${c.id}" data-count="1" ${s.stock<1?'disabled':''}>Продать 1 шт. (2 ч)</button>
  <button class="primary" data-b23-sell="${c.id}" data-count="5" ${s.stock<5?'disabled':''}>Продать 5 шт. (2 ч)</button></div>
  <p class="mini">Доступно для оформления возврата: ${Number(r.refundable)||0} шт. Исправный товар при нехватке места ожидает размещения и автоматически поступает на склад при освобождении места; повреждённый списывается. Комиссия и логистика продажи не возвращаются.</p>
  ${r.sales.some(x=>x.legacy)?'<p class="notice">Старая история: точные цены отдельных продаж не сохранились. Возврат старого остатка использует только сохранённую цену возврата; если её нет, автоматическая выплата недоступна.</p>':''}
  <label style="display:block;max-width:100%">Продажа для возврата <select style="max-width:100%" data-b25-sale="${c.id}"><option value="">По порядку продаж</option>${r.sales.filter(x=>warehouse.remaining(x)>0).map(x=>`<option value="${esc(String(x.id))}">${x.legacy?'Старый остаток':'Продажа #'+x.id} · ${warehouse.remaining(x)} шт. · ${x.price?money(x.price):'цена неизвестна'}</option>`).join('')}</select></label>
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
  if(b.dataset.b25Refund)result=refund(b.dataset.b25Refund,1,b.dataset.condition,document.querySelector(`[data-b25-sale="${b.dataset.b25Refund}"]`)?.value||undefined);
  if(result)toast(result.ok?'Операция проведена':result.error);
 });
 document.addEventListener('change',e=>{const id=e.target.dataset.b23Price;if(!id)return;const r=price(id,e.target.value);toast(r.ok?'Цена обновлена':r.error)});
 window.Inventory23={record,stats,buy,sell,refund,price,screen};
})();
