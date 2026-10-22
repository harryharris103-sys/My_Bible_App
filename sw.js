const C='scripture-v0.0.4',A=['./','index.html','manifest.webmanifest','icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=C).map(x=>caches.delete(x)))).then(()=>clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!='GET'||u.origin!=location.origin||/\.(json|ewb)$/i.test(u.pathname))return;
e.respondWith(caches.open(C).then(async c=>{const m=await c.match(r,{ignoreSearch:true});const n=fetch(r).then(x=>{if(x.ok)c.put(r,x.clone());return x}).catch(()=>m);return m||n}))});
// ---------- daily verses ----------
const DB=()=>new Promise((ok,no)=>{const q=indexedDB.open('scripture');q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)});
const idbGet=async(s,k)=>{try{const d=await DB();return await new Promise(ok=>{const r=d.transaction(s).objectStore(s).get(k);r.onsuccess=()=>ok(r.result);r.onerror=()=>ok(null)})}catch(e){return null}};
const idbPut=async(s,v)=>{try{const d=await DB();await new Promise(ok=>{const t=d.transaction(s,'readwrite');t.objectStore(s).put(v);t.oncomplete=ok;t.onerror=ok})}catch(e){}};
const LB={morning:'Morning',afternoon:'Afternoon',night:'Night',test:'Verse of the moment'};
async function check(test){const R=await idbGet('meta','__notify');if(!R||(!R.on&&!test))return;
 const now=new Date(),day=now.toLocaleDateString('en-CA');R.last=R.last||{};R.seen=R.seen||[];
 const due=test?[{k:'test'}]:(R.slots||[]).filter(s=>{if(!s.on)return false;const[h,m]=s.t.split(':'),T=new Date(now);T.setHours(+h,+m,0,0);return now>=T&&now-T<144e5&&R.last[s.k]!=day});
 if(!due.length)return;const B=await idbGet('bible',R.ver);if(!B)return;
 const seen=new Set(R.seen),pool=[];for(const b of B.books)for(const c in B.data[b])for(const v in B.data[b][c]){const t=B.data[b][c][v];if(t.length>=40&&t.length<=320&&!seen.has(b+c+':'+v))pool.push([b,+c,+v,t])}
 for(const s of due){if(!pool.length)break;const[b,c,v,t]=pool.splice(Math.random()*pool.length|0,1)[0],e=(B.rg&&B.rg[b]&&B.rg[b][c]&&B.rg[b][c][v])||v;
  R.seen=[...R.seen.slice(-199),b+c+':'+v];if(!test)R.last[s.k]=day;
  await self.registration.showNotification(`${LB[s.k]}: ${b} ${c}:${v}${e>v?'-'+e:''} (${R.ver})`,{body:t,icon:'icon.svg',tag:'verse-'+s.k+(test?Date.now():day),data:{b,c,v,ver:R.ver}})}
 await idbPut('meta',R)}
self.addEventListener('message',e=>{if(e.data&&e.data.cmd)e.waitUntil(check(e.data.cmd=='test'))});
self.addEventListener('periodicsync',e=>{if(e.tag=='daily-verse')e.waitUntil(check())});
self.addEventListener('notificationclick',e=>{e.notification.close();const d=e.notification.data||{};
 e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{if(cs[0]){cs[0].postMessage({go:d});return cs[0].focus()}return clients.openWindow('./?go='+encodeURIComponent(JSON.stringify(d)))}))});
