'use strict';
/* 0.27: role-based team, separate from legacy staff. All rates are game assumptions. */
(function(){
 const ROLES={
  operations:{name:'Оператор заказов',wage:520,setup:1800,energy:2,description:'Автоматически обрабатывает 1 заказ в день при наличии товара',commerce:true},
  marketing:{name:'Маркетолог',wage:760,setup:2400,energy:0,description:'Повышает охват проекта каждый день',commerce:false},
  procurement:{name:'Закупщик',wage:630,setup:2100,energy:0,description:'Создаёт заявку на 5 шт., если склад опустел',commerce:true}
 };
 function team(id){const p=pr(id);if(!p?.open)return null;if(!p.team27)p.team27={members:[],nextId:1,history:[]};return p.team27}
 function hireRole(id,role){
  const p=pr(id),r=ROLES[role],t=team(id),cfg=PROJECTS.find(c=>c.id===id);
  if(!t||!r||!cfg)return {ok:false,error:'Проект не открыт'};
  if(r.commerce&&cfg.type!=='commerce')return {ok:false,error:'Эта должность доступна только торговым проектам'};
  if(t.members.length>=6)return {ok:false,error:'Максимум шесть сотрудников в проекте'};
  if(S.cash<r.setup+r.wage*3)return {ok:false,error:'Недостаточно денег: нужен найм и резерв на 3 дня'};
  book('Подбор сотрудника',-r.setup,'Команда: '+cfg.name,'Разовый расход на подбор: '+r.name,id);
  const member={id:t.nextId++,role,hired:S.day};
  t.members.push(member);save();render();return {ok:true,member};
 }
 function fireRole(id,memberId){
  const t=team(id);if(!t)return {ok:false,error:'Нет команды'};
  const n=t.members.findIndex(x=>x.id===Number(memberId));
  if(n<0)return {ok:false,error:'Сотрудник не найден'};
  t.members.splice(n,1);save();render();return {ok:true};
 }
 function workday(){
  const summary=[];
  for(const cfg of PROJECTS){
   const p=pr(cfg.id);if(!p?.open||!p.team27?.members?.length)continue;
   const t=p.team27;
   for(const m of t.members){
    const r=ROLES[m.role];if(!r)continue;
    const morale=Number.isFinite(Number(m.morale))?Number(m.morale):60;
    const bonus=Math.max(0,Number(m.dailyBonus)||0);
    book('Зарплата команды',-(r.wage+bonus),'Команда: '+cfg.name,'Ежедневная оплата: '+r.name,cfg.id);
    let action='Оклад выплачен';
    if(morale<20){action='Срыв смены: низкая мотивация';summary.push({project:cfg.id,role:m.role,memberId:m.id,action,wage:r.wage+bonus});continue;}
    if(m.role==='marketing'){
     const skillBoost=1+0.1*Math.min(3,Number(m.training)||0)+0.1*Math.min(3,Math.floor((Number(m.xp)||0)/5));
     const gain=Math.max(1,Math.round((4+Math.sqrt(p.posts||0)*3)*skillBoost));
     p.audience=(Number(p.audience)||0)+gain;
     action='Прирост аудитории: +'+gain;
    }
    if(m.role==='operations'){
     const w=window.Inventory23.record(cfg.id),s=window.Inventory23.stats(cfg.id);
     const competitive=window.Competition30?window.Competition30.canSell(cfg.id):true;
     if(s.stock>0&&competitive){
      const units=Math.min(s.stock,1+(Number(m.xp)>=15?1:0)+(Number(m.training)>=2?1:0));
      const sale=window.BusinessV14.warehouse.sell(cfg.id,units,s.price,'Команда: '+cfg.name,'Продажа оператором','team');
      action=sale.ok?'Продано товаров: '+units:sale.error;
      if(sale.ok&&window.Competition30)window.Competition30.state(cfg.id).sales++;
     }else {action=s.stock>0?'Нет спроса из-за конкуренции':'Нет товара на складе';if(s.stock>0&&window.Competition30)window.Competition30.state(cfg.id).lost++;}
    }
    if(m.role==='procurement'){
     const c=window.BusinessV14.warehouse.capacity(cfg.id);
     if(c.stock+c.transit+c.waiting<5){
      const res=window.Suppliers26.order(cfg.id,'standard',5);
      action=res.ok?'Создан заказ на 5 шт.':res.error;
     }else action='Запас достаточен';
    }
    summary.push({project:cfg.id,role:m.role,memberId:m.id,action,wage:r.wage+bonus});
   }
   t.history.push({day:S.day,summary:summary.filter(x=>x.project===cfg.id)});
   t.history=t.history.slice(-30);
  }
  if(S.cash<0){S.debt+=-S.cash;S.cash=0;notice('Нехватка денег на персонал: образовался долг');}
  if(summary.length)save();
  return summary;
 }
 function screen(){
  const active=PROJECTS.filter(c=>pr(c.id)?.open);
  return header('Команда и делегирование','Нанимай специалистов, контролируй оклады и автоматизируй рутинные задачи')+
   `<div class="notice">Оклады и результаты работы — игровые параметры, не рыночная статистика. Новая команда учитывается отдельно от прежнего счётчика «Сотрудники».</div>`+
   (active.length?active.map(c=>{
    const t=team(c.id),wages=t.members.reduce((a,m)=>a+(ROLES[m.role]?.wage||0),0);
    return `<div class="card" style="margin-top:14px"><h2>${esc(c.name)}</h2><p>Специалистов: <b>${t.members.length}/6</b> · Оклады в день: <b>${money(wages)}</b> · Резерв на 7 дней: <b>${money(wages*7)}</b></p>
    <div class="toolbar"><label>Новая должность <select data-role27="${c.id}">${Object.entries(ROLES).filter(([k,r])=>!r.commerce||c.type==='commerce').map(([k,r])=>`<option value="${k}">${r.name} · ${money(r.wage)}/день</option>`).join('')}</select></label><button class="primary" data-hire27="${c.id}">Нанять</button></div>
    ${t.members.length?t.members.map(m=>`<div class="line"><span>${esc(ROLES[m.role]?.name||m.role)} · ${money(ROLES[m.role]?.wage||0)}/день</span><button class="ghost" data-fire27="${c.id}" data-member="${m.id}">Уволить</button></div>`).join(''):'<p class="mini">Команда ещё не нанята</p>'}
    <p class="mini">${t.history.at(-1)?.summary.map(x=>ROLES[x.role].name+': '+x.action).join(' · ')||'Отчёт появится после следующего игрового дня.'}</p></div>`;
   }).join(''):'<div class="card">Сначала откройте хотя бы один бизнес-проект.</div>');
 }
 const prevDay=advanceDay;
 advanceDay=function(){prevDay();workday();};
 const prevRender=render;
 render=function(){
  if(tab==='team27'){
   for(const [id,val] of [['cash',money(S.cash)],['day',S.day],['net',money(net())],['energy',S.energy+'%']]){
    const el=document.querySelector('#'+id);if(el)el.textContent=val;
   }
   document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab==='team27'));
   document.querySelector('#main').innerHTML=screen();return;
  }
  return prevRender();
 };
 document.querySelector('#nav')?.insertAdjacentHTML('beforeend','<button data-tab="team27">👥 <span>Команда</span></button>');
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  let res;
  if(b.dataset.hire27){
   res=hireRole(b.dataset.hire27,document.querySelector(`[data-role27="${b.dataset.hire27}"]`)?.value);
  }else if(b.dataset.fire27){res=fireRole(b.dataset.fire27,b.dataset.member);}
  if(res)toast(res.ok?'Команда обновлена':res.error);
 });
 window.Team27={ROLES,team,hireRole,fireRole,workday,screen};
})();
