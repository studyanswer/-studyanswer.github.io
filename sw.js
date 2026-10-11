const CACHE='secret-note-v27';
const FILES=['./','./index.html','./style.css','./app.js','./quizzes/ai-basics.json','./quizzes/practical-ai.json','./quizzes/semiconductor-packaging.json','./quizzes/applied-math.json','./quizzes/electronic-circuits.json','./manifest.webmanifest','./icon.svg','./vendor/pdf.mjs','./vendor/pdf.worker.mjs','./library/ai-basics/catalog.json','./library/semiconductor-packaging/catalog.json','./library/practical-ai/catalog.json','./library/applied-math/catalog.json','./library/electronic-circuits/catalog.json','./library/computer-practice/catalog.json','./library/programming-ii/catalog.json'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('secret-note-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  try{
   const response=await fetch(event.request);
   if(response.status===200){
    const copy=response.clone();
    event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{}));
   }
   return response;
  }catch{
   return await caches.match(event.request)||Response.error();
  }
 })());
});
