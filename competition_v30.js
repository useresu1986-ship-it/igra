'use strict';
/* Competition and advertising are game scenarios, not verified market data. */
(function(){
 const MARKET={floor:650,ceiling:1550};
 function state(id){
  const p=pr(id);
  if(!p?.open||!PROJECTS.some(x=>x.id===id&&x.type==='commerce'))return null;
  if(!p.competition30)p.competition30={campaignUntil:0,spent:0,sales:0,lost:0,history:[]};
  return p.competition30;
 }
 function rivalPrice(id,day=S.day){
  const seed=Array.from(id).reduce((n,c)=>n+c.charCodeAt(0),0);
  return Math.max(MARKET.floor,Math.min(MARKET.ceiling,790+((seed+Math.floor(day/3)*37)%7-3)*60));
 }
 function score(id,day=S.day){
  const c=state(id);if(!c)return null;
  const ours=window.Inventory23.stats(id).price,other=rivalPrice(id,day);
  const campaign=day<=c.campaignUntil;
  const ratio=other/ours;
  const chance=Math.max(0.1,Math.min(.95,.52*ratio+(campaign?.2:0)));
  return {ours,other,chance,campaign};
 }
 function canSell(id,day=S.day){
  const sc=score(id,day);if(!sc)return false;
  // Fixed pseudo-random draw for a given project/day; stable across reloads.
  const seed=Array.from(id).reduce((n,c)=>n*31+c.charCodeAt(0),17);
  const draw=((seed+day*73)%101)/101;
  return draw<sc.chance;
 }
 function advertise(id){
  const c=state(id);if(!c)return {ok:false,error:'Торговый проект закрыт'};
  const cost=1200;
  if(S.cash<cost)return {ok:false,error:'Недостаточно средств'};
  if(c.campaignUntil>=S.day)return {ok:false,error:'Рекламная кампания уже запущена'};
  book('Реклама товара',-cost,'Конкуренция','Кампания на три игровых дня',id);
  c.campaignUntil=S.day+2;c.spent+=cost;save();render();
  return {ok:true,until:c.campaignUntil};
 }
 function daily(){
  for(const cfg of PROJECTS.filter(x=>x.type==='commerce')){
   const c=state(cfg.id);if(!c)continue;
   const sc=score(cfg.id);
   c.history.push({day:S.day,ours:sc.ours,other:sc.other,share:Math.round(sc.chance*100),campaign:sc.campaign});
   c.history=c.history.slice(-30);
  }
  save();
 }
 function screen(){
  const projects=PROJECTS.filter(x=>x.type==='commerce'&&pr(x.id)?.open);
  return header('Конкуренты','Цена, спрос и рекламные кампании')+
   '<div class="notice">Цены конкурентов и вероятность продажи — условная игровая модель. Она не отражает реальных продавцов или статистику маркетплейсов.</div>'+
   (projects.length?projects.map(cfg=>{
    const c=state(cfg.id),v=score(cfg.id);
    return `<div class="card" style="margin-top:14px"><h2>${esc(cfg.name)}</h2>
     <div class="grid"><div>Ваша цена: <b>${money(v.ours)}</b></div><div>Конкурент: <b>${money(v.other)}</b></div><div>Шанс спроса: <b>${Math.round(v.chance*100)}%</b></div></div>
     <p>Реклама: ${v.campaign?'активна до дня '+c.campaignUntil:'неактивна'} · Потрачено: ${money(c.spent)} · Успешных смен оператора: ${c.sales} · Упущенных: ${c.lost}</p>
     <button class="primary" data-ad30="${cfg.id}" ${v.campaign||S.cash<1200?'disabled':''}>Запустить рекламу на 3 дня · 1 200 ₽</button>
     <p class="mini">Цена меняется в разделе «Товарный бизнес». Реклама повышает вероятность заказа, но не гарантирует продажи.</p></div>`;
   }).join(''):'<div class="card">Откройте торговый проект, чтобы увидеть конкурентов.</div>');
 }
 const prevDay=advanceDay;
 advanceDay=function(){prevDay();daily();};
 const prevRender=render;
 render=function(){
  if(tab==='competition30'){
   for(const [id,val] of [['cash',money(S.cash)],['day',S.day],['net',money(net())],['energy',S.energy+'%']]){
    const el=document.querySelector('#'+id);if(el)el.textContent=val;
   }
   document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab==='competition30'));
   document.querySelector('#main').innerHTML=screen();return;
  }
  return prevRender();
 };
 document.querySelector('#nav')?.insertAdjacentHTML('beforeend','<button data-tab="competition30">⚖ <span>Конкуренты</span></button>');
 document.addEventListener('click',e=>{
  const b=e.target.closest('button[data-ad30]');if(!b)return;
  const r=advertise(b.dataset.ad30);toast(r.ok?'Реклама запущена':r.error);
 });
 window.Competition30={state,rivalPrice,score,canSell,advertise,daily,screen};
})();
