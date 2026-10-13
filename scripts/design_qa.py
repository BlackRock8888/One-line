import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  c=await b.new_context(device_scale_factor=2)
  page=await c.new_page();errors=[];failed=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:failed.append(str(r.status)+' '+r.url) if r.status>=400 and 'favicon' not in r.url else None)
  await page.goto(os.environ.get('BASE_URL','http://127.0.0.1:3400'))
  await page.evaluate('document.fonts.ready')
  for w,h in [(320,568),(390,844),(430,932),(768,1024),(1440,900)]:
   await page.set_viewport_size({'width':w,'height':h})
   assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),w
   assert await page.locator('#connect').evaluate('e=>e.getBoundingClientRect().height>=48')
   if w<=430: assert await page.locator('#connect').evaluate('e=>e.getBoundingClientRect().bottom<=innerHeight'),(w,h)
  assert await page.evaluate("document.fonts.check('500 16px Manrope')")
  assert await page.evaluate("document.fonts.check('italic 16px \"Instrument Serif\"')")
  Path('artifacts').mkdir(exist_ok=True)
  for w,h,name in [(390,844,'design-mobile-v2'),(1440,900,'design-desktop-v2')]:
   await page.set_viewport_size({'width':w,'height':h})
   await page.screenshot(path='artifacts/'+name+'.png',full_page=True)
  await page.emulate_media(reduced_motion='reduce')
  assert await page.locator('.avatar img').evaluate('e=>getComputedStyle(e).animationName')=='none'
  await page.keyboard.press('Tab')
  assert await page.evaluate('document.activeElement.tagName')=='A'
  assert not errors,errors
  assert not failed,failed
  print(json.dumps({'result':'PASS','checks':['5 responsive sizes without horizontal overflow','48px or larger primary touch target','both local fonts loaded','reduced motion','keyboard focus'],'errors':errors,'failed_resources':failed}))
  await b.close()
asyncio.run(main())
