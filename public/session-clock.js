export class SessionClock {
 constructor({now=()=>Date.now(),render,expire}){Object.assign(this,{now,render,expire});}
 update(count){
  if(!count){this.reset();return;}
  if(count>1){this.waitUntil=null;this.talkSince ??= this.now();}
  else {this.talkSince=null;this.waitUntil ??= this.now()+60000;}
  this.tick();
 }
 tick(){
  if(this.waitUntil!=null){const seconds=Math.max(0,Math.ceil((this.waitUntil-this.now())/1000));this.render('waiting',seconds);if(!seconds){this.reset();this.expire();}}
  else if(this.talkSince!=null)this.render('talking',Math.floor((this.now()-this.talkSince)/1000));
 }
 reset(){this.waitUntil=null;this.talkSince=null;this.render('off',0);}
}
