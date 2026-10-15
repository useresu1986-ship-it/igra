'use strict';
/* Business management. All prices, thresholds and probabilities are game assumptions. */
(function(){
const yt=window.YouTubeV15;
let chosen='p3';
const moneyfmt=n=>Math.round(n||0).toLocaleString('ru-RU')+' ₽';
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function state(){const e=ensureEconomy();if(!e.youtubeBusiness17)e.youtubeBusiness17={seq:1,contracts:[],calendar:[],history:[]};return e.youtubeBusiness17;}
function okChannel(id){return yt.YTIDS.includes(id)&&pr(id)?.open;}
function audience(id){return yt.channel(id);}
function candidates(id){if(!okChannel(id))return [];const c=audience(id),a=c.subscribers||0;const base=Math.max(0,Math.round(250+a*.028));return [
 {slot:'shop',name:'Магазин оборудования',offer:base+650,minimum:Math.max(75,Math.round(a*.012)),due:6,delay:5,category:'Техника'},
 {slot:'service',name:'Онлайн-сервис',offer:base+1050,minimum:Math.max(120,Math.round(a*.020)),due:9,delay:8,category:'Сервисы'},
 {slot:'brand',name:'Молодой бренд',offer:base+1450,minimum:Math.max(180,Math.round(a*.030)),due:12,delay:12,category:'Товары'}
 ];}
function accept(id,slot){if(!okChannel(id))return {ok:false,error:'Канал не открыт'};let st=state(),offer=candidates(id).find(x=>x.slot===slot);if(!offer)return {ok:false,error:'Нет предложения'};
 if(st.contracts.some(x=>x.channel===id&&x.slot===slot&&['active','ready'].includes(x.status)))return {ok:false,error:'Договор уже действует'};
 if(S.hours<1||S.energy<4)return {ok:false,error:'Нужен час и 4 энергии на переговоры'};
 S.hours--;S.energy-=4;
 const contract={id:st.seq++,channel:id,slot,brand:offer.name,fee:offer.offer,minimum:offer.minimum,deadline:S.day+offer.due,paymentDelay:offer.delay,status:'active',signed:S.day,videoId:null,finalViews:null,invoice:null};st.contracts.push(contract);st.history.push({day:S.day,event:'signed',id:contract.id});save();return {ok:true,contract};}
function attach(contractId,videoId){const c=state().contracts.find(x=>x.id===Number(contractId));if(!c||c.status!=='active')return {ok:false,error:'Нет действующего договора'};let v=audience(c.channel)?.videos.find(x=>x.id===Number(videoId));if(!v||v.day<c.signed||v.claimed)return {ok:false,error:'Подходящий ролик не найден или есть риск нарушения прав'};
 if(v.sponsorContract&&v.sponsorContract!==c.id)return {ok:false,error:'Ролик уже используется в другом договоре'};
 if(S.day>c.deadline)return {ok:false,error:'Дедлайн уже прошёл'};
 if(c.videoId!==null&&c.videoId!==v.id){const previous=audience(c.channel)?.videos.find(x=>x.id===c.videoId);if(previous&&previous.sponsorContract===c.id)delete previous.sponsorContract;}
 c.videoId=v.id;v.sponsorContract=c.id;save();return {ok:true};}
function settle(id){let c=state().contracts.find(x=>x.id===Number(id));if(!c||c.status!=='active')return {ok:false,error:'Договор уже завершён'};
 if(c.videoId===null)return {ok:false,error:'Сначала привяжите опубликованный ролик'};
 let v=audience(c.channel)?.videos.find(x=>x.id===c.videoId);if(!v)return {ok:false,error:'Ролик недоступен'};
 if(S.day<c.deadline)return {ok:false,error:'Результаты оцениваются после дедлайна'};
 c.finalViews=v.views;c.status=v.claimed?'rejected':v.views>=c.minimum?'ready':'underperformed';
 // Sponsor's contract has fixed partial payout for underdelivery, never guaranteed full payout.
 let gross=c.status==='ready'?c.fee:c.status==='underperformed'?Math.round(c.fee*.35):0;
 if(gross>0){let inv=econInvoice(c.channel,gross,'Реклама: '+c.brand+' · видео #'+v.id,c.paymentDelay);c.invoice=inv.id;v.integrations=(v.integrations||0)+gross;}
 state().history.push({day:S.day,event:c.status,id:c.id,amount:gross});save();return {ok:true,status:c.status,amount:gross};}
function plan(id,format,days){if(!okChannel(id))return {ok:false,error:'Канал не открыт'};days=Math.round(Number(days));if(![1,3,7,14].includes(days)||!['short','long'].includes(format))return {ok:false,error:'Неверные параметры'};
 let st=state();if(st.calendar.filter(x=>x.channel===id&&x.status==='planned').length>=6)return {ok:false,error:'Календарь заполнен'};
 let entry={id:st.seq++,channel:id,format,planned:S.day+days,status:'planned'};st.calendar.push(entry);save();return {ok:true,entry};}
function assign(id,videoId){let entry=state().calendar.find(x=>x.id===Number(id));if(!entry||entry.status!=='planned')return {ok:false,error:'План недоступен'};
 const video=audience(entry.channel)?.videos.find(x=>x.id===Number(videoId));if(!video||video.format!==entry.format||video.day<entry.planned)return {ok:false,error:'Нужен новый ролик нужного формата не раньше плановой даты'};
 if(state().calendar.some(x=>x!==entry&&x.videoId===video.id&&x.channel===entry.channel))return {ok:false,error:'Этот выпуск уже закреплён'};
 entry.status='done';entry.videoId=video.id;save();return {ok:true};}
function cancelPlan(id){let entry=state().calendar.find(x=>x.id===Number(id));if(!entry||entry.status!=='planned')return {ok:false,error:'План недоступен'};entry.status='cancelled';save();return {ok:true};}
function videoFinance(id,videoId){let v=audience(id)?.videos.find(x=>x.id===Number(videoId));if(!v)return null;
 return {views:v.views||0,adNet:(v.adGross||0)-(v.fees||0),sponsor:v.integrations||0,cost:v.spent||0,margin:(v.adGross||0)-(v.fees||0)+(v.integrations||0)-(v.spent||0),cashRealized:false};}
function dayUpdate(){let st=state();for(let entry of st.calendar){if(entry.status==='planned'&&S.day>entry.planned+3)entry.status='missed';}
 for(let c of st.contracts){if(c.status==='active'&&S.day>c.deadline+3){if(c.videoId!==null)settle(c.id);else {c.status='expired';st.history.push({day:S.day,event:'expired',id:c.id});}}}}
function screen(){const opened=yt.YTIDS.filter(okChannel);if(!opened.length)return header('Медиа-компания','Бизнес YouTube')+'<div class="card">Откройте YouTube-канал в магазине идей.</div>';
 if(!opened.includes(chosen))chosen=opened[0];let c=audience(chosen),st=state(),deals=st.contracts.filter(x=>x.channel===chosen),plans=st.calendar.filter(x=>x.channel===chosen),videos=c.videos.slice(0,40);
 let rows=videos.map(v=>{let f=videoFinance(chosen,v.id);return `<tr><td>#${v.id} ${safe(v.title||v.genre)}</td><td>${f.views.toLocaleString('ru-RU')}</td><td>${moneyfmt(f.adNet)}</td><td>${moneyfmt(f.sponsor)}</td><td>${moneyfmt(f.cost)}</td><td>${moneyfmt(f.margin)}</td></tr>`}).join('');
 return header('Медиа-компания','Рекламные договоры, календарь публикаций и экономика роликов')+`<div class="notice">Все предложения, сроки, CPM/RPM и пороги просмотров здесь вымышлены для игрового баланса. В договорах отражается начисленная сумма, а не гарантированное поступление средств.</div><div class="toolbar"><label>Канал <select id="yb-channel">${opened.map(id=>`<option value="${id}" ${id===chosen?'selected':''}>${safe(PROJECTS.find(p=>p.id===id)?.name)}</option>`).join('')}</select></label></div>
 <div class="grid"><div class="card"><h2>Предложения рекламодателей</h2><p class="mini">Подписчики: ${c.subscribers.toLocaleString('ru-RU')}. Переговоры занимают 1 час и 4 энергии.</p>${candidates(chosen).map(x=>`<div class="yb-item"><b>${safe(x.name)}</b><p class="mini">Гонорар: ${moneyfmt(x.offer)} · минимум ${x.minimum} просмотров · дедлайн ${x.due} дней · оплата через ${x.delay} дней после проверки</p><button class="ghost" data-yb-accept="${x.slot}">Подписать договор</button></div>`).join('')}</div>
 <div class="card"><h2>Производственный календарь</h2><p class="mini">Планируйте выпуск, а затем создайте видео в видеоредакторе. Даты — игровые дни.</p><label>Формат <select id="yb-format"><option value="short">Shorts</option><option value="long">Длинное видео</option></select></label><label>Через <select id="yb-days"><option value="1">1 день</option><option value="3">3 дня</option><option value="7">7 дней</option><option value="14">14 дней</option></select></label><div class="btnrow"><button class="primary" data-yb-plan="1">Добавить в календарь</button></div>${plans.slice(-12).reverse().map(x=>`<div class="yb-item">День ${x.planned} · ${x.format==='short'?'Shorts':'Long'} · ${safe(x.status)} ${x.status==='planned'?`<select id="yb-planvideo-${x.id}"><option value="">Выберите видео</option>${videos.filter(v=>v.format===x.format&&v.day>=x.planned).map(v=>`<option value="${v.id}">#${v.id} ${safe(v.title)}</option>`).join('')}</select><button class="ghost" data-yb-fulfill="${x.id}">Закрыть план</button><button class="ghost" data-yb-cancel="${x.id}">Отменить</button>`:''}</div>`).join('')}</div></div>
 <div class="card"><h2>Активные рекламные договоры</h2>${deals.slice(-16).reverse().map(x=>`<div class="yb-item"><b>#${x.id} ${safe(x.brand)}</b> · ${safe(x.status)}<p class="mini">Дедлайн: день ${x.deadline} · цена ${moneyfmt(x.fee)} · порог ${x.minimum} просмотров · согласованный ролик ${x.videoId===null?'не выбран':'#'+x.videoId}</p>${x.status==='active'?`<select id="yb-dealvideo-${x.id}"><option value="">Выбрать выпуск</option>${videos.filter(v=>v.day>=x.signed&&!v.claimed&&(!v.sponsorContract||v.sponsorContract===x.id)).map(v=>`<option value="${v.id}" ${v.id===x.videoId?'selected':''}>#${v.id} ${safe(v.title)} (${v.views} просмотров)</option>`).join('')}</select><button class="ghost" data-yb-attach="${x.id}">Привязать ролик</button><button class="ghost" data-yb-settle="${x.id}">Проверить результат</button>`:''}</div>`).join('')||'<p class="mini">Пока нет договоров</p>'}</div>
 <div class="card"><h2>Прибыльность каждого видео</h2><p class="mini">Показана начисленная выручка, а не полученные деньги. Производственные расходы учитываются полностью. Условная прибыль без распределения общих расходов и налогов.</p><div class="audit-scroll"><table class="audit-table"><thead><tr><th>Видео</th><th>Просмотры</th><th>Реклама после MCN</th><th>Интеграции</th><th>Производство</th><th>Результат</th></tr></thead><tbody>${rows||'<tr><td colspan="6">Нет роликов</td></tr>'}</tbody></table></div></div>`;}
const oldDay=advanceDay;advanceDay=function(){oldDay();dayUpdate();};
let oldRender=render;render=function(){if(tab==='youtube17'){document.querySelector('#cash').textContent=money(S.cash);document.querySelector('#day').textContent=S.day;document.querySelector('#net').textContent=money(net());document.querySelector('#energy').textContent=S.energy+'%';document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));document.querySelector('#main').innerHTML=screen();return;}return oldRender();};
let nav=document.querySelector('#nav');if(nav)nav.insertAdjacentHTML('beforeend','<button data-tab="youtube17">📊 <span>Медиа-компания</span></button>');
document.addEventListener('change',ev=>{if(ev.target.id==='yb-channel'){chosen=ev.target.value;render();}});
document.addEventListener('click',ev=>{let b=ev.target.closest('button');if(!b)return;let ds=b.dataset,r=null;
 if(ds.ybAccept)r=accept(chosen,ds.ybAccept);
 else if(ds.ybPlan)r=plan(chosen,document.querySelector('#yb-format')?.value,document.querySelector('#yb-days')?.value);
 else if(ds.ybAttach)r=attach(ds.ybAttach,document.querySelector('#yb-dealvideo-'+ds.ybAttach)?.value);
 else if(ds.ybSettle)r=settle(ds.ybSettle);
 else if(ds.ybFulfill)r=assign(ds.ybFulfill,document.querySelector('#yb-planvideo-'+ds.ybFulfill)?.value);
 else if(ds.ybCancel)r=cancelPlan(ds.ybCancel);
 if(r){toast(r.ok?'Действие выполнено':r.error);render();}});
window.YouTubeBusinessV17={state,candidates,accept,attach,settle,plan,assign,cancelPlan,videoFinance,dayUpdate,screen};
})();
