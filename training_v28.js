'use strict';
/* Version 0.28 — deterministic employee development, no fabricated labor market claims. */
(function(){
 const LEVELS=[0,5,15,35];
 const TRAIN_COST=1800;
 function member(id,number){
  const t=window.Team27.team(id);
  return t?.members.find(m=>m.id===Number(number))||null;
 }
 function level(m){const xp=Math.max(0,Number(m.xp)||0);return LEVELS.reduce((a,t)=>a+(xp>=t?1:0),0);}
 function trained(m){return Math.max(0,Math.floor(Number(m.training)||0));}
 function efficiency(m){return Math.min(1.6,1+0.1*(level(m)-1)+0.05*trained(m));}
 function train(id,number){
  const m=member(id,number);
  if(!m)return {ok:false,error:'Сотрудник не найден'};
  if(trained(m)>=3)return {ok:false,error:'Достигнут предел обучения'};
  if(S.cash<TRAIN_COST)return {ok:false,error:'Недостаточно денег на обучение'};
  book('Обучение команды',-TRAIN_COST,'Команда','Повышение квалификации сотрудника #'+m.id,id);
  m.training=trained(m)+1;
  save();render();
  return {ok:true,training:m.training};
 }
 // Wrap only once. Team27 workday remains the sole salary/payment mechanism.
 const previousWorkday=window.Team27.workday;
 // Existing advanceDay closure captures the original workday function.
 // Upgrade it by replacing the exposed workday AND wrapping the day boundary
 // to apply skill progression *after* daily operations, avoiding duplicate salaries.
 const previousAdvance=advanceDay;
 advanceDay=function(){
  previousAdvance();
  for(const cfg of PROJECTS){
   const p=pr(cfg.id);if(!p?.open||!p.team27?.members?.length)continue;
   const t=p.team27;
   const last=t.history?.at(-1);
   if(last?.day!==S.day)continue;
   for(const m of t.members){
    const activity=last.summary?.find(x=>x.memberId===m.id && !x.action.startsWith('Срыв смены'));
    if(activity){m.xp=(Number(m.xp)||0)+1;}
   }
  }
  save();
 };
 function screen(){
  const active=PROJECTS.filter(p=>pr(p.id)?.open);
  return header('Развитие сотрудников','Опыт, обучение и стоимость подготовки команды')+
  `<div class="notice">Опыт и стоимость обучения — игровые параметры. Опыт повышает производительность операторов и маркетологов. Закупщик пока работает по прежнему правилу пополнения запасов.</div>`+
  (active.length?active.map(p=>{
   const t=window.Team27.team(p.id);
   return `<div class="card" style="margin-top:14px"><h2>${esc(p.name)}</h2>`+
   (t.members.length?t.members.map(m=>`<div class="line"><span>${esc(window.Team27.ROLES[m.role]?.name||m.role)} #${m.id} · Уровень ${level(m)}/4 · Опыт ${Math.max(0,Number(m.xp)||0)} · Курсы ${trained(m)}/3 · Потенциальный коэффициент ${efficiency(m).toFixed(2)}×</span><button class="ghost" data-train28="${p.id}" data-employee="${m.id}" ${trained(m)>=3||S.cash<TRAIN_COST?'disabled':''}>Обучить (${money(TRAIN_COST)})</button></div>`).join(''):'<p class="mini">Сначала наймите сотрудников во вкладке «Команда».</p>')+
   `</div>`;
  }).join(''):'<div class="card">Сначала откройте бизнес-проект.</div>');
 }
 const previousRender=render;
 render=function(){
  if(tab==='training28'){
   for(const [id,val] of [['cash',money(S.cash)],['day',S.day],['net',money(net())],['energy',S.energy+'%']]){
    const el=document.querySelector('#'+id);if(el)el.textContent=val;
   }
   document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab==='training28'));
   document.querySelector('#main').innerHTML=screen();return;
  }
  return previousRender();
 };
 document.querySelector('#nav')?.insertAdjacentHTML('beforeend','<button data-tab="training28">🎓 <span>Развитие команды</span></button>');
 document.addEventListener('click',e=>{
  const b=e.target.closest('button[data-train28]');if(!b)return;
  const result=train(b.dataset.train28,b.dataset.employee);
  toast(result.ok?'Сотрудник прошёл обучение':result.error);
 });
 window.Training28={train,level,efficiency,screen,member};
})();
