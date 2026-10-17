import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,signInWithEmailAndPassword,signInAnonymously,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore,collection,doc,setDoc,addDoc,deleteDoc,getDocs,writeBatch,onSnapshot,query,orderBy,limit,serverTimestamp,Timestamp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyCkcLwOQVtjDNyaqjY0hM2mCDl4GytQRTE",authDomain:"nezi-settings.firebaseapp.com",databaseURL:"https://nezi-settings-default-rtdb.firebaseio.com",projectId:"nezi-settings",storageBucket:"nezi-settings.firebasestorage.app",messagingSenderId:"964059278629",appId:"1:964059278629:web:f1d54b1f47703c017a3ecc",measurementId:"G-4M9QH95MFQ"};
const ADMIN_DOMAIN="nezisettings.app";

const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const toast=t=>{const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),2200)};
const open=id=>$(id).classList.add('on'),close=()=>$$('.modal').forEach(m=>m.classList.remove('on'));
$$('[data-close]').forEach(b=>b.onclick=close);
const hover=matchMedia('(hover:hover)').matches;
document.onmousemove=e=>{const g=$('#glow');g.style.left=e.clientX+'px';g.style.top=e.clientY+'px'};

/* ===== ТЕМА ===== */
const DEF={a1:'#7fffd4',a2:'#8b7bff',a3:'#ff8fab',bg:'#050708',speed:1,blur:16,radius:16,font:'Rajdhani',title:'Nezi Settings',sub:'CFG, прицелы и настройки CS2 — всё в одном месте',guns:'https://guns.lol/nezimentality',tg:'https://t.me/Neziqq',steam:'',blobs:true,grid:true,particles:true,glow:true,tilt:true};
const PRESETS=[['Aqua','#7fffd4','#8b7bff','#ff8fab','#050708'],['Ice','#7fffd4','#4cc9f0','#b8f2e6','#04090b'],['Neon','#7fffd4','#ff4ecd','#ffd166','#07050a'],['Lagoon','#5eead4','#38bdf8','#a78bfa','#030a0c']];
let T={...DEF},dirty=false;
const SOC=[['guns','guns.lol'],['tg','Telegram'],['steam','Steam']];
function applyTheme(t){T={...DEF,...t};const s=document.documentElement.style;
 ['a1','a2','a3','bg','speed'].forEach(k=>s.setProperty('--'+k,T[k]));s.setProperty('--blur',T.blur+'px');s.setProperty('--r',T.radius+'px');s.setProperty('--font',`'${T.font}'`);
 if(!$('#gf'+T.font.replace(' ',''))){const l=document.createElement('link');l.id='gf'+T.font.replace(' ','');l.rel='stylesheet';l.href=`https://fonts.googleapis.com/css2?family=${T.font.replace(' ','+')}:wght@400;600;700&display=swap`;document.head.append(l)}
 $('#title').textContent=T.title;$('#logo').textContent=T.title;$('#sub').textContent=T.sub;document.title=T.title;
 const h=SOC.filter(([k])=>/^https?:\/\//i.test(T[k]||'')).map(([k,n])=>`<a class="soc" href="${esc(T[k])}" target="_blank" rel="noopener noreferrer">${n}</a>`).join('');
 $('#soc').innerHTML=h;$('#soc2').innerHTML=h;
 const c=document.body.classList;c.toggle('noblobs',!T.blobs);c.toggle('nogrid',!T.grid);c.toggle('noglow',!T.glow||!hover);}
try{applyTheme(JSON.parse(localStorage.nzTheme||'{}'))}catch{applyTheme({})}
onSnapshot(doc(db,'settings','theme'),s=>{if(s.exists()&&!dirty){applyTheme(s.data());localStorage.nzTheme=JSON.stringify(s.data());fillPanel()}},()=>{});
function fillPanel(){$$('[data-t]').forEach(i=>{const v=T[i.dataset.t];i.type==='checkbox'?i.checked=!!v:i.value=v??''})}
function mark(d){dirty=d;const p=$('#pstat');p.textContent=d?'Есть несохранённые изменения':'Всё сохранено';p.classList.toggle('dirty',d)}
$('#mPanel').addEventListener('input',e=>{const i=e.target.closest('[data-t]');if(!i)return;const v=i.type==='checkbox'?i.checked:i.type==='range'?+i.value:i.value;applyTheme({...T,[i.dataset.t]:v});mark(true)});
$('#pres').innerHTML=PRESETS.map((p,n)=>`<button class="pre" data-n="${n}"><i style="background:linear-gradient(90deg,${p[1]},${p[2]},${p[3]})"></i>${p[0]}</button>`).join('');
$('#pres').onclick=e=>{const b=e.target.closest('.pre');if(!b)return;const p=PRESETS[b.dataset.n];applyTheme({...T,a1:p[1],a2:p[2],a3:p[3],bg:p[4]});fillPanel();mark(true)};
$('#tSave').onclick=async()=>{try{await setDoc(doc(db,'settings','theme'),T);localStorage.nzTheme=JSON.stringify(T);mark(false);toast('Сохранено ✔')}catch(e){toast('Ошибка: '+e.code)}};
$('#tReset').onclick=()=>{applyTheme(DEF);fillPanel();mark(true)};
function goPage(p){$$('.nv[data-p]').forEach(b=>b.classList.toggle('on',b.dataset.p===p));$$('.pg').forEach(g=>g.classList.toggle('on',g.id==='p-'+p));$('#pbar').classList.toggle('on',p==='ap'||p==='tx')}
$$('.nv[data-p]').forEach(b=>b.onclick=()=>goPage(b.dataset.p));$$('[data-go]').forEach(b=>b.onclick=()=>goPage(b.dataset.go));

/* ===== ЧАСТИЦЫ ===== */
(()=>{const c=$('#pc'),x=c.getContext('2d');let W,H;const rs=()=>{W=c.width=innerWidth;H=c.height=innerHeight};rs();onresize=rs;
const P=Array.from({length:innerWidth<700?26:65},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.8+.4,vx:(Math.random()-.5)*.25,vy:-Math.random()*.45-.1}));
(function f(){x.clearRect(0,0,W,H);if(T.particles&&!document.hidden)P.forEach((p,i)=>{p.x+=p.vx*T.speed;p.y+=p.vy*T.speed;if(p.y<-5){p.y=H+5;p.x=Math.random()*W}x.globalAlpha=.45;x.fillStyle=i%3?T.a1:i%2?T.a2:T.a3;x.beginPath();x.arc(p.x,p.y,p.r,0,7);x.fill()});requestAnimationFrame(f)})()})();

/* ===== АВТОРИЗАЦИЯ ===== */
let admin=false,unsubQR=null,items=[];
const approveId=new URLSearchParams(location.search).get('approve');
function setAdmin(v){admin=v;document.body.classList.toggle('admin',v);$('#bLogin').style.display=v?'none':'';localStorage.nzAdmin=v?'1':'';render();
 if(v){close();if(approveId&&!auth.currentUser.isAnonymous)open('#mApprove');watchVisits();fillPanel()}}
onAuthStateChanged(auth,u=>{unsubQR&&unsubQR();
 if(u&&!u.isAnonymous)setAdmin(true);
 else if(u)unsubQR=onSnapshot(doc(db,'qr',u.uid),s=>{const d=s.data();setAdmin(!!(d&&d.approved&&d.exp.toMillis()>Date.now()))},()=>setAdmin(false));
 else setAdmin(false);
 if(approveId&&!u)showLogin(true)});
function showLogin(n){$('#appNote').style.display=n?'block':'none';open('#mLogin')}
$('#bLogin').onclick=()=>showLogin();
$('#bDo').onclick=async()=>{try{await signInWithEmailAndPassword(auth,(l=>l.includes('@')?l:l+'@'+ADMIN_DOMAIN)($('#lg').value.trim().toLowerCase()),$('#pw').value);$('#pw').value='';$('#lerr').textContent=''}catch(e){$('#lerr').textContent='Ошибка: '+(e.code||e.message)}};
$('#bOut').onclick=async()=>{close();await signOut(auth);toast('Вы вышли')};
$('#bQR').onclick=async()=>{const u=auth.currentUser?.isAnonymous?auth.currentUser:(await signInAnonymously(auth)).user;
 $('#qrwrap').style.display='block';$('#qrbox').innerHTML='';new QRCode($('#qrbox'),{text:location.origin+location.pathname+'?approve='+u.uid,width:200,height:200})};
$('#bYes').onclick=async()=>{await setDoc(doc(db,'qr',approveId),{approved:true,exp:Timestamp.fromMillis(Date.now()+12*3600e3)});history.replaceState({},'',location.pathname);close();toast('Вход подтверждён ✔')};

/* ===== ЗАПИСИ ===== */
onSnapshot(query(collection(db,'items'),orderBy('ts','desc')),s=>{items=s.docs.map(d=>({id:d.id,...d.data()}));render()},e=>console.error(e));
let filter='all';
$$('.tab').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('on'));b.classList.add('on');filter=b.dataset.f;render()});
const L={cfg:'CFG',crosshair:'Прицел',settings:'CFG'};
function render(){const list=items.filter(i=>filter==='all'||i.type===filter||(filter==='cfg'&&i.type==='settings'));
 $('#sIt').textContent=items.length;$('#sCh').textContent=items.filter(i=>i.type==='crosshair').length;
 $('#items').innerHTML=list.length?list.map((it,n)=>{const cr=it.type==='crosshair',c=it.content||'';
 return `<div class="card" style="--i:${Math.min(n,12)}"><div class="top"><span class="tag ${it.type}">${L[it.type]||'CFG'}</span><span>#${String(n+1).padStart(2,'0')}</span></div>
 <h3>${esc(it.title)}</h3>${it.desc?`<div class="d">${esc(it.desc)}</div>`:''}
 ${cr?`<div class="ch">${esc(c)}</div>`:`<div class="code">${esc(c.slice(0,500))}</div><div class="meta">${c.split('\n').length} строк · ${(new Blob([c]).size/1024).toFixed(1)} КБ</div>`}
 <div class="row">${cr?`<button class="btn" data-a="copy" data-id="${it.id}">Копировать код</button>`:`<button class="btn" data-a="dl" data-id="${it.id}">Скачать</button><button class="btn g" data-a="copy" data-id="${it.id}">Копировать</button>`}
 <button class="btn g adm" data-a="edit" data-id="${it.id}">✎</button><button class="btn d adm" data-a="del" data-id="${it.id}">✕</button></div></div>`}).join(''):'<div class="empty">Пока ничего нет</div>';
 if(hover&&T.tilt)$$('.card').forEach(c=>{c.onmousemove=e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform=`perspective(800px) rotateY(${x*7}deg) rotateX(${-y*7}deg) translateY(-4px)`};c.onmouseleave=()=>c.style.transform=''})}
$('#items').onclick=async e=>{const b=e.target.closest('[data-a]');if(!b)return;const it=items.find(i=>i.id===b.dataset.id);
 if(b.dataset.a==='copy'){try{await navigator.clipboard.writeText(it.content);toast('Скопировано ✔')}catch{toast('Не удалось скопировать')}}
 if(b.dataset.a==='dl'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([it.content],{type:'text/plain'}));a.download=it.name||(it.title.replace(/[^\w\-]+/g,'_')+'.cfg');a.click()}
 if(b.dataset.a==='edit')edit(it);
 if(b.dataset.a==='del'&&confirm('Удалить запись?'))await deleteDoc(doc(db,'items',it.id))};

let editId=null,eType='crosshair',eName='';
function setType(t){eType=t;$$('.seg button').forEach(b=>b.classList.toggle('on',b.dataset.ty===t));$('#fch').style.display=t==='crosshair'?'':'none';$('#fcfg').style.display=t==='cfg'?'':'none'}
$$('.seg button').forEach(b=>b.onclick=()=>setType(b.dataset.ty));
function edit(it){editId=it?.id||null;eName=it?.name||'';$('#eh').textContent=it?'Редактировать':'Новая запись';setType(it?(it.type==='crosshair'?'crosshair':'cfg'):'crosshair');
 $('#ei').value=it?.title||'';$('#ecode').value=it?.type==='crosshair'?it.content:'';$('#ec').value=it&&it.type!=='crosshair'?it.content:'';$('#ef').value='';$('#fn').textContent=eName;open('#mEdit')}
$('#bNew').onclick=()=>edit();$('#qAdd').onclick=()=>{close();edit()};
$('#bPanel').onclick=()=>{fillPanel();goPage('ov');open('#mPanel')};
$('#ef').onchange=async e=>{const f=e.target.files[0];if(!f)return;$('#ec').value=await f.text();eName=f.name;$('#fn').textContent=f.name;if(!$('#ei').value)$('#ei').value=f.name.replace(/\.[^.]+$/,'')};
$('#bSave').onclick=async()=>{const cr=eType==='crosshair',c=(cr?$('#ecode').value.trim():$('#ec').value),t=$('#ei').value.trim();
 if(!t||!c)return toast('Заполните название и '+(cr?'код':'содержимое'));if(c.length>900000)return toast('Файл слишком большой (до ~900 КБ)');
 const id=editId||doc(collection(db,'items')).id;
 try{await setDoc(doc(db,'items',id),{type:eType,title:t,desc:'',name:cr?'':(eName||t.replace(/[^\w\-]+/g,'_')+'.cfg'),content:c,ts:serverTimestamp()});close();toast('Сохранено ✔')}catch(e){toast('Ошибка: '+e.code)}};

/* ===== ПОСЕТИТЕЛИ ===== */
let vOn=false;
function watchVisits(){if(vOn)return;vOn=true;onSnapshot(query(collection(db,'visits'),orderBy('ts','desc'),limit(300)),s=>{
 const uni=new Set(s.docs.map(d=>d.data().vid));$('#sVi').textContent=s.size;$('#sUn').textContent=uni.size;$('#vcount').textContent=s.size?`Записей: ${s.size}`:'';
 $('#vlist').innerHTML=s.docs.map(d=>{const v=d.data(),st=v.steam?(/^https?:/i.test(v.steam)?v.steam:'https://'+v.steam):'';
 return `<div class="vis"><div><b>${esc(v.ip)}</b> · ${esc(v.loc||'—')} · ${v.ts?v.ts.toDate().toLocaleString('ru'):''}${st?`<br>Steam: <a target="_blank" rel="noopener noreferrer" href="${esc(st)}">${esc(v.steam)}</a>`:''}<small>ID ${esc((v.vid||'').slice(0,8))} · ${esc((v.ua||'').slice(0,90))}</small></div><button class="btn d s" data-vd="${d.id}">✕</button></div>`}).join('')||'<div style="color:var(--mut);padding:20px 0">Пока никого</div>'},e=>console.error(e))}
$('#vlist').onclick=async e=>{const b=e.target.closest('[data-vd]');if(b)await deleteDoc(doc(db,'visits',b.dataset.vd))};
$('#vClear').onclick=async()=>{if(!confirm('Удалить все записи о посетителях?'))return;try{const s=await getDocs(collection(db,'visits'));for(let i=0;i<s.docs.length;i+=200){const b=writeBatch(db);s.docs.slice(i,i+200).forEach(d=>b.delete(d.ref));await b.commit()}toast('Список очищен')}catch(e){toast('Ошибка: '+e.code)}};
async function logVisit(steam){let g={};try{g=await(await fetch('https://ipwho.is/')).json()}catch{}
 const vid=localStorage.nzVid||(localStorage.nzVid=crypto.randomUUID());
 try{await addDoc(collection(db,'visits'),{vid,ip:g.ip||'?',loc:[g.city,g.country].filter(Boolean).join(', '),ua:navigator.userAgent.slice(0,200),steam:(steam||'').slice(0,150),ref:document.referrer.slice(0,150),ts:serverTimestamp()})}catch{}}
if(localStorage.nzNotice)$('#notice').remove();
$('#nOk').onclick=()=>{const s=$('#steam').value.trim();localStorage.nzNotice='1';$('#notice').remove();if(s)logVisit(s)};
setTimeout(()=>{if(!admin&&!localStorage.nzAdmin&&!sessionStorage.nzV&&!approveId){sessionStorage.nzV='1';logVisit()}},2000);
