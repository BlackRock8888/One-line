import test from 'node:test';
import assert from 'node:assert/strict';
import { Room } from '../src/room.js';
import { createApp } from '../src/http.js';
test('two slots, authenticated signaling, leave and TTL recovery', () => {
  let now = 0;
  const room = new Room({now:()=>now, ttl:100});
  const a = room.join(), b = room.join();
  assert.throws(()=>room.join(), /ROOM_OCCUPIED/);
  assert.throws(()=>room.poll(a.id, b.token), /SESSION_EXPIRED/);
  room.signal(a.id,a.token,b.id,{type:'offer',sdp:'test'});
  const events = room.poll(b.id,b.token).events;
  assert.equal(events[0].from,a.id);
  assert.equal(room.poll(b.id,b.token).events.length,0);
  room.leave(a.id,a.token);
  assert.equal(room.join().members.length,2);
  now = 101;
  assert.equal(room.join().members.length,1);
});
test('concurrent HTTP join accepts exactly two; third cannot signal; leave frees a slot', async () => {
  const server = createApp();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (action, body, token) => fetch(base+'/api/room/'+action,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
  try {
    const results = await Promise.all(Array.from({length:10},()=>post('join',{})));
    assert.equal(results.filter(r=>r.status===200).length,2);
    assert.equal(results.filter(r=>r.status===409).length,8);
    const members = await Promise.all(results.filter(r=>r.status===200).map(r=>r.json()));
    assert.equal((await post('signal',{id:members[0].id,target:members[1].id,payload:{type:'offer'}},'forged')).status,401);
    assert.equal((await post('leave',{id:members[0].id},members[0].token)).status,200);
    assert.equal((await post('join',{})).status,200);
    assert.equal((await fetch(base+'/api/room/join')).status,405);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
test('authenticated TURN configuration and stateless Vercel proxy preserve the two-slot limit', async () => {
  const {proxy} = await import('../src/proxy.js');
  const {iceConfiguration} = await import('../src/ice.js');
  const server = createApp({getIce:id=>iceConfiguration(id,{TURN_URLS:'["turns:example.com:443?transport=tcp"]',TURN_SECRET:'test-only'},0)});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const post=(action,body={},token)=>proxy(new Request('https://talk.example.com'+action,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)}),action,origin);
  try {
    assert.equal((await post('/api/config')).status,401);
    const a=await (await post('/api/room/join')).json();
    const b=await (await post('/api/room/join')).json();
    assert.equal((await post('/api/room/join')).status,409);
    const config=await (await post('/api/config',{id:a.id},a.token)).json();
    assert.equal(config.iceServers[0].username,'3600:'+a.id);
    assert.ok(config.iceServers[0].credential);
    await post('/api/room/leave',{id:a.id},a.token);
    await post('/api/room/leave',{id:b.id},b.token);
    assert.equal((await proxy(new Request('https://talk.example.com/api/room/join',{method:'POST'}),'/api/room/join','')).status,503);
    assert.equal((await proxy(new Request('https://talk.example.com/api/room/join',{method:'POST',headers:{Origin:'https://other.example.com'}}),'/api/room/join',origin)).status,403);
  } finally {await new Promise(resolve=>server.close(resolve));}
});
