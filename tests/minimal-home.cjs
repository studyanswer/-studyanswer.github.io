const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto('http://127.0.0.1:8082');await page.locator('.subject-chip').nth(6).waitFor();
 assert.equal(await page.locator('#app button:visible').count(),7);
 assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(0, 0, 0)');
 await page.screenshot({path:'/tmp/minimal-home.png'});
 await page.getByRole('button',{name:'AI기초와활용',exact:true}).click();
 assert.equal(await page.locator('.note-row').count(),28);
 assert.equal(await page.locator('#add-note,#add-subject,#delete-subject,[data-edit],[data-delete],[data-delete-pdf]').count(),0);
 const first=page.locator('.note-row').first();
 assert.match(await first.innerText(),/K-means/);
 assert.equal(await first.locator('details').getAttribute('open'),null);
 await first.locator('summary').click();assert.equal(await first.locator('.study-choice:visible').count(),4);
 await page.locator('#note-search').fill('KNN');assert.ok(await page.locator('.note-row').count()>0);
 await page.locator('#note-search').fill('없는검색어987654');assert.match(await page.locator('#notes').innerText(),/검색 결과가 없어요/);
 await page.locator('#note-search').fill('');assert.equal(await page.locator('.note-row').count(),28);
 await page.locator('#start-review').click();await page.locator('#review-card').click();
 await page.locator('#review-answer summary').click();assert.equal(await page.locator('#review-progress').innerText(),'1 / 28');
 assert.equal(await page.locator('#review-answer .study-choice:visible').count(),4);
 await page.locator('#exit-review').click();await page.locator('#home').click();
 await page.setViewportSize({width:320,height:640});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.equal(await page.locator('#app button:visible').count(),7);
 console.log('PASS: seven-button black home, correct-first expandable choices, note search, review expansion, mobile width');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
