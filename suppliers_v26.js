'use strict';
/* Supplier simulation: illustrative prices, not current marketplace tariffs. */
(function(){
 const SUPPLIERS={
  budget:{name:'Эконом · 5 дней',unit:350,days:5,freight:700},
  standard:{name:'Стандарт · 3 дня',unit:390,days:3,freight:450},
  fast:{name:'Быстрый · 1 день',unit:440,days:1,freight:250}
 };
 function warehouse(id){return window.Inventory23.record(id)}
 function openCommerce(id){return PROJECTS.some(p=>p.id===id&&p.type==='commerce'&&pr(id)?.open)}
 function pending(id){return (warehouse(id).deliveries||[]).filter(o=>o.status==='transit')}
 function order(id,supplier,count){
  if(!openCommerce(id))return {ok:false,error:'Сначала откройте товарный проект'};
  const offer=SUPPLIERS[supplier],n=Number(count);
  if(!offer||![5,10,20].includes(n))return {ok:false,error:'Неверный поставщик или партия'};
  const w=warehouse(id);
  if(window.BusinessV14.warehouse.capacity(id).free<n)return {ok:false,error:'Недостаточно места с учётом поставок и товаров в ожидании'};
  const cost=n*offer.unit+offer.freight;
  if(S.cash<cost)return {ok:false,error:'Недостаточно денег для предоплаты'};
  const result=window.BusinessV14.warehouse.transact(id,()=>{
  if(!w.deliveries)w.deliveries=[];
  // Cash moves at order placement; goods only become available on delivery.
  book('Предоплата поставщику',-n*offer.unit,'Товарный бизнес',`${n} шт. · ${offer.name}`,id);
  book('Доставка закупки',-offer.freight,'Товарный бизнес','Фиксированная логистика закупки',id);
  const shipment={id:(w.nextShipmentId||1),supplier,count:n,unit:offer.unit,freight:offer.freight,
   ordered:S.day,due:S.day+offer.days,status:'transit'};
  w.nextShipmentId=shipment.id+1;w.deliveries.push(shipment);
  return {ok:true,shipment,cost};
  });
  if(result.ok){save();render();}return result;
 }
 function deliver(){
  let arrivals=[];
  for(const p of PROJECTS.filter(p=>p.type==='commerce')){
   const w=warehouse(p.id);
   for(const d of w.deliveries||[]){
    if(d.status==='transit'&&d.due<=S.day){
     d.status='delivered';d.arrived=S.day;
     const placed=window.BusinessV14.warehouse.receive(p.id,Number(d.count));
     arrivals.push({project:p.id,count:d.count,id:d.id,placed,waiting:Math.max(0,d.count-placed)});
    }
   }
  }
  if(arrivals.length)save();
  return arrivals;
 }
 function inventoryValue(){
  let stock=0,transit=0,waiting=0;
  for(const p of PROJECTS.filter(p=>p.type==='commerce')){
   const w=warehouse(p.id);
   stock+=Math.max(0,Number(w.stock)||0)*420; // legacy inventory cost assumption
   waiting+=(Number(w.waitingStock)||0)*420;
   transit+=pending(p.id).reduce((n,d)=>n+d.count*d.unit,0);
  }
  return {stock,transit,waiting,total:stock+transit+waiting};
 }
 function screen(){
  const projects=PROJECTS.filter(p=>p.type==='commerce'&&pr(p.id)?.open);
  return header('Поставщики и логистика','Предоплата, сроки поставки и товары в пути')+
  `<div class="notice">Все цены, сроки и перевозки — <b>сценарные игровые параметры</b>. Закупка в этом разделе не увеличивает склад немедленно.</div>`+
  (projects.length?projects.map(p=>{
   const w=warehouse(p.id),list=pending(p.id),c=window.BusinessV14.warehouse.capacity(p.id);
   return `<div class="card" style="margin-top:14px"><h2>${esc(p.name)}</h2><p>На складе: <b>${c.stock} шт.</b> · В пути: <b>${c.transit} шт.</b> · Ожидают размещения: <b>${c.waiting} шт.</b> · Доступно для заказа: <b>${c.free} шт.</b></p>
   <div class="toolbar"><label>Поставщик <select data-supplier="${p.id}">${Object.entries(SUPPLIERS).map(([key,v])=>`<option value="${key}">${v.name} · ${money(v.unit)}/шт. + ${money(v.freight)} доставка</option>`).join('')}</select></label>
   <button class="primary" data-order="${p.id}" data-count="5">Заказать 5 шт.</button><button class="ghost" data-order="${p.id}" data-count="10">Заказать 10 шт.</button><button class="ghost" data-order="${p.id}" data-count="20">Заказать 20 шт.</button></div>
   <h3>Ожидаемые поставки</h3>${list.length?`<table class="audit-table"><tr><th>Партия</th><th>Штук</th><th>Прибытие</th><th>Предоплата</th></tr>${list.map(d=>`<tr><td>#${d.id}</td><td>${d.count}</td><td>День ${d.due}</td><td>${money(d.count*d.unit+d.freight)}</td></tr>`).join('')}</table>`:'<p class="mini">Нет поставок в пути</p>'}</div>`;
  }).join(''):'<div class="card">Откройте торговый проект, чтобы выбирать поставщиков.</div>');
 }
 const previousDay=advanceDay;
 advanceDay=function(){previousDay();const arrivals=deliver();for(const a of arrivals)notice(`Поставка #${a.id}: получено ${a.count} шт., ожидают размещения ${a.waiting} шт.`);};
 const previousRender=render;
 render=function(){
  if(tab==='suppliers26'){
   for(const [id,val] of [['cash',money(S.cash)],['day',S.day],['net',money(net())],['energy',S.energy+'%']]){
    const el=document.querySelector('#'+id);if(el)el.textContent=val;
   }
   document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab==='suppliers26'));
   document.querySelector('#main').innerHTML=screen();return;
  }
  return previousRender();
 };
 document.querySelector('#nav')?.insertAdjacentHTML('beforeend','<button data-tab="suppliers26">🚚 <span>Поставщики</span></button>');
 document.addEventListener('click',e=>{
  const b=e.target.closest('button[data-order]');if(!b)return;
  const selector=document.querySelector(`[data-supplier="${b.dataset.order}"]`);
  const r=order(b.dataset.order,selector?.value||'budget',b.dataset.count);
  toast(r.ok?'Заказ поставщику оформлен':r.error);
 });
 window.Suppliers26={SUPPLIERS,order,pending,deliver,inventoryValue,screen};
})();
