import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'])
  contexts=[await browser.new_context(viewport={'width':390,'height':844},permissions=['microphone']) for _ in range(3)]
  pages=[await c.new_page() for c in contexts]
  errors=[]
  for page in pages:
   page.on('pageerror',lambda e:errors.append(str(e)))
   await page.add_init_script('''window.__pcs=[];const Original=window.RTCPeerConnection;window.RTCPeerConnection=class extends Original {constructor(...args){super(...args);window.__pcs.push(this)}};window.__streams=[];const gum=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async(...args)=>{const s=await gum(...args);window.__streams.push(s);return s}''')
   await page.goto(os.environ.get('BASE_URL','http://127.0.0.1:3000'))
  a,b,c=pages
  await a.click('#connect');await a.wait_for_selector('#controls',state='visible')
  await b.click('#connect');await b.wait_for_selector('#controls',state='visible')
  for page in [a,b]:
   await page.wait_for_function("window.__pcs.at(-1)?.connectionState==='connected'",timeout=20000)
   await page.wait_for_function("document.querySelector('audio').srcObject?.getAudioTracks().length===1")
   await page.wait_for_timeout(1500)
   stats=await page.evaluate("async()=>{const s=await window.__pcs.at(-1).getStats();return [...s.values()].filter(x=>x.type==='inbound-rtp'&&x.kind==='audio').map(x=>({bytes:x.bytesReceived,packets:x.packetsReceived}))}")
   assert stats and stats[0]['bytes']>0,stats
   print('Inbound audio RTP:',json.dumps(stats))
   assert float(await page.locator('#avatar').evaluate("e=>e.style.getPropertyValue('--level')"))>0
  await a.click('#chat-toggle');await b.click('#chat-toggle')
  await a.wait_for_function("!document.getElementById('chat-input').disabled")
  await a.fill('#chat-input','Hello <script>not executable</script>')
  await a.click('#chat-send')
  await b.wait_for_function("document.getElementById('chat-messages').textContent.includes('Hello <script>not executable</script>')")
  assert await b.locator('#chat-messages script').count()==0
  await b.fill('#chat-input','Reply from guest');await b.click('#chat-send')
  await a.wait_for_function("document.getElementById('chat-messages').textContent.includes('Reply from guest')")
  await a.click('#chat-close');await b.click('#chat-close')
  await c.click('#connect');await c.wait_for_function("document.getElementById('status').textContent.includes('ROOM OCCUPIED')")
  assert await c.evaluate("window.__streams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))")
  await a.click('#mute');assert await a.evaluate("window.__streams.at(-1).getAudioTracks()[0].enabled===false")
  await a.click('#leave');assert await a.evaluate("window.__streams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))")
  await b.wait_for_function("document.getElementById('status').textContent.includes('Waiting for your guest')")
  assert await a.locator('#chat-messages').text_content()==''
  assert await b.locator('#chat-messages').text_content()==''
  await c.click('#connect')
  for page in [b,c]: await page.wait_for_function("window.__pcs.at(-1)?.connectionState==='connected'",timeout=20000)
  await c.emulate_media(reduced_motion='reduce'); assert await c.locator('.avatar img').evaluate('e=>getComputedStyle(e).animationName')=='none'
  for w,h in [(320,568),(390,844),(1440,900)]:
   await c.set_viewport_size({'width':w,'height':h});assert await c.evaluate('document.documentElement.scrollWidth<=innerWidth')
  Path('artifacts').mkdir(exist_ok=True)
  await c.set_viewport_size({'width':390,'height':844});await c.screenshot(path='artifacts/call-iphone.png',full_page=True)
  await b.click('#leave');await c.click('#leave')
  await a.evaluate("()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('denied','NotAllowedError')}}")
  await a.click('#connect');await a.wait_for_function("document.getElementById('status').textContent.includes('permission denied')")
  assert not errors,errors
  print('PASS: incoming audio both directions; ephemeral chat both directions, escaped text, cleared on leave; third denied; microphone cleanup; mute; replacement participant; permission denial; responsive layout; no JS errors.')
  await browser.close()
asyncio.run(main())
