'use strict';
/* v19: observations come from the player's own simulated completed work, never asserted as real market wages. */
function labour19(){const X=ext();if(!X.labour19)X.labour19={sessions:[]};return X.labour19}
function sessions19(){return labour19().sessions}
const previousWorkResult19=workResult;
workResult=function(success){
 const job=WORK.find(x=>x.id===modal?.id),before=S.nextLedgerId,day=S.day;
 if(!job)return previousWorkResult19(success);
 const result=previousWorkResult19(success);
 const events=S.ledger.filter(x=>x.id>=before);
 const gross=events.filter(x=>x.amount>0&&['Оплата труда','Премия за заказ','Корректировка заказа'].includes(x.category)).reduce((n,x)=>n+x.amount,0);
 const costs=-events.filter(x=>x.amount<0&&x.category==='Рабочие издержки').reduce((n,x)=>n+x.amount,0);
 const unsettled=events.filter(x=>/договор|сч[её]т/i.test(x.category||'')).length>0;
 const obs={day,job:job.id,gross,costs,hours:job.hours,net:gross-costs,success:!!success,unsettled};
 sessions19().push(obs);if(sessions19().length>2500)sessions19().splice(0,sessions19().length-2500);
 save();return result;
};
function labourStats19(period=30){
 const observations=sessions19().filter(x=>period===0||S.day-x.day<period), map=new Map();
 for(const o of observations){let r=map.get(o.job);if(!r){r={job:o.job,count:0,gross:0,costs:0,net:0,hours:0,success:0,unsettled:0};map.set(o.job,r)}r.count++;r.gross+=o.gross;r.costs+=o.costs;r.net+=o.net;r.hours+=o.hours;r.success+=Number(o.success);r.unsettled+=Number(o.unsettled)}
 return [...map.values()].map(x=>({...x,hourly:x.hours?x.net/x.hours:0})).sort((a,b)=>b.count-a.count);
}
function labourScreen19(){let rows=labourStats19(0),recent=labourStats19(30),total=rows.reduce((a,b)=>({hours:a.hours+b.hours,gross:a.gross+b.gross,costs:a.costs+b.costs,net:a.net+b.net,count:a.count+b.count}),{hours:0,gross:0,costs:0,net:0,count:0});
 return header('Аналитика подработок','Фактические результаты игрового персонажа, а не статистика реальных работников')+`<div class="grid four">${[['Смены',total.count],['Отработано часов',total.hours],['Получено за смены',money(total.gross)],['После прямых издержек',money(total.net)]].map(([k,v])=>`<div class="card"><div class="mini">${k}</div><h2>${v}</h2></div>`).join('')}</div><div class="card"><h2>Сравнение профессий · вся игровая история</h2><div style="overflow:auto"><table class="audit-table"><tr><th>Профессия</th><th>Смены</th><th>Часы</th><th>Получено</th><th>Издержки</th><th>После издержек</th><th>₽/час</th></tr>${rows.map(r=>{let job=WORK.find(x=>x.id===r.job);return `<tr><td>${esc(job?.name||r.job)}${r.count<5?'<div class="mini">Мало наблюдений</div>':''}</td><td>${r.count}</td><td>${r.hours}</td><td>${money(r.gross)}</td><td>${money(r.costs)}</td><td>${money(r.net)}</td><td>${money(Math.round(r.hourly))}</td></tr>`}).join('')||'<tr><td colspan="7">Сначала выполните подработку</td></tr>'}</table></div></div><div class="card"><h2>Последние 30 игровых дней</h2><div style="overflow:auto"><table class="audit-table"><tr><th>Работа</th><th>Смены</th><th>₽/час после издержек</th></tr>${recent.map(r=>`<tr><td>${esc(WORK.find(x=>x.id===r.job)?.name||r.job)}</td><td>${r.count}</td><td>${money(Math.round(r.hourly))}</td></tr>`).join('')||'<tr><td colspan="3">Нет выполненных смен</td></tr>'}</table></div><p class="mini">Ставки, клиентский спрос и районные коэффициенты — модельные параметры. Реальная зарплата не выводится из этих результатов. По договорам возможна задержка оплаты: полученные деньги могут отличаться от номинала выполненного заказа. Личные расходы, налоги и неоплаченная работа учитываются отдельно.</p></div>`}
const priorRender19=render;
render=function(){if(tab==='labour19'){for(const [k,v] of [['cash',money(S.cash)],['day',S.day],['net',money(net())],['energy',S.energy+'%']]){let el=document.getElementById(k);if(el)el.textContent=v}document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab==='labour19'));document.querySelector('#main').innerHTML=labourScreen19();return}priorRender19()};
document.getElementById('nav')?.insertAdjacentHTML('beforeend','<button data-tab="labour19">▤ <span>Анализ труда</span></button>');
window.Labour19Test={labour19,labourStats19,labourScreen19};
