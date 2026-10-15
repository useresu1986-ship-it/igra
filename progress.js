'use strict';
/* Первый цикл — представление существующих действий. Цели не начисляют награды. */
(function(){
 const jobId='w0',projectId='p11';
 let lastResult=null,resultState=null,resultTab=null;
 const bonus=m=>((m-1)*100).toFixed(1).replace('.',',')+'%';
 const canWork=()=>{const j=WORK.find(x=>x.id===jobId);return S.hours>=j.hours&&S.energy>=15;};
 function model(){
  const course=trainingQuote(jobId),project=PROJECTS.find(x=>x.id===projectId);
  const courseDone=(S.economy?.systems?.training?.[jobId]||0)>0||course.afterMultiplier<=course.beforeMultiplier;
  let choice=S.progression?.selectedGoal;
  if(!['auto','course','project','free'].includes(choice)||choice==='course'&&courseDone)choice='auto';
  const id=choice==='auto'?(courseDone?'project':'course'):choice;
  const sessions=S.economy?.expansion?.labour19?.sessions||[];
  const source=WORK.find(j=>j.id===sessions.at(-1)?.job)?.name||'Подработки';
  const done=id==='project'&&!!S.projects[projectId]?.open;
  const cost=id==='course'?course.cost:id==='project'?project.startup:0;
  const current=done?cost:Math.min(cost,Math.max(0,S.cash));
  const remaining=Math.max(0,cost-current);
  let action='work',button='Выполнить доставку';
  if(id==='free'){action='workList';button='Выбрать работу';}
  else if(done){action='projects';button='Перейти к моим проектам';}
  else if(id==='course'&&course.available){action='course';button='Купить курс · '+money(course.cost);}
  else if(id==='project'&&!remaining){action='market';button='Посмотреть проект';}
  else if(id==='course'&&!remaining||!canWork()){action='rest';button='Выспаться и продолжить';}
  return {id,choice,course,project,courseDone,source,done,cost,current,remaining,percent:cost?Math.round(current/cost*100):0,action,button,
   title:id==='course'?'Курс курьера':id==='project'?(done?'Твой проект: ':Object.values(S.projects).some(p=>p.open)?'Следующий проект: ':'Первый проект: ')+project.name:'Свободный путь',
   purpose:id==='course'?'Вложи первый заработок в навык: '+course.current+' → '+course.next+'. При одинаковом качестве работы бонус к базовой оплате вырастет с '+bonus(course.beforeMultiplier)+' до '+bonus(course.afterMultiplier)+'.':id==='project'?(done?'У тебя уже есть этот проект. Выпуск материалов и управление доступны в «Моих проектах».':'Создай свой блог и начни выпускать материалы. Содержание — '+money(project.upkeep)+' за игровой день. Поступления зависят от развития проекта.'):'Работай, учись или развивай бизнес в своём порядке. Рекомендуемые цели можно включить в любой момент.'};
 }
 function panel(){
  const m=model(),daily=typeof houseExpenses==='function'?Object.values(houseExpenses()).reduce((a,b)=>a+b,0):0;
  return `<section class="progress-panel" data-progress-goal="${m.id}" aria-labelledby="progress-title">
   <div class="progress-intro"><span class="progress-eyebrow">ТВОЙ СЛЕДУЮЩИЙ ШАГ</span><h2 id="progress-title">${esc(m.title)}</h2><p>${esc(m.purpose)}</p>
   <div class="progress-context"><span>На счету <b data-progress-cash>${money(S.cash)}</b></span><span>Источник: ${esc(m.source)}</span></div></div>
   <div class="progress-controls">${m.id!=='free'?`<div class="progress-amount"><strong data-progress-amount>${money(m.current)} <small>из ${money(m.cost)}</small></strong><span data-progress-remaining>${m.done?'Цель достигнута':m.remaining?'Осталось '+money(m.remaining):'Сумма накоплена'}</span></div><progress aria-label="Прогресс выбранной цели" value="${m.current}" max="${m.cost}"></progress>`:''}
   <button class="primary" data-progress-action="${m.action}">${esc(m.button)}</button>
   <div class="progress-details">${m.id==='course'?`Курс: ${m.course.hours} ч и ${m.course.energy} энергии. `:''}Быт при завершении дня: ${money(daily)}. ${m.action==='rest'?'Сон завершает игровой день и списывает обычные расходы.':''}</div>
   <label class="progress-choice">Моя цель <select id="progress-goal-choice">${[['auto','Рекомендовать следующий шаг'],['course','Первый курс курьера'],['project','Первый блог'],['free','Свободная игра']].map(([v,t])=>`<option value="${v}" ${m.choice===v?'selected':''}>${t}</option>`).join('')}</select></label></div>
  </section>`;
 }
 function resultCard(){
  if(!lastResult||resultState!==S||tab!==resultTab&&tab!=='home')return '';
  const r=lastResult,m=model();
  return `<section class="progress-result ${r.kind==='work'?'earned':'improved'}" data-progress-result="${r.kind}" role="status" aria-live="polite">
   <div><span class="progress-eyebrow">${r.kind==='work'?'РЕЗУЛЬТАТ РАБОТЫ':'ПОКУПКА ЗАВЕРШЕНА'}</span><h2>${esc(r.title)}</h2>
   <p class="progress-balance" data-result-balance>Баланс: ${money(r.beforeCash)} → <strong>${money(r.afterCash)}</strong></p></div>
   <div class="progress-breakdown">${r.kind==='work'?`<span>Получено <b data-result-gross>${money(r.gross)}</b></span><span>Издержки <b data-result-cost>${money(r.cost)}</b></span><span>В кассу <b data-result-net>${money(r.net)}</b></span>`:`<span>Оплачено <b data-result-cost>${money(r.cost)}</b></span>`}</div>
   ${r.kind==='course'?`<p data-result-skill>Навык: ${r.oldSkill} → ${r.newSkill}. Бонус к базовой оплате при том же качестве: ${bonus(r.oldFactor)} → ${bonus(r.newFactor)}.</p>`:''}
   ${r.kind==='asset'?`<p>Предмет добавлен к имуществу. Его оценка учитывается в капитале.</p>`:''}
   ${r.pending?`<p>По договору начислено ${money(r.pending)}, оплата ещё ожидается. Это не деньги в кассе.</p>`:''}
   <p class="progress-next" data-result-next>${m.id==='free'?'Продолжай выбранный путь.':m.done?'Цель достигнута: '+esc(m.title):'Следующая цель: '+esc(m.title)+(m.remaining?' · осталось '+money(m.remaining):' · сумма накоплена')}</p>
   ${r.kind==='work'?'<small>Показано после прямых издержек смены. Быт и ручная уплата налогов учитываются отдельно.</small>':''}
   ${tab!=='home'&&m.id==='course'&&m.course.available?`<button class="primary" data-progress-action="course">Купить курс · ${money(m.course.cost)}</button>`:''}
  </section>`;
 }
 function observe(operation,kind){
  return function(...args){
   const before=S.cash,firstId=S.nextLedgerId,oldSkill=S.skills[jobId]||0,oldFactor=workSkillMultiplier(jobId);
   const result=operation.apply(this,args);
   const rows=actualFinancialRows().filter(x=>x.id>=firstId);
   if(!rows.length)return result;
   const gross=rows.filter(x=>x.amount>0).reduce((n,x)=>n+x.amount,0),cost=-rows.filter(x=>x.amount<0).reduce((n,x)=>n+x.amount,0);
   const pending=(S.economy?.contracts11?.history||[]).filter(r=>r.wageId>=firstId).reduce((n,r)=>n+r.gross,0);
   const work=rows.find(x=>x.category==='Оплата труда');
   const title=kind==='course'?'Курс «'+(WORK.find(j=>j.id===args[0])?.name||'')+'» пройден':kind==='asset'?'Куплено: '+ASSETS[args[0]][0]:pending?'Работа сдана, оплата ожидается':(S.workCount===1?'Первая смена завершена':'Смена завершена')+(work?' · '+work.source:'');
   lastResult={kind,title,beforeCash:before,afterCash:S.cash,gross,cost,net:S.cash-before,pending,oldSkill,newSkill:S.skills[jobId]||0,oldFactor,newFactor:workSkillMultiplier(jobId)};
   // Для курса другой профессии показываем именно её реальный результат.
   if(kind==='course'&&args[0]!==jobId){const q=trainingQuote(args[0]);lastResult.newSkill=q.current;lastResult.oldSkill=q.current-q.gain;lastResult.oldFactor=workSkillMultiplier(args[0],{skills:{[args[0]]:lastResult.oldSkill}});lastResult.newFactor=q.beforeMultiplier;}
   resultState=S;resultTab=tab;render();
   if(kind==='course'){clearTimeout(window.__toast);document.querySelector('#toast').classList.remove('visible');}
   const el=document.querySelector('#cash');
   if(el?.animate&&!(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches))el.animate([{color:S.cash>=before?'#5ce2ad':'#ffb66c',transform:'scale(1.08)'},{color:'inherit',transform:'scale(1)'}],{duration:450});
   return result;
  };
 }
 workResult=observe(workResult,'work');study=observe(study,'course');buyAsset=observe(buyAsset,'asset');
 const draw=render;
 render=function(){
  const result=draw();if(saveRecovery)return result;
  const heading=document.querySelector('#main .headrow');
  heading?.insertAdjacentHTML('afterend',resultCard()+(tab==='home'?panel():''));
  return result;
 };
 function selectGoal(value){
  if(!['auto','course','project','free'].includes(value))return false;
  S.progression={...(S.progression&&typeof S.progression==='object'?S.progression:{}),selectedGoal:value};save();render();return true;
 }
 document.addEventListener('change',e=>{if(e.target.id==='progress-goal-choice')selectGoal(e.target.value);});
 document.addEventListener('click',e=>{
  const b=e.target.closest('button[data-progress-action]');if(!b||saveRecovery)return;
  const m=model(),action=b.dataset.progressAction;
  if(action==='course'){if(m.id==='course'&&!m.courseDone&&m.course.available)study(jobId);}
  else if(action==='work'){if(canWork())startWork(jobId);}
  else if(action==='rest')rest();
  else if(['workList','market','projects'].includes(action)){
   tab={workList:'work',market:'market',projects:'projects'}[action];save();render();
   if(action==='market'){const target=document.querySelector('[data-open="'+projectId+'"]');target?.scrollIntoView({block:'center'});target?.focus();}
  }
 });
 window.ProgressUI={model,panel,resultCard,selectGoal,getResult:()=>resultState===S?lastResult:null};
})();
