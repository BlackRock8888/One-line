import { randomUUID, timingSafeEqual } from 'node:crypto';
export class RoomError extends Error { constructor(code, status) { super(code); this.status = status; } }
export class Room {
  constructor({ now = Date.now, ttl = 45000 } = {}) { this.now = now; this.ttl = ttl; this.members = new Map(); }
  expire() { for (const [id, member] of this.members) if (member.expires <= this.now()) this.members.delete(id); }
  view() { return [...this.members.values()].map(({id, name}) => ({id, name})); }
  join() {
    this.expire();
    if (this.members.size >= 2) throw new RoomError('ROOM_OCCUPIED', 409);
    const id = randomUUID(), token = randomUUID();
    const member = {id, token, name: this.members.size ? 'Amber Fox' : 'Quiet Fox', expires:this.now() + this.ttl, events:[]};
    this.members.set(id, member);
    return {id, token, members:this.view(), leaseMs:this.ttl};
  }
  authenticate(id, token) {
    this.expire();
    const member = this.members.get(id);
    if (!member || typeof token !== 'string' || token.length !== member.token.length || !timingSafeEqual(Buffer.from(token),Buffer.from(member.token))) throw new RoomError('SESSION_EXPIRED', 401);
    return member;
  }
  poll(id, token) { const member = this.authenticate(id, token); member.expires = this.now() + this.ttl; return {members:this.view(), events:member.events.splice(0)}; }
  signal(id, token, target, payload) {
    this.authenticate(id, token);
    const peer = this.members.get(target);
    if (!peer || target === id) throw new RoomError('PEER_LEFT', 409);
    if (!payload || !['offer','answer','candidate'].includes(payload.type)) throw new RoomError('INVALID_SIGNAL', 400);
    if (peer.events.length >= 128) throw new RoomError('SIGNAL_QUEUE_FULL', 429);
    peer.events.push({from:id, payload});
    return {ok:true};
  }
  leave(id, token) { this.authenticate(id, token); this.members.delete(id); return {ok:true}; }
}
