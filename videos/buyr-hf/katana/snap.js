const {chromium}=require('/usr/local/lib/node_modules/playwright');
(async()=>{const [mode,arg,out]=process.argv.slice(2);
const b=await chromium.launch({args:['--allow-file-access-from-files']});const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+process.cwd()+'/index.html');await p.evaluate(()=>window.ready());await p.waitForTimeout(300);
const fs=require('fs');fs.mkdirSync(out,{recursive:true});
const times= mode==='at'? arg.split(',').map(Number) : [...Array(Math.round(24.64*30)).keys()].map(i=>i/30);
for(let i=0;i<times.length;i++){await p.evaluate(t=>window.seek(t),times[i]);await p.screenshot({path:`${out}/${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:90});}
await b.close();console.log('done',times.length);})();
