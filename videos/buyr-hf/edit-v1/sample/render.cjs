const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..');const T={'.html':'text/html','.otf':'font/otf','.jpg':'image/jpeg'};
(async()=>{const out=process.argv[2];fs.mkdirSync(out,{recursive:true});
const srv=http.createServer((q,r)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end()}r.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});r.end(d)})}).listen(0);
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto(`http://127.0.0.1:${srv.address().port}/edit-v1/sample/index.html`);await p.evaluate(()=>window.ready());
const N=Math.round(5.85*30);for(let i=0;i<N;i++){await p.evaluate(t=>window.seek(t),i/30);await p.screenshot({path:`${out}/${String(i).padStart(5,'0')}.jpg`,type:'jpeg',quality:88});}
await b.close();srv.close();console.log('done',N);})();
