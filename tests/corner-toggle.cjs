const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
 await page.goto('http://127.0.0.1:8082');await page.locator('.subject-chip').nth(6).waitFor();
 await page.getByRole('button',{name:'AI기초와활용',exact:true}).click();
 await page.locator('#note-search').fill('KNN');
 await page.touchscreen.tap(380,10);assert.ok(await page.locator('#conceal').isVisible());
 await page.touchscreen.tap(190,420);assert.ok(await page.locator('#conceal').isVisible());
 await page.touchscreen.tap(380,10);assert.ok(await page.locator('#conceal').isHidden());
 assert.equal(await page.locator('#note-search').inputValue(),'KNN');
 await page.touchscreen.tap(380,834);assert.ok(await page.locator('#conceal').isVisible());
 await page.touchscreen.tap(20,834);assert.ok(await page.locator('#conceal').isVisible());
 await page.touchscreen.tap(380,834);assert.ok(await page.locator('#conceal').isHidden());
 await page.locator('#add-note').click();assert.ok(await page.locator('#note-dialog').isVisible());
 await page.touchscreen.tap(380,10);assert.ok(await page.locator('#conceal').isVisible());
 assert.equal(await page.locator('#note-dialog').evaluate(e=>getComputedStyle(e).visibility),'hidden');
 await page.touchscreen.tap(380,10);assert.ok(await page.locator('#note-dialog').isVisible());
 await page.locator('#note-dialog .close-dialog').click();
 await page.locator('#start-review').click();await page.locator('#review-card').click();
 await page.touchscreen.tap(380,834);assert.ok(await page.locator('#conceal').isVisible());
 await page.touchscreen.tap(380,834);assert.equal(await page.locator('#review-progress').innerText(),'1 / 28');assert.ok(await page.locator('#review-answer').isVisible());
 console.log('PASS: single-touch top/bottom toggles, other regions ignored while hidden, search/modal/review state retained');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
