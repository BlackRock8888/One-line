import { SessionClock } from './session-clock.js';
import { DailyRoom } from './daily-voice.js';
import { initTelegram } from './telegram.js';
import { diagnosticReport } from './diagnostics.js';
initTelegram();
const $ = id => document.getElementById(id);
const status = message => $('status').textContent = message;
function flow(state,title,description=''){
 document.body.dataset.flow=state;
 $('flow-feedback').hidden=state==='landing';
 $('flow-title').textContent=title;$('flow-description').textContent=description;
 $('flow-label').textContent=({landing:'Готовы поговорить?',connecting:'Подключение',room:'Ваша комната',error:'Не удалось подключиться'})[state];
 $('flow-icon').textContent=state==='error'?'!':state==='room'?'✓':'';
 $('connect').querySelector('span').textContent=state==='connecting'?'Подключаем…':state==='error'?'Попробовать снова':'Войти в комнату';
}
function clearChat(){ $('chat-messages').replaceChildren();$('chat-input').value=''; }
const clock=new SessionClock({render:(mode,seconds)=>{
 $('session-timer').hidden=mode==='off';
 $('session-timer').textContent=mode==='waiting'?'Ожидание гостя · '+seconds+' с':'Разговор · '+Math.floor(seconds/60).toString().padStart(2,'0')+':'+(seconds%60).toString().padStart(2,'0');
},expire:()=>{room.leave().then(()=>status('Гость не подключился за минуту. Комната закрыта, микрофон выключен.'));}});
let clockInterval;
const inviteUrl=()=>location.origin+location.pathname+location.search;
const room = new DailyRoom({status,
 stage:(title,description)=>flow('connecting',title,description),
 failed:(title,description)=>flow('error',title,description),
  chat:(text,author)=>{const message=document.createElement('p');message.className='chat-message '+author;message.textContent=text;$('chat-messages').append(message);while($('chat-messages').children.length>100)$('chat-messages').firstChild.remove();message.scrollIntoView({block:'nearest'});},
  chatState:ready=>{$('chat-input').disabled=!ready;$('chat-send').disabled=!ready;$('chat-input').placeholder=ready?'Write a message…':'Waiting for your guest…';if(!ready)clearChat();},
  level:({local,remote})=>{ $('avatar').style.setProperty('--level',Math.max(local,remote).toFixed(3)); $('avatar').style.setProperty('--turn',((local-remote)*4).toFixed(2)+'deg'); },
  joined:()=>{flow('room','Вы в комнате','Поделитесь ссылкой. Ждём вашего гостя.');document.body.classList.add('in-room');$('invitation').hidden=false;$('invite-link').value=inviteUrl();clearInterval(clockInterval);clockInterval=setInterval(()=>clock.tick(),250); $('connect').hidden=true; $('controls').hidden=false; $('hint').textContent='Пригласите близкого. Без гостя комната закроется через 60 секунд.';},
  ended:()=>{flow('landing','','');$('person-self').classList.remove('present');$('person-guest').classList.remove('present');$('person-guest').disabled=true;$('self-state').textContent='Не подключены';$('guest-state').textContent='Свободное место';document.body.classList.remove('in-room');clearInterval(clockInterval);clock.reset();$('invitation').hidden=true;$('chat-panel').hidden=true;$('chat-toggle').setAttribute('aria-expanded','false'); $('capacity').textContent='0 / 2';$('controls').hidden=true; $('connect').hidden=false; $('connect').disabled=false; $('mute').textContent='Mute'; $('mute').setAttribute('aria-pressed','false'); $('enable-audio').hidden=true; $('hint').textContent='Microphone access only when you connect.';},
  members:members=>{$('person-self').classList.toggle('present',members.length>0);$('person-guest').classList.toggle('present',members.length>1);$('person-guest').disabled=members.length!==1;$('self-state').textContent=members.length?'В комнате':'Не подключены';$('guest-state').textContent=members.length>1?'Гость в комнате':'Свободное место';if(members.length>1)flow('room','Вы вместе','Можно говорить или написать в чат.');clock.update(members.length);$('capacity').textContent=members.length+' / 2';const self=members.find(m=>m.id===room.session?.id);if(self) document.querySelector('.nickname').textContent=self.name;}
});
$('connect').onclick=async()=>{ $('connect').disabled=true;flow('connecting','Создаём комнату','Микрофон пока выключен.'); await room.enter(); };
$('mute').onclick=()=>{const muted=room.mute();$('mute').textContent=muted?'Unmute':'Mute';$('mute').setAttribute('aria-pressed',String(muted));};
$('leave').onclick=async()=>{await room.leave();status('Microphone off. Your next moment is one tap away.');};
$('invite').onclick=async()=>{
 if(navigator.share){try{await navigator.share({title:'Black Rock Talk',text:'Присоединяйся к моей комнате',url:inviteUrl()});return;}catch(error){if(error.name==='AbortError')return;}}
 await copyInvite();
};
async function copyInvite(){try{await navigator.clipboard.writeText(inviteUrl());status('Ссылка скопирована. Отправьте её гостю.');}catch{$('invite-link').focus();$('invite-link').select();status('Выделите и скопируйте ссылку.');}}
$('copy-invite').onclick=copyInvite;
document.addEventListener('visibilitychange',()=>{if(!document.hidden)clock.tick();});
$('enable-audio').onclick=async()=>{try{await room.audio.play();await room.context?.resume();$('enable-audio').hidden=true;status('Audio enabled.');}catch{status('Audio could not start. Try again.');}};
document.addEventListener('audio-blocked',()=>{$('enable-audio').hidden=false;});
addEventListener('pagehide',()=>{room.leave();});
const showChat=open=>{$('chat-panel').hidden=!open;$('chat-toggle').setAttribute('aria-expanded',String(open));if(open && !$('chat-input').disabled)$('chat-input').focus();};
$('chat-toggle').onclick=()=>showChat($('chat-panel').hidden);
$('chat-close').onclick=()=>showChat(false);
$('chat-form').onsubmit=event=>{event.preventDefault();if(room.sendChat($('chat-input').value))$('chat-input').value='';};
document.addEventListener('keydown',event=>{if(event.key==='Escape')showChat(false);});
addEventListener('online',()=>{if(room.session)status('Network restored · Recovering connection…');});
document.getElementById('copy-diagnostics').onclick=async()=>{
  try { await navigator.clipboard.writeText(diagnosticReport()); status('Connection report copied.'); }
  catch { status('Select the connection log to copy it.'); }
};

$('person-guest').onclick=()=>$('invite').click();
$('more-places').onclick=()=>{$('places-info').hidden=!$('places-info').hidden;};
