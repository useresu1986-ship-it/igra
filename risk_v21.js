'use strict';
/* 0.21: deterministic scenario stress-testing, never changes the player's finances.
   Inputs are game assumptions, not empirical default probabilities. */
const Risk21={days:30,collection:50,shock:'base'};
const SHOCK21={
 base:{label:'Без дополнительного шока',extra:0,delay:0},
 illness:{label:'Болезнь: разовый расход 6 000 ₽',extra:6000,delay:0},
 late:{label:'Клиенты платят на 10 дней позже',extra:0,delay:10},
 repair:{label:'Ремонт техники: разовый расход 15 000 ₽',extra:15000,delay:0}
};
function riskProjection21({days=Risk21.days,collection=Risk21.collection,shock=Risk21.shock}={}){
 days=Number(days);collection=Number(collection);
 if(!Number.isInteger(days)||days<1||days>90)throw Error('Недопустимый горизонт');
 if(!Number.isFinite(collection)||collection<0||collection>100)throw Error('Недопустимый процент оплат');
 if(!SHOCK21[shock])throw Error('Недопустимый сценарий');
 const sh=SHOCK21[shock],daily=v9DailyCosts(),receivables=ensureEconomy().receivables||[];
 let cash=Number(S.cash)||0, debt=Number(S.debt)||0, firstDeficit=null;
 const rows=[],receipts=receivables.filter(r=>r&&Number.isFinite(Number(r.gross))&&Number(r.gross)>0&&
   !['paid','lost','disputed','cancelled','written_off'].includes(String(r.status||'pending').toLowerCase()));
 const schedule=new Map();
 for(const r of receipts){
   const due=Math.max(S.day+1,Number.isFinite(Number(r.due))?Number(r.due)+sh.delay:S.day+1);
   schedule.set(due,(schedule.get(due)||0)+Number(r.gross));
 }
 for(let i=1;i<=days;i++){
   const due=schedule.get(S.day+i)||0;
   const expected=Math.round(due*collection/100);
   const exceptional=i===1?sh.extra:0;
   const out=daily.total+exceptional;
   cash+=expected-out;
   if(cash<0){if(firstDeficit===null)firstDeficit=i;debt+=-cash;cash=0;}
   if(debt>0)debt+=Math.max(1,Math.round(debt*.0006));
   rows.push({day:S.day+i,expected,out,cash:Math.round(cash),debt:Math.round(debt)});
 }
 return {rows,firstDeficit,final:rows[rows.length-1],daily,
  totalExpected:rows.reduce((a,r)=>a+r.expected,0),
  totalOut:rows.reduce((a,r)=>a+r.out,0),
  initialCash:Number(S.cash)||0, eligibleInvoices:receipts.length,
  shock:sh.label,collection};
}
function riskScreen21(){
 const R=riskProjection21();
 return header('Стресс-тест финансов','Что будет, если платежи задержатся или возникнут непредвиденные расходы?')+
 `<div class="card"><h2>Условия сценария</h2><p class="mini">Модель без новых заказов и продаж. Ни одна настройка не изменяет игровое сохранение. Вероятности не выдаются за рыночную статистику.</p>
 <div class="toolbar"><label>Горизонт <select id="risk-days">${[7,14,30,60,90].map(n=>`<option value="${n}" ${Risk21.days===n?'selected':''}>${n} дней</option>`).join('')}</select></label>
 <label>Доля счетов, которые будут оплачены <select id="risk-collection">${[0,25,50,75,100].map(n=>`<option value="${n}" ${Risk21.collection===n?'selected':''}>${n}%</option>`).join('')}</select></label>
 <label>Событие <select id="risk-shock">${Object.entries(SHOCK21).map(([k,v])=>`<option value="${k}" ${Risk21.shock===k?'selected':''}>${esc(v.label)}</option>`).join('')}</select></label></div></div>
 <div class="grid four">
 <div class="card"><div class="mini">Деньги сейчас</div><div class="statnum">${money(R.initialCash)}</div></div>
 <div class="card"><div class="mini">Поступления по сценарию</div><div class="statnum">${money(R.totalExpected)}</div></div>
 <div class="card"><div class="mini">Предстоящие расходы</div><div class="statnum neg">${money(R.totalOut)}</div></div>
 <div class="card"><div class="mini">Первый кассовый разрыв</div><div class="statnum">${R.firstDeficit===null?'Нет':'День '+R.firstDeficit}</div></div></div>
 <div class="card"><h2>Денежный поток по дням</h2><div class="audit-scroll"><table class="audit-table"><thead><tr><th>День</th><th>Поступления</th><th>Расходы</th><th>Деньги</th><th>Долг</th></tr></thead><tbody>${R.rows.map(r=>`<tr><td>${r.day}</td><td>${money(r.expected)}</td><td>${money(r.out)}</td><td>${money(r.cash)}</td><td>${money(r.debt)}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="card"><h2>Что означает расчёт</h2><p>Платежи моделируются по указанной доле оплат; просроченные счета учитываются в ближайший игровой день, задержка применяется только в сценарии. При нехватке денег модель добавляет непокрытый расход к долгу. Проценты на долг — существующее условное игровое правило. Это сценарный стресс-тест, а не прогноз реальных заработков.</p></div>`;
}
const riskPriorRender21=render;
render=function(){
 if(tab==='risk21'){
   for(const [id,val] of [['cash',money(S.cash)],['day',S.day],['net',money(net())],['energy',S.energy+'%']]){
     const el=document.getElementById(id);if(el)el.textContent=val;
   }
   document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab==='risk21'));
   document.querySelector('#main').innerHTML=riskScreen21();return;
 }
 return riskPriorRender21();
};
document.querySelector('#nav')?.insertAdjacentHTML('beforeend','<button data-tab="risk21">⚠ <span>Стресс-тест финансов</span></button>');
document.addEventListener('change',e=>{
 const id=e.target.id;
 if(id==='risk-days')Risk21.days=Number(e.target.value);
 else if(id==='risk-collection')Risk21.collection=Number(e.target.value);
 else if(id==='risk-shock')Risk21.shock=e.target.value;
 else return;
 render();
});
window.Risk21Test={riskProjection21,riskScreen21,Risk21};
