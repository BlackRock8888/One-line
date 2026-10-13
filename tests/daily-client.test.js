import test from 'node:test';
import assert from 'node:assert/strict';
import { DailyRoom } from '../public/daily-voice.js';
test('Daily client accepts official Daily global and enters the room',async()=>{
 const names=['window','document','location','history','fetch'];const old=Object.fromEntries(names.map(k=>[k,globalThis[k]]));
 let joined=false,destroyed=false;const handlers={};
 const call={on:(event,fn)=>{handlers[event]=fn;},participants:()=>({local:{local:true,session_id:'self'}}),join:async()=>handlers['joined-meeting'](),leave:async()=>{},destroy:async()=>{destroyed=true;}};
 try {
  globalThis.window={Daily:{createCallObject:()=>call}};
  globalThis.document={createElement:()=>({setAttribute(){},pause(){}}),body:{append(){}},getElementById:()=>null};
  globalThis.location={href:'https://example.test/?room='+'a'.repeat(32)};globalThis.history={replaceState(){}};
  globalThis.fetch=async()=>Response.json({url:'https://test.daily.co/room',token:'participant'});
  const room=new DailyRoom({status(){},level(){},joined(){joined=true;},ended(){},members(){},chat(){},chatState(){}});
  await room.enter();assert.equal(joined,true);assert.equal(room.session.id,'self');await room.leave();assert.equal(destroyed,true);
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
