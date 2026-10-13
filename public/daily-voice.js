import { logEvent } from './diagnostics.js';
let sdk;
function loadSdk(){
 if(window.Daily)return Promise.resolve();
 return sdk ||= new Promise((resolve,reject)=>{
 const s=document.createElement('script');let done=false;
 const finish=error=>{if(done)return;done=true;clearTimeout(timer);if(error){sdk=null;s.remove();reject(error);}else resolve();};
 const timer=setTimeout(()=>finish(new Error('SDK_TIMEOUT')),15000);
 s.src='/vendor/daily-0.85.0.js';s.onload=()=>finish(window.Daily?null:new Error('SDK_UNAVAILABLE'));s.onerror=()=>finish(new Error('SDK_UNAVAILABLE'));document.head.append(s);
 });
}
export class DailyRoom {
 constructor(callbacks){Object.assign(this,callbacks);this.muted=false;this.epoch=0;this.audio=document.createElement('audio');this.audio.autoplay=true;this.audio.setAttribute('playsinline','');document.body.append(this.audio);}
 async enter(){
  const epoch=++this.epoch;this.hasJoined=false;
  try {
   this.stage?.('Создаём комнату','Подготавливаем защищённое подключение.');logEvent('daily.start');this.status('Preparing your room…');
   const url=new URL(location.href);let id=url.searchParams.get('room');
   if(!/^[a-f0-9]{32}$/.test(id || '')){id=crypto.randomUUID().replaceAll('-','');url.searchParams.set('room',id);history.replaceState(null,'',url);}
   const response=await fetch('/api/daily/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({room:id}),signal:AbortSignal.timeout(25000)});
   const session=await response.json();logEvent('daily.session',{http:response.status,code:response.ok?'OK':session.error});
   if(!response.ok)throw new Error(session.error);
   if(epoch!==this.epoch)return;this.isPrepared=true;this.prepared?.();logEvent('daily.room-created');
   this.stage?.('Загружаем звонок','Подключаем голосовой сервис.');await loadSdk();if(epoch!==this.epoch)return;
   const call=this.call=window.Daily.createCallObject({audioSource:true,videoSource:false});
   const update=()=>{if(this.call!==call)return;const participants=Object.values(call.participants());const self=participants.find(p=>p.local);this.session={id:self?.session_id};this.members(participants.map(p=>({id:p.session_id,name:p.local?'You':'Your guest'})));this.chatState(participants.length>1);this.status(participants.length>1?'Connected · Just talk.':'Waiting for your guest · Share this page link.');};
   call.on('joined-meeting',()=>{if(this.call!==call)return;this.hasJoined=true;logEvent('daily.joined');this.joined();update();Promise.resolve(call.startLocalAudioLevelObserver?.()).catch(()=>logEvent('daily.level',{code:'LOCAL_OBSERVER_UNAVAILABLE'}));Promise.resolve(call.startRemoteParticipantsAudioLevelObserver?.()).catch(()=>logEvent('daily.level',{code:'REMOTE_OBSERVER_UNAVAILABLE'}));});
   const levels={local:0,remote:0};call.on('local-audio-level',event=>{if(this.call===call){levels.local=this.muted?0:Math.min(1,event.audioLevel || 0);this.level(levels);}});call.on('remote-participants-audio-level',event=>{if(this.call===call){levels.remote=Math.max(0,...(Array.isArray(event.participantsAudioLevel)?event.participantsAudioLevel:[]).map(p=>p.audioLevel || 0));this.level(levels);}});
   for(const name of ['loading','loaded','load-attempt-failed','joining-meeting'])call.on(name,()=>{if(this.call===call){logEvent('daily.'+name);if(name==='loading')this.stage?.('Загружаем голосовой модуль','Подключаемся к инфраструктуре Daily.');if(name==='joining-meeting')this.stage?.('Входим в комнату','Завершаем подключение.');}});
   call.on('camera-error',event=>{if(this.call===call)logEvent('daily.media-error',{code:dailyErrorCode(event)});});
   call.on('participant-joined',update);
   call.on('participant-left',update);
   call.on('participant-updated',event=>{if(this.call!==call)return;const p=event.participant;if(!p.local){const track=p.tracks?.audio?.persistentTrack || p.audioTrack;if(track){this.audio.srcObject=new MediaStream([track]);this.audio.play().catch(()=>document.dispatchEvent(new Event('audio-blocked')));}}});
   call.on('app-message',event=>{if(this.call===call && event.data?.type==='chat' && typeof event.data.text==='string' && event.data.text.length<=1000)this.chat(event.data.text,'guest');});
   call.on('error',event=>{if(this.call===call){const code=dailyErrorCode(event);logEvent('daily.error',{code});this.leave({keepRoom:this.isPrepared}).then(()=>{const [title,description]=callError(code);this.failed?.(title,description);this.status(description);});}});
   call.on('left-meeting',()=>{if(this.call===call)this.leave();});
   this.stage?.('Подключаем микрофон','Разрешите доступ в окне браузера. Камера не используется.');this.status('Ожидаем разрешение микрофона…');
   const timeout=setTimeout(()=>{if(this.call===call && !this.hasJoined){logEvent('daily.error',{code:'JOIN_TIMEOUT'});this.leave({keepRoom:this.isPrepared}).then(()=>{const [title,description]=callError('JOIN_TIMEOUT');this.failed?.(title,description);this.status(description);});}},30000);try{await call.join({url:session.url,token:session.token});}finally{clearTimeout(timeout);}
  }catch(error){if(epoch===this.epoch){const code=dailyErrorCode(error);logEvent('daily.error',{code});await this.leave({keepRoom:this.isPrepared});const [title,description]=callError(code);this.failed?.(title,description);this.status(description);document.getElementById('diagnostics')?.setAttribute('open','');}}

 }
 mute(){this.muted=!this.muted;this.call?.setLocalAudio(!this.muted);return this.muted;}
 sendChat(text){text=text.trim().slice(0,1000);if(!text || !this.call || Object.values(this.call.participants()).length<2)return false;try{this.call.sendAppMessage({type:'chat',text},'*');this.chat(text,'self');return true;}catch{return false;}}
 async leave({keepRoom=false}={}){++this.epoch;this.hasJoined=false;const call=this.call;this.call=null;this.session=null;this.audio.pause();this.audio.srcObject=null;this.chatState(false);this.level({local:0,remote:0});this.muted=false;if(!keepRoom){this.isPrepared=false;this.ended();}if(call){for(const p of Object.values(call.participants?.() || {})){if(p.local)p.tracks?.audio?.persistentTrack?.stop();}const bounded=async operation=>{let timer;try{await Promise.race([Promise.resolve().then(operation),new Promise(resolve=>timer=setTimeout(resolve,this.cleanupTimeout || 2000))]);}catch{}finally{clearTimeout(timer);}};await bounded(()=>call.leave());await bounded(()=>call.destroy());}}
}

export function dailyErrorCode(error){
 const text=[error?.name,error?.message,error?.errorMsg,error?.error?.type,error?.error?.msg,typeof error==='string'?error:''].filter(Boolean).join(' ');
 if(/account-missing-payment-method/i.test(text))return 'ACCOUNT_PAYMENT_METHOD_REQUIRED';
 if(/load call object bundle|load.*bundle/i.test(text))return 'BUNDLE_LOAD_FAILED';
 if(/permission|NotAllowed|denied/i.test(text))return 'MICROPHONE_DENIED';
 if(/meeting-full|room-full|max.participant/i.test(text))return 'ROOM_FULL';
 if(/exp-room|exp-token|expired|expir/i.test(text))return 'ROOM_EXPIRED';
 for(const code of ['DAILY_UNCONFIGURED','SDK_TIMEOUT','SDK_UNAVAILABLE','JOIN_TIMEOUT','DAILY_ROOM_UNAVAILABLE','DAILY_TOKEN_UNAVAILABLE','DAILY_UNAVAILABLE'])if(text.includes(code))return code;
 return 'CALL_FAILED';
}
export function callError(code){
 if(code==='ACCOUNT_PAYMENT_METHOD_REQUIRED')return ['Daily блокирует звонок','Аккаунт Daily требует добавить способ оплаты. Комната создана, но звонки пока недоступны. Это не ошибка вашей сети.'];
 if(code==='BUNDLE_LOAD_FAILED')return ['Голосовой модуль не загрузился','Браузер не смог загрузить модуль Daily. Подключение не началось, микрофон выключен.'];
 if(code==='JOIN_TIMEOUT')return ['Вход занял слишком много времени','Daily не подтвердил подключение за 30 секунд. Микрофон выключен; повторите попытку.'];
 if(/DAILY_UNCONFIGURED/.test(code))return ['Сервис ещё не настроен','Не удалось получить доступ к звонку. Микрофон выключен.'];
 if(/SDK_UNAVAILABLE|SDK_TIMEOUT/.test(code))return ['Звонок не загрузился','Не удалось загрузить голосовой сервис. Проверьте сеть и повторите вход.'];
 if(/NotAllowed|permission|denied/i.test(code))return ['Нет доступа к микрофону','Разрешите микрофон в настройках браузера или Telegram и попробуйте снова.'];
 if(/full|max.participant|room.occupied/i.test(code))return ['В комнате уже двое','Подождите, пока освободится место. Дополнительные места пока недоступны.'];
 if(/expired|expir/i.test(code))return ['Срок комнаты истёк','Создайте новую комнату с главной страницы и отправьте новую ссылку.'];
 return ['Подключение прервалось','Войти в комнату не удалось. Микрофон выключен. Повторите попытку; техническая причина указана в журнале ниже.'];
}
