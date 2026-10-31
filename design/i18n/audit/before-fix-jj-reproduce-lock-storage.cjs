const { chromium } = require('/workspace/jjcompraintelwgiemt/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
 const context=await browser.newContext();
 const pages=await Promise.all([context.newPage(),context.newPage()]);
 await Promise.all(pages.map(page=>page.goto('http://127.0.0.1:8081/')));
 for(let i=0;i<15;i++){
  const key='race-isolation-'+i;
  await pages[0].evaluate(async key=>{let release;const held=new Promise(r=>release=r);window.releaseRaw=release;await new Promise(resolve=>{void navigator.locks.request(key,async()=>{resolve();await held;});});},key);
  const operations=pages.map((page,index)=>page.evaluate(async({key,index})=>navigator.locks.request(key,async()=>{const old=localStorage.getItem(key);await Promise.resolve();if(old!==null)return {outcome:'conflict',old};localStorage.setItem(key,String(index));await Promise.resolve();return{outcome:'saved',old};}),{key,index}));
  await pages[0].waitForFunction(async key=>(await navigator.locks.query()).pending.filter(x=>x.name===key).length===2,key);
  await pages[0].evaluate(()=>window.releaseRaw());
  const results=await Promise.all(operations);
  console.log(JSON.stringify({i,results,final:await pages[0].evaluate(key=>localStorage.getItem(key),key)}));
 }
 await browser.close();
})().catch(error=>{console.error(error);process.exitCode=1});
