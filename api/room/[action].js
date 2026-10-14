import { proxy } from '../../src/proxy.js';
export async function POST(request) {
  const action = new URL(request.url).pathname.split('/').pop();
  if (!['create','join','poll','signal','leave'].includes(action)) return Response.json({error:'NOT_FOUND'},{status:404});
  return proxy(request,'/api/room/'+action);
}
