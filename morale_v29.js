'use strict';
/* v29: deterministic morale and retention. All parameters are fictional gameplay assumptions. */
(function(){
 const clamp=n=>Math.max(0,Math.min(100,Math.round(n)));
 function person(id,n){return window.Training28.member(id,n)}
 function morale(m){return Number.isFinite(Number(m.morale))?clamp(Number(m.morale)):60}
 function praise(id,n){
  const m=person(id,n);if(!m)return {ok:false,error:'Сотрудник не найден'};
  if(m.lastPraise===S.day)return {ok:false,error:'Беседа уже была сегодня'};
  if(S.hours<1||S.energy<5)return {ok:false,error:'Не хватает времени или энергии'};
  S.hours--;S.energy-=5;m.morale=clamp(morale(m)+12);m.lastPraise=S.day;
  save();render();return {ok:true,morale:m.morale};
 }
 function bonus(id,n){
  const m=person(id,n);if(!m)return {ok:false,error:'Сотрудник не найден'};
  if(m.dailyBonus)return {ok:false,error:'Доплата уже назначена'};
  const wage=window.Team27.ROLES[m.role]?.wage;if(!wage)return {ok:false,error:'Неизвестная должность'};
  if(S.cash<wage*4)return {ok:false,error:'Недостаточный денежный резерв'};
  m.dailyBonus=Math.round(wage*.25);m.morale=clamp(morale(m)+15);
  save();render();return {ok:true,dailyBonus:m.dailyBonus};
 }
 function removeBonus(id,n){
  const m=person(id,n);if(!m)return {ok:false,error:'Сотрудник не найден'};
  if(!m.dailyBonus)return {ok:false,error:'Доплата не назначена'};
  m.dailyBonus=0;m.morale=clamp(morale(m)-15);
  save();render();return {ok:true};
 }
 function retention(){
  const report=[];
  for(const cfg of PROJECTS){
   const p=pr(cfg.id);if(!p?.open||!p.team27?.members?.length)continue;
   const t=p.team27;
   for(const m of [...t.members]){
    m.morale=clamp(morale(m)-(m.dailyBonus?1:3));
    m.burnoutDays=m.morale<20?(Number(m.burnoutDays)||0)+1:0;
    if(m.burnoutDays>=4){
     t.members=t.members.filter(x=>x.id!==m.id);
     report.push({project:cfg.id,memberId:m.id,event:'Уволился из-за выгорания'});
     notice('Сотрудник проекта «'+cfg.name+'» уволился из-за низкой мотивации');
    }
   }
  }
  save();return report;
 }
 const prevDay=advanceDay;
 advanceDay=function(){prevDay();retention();};
 function screen(){
  const active=PROJECTS.filter(c=>pr(c.id)?.open);
  return header('Мотивация и удержание','Разговаривай с командой и контролируй расходы')+
   `<div class="notice">Условная модель: смена −3 пункта, при доплате −1; беседа +12, доплата +15. Ниже 20 сотрудник пропускает смену; после четырёх таких дней увольняется. Это игровые правила, не статистика.</div>`+
   (active.length?active.map(c=>{
    const t=window.Team27.team(c.id);
    return `<div class="card" style="margin-top:14px"><h2>${esc(c.name)}</h2>`+
     (t.members.length?t.members.map(m=>{
      const r=window.Team27.ROLES[m.role],score=morale(m);
      return `<div class="line"><span><b>${esc(r?.name||m.role)} #${m.id}</b> · Мотивация: ${score}/100 · Оплата: ${money((r?.wage||0)+(Number(m.dailyBonus)||0))}/день ${score<20?'⚠ Пропускает смены':''}</span>
      <button class="ghost" data-praise29="${c.id}" data-person29="${m.id}" ${m.lastPraise===S.day||S.hours<1||S.energy<5?'disabled':''}>Беседа (1 ч.)</button>
      <button class="ghost" data-bonus29="${c.id}" data-person29="${m.id}">${m.dailyBonus?'Убрать доплату':'Доплата +25%'}</button></div>`;
     }).join(''):'<p class="mini">Нет сотрудников. Нанимайте во вкладке «Команда».</p>')+'</div>';
   }).join(''):'<div class="card">Сначала откройте бизнес-проект.</div>');
 }
 const prevRender=render;
 render=function(){
  if(tab==='morale29'){
   for(const [id,val] of [['cash',money(S.cash)],['day',S.day],['net',money(net())],['energy',S.energy+'%']]){
    const el=document.querySelector('#'+id);if(el)el.textContent=val;
   }
   document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab==='morale29'));
   document.querySelector('#main').innerHTML=screen();return;
  }
  return prevRender();
 };
 document.querySelector('#nav')?.insertAdjacentHTML('beforeend','<button data-tab="morale29">♥ <span>Мотивация</span></button>');
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  let result;
  if(b.dataset.praise29)result=praise(b.dataset.praise29,b.dataset.person29);
  if(b.dataset.bonus29){const m=person(b.dataset.bonus29,b.dataset.person29);result=m?.dailyBonus?removeBonus(b.dataset.bonus29,b.dataset.person29):bonus(b.dataset.bonus29,b.dataset.person29);}
  if(result)toast(result.ok?'Решение применено':result.error);
 });
 window.Morale29={morale,praise,bonus,removeBonus,retention,person,screen};
})();
