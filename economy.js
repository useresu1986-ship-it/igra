'use strict';
/* Version 0.4 layer. All monetary coefficients below are explicitly SIMULATED, not population estimates. */
const ECON={version:4, assumptions:{rentFoodDay:450, weeklyShock:0.19, paymentDelayDays:[1,3,7], incomeYearLimitNPD:2400000}};
function ensureEconomy(){if(!S.economy)S.economy={receivables:[],stats:{},losses:0,history:[],settings:{strategy:'balanced'},seq:1};for(const [id,p] of Object.entries(S.projects)){if(!p.metrics)p.metrics={views:0,orders:0,paidOrders:0,followers:p.audience||0,returns:0,content:0};}return S.economy;}
ensureEconomy();
function econPost(cat,amount,source,note,project){book(cat,amount,source,note,project)}
function econInvoice(id,amount,label,days){let E=ensureEconomy();let inv={id:E.seq++,project:id,gross:Math.max(0,Math.round(amount)),created:S.day,due:S.day+days,label};E.receivables.push(inv);notice('Выставлен счёт: '+label+' · '+money(inv.gross)+' · оплата день '+inv.due);return inv;}
function collectInvoices(){const E=ensureEconomy();let unpaid=[];for(const inv of E.receivables){if(inv.due>S.day){unpaid.push(inv);continue}let risk= PROJECTS.find(x=>x.id===inv.project)?.type==='agency'?.06:.025;if(Math.random()<risk){E.losses+=inv.gross;notice('Клиент не оплатил счёт '+money(inv.gross)+'; списан как риск неплатежа');continue;}econPost('Оплата клиентов',inv.gross,inv.label,'Погашена дебиторская задолженность #'+inv.id,inv.project);let p=pr(inv.project);if(p?.metrics)p.metrics.paidOrders++;}E.receivables=unpaid;}
function projectType(id){return PROJECTS.find(p=>p.id===id)?.type||'unknown'}
function runProjectDay(id,p){const cfg=PROJECTS.find(x=>x.id===id),m=p.metrics; if(!cfg)return;const quality=Math.min(1.8,.50+p.posts*.035),staffEffect=1+Math.min(4,p.staff)*.22;const decay=(cfg.type==='media'||cfg.type==='music')?.997:.986;
 p.audience=Math.max(0,Math.round(p.audience*decay));m.followers=p.audience;
 if(cfg.type==='media'||cfg.type==='music'){
   let views=Math.round((p.posts*13+ p.audience*.14)*rnd(.35,1.65)*quality*staffEffect);
   if(p.posts===0)views=0; m.views+=views;
   // Russian YouTube projects never earn automatic YouTube ad revenue in this simplified model.
   const restricted=[2,4,6,8].includes(+id.slice(1));
   if(cfg.type==='music'){
     let chance=Math.min(.24,p.posts*.007 + p.audience*.00002);
     if(Math.random()<chance){let license=(id==='p1'?2200:1100)*rnd(.7,1.5);m.orders++;econInvoice(id,license,'Лицензия на бит',Math.floor(rnd(1,5)));}
   }else if(views>0&&p.posts>=4){
     let direct=Math.random()<Math.min(.13,views/150000);
     if(direct){m.orders++;econInvoice(id,Math.round(1200+views*.09),'Нативная интеграция',3);}
     // Foreign or non-YouTube projects: conditional ad income scenario, not guaranteed RPM.
     let eligible= !['p2','p3','p4','p5','p6','p8'].includes(id) && p.audience>=1000 && p.posts>=8; // YouTube only monetized by optional contract layer
     if(eligible){let rate= id==='p3'||id==='p5'?rnd(25,80):rnd(9,38);let ad= Math.round(views/1000*rate);if(ad>0)econPost('Платформа (модель)',ad,cfg.name,'Условный доход: монетизация не гарантируется',id);}
   }
 }else if(cfg.type==='agency'||cfg.type==='saas'){
   let opportunity=quality*staffEffect*(p.audience/800+p.posts*.09);
   if(Math.random()<Math.min(.5,opportunity*.09)){m.orders++;econInvoice(id,Math.round(cfg.potential*rnd(3.1,6.5)),cfg.name+' — заказ',Math.ceil(rnd(2,9)));}
 }else if(cfg.type==='commerce'){
   // One shared inventory: manual orders and simulated daily orders debit the same stock.
   const store=window.BusinessV14?.state?.()?.byProject;
   const inv=store?.[id];
   const available=Math.max(0,Math.floor(Number(inv?.stock)||0));
   if(available){
     const price=Math.max(490,Math.min(5000,Number(inv.salePrice)||990));
     const base=Math.max(0,Math.floor((p.posts*.23+p.audience/180)*rnd(.55,1.2)*staffEffect));
     const priceFactor=Math.max(.15,Math.min(1.6,990/price));
     const sold=Math.min(available,Math.floor(base*priceFactor));
     if(sold){
       const fee=sold*Math.round(price*.18),ship=sold*110;
       econPost('Товарная выручка',sold*price,cfg.name,'Сценарный спрос: '+sold+' шт.',id);
       econPost('Комиссия площадки',-fee,cfg.name,'18% от цены за штуку (сценарий)',id);
       econPost('Логистика',-ship,cfg.name,'110 ₽ за штуку (сценарий)',id);
       inv.stock-=sold;inv.unitsSold=(Number(inv.unitsSold)||0)+sold;m.orders+=sold;
     }
   }
 }else if(cfg.type==='offline'){
   let demand=Math.max(0,Math.round((p.posts*.18+p.audience/80)*rnd(.3,1.3)*staffEffect));m.orders+=demand;
   if(demand>0){let gross=Math.round(demand*cfg.potential*rnd(.5,1.2));let cost=Math.round(gross*(.54));econPost('Продажи',gross,cfg.name,'Валовая выручка',id);econPost('Себестоимость',-cost,cfg.name,'Закупка товара / ингредиенты / логистика (модель)',id);let returns=Math.random()<.08?Math.round(gross*.13):0;if(returns){m.returns++;econPost('Возврат',-returns,cfg.name,'Возврат покупателю',id);}}
 }else if(cfg.type==='ads'){
   // No automatic arbitrage profit: test budget and uncertain conversion outcomes.
   if(p.posts>0){let spend=Math.round(cfg.upkeep*.8);econPost('Покупка трафика',-spend,cfg.name,'Показ рекламы и клики (модель)',id);let payout=Math.round(spend*rnd(.48,1.35));if(payout>0)econInvoice(id,payout,'CPA-партнёрская программа',Math.ceil(rnd(2,8)));}
 }
}
// Replaces the old universal passive-income loop with activity-dependent sector logic.
advanceDay=function(){ensureEconomy();S.day++;S.hours=12;S.energy=clamp(S.energy+52,0,100);S.stress=clamp(S.stress-16,0,100);
 econPost('Личная жизнь',-450,'Ежедневные расходы','Условная корзина расходов: питание, жильё, связь');
 collectInvoices();
 for(const [id,p] of Object.entries(S.projects)){if(!p.open)continue;const cfg=PROJECTS.find(x=>x.id===id);if(!cfg)continue;econPost('Операционные расходы',-cfg.upkeep,cfg.name,'Постоянные расходы предприятия',id);if(p.staff)econPost('Зарплата персонала',-p.staff*650,cfg.name,'Ежедневные выплаты персоналу (модель)',id);runProjectDay(id,p);}
 if(S.day%7===0&&Math.random()<ECON.assumptions.weeklyShock){let shock=Math.round(rnd(400,2400));econPost('Непредвиденный расход',-shock,'Быт','Случайная ситуация; модельный риск');notice('Непредвиденный расход: '+money(shock));}
 if(S.cash<0){S.debt+=-S.cash;S.cash=0;notice('Недостаток денег для расходов — возникла задолженность');}
 if(S.debt){const interest=Math.max(1,Math.round(S.debt*.0006));S.debt+=interest;notice('Начислены модельные проценты по долгу: '+money(interest));}
 ensureEconomy().history.push({day:S.day,cash:S.cash,net:net(),receivable:outstanding()});
};
const previousProduce=produce;
produce=function(id){const p=pr(id);if(!p?.open)return;const before=p.posts;previousProduce(id);if(p.posts>before){ensureEconomy();p.metrics.content++;p.metrics.followers=p.audience;}}
function outstanding(){return ensureEconomy().receivables.reduce((n,x)=>n+x.gross,0)}
function classify(x){if(x.amount>0)return 'income';if(['Приобретение активов','Инвестиции','Найм и настройка'].includes(x.category))return 'capital';if(x.category==='Личная жизнь'||x.category==='Непредвиденный расход')return 'living';return 'operating'}
function incomeStatement(days=30,project='all'){const rows=S.ledger.filter(x=>S.day-x.day<days&&(project==='all'||x.project===project));let income=0,operating=0,living=0,capital=0;for(const x of rows){if(x.amount>0)income+=x.amount;else if(classify(x)==='capital')capital-=x.amount;else if(classify(x)==='living')living-=x.amount;else operating-=x.amount;}let invoices=ensureEconomy().receivables.filter(x=>S.day-x.created<days&&(project==='all'||x.project===project));return {income,operating,living,capital,operatingResult:income-operating,personalResult:income-operating-living,netCash:income-operating-living-capital,receivable:invoices.reduce((a,x)=>a+x.gross,0)}}
function economics(){const E=ensureEconomy(),v=incomeStatement(period,selectedFinance),all=incomeStatement(999999,selectedFinance);let active=PROJECTS.filter(x=>pr(x.id)?.open);return header('Экономический аудит','Прибыль, расходы на жизнь, инвестиции и неоплаченные счета — отдельно')+`<div class="toolbar"><select id="period"><option value="7" ${period===7?'selected':''}>7 дней</option><option value="30" ${period===30?'selected':''}>30 дней</option><option value="90" ${period===90?'selected':''}>90 дней</option><option value="99999" ${period===99999?'selected':''}>Вся история</option></select><select id="finproject"><option value="all" ${selectedFinance==='all'?'selected':''}>Вся экономика</option>${active.map(x=>`<option value="${x.id}" ${selectedFinance===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div><div class="grid four">${[['Получено денег',v.income],['Операционные расходы',-v.operating],['Личные расходы',-v.living],['Денежный результат',v.netCash]].map(([t,n])=>`<div class="card"><div class="mini">${t}</div><div class="statnum ${n<0?'neg':'pos'}">${money(n)}</div></div>`).join('')}</div><div class="grid"><div class="card"><h2>Разбор денежных потоков</h2><table class="audit-table"><tr><td>Поступления</td><td>${money(v.income)}</td></tr><tr><td>Операционные затраты</td><td>${money(v.operating)}</td></tr><tr><td>Операционный денежный результат</td><td>${money(v.operatingResult)}</td></tr><tr><td>Личные расходы</td><td>${money(v.living)}</td></tr><tr><td>Инвестиции и закупки оборудования</td><td>${money(v.capital)}</td></tr><tr><th>Изменение денежных средств</th><th>${money(v.netCash)}</th></tr><tr><td>Неоплаченные счета (всего)</td><td>${money(outstanding())}</td></tr><tr><td>Списанные неоплаты (за всё время)</td><td>${money(E.losses)}</td></tr></table></div><div class="card"><h2>Баланс игрока</h2><table class="audit-table"><tr><td>Деньги</td><td>${money(S.cash)}</td></tr><tr><td>Оценка имущества и предприятий</td><td>${money(assetValue())}</td></tr><tr><td>Дебиторская задолженность</td><td>${money(outstanding())}</td></tr><tr><td>Долги</td><td>${money(S.debt)}</td></tr><tr><th>Расширенный капитал</th><th>${money(net()+outstanding())}</th></tr></table><p class="mini">Оценки перепродажи условные. Учёт вложений и поступлений кассовый; это не полноценная бухгалтерская отчётность по стандартам РСБУ.</p></div></div><div class="card"><h2>Экономика каждого проекта</h2><div class="listcards">${active.map(x=>{let p=pr(x.id),f=incomeStatement(99999,x.id),m=p.metrics||{};return `<div class="card job"><b>${x.icon} ${esc(x.name)}</b><div class="mini">Публикаций: ${p.posts} · Аудитория: ${(p.audience||0).toLocaleString('ru-RU')}</div><div class="mini">Просмотры: ${(m.views||0).toLocaleString('ru-RU')} · Заказы: ${m.orders||0} · Возвраты: ${m.returns||0}</div><div class="mini">Поступления: ${money(f.income)} · Оплаченные затраты: ${money(f.operating+f.capital)}</div><div class="mini">Результат денежных операций: ${money(f.netCash)}</div></div>`}).join('')||'<p class="muted">Пока нет запущенных проектов.</p>'}</div></div><div class="card"><h2>Методология и ограничения</h2><p>Ставки оплаты, спрос, вероятность продаж, цены и расходы — <b>модельные допущения</b>, а не проверенные рыночные медианы. Дебиторская задолженность здесь служит игровым показателем и пока не включена в стандартный капитал на верхней панели. Реальный налоговый учёт и расчёт себестоимости по партиям ещё не реализованы.</p><p>Источники правил: <a href="https://npd.nalog.ru/" target="_blank" rel="noopener">ФНС — НПД</a>, <a href="https://yandex.ru/dev/games/doc/ru/sdk/sdk-adv" target="_blank" rel="noopener">Яндекс Игры — реклама</a>. Эти документы подтверждают правила, <b>но не игровую доходность</b>.</p></div>`;}
const previousRender=render;
render=function(){ensureEconomy();if(tab==='econ'){document.querySelector('#cash').textContent=money(S.cash);document.querySelector('#day').textContent=S.day;document.querySelector('#net').textContent=money(net()+outstanding());document.querySelector('#energy').textContent=S.energy+'%';document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));document.querySelector('#main').innerHTML=economics();}else previousRender();};
const sidebar=document.querySelector('#nav');if(sidebar){let b=document.createElement('button');b.dataset.tab='econ';b.innerHTML='▤ <span>Экономический аудит</span>';let guideBtn=sidebar.querySelector('[data-tab="guide"]');sidebar.insertBefore(b,guideBtn);}
window.GameTest={...window.GameTest,ensureEconomy,econInvoice,collectInvoices,incomeStatement,outstanding,runProjectDay};
