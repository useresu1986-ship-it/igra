'use strict';
/* Version 0.9: cash liquidity planning and reconciliation. All amounts are game hypotheses. */
const FinanceV9={version:9, horizon:14};
function v9LedgerBalance(){return S.ledger.reduce((sum,r)=>sum+(Number(r.amount)||0),0)}
function v9Reserve(){let total=0;for(let i=0;i<ASSETS.length;i++)if(S.owned.includes(i))total+=ASSETS[i][3];return total}
function v9DailyCosts(){let personal=450;if(typeof houseExpenses==='function'){try{let v=Object.values(houseExpenses()).reduce((a,b)=>a+b,0);if(Number.isFinite(v)&&v>=0)personal=v}catch{}}let firms=0,team=0;for(const cfg of PROJECTS){const p=S.projects[cfg.id];if(!p?.open)continue;const charges=dailyProjectCharges(cfg,p);firms+=charges.upkeep+charges.staff+charges.traffic;team+=window.Team27?.dailyPayroll(cfg.id)||0;}return {personal,firms,team,total:personal+firms+team}}
// Общий чистый расчёт для планирования и стресс-теста, без проводок и сохранения.
function v9ProjectCash({days=14,collection=50,delay=0,extra=0}={}){
 if(!Number.isInteger(days)||days<1||days>90)throw Error('Недопустимый горизонт');
 if(!Number.isFinite(collection)||collection<0||collection>100)throw Error('Недопустимый процент оплат');
 const daily=v9DailyCosts(),receivables=financialReceivables({forecast:true});
 let cash=Number(S.cash)||0, debt=Number(S.debt)||0, firstDeficit=null;
 const rows=[],receipts=receivables;
 const schedule=new Map(),contracts=new Map();
 for(const r of receipts){
   const due=Math.max(S.day+1,Number.isFinite(Number(r.due))?Number(r.due)+delay:S.day+1);
   const target=r.kind==='contract'?contracts:schedule;
   target.set(due,(target.get(due)||0)+Number(r.gross));
 }
 for(let i=1;i<=days;i++){
   const due=schedule.get(S.day+i)||0;
   const contractExpected=Math.round((contracts.get(S.day+i)||0)*collection/100);
   const expected=Math.round(due*collection/100)+contractExpected;
   const exceptional=i===1?extra:0;
   const out=daily.total+exceptional;
   // Порядок фактического дня: общие счета/базовые расходы → долг и проценты → договоры → команда.
   cash+=expected-contractExpected-(out-daily.team);
   if(cash<0){if(firstDeficit===null)firstDeficit=i;debt+=-cash;cash=0;}
   if(debt>0)debt+=Math.max(1,Math.round(debt*.0006));
   cash+=contractExpected-daily.team;
   if(cash<0){if(firstDeficit===null)firstDeficit=i;debt+=-cash;cash=0;}
   rows.push({day:S.day+i,expected,out,cash:Math.round(cash),debt:Math.round(debt)});
 }
 return {rows,firstDeficit,final:rows[rows.length-1],daily,
  totalExpected:rows.reduce((a,r)=>a+r.expected,0),
  totalOut:rows.reduce((a,r)=>a+r.out,0),
  initialCash:Number(S.cash)||0, eligibleInvoices:receipts.length,
  collection};
}
function v9Forecast(days=14){
 const P=typeof riskProjection21==='function'?riskProjection21({days,collection:50,shock:'base'}):v9ProjectCash({days,collection:50});
 return {costs:P.daily,series:P.rows.map(r=>({day:r.day,cash:r.cash,debt:r.debt,expected:r.expected})),
  receivables:financialReceivables().reduce((n,r)=>n+(Number(r.gross)||0),0),
  end:P.final||{cash:S.cash,debt:S.debt},
  assumption:'Сценарий: 50% неоплаченных счетов поступят к сроку (просроченные — завтра). Без новых заказов и продаж. Состав команды и премии фиксированы; будущие закупки, ручная уплата налогов, индексация и случайные события не предсказываются. Изменить долю оплат и стресс-факторы можно во вкладке «Стресс-тест финансов».'
 };
}
function v9Audit(){let balance=v9LedgerBalance(),F=v9Forecast(FinanceV9.horizon),cost=F.costs,rows=S.ledger.slice(-80).reverse();let mismatch=Math.round(S.cash-balance);return header('Планирование денег','Прогноз ликвидности на основе расходов и выставленных счетов — не гарантия поступлений')+`<div class="grid four"><div class="card"><div class="mini">На счету</div><div class="statnum">${money(S.cash)}</div></div><div class="card"><div class="mini">Обязательные траты в день</div><div class="statnum neg">${money(cost.total)}</div></div><div class="card"><div class="mini">Счета к получению</div><div class="statnum">${money(F.receivables)}</div></div><div class="card"><div class="mini">Долг</div><div class="statnum neg">${money(S.debt)}</div></div></div><div class="card"><h2>Сценарий денежных средств</h2><div class="toolbar"><label>Горизонт <select id="v9horizon">${[7,14,30].map(n=>`<option value="${n}" ${FinanceV9.horizon===n?'selected':''}>${n} дней</option>`).join('')}</select></label></div><p class="mini">${F.assumption} Рост бизнеса и непредвиденные события исключены.</p><div class="audit-scroll"><table class="audit-table"><thead><tr><th>День</th><th>Ожидаемые оплаты</th><th>Расходы</th><th>Остаток</th><th>Долг</th></tr></thead><tbody>${F.series.map(r=>`<tr><td>${r.day}</td><td>${money(r.expected)}</td><td>${money(cost.total)}</td><td>${money(r.cash)}</td><td>${money(r.debt)}</td></tr>`).join('')}</tbody></table></div></div><div class="grid"><div class="card"><h2>Резерв устойчивости</h2><p>Деньги без новых поступлений хватит на <b>${cost.total?Math.floor(S.cash/cost.total):'∞'}</b> полных дней текущих расходов.</p><p class="mini">Стоимость приобретённой техники при продаже по условной оценке: ${money(v9Reserve())}. Залоги, репутация и интеллектуальные права не включены.</p></div><div class="card"><h2>Контроль журналов</h2><p>Сумма проводок: ${money(balance)}</p><p>Разница кассы и журнала: <b>${money(mismatch)}</b></p><p class="mini">Разница может отражать стартовый капитал, миграцию сохранения и отдельные операции из старых версий. Не считается автоматически ошибкой.</p></div></div><div class="card"><h2>Последние операции</h2><div class="audit-scroll"><table class="audit-table"><thead><tr><th>День</th><th>Статья</th><th>Источник</th><th>Сумма</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${x.day}</td><td>${esc(x.category)}</td><td>${esc(x.source)}</td><td class="${x.amount<0?'neg':'pos'}">${money(x.amount)}</td></tr>`).join('')}</tbody></table></div></div>`}
const v9OriginalRender=render;
render=function(){if(tab==='planning'){document.querySelector('#cash').textContent=money(S.cash);document.querySelector('#day').textContent=S.day;document.querySelector('#net').textContent=money(net());document.querySelector('#energy').textContent=S.energy+'%';document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));document.querySelector('#main').innerHTML=v9Audit();return;}v9OriginalRender()};
document.querySelector('#nav')?.insertAdjacentHTML('beforeend','<button data-tab="planning">🧮 <span>Планирование кассы</span></button>');
document.addEventListener('change',e=>{if(e.target.id==='v9horizon'){FinanceV9.horizon=Number(e.target.value);render()}});
window.FinanceV9={v9ProjectCash,v9DailyCosts,v9Forecast,v9LedgerBalance,v9Audit};
