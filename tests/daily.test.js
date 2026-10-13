import test from 'node:test';
import assert from 'node:assert/strict';
import { dailySession } from '../src/daily.js';
const id='a'.repeat(32);
const request=body=>new Request('https://example.test/api/daily/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
test('Daily session requires server credential and validates room capability',async()=>{
 assert.equal((await dailySession(request({room:id}),{key:''})).status,503);
 assert.equal((await dailySession(request({room:'../bad'}),{key:'secret'})).status,400);
});
test('Daily creates private two-person room and restricted expiring participant token',async()=>{
 const calls=[];let first=true;
 const fetcher=async(url,options)=>{calls.push({url,...options});if(url.includes('meeting-tokens'))return Response.json({token:'participant-token'});if(options.method==='GET' && first){first=false;return new Response('',{status:404});}return Response.json({url:'https://demo.daily.co/brt-'+id,privacy:'private',config:{max_participants:2,exp:Math.floor(Date.now()/1000)+3600}});};
 const result=await dailySession(request({room:id}),{key:'secret',fetcher});
 assert.equal(result.status,200);assert.equal(result.headers.get('cache-control'),'no-store');
 const room=JSON.parse(calls[1].body);assert.equal(room.properties.max_participants,2);assert.equal(room.privacy,'private');assert.equal(room.properties.start_video_off,true);
 const token=JSON.parse(calls[2].body);assert.equal(token.properties.is_owner,false);assert.equal(token.properties.room_name,'brt-'+id);assert.equal(token.properties.eject_at_token_exp,true);
 assert.equal((await result.json()).token,'participant-token');
});
test('Daily rejects unsafe existing room configuration and hides provider errors',async()=>{
 const bad=await dailySession(request({room:id}),{key:'secret',fetcher:async()=>Response.json({privacy:'public',config:{max_participants:10}})});assert.equal(bad.status,502);
 const down=await dailySession(request({room:id}),{key:'secret',fetcher:async()=>{throw Error('secret');}});assert.equal((await down.json()).error,'DAILY_UNAVAILABLE');
});
