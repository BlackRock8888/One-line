export async function proxy(request, path, origin = process.env.SIGNALING_ORIGIN) {
  const reply = (status,error) => Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
  if (request.method !== 'POST') return reply(405,'METHOD_NOT_ALLOWED');
  if (!origin) return reply(503,'SERVER_UNCONFIGURED');
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return reply(403,'ORIGIN_DENIED');
  try {
    const upstream = new URL(origin);
    if (upstream.username || upstream.password || !['https:','http:'].includes(upstream.protocol)) return reply(503,'SERVER_UNCONFIGURED');
    if (process.env.VERCEL && upstream.protocol !== 'https:') return reply(503,'SERVER_UNCONFIGURED');
    const body = await request.text();
    if (Buffer.byteLength(body) > 32768) return reply(413,'BODY_TOO_LARGE');
    const headers = {'Content-Type':'application/json'};
    const token = request.headers.get('authorization');
    if (token) headers.Authorization = token;
    const response = await fetch(new URL(path,upstream),{method:'POST',headers,body,redirect:'error',signal:AbortSignal.timeout(6000)});
    return new Response(await response.text(),{status:response.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  } catch { return reply(502,'ROOM_SERVICE_UNAVAILABLE'); }
}
