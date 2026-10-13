import test from 'node:test';
import assert from 'node:assert/strict';
import { DailyRoom } from '../public/daily-voice.js';
test('Daily client accepts official Daily global and enters the room',async()=>{
 const names=['window','document','location','history','fetch'];const old=Object.fromEntries(names.map(k=>[k,globalThis[k]]));
 let joined=false,destroyed=false;const order=[];const handlers={};
 const call={on:(event,fn)=>{handlers[event]=fn;},participants:()=>({local:{local:true,session_id:'self'}}),join:async()=>handlers['joined-meeting'](),leave:async()=>{},destroy:async()=>{destroyed=true;}};
 try {
  globalThis.window={Daily:{createCallObject:()=>call}};
  globalThis.document={createElement:()=>({setAttribute(){},pause(){}}),body:{append(){}},getElementById:()=>null};
  globalThis.location={href:'https://example.test/?room='+'a'.repeat(32)};globalThis.history={replaceState(){}};
  globalThis.fetch=async()=>Response.json({url:'https://test.daily.co/room',token:'participant'});
  const room=new DailyRoom({status(){},level(){},prepared(){order.push('prepared');},joined(){joined=true;order.push('joined');},ended(){},members(){},chat(){},chatState(){}});
  await room.enter();assert.deepEqual(order,['prepared','joined']);assert.equal(joined,true);assert.equal(room.session.id,'self');await room.leave();assert.equal(destroyed,true);
 }finally{for(const key of names){if(old[key]===undefined)delete globalThis[key];else globalThis[key]=old[key];}}
});
test('connection failures produce actionable, distinct messages',async()=>{
 const {callError}=await import('../public/daily-voice.js');
 assert.match(callError('NotAllowedError')[0],/микрофону/);
 assert.match(callError('SDK_UNAVAILABLE')[0],/загрузился/);
 assert.match(callError('room-full')[0],/двое/);
 assert.match(callError('token-expired')[0],/истёк/);
 assert.match(callError('unknown')[1],/выключен/);
});
test('Daily structured errors retain meaningful safe reason without tokens',async()=>{
 const {dailyErrorCode}=await import('../public/daily-voice.js');
 assert.equal(dailyErrorCode({error:{type:'connection-error',msg:'Failed to load call object bundle.'}}),'BUNDLE_LOAD_FAILED');
 assert.equal(dailyErrorCode({errorMsg:'meeting-full'}),'ROOM_FULL');
 assert.equal(dailyErrorCode({errorMsg:'microphone permission denied'}),'MICROPHONE_DENIED');
 assert.equal(dailyErrorCode({errorMsg:'unknown sensitive URL token=secret'}),'CALL_FAILED');
});
test('cleanup cannot hide failure forever when Daily leave/destroy hang',async()=>{
 const old=globalThis.document;let ended=false,stopped=false;
 globalThis.document={createElement:()=>({setAttribute(){},pause(){}}),body:{append(){}},getElementById:()=>null};
 try{
  const room=new DailyRoom({cleanupTimeout:10,ended:()=>ended=true,level(){},chatState(){}});
  room.call={participants:()=>({local:{local:true,tracks:{audio:{persistentTrack:{stop(){stopped=true;}}}}}}),leave:()=>new Promise(()=>{}),destroy:()=>new Promise(()=>{})};
  await room.leave();assert.equal(ended,true);assert.equal(stopped,true);assert.equal(room.call,null);
 }finally{globalThis.document=old;}
});
