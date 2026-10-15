'use strict';
/* v0.5: scenario-based accounting, partner contracts and game economy; NOT measured market rates. */
const XP={version:5,agencyFee:.20,royaltyPaymentDelay:12,monthlyLiving:{budget:12000,normal:19500,comfort:34000},samplePrices:{usedPhone:8500,repair:2700},reference:[{title:'YouTube: политика монетизации, ограничения РФ',url:'https://support.google.com/youtube/answer/1311392?hl=ru'},{title:'YouTube: партнёрские сети MCN',url:'https://support.google.com/youtube/answer/2737059?hl=en'},{title:'YouTube: статус каналов в MCN',url:'https://support.google.com/youtube/answer/6335810?hl=en'},{title:'ФНС: налог на профессиональный доход',url:'https://npd.nalog.ru/'}]};
function ext(){let E=ensureEconomy();if(!E.expansion)E.expansion={living:'normal',contracts:{},channels:{},costBreakdown:{},deals:[],statistics:{},settings:{foreignEligibility:'only_verified'},credit:{principal:0,rate:.0006},log:[]};return E.expansion;}
function isYouTube(id){return ['p2','p3','p4','p5','p6','p8'].includes(id)}
function isRussianYT(id){return ['p2','p4','p6','p8'].includes(id)}
function contractFor(id){return ext().contracts[id]||{status:'none',commission:0,eligible:false};}
function getChannel(id){let X=ext();if(!X.channels[id])X.channels[id]={clicks:0,impressions:0,views:0,adGross:0,fees:0,adNet:0,organicIncome:0,uploads:0,checks:0};return X.channels[id];}
function canEnableAds(id){const c=contractFor(id);return isYouTube(id)&&c.status==='approved'&&c.eligible===true&&pr(id)?.open;}
function agencyApply(id){let p=pr(id);if(!isYouTube(id)||!p?.open)return toast('Сначала откройте YouTube-проект');let X=ext(),old=contractFor(id);if(old.status==='approved')return toast('Договор уже подключён');if(old.status==='review')return toast('Заявка рассматривается');X.contracts[id]={status:'review',commission:XP.agencyFee,eligible:false,appliedDay:S.day,reviewDay:S.day+3,reason:'Проверка участия в YPP, документов, прав и условий обслуживания'};notice('Заявка на договор MCN отправлена: комиссия 20%; решение не гарантировано');save();render()}
function agencyDecision(id,approved){let c=contractFor(id);if(c.status!=='review')return false;c.status=approved?'approved':'rejected';c.eligible=!!approved;c.reason=approved?'Договор и право на рекламную монетизацию подтверждены (игровой сценарий)':'Подключение не одобрено: ограничения или несоответствие условиям';c.reviewedDay=S.day;return true;}
function processApplications(){for(let [id,c] of Object.entries(ext().contracts)){if(c.status!=='review'||S.day<c.reviewDay)continue;let p=pr(id);let baseEligible=p&&p.posts>=8&&p.audience>=1000;
 // Official Russian YPP limitations: an MCN does not simply bypass them.
 let allowed=baseEligible&&!isRussianYT(id);
 agencyDecision(id,allowed);notice('MCN — '+PROJECTS.find(x=>x.id===id)?.name+': '+(allowed?'подключение одобрено':'отказ / условия не выполнены'));
}}
function logAdvance(id,impressions,views,paid,fee){let ch=getChannel(id);ch.impressions+=impressions;ch.views+=views;ch.clicks+=Math.round(impressions*.035);ch.adGross+=paid;ch.fees+=fee;ch.adNet+=paid-fee;}
function monetizeChannel(id,views){if(!isYouTube(id)||views<=0)return 0;let p=pr(id),ch=getChannel(id);let impressions=Math.round(views*12);let gross=0,fee=0;
 if(canEnableAds(id)&&p.posts>=8&&p.audience>=1000){
  let rpm=isRussianYT(id)?rnd(5,20):rnd(18,75); // GAME ASSUMPTION, RUB/1000 views, NOT a verified RPM
  gross=Math.round(views/1000*rpm);fee=Math.round(gross*XP.agencyFee);
  if(gross>0){econInvoice(id,gross-fee,'YouTube / MCN (после комиссии 20%)',XP.royaltyPaymentDelay);ext().log.push({day:S.day,project:id,kind:'agent-fee',amount:fee,gross});}
 }
 logAdvance(id,impressions,views,gross,fee);return gross-fee;
}
// Separate visibility from invoice collection; no guaranteed platform earnings.
const oldProjectDay=runProjectDay;
runProjectDay=function(id,p){let before=p.metrics?.views||0;oldProjectDay(id,p);let delta=(p.metrics?.views||0)-before;if(isYouTube(id))monetizeChannel(id,delta)};
const oldDay=advanceDay;
advanceDay=function(){let X=ext();let prev=ECON.assumptions.rentFoodDay;
 oldDay();processApplications();
 // old engine charges 450/day. Adjustment is tracked transparently as a separate entry.
 const level=XP.monthlyLiving[X.living]||XP.monthlyLiving.normal;
 const daily=Math.round(level/30);let adjustment=daily-450;
 if(adjustment!==0)econPost('Личная жизнь',-adjustment,'Уровень жизни','Корректировка ежедневной корзины до '+money(daily));
 if(S.cash<0){S.debt+=-S.cash;S.cash=0;notice('Дефицит денег после расходов — задолженность');}
 X.statistics.days=(X.statistics.days||0)+1;
};
function setLifestyle(k){if(!XP.monthlyLiving[k])return;ext().living=k;notice('Уровень расходов изменён: '+k);save();render()}
function agencyBlock(){let P=PROJECTS.filter(p=>isYouTube(p.id)&&pr(p.id)?.open);return `<div class="card"><h2>Агентские договоры YouTube</h2><p class="mini">Комиссия 20% — сценарное условие, предложенное игроком, не универсальный рыночный тариф. Агентство не отменяет требования YPP и географические ограничения. Для российских аккаунтов автоматического одобрения нет.</p>${P.map(p=>{let c=contractFor(p.id),ch=getChannel(p.id);return `<div class="card job"><b>${p.icon} ${esc(p.name)}</b><p class="mini">Договор: ${esc(c.status)} · начислено до комиссии: ${money(ch.adGross)} · комиссия: ${money(ch.fees)} · после комиссии: ${money(ch.adNet)}</p><p class="mini">Просмотры (по модели): ${ch.views.toLocaleString('ru-RU')} · выплаты могут задерживаться</p>${c.status==='none'||c.status==='rejected'?`<button class="ghost" data-agency="${p.id}">Подать заявку MCN (20%)</button>`:''}<p class="mini">${esc(c.reason||'Заявка не подавалась')}</p></div>`}).join('')||'<p class="mini">Откройте YouTube-проект, чтобы увидеть договоры.</p>'}</div>`}
function dailyLedger(){const last=S.ledger.slice(-140).reverse();return `<div class="card"><h2>Последние операции</h2><div class="ledger-scroll"><table class="audit-table"><tr><th>День</th><th>Статья</th><th>Сумма</th></tr>${last.map(x=>`<tr><td>${x.day}</td><td>${esc(x.source)}<div class="mini">${esc(x.category)}</div></td><td class="${x.amount<0?'neg':'pos'}">${money(x.amount)}</td></tr>`).join('')}</table></div></div>`}
function advancedFinance(){let X=ext();let r=incomeStatement(period,selectedFinance);let receivables=ensureEconomy().receivables.filter(x=>selectedFinance==='all'||x.project===selectedFinance);let overdue=receivables.filter(x=>x.due<S.day).reduce((s,x)=>s+x.gross,0);return `<div class="grid four">${[['Кассовый итог',r.netCash],['Счета к получению',receivables.reduce((s,x)=>s+x.gross,0)],['Просрочено',overdue],['Долг',S.debt]].map(([a,n])=>`<div class="card"><div class="mini">${a}</div><div class="statnum">${money(n)}</div></div>`).join('')}</div>${agencyBlock()}<div class="card"><h2>Финансовые настройки персонажа</h2><p class="mini">Группы затрат — условные параметры в рублях за 30 игровых дней. Они не являются проверенными ценами аренды или продуктовой корзины.</p><div class="btnrow">${Object.entries(XP.monthlyLiving).map(([k,n])=>`<button class="${X.living===k?'primary':'ghost'}" data-lifestyle="${k}">${{budget:'Экономно',normal:'Обычно',comfort:'Комфортно'}[k]} · ${money(n)}</button>`).join('')}</div><p class="mini">Выбрано: ${money(XP.monthlyLiving[X.living])} за 30 дней · приблизительно ${money(Math.round(XP.monthlyLiving[X.living]/30))} в день</p></div>${dailyLedger()}<div class="card"><h2>Источники правил</h2>${XP.reference.map(z=>`<p><a href="${z.url}" target="_blank" rel="noopener noreferrer">${esc(z.title)}</a></p>`).join('')}<p class="mini">Все игровые ставки и цены пока калибровочные. Применимость MCN к конкретному российскому каналу требует индивидуального подтверждения.</p></div>`}
const oldEconomics=economics;
economics=function(){return oldEconomics()+advancedFinance()};
// Agency actions use document delegation without modifying the older dispatcher.
document.addEventListener('click',e=>{let b=e.target.closest('button');if(!b)return;if(b.dataset.agency){agencyApply(b.dataset.agency)}if(b.dataset.lifestyle){setLifestyle(b.dataset.lifestyle)}});
window.ExpansionTest={ext,contractFor,agencyApply,agencyDecision,canEnableAds,monetizeChannel,getChannel,setLifestyle,XP};
ext();render();
