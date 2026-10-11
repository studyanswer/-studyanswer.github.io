async function selectSubject(page,name){if(await page.locator('#home').isVisible())await page.locator('#home').click();await page.getByRole('button',{name,exact:true}).first().click()}
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const catalog={notes:[...JSON.parse(fs.readFileSync('quizzes/ai-basics.json')).notes,...JSON.parse(fs.readFileSync('quizzes/practical-ai.json')).notes,...JSON.parse(fs.readFileSync('quizzes/semiconductor-packaging.json')).notes]};
assert.equal(catalog.notes.length,94);
const answers=['K-means','업무 효율성 증가','챗GPT는 데이터베이스 기반으로 답변을 제공한다.','데이터 편향 강화','O','Shift+Enter','X','감마AI','텍스트 변형 기법','퓨샷 러닝','모호한 질문','저작권 침해','O','X','정중한 문장','X','미드저니','O','대화 연결성','X','대화 연결성','O','X','O','X','X','O','문서 요약 및 초안 작성 지원','전문가','새로운 데이터 유입 시 스스로 학습한다.','인간과 구별하기 어려운 외향을 가진다.','X','인간의 뇌 구조를 따라 인공지능을 구현하고자 한다.','사용할 수록 규칙이 간결해졌다.','데이터가 일정 수준을 넘어서면 더 이상 성능이 좋아지지 않음','GAN','스마트폰 앱의 개인 데이터','데이터 크롤링','정렬','Hopeful','트랜스포머','O','Chain of Thought','Model Context Protocol','반복','부정적인 지시어는 대답의 정확성을 떨어뜨린다.','전문가 혼합(Mixture of Experts)','X','프로그래밍 언어','내 컴퓨터에 파이썬이 설치된다.','바이브 코딩','최종 서비스용 소프트웨어를 만들어낸다.','이미지를 토큰으로 처리 문장처럼 생성한다.','고화질 이미지를 생성한다.','고화질 원본','X','원가 절감','3’rd Level Package : PCB','Wire Bonding 공정','Transparent (투명한)','DIP','Wire Bonding 공정','웨이퍼 백-그라인딩 공정','패키지 Saw & Sorter 공정','Rough ggrinding (#300~#500)','Blade','20,000~30,000 rpm','Punch Sawing','몰딩 공정','Package Swa & Sorter 공정','Collet','Adhesive','Molding Loading Fixture','DST(Die Shear Test)','Fixture Loading','Jig Weight','Capillary','Sn Wire','Epoxy Dotting','BST(Ball Shear Test)','경화 공정','22-DIP-400','열저항을 증폭 시킴','Attach Film 방식','Singulation','Lead Frame Pusher','Lamination 부','다이 본딩','Deflash','Singulation','인덱스 업-다운','Annealing 공정','Mask제작 공정','22-DIP-400'];
for(const [i,n] of catalog.notes.entries()){
 assert.equal(n.correct,0);assert.equal(n.choices[0].text,answers[i]);
 assert.equal(n.choices.length,n.type==='ox'?2:4);
 assert.equal(new Set(n.choices.map(c=>c.originalNumber)).size,n.choices.length);
 assert.ok(n.choices.every(c=>c.explanation));
 if(i>=4)assert.equal(n.week,null);
}
async function read(page){return page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('secret-note',1);r.onsuccess=()=>{const db=r.result,q=db.transaction('data').objectStore('data').get('state');q.onsuccess=()=>{resolve(q.result);db.close()}}}))}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8082');await selectSubject(page,'AI기초와활용');await page.locator('.note-row').nth(27).waitFor();
  assert.equal(await page.locator('.note-row').count(),28);
  await selectSubject(page,'반도체패키지공학실무');assert.equal(await page.locator('.note-row').count(),38);assert.match(await page.locator('.correct-choice').first().innerText(),/원가 절감/);await selectSubject(page,'AI기초와활용');
  const first=page.locator('.note-row').first();
  assert.match(await first.locator('.study-choice').first().innerText(),/1\) ✓ 정답 · K-means/);
  assert.match(await first.innerText(),/원문 4번/);
  assert.equal(await first.locator('.study-choice').count(),4);
  assert.equal(await page.locator('.note-row').nth(4).locator('.study-choice').count(),2);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('.note-row').nth(4).getByRole('button',{name:'수정',exact:true}).click();
  assert.equal(await page.locator('#note-type').inputValue(),'ox');
  await page.locator('#explanation-1').fill('내 추가 설명 유지');await page.getByRole('button',{name:'저장하기',exact:true}).click();await page.locator('#note-dialog').waitFor({state:'hidden'});
  await page.reload();await page.locator("#app.home-view").waitFor();await selectSubject(page,'AI기초와활용');await page.locator('.note-row').nth(27).waitFor();assert.equal(await page.locator('.note-row').count(),28);
  assert.match(await page.locator('.note-row').nth(4).textContent(),/내 추가 설명 유지/);
  const saved=await read(page);assert.equal(saved.notes[4].choices[1].originalNumber,2);
  await page.locator('#start-review').click();await page.locator('#review-card').click();
  assert.match(await page.locator('#review-answer .study-choice').first().innerText(),/K-means/);
  await page.locator('#hide-review').click();assert.ok(await page.locator('#conceal').isVisible());await page.mouse.click(380,10);await page.locator('#exit-review').click();
  const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;
  const backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(backup.notes.length,94);
  page.on('dialog',d=>d.accept());await first.getByRole('button',{name:'삭제',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.note-row').length===27);await page.reload();await page.locator("#app.home-view").waitFor();await selectSubject(page,'AI기초와활용');await page.waitForFunction(()=>document.querySelectorAll('.note-row').length===27);
  assert.ok(!(await read(page)).notes.some(n=>n.id==='ai-basics-quiz-001'));
  await page.locator('#import').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await page.waitForFunction(()=>document.querySelector('#subject-count').textContent==='14');
  assert.equal((await read(page)).notes.length,187);
  await page.reload();await page.locator("#app.home-view").waitFor();await selectSubject(page,'AI기초와활용');await page.waitForFunction(()=>document.querySelector('#subject-count').textContent==='14');assert.equal((await read(page)).notes.length,187);
  assert.equal((await read(page)).documents.length,82);
  await page.evaluate(()=>navigator.serviceWorker.ready);await context.setOffline(true);await page.reload();await page.locator("#app.home-view").waitFor();await selectSubject(page,'AI기초와활용');await page.locator('.note-row').first().waitFor();assert.equal((await read(page)).notes.length,187);
  await context.setOffline(false);
  await page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('secret-note',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('data','readwrite'),store=tx.objectStore('data'),q=store.get('state');q.onsuccess=()=>{const s=q.result;s.notes=[{id:'existing-personal',subjectId:s.subjects[0].id,type:'qa',question:'기존 개인 노트',answer:'보존할 답변',choices:[]}];delete s.builtinQuizIds;store.put(s,'state')};tx.oncomplete=()=>{db.close();resolve()}}}));
  await page.reload();await page.locator("#app.home-view").waitFor();await selectSubject(page,'AI기초와활용');await page.waitForFunction(()=>document.querySelectorAll('.note-row').length===29);
  assert.match(await page.locator('.note-row').first().innerText(),/보존할 답변/);
  await page.locator('#delete-subject').click();await page.waitForFunction(()=>document.querySelector('#subject-count').textContent==='13');await page.reload();await page.locator("#app.home-view").waitFor();await selectSubject(page,'AI기초와활용');await page.waitForFunction(()=>document.querySelector('#subject-count').textContent==='13');
  assert.equal((await read(page)).subjects.filter(s=>s.name==='AI기초와활용').length,1);
  assert.ok(!(await read(page)).notes.some(n=>n.id==='ai-basics-quiz-001'));
  assert.deepEqual(errors,[]);
  console.log('PASS: all 94 answers, mobile correct-first display, O/X edits, reload idempotence, original numbers, review conceal, backup/restore, deletion preservation, offline notes, 82 course assets retained');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
