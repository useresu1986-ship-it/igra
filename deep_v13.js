'use strict';
/* v13: three deeper career simulations. Synthetic scenarios, not real wage / platform data. */
(() => {
 const oldStart=startWork, oldClose=closeModal;
 let session=null;
 const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const button=(label,action,value='',cls='ghost')=>`<button type="button" class="${cls}" data-deep="${action}" data-value="${E(value)}">${E(label)}</button>`;
 const panels={w6:'Монтажный стол · Shorts',w17:'Рекламный кабинет · Медиабаинг',w18:'Музыкальная студия · Битмейкер'};
 const brief={
  w6:{name:'Вертикальный ролик на 30 секунд',intro:'Собери ролик, сохрани внимание зрителя и уложись в дедлайн. Клиент хочет короткую понятную историю.'},
  w17:{name:'Тест рекламных связок',intro:'На счёте тестовый бюджет 6 000 ₽. Сравни кампании по подтверждённой выручке после расходов, а не по кликам.'},
  w18:{name:'Демозапись: ритм для исполнителя',intro:'Напиши 16-шаговый грув. Запрос клиента: пульсирующий кик, снейр на 5 и 13, умеренный хэт.'}
 };
 const events=[];
 const clock=()=>session?`<p class="mini">Этап ${session.stage+1} из 3 · Качество: ${session.score} / 100 · Ошибок: ${session.errors}</p>`:'';
 function open(id){let job=WORK.find(j=>j.id===id);if(!job||S.hours<job.hours||S.energy<15)return toast('Недостаточно времени или энергии');session={id,stage:0,score:0,errors:0,notes:[],sequence:[],kick:new Set(),snare:new Set(),hat:new Set(),choices:{},audio:null};modal={id,type:'deep13'};draw();}
 function fail(msg,penalty=10){session.errors++;session.score=Math.max(0,session.score-penalty);session.notes.push(msg);toast(msg);draw();}
 function success(msg,points=30){session.score=Math.min(100,session.score+points);session.notes.push(msg);session.stage++;if(session.stage>=3)return finish();draw();}
 function finish(){const s=session;let passed=s.score>=68 && s.errors<=3;session=null;const result=passed?'Заказ принят':'Заказ принят с замечаниями';events.push({job:s.id,grade:s.score,passed,notes:s.notes.slice(),day:S.day});if(events.length>50)events.shift();try{localStorage.setItem('iznulya_deep_v13_history',JSON.stringify(events))}catch(e){};workResult(passed);toast(`${result}. Качество ${s.score}/100. ${passed?'Полная оплата по игровому коэффициенту.':'Частичная оплата по игровому коэффициенту.'}`);}
 function draw(){if(!session)return;let s=session,b=brief[s.id],html=`<div class="mini">${E(b.name)}</div><h3>${E(panels[s.id])}</h3><p>${E(b.intro)}</p>${clock()}<div class="deep-board">`;
 if(s.id==='w6'){
  if(s.stage===0)html+=`<p><b>Задача 1 · Монтажная последовательность</b></p><p>Собери четыре части клипа в порядке: хук → проблема → демонстрация → результат.</p><div class="deep-track">${s.sequence.map((x,i)=>`<span class="deep-chip">${i+1}. ${E(x)}</span>`).join('')||'<span class="mini">Таймлайн пуст</span>'}</div><div class="tiles">${['Демонстрация','Хук','Результат','Проблема'].map(x=>button(x,'clip',x)).join('')}</div>${button('Сбросить таймлайн','reset')}`;
  if(s.stage===1)html+=`<p><b>Задача 2 · Длительность</b></p><p>У тебя четыре отрезка: хук 3 с, проблема 7 с, демонстрация 13 с, результат 5 с. Добавь время финального экрана так, чтобы ролик был 30 секунд.</p><div class="tiles">${[1,2,4,6].map(n=>button(n+' с','duration',String(n))).join('')}</div>`;
  if(s.stage===2)html+=`<p><b>Задача 3 · Контроль качества</b></p><p>В кадре речь -16 LUFS, музыка -13 LUFS. Голос теряется. Что нужно исправить перед сдачей?</p><div class="tiles">${[['reduce','Уменьшить громкость музыки и перепроверить баланс'],['boost','Поднять громкость обоих дорожек одинаково'],['ignore','Сдать как есть']].map(([v,l])=>button(l,'mix',v)).join('')}</div>`;
 }
 if(s.id==='w17'){
  if(s.stage===0)html+=`<p><b>Задача 1 · Выбери связку по прибыли</b></p><table><thead><tr><th>Связка</th><th>Расходы</th><th>Подтверждено</th><th></th></tr></thead><tbody>${[['A',2400,3000],['B',1800,2900],['C',1600,2150]].map(([n,c,r])=>`<tr><td>${n}</td><td>${c} ₽</td><td>${r} ₽</td><td>${button('Выбрать','campaign',n)}</td></tr>`).join('')}</tbody></table><p class="mini">Все цифры — учебный кейс.</p>`;
  if(s.stage===1)html+=`<p><b>Задача 2 · Ограничения бюджета</b></p><p>Ты выбрал прибыльную связку. Как действовать с оставшимися деньгами при малой статистике?</p><div class="tiles">${[['test','Провести небольшой дополнительный тест и оценить качество лидов'],['all','Сразу потратить весь остаток бюджета'],['fake','Увеличить доходность в отчёте без данных']].map(([v,l])=>button(l,'budget',v)).join('')}</div>`;
  if(s.stage===2)html+=`<p><b>Задача 3 · Рассчитай ROI</b></p><p>Связка потратила 1 800 ₽, получила 2 900 ₽ подтверждённых выплат. ROI без других расходов (округление до целого процента)?</p><div class="tiles">${[38,61,110,161].map(n=>button(n+'%','roi',String(n))).join('')}</div>`;
 }
 if(s.id==='w18'){
  if(s.stage===0)html+=`<p><b>Задача 1 · Создание рисунка</b></p><p class="mini">Кик на шагах 1, 5, 9, 13; снейр на 5, 13; хэт — любые 4–8 шагов. Результат оценивается по попаданию в бриф и плотности рисунка.</p>${['kick','snare','hat'].map((instrument,row)=>`<div class="deep-instrument"><b>${['Кик','Снейр','Хэт'][row]}</b><div class="deep-steps">${Array.from({length:16},(_,i)=>`<button type="button" class="deep-pad ${s[instrument].has(i)?'on':''}" aria-label="${instrument} шаг ${i+1}" aria-pressed="${s[instrument].has(i)}" data-deep="pad" data-value="${instrument}:${i}">${i+1}</button>`).join('')}</div></div>`).join('')}<div class="btnrow">${button('▶ Прослушать','listen')}${button('Проверить рисунок','validate','', 'primary')}</div>`;
  if(s.stage===1)html+=`<p><b>Задача 2 · Аранжировка</b></p><p>Клиент просит, чтобы вокал был слышен, а инструментал не перегружен. Как оформить демо?</p><div class="tiles">${[['space','Оставить пространство в среднем диапазоне и проверить баланс'],['loud','Увеличить громкость всех инструментов до максимума'],['random','Добавить как можно больше эффектов без прослушивания']].map(([v,l])=>button(l,'arrange',v)).join('')}</div>`;
  if(s.stage===2)html+=`<p><b>Задача 3 · Лицензия</b></p><p>Клиенту нужен бит для неэксклюзивного использования. Что должно быть зафиксировано перед продажей?</p><div class="tiles">${[['license','Условия лицензии, права использования и ограничения'],['none','Ничего: файл передан — права автоматически понятны'],['promise','Обещание, что чужие семплы всегда безопасны']].map(([v,l])=>button(l,'license',v)).join('')}</div>`;
 }
 html+=`</div><p class="mini">Результат задания влияет на коэффициент заработка, но не меняет реальную рыночную ставку. Деньги учитываются общим движком.</p>`;showModal(html);}
 function play(){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return toast('Аудио не поддерживается');let ctx=new AC(),t=ctx.currentTime+.07;for(let i=0;i<16;i++)for(let [key,f] of [['kick',95],['snare',210],['hat',540]])if(session[key].has(i)){const osc=ctx.createOscillator(),g=ctx.createGain(),at=t+i*.125;osc.type=key==='kick'?'sine':'triangle';osc.frequency.setValueAtTime(f,at);g.gain.setValueAtTime(.055,at);g.gain.exponentialRampToValueAtTime(.001,at+.09);osc.connect(g);g.connect(ctx.destination);osc.start(at);osc.stop(at+.1);}setTimeout(()=>ctx.close().catch(()=>{}),2600)}catch(e){toast('Аудио недоступно')}}
 function act(action,value){if(!session)return;let s=session;
 if(action==='clip'){if(s.sequence.includes(value))return fail('Фрагмент уже добавлен',5);s.sequence.push(value);if(s.sequence.length===4){if(s.sequence.join('|')==='Хук|Проблема|Демонстрация|Результат')success('Структура удерживает внимание',35);else fail('Структура ролика не соответствует заданию',12)}else draw();return}
 if(action==='reset'){s.sequence=[];draw();return}
 if(action==='duration')return Number(value)===2?success('Длительность: 30 секунд',30):fail('Проверь сумму длительностей',8);
 if(action==='mix')return value==='reduce'?success('Голос стал разборчивее',35):fail('Баланс голоса и музыки остался проблемным',10);
 if(action==='campaign')return value==='B'?success('Максимальная прибыль: 1 100 ₽',35):fail('Сравни подтверждённую выручку минус расходы',10);
 if(action==='budget')return value==='test'?success('Дополнительный тест снижает риск',30):fail('Рискованная стратегия масштабирования',9);
 if(action==='roi')return Number(value)===61?success('ROI ≈ 61%',35):fail('ROI = прибыль / рекламные расходы × 100%',7);
 if(action==='pad'){let [key,idx]=value.split(':');idx=Number(idx);let set=s[key];set.has(idx)?set.delete(idx):set.add(idx);draw();return}
 if(action==='listen')return play();
 if(action==='validate'){let kicks=[0,4,8,12],snares=[4,12],k=s.kick,h=s.hat,n=s.snare;let good=k.size===4&&kicks.every(x=>k.has(x))&&n.size===2&&snares.every(x=>n.has(x))&&h.size>=4&&h.size<=8;return good?success('Ритм соответствует брифу, можно перейти к сведению',35):fail('Сверь бочку, снейр и количество шагов хэта с брифом',8)}
 if(action==='arrange')return value==='space'?success('Аранжировка оставляет место вокалу',30):fail('В аранжировке возникли проблемы с читаемостью',10);
 if(action==='license')return value==='license'?success('Условия использования согласованы',35):fail('Передача файла без условий лицензии создаёт риск',10);
 }
 startWork=function(id){if(!panels[id])return oldStart(id);return open(id)};
 closeModal=function(){session=null;return oldClose()};
 document.addEventListener('click',e=>{let b=e.target.closest('[data-deep]');if(!b)return;act(b.dataset.deep,b.dataset.value)});
 window.DeepCareer13={getSession:()=>session,action:act,start:open,history:events};
})();
