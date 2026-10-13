import asyncio,json,os
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  c=await b.new_context(locale='ru-RU',viewport={'width':390,'height':844});page=await c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(os.environ.get('BASE_URL','http://127.0.0.1:3980'))
  await page.wait_for_function("document.documentElement.lang==='ru'")
  for lang,text,direction in [('en','Enter the room','ltr'),('ar','دخول الغرفة','rtl'),('ru','Войти в комнату','ltr')]:
   await page.select_option('#language',lang);await page.wait_for_function('v=>document.getElementById("connect").textContent.includes(v)',arg=text)
   assert await page.locator('html').get_attribute('dir')==direction
   assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  await page.reload();await page.wait_for_function("document.documentElement.lang==='ru'")
  assert not errors,errors
  print(json.dumps({'result':'PASS','checks':['device language','three language switch','Arabic RTL','no horizontal overflow','persisted selection','no JS errors']}))
  await b.close()
asyncio.run(main())
