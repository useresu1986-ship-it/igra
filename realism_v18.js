'use strict';
/* Economy realism 0.18: verified legal rules and CPI, illustrative regional prices.
   No regional estimate below purports to be observed market data. */
const RE18={
  snapshot:'2026-10-15',
  sources:{npd:'https://npd.nalog.ru/',cpi:'https://rosstat.gov.ru/storage/mediabank/157_09-10-2026.html'},
  official:{npdIndividual:0.04,npdBusiness:0.06,npdAnnualLimit:2400000,cpiSepMonth:0.0035,cpiSinceDec2025:0.0504,cpiYear:0.0635},
  regions:{
    regional:{name:'Региональный город',rent:{dorm:4500,room:13000,flat:28500},food:7300,transport:2100,phone:650,household:950,workFactor:1},
    rostov:{name:'Ростов-на-Дону',rent:{dorm:5800,room:16500,flat:33000},food:8800,transport:2600,phone:700,household:1150,workFactor:1.10},
    spb:{name:'Санкт-Петербург',rent:{dorm:7800,room:23000,flat:45000},food:10800,transport:3100,phone:750,household:1550,workFactor:1.22},
    moscow:{name:'Москва',rent:{dorm:9500,room:32000,flat:65000},food:12500,transport:3800,phone:850,household:2100,workFactor:1.35}
  },
  notes:'Все региональные цены и множители дохода — открытые сценарные допущения для настройки игры, НЕ проверенные среднерыночные показатели.'
};
function realism18(){const X=ext();if(!X.realism18)X.realism18={region:'regional',priceIndex:1,priceMode:'fixed',tax:{records:{},status:'none'},anchorDay:S.day};const R=X.realism18;if(!RE18.regions[R.region])R.region='regional';if(!R.tax||!R.tax.records)R.tax={records:{},status:'none'};return R}
function region18(){return RE18.regions[realism18().region]}
function refreshHousing18(){const r=region18();for(const k of Object.keys(WORLD.housing)){WORLD.housing[k].rent=r.rent[k];if(k!=='dorm'){WORLD.housing[k].deposit=r.rent[k];WORLD.housing[k].upgrade=Math.round(r.rent[k]*1.55)}}}

function expense18(){const r=region18(),R=realism18(),level=ext().living,f=level==='budget'?.80:level==='comfort'?1.42:1,m=R.priceIndex;return {аренда:Math.round(r.rent[worldState().home]/30*m),продукты:Math.round(r.food/30*f*m),транспорт:Math.round(r.transport/30*f*m),связь:Math.round(r.phone/30*m),быт:Math.round(r.household/30*f*m)}}
// Replace the household function by an overridable source of truth; the existing daily
// settlement reads houseExpenses() at call time, so no second charge is introduced.
houseExpenses=expense18;
// Local shift pay adjustment applies to offline and hybrid jobs only, and is
// deliberately a user-visible scenario factor (not a validated wage observation).
const originalBook18=book;
book=function(category,amount,source,note='',project=''){
 if(category==='Оплата труда' && amount>0){const job=WORK.find(j=>j.name===source);if(job&&job.category!=='Онлайн'){
   amount=Math.round(amount*region18().workFactor);
   note=(note||'')+' · региональный коэффициент (гипотеза) '+region18().workFactor;
 }}
 return originalBook18(category,amount,source,note,project);
};
function changeRegion18(key){if(!RE18.regions[key])return false;const R=realism18();R.region=key;refreshHousing18();notice('Регион проживания: '+region18().name+'. Цены являются игровыми сценариями.');save();render();return true}
function togglePrice18(value){const R=realism18();if(!['fixed','cpi'].includes(value))return false;R.priceMode=value;save();render();return true}
// CPI change is opt-in and uses a recorded official monthly index, NOT a forecast.
// Applied only once every 30 elapsed game days, strictly on the final day.
const oldDay18=advanceDay;
advanceDay=function(){const R=realism18();oldDay18();if(R.priceMode==='cpi'&&S.day-R.anchorDay>=30){R.priceIndex=Math.round(R.priceIndex*(1+RE18.official.cpiSepMonth)*1e7)/1e7;R.anchorDay=S.day;notice('Индексация модельных цен на 0,35%: исторический ИПЦ сентября 2026, не прогноз');}}
function eligibleReceipts18(){return S.ledger.filter(x=>x.amount>0 && ['Оплата труда','Оплата клиентов','Продажи','Нативная интеграция','Платформа (модель)','Оплата по договору','Реклама YouTube','Выплата MCN'].includes(x.category)).slice(-400)}
function receiptStatus18(x){return realism18().tax.records[String(x.id)]||null}
function npdBan18(x){const p=PROJECTS.find(p=>p.id===x.project);if(p&&p.type==='commerce')return 'Перепродажа товаров не допускается на НПД';if(p&&pr(p.id)?.staff>0)return 'Есть сотрудники: требуется дополнительная проверка статуса';return ''}
function classifyReceipt18(id,kind){const x=S.ledger.find(x=>x.id===id);if(!x||!eligibleReceipts18().some(r=>r.id===id))return false;if(!['individual','business','exclude'].includes(kind))return false;const reason=npdBan18(x);if(reason&&kind!=='exclude'){toast(reason);return false}const R=realism18();if(R.tax.records[String(id)]?.paid){toast('Нельзя изменить уже оплаченный расчёт');return false}R.tax.records[String(id)]={kind,paid:false};save();render();return true}
function annualTax18(){let R=realism18(),records=R.tax.records,year=Math.floor((S.day-1)/365),rows=S.ledger.filter(x=>Math.floor((x.day-1)/365)===year&&records[String(x.id)]&&records[String(x.id)].kind!=='exclude');let gross=rows.reduce((n,x)=>n+x.amount,0);let tax=rows.reduce((n,x)=>n+Math.round(x.amount*(records[String(x.id)].kind==='individual'?.04:.06)),0);let paid=rows.reduce((n,x)=>n+(records[String(x.id)].paid?Math.round(x.amount*(records[String(x.id)].kind==='individual'?.04:.06)):0),0);return {gross,tax,paid,due:tax-paid,exceeded:gross>RE18.official.npdAnnualLimit,rows}}
function payNpd18(){const a=annualTax18();if(!a.due)return toast('Нет рассчитанной суммы к оплате');if(a.exceeded)return toast('Превышен лимит НПД: требуется другой налоговый режим. Автоматический расчёт отключён.');if(S.cash<a.due)return toast('Недостаточно денег для оплаты');book('Учебная уплата НПД',-a.due,'Налоговый кабинет','Упрощённая модель; не заменяет расчёт ФНС');for(const x of a.rows)realism18().tax.records[String(x.id)].paid=true;notice('Учебная уплата НПД: '+money(a.due));save();render()}
function monthlyBudget18(){const ex=expense18();let total=Object.values(ex).reduce((a,b)=>a+b,0);return {day:total,month:total*30,items:ex,daysLeft:total?Math.floor(S.cash/total):Infinity}}
function realismScreen18(){let R=realism18(),rg=region18(),budget=monthlyBudget18(),T=annualTax18(),rows=eligibleReceipts18().slice(-18).reverse();return header('Реальная экономика · лаборатория','Проверенные нормы и открытые сценарные цены — не смешиваются')+`<div class="grid"><div class="card"><h2>🏙️ Место жизни</h2><label>Регион</label><select id="real-region">${Object.entries(RE18.regions).map(([k,v])=>`<option value="${k}" ${k===R.region?'selected':''}>${esc(v.name)}</option>`).join('')}</select><p class="mini">${RE18.notes}</p><h3>Смета на 30 игровых дней</h3><table class="audit-table">${Object.entries(budget.items).map(([k,v])=>`<tr><td>${k}</td><td>${money(v*30)}</td></tr>`).join('')}<tr><th>Итого</th><th>${money(budget.month)}</th></tr></table><div class="mini">Денег на ${budget.daysLeft} дн. текущих личных расходов (без долгов и бизнеса)</div><label>Индексация сценарных цен</label><select id="real-prices"><option value="fixed" ${R.priceMode==='fixed'?'selected':''}>Без индексации</option><option value="cpi" ${R.priceMode==='cpi'?'selected':''}>Каждые 30 дней +0,35% (исторический ИПЦ сентября 2026)</option></select><p class="mini">Официальный ИПЦ: сентябрь/август 2026 +0,35%; с декабря 2025 +5,04%; за 12 месяцев +6,35%. <a href="${RE18.sources.cpi}" target="_blank" rel="noopener">Росстат, 09.10.2026</a>. Это не прогноз будущей инфляции.</p></div><div class="card"><h2>🧾 Учебный кабинет НПД</h2><p class="mini">Самостоятельно выбери происхождение поступлений. Игра <b>не считает все доходы автоматически подходящими для НПД</b>. Ставки 4% / 6%, лимит 2,4 млн ₽ за календарный год. <a href="${RE18.sources.npd}" target="_blank" rel="noopener">ФНС России</a>.</p><div class="grid three"><div><div class="mini">Размечено поступлений</div><b>${money(T.gross)}</b></div><div><div class="mini">Расчёт НПД</div><b>${money(T.tax)}</b></div><div><div class="mini">Не оплачено</div><b>${money(T.due)}</b></div></div>${T.exceeded?'<div class="notice">Превышен лимит 2,4 млн ₽. Автоматическая оплата запрещена, необходим иной режим.</div>':''}<button class="primary" id="real-pay" ${!T.due||T.exceeded?'disabled':''}>Учебная оплата ${money(T.due)}</button><p class="mini">Это модель ручной классификации: календарные годы, налоговый бонус 10 000 ₽, отдельные НДФЛ/УСН и реальные расчёты ФНС пока не реализованы. Нельзя считать экран налоговой декларацией.</p></div></div><div class="card"><h2>Разбор поступлений</h2><div class="mini">Отмечай только подходящие по статусу самозанятого доходы; переводы зарплаты по трудовому договору, перепродажи и прочие исключения не включай.</div><div style="overflow:auto"><table class="audit-table"><tr><th>День / источник</th><th>Сумма</th><th>Тип</th></tr>${rows.map(x=>{let stat=receiptStatus18(x),ban=npdBan18(x);return `<tr><td>${x.day} · ${esc(x.source||x.category)}${ban?`<div class="mini">⚠️ ${ban}</div>`:''}</td><td>${money(x.amount)}</td><td><select data-real-tax="${x.id}" ${stat?.paid?'disabled':''}><option value="" ${!stat?'selected':''}>Не размечено</option><option value="exclude" ${stat?.kind==='exclude'?'selected':''}>Не входит в НПД</option><option value="individual" ${stat?.kind==='individual'?'selected':''}>Физлицо · 4%</option><option value="business" ${stat?.kind==='business'?'selected':''}>ИП/организация · 6%</option></select></td></tr>`}).join('')}</table></div></div>`}
// Integrate a new screen without changing older render delegates.
const renderBefore18=render;
render=function(){if(tab==='realism'){for(const [id,val] of [['cash',money(S.cash)],['day',S.day],['net',money(net())],['energy',S.energy+'%']]){const el=document.getElementById(id);if(el)el.textContent=val}document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab==='realism'));document.querySelector('#main').innerHTML=realismScreen18();return}renderBefore18()};
document.getElementById('nav')?.insertAdjacentHTML('beforeend','<button data-tab="realism">⚖ <span>Экономика регионов</span></button>');
document.addEventListener('change',e=>{if(e.target.id==='real-region')changeRegion18(e.target.value);if(e.target.id==='real-prices')togglePrice18(e.target.value);if(e.target.dataset.realTax){if(e.target.value)classifyReceipt18(Number(e.target.dataset.realTax),e.target.value);else{delete realism18().tax.records[e.target.dataset.realTax];save();render()}}});
document.addEventListener('click',e=>{if(e.target.closest('#real-pay'))payNpd18()});
window.Realism18Test={RE18,realism18,expense18,region18,annualTax18,eligibleReceipts18,classifyReceipt18,payNpd18,monthlyBudget18,changeRegion18,togglePrice18};
realism18();refreshHousing18();
