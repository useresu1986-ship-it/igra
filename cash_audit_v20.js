'use strict';
/* v20: contract-aware earned vs received labour audit.
   Values are observations from this playthrough, not external wage estimates. */
function cashAudit20(period=0){
  const recent = x => period===0 || S.day-x.day<period;
  const base=(labour19().sessions||[]).filter(recent);
  const contracts=(contracts11().history||[]).filter(recent);
  const out=new Map();
  const ensure=id=>{if(!out.has(id))out.set(id,{id,shifts:0,hours:0,earned:0,received:0,costs:0,waiting:0,disputed:0,lost:0});return out.get(id)};
  // Non-contract jobs are settled immediately. Contract observations are replaced
  // with their agreed contract amount; reversing book() entries are not income.
  const contractJobsByDay=new Map();
  for(const c of contracts){const k=c.day+'|'+c.job;contractJobsByDay.set(k,(contractJobsByDay.get(k)||0)+1)}
  for(const s of base){const r=ensure(s.job),k=s.day+'|'+s.job;
    r.shifts++;r.hours+=Math.max(0,s.hours||0);r.costs+=Math.max(0,s.costs||0);
    const pendingCount=contractJobsByDay.get(k)||0;
    if(pendingCount){contractJobsByDay.set(k,pendingCount-1)}else{
      r.earned+=Math.max(0,s.gross||0);r.received+=Math.max(0,s.gross||0);
    }
  }
  for(const c of contracts){const r=ensure(c.job);const amount=Math.max(0,c.gross||0);
    r.earned+=amount;
    if(c.status==='paid')r.received+=amount;
    if(c.status==='pending')r.waiting+=amount;
    if(c.status==='disputed')r.disputed+=amount;
    if(c.status==='lost')r.lost+=amount;
  }
  return [...out.values()].map(r=>({...r,cashNet:r.received-r.costs,earnedNet:r.earned-r.costs,hourlyReceived:r.hours?(r.received-r.costs)/r.hours:0})).sort((a,b)=>b.shifts-a.shifts);
}
function cashAuditScreen20(){
 const all=cashAudit20(), last=cashAudit20(30);const sum=(list,key)=>list.reduce((n,r)=>n+r[key],0);
 const cells=[['Начислено',sum(all,'earned')],['Получено',sum(all,'received')],['Ожидается',sum(all,'waiting')],['Оспаривается',sum(all,'disputed')],['Потеряно',sum(all,'lost')],['Издержки',sum(all,'costs')]];
 const table=(rows)=>`<div class="audit-scroll"><table class="audit-table"><thead><tr><th>Профессия</th><th>Часы</th><th>Начислено</th><th>Получено</th><th>Издержки</th><th>Ожидание / спор</th><th>Потеряно</th><th>₽/час факт.</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(WORK.find(j=>j.id===r.id)?.name||r.id)}</td><td>${r.hours}</td><td>${money(r.earned)}</td><td>${money(r.received)}</td><td>${money(r.costs)}</td><td>${money(r.waiting+r.disputed)}</td><td>${money(r.lost)}</td><td>${money(Math.round(r.hourlyReceived))}</td></tr>`).join('')||'<tr><td colspan="8">Нет выполненной работы</td></tr>'}</tbody></table></div>`;
 return header('Аудит заработка и выплат','Начисления не равны деньгам на счёте')+`<div class="notice">Это реальные результаты только ВНУТРИ прохождения игры. Ставки рынка труда, вероятность спора и задержки — игровые гипотезы, не статистика России.</div><div class="grid three">${cells.map(([k,v])=>`<div class="card"><div class="mini">${k}</div><h2>${money(v)}</h2></div>`).join('')}</div><div class="card"><h2>За всё время · фактически полученные деньги</h2>${table(all)}</div><div class="card"><h2>Последние 30 игровых дней</h2>${table(last)}<p class="mini">Период выбирается по дню выполнения работы; последующая оплата этого договора изменяет его статус. Включает прямые рабочие издержки, но не личные расходы и налоги. Старые игровые смены до версии 0.19 нельзя восстановить.</p></div>`;
}
const auditPreviousRender20=render;
render=function(){if(tab==='cash_audit20'){
  for(const [id,v] of [['cash',money(S.cash)],['day',S.day],['net',money(net())],['energy',S.energy+'%']]){const node=document.getElementById(id);if(node)node.textContent=v}
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));document.querySelector('#main').innerHTML=cashAuditScreen20();return;
 }return auditPreviousRender20()};
document.getElementById('nav')?.insertAdjacentHTML('beforeend','<button data-tab="cash_audit20">▦ <span>Заработок и выплаты</span></button>');
window.CashAudit20={cashAudit20,cashAuditScreen20};
