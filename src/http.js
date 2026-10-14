import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dailySession } from './daily.js';
import { Rooms, RoomError } from './room.js';
const files = {'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/voice.js':'voice.js','/fox.svg':'fox.svg','/fox-neon.webp':'fox-neon.webp','/fonts/manrope-variable.ttf':'fonts/manrope-variable.ttf','/fonts/instrument-serif-italic.ttf':'fonts/instrument-serif-italic.ttf'};
files['/vendor/daily-0.85.0.js'] = 'vendor/daily-0.85.0.js';
files['/i18n.js'] = 'i18n.js';
files['/session-clock.js'] = 'session-clock.js';
files['/daily-voice.js'] = 'daily-voice.js';
files['/telegram.js'] = 'telegram.js';
files['/diagnostics.js'] = 'diagnostics.js';
const types = {html:'text/html',css:'text/css',js:'text/javascript',svg:'image/svg+xml',webp:'image/webp',ttf:'font/ttf'};
export function createApp({ rooms = new Rooms(), room = null, iceServers = [], getIce = () => ({iceServers}) } = {}) {
  const attempts = new Map();
  const rateLimit = ip => {
    const now = Date.now();
    for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
    const entry = attempts.get(ip) || {until:now + 60000, count:0};
    if (++entry.count > 60) throw new RoomError('TRY_LATER',429);
    attempts.set(ip, entry);
  };
  return createServer(async (req, res) => {
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Permissions-Policy','microphone=(self), camera=()');
    const json = (code, data) => { res.writeHead(code, {'Content-Type':'application/json'}).end(JSON.stringify(data)); };
    const url = new URL(req.url, 'http://localhost');
    try {
      if(url.pathname==='/api/daily/session'){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>2048){json(413,{error:'BODY_TOO_LARGE'});return;}chunks.push(chunk);}const response=await dailySession(new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})}));res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());return;}
      if (url.pathname.startsWith('/api/room/') || url.pathname === '/api/config') {
        if (req.method !== 'POST') { json(405,{error:'METHOD_NOT_ALLOWED'}); return; }
        if (req.headers.origin && req.headers.origin !== 'http://' + req.headers.host && req.headers.origin !== 'https://' + req.headers.host) { json(403,{error:'ORIGIN_DENIED'}); return; }
        let data = '', size = 0;
        for await (const chunk of req) { size += chunk.length; if (size > 32768) throw new RoomError('BODY_TOO_LARGE',413); data += chunk; }
        let body;
        try { body = JSON.parse(data || '{}'); } catch { throw new RoomError('INVALID_JSON',400); }
        const action = url.pathname.slice('/api/room/'.length);
        const target = () => room || rooms.get(body.room);
        if (action === 'create') {
          if (room) throw new RoomError('NOT_FOUND',404);
          rateLimit(req.socket.remoteAddress);
          json(200, {room: rooms.create()}); return;
        }
        if (action === 'join') {
          rateLimit(req.socket.remoteAddress);
          json(200, target().join()); return;
        }
        const token = req.headers.authorization?.replace(/^Bearer /,'') || body.token;
        if (url.pathname === '/api/config') { target().authenticate(body.id, token); json(200, getIce(body.id)); return; }
        if (action === 'poll') json(200, target().poll(body.id, token));
        else if (action === 'signal') json(200, target().signal(body.id, token, body.target, body.payload));
        else if (action === 'leave') json(200, target().leave(body.id, token));
        else json(404,{error:'NOT_FOUND'});
        return;
      }
      if (req.method !== 'GET' || !files[url.pathname]) { res.writeHead(404).end(); return; }
      const file = files[url.pathname];
      const content = await readFile(new URL('../public/' + file, import.meta.url));
      res.writeHead(200, {'Content-Type':types[file.split('.').pop()]}).end(content);
    } catch (error) { if (!res.headersSent) json(error.status || 500, {error:error instanceof RoomError ? error.message : 'SERVER_ERROR'}); }
  });
}
