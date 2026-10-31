const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),{WebSocketServer}=require('ws');
const port=process.env.PORT||3000,rooms=new Map(),W=900,H=550;
const specs={scout:{hp:75,speed:110,range:90,dmg:9,rate:.7,cost:50},tank:{hp:160,speed:65,range:150,dmg:22,rate:1.3,cost:120}};
const bases=[{x:80,y:275},{x:820,y:275}];
const send=(w,m)=>{if(w?.readyState===1)w.send(JSON.stringify(m))};
function spawn(r,s,k,x,y){r.units.push({id:++r.seq,s,k,x,y,tx:x,ty:y,hp:specs[k].hp,cd:0})}
function make(id){let r={id,p:[null,null],units:[],bases:bases.map((b,s)=>({...b,s,hp:1000})),gold:[250,250],queue:[[],[]],seq:0,started:false,winner:null,created:Date.now()};for(let s=0;s<2;s++)for(let i=0;i<3;i++)spawn(r,s,'scout',bases[s].x+(s?-70:70),205+i*70);rooms.set(id,r);return r}
const notify=(r,m)=>r.p.forEach(p=>send(p,m));
const snapshot=r=>({type:'state',id:r.id,started:r.started,winner:r.winner,units:r.units,bases:r.bases,gold:r.gold,players:r.p.map(p=>p?.readyState===1)});
function step(r,dt){if(!r.started||r.winner!==null)return;
for(let s=0;s<2;s++){r.gold[s]=Math.min(9999,r.gold[s]+15*dt);let q=r.queue[s];if(q.length){q[0].time-=dt;if(q[0].time<=0){let k=q.shift().kind;spawn(r,s,k,bases[s].x+(s?-70:70),175+Math.random()*200)}}}
for(const u of r.units){let k=specs[u.k];u.cd=Math.max(0,u.cd-dt);let enemies=[...r.units.filter(v=>v.s!==u.s),...r.bases.filter(v=>v.s!==u.s)];let target=enemies.sort((a,b)=>Math.hypot(u.x-a.x,u.y-a.y)-Math.hypot(u.x-b.x,u.y-b.y))[0];let dist=target?Math.hypot(u.x-target.x,u.y-target.y):Infinity;let aggro=!!target&&dist<k.range+95;let goal=aggro&&dist>k.range*.9?target:{x:u.tx,y:u.ty};if(!aggro||dist>k.range){let d=Math.hypot(goal.x-u.x,goal.y-u.y);if(d>2){let f=Math.min(d,k.speed*dt)/d;u.x+=(goal.x-u.x)*f;u.y+=(goal.y-u.y)*f}}if(aggro&&dist<=k.range&&u.cd<=0){target.hp-=k.dmg;u.cd=k.rate}}
r.units=r.units.filter(u=>u.hp>0);let lost=r.bases.find(b=>b.hp<=0);if(lost){r.winner=1-lost.s;notify(r,{type:'finished',winner:r.winner})}}
const page=fs.readFileSync(path.join(__dirname,'index.html'));const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(page)});const wss=new WebSocketServer({server});
wss.on('connection',ws=>{ws.on('message',raw=>{if(raw.length>3000)return;let m;try{m=JSON.parse(raw)}catch{return}
if(m.type==='join'){if(ws.r)return;let id=String(m.id||'').toUpperCase();if(id==='NEW'){do{id=crypto.randomBytes(4).toString('hex').toUpperCase()}while(rooms.has(id));make(id)}let r=rooms.get(id);if(!r)return send(ws,{type:'error',message:'방이 없거나 만료되었습니다.'});let s=r.p.findIndex(p=>p?.readyState!==1);if(s<0)return send(ws,{type:'error',message:'방이 가득 찼습니다.'});r.p[s]=ws;ws.r=r;ws.s=s;send(ws,{type:'joined',id,s});if(r.p.every(p=>p?.readyState===1))r.started=true;notify(r,snapshot(r));return}
let r=ws.r,s=ws.s;if(!r||!r.started||r.winner!==null||r.p[s]!==ws)return;
if(m.type==='produce'&&specs[m.kind]&&r.gold[s]>=specs[m.kind].cost&&r.queue[s].length<5){r.gold[s]-=specs[m.kind].cost;r.queue[s].push({kind:m.kind,time:m.kind==='scout'?2:4})}
if(m.type==='move'&&Array.isArray(m.ids)&&Number.isFinite(m.x)&&Number.isFinite(m.y)){let ids=m.ids.slice(0,100),x=Math.max(0,Math.min(W,m.x)),y=Math.max(0,Math.min(H,m.y));r.units.filter(u=>u.s===s&&ids.includes(u.id)).forEach((u,i)=>{u.tx=x+(i%5-2)*20;u.ty=y+(Math.floor(i/5)-1)*20})}});
ws.on('close',()=>{let r=ws.r;if(r&&r.p[ws.s]===ws){r.p[ws.s]=null;r.started=false;notify(r,{type:'notice',message:'상대방 연결이 종료됐습니다.'})}})});
setInterval(()=>{for(let [id,r]of rooms){if(Date.now()-r.created>7200000&&r.p.every(p=>p?.readyState!==1)){rooms.delete(id);continue}step(r,.05);if(r.p.some(p=>p?.readyState===1))notify(r,snapshot(r))}},50);
server.listen(port,'0.0.0.0',()=>console.log('MINI RTS listening '+port));