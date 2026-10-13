import asyncio,json,os
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=await b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(os.environ.get('BASE_URL','http://127.0.0.1:3960'))
  await page.evaluate('document.fonts.ready');await page.emulate_media(reduced_motion='reduce')
  for w,h in [(320,568),(390,844),(430,932),(1440,900)]:
   await page.set_viewport_size({'width':w,'height':h})
   await page.evaluate("document.body.classList.remove('in-room');document.body.dataset.flow='landing'")
   measure="""()=>Object.fromEntries(['.room-card','.room-heading','.identity','.avatar','.people','.room-action','.status-line'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return [s,[r.x,r.y,r.width,r.height]]}))"""
   baseline=await page.evaluate(measure)
   for state in ['connecting','room','error','landing']:
    await page.evaluate("state=>{document.body.dataset.flow=state;document.body.classList.toggle('in-room',state==='room');document.getElementById('flow-feedback').hidden=state==='landing';document.getElementById('invitation').hidden=state!=='room';document.getElementById('flow-title').textContent='Очень длинное описание ошибки '.repeat(20);document.getElementById('flow-description').textContent='Подробности подключения '.repeat(30);document.getElementById('status').textContent='Состояние '.repeat(40);}",state)
    assert await page.evaluate(measure)==baseline,(w,state,baseline,await page.evaluate(measure))
    assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert not errors,errors
  print(json.dumps({'result':'PASS','checks':['4 viewports','landing/connecting/room/error keep identical frame and element bounds','long text cannot expand containers','no horizontal overflow','no JavaScript errors']}))
  await b.close()
asyncio.run(main())
