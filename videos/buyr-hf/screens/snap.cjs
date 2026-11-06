const {chromium}=require('playwright');
(async()=>{const [mode,arg,out]=process.argv.slice(2);
const b=await chromium.launch({args:['--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1080,height:1920}}); p.on('pageerror',e=>console.log('ERR',e.message)); p.on('console',m=>{if(m.type()==='error')console.log('CON',m.text())});
await p.goto('file://'+process.cwd()+'/index.html');await p.evaluate(()=>window.ready());await p.waitForTimeout(400);
const fs=require('fs');fs.mkdirSync(out,{recursive:true});
const s=+(process.argv[5]||0), e=+(process.argv[6]||739);
const times= mode==='at'? arg.split(',').map(Number) : [...Array(e-s).keys()].map(i=>(i+s)/30);
for(let i=0;i<times.length;i++){await p.evaluate(t=>window.seek(t),times[i]);const idx=mode==='at'?i:i+s;await p.screenshot({path:`${out}/${String(idx).padStart(4,'0')}.jpg`,type:'jpeg',quality:90});}
await b.close();console.log('done',times.length);})();
