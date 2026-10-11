const $ = (s) => document.querySelector(s);
const uid = () => crypto.randomUUID();
const defaultSubjects = ['AI기초와활용', '공학생을위한실용AI', '반도체패키지공학실무', '응용수리실무', '전자응용회로설계', '컴퓨터활용실무', '프로그래밍언어(Ⅱ)'];
async function prepareDefaultSubjects(){
 if(state.defaultSubjectsVersion === 1)return;
 for(const name of defaultSubjects){
  if(!state.subjects.some(subject=>subject.name.trim()===name))state.subjects.push({id:uid(),name});
 }
 state.defaultSubjectsVersion=1;
 await save();
}
const courseLibraries = [
 {versionKey:'aiBasicsLibraryVersion',url:'./library/ai-basics/catalog.json'},
 {versionKey:'semiconductorPackagingLibraryVersion',url:'./library/semiconductor-packaging/catalog.json'},
 {versionKey:'practicalAiLibraryVersion',url:'./library/practical-ai/catalog.json'},
 {versionKey:'appliedMathLibraryVersion',url:'./library/applied-math/catalog.json'},
 {versionKey:'electronicCircuitsLibraryVersion',url:'./library/electronic-circuits/catalog.json'},
 {versionKey:'computerPracticeLibraryVersion',url:'./library/computer-practice/catalog.json'},
 {versionKey:'programmingIiLibraryVersion',url:'./library/programming-ii/catalog.json'}
];
async function prepareCourseLibrary(){
 state.builtinLibraryIds ||= {};
 for(const library of courseLibraries){
  if((state[library.versionKey]||0) >= 2)continue;
  try{
   const response=await fetch(library.url);
   if(!response.ok)throw new Error('Course catalog unavailable');
   const catalog=await response.json();
   if(catalog.version<2)throw new Error('Updated course catalog unavailable');
   const wasImported=(state[library.versionKey]||0)>0;
   const knownIds=state.builtinLibraryIds[library.versionKey];
   let subject=state.subjects.find(s=>s.name.trim()===catalog.subject);
   if(!subject&&wasImported){
    state[library.versionKey]=catalog.version;
    state.builtinLibraryIds[library.versionKey]=catalog.documents.map(d=>d.id);
    await save();continue;
   }
   if(!subject){subject={id:uid(),name:catalog.subject};state.subjects.push(subject)}
   const normalize=name=>name.replace(/\s/g,'').replace('촬용','활용');
   for(const doc of catalog.documents){
    const existing=state.documents.find(d=>d.id===doc.id||(d.subjectId===subject.id&&normalize(d.name)===normalize(doc.name)));
    if(existing){
     if(existing.builtin){
      const position=state.documents.indexOf(existing);
      state.documents[position]={...existing,...doc,subjectId:existing.subjectId,vectors:null};
     }
    }else if(!(knownIds?knownIds.includes(doc.id):wasImported)){
     state.documents.push({...doc,subjectId:subject.id});
    }
   }
   state[library.versionKey]=catalog.version;
   state.builtinLibraryIds[library.versionKey]=catalog.documents.map(d=>d.id);
   await save();
  }catch(error){console.error(error);toast('기본 자료를 불러오지 못했어요. 인터넷에 연결한 뒤 새로고침해주세요.')}
 }
}
async function prepareQuizLibrary(){
 const catalogs=[];
 for(const url of ['./quizzes/ai-basics.json','./quizzes/practical-ai.json','./quizzes/semiconductor-packaging.json','./quizzes/applied-math.json','./quizzes/electronic-circuits.json']){
  try{
   const response=await fetch(url);
   if(!response.ok)throw new Error('Quiz catalog unavailable');
   catalogs.push(await response.json());
  }catch(error){console.error(error);toast('기본 퀴즈를 불러오지 못했어요. 인터넷에 연결한 뒤 새로고침해주세요.')}
 }
 const previousNotes=state.notes,previousIds=state.builtinQuizIds,previousCorrection=state.quizSubjectCorrectionVersion;
 const known=new Set(state.builtinQuizIds||[]);
 let notes=[...state.notes];
 for(const catalog of catalogs){
  const subject=state.subjects.find(s=>s.name.trim()===catalog.subject);
  if(!subject)continue;
  for(const note of catalog.notes){
   if(!known.has(note.id)&&!notes.some(old=>old.id===note.id||old.builtinQuizId===note.id))notes.push({...note,subjectId:subject.id});
   known.add(note.id);
  }
 }
 const practicalCatalog=catalogs.find(c=>c.subject==='공학생을위한실용AI');
 const aiSubject=state.subjects.find(s=>s.name.trim()==='AI기초와활용'),practicalSubject=state.subjects.find(s=>s.name.trim()==='공학생을위한실용AI');
 if(!state.quizSubjectCorrectionVersion&&practicalCatalog&&aiSubject&&practicalSubject){
  const corrected=new Map(practicalCatalog.notes.map(n=>[n.id,n.number]));
  notes=notes.map(note=>{const source=note.builtinQuizId||note.id;return note.subjectId===aiSubject.id&&corrected.has(source)?{...note,subjectId:practicalSubject.id,number:corrected.get(source)}:note});
  state.quizSubjectCorrectionVersion=1;
 }
 state.notes=notes;state.builtinQuizIds=[...known];
 try{await save()}catch(error){state.notes=previousNotes;state.builtinQuizIds=previousIds;state.quizSubjectCorrectionVersion=previousCorrection;console.error(error);toast('퀴즈를 저장하지 못했어요. 저장 공간을 확인해주세요.')}
}
const isChoice=note=>note?.type==='choice'||note?.type==='ox';
function orderedChoices(note){return [note.correct,...note.choices.map((_,i)=>i).filter(i=>i!==note.correct)].map(i=>({...note.choices[i],isCorrect:i===note.correct}))}
function choiceDetails(note){
 const choices=orderedChoices(note);
 const row=(c,i)=>`<div class="study-choice ${c.isCorrect?'correct-choice':''}"><strong>${i+1}) ${c.isCorrect?'✓ 정답 · ':''}${escapeHTML(c.text)}</strong>${c.originalNumber?`<span class="original-choice">원문 ${c.originalNumber}번</span>`:''}<p>${escapeHTML(c.explanation||'보기 설명을 추가해보세요.')}</p></div>`;
 return row(choices[0],0)+`<details class="wrong-choices"><summary>오답 보기 · 설명 ${choices.length-1}개</summary>${choices.slice(1).map((c,i)=>row(c,i+1)).join('')}</details>`;
}
function noteContent(note){return isChoice(note)?choiceDetails(note)+`<p class="study-explanation">${escapeHTML(note.answer)}</p>`:`<p>${escapeHTML(note.answer.slice(0,120))}</p>`}
const kinds = {qa:'문답', choice:'객관식', ox:'O/X', memo:'일반 노트'};
const escapeHTML = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let db, state = {subjects:[],notes:[],documents:[]}, selected, editing, tab='notes';
let homeView=true;
let reviewList=[],reviewIndex=0,revealed=false,viewer,viewerPage=1,renderTask;
let extractor, pdfModule, busy=false;
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,4500)}
function openDB(){return new Promise((resolve,reject)=>{const request=indexedDB.open('secret-note',1);request.onupgradeneeded=()=>request.result.createObjectStore('data');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
function getState(){return new Promise((resolve,reject)=>{const r=db.transaction('data').objectStore('data').get('state');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function save(){return new Promise((resolve,reject)=>{const tx=db.transaction('data','readwrite');tx.objectStore('data').put(state,'state');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('저장 실패'))})}
async function persist(){try{await save();return true}catch(e){toast('저장하지 못했어요. 기기의 저장 공간을 확인하고 백업하세요.');console.error(e);return false}}
function subjectNotes(){return state.notes.filter(n=>n.subjectId===selected)}
function subjectDocs(){return state.documents.filter(d=>d.subjectId===selected).sort((a,b)=>a.name.localeCompare(b.name,'ko',{numeric:true}))}
function render(){
 $('#app').classList.toggle('home-view',homeView);
 $('#app').classList.toggle('subject-view',!homeView);
 if(!state.subjects.some(s=>s.id===selected))selected=state.subjects[0]?.id;
 $('#subject-count').textContent=state.subjects.length;
 $('#subjects').innerHTML=state.subjects.map(s=>`<button class="subject-chip ${s.id===selected?'active':''}" data-subject="${escapeHTML(s.id)}">${escapeHTML(s.name)}</button>`).join('');
 $('#empty-subject').hidden=!!selected;$('#subject-content').hidden=!selected;
 if(!selected)return;
 $('#subject-title').textContent=state.subjects.find(s=>s.id===selected).name;
 const notes=subjectNotes(), docs=subjectDocs(),query=$('#note-search').value.trim();
 const visibleNotes=query?notes.filter(n=>lexicalScore([n.question,n.answer,...(n.choices||[]).flatMap(c=>[c.text,c.explanation])].join(' '),query)>0):notes;
 $('#note-count').textContent=notes.length;$('#pdf-count').textContent=docs.length;
 $('#notes').innerHTML=visibleNotes.length?visibleNotes.map(n=>`<article class="note-row"><div class="note-main"><span class="note-type">${kinds[n.type]}${n.week?' · '+n.week+'주차 '+n.lecture+'강':''}${n.marked?' · 다시 보기':''}</span><h3>${n.number?n.number+'. ':''}${escapeHTML(n.question)}</h3>${noteContent(n)}</div></article>`).join(''):(query?'<p class="empty-inline">검색 결과가 없어요. 다른 단어나 초성으로 찾아보세요.</p>':'<p class="empty-inline">아직 등록된 노트가 없어요.<br>이 대화에서 문제를 보내주면 등록할 수 있어요.</p>');
 $('#start-review').disabled=!notes.length;
 $('#documents').innerHTML=docs.map(d=>`<article class="document-row"><div><strong>${escapeHTML(d.name)}</strong><p>${d.type==='csv'?'CSV · '+d.rowCount+'행':d.pageCount+'페이지'}${d.builtin?' · 기본 자료':''}${d.ocrPageCount?' · 이미지 글자 포함':''} · ${d.chunks.length}개 검색 구간${d.vectors?' · 의미 검색 준비됨':''}${!d.chunks.length?' · 추출 가능한 글자 없음':''}</p></div><div class="row-actions"><button data-open-pdf="${d.id}">열기</button></div></article>`).join('');
}
function setTab(value){tab=value;document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));$('#notes-panel').hidden=tab!=='notes';$('#pdf-panel').hidden=tab!=='pdf'}
$('#subjects').onclick=e=>{const b=e.target.closest('[data-subject]');if(b){if(busy){toast('현재 작업이 끝난 뒤 과목을 바꿔주세요.');return}selected=b.dataset.subject;homeView=false;$('#note-search').value='';setTab(subjectNotes().length?'notes':'pdf');$('#results').replaceChildren();$('#search-status').textContent='';render()}};
$('#note-search').oninput=render;
let homeSwipe,swipeClickUntil=0;
document.addEventListener('pointerdown',e=>{
 homeSwipe=undefined;swipeClickUntil=0;
 if(e.pointerType!=='touch'||!e.isPrimary||homeView||!$('#conceal').hidden||!$('#review').hidden||document.querySelector('dialog[open]')||e.target.closest('input,textarea,select,button,a,summary'))return;
 homeSwipe={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now()};
});
document.addEventListener('pointercancel',()=>{homeSwipe=undefined});
document.addEventListener('pointerup',e=>{
 const start=homeSwipe;homeSwipe=undefined;
 if(!start||start.id!==e.pointerId||!$('#conceal').hidden)return;
 const dx=e.clientX-start.x,dy=Math.abs(e.clientY-start.y);
 if(dx<80||dx<dy*1.5||performance.now()-start.time>1000)return;
 swipeClickUntil=performance.now()+400;homeView=true;render();window.scrollTo({top:0});
});
document.addEventListener('click',e=>{if(performance.now()<swipeClickUntil){e.preventDefault();e.stopImmediatePropagation()}},{capture:true});

$('.tabs').onclick=e=>{const b=e.target.closest('[data-tab]');if(b)setTab(b.dataset.tab)};
for(const b of document.querySelectorAll('.close-dialog'))b.onclick=()=>b.closest('dialog').close();
$('#subject-form').onsubmit=async e=>{e.preventDefault();const name=$('#subject-name').value.trim();if(!name)return;homeView=false;selected=uid();state.subjects.push({id:selected,name});if(await persist()){$('#subject-dialog').close();render()}};
$('#choices-editor').innerHTML=Array.from({length:4},(_,i)=>`<div class="choice-field"><label><input type="radio" name="correct" value="${i}" ${!i?'checked':''}> ${i+1}번 · 정답이면 선택</label><input id="choice-${i}" placeholder="보기 내용" aria-label="${i+1}번 보기"><textarea id="explanation-${i}" rows="2" placeholder="왜 맞거나 틀린가요? 어떤 경우에 맞는 말인가요?" aria-label="${i+1}번 보기 설명"></textarea></div>`).join('');
function updateNoteType(){const type=$('#note-type').value,count=type==='ox'?2:4,choice=isChoice({type});$('#choices-editor').hidden=!choice;$('#question-label').textContent=type==='memo'?'제목':'질문 / 문제';$('#answer').required=!choice;for(let i=0;i<4;i++){const visible=i<count;$(`#choice-${i}`).closest('.choice-field').hidden=!visible;$(`#choice-${i}`).required=choice&&visible;$(`#choice-${i}`).disabled=!visible;$(`#explanation-${i}`).disabled=!visible;$(`input[name="correct"][value="${i}"]`).disabled=!visible}if(choice&&Number($('input[name="correct"]:checked').value)>=count)$('input[name="correct"][value="0"]').checked=true}
$('#note-type').onchange=updateNoteType;
function noteEditor(note){editing=note?.id;$('#note-form').reset();$('#note-dialog-title').textContent=note?'노트 수정':'노트 추가';$('#note-type').value=note?.type||'qa';$('#question').value=note?.question||'';$('#answer').value=note?.answer||'';if(isChoice(note)){note.choices.forEach((c,i)=>{$(`#choice-${i}`).value=c.text;$(`#explanation-${i}`).value=c.explanation});$(`input[name="correct"][value="${note.correct}"]`).checked=true}updateNoteType();$('#note-dialog').showModal()}
$('#note-form').onsubmit=async e=>{e.preventDefault();const type=$('#note-type').value,question=$('#question').value.trim(),answer=$('#answer').value.trim();if(!question||(!isChoice({type})&&!answer)){toast('빈칸에 내용을 입력해주세요.');return}const choices=isChoice({type})?Array.from({length:type==='ox'?2:4},(_,i)=>({text:$(`#choice-${i}`).value.trim(),explanation:$(`#explanation-${i}`).value.trim()})):[];if(isChoice({type})&&choices.some(c=>!c.text)){toast('보기를 모두 입력해주세요.');return}const old=state.notes.find(n=>n.id===editing);if(old&&isChoice(old))choices.forEach((c,i)=>{if(old.choices[i]?.originalNumber)c.originalNumber=old.choices[i].originalNumber});const note={...old,id:editing||uid(),subjectId:selected,type,question,answer,choices,correct:Number($('input[name="correct"]:checked').value),marked:old?.marked||false};if(old)state.notes[state.notes.indexOf(old)]=note;else state.notes.push(note);if(await persist()){$('#note-dialog').close();render();toast('노트를 저장했어요.')}};
function prepareReview(){reviewList=subjectNotes().filter(n=>!$('#marked-only').checked||n.marked);if($('#shuffle').checked)for(let i=reviewList.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[reviewList[i],reviewList[j]]=[reviewList[j],reviewList[i]]}reviewIndex=0;revealed=false;renderReview()}
function renderReview(){const note=reviewList[reviewIndex];$('#review-progress').textContent=reviewList.length?`${reviewIndex+1} / ${reviewList.length}`:'0 / 0';$('#review-question').textContent=note?.question||'복습할 노트가 없어요';$('#review-kind').textContent=note?kinds[note.type]:'';$('#review-options').innerHTML=!revealed&&isChoice(note)?note.choices.map((c,i)=>`<div>${i+1}. ${escapeHTML(c.text)}</div>`).join(''):'';$('#review-answer').hidden=!revealed;$('#review-answer').innerHTML=note?(isChoice(note)?choiceDetails(note):'')+`<p>${escapeHTML(note.answer)}</p>`:'';$('#mark').textContent=note?.marked?'★ 다시 보기':'☆ 다시 보기';$('#review-hint').textContent=(revealed?'터치하면 다음 노트로 넘어가요':'화면을 터치하면 답이 보여요')+' · 오른쪽 위·아래 모서리를 누르면 숨김/복귀';$('#previous').disabled=!note;$('#next').disabled=!note;$('#mark').disabled=!note}
$('#start-review').onclick=()=>{$('#shuffle').checked=false;$('#marked-only').checked=false;prepareReview();$('#review').hidden=false;$('#app').inert=true};
$('#exit-review').onclick=()=>{$('#review').hidden=true;$('#app').inert=false;render()};
function moveReview(delta){if(!reviewList.length)return;reviewIndex=(reviewIndex+delta+reviewList.length)%reviewList.length;revealed=false;renderReview()}
$('#review-card').onclick=e=>{if(e.target.closest('.wrong-choices'))return;if(!reviewList.length)return;if(revealed)moveReview(1);else{revealed=true;renderReview()}};
$('#review-card').onkeydown=e=>{if(e.target!==e.currentTarget)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();e.currentTarget.click()}};
$('#next').onclick=()=>moveReview(1);$('#previous').onclick=()=>moveReview(-1);
$('#mark').onclick=async()=>{const note=reviewList[reviewIndex];if(note){note.marked=!note.marked;await persist();renderReview()}};
$('#shuffle').onchange=prepareReview;$('#marked-only').onchange=prepareReview;
$('#font-size').oninput=e=>$('#review').style.fontSize=e.target.value+'px';
function setConcealed(value){
 $('#toast').hidden=true;
 $('#conceal').hidden=!value;
 document.body.classList.toggle('screen-concealed',value);
}
const inScreenCorner=e=>!e.target?.closest?.('#pdf-dialog .close-dialog')&&e.clientX>=window.innerWidth-88&&(e.clientY<=88||e.clientY>=window.innerHeight-88);
document.addEventListener('pointerdown',e=>{
 if(!e.isPrimary||e.button!==0||!inScreenCorner(e))return;
 // PDF touch gestures must be classified before a corner tap can hide the page.
 if(e.pointerType==='touch'&&$('#pdf-dialog').open&&$('#conceal').hidden)return;
 if(e.pointerType==='touch'&&$('#pdf-dialog').open&&!$('#conceal').hidden)pdfCornerRestoreTouch=true;
 e.preventDefault();e.stopImmediatePropagation();
 setConcealed($('#conceal').hidden);
},{capture:true});
document.addEventListener('click',e=>{
 if(inScreenCorner(e)||!$('#conceal').hidden){e.preventDefault();e.stopImmediatePropagation()}
},{capture:true});
let pdfCornerTap, pdfCornerRestoreTouch=false;
document.addEventListener('touchstart',e=>{
 pdfCornerTap=undefined;
 if(pdfCornerRestoreTouch){pdfCornerRestoreTouch=false;return}
 if(!$('#pdf-dialog').open||!$('#conceal').hidden||e.touches.length!==1)return;
 const touch=e.touches[0];
 if(inScreenCorner(touch))pdfCornerTap={x:touch.clientX,y:touch.clientY,id:touch.identifier};
},{capture:true,passive:true});
document.addEventListener('touchmove',e=>{
 if(!pdfCornerTap)return;
 const touch=[...e.touches].find(t=>t.identifier===pdfCornerTap.id);
 if(e.touches.length!==1||!touch||Math.hypot(touch.clientX-pdfCornerTap.x,touch.clientY-pdfCornerTap.y)>12)pdfCornerTap=undefined;
},{capture:true,passive:true});
document.addEventListener('touchcancel',()=>{pdfCornerTap=undefined},{capture:true,passive:true});
document.addEventListener('touchend',e=>{
 const tap=pdfCornerTap;pdfCornerTap=undefined;
 if(!tap||e.touches.length||!$('#pdf-dialog').open||!$('#conceal').hidden)return;
 const touch=[...e.changedTouches].find(t=>t.identifier===tap.id);
 if(!touch||!inScreenCorner(touch)||Math.hypot(touch.clientX-tap.x,touch.clientY-tap.y)>12)return;
 e.preventDefault();e.stopImmediatePropagation();setConcealed(true);
},{capture:true,passive:false});
$('#hide-review').onclick=()=>setConcealed(true);
document.addEventListener('keydown',e=>{
 if(!$('#conceal').hidden){e.preventDefault();e.stopImmediatePropagation();return}
 if(e.key==='Escape'&&!$('#review').hidden)setConcealed(true);
},{capture:true});
async function pdfjs(){if(!pdfModule){pdfModule=await import('./vendor/pdf.mjs');pdfModule.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.mjs',import.meta.url).href}return pdfModule}
function chunksFor(text,page){const chunks=[];for(let start=0;start<text.length;start+=550){const section=text.slice(start,start+700).trim();if(section)chunks.push({page,text:section})}return chunks}
$('#pdf-upload').onchange=async e=>{if(busy)return;const files=[...e.target.files],subjectId=selected;busy=true;$('#pdf-upload').disabled=true;try{const pdf=await pdfjs();for(const file of files){if(file.size>50*1024*1024){toast(`${file.name}: PDF는 50MB 이하로 넣어주세요.`);continue}$('#search-status').textContent=`${file.name} 읽는 중…`;let doc;try{doc=await pdf.getDocument({data:new Uint8Array(await file.arrayBuffer()),cMapUrl:new URL('./vendor/cmaps/',import.meta.url).href,cMapPacked:true,standardFontDataUrl:new URL('./vendor/standard_fonts/',import.meta.url).href}).promise;const chunks=[];for(let p=1;p<=doc.numPages;p++){const page=await doc.getPage(p);const content=await page.getTextContent();const text=content.items.map(x=>x.str+(x.hasEOL?'\n':' ')).join('').trim();chunks.push(...chunksFor(text,p));$('#search-status').textContent=`${file.name} · ${p}/${doc.numPages}페이지 추출 중…`}const item={id:uid(),subjectId,name:file.name,pageCount:doc.numPages,chunks,blob:file,vectors:null};state.documents.push(item);if(!await persist()){state.documents.pop();break}render();if(!chunks.length)toast('글자가 추출되지 않았어요. 스캔 PDF는 글자 인식이 필요합니다.')}catch(error){toast(`${file.name}: PDF를 읽지 못했어요. 암호나 파일 상태를 확인해주세요.`);console.error(error)}finally{await doc?.destroy()}}$('#search-status').textContent='PDF 추가를 마쳤어요. 단어 검색은 바로 사용할 수 있어요.'}catch(error){toast('PDF 도구를 불러오지 못했어요.');console.error(error)}finally{busy=false;$('#pdf-upload').disabled=false;e.target.value=''}};
$('#documents').onclick=e=>{const open=e.target.closest('[data-open-pdf]');if(open)openPDF(open.dataset.openPdf,1)};
async function openPDF(id,page){const item=state.documents.find(d=>d.id===id);if(!item)return;if(item.type==='csv'){openCSV(item,page);return}$('#pdf-title').textContent=item.name;$('#pdf-error').textContent='';$('#pdf-canvas').width=0;$('#pdf-canvas').height=0;$('#pdf-page').textContent='불러오는 중…';$('#pdf-prev').disabled=true;$('#pdf-next').disabled=true;lockPDFBackground();$('#pdf-dialog').showModal();try{if(renderTask){renderTask.cancel();try{await renderTask.promise}catch{}}await viewer?.destroy();const pdf=await pdfjs();viewer=await pdf.getDocument({...item.blob?{data:new Uint8Array(await item.blob.arrayBuffer())}:{url:new URL(item.sourceUrl,import.meta.url).href,disableRange:true},cMapUrl:new URL('./vendor/cmaps/',import.meta.url).href,cMapPacked:true,standardFontDataUrl:new URL('./vendor/standard_fonts/',import.meta.url).href}).promise;viewerPage=page;await renderPDF()}catch(error){$('#pdf-error').textContent='페이지를 열지 못했어요. 인터넷 연결과 PDF 상태를 확인해주세요.';console.error(error)}}
async function renderPDF(){if(!viewer)return;if(renderTask){renderTask.cancel();try{await renderTask.promise}catch{}}const page=await viewer.getPage(viewerPage);const base=page.getViewport({scale:1});const width=Math.max(240,$('#pdf-canvas-wrap').clientWidth);const viewport=page.getViewport({scale:Math.min(2,width/base.width)*devicePixelRatio});const canvas=$('#pdf-canvas');canvas.width=viewport.width;canvas.height=viewport.height;$('#pdf-page').textContent=`${viewerPage} / ${viewer.numPages}`;$('#pdf-prev').disabled=viewerPage<=1;$('#pdf-next').disabled=viewerPage>=viewer.numPages;const task=renderTask=page.render({canvasContext:canvas.getContext('2d'),viewport});$('#pdf-canvas-wrap').setAttribute('aria-busy','true');try{await task.promise}catch(error){if(error.name!=='RenderingCancelledException')throw error}finally{if(renderTask===task)$('#pdf-canvas-wrap').setAttribute('aria-busy','false')}}
const pdfLayoutObserver=new ResizeObserver(()=>{
 const canvas=$('#pdf-canvas'),wrap=$('#pdf-canvas-wrap');
 if(!canvas.width||!canvas.height)return;
 const dialog=$('#pdf-dialog');
 dialog.style.setProperty('--pdf-display-height',canvas.getBoundingClientRect().height+'px');
 dialog.style.setProperty('--pdf-toolbar-height',($('#pdf-dialog .dialog-heading').getBoundingClientRect().height+$('#pdf-dialog .pdf-controls').getBoundingClientRect().height)+'px');
});
pdfLayoutObserver.observe($('#pdf-canvas'));
pdfLayoutObserver.observe($('#pdf-dialog .dialog-heading'));
pdfLayoutObserver.observe($('#pdf-dialog .pdf-controls'));
let pdfBackgroundScroll;
function lockPDFBackground(){
 if(pdfBackgroundScroll)return;
 pdfBackgroundScroll={x:window.scrollX,y:window.scrollY};
 document.body.style.top=-pdfBackgroundScroll.y+'px';
 document.body.classList.add('pdf-open');
 document.documentElement.classList.add('pdf-open');
}
$('#pdf-dialog').addEventListener('close',()=>{
 const saved=pdfBackgroundScroll;pdfBackgroundScroll=undefined;
 document.body.classList.remove('pdf-open');document.documentElement.classList.remove('pdf-open');
 document.body.style.top='';if(saved)window.scrollTo(saved.x,saved.y);
});
// Only a single-finger horizontal swipe at normal zoom changes pages.
let pdfSwipe;
const pdfAtNormalZoom=()=>!window.visualViewport||window.visualViewport.scale<=1.02;
$('#pdf-dialog').addEventListener('cancel',e=>e.preventDefault());
$('#pdf-dialog').addEventListener('touchstart',e=>{
 pdfSwipe=undefined;
 if(e.touches.length!==1||!$('#conceal').hidden||!viewer||!pdfAtNormalZoom()||!e.target.closest('#pdf-canvas-wrap'))return;
 const t=e.touches[0];pdfSwipe={id:t.identifier,x:t.clientX,y:t.clientY,time:performance.now()};
},{passive:true});
$('#pdf-dialog').addEventListener('touchmove',e=>{
 if(!pdfSwipe)return;
 const t=[...e.touches].find(t=>t.identifier===pdfSwipe.id);
 if(e.touches.length!==1||!t||!pdfAtNormalZoom()){pdfSwipe=undefined;return}
 const dx=t.clientX-pdfSwipe.x,dy=t.clientY-pdfSwipe.y;
 if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){pdfSwipe=undefined;return}
 if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.5)e.preventDefault();
},{passive:false});
$('#pdf-dialog').addEventListener('touchcancel',()=>{pdfSwipe=undefined},{passive:true});
$('#pdf-dialog').addEventListener('close',()=>{pdfSwipe=undefined});
$('#pdf-dialog').addEventListener('touchend',e=>{
 const start=pdfSwipe;pdfSwipe=undefined;
 if(!start||e.touches.length||!$('#conceal').hidden||!pdfAtNormalZoom())return;
 const t=[...e.changedTouches].find(t=>t.identifier===start.id);if(!t)return;
 const dx=t.clientX-start.x,dy=t.clientY-start.y;
 if(Math.abs(dx)<60||Math.abs(dx)<Math.abs(dy)*1.5||performance.now()-start.time>1200)return;
 e.preventDefault();e.stopPropagation();
 const button=$(dx<0?'#pdf-next':'#pdf-prev');if(!button.disabled)button.click();
},{passive:false});
$('#pdf-prev').onclick=async()=>{if(viewerPage>1){viewerPage--;await renderPDF()}};$('#pdf-next').onclick=async()=>{if(viewerPage<viewer.numPages){viewerPage++;await renderPDF()}};
function sourceLocation(row){return row.doc.type==='csv'?`${row.chunk.rowStart}행`:`${row.chunk.page}페이지`}
function openCSV(item,rowNumber){
 $('#csv-title').textContent=item.name;
 $('#csv-description').textContent=`실습 데이터 · ${item.rowCount}행 · ${item.columns.length}개 열`;
 $('#csv-table').innerHTML=`<thead><tr><th scope="col">행</th>${item.columns.map(c=>`<th scope="col">${escapeHTML(c)}</th>`).join('')}</tr></thead><tbody>${item.rows.map((row,i)=>`<tr id="csv-row-${i+1}" class="${i+1===rowNumber?'selected-row':''}"><th scope="row">${i+1}</th>${row.map(cell=>`<td>${escapeHTML(cell)}</td>`).join('')}</tr>`).join('')}</tbody>`;
 $('#csv-download').href=new URL(item.sourceUrl,import.meta.url).href;
 $('#csv-download').download=item.name;
 $('#csv-dialog').showModal();
 if(rowNumber)$('#csv-row-'+rowNumber)?.scrollIntoView({block:'nearest'});
}
function initialPattern(query){
 const initials='ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
 if(![...query].some(char=>initials.includes(char)))return null;
 return new RegExp([...query].map(char=>{
  const index=initials.indexOf(char);
  if(index<0)return char.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const start=0xac00+index*588;
  return '['+char+String.fromCharCode(start)+'-'+String.fromCharCode(start+587)+']';
 }).join(''),'u');
}
function lexicalScore(text,query){
 const normalized=text.toLowerCase().replace(/\s+/g,' '),compact=normalized.replace(/\s/g,''),q=query.toLowerCase().trim(),terms=q.split(/\s+/).filter(Boolean);
 const matches=term=>normalized.includes(term)||compact.includes(term.replace(/\s/g,''))||Boolean(initialPattern(term.replace(/\s/g,''))?.test(compact));
 let score=matches(q)?8:0;
 for(const term of terms)if(matches(term))score+=2;
 return score;
}
async function getExtractor(){if(!extractor){$('#search-status').textContent='의미 검색 모델을 내려받는 중… 첫 사용은 오래 걸릴 수 있어요. PDF와 검색어는 외부로 보내지 않습니다.';const {pipeline,env}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2');env.allowLocalModels=false;extractor=await pipeline('feature-extraction','Xenova/paraphrase-multilingual-MiniLM-L12-v2',{device:'wasm',dtype:'q8'})}return extractor}
function dot(a,b){let value=0;for(let i=0;i<a.length;i++)value+=a[i]*b[i];return value}
function rankRows(rows,queryVector){const lexical=rows.filter(r=>r.lexical>0).sort((a,b)=>b.lexical-a.lexical);const semantic=queryVector?rows.map(r=>({...r,similarity:dot(queryVector,r.vector)})).sort((a,b)=>b.similarity-a.similarity):[];const scores=new Map();lexical.forEach((r,i)=>scores.set(r.key,(scores.get(r.key)||0)+1/(20+i)));semantic.filter(r=>r.similarity>.2).forEach((r,i)=>scores.set(r.key,(scores.get(r.key)||0)+1/(20+i)));const seen=new Set(),results=[];for(const row of rows.filter(r=>scores.has(r.key)).sort((a,b)=>scores.get(b.key)-scores.get(a.key))){const source=row.doc.id+':'+(row.chunk.page??'row-'+row.chunk.rowStart);if(seen.has(source))continue;seen.add(source);results.push(row);if(results.length===12)break}return results}
let searchResults=[];
function showResults(rows,semantic){searchResults=rows;$('#results').innerHTML=rows.map((r,i)=>`<article class="result"><div class="result-meta">${escapeHTML(r.doc.name)} · ${sourceLocation(r)}${r.chunk.ocr?' · 이미지 글자 · 원문 확인':''} · ${r.lexical>0?'단어 일치':semantic?'관련 내용':'검색 결과'}</div><p>${escapeHTML(r.chunk.text)}</p><button data-result-open="${i}">${r.doc.type==='csv'?'표에서 보기':'원문 페이지 열기'} ↗</button></article>`).join('')}
$('#search-form').onsubmit=async e=>{e.preventDefault();if(busy){toast('현재 작업이 끝난 뒤 다시 검색해주세요.');return}const query=$('#search-query').value.trim(),docs=subjectDocs().filter(d=>d.chunks.length);if(!query)return;if(!docs.length){$('#search-status').textContent='글자가 추출된 PDF를 먼저 추가해주세요.';return}busy=true;$('#search-form button').disabled=true;$('#results').replaceChildren();const rows=docs.flatMap(doc=>doc.chunks.map((chunk,i)=>({doc,chunk,i,key:doc.id+':'+i,lexical:lexicalScore(chunk.text,query)})));let queryVector=null,semantic=false;try{if($('#semantic').checked){try{const model=await getExtractor();for(const doc of docs){if(!doc.vectors){const vectors=[];for(let i=0;i<doc.chunks.length;i++){$('#search-status').textContent=`의미 검색 준비 중 · ${doc.name} · ${i+1}/${doc.chunks.length}`;const tensor=await model(doc.chunks[i].text,{pooling:'mean',normalize:true});vectors.push(Array.from(tensor.data));await new Promise(r=>setTimeout(r,0))}doc.vectors=vectors;await persist()}}const tensor=await model(query,{pooling:'mean',normalize:true});queryVector=Array.from(tensor.data);for(const row of rows)row.vector=row.doc.vectors[row.i];semantic=true}catch(error){console.error(error);toast('의미 검색을 준비하지 못해 단어 검색 결과를 보여드려요. 인터넷 연결과 기기 메모리를 확인해주세요.')}}const results=rankRows(rows,queryVector);showResults(results,semantic);$('#search-status').textContent=`${semantic?'단어 + 의미 검색':'단어·초성 검색'} · ${results.length}개 결과${!results.length?' · 다른 검색어로 찾아보세요.':''}${semantic?' · 관련 원문이며, 정답 여부는 직접 확인하세요.':''}`;render()}finally{busy=false;$('#search-form button').disabled=false}};
$('#results').onclick=e=>{const open=e.target.closest('[data-result-open]');if(open){const r=searchResults[Number(open.dataset.resultOpen)];openPDF(r.doc.id,r.chunk.rowStart||r.chunk.page)}};
function validBackup(data){return data?.version===1&&Array.isArray(data.subjects)&&Array.isArray(data.notes)&&data.subjects.every(s=>typeof s.id==='string'&&typeof s.name==='string'&&s.name.trim())&&new Set(data.subjects.map(s=>s.id)).size===data.subjects.length&&data.notes.every(n=>typeof n.id==='string'&&data.subjects.some(s=>s.id===n.subjectId)&&['qa','choice','ox','memo'].includes(n.type)&&typeof n.question==='string'&&typeof n.answer==='string'&&Array.isArray(n.choices)&&(!isChoice(n)||(n.choices.length===(n.type==='ox'?2:4)&&Number.isInteger(n.correct)&&n.correct>=0&&n.correct<n.choices.length&&n.choices.every(c=>typeof c.text==='string'&&typeof c.explanation==='string'))))}
try{db=await openDB();state=await getState()||state;await prepareDefaultSubjects();await prepareCourseLibrary();await prepareQuizLibrary();render();if(subjectDocs().length&&!subjectNotes().length)setTab('pdf');updateNoteType();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(console.error)}catch(error){toast('기기 저장소를 열지 못했어요. 일반 브라우저 모드에서 다시 열어주세요.');console.error(error);document.querySelectorAll('button,input').forEach(el=>el.disabled=true)}
