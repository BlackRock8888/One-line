import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'])
  c=await b.new_context(viewport={'width':390,'height':844},permissions=['microphone'])
  page=await c.new_page(); errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto('http://127.0.0.1:3000')
  for w,h in [(320,568),(390,844),(1440,900)]:
   await page.set_viewport_size({'width':w,'height':h})
   assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth')
  await page.set_viewport_size({'width':390,'height':844})
  Path('artifacts').mkdir(exist_ok=True)
  await page.screenshot(path='artifacts/iphone-preview.png',full_page=True)
  await page.click('#connect'); await page.wait_for_selector('#controls',state='visible')
  await page.wait_for_timeout(1000)
  assert float(await page.locator('#avatar').evaluate("e=>e.style.getPropertyValue('--level')"))>0
  await page.click('#mute'); assert await page.get_attribute('#mute','aria-pressed')=='true'
  await page.click('#leave'); assert await page.locator('#connect').is_visible()
  await page.emulate_media(reduced_motion='reduce')
  assert await page.locator('.avatar img').evaluate('e=>getComputedStyle(e).animationName')=='none'
  await page.evaluate("() => {navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('denied','NotAllowedError')}}")
  await page.click('#connect'); await page.wait_for_function("document.getElementById('status').textContent.includes('permission denied')")
  assert not errors,errors
  print('PASS: responsive layouts, synthetic microphone reaction, mute, leave, reduced motion, permission denial; no page errors')
  await b.close()
asyncio.run(main())
