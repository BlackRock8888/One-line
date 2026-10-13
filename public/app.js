import { VoiceRoom } from './voice.js';
import { initTelegram } from './telegram.js';
import { diagnosticReport } from './diagnostics.js';
initTelegram();
const $ = id => document.getElementById(id);
const status = message => $('status').textContent = message;
function clearChat(){ $('chat-messages').replaceChildren();$('chat-input').value=''; }
const room = new VoiceRoom({status,
  chat:(text,author)=>{const message=document.createElement('p');message.className='chat-message '+author;message.textContent=text;$('chat-messages').append(message);while($('chat-messages').children.length>100)$('chat-messages').firstChild.remove();message.scrollIntoView({block:'nearest'});},
  chatState:ready=>{$('chat-input').disabled=!ready;$('chat-send').disabled=!ready;$('chat-input').placeholder=ready?'Write a message…':'Waiting for your guest…';if(!ready)clearChat();},
  level:({local,remote})=>{ $('avatar').style.setProperty('--level',Math.max(local,remote).toFixed(3)); $('avatar').style.setProperty('--turn',((local-remote)*4).toFixed(2)+'deg'); },
  joined:()=>{document.body.classList.add('in-room'); $('connect').hidden=true; $('controls').hidden=false; $('hint').textContent='Invite someone you want to hear.';},
  ended:()=>{document.body.classList.remove('in-room'); $('capacity').textContent='0 / 2';$('controls').hidden=true; $('connect').hidden=false; $('connect').disabled=false; $('mute').textContent='Mute'; $('mute').setAttribute('aria-pressed','false'); $('enable-audio').hidden=true; $('hint').textContent='Microphone access only when you connect.';},
  members:members=>{$('capacity').textContent=members.length+' / 2';const self=members.find(m=>m.id===room.session?.id);if(self) document.querySelector('.nickname').textContent=self.name;}
});
$('connect').onclick=async()=>{ $('connect').disabled=true; await room.enter(); };
$('mute').onclick=()=>{const muted=room.mute();$('mute').textContent=muted?'Unmute':'Mute';$('mute').setAttribute('aria-pressed',String(muted));};
$('leave').onclick=async()=>{await room.leave();status('Microphone off. Your next moment is one tap away.');};
$('invite').onclick=async()=>{
 try {await navigator.clipboard.writeText(location.origin+'/');status('Invite link copied · One room, two places.');}
 catch {status('Copy the page address to invite your guest.');}
};
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
