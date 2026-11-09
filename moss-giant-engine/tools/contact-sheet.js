// contact sheet: node sheet.js name t1 t2 ... (2 columns)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1040}});
p.on('pageerror',e=>console.log('ERR',e.message,(e.stack||'').split('\n').slice(1,4).join('|')));
await p.goto('file://'+__dirname+'/../index.html?t=0&rs=1');await p.waitForFunction('window.__ready',{timeout:60000});
const ts=process.argv.slice(3).map(Number);const cols=2,cw=800,ch=Math.round(800*1040/1920);
await p.evaluate(([n,cols,cw,ch])=>{const s=document.createElement('canvas');s.id='sheet';s.width=cols*cw;s.height=Math.ceil(n/cols)*ch;s.style.cssText='position:fixed;left:0;top:0;z-index:99;width:'+s.width+'px;height:'+s.height+'px';document.body.appendChild(s);},[ts.length,cols,cw,ch]);
for(let i=0;i<ts.length;i++){await p.evaluate(([t,i,cols,cw,ch])=>{__render(t);const g=document.getElementById('sheet').getContext('2d');g.drawImage(document.getElementById('c'),(i%cols)*cw,Math.floor(i/cols)*ch,cw,ch);g.fillStyle='#fff';g.font='20px sans-serif';g.fillText(t+'s',(i%cols)*cw+8,Math.floor(i/cols)*ch+24);},[ts[i],i,cols,cw,ch]);}
await p.setViewportSize({width:cols*cw,height:Math.ceil(ts.length/cols)*ch});
await p.locator('#sheet').screenshot({path:process.argv[2]+'.jpg',type:'jpeg',quality:82});await b.close();})();
