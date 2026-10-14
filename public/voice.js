import { logEvent } from './diagnostics.js';
// Own WebRTC voice room: authoritative Node signaling + optional TURN. No third-party account.
export class VoiceRoom {
  constructor({roomId, level, joined, ended, members, chat, chatState, state}) {
    Object.assign(this,{roomId,level,joined,ended,members,chat,chatState,state});
    this.epoch=0; this.muted=false;
    this.audio=document.createElement('audio'); this.audio.autoplay=true; this.audio.setAttribute('playsinline',''); document.body.append(this.audio);
  }
  static async create() {
    const response = await fetch('/api/room/create',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(7000)});
    const result = await response.json().catch(()=>({}));
    logEvent('room.response',{action:'create',http:response.status,code:response.ok?'OK':result.error});
    if (!response.ok) throw new Error(result.error || 'NETWORK_ERROR');
    return result.room;
  }
  async request(action, body={}, extra={}) {
    const response = await fetch(action==='config'?'/api/config':'/api/room/'+action,{method:'POST',headers:{'Content-Type':'application/json',...(this.session?{Authorization:'Bearer '+this.session.token}:{})},body:JSON.stringify({...body,room:this.roomId,...(this.session?{id:this.session.id}:{})}),signal:AbortSignal.timeout(7000),...extra});
    const result = await response.json().catch(()=>({}));
    if (action !== 'poll' || !response.ok) logEvent('room.response',{action,http:response.status,code:response.ok?'OK':result.error});
    if (!response.ok) throw new Error(result.error || 'SERVER_ERROR');
    return result;
  }
  async enter() {
    const epoch = ++this.epoch;
    logEvent('connection.start');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('HTTPS_REQUIRED');
      this.state('mic');
      this.context = new AudioContext();
      await this.context.resume().catch(()=>{});
      logEvent('microphone.request');
      const stream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
      if (epoch !== this.epoch) { stream.getTracks().forEach(t=>t.stop()); return; }
      this.stream = stream;
      logEvent('microphone.ready');
      this.state('joining');
      const session = await this.request('join');
      if (epoch !== this.epoch) { this.session=session; await this.request('leave').catch(()=>{}); this.session=null; return; }
      this.session=session;
      this.configuration = await this.request('config');
      logEvent('configuration.ready',{http:200});
      if (epoch !== this.epoch) return;
      this.monitor(stream,'local');
      this.joined();
      await this.update(session.members);
      this.poll(epoch);
    } catch (error) {
      if (epoch !== this.epoch) return;
      const code = error.message === 'Failed to fetch' ? 'NETWORK_ERROR' : error.name === 'Error' ? error.message : error.name;
      logEvent('connection.error',{code});
      await this.leave(code);
    }
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
    if (!peer || this.pc) return;
    this.peer=peer.id;
    const pc=this.pc=new RTCPeerConnection(this.configuration);
    pc.ondatachannel=event=>{if(this.pc===pc && event.channel.label==='chat')this.attachChat(event.channel);};
    const offerer = members[0].id===this.session.id;
    if(offerer)this.attachChat(pc.createDataChannel('chat'));
    this.candidates=[];
    this.stream.getTracks().forEach(track=>pc.addTrack(track,this.stream));
    pc.onicecandidate=event=>{if(event.candidate && this.pc===pc) this.send({type:'candidate',candidate:event.candidate.toJSON()}).catch(()=>{});};
    pc.ontrack=async event=>{
      if(this.pc!==pc) return;
      const remote=event.streams[0] || new MediaStream([event.track]);
      this.audio.srcObject=remote; this.monitor(remote,'remote');
      try {await this.audio.play();} catch {document.dispatchEvent(new Event('audio-blocked'));}
    };
    pc.onconnectionstatechange=()=>{
      if(this.pc!==pc) return;
      logEvent('audio.connection',{state:pc.connectionState});
      this.state(pc.connectionState==='connected'?'connected':pc.connectionState==='disconnected'?'unstable':pc.connectionState==='failed'?'failed':'linking');
      if(pc.connectionState==='failed') this.closePeer();
    };
    this.state('linking');
    if (offerer) {await pc.setLocalDescription(await pc.createOffer()); await this.send({type:'offer',sdp:pc.localDescription.sdp});}
  }
  async send(payload) { return this.request('signal',{target:this.peer,payload}); }
  attachChat(channel) {
    this.channel=channel;
    channel.onopen=()=>this.chatState?.(true);
    channel.onclose=()=>{if(this.channel===channel)this.chatState?.(false);};
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
      if(pc.remoteDescription) await pc.addIceCandidate(payload.candidate).catch(()=>{});
      else this.candidates.push(payload.candidate);
    } else {
      await pc.setRemoteDescription({type:payload.type,sdp:payload.sdp});
      for(const c of this.candidates.splice(0)) await pc.addIceCandidate(c).catch(()=>{});
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
        if(error.message==='SESSION_EXPIRED' || error.message==='ROOM_NOT_FOUND' || ++failures>=6) {await this.leave(error.message==='SESSION_EXPIRED'?'WAIT_ENDED':error.message); return;}
        this.state('reconnecting');
      }
      await new Promise(resolve=>this.timer=setTimeout(resolve,700));
    }
  }
  mute() {this.muted=!this.muted; this.stream?.getAudioTracks().forEach(t=>t.enabled=!this.muted); return this.muted;}
  closePeer() {
    if(this.channel){this.channel.onclose=null;this.channel.onmessage=null;this.channel.close();this.channel=null;}
    this.chatState?.(false);
    if(this.pc){this.pc.onicecandidate=this.pc.ontrack=this.pc.onconnectionstatechange=this.pc.ondatachannel=null;this.pc.close();}
    this.pc=null; this.peer=null; this.audio.pause(); this.audio.srcObject=null;
    this.monitors?.remote?.source.disconnect();
    if(this.monitors) delete this.monitors.remote;
  }
  async leave(reason='LEFT') {
    logEvent('microphone.stopping');
    ++this.epoch; clearTimeout(this.timer);
    const session=this.session; this.session=null;
    this.closePeer();
    this.stream?.getTracks().forEach(t=>t.stop()); this.stream=null;
    cancelAnimationFrame(this.frame); this.frame=null;
    this.monitors={}; await this.context?.close().catch(()=>{}); this.context=null;
    this.muted=false; this.level({local:0,remote:0}); this.ended(reason);
    if(session) try {await fetch('/api/room/leave',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.token},body:JSON.stringify({id:session.id,room:this.roomId}),signal:AbortSignal.timeout(3000)});} catch {}
  }
}
