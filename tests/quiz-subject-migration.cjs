async function selectSubject(page,name){if(await page.locator('#home').isVisible())await page.locator('#home').click();await page.getByRole('button',{name,exact:true}).first().click()}
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
async function read(page){return page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('secret-note',1);r.onsuccess=()=>{const db=r.result,q=db.transaction('data').objectStore('data').get('state');q.onsuccess=()=>{resolve(q.result);db.close()}}}))}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:8082');await selectSubject(page,'AI기초와활용');await page.locator('.note-row').nth(27).waitFor();
  await page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('secret-note',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('data','readwrite'),store=tx.objectStore('data'),q=store.get('state');q.onsuccess=()=>{const s=q.result,ai=s.subjects.find(x=>x.name==='AI기초와활용');delete s.quizSubjectCorrectionVersion;s.notes=s.notes.filter(n=>n.id!=='ai-basics-quiz-030');for(const n of s.notes){if(n.id.startsWith('ai-basics-quiz-')&&n.number<=14&&Number(n.id.slice(-3))>=29){n.subjectId=ai.id;n.number=Number(n.id.slice(-3))}if(n.id==='ai-basics-quiz-029'){n.marked=true;n.choices[1].explanation='내가 수정한 설명 유지'}}store.put(s,'state')};tx.oncomplete=()=>{db.close();resolve()}}}));
  await page.reload();await page.locator("#app.home-view").waitFor();await selectSubject(page,'AI기초와활용');await page.locator('.note-row').nth(27).waitFor();
  const s=await read(page),ai=s.subjects.find(x=>x.name==='AI기초와활용'),practical=s.subjects.find(x=>x.name==='공학생을위한실용AI');
  assert.equal(s.notes.filter(n=>n.subjectId===ai.id).length,28);
  assert.equal(s.notes.filter(n=>n.subjectId===practical.id).length,27);
  assert.ok(!s.notes.some(n=>n.id==='ai-basics-quiz-030'));
  const moved=s.notes.find(n=>n.id==='ai-basics-quiz-029');assert.equal(moved.subjectId,practical.id);assert.equal(moved.number,1);assert.equal(moved.marked,true);assert.equal(moved.choices[1].explanation,'내가 수정한 설명 유지');
  await selectSubject(page,'공학생을위한실용AI');assert.equal(await page.locator('.note-row').count(),27);assert.match(await page.locator('.note-row').first().innerText(),/1\. 다음 중 OpenAI/);
  await page.reload();await page.locator("#app.home-view").waitFor();await selectSubject(page,'AI기초와활용');await page.locator('.note-row').nth(27).waitFor();assert.equal((await read(page)).notes.length,157);
  page.on('dialog',d=>d.accept());await selectSubject(page,'공학생을위한실용AI');await page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('secret-note',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('data','readwrite'),store=tx.objectStore('data'),q=store.get('state');q.onsuccess=()=>{const s=q.result,id=s.subjects.find(x=>x.name==='공학생을위한실용AI').id;s.subjects=s.subjects.filter(x=>x.id!==id);s.notes=s.notes.filter(x=>x.subjectId!==id);s.documents=s.documents.filter(x=>x.subjectId!==id);store.put(s,'state')};tx.oncomplete=()=>{db.close();resolve()}}}));await page.reload();await page.locator("#app.home-view").waitFor();await selectSubject(page,'AI기초와활용');await page.locator('.note-row').nth(27).waitFor();assert.ok(!(await read(page)).subjects.some(x=>x.name==='공학생을위한실용AI'));
  console.log('PASS: legacy misplaced 14-note migration, subject-local numbering, edited explanations and marks retained, deletion retained, no duplicates, deleted subject stays deleted');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
