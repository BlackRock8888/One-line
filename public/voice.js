import { logEvent } from './diagnostics.js';
export class VoiceRoom {
  constructor({status, level, joined, ended, members, chat, chatState}) { Object.assign(this,{status,level,joined,ended,members,chat,chatState}); this.epoch=0; this.muted=false; this.audio = document.createElement('audio'); this.audio.autoplay=true; this.audio.setAttribute('playsinline',''); document.body.append(this.audio); }
  async request(action, body={}) {
    const response = await fetch('/api/room/'+action,{method:'POST',headers:{'Content-Type':'application/json',...(this.session?{Authorization:'Bearer '+this.session.token}:{})},body:JSON.stringify({...body,...(this.session?{id:this.session.id}:{})}),signal:AbortSignal.timeout(7000)});
    const result = await response.json();
    if (action !== 'poll' || !response.ok) logEvent('room.response',{action,http:response.status,code:response.ok?'OK':result.error});
    if (!response.ok) throw new Error(result.error);
    return result;
  }
  async enter() {
    const epoch = ++this.epoch;
    logEvent('connection.start');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('HTTPS_REQUIRED');
      this.context = new AudioContext();
      await this.context.resume();
      this.status('Allow microphone access to enter the room…');
      logEvent('microphone.request');
      const stream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
      if (epoch !== this.epoch) { stream.getTracks().forEach(t=>t.stop()); return; }
      this.stream = stream;
      logEvent('microphone.ready');
      this.status('Joining the room…');
      const session = await this.request('join');
      if (epoch !== this.epoch) { await fetch('/api/room/leave',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.token},body:JSON.stringify({id:session.id})}); return; }
      this.session=session;
      const configResponse = await fetch('/api/config',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.token},body:JSON.stringify({id:session.id}),signal:AbortSignal.timeout(7000)});
      if (!configResponse.ok) throw new Error('CONFIG_UNAVAILABLE');
      logEvent('configuration.ready',{http:configResponse.status});
      this.configuration = await configResponse.json();
      if (epoch !== this.epoch) return;
      this.monitor(stream,'local');
      this.joined();
      this.status('Waiting for your guest · Share this page link.');
      await this.update(session.members);
      this.poll(epoch);
    } catch (error) { if (epoch === this.epoch) { logEvent('connection.error',{code:error.message === 'Failed to fetch' ? 'NETWORK_ERROR' : error.name === 'Error' ? error.message : error.name}); await this.leave(); this.status(this.message(error)); document.getElementById('diagnostics')?.setAttribute('open',''); } }
  }
  message(error) {
    return ({SERVER_UNCONFIGURED:'Room service is not configured yet. Please try again later.',ROOM_OCCUPIED:'ROOM OCCUPIED · This room is for two. Try again when a place opens.',SESSION_EXPIRED:'Your place expired. Tap Connect to rejoin.',TRY_LATER:'Too many attempts. Please wait a minute.',HTTPS_REQUIRED:'Open this page over HTTPS to use your microphone.',NotAllowedError:'Microphone permission denied. Allow access in your browser and try again.',NotFoundError:'No microphone found. Connect one and try again.'})[error.message] || ({NotAllowedError:'Microphone permission denied. Allow access in your browser and try again.',NotFoundError:'No microphone found.'})[error.name] || 'Connection interrupted. Tap Connect to try again.';
  }
  monitor(stream,kind) {
    const analyser=this.context.createAnalyser(); analyser.fftSize=512;
    const source=this.context.createMediaStreamSource(stream); source.connect(analyser);
    this.monitors ||= {};
    this.monitors[kind]?.source.disconnect();
    this.monitors[kind]={analyser,source,data:new Float32Array(512),value:0};
    if (!this.frame) {
      const tick=()=>{
        const values={local:0,remote:0};
        for (const [key, m] of Object.entries(this.monitors || {})) {
          m.analyser.getFloatTimeDomainData(m.data);
          const rms=Math.sqrt(m.data.reduce((s,v)=>s+v*v,0)/m.data.length);
          m.value += ((key==='local' && this.muted ? 0 : Math.min(1,rms*8))-m.value)*.18;
          values[key]=m.value;
        }
        this.level(values); this.frame=requestAnimationFrame(tick);
      }; tick();
    }
  }
  async update(members) {
    this.members(members);
    const peer=members.find(m=>m.id!==this.session.id);
    if (this.peer && this.peer!==peer?.id) this.closePeer();
    if (!peer) {this.status('Waiting for your guest · Share this page link.'); return;}
    if (this.pc) return;
    this.peer=peer.id;
    const pc=this.pc=new RTCPeerConnection(this.configuration);
    pc.ondatachannel=event=>{if(this.pc===pc && event.channel.label==='chat')this.attachChat(event.channel);};
    if(members[0].id===this.session.id)this.attachChat(pc.createDataChannel('chat'));
    this.candidates=[];
    this.stream.getTracks().forEach(track=>pc.addTrack(track,this.stream));
    pc.onicecandidate=event=>{if(event.candidate && this.pc===pc) this.send({type:'candidate',candidate:event.candidate.toJSON()}).catch(()=>this.status('Signaling interrupted · Rejoin if audio stops.'));};
    pc.ontrack=async event=>{
      if(this.pc!==pc) return;
      const remote=event.streams[0] || new MediaStream([event.track]);
      this.audio.srcObject=remote; this.monitor(remote,'remote');
      try {await this.audio.play();} catch {this.status('Tap Enable audio to hear your guest.'); document.dispatchEvent(new Event('audio-blocked'));}
    };
    pc.onconnectionstatechange=()=>{
      if(this.pc!==pc) return;
      logEvent('audio.connection',{state:pc.connectionState});
      if(pc.connectionState==='connected') this.status('Connected · Just talk.');
      else if(pc.connectionState==='failed') this.status('Audio connection failed · Leave and rejoin. TURN may be required.');
      else if(pc.connectionState==='disconnected') this.status('Connection interrupted · Waiting for recovery…');
    };
    this.status('Connecting your voices…');
    // Join order defines the offerer; no offer collision between the two peers.
    if (members[0].id===this.session.id) {await pc.setLocalDescription(await pc.createOffer()); await this.send({type:'offer',sdp:pc.localDescription.sdp});}
  }
  async send(payload) { return this.request('signal',{target:this.peer,payload}); }
  attachChat(channel) {
    this.channel=channel;
    channel.onopen=()=>this.chatState?.(true);
    channel.onclose=()=>this.chatState?.(false);
    channel.onmessage=event=>{
      if(this.channel!==channel || typeof event.data!=='string' || event.data.length>2000)return;
      try {const message=JSON.parse(event.data);if(typeof message.text==='string' && message.text.length<=1000)this.chat?.(message.text,'guest');}catch{}
    };
  }
  sendChat(text) {
    text=text.trim().slice(0,1000);
    if(!text || this.channel?.readyState!=='open')return false;
    try {this.channel.send(JSON.stringify({text}));this.chat?.(text,'self');return true;}catch{return false;}
  }
  async receive({from,payload}) {
    const pc=this.pc;
    if (!pc || from!==this.peer) return;
    if(payload.type==='candidate') {
      if(pc.remoteDescription) await pc.addIceCandidate(payload.candidate);
      else this.candidates.push(payload.candidate);
    } else {
      await pc.setRemoteDescription({type:payload.type,sdp:payload.sdp});
      for(const c of this.candidates.splice(0)) await pc.addIceCandidate(c);
      if(payload.type==='offer') {await pc.setLocalDescription(await pc.createAnswer()); await this.send({type:'answer',sdp:pc.localDescription.sdp});}
    }
  }
  async poll(epoch) {
    let failures=0;
    while(epoch===this.epoch && this.session) {
      try {
        const result=await this.request('poll');
        if(epoch!==this.epoch) return;
        await this.update(result.members);
        for(const event of result.events) await this.receive(event);
        failures=0;
      } catch(error) {
        if(epoch!==this.epoch) return;
        if(error.message==='SESSION_EXPIRED' || ++failures>=5) {await this.leave(); this.status(this.message(error)); return;}
        this.status('Reconnecting to the room…');
      }
      await new Promise(resolve=>this.timer=setTimeout(resolve,700));
    }
  }
  mute() {this.muted=!this.muted; this.stream?.getAudioTracks().forEach(t=>t.enabled=!this.muted); return this.muted;}
  closePeer() {
    if(this.channel){this.channel.onclose=null;this.channel.onmessage=null;this.channel.close();this.channel=null;}
    this.chatState?.(false);
    this.pc?.close(); this.pc=null; this.peer=null; this.audio.pause(); this.audio.srcObject=null;
    this.monitors?.remote?.source.disconnect();
    if(this.monitors) delete this.monitors.remote;
  }
  async leave() {
    logEvent('microphone.stopping');
    ++this.epoch;
    const session=this.session; this.session=null;
    this.closePeer();
    this.stream?.getTracks().forEach(t=>t.stop()); this.stream=null;
    cancelAnimationFrame(this.frame); this.frame=null;
    this.monitors={}; await this.context?.close().catch(()=>{}); this.context=null;
    this.muted=false; this.level({local:0,remote:0}); this.ended();
    if(session) try {await fetch('/api/room/leave',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.token},body:JSON.stringify({id:session.id}),signal:AbortSignal.timeout(3000)});} catch {}
  }
}
