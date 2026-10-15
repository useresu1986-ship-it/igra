'use strict';
/* Предпринимательские сценарии 0.14. Все ставки — игровые допущения, не реальные данные. */
(function(){
 const defs={
 media:{title:'Редакция и выпуск',phases:[
 {q:'Выбери нишу и формат, совместимые с бюджетом начинающего автора.',opts:[['focus','Одна тематика, оригинальный материал',2],['copy','Перезаливать чужие популярные ролики',-2],['scatter','Каждый день менять тему без гипотез',0]]},
 {q:'Видео получает показы, но зрители уходят в начале. Что изменишь?',opts:[['hook','Усилить первые секунды и убрать затянутое вступление',2],['buy','Купить накрученные просмотры',-2],['ignore','Ничего не менять',0]]},
 {q:'Канал ещё не допущен к рекламной монетизации. Как получать выручку?',opts:[['sponsor','Искать прямые интеграции без обещания гарантированного дохода',2],['ads','Считать все просмотры оплачиваемыми',-2],['wait','Пока не монетизировать, развивать аудиторию',1]]}]},
 music:{title:'Музыкальный лейбл',phases:[
 {q:'Трек готов. Что проверишь перед публикацией?',opts:[['rights','Права на семплы и условия лицензирования',2],['ignore','Ничего, все звуки в интернете свободны',-2],['rename','Только название файла',0]]},
 {q:'Каталог растёт, но продаж пока нет. Твои действия?',opts:[['catalog','Сделать демонстрации и адресно искать исполнителей',2],['spam','Рассылать массовый спам',-1],['quit','Удалить каталог',-2]]},
 {q:'Покупатель просит неисключительную лицензию. Как поступить?',opts:[['license','Выдать письменные условия и выставить счёт',2],['exclusive','Пообещать исключительные права всем клиентам',-2],['free','Отдать права без договора',-1]]}]},
 commerce:{title:'Маркетплейс и товарный бизнес',phases:[
 {q:'Начальная партия: 10 штук по 420 ₽. Как снизить риск?',opts:[['small','Проверить спрос малой партией',2],['large','Сразу заказать 200 штук без проверки',-2],['fake','Искусственно накрутить отзывы',-2]]},
 {q:'Цена продажи — 990 ₽. Комиссия площадки 18%, упаковка и логистика 110 ₽ на штуку. Прибыль с проданной штуки до прочих расходов?',opts:[['282','282 ₽ (990 − 420 − 178 − 110)',2],['570','570 ₽ (990 − 420)',-1],['392','392 ₽ (990 − 420 − 178)',0]]},
 {q:'Покупатель возвращает товар. Что делать?',opts:[['reserve','Создать резерв на возвраты и проверить причину',2],['hide','Не учитывать возврат в отчёте',-2],['blame','Обвинить покупателя без проверки',-1]]}]},
 ads:{title:'Арбитраж: тест и аналитика',phases:[
 {q:'На тест 3 000 ₽. Как выбрать кампанию?',opts:[['track','Настроить отслеживание расходов и подтверждённых конверсий',2],['guess','Выбрать креатив по собственному вкусу без измерения',0],['fake','Указать в статистике несуществующие лиды',-2]]},
 {q:'Тест: затраты 3 000 ₽, подтверждённые выплаты 3 450 ₽. ROI без других расходов?',opts:[['15','15%',2],['115','115%',-1],['13','13%',0]]},
 {q:'Первые 3 конверсии прибыльны. Как масштабироваться?',opts:[['gradual','Постепенно увеличить бюджет и проверить качество трафика',2],['all','Вложить все накопления в один день',-2],['stop','Не проверять апрув и возвраты',-1]]}]},
 agency:{title:'Клиенты и агентство',phases:[
 {q:'Новый клиент хочет сайт. Что согласовать?',opts:[['scope','ТЗ, результат, сроки, предоплату и порядок правок',2],['verbal','Начать без договора и критериев приёмки',-2],['free','Пообещать неограниченные бесплатные правки',-1]]},
 {q:'Подрядчик предупреждает о задержке. Твои действия?',opts:[['notify','Перепланировать сроки и предупредить клиента заранее',2],['conceal','Скрыть проблему до дедлайна',-2],['rush','Сдать непроверенную работу',-1]]},
 {q:'Проект сдан и принят. Как учитывать оплату?',opts:[['invoice','Выставить счёт и ожидать поступления',2],['instant','Сразу считать деньги на счёте',-2],['forget','Не отражать выручку и расходы',-1]]}]},
 saas:{title:'Микро-SaaS: подписка и поддержка',phases:[
 {q:'Какую версию сервиса выпустить первой?',opts:[['mvp','Минимальную функцию, решающую частую проблему',2],['huge','Сразу строить 30 модулей',-1],['copy','Скопировать чужие экраны один в один',-2]]},
 {q:'Клиенты отменяют подписки. Что измерять?',opts:[['retention','Причины оттока, удержание и обращения в поддержку',2],['ignore','Только количество регистраций',0],['hide','Скрыть кнопку отмены',-2]]},
 {q:'Сервис получает первый платёж. Что учитывать?',opts:[['ops','Хостинг, поддержку, возвраты и комиссию',2],['revenue','Назвать всю выручку чистой прибылью',-2],['scale','Немедленно нанять большую команду',-1]]}]},
 offline:{title:'Операционное управление',phases:[
 {q:'Поток покупателей по часам неравномерен. Что делать?',opts:[['shifts','Привязать расписание работников к фактическому спросу',2],['always','Держать максимум сотрудников круглосуточно',-1],['none','Не учитывать график покупателей',0]]},
 {q:'Появились списания товаров. Как уменьшить потери?',opts:[['stock','Инвентаризация, сроки хранения и порционные нормы',2],['ignore','Не записывать списания',-2],['random','Поднять все цены без анализа',0]]},
 {q:'Выручка растёт, денег в кассе меньше. Что проверить?',opts:[['cash','Аренду, фонд оплаты труда, закупки и долги',2],['sales','Только валовый оборот',-1],['loans','Взять новый кредит без расчёта',-2]]}]}
 };
 let session=null;
 function state(){let e=ensureEconomy();if(!e.business14)e.business14={history:[],byProject:{},round:0};return e.business14}
 // Общие операции товарного учёта. Доступны и историческим сценариям v14.
 const LIMIT=100,UNIT=420,FEE=.18,SHIP=110;
 const quantity=n=>Math.max(0,Math.floor(Number(n)||0));
 const remaining=s=>Math.max(0,s.count-(s.good||0)-(s.damaged||0));
 function normalizeWarehouse(r){
  r.stock=quantity(r.stock);r.waitingStock=quantity(r.waitingStock);
  if(r.stock>LIMIT){r.waitingStock+=r.stock-LIMIT;r.stock=LIMIT;}
  if(r.warehouseVersion===1)return r;
  if(!Array.isArray(r.sales)){
   r.sales=[];
   const n=quantity(r.refundable),price=Number(r.refundPrice);
   if(n)r.sales.push({id:'legacy',day:null,count:n,price:Number.isSafeInteger(price)&&price>0?price:null,good:0,damaged:0,channel:'legacy',legacy:true});
  }
  if(r.refundable===undefined)r.refundable=r.sales.reduce((n,s)=>n+remaining(s),0);
  r.warehouseVersion=1;return r;
 }
 function warehouseRecord(id){const e=state();if(!e.byProject[id])e.byProject[id]={stock:0,unitsSold:0};return normalizeWarehouse(e.byProject[id]);}
 function reserved(r){return (r.deliveries||[]).filter(d=>d.status==='transit').reduce((n,d)=>n+quantity(d.count),0);}
 function capacity(id){const r=warehouseRecord(id),transit=reserved(r);return {limit:LIMIT,stock:r.stock,transit,waiting:r.waitingStock,free:Math.max(0,LIMIT-r.stock-transit-r.waitingStock)};}
 function flush(r){const n=Math.min(r.waitingStock,Math.max(0,LIMIT-r.stock-reserved(r)));r.stock+=n;r.waitingStock-=n;return n;}
 function receive(id,n){const r=warehouseRecord(id);r.waitingStock+=n;return flush(r);}
 function migrateWarehouses(snapshot=S){
  for(const r of Object.values(snapshot.economy?.business14?.byProject||{})){normalizeWarehouse(r);flush(r);}
 }
 function transact(id,action){
  const r=warehouseRecord(id),before=JSON.stringify(r),cash=S.cash,next=S.nextLedgerId,ledger=S.ledger.slice();
  try{
   const result=action(r);
   if(result.ok)return result;
   restore();return result;
  }catch(error){restore();return {ok:false,error:'Товарная операция отменена: '+error.message};}
  function restore(){S.cash=cash;S.nextLedgerId=next;S.ledger=ledger;for(const key of Object.keys(r))delete r[key];Object.assign(r,JSON.parse(before));}
 }
 function quote(id){const r=warehouseRecord(id),price=Number(r.salePrice)||990,fee=Math.round(price*FEE);return {price,fee,margin:price-UNIT-fee-SHIP};}
 function buyGoods(id,n,source='Закупка товара',note=''){
  if(!Number.isInteger(n)||![5,10,20].includes(n))return {ok:false,error:'Недопустимая партия'};
  if(capacity(id).free<n)return {ok:false,error:'Недостаточно места с учётом поставок и товаров в ожидании'};
  const cost=n*UNIT;if(S.cash<cost)return {ok:false,error:'Не хватает денег на закупку'};
  return transact(id,()=>{book('Закупка партии',-cost,source,note||`${n} шт. × ${UNIT} ₽`,id);receive(id,n);return {ok:true,cost};});
 }
 function sellGoods(id,n,price,source,note,channel='manual'){
  const r=warehouseRecord(id);
  if(!Number.isInteger(n)||n<1||r.stock<n)return {ok:false,error:'Недостаточно товара на складе'};
  if(!Number.isSafeInteger(price)||price<490||price>5000)return {ok:false,error:'Неверная цена продажи'};
  return transact(id,()=>{
   book('Товарная выручка',n*price,source,note,id);const saleId=S.ledger.at(-1).id;
   book('Комиссия площадки',-n*Math.round(price*FEE),source,'18% от цены за штуку (сценарий)',id);
   book('Логистика',-n*SHIP,source,'110 ₽ за штуку (сценарий)',id);
   r.stock-=n;r.unitsSold=(Number(r.unitsSold)||0)+n;
   r.sales.push({id:saleId,day:S.day,count:n,price,good:0,damaged:0,channel});
   r.refundable=quantity(r.refundable)+n;
   flush(r);return {ok:true,saleId,revenue:n*price,margin:n*(price-UNIT-Math.round(price*FEE)-SHIP)};
  });
 }
 function refundGoods(id,n,condition='good',saleId){
  const r=warehouseRecord(id);
  if(!Number.isInteger(n)||n<1||n>5)return {ok:false,error:'За один раз от 1 до 5 возвратов'};
  if(!['good','damaged'].includes(condition))return {ok:false,error:'Неверное состояние'};
  if(quantity(r.refundable)<n)return {ok:false,error:'Нет доступных к возврату продаж'};
  const candidates=r.sales.filter(s=>remaining(s)>0&&(saleId===undefined||saleId===''||String(s.id)===String(saleId)));
  let left=n,amount=0;const plan=[];
  for(const sale of candidates){
   const count=Math.min(left,remaining(sale));if(!count)continue;
   if(!Number.isSafeInteger(sale.price)||sale.price<=0)return {ok:false,error:'В старом сохранении нет цены этой продажи: автоматический возврат невозможен'};
   amount+=count*sale.price;plan.push({sale,count});left-=count;if(!left)break;
  }
  if(left)return {ok:false,error:'Продажа уже возвращена или не найдена'};
  if(S.cash<amount)return {ok:false,error:'Недостаточно денег для возврата'};
  return transact(id,()=>{
   book('Возврат покупателю',-amount,'Товарный бизнес','Возврат: '+plan.map(p=>`продажа #${p.sale.id}, ${p.count} шт. × ${p.sale.price} ₽`).join('; '),id);
   for(const {sale,count} of plan)sale[condition]=(sale[condition]||0)+count;
   r.refundable-=n;r.returned=(Number(r.returned)||0)+n;
   const placed=condition==='good'?receive(id,n):0;
   if(condition==='damaged')r.damaged=quantity(r.damaged)+n;
   return {ok:true,amount,restocked:placed,waiting:condition==='good'?n-placed:0};
  });
 }
 function commerceRound(id,quality,cfg){
  return transact(id,()=>{
   const r=warehouseRecord(id),buy=r.stock<4?10:0;let cost=0;
   if(buy){const purchase=buyGoods(id,buy,cfg.name,'10 × 420 ₽ (сценарий)');if(!purchase.ok)return purchase;cost=purchase.cost;}
   const sold=Math.min(r.stock,Math.max(0,Math.round(quality*6))),price=quote(id).price;
   let earned=0;
   if(sold){
    const sale=sellGoods(id,sold,price,cfg.name,'Продано '+sold+' шт.','business');if(!sale.ok)return sale;
    earned=sale.revenue-sold*Math.round(price*FEE)-sold*SHIP;
    if(quality<.4){const refund=refundGoods(id,1,'good',sale.saleId);if(!refund.ok)return refund;earned-=refund.amount;}
   }
   return {ok:true,cost,earned,summary:`Продано ${sold} шт.; остаток ${r.stock} шт.; выручка ${money(sold*price)} (себестоимость партии оплачена при закупке)`};
  });
 }
 function profile(id){let cfg=PROJECTS.find(x=>x.id===id);if(!cfg)return null;return {cfg,scenario:defs[cfg.type]||defs.agency};}
 function start(id){let p=pr(id),cfg=profile(id);if(!p?.open||!cfg)return {ok:false,error:'Сначала открой проект'};if(S.hours<3||S.energy<15)return {ok:false,error:'Нужно 3 ч и 15 энергии'};session={id,type:cfg.cfg.type,stage:0,score:0,answers:[],spent:0};markPendingAction('business',id);draw();return {ok:true};}
 function draw(){if(!session)return;let cfg=profile(session.id),phase=cfg.scenario.phases[session.stage];let content=`<div class="card"><h3>${cfg.cfg.icon} ${esc(cfg.scenario.title)}</h3><p class="mini">Этап ${session.stage+1}/3 · Репутация решения: ${session.score} · Ставки и вероятности модельные</p><p>${esc(phase.q)}</p><div class="listcards">${phase.opts.map(([v,label])=>`<button class="ghost" style="text-align:left;white-space:normal" data-business14="${esc(v)}">${esc(label)}</button>`).join('')}</div><div class="btnrow"><button class="quiet" data-businesscancel14="1">Отменить задание</button></div></div>`;if(typeof showModal==='function')showModal(content);else document.querySelector('#main').innerHTML=content;}
 function act(choice){if(!session)return {ok:false};let def=profile(session.id).scenario.phases[session.stage],opt=def.opts.find(x=>x[0]===choice);if(!opt)return {ok:false};session.score+=opt[2];session.answers.push(choice);session.stage++;if(session.stage<3){draw();return {ok:true,done:false}}return settle();}
 function settle(){let s=session,p=pr(s.id),cfg=profile(s.id).cfg,quality=clamp((s.score+6)/12,0,1),e=state();if(S.hours<3||S.energy<15){session=null;closeModal();return {ok:false,error:'Недостаточно ресурсов'}}
 let commerce=null;if(s.type==='commerce'){commerce=commerceRound(s.id,quality,cfg);if(!commerce.ok){session=null;closeModal();toast(commerce.error);return commerce;}}
 S.hours-=3;S.energy=Math.max(0,S.energy-15);S.stress=clamp(S.stress+4,0,100);p.posts++;p.audience=Math.max(0,(p.audience||0)+Math.round(quality*65+5));ensureEconomy();p.metrics.content++;p.metrics.followers=p.audience;
 let cost=0,earned=0,invoice=0,summary='';
 if(s.type==='commerce'){
   cost=commerce.cost;earned=commerce.earned;summary=commerce.summary;
 }else if(s.type==='ads'){
   cost=3000;if(S.cash<cost){summary='Недостаточно денег на тест. Кампания не запущена';cost=0;}else{book('Рекламный тест',-cost,cfg.name,'Бюджет 3 000 ₽ (сценарий)',s.id);invoice=Math.round(cost*(.45+quality*.85));econInvoice(s.id,invoice,'CPA: подтверждённые выплаты',3);summary=`Бюджет ${money(cost)}, ожидается ${money(invoice)} через 3 дня; ROI после оплаты зависит от результата`;}
 }else if(s.type==='agency'||s.type==='saas'){
   cost=900;if(S.cash>=cost){book('Исполнение договора',-cost,cfg.name,'Подряд и инфраструктура',s.id);invoice=Math.round(1400+quality*4300);econInvoice(s.id,invoice,cfg.name+' — счёт заказчику',4);summary=`Затраты ${money(cost)}, счёт ${money(invoice)}; оплата ещё не поступила`;}else{cost=0;summary='Недостаточно денег для исполнения договора';}
 }else if(s.type==='media'||s.type==='music'){
   cost=quality>.5?350:100;if(S.cash>=cost){book('Производство контента',-cost,cfg.name,'Монтаж, обложки, сервисы',s.id);}else cost=0;
   // Content is not instantly monetized; probability of real deal is modeled as a constrained opportunity.
   if(quality>=.75&&p.posts>=2){invoice=Math.round((s.type==='music'?900:1200)+p.audience*.08);econInvoice(s.id,invoice,s.type==='music'?'Лицензия: соглашение':'Прямая интеграция: соглашение',5);}
   summary=invoice?`Опубликован качественный материал. Выставлен условный счёт ${money(invoice)}, срок 5 дней`:'Материал опубликован. Продажи и рекламные поступления не гарантированы';
 }else {cost=550;if(S.cash>=cost)book('Операционные закупки',-cost,cfg.name,'Сырьё и расходники',s.id);else cost=0;earned=Math.round(quality*1350);if(earned)book('Выручка клиентов',earned,cfg.name,'Условный оборот смены',s.id);summary=`Смена: условная выручка ${money(earned)}, расходники ${money(cost)}`;}
 let record={day:S.day,project:s.id,type:s.type,quality:Math.round(quality*100),spent:cost,received:earned,invoice,answers:s.answers.slice(),summary};e.history.push(record);if(e.history.length>600)e.history.shift();session=null;closeModal();notice(cfg.name+': '+summary);save();render();toast('Бизнес-решение: качество '+record.quality+'%');return {ok:true,done:true,...record};}
 function cancel(){if(!session)return;session=null;closeModal()}
 const previousClose=closeModal;closeModal=function(){session=null;return previousClose()};
 function screen(){let active=PROJECTS.filter(x=>pr(x.id)?.open),e=state();return header('Бизнес-практикум','Реальные процессы в игровых сценариях: решения, время, расходы, счета и последствия')+`<div class="notice">Экономические ставки и вероятности в мини-играх — учебные игровые допущения. Расходы фиксируются в едином журнале; выставленный счёт не равен полученным деньгам.</div><div class="listcards">${active.map(cfg=>{let b=e.byProject[cfg.id];let type=profile(cfg.id).scenario;return `<div class="card job"><div class="row-between"><strong>${cfg.icon} ${esc(cfg.name)}</strong><span class="tag">${esc(type.title)}</span></div><div class="mini">${cfg.type==='commerce'?'Остаток товара: '+(b?.stock||0)+' шт. · ':''}Опыт: ${pr(cfg.id).posts||0} действий</div><div class="btnrow"><button class="primary" data-businessstart14="${cfg.id}" ${S.hours<3||S.energy<15?'disabled':''}>Управлять проектом · 3 ч</button><button class="ghost" data-strategyfinance="${cfg.id}">Финансы</button></div></div>`}).join('')||'<div class="card">Сначала запусти хотя бы один проект на рынке идей.</div>'}</div><div class="card"><h2>Журнал предпринимательских решений</h2><div class="audit-scroll"><table class="audit-table"><thead><tr><th>День</th><th>Проект</th><th>Качество</th><th>Расходы</th><th>Получено</th><th>К оплате</th></tr></thead><tbody>${e.history.slice(-30).reverse().map(x=>`<tr><td>${x.day}</td><td>${esc(PROJECTS.find(p=>p.id===x.project)?.name||x.project)}</td><td>${x.quality}%</td><td>${money(x.spent)}</td><td>${money(x.received)}</td><td>${money(x.invoice)}</td></tr>`).join('')||'<tr><td colspan="6">История пока пуста</td></tr>'}</tbody></table></div></div>`}
 const oldRender=render;render=function(){if(tab==='business14'){document.querySelector('#cash').textContent=money(S.cash);document.querySelector('#day').textContent=S.day;document.querySelector('#net').textContent=money(net());document.querySelector('#energy').textContent=S.energy+'%';document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));document.querySelector('#main').innerHTML=screen();return;}oldRender()};
 const nav=document.querySelector('#nav');if(nav)nav.insertAdjacentHTML('beforeend','<button data-tab="business14">🏢 <span>Бизнес-практикум</span></button>');
 document.addEventListener('click',event=>{let b=event.target.closest('button');if(!b)return;if(b.dataset.businessstart14)start(b.dataset.businessstart14);else if(b.dataset.business14)act(b.dataset.business14);else if(b.dataset.businesscancel14)cancel()});
 window.BusinessV14={defs,state,start,act,cancel,screen,getSession:()=>session,settle,warehouse:{record:warehouseRecord,capacity,quote,buy:buyGoods,sell:sellGoods,refund:refundGoods,receive,transact,migrateAll:migrateWarehouses,remaining}};
 migrateWarehouses();
})();
