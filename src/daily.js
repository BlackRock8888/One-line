export async function dailySession(request, {key=process.env.DAILY_API_KEY, fetcher=fetch}={}) {
 const reply=(status,error)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
 if(request.method!=='POST')return reply(405,'METHOD_NOT_ALLOWED');
 if(request.headers.get('origin') && request.headers.get('origin')!==new URL(request.url).origin)return reply(403,'ORIGIN_DENIED');
 if(!key)return reply(503,'DAILY_UNCONFIGURED');
 let input;
 try {const body=await request.text();if(body.length>2048)return reply(413,'BODY_TOO_LARGE');input=JSON.parse(body);}catch{return reply(400,'INVALID_JSON');}
 if(!/^[a-f0-9]{32}$/.test(input.room || ''))return reply(400,'INVALID_ROOM');
 const name='brt-'+input.room;
 const api=async(path,body)=>fetcher('https://api.daily.co/v1/'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000)});
 try {
  let response=await api('rooms/'+name);
  if(response.status===404){response=await api('rooms',{name,privacy:'private',properties:{max_participants:2,enable_chat:false,enable_screenshare:false,start_video_off:true,exp:Math.floor(Date.now()/1000)+3600,eject_at_room_exp:true}});if(response.status===400 || response.status===409)response=await api('rooms/'+name);}
  if(!response.ok)return reply(502,'DAILY_ROOM_UNAVAILABLE');
  const room=await response.json();
  if(room.privacy!=='private' || room.config?.max_participants!==2)return reply(502,'DAILY_ROOM_CONFIGURATION');
  const tokenResponse=await api('meeting-tokens',{properties:{room_name:name,is_owner:false,exp:Math.min(room.config.exp || Infinity,Math.floor(Date.now()/1000)+3600),eject_at_token_exp:true,user_name:'Guest',start_video_off:true}});
  if(!tokenResponse.ok)return reply(502,'DAILY_TOKEN_UNAVAILABLE');
  const {token}=await tokenResponse.json();
  if(typeof token!=='string' || !/^https:\/\/[^/]+\.daily\.co\//.test(room.url))return reply(502,'DAILY_RESPONSE_INVALID');
  return Response.json({url:room.url,token},{headers:{'Cache-Control':'no-store'}});
 }catch{return reply(502,'DAILY_UNAVAILABLE');}
}
