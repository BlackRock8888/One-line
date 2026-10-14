import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
export class RoomError extends Error { constructor(code, status) { super(code); this.status = status; } }
export class Room {
  constructor({ now = Date.now, ttl = 45000, aloneMs = 0 } = {}) { this.now = now; this.ttl = ttl; this.aloneMs = aloneMs; this.aloneSince = null; this.members = new Map(); this.touched = now(); }
  expire() {
    const t = this.now();
    for (const [id, member] of this.members) if (member.expires <= t) this.members.delete(id);
    if (this.members.size === 1) { this.aloneSince ??= t; if (this.aloneMs && t - this.aloneSince >= this.aloneMs) this.members.clear(); } else this.aloneSince = null;
    if (this.members.size) this.touched = t;
  }
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
  leave(id, token) { this.authenticate(id, token); this.members.delete(id); this.expire(); return {ok:true}; }
}

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export class Rooms {
  constructor({ now = Date.now, ttl = 45000, aloneMs = 60000, idleMs = 120000, max = 500 } = {}) { Object.assign(this, {now, ttl, aloneMs, idleMs, max}); this.map = new Map(); }
  sweep() { for (const [id, room] of this.map) { room.expire(); if (!room.members.size && this.now() - room.touched > this.idleMs) this.map.delete(id); } }
  create() {
    this.sweep();
    if (this.map.size >= this.max) throw new RoomError('TRY_LATER', 429);
    const bytes = randomBytes(12);
    const id = Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join('');
    this.map.set(id, new Room({now:this.now, ttl:this.ttl, aloneMs:this.aloneMs}));
    return id;
  }
  get(id) {
    const room = typeof id === 'string' ? this.map.get(id) : null;
    if (!room) throw new RoomError('ROOM_NOT_FOUND', 404);
    return room;
  }
}
