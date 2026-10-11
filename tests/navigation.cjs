async function goHome(page){
 if(!(await page.locator('#app.subject-view').count()))return;
 await page.evaluate(()=>scrollTo(0,0));
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:5,y:150}]});
 for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:5+i*24,y:150}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
 await page.locator('#app.home-view').waitFor();
}
async function selectSubject(page,name){await goHome(page);await page.getByRole('button',{name,exact:true}).first().click()}
module.exports={goHome,selectSubject};
