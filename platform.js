'use strict';
/* Yandex Games adapter. SDK is deliberately optional in local builds. Never fake rewarded views. */
let yandexSDK=null,yandexPlayer=null;
function platformStatus(){return !!yandexSDK}
async function initYandex(){
 if(!window.YaGames?.init)return false;
 try{yandexSDK=await window.YaGames.init();yandexSDK.features?.LoadingAPI?.ready();yandexSDK.features?.GameplayAPI?.start();
  try{yandexPlayer=await yandexSDK.getPlayer()}catch(e){console.warn('Yandex player unavailable',e)}
  return true;
 }catch(e){console.warn('Yandex SDK unavailable',e);return false}
}
function awardEnergy(){const x=sys();if(x.lastAdDay===S.day)return false;x.lastAdDay=S.day;S.energy=Math.min(100,S.energy+22);notice('Добровольное видео: +22 энергии');save();render();return true}
function watchRewarded(){if(!yandexSDK?.adv?.showRewardedVideo)return toast('Реклама доступна после подключения платформы Яндекс Игры');if(sys().lastAdDay===S.day)return toast('Сегодня бонус уже получен');
 yandexSDK.features?.GameplayAPI?.stop();
 yandexSDK.adv.showRewardedVideo({callbacks:{onOpen:()=>{},onRewarded:()=>awardEnergy(),onClose:()=>{yandexSDK.features?.GameplayAPI?.start()},onError:()=>{yandexSDK.features?.GameplayAPI?.start();toast('Рекламный показ недоступен')}}});
}
function adsScreen(){return header('Добровольные бонусы','Никаких принудительных видео во время выполнения работы')+`<div class="card"><h2>Восстановление энергии</h2><p>За просмотр рекламного видео: +22 энергии, не чаще одного раза за игровой день. Выдача награды — только после подтверждения от платформы.</p><button class="primary" data-reward="energy" ${!platformStatus()||sys().lastAdDay===S.day?'disabled':''}>${!platformStatus()?'Доступно только в Яндекс Играх':sys().lastAdDay===S.day?'Сегодня использовано':'Посмотреть рекламу добровольно'}</button><p class="mini">Обычный отдых всегда бесплатный. В локальном запуске рекламы нет, награды за неё не начисляются.</p></div><div class="card"><h2>Привязка сохранения</h2><p class="mini">Локальное сохранение работает без интернета. Облачный перенос через Player.setData/getData требует тестирования авторизации и конфликтов сохранений на платформе; здесь не включён, чтобы не перезаписывать прогресс.</p></div>`}
const platformRender=render;
render=function(){if(tab==='bonuses'){document.querySelector('#cash').textContent=money(S.cash);document.querySelector('#day').textContent=S.day;document.querySelector('#net').textContent=money(net());document.querySelector('#energy').textContent=S.energy+'%';document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));document.querySelector('#main').innerHTML=adsScreen();return;}platformRender()};
document.addEventListener('click',e=>{let b=e.target.closest('button[data-reward]');if(b&&b.dataset.reward==='energy')watchRewarded()});
const navp=document.querySelector('#nav');if(navp)navp.insertAdjacentHTML('beforeend','<button data-tab="bonuses">🎁 <span>Добровольные бонусы</span></button>');
/* Only attempt remote SDK inside Yandex-hosted frame; otherwise remain fully offline. */
if(typeof location!=='undefined'&&/\.yandex\.(ru|com|by|kz)$/.test((location.ancestorOrigins?.[0]||'').replace(/^https?:\/\//,''))){const script=document.createElement('script');script.src='https://yandex.ru/games/sdk/v2';script.onload=initYandex;script.onerror=()=>console.warn('SDK download failed');document.head.appendChild(script)}
window.PlatformTest={platformStatus,awardEnergy,watchRewarded,adsScreen,initYandex};render();
