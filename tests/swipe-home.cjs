const assert=require('node:assert/strict');const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await page.goto('http://127.0.0.1:8082');await page.locator('.subject-chip').nth(6).waitFor();await page.getByRole('button',{name:'AI기초와활용',exact:true}).click();
const cdp=await page.context().newCDPSession(page);
async function swipe(x,y,endX,endY){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(endX-x)*i/5,y:y+(endY-y)*i/5}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
await swipe(40,420,220,430);assert.ok(await page.locator('#app.home-view').isVisible());assert.equal(await page.locator('#app button:visible').count(),7);
await page.getByRole('button',{name:'AI기초와활용',exact:true}).click();await swipe(220,500,40,500);assert.ok(await page.locator('#app.subject-view').isVisible());await swipe(130,550,140,320);assert.ok(await page.locator('#app.subject-view').isVisible());assert.ok(await page.evaluate(()=>scrollY>0));
await page.touchscreen.tap(380,10);await swipe(40,420,220,430);assert.ok(await page.locator('#conceal').isVisible());await page.touchscreen.tap(380,10);assert.ok(await page.locator('#app.subject-view').isVisible());
console.log('PASS: touch swipe home, left swipe ignored, vertical scrolling preserved, conceal isolated');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
