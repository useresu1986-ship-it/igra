'use strict';
/* YouTube Studio gameplay module. Simulation coefficients are hypothetical, never market measurements. */
(function(){
const YTIDS=['p2','p3','p4','p5','p6','p8'];
const FORMATS={short:{name:'Shorts',hours:3,energy:16,base:220,exposure:1.8,decay:.48},long:{name:'Длинное видео',hours:6,energy:28,base:520,exposure:.85,decay:.83}};
const REGIONS={ru:{name:'Россия / СНГ',ad:0,view:1.05},intl:{name:'Международная аудитория',ad:1,view:.78}};
const TEMPLATES=[{name:'Обучение',interest:.78,competition:.65},{name:'Развлечения',interest:1.28,competition:1.35},{name:'Бизнес и технологии',interest:.85,competition:1.10},{name:'Истории',interest:1.05,competition:1.0},{name:'Музыка',interest:.9,competition:1.15}];
const RANDOM=Math.random;
let active='p2';
function storage(){let e=ensureEconomy();if(!e.yt15)e.yt15={channels:{},seq:1,history:[],method:'simulation'};return e.yt15}
function channel(id){let d=storage(),p=pr(id);if(!YTIDS.includes(id)||!p?.open)return null;
 if(!d.channels[id])d.channels[id]={videos:[],subscribers:Math.max(0,p.audience||0),impressions:0,views:0,adGross:0,mcnFees:0,paid:0,direct:0,production:0,day:S.day};return d.channels[id];}
function probability(x){return Math.max(0,Math.min(1,x))}
function create(id,params={}){let c=channel(id);if(!c)return {ok:false,error:'Откройте соответствующий YouTube-проект'};
 const format=FORMATS[params.format]||FORMATS.short,genre=TEMPLATES[Number(params.genre)]||TEMPLATES[0],region=REGIONS[params.region]||REGIONS.ru;
 let effort=Math.max(0,Math.min(2,Math.round(Number(params.effort)||0))),promo=Math.max(0,Math.min(2500,Math.round(Number(params.promo)||0)));
 const time=format.hours+effort*2,energy=format.energy+effort*7,cost=format.base+effort*320+promo;
 if(S.hours<time||S.energy<energy||S.cash<cost)return {ok:false,error:'Недостаточно часов, энергии или денег'};
 S.hours-=time;S.energy-=energy;S.stress=clamp(S.stress+2+effort*2,0,100);
 book('Производство контента',-(format.base+effort*320),PROJECTS.find(x=>x.id===id).name,'YouTube Studio: производство ролика',id);
 if(promo)book('Продвижение канала',-promo,PROJECTS.find(x=>x.id===id).name,'Рекламный бюджет; успех не гарантирован',id);
 let skill=Math.min(1.35,1+(S.skills?.['Монтаж Shorts']||0)*.015),noise=.75+RANDOM()*.55;
 let quality=params.editor?probability(params.editor.quality):probability((.42+effort*.16)*skill*noise);
 const ctr=params.editor?probability(params.editor.ctr):probability((.022+quality*.075)*genre.interest/genre.competition*region.view),retention=params.editor?probability(params.editor.retention):probability((.20+quality*.68)*(format===FORMATS.short?.95:1.0)*noise);
 let video={id:storage().seq++,day:S.day,format:params.format==='long'?'long':'short',genre:genre.name,region:params.region==='intl'?'intl':'ru',quality,ctr,retention,impressions:0,views:0,subs:0,spent:cost,adGross:0,fees:0,integrations:0,promo,age:0,claimed:params.editor?!params.editor.rights:false,claimReason:params.editor?.risk||'low',title:params.editorData?.title||'',productionEdit:params.editorData||null,traffic:{browse:0,search:0,suggested:0,external:0},baseReach:Math.round((180+promo*.6)*genre.interest/genre.competition*region.view*(.7+RANDOM()*.6))};
 c.videos.unshift(video);if(c.videos.length>200)c.videos.length=200;c.production+=cost;let p=pr(id);p.posts++;p.metrics.content++;storage().history.push({day:S.day,id,type:'upload',video:video.id,amount:-cost});notice('YouTube: опубликован ролик #'+video.id+', списано '+money(cost));save();return {ok:true,video};}
function simulate(id,p){let c=channel(id);if(!c)return;let dailyViews=0,dailySubs=0,dailyGross=0,dailyFees=0;for(let v of c.videos){v.age++;
 // Viewer discovery is bounded by exposure and audience, not guaranteed views.
 let maturity=.30+Math.min(3,Math.log1p(c.subscribers)/5),curve=Math.pow(v.format==='short'?.46:.83,v.age-1);
 let impressions=Math.round(v.baseReach*curve*maturity*(.5+RANDOM()*1.0));
 let views=Math.min(impressions,Math.round(impressions*v.ctr*(.65+v.retention*1.4)));
 let gained=Math.round(views*(v.quality*.012)*(RANDOM()*.9+.55));
 v.traffic=v.traffic||{browse:0,search:0,suggested:0,external:0};let browse=Math.round(views*(v.format==='short'?.56:.35)),search=Math.round(views*(v.format==='short'?.08:.28)),suggested=Math.round(views*.27);v.traffic.browse+=browse;v.traffic.search+=search;v.traffic.suggested+=suggested;v.traffic.external+=Math.max(0,views-browse-search-suggested);v.impressions+=impressions;v.views+=views;v.subs+=gained;dailyViews+=views;dailySubs+=gained;c.impressions+=impressions;
 let monetizable=isYouTube(id)&&canEnableAds(id)&&v.region==='intl'&&!v.claimed&&c.subscribers>=1000&&p.posts>=8;
 // Game-only RPM estimate (rubles per 1000 total video views), not measured rate.
 if(monetizable&&views){let modelRPM=v.format==='long'?Math.round(45+v.quality*100):Math.round(3+v.quality*11);let gross=Math.round(views/1000*modelRPM),fee=Math.round(gross*.20);v.adGross+=gross;v.fees+=fee;dailyGross+=gross;dailyFees+=fee;}
 }
 c.views+=dailyViews;c.subscribers+=dailySubs;p.audience=c.subscribers;p.metrics.views+=dailyViews;p.metrics.followers=c.subscribers;c.adGross+=dailyGross;c.mcnFees+=dailyFees;
 if(dailyGross>dailyFees){let payment=dailyGross-dailyFees;econInvoice(id,payment,'YouTube Studio: рекламные начисления минус 20% MCN',12);storage().history.push({day:S.day,id,type:'mcn-accrual',amount:payment,fee:dailyFees,gross:dailyGross});}
 // Direct brand deals are deliberately initiated by player, not automatically generated.
}
function pitch(id){let c=channel(id);if(!c)return {ok:false,error:'Нет канала'};
 if(S.hours<2||S.energy<9)return {ok:false,error:'Недостаточно времени или энергии'};
 S.hours-=2;S.energy-=9;
 let avg=c.videos.slice(0,10).reduce((s,v)=>s+v.views,0)/Math.max(1,Math.min(10,c.videos.length));
 let chance=probability((Math.log1p(c.subscribers)/25+Math.log1p(avg)/35)*.4);
 let won=RANDOM()<chance&&c.videos.length>=3;
 if(won){let gross=Math.round(650+avg*.12+c.subscribers*.08);econInvoice(id,gross,'Прямая рекламная интеграция: договор',5);c.direct+=gross;storage().history.push({day:S.day,id,type:'integration-invoice',amount:gross});}
 save();return {ok:true,won,chance};}
function fmt(n){return Math.round(n||0).toLocaleString('ru-RU')}
function screen(){let opened=YTIDS.filter(id=>pr(id)?.open);if(!opened.length)return header('YouTube Studio','Управление собственными каналами')+'<div class="card">Сначала открой YouTube-проект в маркетплейсе идей.</div>';
 if(!opened.includes(active))active=opened[0];let c=channel(active),pv=c.videos.slice(0,24);let ctr=c.impressions?100*c.views/c.impressions:0;
 return header('YouTube Studio','Производство, аналитика роликов, права, монетизация и рекламодатели')+`<div class="notice">Все охваты, RPM, ставки, вероятности и расходы в этом модуле — <b>условные настройки симуляции</b>. MCN не отменяет требований YPP. Для рекламного дохода здесь необходимы одобренный договор, условия канала и международные просмотры.</div><div class="toolbar"><label>Канал <select id="yt-channel">${opened.map(id=>`<option value="${id}" ${id===active?'selected':''}>${esc(PROJECTS.find(p=>p.id===id).name)}</option>`).join('')}</select></label></div>
 <div class="grid four">${[['Подписчики',fmt(c.subscribers)],['Показы',fmt(c.impressions)],['Просмотры',fmt(c.views)],['Начислено MCN',money(c.adGross-c.mcnFees)]].map(([a,b])=>`<div class="card"><div class="mini">${a}</div><div class="statnum">${b}</div></div>`).join('')}</div>
 <div class="grid"><div class="card"><h2>Создать ролик</h2><p class="mini">Часы, энергия, производство и продвижение списываются сразу. Просмотры приходят в следующие игровые дни.</p><div class="yt-form"><label>Формат<select id="yt-format"><option value="short">Shorts (3 ч)</option><option value="long">Длинное видео (6 ч)</option></select></label><label>Тематика<select id="yt-genre">${TEMPLATES.map((x,i)=>`<option value="${i}">${x.name}</option>`).join('')}</select></label><label>Аудитория<select id="yt-region"><option value="ru">RU / СНГ</option><option value="intl">Международная</option></select></label><label>Производство<select id="yt-effort"><option value="0">Базовое</option><option value="1">Продвинутое +2 ч</option><option value="2">Премиальное +4 ч</option></select></label><label>Реклама<select id="yt-promo"><option value="0">Без рекламы</option><option value="500">500 ₽</option><option value="1500">1 500 ₽</option><option value="2500">2 500 ₽</option></select></label></div><div class="btnrow"><button class="primary" data-yt-upload="1">Опубликовать ролик</button><button class="ghost" data-yt-pitch="1">Предложить интеграцию · 2 ч</button></div></div><div class="card"><h2>Монетизация и аудитория</h2><p>Статус MCN: <b>${esc(contractFor(active).status)}</b>. Комиссия одобренного договора: 20%.</p><p>Начисления до комиссии: ${money(c.adGross)}; удержано: ${money(c.mcnFees)}.</p><p>Заявки рассматриваются по правилам уже существующего модуля партнёрских договоров.</p><button class="ghost" data-yt-agency="1">Подать заявку в MCN</button><p class="mini">Условный CTR по всему каналу: ${ctr.toFixed(2)}%; этот показатель включает все просмотры, не только переходы с обложки, и служит приблизительным индикатором.</p></div></div>
 <div class="card"><h2>Аналитика роликов</h2><div class="audit-scroll"><table class="audit-table"><thead><tr><th>Ролик</th><th>День</th><th>Формат / рынок</th><th>Показы</th><th>CTR</th><th>Удержание</th><th>Просмотры</th><th>Подписчики</th><th>Доход MCN</th><th>Расходы</th></tr></thead><tbody>${pv.map(v=>`<tr><td>#${v.id} · ${esc(v.title||v.genre)} ${v.claimed?'⚠ Права':''}</td><td>${v.day}</td><td>${v.format==='short'?'Shorts':'Long'} / ${v.region.toUpperCase()}</td><td>${fmt(v.impressions)}</td><td>${(v.ctr*100).toFixed(1)}%</td><td>${(v.retention*100).toFixed(1)}%</td><td>${fmt(v.views)}</td><td>${fmt(v.subs)}</td><td>${money(v.adGross-v.fees)}</td><td>${money(v.spent)}</td></tr>`).join('')||'<tr><td colspan="10">Ещё нет публикаций</td></tr>'}</tbody></table></div></div><div class="card"><h2>Источники трафика</h2>${pv.slice(0,8).map(v=>`<p class="mini">#${v.id}: главная/лента ${fmt(v.traffic?.browse)}, поиск ${fmt(v.traffic?.search)}, рекомендации ${fmt(v.traffic?.suggested)}, внешний ${fmt(v.traffic?.external)}</p>`).join('')||'<p class="mini">Нет данных</p>'}</div><div class="card"><h2>История действий</h2>${storage().history.filter(x=>x.id===active).slice(-15).reverse().map(x=>`<p class="mini">День ${x.day}: ${esc(x.type)} · ${money(x.amount)}</p>`).join('')||'<p>Пока нет событий</p>'}</div>`;
}
const originalProjectDay=runProjectDay;
runProjectDay=function(id,p){if(YTIDS.includes(id)){simulate(id,p);return;}return originalProjectDay(id,p)};
const oldRender=render;
render=function(){if(tab==='youtube15'){document.querySelector('#cash').textContent=money(S.cash);document.querySelector('#day').textContent=S.day;document.querySelector('#net').textContent=money(net());document.querySelector('#energy').textContent=S.energy+'%';document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));document.querySelector('#main').innerHTML=screen();return;}return oldRender();};
const nav=document.querySelector('#nav');if(nav)nav.insertAdjacentHTML('beforeend','<button data-tab="youtube15">▶ <span>YouTube Studio</span></button>');
document.addEventListener('change',ev=>{if(ev.target.id==='yt-channel'){active=ev.target.value;render();}});
document.addEventListener('click',ev=>{let b=ev.target.closest('button');if(!b)return;if(b.dataset.ytUpload){let get=k=>document.getElementById(k)?.value;let result=create(active,{format:get('yt-format'),genre:get('yt-genre'),region:get('yt-region'),effort:get('yt-effort'),promo:get('yt-promo')});toast(result.ok?'Ролик опубликован':result.error);render();}if(b.dataset.ytPitch){let r=pitch(active);toast(!r.ok?r.error:r.won?'Рекламодатель согласился — счёт выставлен':'Пока нет подходящего рекламодателя');render();}if(b.dataset.ytAgency){agencyApply(active);}});
window.YouTubeV15={channel,storage,create,simulate,pitch,screen,FORMATS,YTIDS};
})();
