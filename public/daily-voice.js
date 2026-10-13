import { logEvent } from './diagnostics.js';
let sdk;
function loadSdk(){
 if(window.DailyIframe)return Promise.resolve();
 return sdk ||= new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://unpkg.com/@daily-co/daily-js@0.85.0/dist/daily-iframe.js';s.onload=()=>window.DailyIframe?resolve():reject(new Error('SDK_UNAVAILABLE'));s.onerror=()=>{sdk=null;reject(new Error('SDK_UNAVAILABLE'));};document.head.append(s);});
}
export class DailyRoom {
 constructor(callbacks){Object.assign(this,callbacks);this.muted=false;this.epoch=0;this.audio=document.createElement('audio');this.audio.autoplay=true;this.audio.setAttribute('playsinline','');document.body.append(this.audio);}
 async enter(){
  const epoch=++this.epoch;
  try {
   logEvent('daily.start');this.status('Preparing your room…');
   const url=new URL(location.href);let id=url.searchParams.get('room');
   if(!/^[a-f0-9]{32}$/.test(id || '')){id=crypto.randomUUID().replaceAll('-','');url.searchParams.set('room',id);history.replaceState(null,'',url);}
   const response=await fetch('/api/daily/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({room:id}),signal:AbortSignal.timeout(25000)});
   const session=await response.json();logEvent('daily.session',{http:response.status,code:response.ok?'OK':session.error});
   if(!response.ok)throw new Error(session.error);
   await loadSdk();if(epoch!==this.epoch)return;
   const call=this.call=window.DailyIframe.createCallObject({audioSource:true,videoSource:false});
   const update=()=>{if(this.call!==call)return;const participants=Object.values(call.participants());const self=participants.find(p=>p.local);this.session={id:self?.session_id};this.members(participants.map(p=>({id:p.session_id,name:p.local?'You':'Your guest'})));this.chatState(participants.length>1);this.status(participants.length>1?'Connected · Just talk.':'Waiting for your guest · Share this page link.');};
   call.on('joined-meeting',()=>{if(this.call!==call)return;this.joined();update();});
   call.on('participant-joined',update);
   call.on('participant-left',update);
   call.on('participant-updated',event=>{if(this.call!==call)return;const p=event.participant;if(!p.local){const track=p.tracks?.audio?.persistentTrack || p.audioTrack;if(track){this.audio.srcObject=new MediaStream([track]);this.audio.play().catch(()=>document.dispatchEvent(new Event('audio-blocked')));}}});
   call.on('app-message',event=>{if(this.call===call && event.data?.type==='chat' && typeof event.data.text==='string' && event.data.text.length<=1000)this.chat(event.data.text,'guest');});
   call.on('error',()=>{if(this.call===call){logEvent('daily.error',{code:'CALL_FAILED'});this.leave().then(()=>this.status('Call failed. Check microphone access or try again.'));}});
   call.on('left-meeting',()=>{if(this.call===call)this.leave();});
   this.status('Allow microphone access to join…');
   await call.join({url:session.url,token:session.token});
  }catch(error){if(epoch===this.epoch){logEvent('daily.error',{code:error.name==='Error'?error.message:error.name});await this.leave();this.status(error.message==='DAILY_UNCONFIGURED'?'Daily API key is not configured yet.':error.message==='SDK_UNAVAILABLE'?'Could not load the call service. Try again.':'Could not enter the room. It may be full or unavailable.');document.getElementById('diagnostics')?.setAttribute('open','');}}
 }
 mute(){this.muted=!this.muted;this.call?.setLocalAudio(!this.muted);return this.muted;}
 sendChat(text){text=text.trim().slice(0,1000);if(!text || !this.call || Object.values(this.call.participants()).length<2)return false;try{this.call.sendAppMessage({type:'chat',text},'*');this.chat(text,'self');return true;}catch{return false;}}
 async leave(){++this.epoch;const call=this.call;this.call=null;this.session=null;this.audio.pause();this.audio.srcObject=null;this.chatState(false);this.level({local:0,remote:0});this.muted=false;this.ended();if(call){try{await call.leave();}catch{}try{await call.destroy();}catch{}}}
}
