'use strict';
/* Version 0.10 — project strategy decisions. All numbers are scenario assumptions. */
const STRATEGIES={
 organic:{name:'Органический рост',cost:0,hours:3,energy:17,quality:1.00,risk:0.10,description:'Развитие без платного продвижения. Медленнее, но меньше финансового риска.'},
 quality:{name:'Упор на качество',cost:0,hours:5,energy:27,quality:1.65,risk:0.07,description:'Больше времени на продукт, удержание и повторные продажи.'},
 promo:{name:'Платное продвижение',cost:2500,hours:3,energy:17,quality:2.10,risk:0.32,description:'Платный охват, который не гарантирует продажи.'}
};
function strategyState(){const E=ensureEconomy();if(!E.strategy10)E.strategy10={choices:{},history:[],sequence:0};return E.strategy10}
function chosenStrategy(id){return strategyState().choices[id]||'organic'}
function chooseStrategy(id,strategy){if(!pr(id)?.open||!STRATEGIES[strategy])return false;strategyState().choices[id]=strategy;save();render();return true}
function strategyPreview(id){const cfg=PROJECTS.find(x=>x.id===id),p=pr(id);if(!cfg||!p?.open)return null;const s=STRATEGIES[chosenStrategy(id)];let base=12+Math.pow(p.posts+1,.7)*6, staffing=1+(p.staff||0)*.22+(p.automation||0)*.15;return {hours:s.hours,energy:s.energy,cost:s.cost,audienceLow:Math.floor(base*staffing*s.quality*.45),audienceHigh:Math.ceil(base*staffing*s.quality*2.3),risk:s.risk};}
function createStrategicRelease(id,forceRoll){const cfg=PROJECTS.find(x=>x.id===id),p=pr(id);if(!p?.open||!cfg)return {ok:false,error:'Проект не открыт'};
 const strategy=chosenStrategy(id),s=STRATEGIES[strategy];if(S.hours<s.hours||S.energy<s.energy)return {ok:false,error:'Не хватает времени или энергии'};
 if(S.cash<s.cost)return {ok:false,error:'Не хватает денег на продвижение'};
 const rng=typeof forceRoll==='number'?forceRoll:Math.random();
 const chance=clamp(s.risk+(S.stress>75?.1:0)-(Math.min(12,S.rep||0)*.004),.02,.85);
 const failed=rng<chance;const qualityFactor=failed?.23:1;
 const newPosts=p.posts+1;const base=12+Math.pow(newPosts,.7)*6;const staff=1+(p.staff||0)*.22+(p.automation||0)*.15;
 const delta=Math.max(1,Math.round(base*staff*s.quality*qualityFactor*(.65+Math.min(.9,rng))));
 S.hours-=s.hours;S.energy=clamp(S.energy-s.energy,0,100);S.stress=clamp(S.stress+(strategy==='quality'?9:5),0,100);
 if(s.cost)book('Продвижение проекта',-s.cost,cfg.name,'Бюджет продвижения — условный игровой параметр',id);
 p.posts=newPosts;p.audience=(p.audience||0)+delta;
 ensureEconomy();p.metrics.content=(p.metrics.content||0)+1;p.metrics.followers=p.audience;
 let st=strategyState();let item={id:++st.sequence,day:S.day,project:id,strategy,spent:s.cost,hours:s.hours,audience:delta,failed};st.history.push(item);if(st.history.length>1500)st.history.shift();
 notice(cfg.name+': '+(failed?'слабый выпуск':'удачный выпуск')+', прирост аудитории '+delta+', вложения '+money(s.cost));save();render();return {ok:true,...item};
}
function strategyScreen(){const state=strategyState();const active=PROJECTS.filter(x=>pr(x.id)?.open);return header('Контент и стратегия','Выбирай, на что тратить часы и деньги. Продвижение не гарантирует успех.')+`<div class="notice">Все коэффициенты роста, риски и бюджет 2 500 ₽ — игровые допущения, не реальные значения рекламных платформ.</div>${active.length?`<div class="listcards">${active.map(cfg=>{const p=pr(cfg.id),selected=chosenStrategy(cfg.id),prev=strategyPreview(cfg.id),m=p.metrics||{};return `<div class="card job"><div class="row-between"><strong>${cfg.icon} ${esc(cfg.name)}</strong><span class="tag">${p.posts} публикаций</span></div><div class="mini">Аудитория: ${(p.audience||0).toLocaleString('ru-RU')} · Просмотры: ${(m.views||0).toLocaleString('ru-RU')}</div><label class="mini" for="strat-${cfg.id}">Как развивать проект</label><select id="strat-${cfg.id}" data-strategy10="${cfg.id}">${Object.entries(STRATEGIES).map(([k,s])=>`<option value="${k}" ${selected===k?'selected':''}>${esc(s.name)}</option>`).join('')}</select><p class="mini">${esc(STRATEGIES[selected].description)}</p><p class="mini">Стоимость ${money(prev.cost)} · ${prev.hours} ч · энергия ${prev.energy} · вероятность слабого выпуска ~${Math.round(prev.risk*100)}% (игровая)</p><div class="btnrow"><button class="primary" data-release10="${cfg.id}" ${S.hours<prev.hours||S.energy<prev.energy||S.cash<prev.cost?'disabled':''}>Сделать выпуск</button><button class="ghost" data-strategyfinance="${cfg.id}">Посмотреть финансовый результат</button></div></div>`}).join('')}</div>`:'<div class="card"><h3>Пока нет собственного проекта</h3><p>Открой проект, чтобы управлять его развитием.</p><button class="primary" data-tab="market">К идеям бизнеса</button></div>'}<div class="card"><h2>Журнал последних решений</h2><div class="audit-scroll"><table class="audit-table"><thead><tr><th>День</th><th>Проект</th><th>Стратегия</th><th>Бюджет</th><th>Прирост аудитории</th><th>Результат</th></tr></thead><tbody>${state.history.slice(-25).reverse().map(x=>`<tr><td>${x.day}</td><td>${esc(PROJECTS.find(p=>p.id===x.project)?.name||x.project)}</td><td>${esc(STRATEGIES[x.strategy]?.name||x.strategy)}</td><td>${money(x.spent)}</td><td>+${x.audience}</td><td>${x.failed?'Слабый выпуск':'Удачный выпуск'}</td></tr>`).join('')||'<tr><td colspan="6">Решений пока нет</td></tr>'}</tbody></table></div></div>`}
const strategyPriorRender=render;
render=function(){if(tab==='strategy10'){document.querySelector('#cash').textContent=money(S.cash);document.querySelector('#day').textContent=S.day;document.querySelector('#net').textContent=money(net());document.querySelector('#energy').textContent=S.energy+'%';document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));document.querySelector('#main').innerHTML=strategyScreen();return}strategyPriorRender()};
const strategyNav=document.querySelector('#nav');if(strategyNav)strategyNav.insertAdjacentHTML('beforeend','<button data-tab="strategy10">🎛 <span>Продюсерский центр</span></button>');
document.addEventListener('change',e=>{if(e.target?.dataset?.strategy10){chooseStrategy(e.target.dataset.strategy10,e.target.value)}});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.release10){let out=createStrategicRelease(b.dataset.release10);toast(out.ok?`Выпуск готов. Аудитория +${out.audience}`:out.error);}else if(b.dataset.strategyfinance){selectedFinance=b.dataset.strategyfinance;tab='econ';render();}});
window.StrategyV10={STRATEGIES,strategyState,chosenStrategy,chooseStrategy,strategyPreview,createStrategicRelease,strategyScreen};
