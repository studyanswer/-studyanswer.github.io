const assert=require('node:assert/strict');const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
await page.goto('http://127.0.0.1:8082');await page.getByRole('button',{name:'AI기초와활용',exact:true}).click();await page.locator('[data-tab="pdf"]').click();await page.locator('[data-open-pdf]').first().click();await page.waitForFunction(()=>document.querySelector('#pdf-canvas-wrap').getAttribute('aria-busy')==='false');
const session=await page.context().newCDPSession(page);const touch=(type,points)=>session.send('Input.dispatchTouchEvent',{type,touchPoints:points});const a={x:375,y:805,id:1},b={x:200,y:600,id:2};
await touch('touchStart',[a]);assert.ok(await page.locator('#conceal').isHidden(),'first pinch finger must not conceal');
await touch('touchStart',[a,b]);await touch('touchMove',[{...a,x:385,y:825},{...b,x:170,y:560}]);await touch('touchEnd',[]);assert.ok(await page.locator('#conceal').isHidden(),'pinch must not conceal');
// Reset native zoom so later taps use the original viewport coordinates.
await session.send('Emulation.setPageScaleFactor',{pageScaleFactor:1});
await touch('touchStart',[a]);await touch('touchMove',[{...a,y:750}]);await touch('touchEnd',[]);assert.ok(await page.locator('#conceal').isHidden(),'corner drag must not conceal');
await page.touchscreen.tap(375,805);assert.ok(await page.locator('#conceal').isVisible(),'single corner tap conceals');await page.touchscreen.tap(375,805);assert.ok(await page.locator('#conceal').isHidden(),'restore must not conceal again on release');
await page.locator('#pdf-dialog .close-dialog').tap();assert.ok(await page.locator('#pdf-dialog').isHidden(),'close remains usable');
assert.equal(await page.locator('#empty-subject').textContent(),'');console.log('PASS: PDF pinch/drag ignores conceal; single corner tap hides/restores; close works; empty subject message removed');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
