import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,signInWithEmailAndPassword,signInAnonymously,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore,collection,doc,getDoc,setDoc,addDoc,deleteDoc,onSnapshot,query,orderBy,limit,serverTimestamp,Timestamp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ====== 1. ВСТАВЬТЕ СВОЙ КОНФИГ FIREBASE (см. README) ====== */
const firebaseConfig={apiKey:"AIzaSyCkcLwOQVtjDNyaqjY0hM2mCDl4GytQRTE",authDomain:"nezi-settings.firebaseapp.com",databaseURL:"https://nezi-settings-default-rtdb.firebaseio.com",projectId:"nezi-settings",storageBucket:"nezi-settings.firebasestorage.app",messagingSenderId:"964059278629",appId:"1:964059278629:web:f1d54b1f47703c017a3ecc",measurementId:"G-4M9QH95MFQ"};
const ADMIN_DOMAIN="nezisettings.app"; // логин -> логин@nezisettings.app (должно совпадать с firestore.rules)

const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const toast=t=>{const e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2200)};
const open=id=>$(id).classList.add('on'),close=()=>$$('.modal').forEach(m=>m.classList.remove('on'));
$$('[data-close]').forEach(b=>b.onclick=close);
document.onmousemove=e=>{const g=$('#glow');g.style.left=e.clientX+'px';g.style.top=e.clientY+'px'};

/* ====== ТЕМА ====== */
const DEF={a1:'#7fffd4',a2:'#8b7bff',a3:'#ff8fab',bg:'#06161a',speed:1,blur:18,radius:18,font:'Rajdhani',title:'Nezi Settings',sub:'CFG, прицелы и настройки CS2 — всё в одном месте',blobs:true,grid:true,particles:true};
let T={...DEF};
function applyTheme(t){T={...DEF,...t};const s=document.documentElement.style;
 ['a1','a2','a3','bg','speed'].forEach(k=>s.setProperty('--'+k,T[k]));s.setProperty('--blur',T.blur+'px');s.setProperty('--r',T.radius+'px');
 s.setProperty('--font',`'${T.font}'`);
 if(!$('#gf'+T.font)){const l=document.createElement('link');l.id='gf'+T.font;l.rel='stylesheet';l.href=`https://fonts.googleapis.com/css2?family=${T.font.replace(' ','+')}:wght@400;600;700&display=swap`;document.head.append(l)}
 $('#title').textContent=T.title;$('#sub').textContent=T.sub;
 document.body.classList.toggle('noblobs',!T.blobs);document.body.classList.toggle('nogrid',!T.grid);}
try{applyTheme(JSON.parse(localStorage.nzTheme||'{}'))}catch{applyTheme({})}
onSnapshot(doc(db,'settings','theme'),s=>{if(s.exists()){applyTheme(s.data());localStorage.nzTheme=JSON.stringify(s.data());fillPanel()}},()=>{});
function fillPanel(){$$('[data-t]').forEach(i=>{const v=T[i.dataset.t];i.type==='checkbox'?i.checked=!!v:i.value=v})}
$$('[data-t]').forEach(i=>i.oninput=()=>{const t={...T};$$('[data-t]').forEach(x=>t[x.dataset.t]=x.type==='checkbox'?x.checked:x.type==='range'?+x.value:x.value);applyTheme(t)});
$('#tSave').onclick=async()=>{await setDoc(doc(db,'settings','theme'),T);toast('Тема сохранена')};
$('#tReset').onclick=()=>{applyTheme(DEF);fillPanel()};
$$('.ptab').forEach(b=>b.onclick=()=>{$$('.ptab').forEach(x=>x.classList.remove('on'));b.classList.add('on');$('#pth').style.display=b.dataset.p==='th'?'':'none';$('#pvs').style.display=b.dataset.p==='vs'?'':'none'});

/* ====== ЧАСТИЦЫ ====== */
(()=>{const c=$('#pc'),x=c.getContext('2d');let W,H;const rs=()=>{W=c.width=innerWidth;H=c.height=innerHeight};rs();onresize=rs;
const P=Array.from({length:70},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*2+.5,vx:(Math.random()-.5)*.3,vy:-Math.random()*.5-.1}));
(function f(){x.clearRect(0,0,W,H);if(T.particles)P.forEach((p,i)=>{p.x+=p.vx*T.speed;p.y+=p.vy*T.speed;if(p.y<-5){p.y=H+5;p.x=Math.random()*W}x.globalAlpha=.5;x.fillStyle=i%3?T.a1:i%2?T.a2:T.a3;x.beginPath();x.arc(p.x,p.y,p.r,0,7);x.fill()});requestAnimationFrame(f)})()})();

/* ====== АВТОРИЗАЦИЯ ====== */
let admin=false,unsubQR=null,items=[];
const approveId=new URLSearchParams(location.search).get('approve');
function setAdmin(v){admin=v;document.body.classList.toggle('admin',v);$('#bLogin').style.display=v?'none':'';localStorage.nzAdmin=v?'1':'';render();
 if(v){close();if(approveId&&!auth.currentUser.isAnonymous)open('#mApprove');watchVisits()}}
onAuthStateChanged(auth,u=>{unsubQR&&unsubQR();
 if(u&&!u.isAnonymous)setAdmin(true);
 else if(u)unsubQR=onSnapshot(doc(db,'qr',u.uid),s=>{const d=s.data();setAdmin(!!(d&&d.approved&&d.exp.toMillis()>Date.now()))},()=>setAdmin(false));
 else setAdmin(false);
 if(approveId&&!u)showLogin(true);});
function showLogin(note){$('#appNote').style.display=note?'block':'none';open('#mLogin')}
$('#bLogin').onclick=()=>showLogin();
$('#bDo').onclick=async()=>{try{await signInWithEmailAndPassword(auth,$('#lg').value.trim().toLowerCase()+'@'+ADMIN_DOMAIN,$('#pw').value);$('#pw').value=''}catch(e){$('#lerr').textContent='Ошибка: '+(e.code||e.message)}};
$('#bOut').onclick=async()=>{await signOut(auth);toast('Вы вышли')};
$('#bQR').onclick=async()=>{const u=auth.currentUser?.isAnonymous?auth.currentUser:(await signInAnonymously(auth)).user;
 $('#qrwrap').style.display='block';$('#qrbox').innerHTML='';new QRCode($('#qrbox'),{text:location.origin+location.pathname+'?approve='+u.uid,width:200,height:200})};
$('#bYes').onclick=async()=>{await setDoc(doc(db,'qr',approveId),{approved:true,exp:Timestamp.fromMillis(Date.now()+12*3600e3)});history.replaceState({},'',location.pathname);close();toast('Вход подтверждён ✔')};

/* ====== ЗАПИСИ ====== */
onSnapshot(query(collection(db,'items'),orderBy('ts','desc')),s=>{items=s.docs.map(d=>({id:d.id,...d.data()}));render()},e=>console.error(e));
let filter='all';
$$('.tab').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('on'));b.classList.add('on');filter=b.dataset.f;render()});
const L={cfg:'CFG',crosshair:'Прицел',settings:'Настройки'};
function render(){const list=items.filter(i=>filter==='all'||i.type===filter);
 $('#items').innerHTML=list.length?list.map((it,n)=>`<div class="card" style="--i:${n}"><span class="tag ${it.type}">${L[it.type]}</span><h3>${esc(it.title)}</h3><div class="d">${esc(it.desc)}</div>
 <div class="code">${esc(it.content.length>600?it.content.slice(0,600)+'…':it.content)}</div>
 <div class="row"><button class="btn" data-a="copy" data-id="${it.id}">Копировать</button><button class="btn sec" data-a="dl" data-id="${it.id}">Скачать</button>
 <button class="btn adm" data-a="edit" data-id="${it.id}">✎</button><button class="btn del adm" data-a="del" data-id="${it.id}">✕</button></div></div>`).join(''):'<div class="empty">Пока ничего нет</div>';
 $$('.card').forEach(c=>{c.onmousemove=e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform=`perspective(700px) rotateY(${x*8}deg) rotateX(${-y*8}deg) translateY(-4px)`};c.onmouseleave=()=>c.style.transform=''})}
$('#items').onclick=async e=>{const b=e.target.closest('[data-a]');if(!b)return;const it=items.find(i=>i.id===b.dataset.id);
 if(b.dataset.a==='copy'){await navigator.clipboard.writeText(it.content);toast('Скопировано')}
 if(b.dataset.a==='dl'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([it.content],{type:'text/plain'}));a.download=it.name||(it.title.replace(/\W+/g,'_')+(it.type==='cfg'?'.cfg':'.txt'));a.click()}
 if(b.dataset.a==='edit')edit(it);
 if(b.dataset.a==='del'&&confirm('Удалить?'))await deleteDoc(doc(db,'items',it.id))};
let editId=null;
function edit(it){editId=it?.id||null;$('#eh').textContent=it?'Редактировать':'Новая запись';$('#et').value=it?.type||'cfg';$('#en').value=it?.name||'';$('#ei').value=it?.title||'';$('#ed').value=it?.desc||'';$('#ec').value=it?.content||'';$('#ef').value='';open('#mEdit')}
$('#bNew').onclick=()=>edit();
$('#ef').onchange=async e=>{const f=e.target.files[0];if(!f)return;$('#ec').value=await f.text();$('#en').value=f.name;if(!$('#ei').value)$('#ei').value=f.name};
$('#bSave').onclick=async()=>{const c=$('#ec').value;if(!$('#ei').value||!c)return toast('Заполните название и содержимое');if(c.length>900000)return toast('Файл слишком большой (макс ~900 КБ)');
 const id=editId||doc(collection(db,'items')).id;await setDoc(doc(db,'items',id),{type:$('#et').value,name:$('#en').value,title:$('#ei').value,desc:$('#ed').value,content:c,ts:serverTimestamp()});close();toast('Сохранено')};
$('#bPanel').onclick=()=>{fillPanel();open('#mPanel')};

/* ====== ПОСЕТИТЕЛИ ====== */
let vOn=false;
function watchVisits(){if(vOn)return;vOn=true;onSnapshot(query(collection(db,'visits'),orderBy('ts','desc'),limit(150)),s=>{
 $('#vlist').innerHTML=s.docs.map(d=>{const v=d.data(),st=v.steam?(v.steam.startsWith('http')?v.steam:'https://'+v.steam):'';
 return `<div class="vis"><b>${esc(v.ip)}</b> · ${esc(v.loc)} · ${v.ts?v.ts.toDate().toLocaleString('ru'):''}<br>ID: ${esc(v.vid.slice(0,8))} ${st?`· Steam: <a target="_blank" rel="noopener" href="${esc(st)}">${esc(v.steam)}</a>`:''}<br><small>${esc(v.ua)}</small></div>`}).join('')||'Пока никого'})}
async function logVisit(steam){let g={};try{g=await(await fetch('https://ipwho.is/')).json()}catch{}
 const vid=localStorage.nzVid||(localStorage.nzVid=crypto.randomUUID());
 try{await addDoc(collection(db,'visits'),{vid,ip:g.ip||'?',loc:[g.city,g.country].filter(Boolean).join(', '),ua:navigator.userAgent.slice(0,200),steam:(steam||'').slice(0,150),ref:document.referrer.slice(0,150),ts:serverTimestamp()})}catch{}}
if(localStorage.nzNotice)$('#notice').remove();
$('#nOk').onclick=()=>{const s=$('#steam').value.trim();localStorage.nzNotice='1';$('#notice').remove();if(s)logVisit(s)};
setTimeout(()=>{if(!admin&&!localStorage.nzAdmin&&!sessionStorage.nzV&&!approveId){sessionStorage.nzV='1';logVisit()}},2000);
