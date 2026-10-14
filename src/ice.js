import { createHmac } from 'node:crypto';
const PUBLIC_STUN = [{urls:['stun:stun.l.google.com:19302','stun:stun.cloudflare.com:3478']}];
export function iceConfiguration(id, env = process.env, now = Date.now()) {
  if (env.TURN_URLS && env.TURN_SECRET) {
    const username = `${Math.floor(now / 1000) + 3600}:${id}`;
    return {iceServers:[...PUBLIC_STUN,{urls:JSON.parse(env.TURN_URLS),username,credential:createHmac('sha1',env.TURN_SECRET).update(username).digest('base64')}]};
  }
  return {iceServers:env.ICE_SERVERS_JSON ? JSON.parse(env.ICE_SERVERS_JSON) : PUBLIC_STUN};
}
