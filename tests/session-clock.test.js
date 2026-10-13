import test from 'node:test';
import assert from 'node:assert/strict';
import {SessionClock} from '../public/session-clock.js';
test('60 second empty-room deadline does not restart on updates and expires once',()=>{
 let now=0,expired=0,last;const c=new SessionClock({now:()=>now,render:(...v)=>last=v,expire:()=>expired++});
 c.update(1);assert.deepEqual(last,['waiting',60]);now=59000;c.update(1);assert.deepEqual(last,['waiting',1]);now=61000;c.tick();c.tick();assert.equal(expired,1);
});
test('guest cancels waiting timer; departure starts a new minute; reset cancels timer',()=>{
 let now=0,expired=0,last;const c=new SessionClock({now:()=>now,render:(...v)=>last=v,expire:()=>expired++});
 c.update(1);now=50000;c.update(2);now=65000;c.tick();assert.deepEqual(last,['talking',15]);assert.equal(expired,0);c.update(1);assert.deepEqual(last,['waiting',60]);c.reset();now=200000;c.tick();assert.equal(expired,0);
});
