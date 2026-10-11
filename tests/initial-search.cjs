const {selectSubject}=require('./navigation.cjs');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('app.js','utf8');
const context=vm.createContext({});
vm.runInContext(source.slice(source.indexOf('function initialPattern('),source.indexOf('\nasync function getExtractor')),context);
for(const [text,query,hit] of [
 ['반도체 패키지','ㅂㄷㅊ',true],['반 도 체','ㅂㄷㅊ',true],
 ['반도체 패키지','반ㄷㅊ',true],['패키지 공학','ㅍㅋㅈ ㄱㅎ',true],
 ['까치와 가치','ㄲㅊ',true],['가치','ㄲㅊ',false],
 ['AI 반도체','ai ㅂㄷㅊ',true],['반도체','ㅈㅇ',false],
 ['반도체','반도체',true],['score = 100','score',true],
 ['반도체','ㅂ[',false],['반도체','ㅂ.',false],['반도체','ㅂ(',false]
])assert.equal(context.lexicalScore(text,query)>0,hit,`${text}: ${query}`);
console.log('PASS: initials, mixed queries, OCR spacing, tense consonants, regex escaping, ordinary search');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:8082');
  for(const [subject,query,word,ocr] of [['반도체패키지공학실무','ㅂㄷㅊ','반도체',false],['컴퓨터활용실무','ㅇㅅㅇ','이승엽',true]]){
   await selectSubject(page,subject);await page.locator('[data-tab="pdf"]').click();
   await page.locator('#search-query').fill(query);await page.locator('#search-form button').click();
   await page.locator('.result').first().waitFor();
   assert.ok((await page.locator('.result').allTextContents()).some(text=>text.replace(/\s/g,'').includes(word)));
   if(ocr)assert.ok((await page.locator('.result-meta').allTextContents()).some(text=>text.includes('이미지 글자')));
   console.log('PASS: live course initial search',query);
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
