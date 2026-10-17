import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,signInWithEmailAndPassword,signInAnonymously,signOut,onAuthStateChanged,sendPasswordResetEmail} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore,collection,doc,getDoc,setDoc,deleteDoc,getDocs,writeBatch,onSnapshot,query,orderBy,limit,serverTimestamp,Timestamp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyCkcLwOQVtjDNyaqjY0hM2mCDl4GytQRTE",authDomain:"nezi-settings.firebaseapp.com",databaseURL:"https://nezi-settings-default-rtdb.firebaseio.com",projectId:"nezi-settings",storageBucket:"nezi-settings.firebasestorage.app",messagingSenderId:"964059278629",appId:"1:964059278629:web:f1d54b1f47703c017a3ecc",measurementId:"G-4M9QH95MFQ"};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=u=>/^https:\/\/[^\s]+$/i.test(u||'')?u:'';
const fmt=ts=>ts?.toDate?ts.toDate().toLocaleDateString('ru'):'';
const toast=(t,e)=>{const x=$('#toast');x.textContent=t;x.classList.toggle('e',!!e);x.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>x.classList.remove('show'),2400)};
const open=(id,f)=>{$(id).classList.add('on');setTimeout(()=>$(f||id+' input')?.focus(),30)},closeM=()=>$$('.modal').forEach(m=>m.classList.remove('on'));
$$('[data-close]').forEach(b=>b.onclick=closeM);
$$('.modal').forEach(m=>m.onclick=e=>{if(e.target===m)closeM()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeM()});
$('#burger').onclick=()=>{const o=$('#nav').classList.toggle('open');$('#burger').setAttribute('aria-expanded',o)};
$$('#nav a').forEach(a=>a.onclick=()=>$('#nav').classList.remove('open'));

/* ===== Тема / тексты (settings/theme — коллекция и поля сохранены) ===== */
const DEF={title:'Nezi Settings',hero:'Мои настройки. Моя игра.',sub:'CFG, прицелы и настройки CS2 — всё в одном месте',guns:'https://guns.lol/nezimentality',tg:'https://t.me/Neziqq',steam:'',accent:'#17181A',radius:12,font:'Inter',fcNick:'',fcUrl:'',fcLevel:'',fcElo:'',fcUpd:''};
let T={...DEF},saved={...DEF},dirty=false;
const SOC=[['guns','guns.lol'],['tg','Telegram'],['steam','Steam']];
function applyTheme(t){T={...DEF,...t};const s=document.documentElement.style;
 s.setProperty('--ac',/^#[0-9a-f]{6}$/i.test(T.accent)?T.accent:DEF.accent);s.setProperty('--r',(+T.radius||12)+'px');s.setProperty('--font',`'${T.font==='Manrope'?'Manrope':'Inter'}'`);
 if(T.font==='Manrope'&&!$('#fm')){const l=document.createElement('link');l.id='fm';l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap';document.head.append(l)}
 $('#logo').textContent=T.title;$('#fLogo').textContent=T.title;$('#hero').textContent=T.hero;$('#sub').textContent=T.sub;document.title=T.title;
 const h=SOC.filter(([k])=>safeUrl(T[k])).map(([k,n])=>`<a class="soc" href="${esc(T[k])}" target="_blank" rel="noopener noreferrer">${n}</a>`).join('');$('#soc').innerHTML=h;$('#soc2').innerHTML=h;renderFaceit()}
try{applyTheme(JSON.parse(localStorage.nzTheme2||'{}'))}catch{applyTheme({})}
onSnapshot(doc(db,'settings','theme'),s=>{if(s.exists()){const d=s.data();saved={...DEF,...d};if(!dirty){applyTheme(d);fillForm()}try{localStorage.nzTheme2=JSON.stringify(d)}catch{}}},()=>{});
const fillForm=()=>$$('[data-t]').forEach(i=>i.value=T[i.dataset.t]??'');
function mark(d){dirty=d;$('#st').textContent=d?'Есть несохранённые изменения':'Всё сохранено';$('#st').classList.toggle('d',d)}
$('#adm').addEventListener('input',e=>{const i=e.target.closest('[data-t]');if(!i)return;applyTheme({...T,[i.dataset.t]:i.type==='range'?+i.value:i.value});mark(true)});
$('#tSave').onclick=async e=>{const b=e.target;const bad=SOC.find(([k])=>T[k]&&!safeUrl(T[k]));if(bad)return toast('Ссылка '+bad[1]+' должна начинаться с https://',1);
 b.disabled=true;try{await setDoc(doc(db,'settings','theme'),T,{merge:true});saved={...T};mark(false);toast('Сохранено')}catch(x){toast('Не удалось сохранить: '+x.code,1)}b.disabled=false};
$('#tReset').onclick=()=>{applyTheme(saved);fillForm();mark(false)};

/* ===== Админ-доступ: определяется только правилами Firestore ===== */
let admin=false,user=null,unsubQR=null,items=[],cf='all';
const approveId=new URLSearchParams(location.search).get('approve');
async function probe(){for(const f of [()=>getDoc(doc(db,'admin','probe')),()=>getDocs(query(collection(db,'visits'),limit(1)))]){try{await f();return true}catch{}}return false}
function setAdmin(v){admin=v;$('#bPanel').style.display=v?'':'none';$('#bLogin').style.display=v?'none':'';renderAdmin();if(v){closeM()}else $('#adm').classList.remove('on')}
async function check(u){const ok=await probe();setAdmin(ok);if(ok&&approveId&&!u.isAnonymous)open('#mAp','#bYes')}
onAuthStateChanged(auth,u=>{unsubQR&&unsubQR();user=u;
 if(!u)setAdmin(false);
 else if(u.isAnonymous)unsubQR=onSnapshot(doc(db,'qr',u.uid),s=>{const d=s.data();d&&d.approved&&d.exp.toMillis()>Date.now()?check(u):setAdmin(false)},()=>setAdmin(false));
 else check(u);
 if(approveId&&!u)openAuth(true)});
function openAuth(n){$('#aSub').textContent=n?'Войдите, чтобы подтвердить вход на другом устройстве':'Только для владельца сайта';$('#lerr').textContent='';open('#mAuth','#lg')}
$('#bLogin').onclick=()=>openAuth();
$('#pwT').onclick=()=>{const p=$('#pw'),h=p.type==='password';p.type=h?'text':'password';$('#pwT').textContent=h?'Скрыть':'Показать'};
const AERR={'auth/invalid-credential':'Неверная почта или пароль','auth/invalid-email':'Проверьте адрес почты','auth/too-many-requests':'Слишком много попыток, попробуйте позже','auth/network-request-failed':'Нет соединения'};
$('#bDo').onclick=async e=>{const b=e.target;b.disabled=true;b.textContent='Входим…';$('#lerr').textContent='';
 try{await signInWithEmailAndPassword(auth,$('#lg').value.trim(),$('#pw').value);$('#pw').value='';
  setTimeout(()=>{if(!admin&&user&&!user.isAnonymous)$('#lerr').textContent='Аккаунт вошёл, но не имеет прав владельца'},1500)}
 catch(x){$('#lerr').textContent=AERR[x.code]||('Ошибка: '+x.code)}b.disabled=false;b.textContent='Войти'};
$('#bReset').onclick=async()=>{const m=$('#lg').value.trim();if(!m)return $('#lerr').textContent='Введите почту выше';try{await sendPasswordResetEmail(auth,m);$('#lerr').textContent='Если аккаунт существует, письмо отправлено'}catch(x){$('#lerr').textContent=AERR[x.code]||x.code}};
$('#bQR').onclick=async()=>{try{const u=auth.currentUser?.isAnonymous?auth.currentUser:(await signInAnonymously(auth)).user;$('#qrwrap').style.display='block';$('#qrbox').innerHTML='';new QRCode($('#qrbox'),{text:location.origin+location.pathname+'?approve='+u.uid,width:190,height:190})}catch(x){$('#lerr').textContent='QR недоступен: '+x.code}};
$('#bYes').onclick=async()=>{try{await setDoc(doc(db,'qr',approveId),{approved:true,exp:Timestamp.fromMillis(Date.now()+12*3600e3)});history.replaceState({},'',location.pathname);closeM();toast('Вход подтверждён')}catch(x){toast('Нет прав подтверждать вход',1)}};
$('#bOut').onclick=async()=>{$('#adm').classList.remove('on');await signOut(auth);toast('Вы вышли')};

/* ===== Публичный сайт ===== */
onSnapshot(query(collection(db,'items'),orderBy('ts','desc')),s=>{items=s.docs.map(d=>({id:d.id,...d.data()}));renderAll()},e=>{console.error(e);toast('Не удалось загрузить данные',1)});
const typ=t=>t==='settings'?'cfg':t,by=t=>items.filter(i=>typ(i.type)===t);
const lines=c=>(c||'').split('\n').length,kb=c=>(new Blob([c||'']).size/1024).toFixed(1);
async function copy(t){try{await navigator.clipboard.writeText(t)}catch{const a=document.createElement('textarea');a.value=t;a.style.position='fixed';document.body.append(a);a.select();let ok=false;try{ok=document.execCommand('copy')}catch{}a.remove();if(!ok)return toast('Не удалось скопировать',1)}toast('Скопировано')}
function dl(it){const n=(it.name||it.title||'config').replace(/[^\w\-.]+/g,'_').replace(/\.cfg$/i,'')+'.cfg',u=URL.createObjectURL(new Blob([it.content],{type:'text/plain;charset=utf-8'})),a=Object.assign(document.createElement('a'),{href:u,download:n});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000)}
function empty(t){return `<div class="empty">${t}</div>`}
function renderAll(){renderHero();renderCfg();renderCh();renderSet();renderBinds();renderFaceit();renderAdmin()}
function renderHero(){const c=by('crosshair')[0];$('#hCh').innerHTML=c?`<div class="lb">Текущий прицел</div><div class="code">${esc(c.content)}</div><button class="btn s" data-cp="${c.id}">Копировать код</button>`:`<div class="lb">Прицел</div><div class="code" style="color:#8d8f94">Код прицела появится здесь</div>`}
function renderCfg(){const l=by('cfg');$('#gCfg').innerHTML=l.length?l.map(it=>`<article class="card"><div class="meta"><span class="chip">CFG</span><span>${fmt(it.ts)}</span></div><h3>${esc(it.title)}</h3>${it.desc?`<p>${esc(it.desc)}</p>`:''}
<div class="pre">${esc((it.content||'').split('\n').slice(0,6).join('\n'))}</div><div class="meta"><span>${lines(it.content)} строк · ${kb(it.content)} КБ</span></div>
<details><summary>Показать целиком</summary><div class="pre">${esc((it.content||'').slice(0,20000))}</div></details>
<div class="row"><button class="btn" data-dl="${it.id}">Скачать .cfg</button><button class="btn g" data-cp="${it.id}">Копировать</button></div></article>`).join(''):empty('Конфиги скоро появятся')}
function renderCh(){const l=by('crosshair');$('#gCh').innerHTML=l.length?l.map(it=>`<article class="card"><div class="meta"><span class="chip">Прицел</span><span>${fmt(it.ts)}</span></div><h3>${esc(it.title)}</h3>${it.desc?`<p>${esc(it.desc)}</p>`:''}<div class="dark"><div class="code" style="margin:0">${esc(it.content)}</div></div><div class="row"><button class="btn" data-cp="${it.id}">Копировать код</button></div></article>`).join(''):empty('Прицелы скоро появятся')}
function renderSet(){const l=by('setting').slice().reverse(),g={};l.forEach(i=>(g[i.group||'Другое']??=[]).push(i));
 $('#gSet').innerHTML=l.length?Object.entries(g).map(([n,r])=>`<article class="card"><div class="lb">${esc(n)}</div>${r.map(i=>`<div class="kv"><span>${esc(i.title)}</span><b>${esc(i.content)}</b></div>`).join('')}</article>`).join(''):empty('Настройки скоро появятся')}
function renderBinds(){const q=$('#bq').value.trim().toLowerCase(),l=by('bind').slice().reverse().filter(i=>!q||[i.title,i.key,i.content,i.group].join(' ').toLowerCase().includes(q));
 $('#gBind').innerHTML=l.length?l.map(i=>`<div class="br"><span>${i.key?`<span class="key">${esc(i.key)}</span>`:`<span class="lb">${esc(i.group||'')}</span>`}</span><span>${esc(i.title)}</span><code>${esc(i.content)}</code><button class="btn g s" data-cp="${i.id}">Копировать</button></div>`).join(''):empty(q?'Ничего не найдено':'Бинды скоро появятся')}
$('#bq').oninput=renderBinds;
function renderFaceit(){const t=T,has=t.fcNick||t.fcElo||t.fcLevel;
 $('#gFc').innerHTML=has?`<div class="tbl"><div class="fc"><div><span>Ник</span><b>${esc(t.fcNick||'—')}</b></div><div><span>Уровень</span><b>${esc(t.fcLevel||'—')}</b></div><div><span>ELO</span><b>${esc(t.fcElo||'—')}</b></div></div><div class="br" style="grid-template-columns:1fr auto"><span class="lb">${t.fcUpd?'Данные обновлены: '+esc(t.fcUpd):'Дата обновления не указана'}</span>${safeUrl(t.fcUrl)?`<a class="btn g s" href="${esc(t.fcUrl)}" target="_blank" rel="noopener noreferrer">Открыть профиль</a>`:''}</div></div>`:empty('Статистика FACEIT пока не добавлена')}
document.addEventListener('click',e=>{const c=e.target.closest('[data-cp]'),d=e.target.closest('[data-dl]');
 if(c){const it=items.find(i=>i.id===c.dataset.cp);if(it)copy(it.content)}if(d){const it=items.find(i=>i.id===d.dataset.dl);if(it)dl(it)}});
$('#hDl').onclick=()=>{const c=by('cfg')[0];c?dl(c):(toast('CFG пока нет'),location.hash='#cfg')};

/* ===== Админка ===== */
const TL={cfg:'CFG',crosshair:'Прицел',setting:'Настройка',bind:'Бинд'};
$('#bPanel').onclick=()=>{fillForm();mark(dirty);goPage('ov');$('#adm').classList.add('on')};
$('#bClose').onclick=()=>{if(dirty&&!confirm('Есть несохранённые изменения. Закрыть панель?'))return;$('#adm').classList.remove('on')};
function goPage(p){$$('.nv[data-p]').forEach(b=>b.classList.toggle('on',b.dataset.p===p));$$('.pg').forEach(g=>g.classList.toggle('on',g.id==='p-'+p));$('#sv').classList.toggle('on',['fc','ap','tx'].includes(p))}
$$('.nv[data-p]').forEach(b=>b.onclick=()=>goPage(b.dataset.p));
function renderAdmin(){if(!admin)return;const n=items.length,last=items.map(i=>i.ts?.toMillis?.()||0).sort((a,b)=>b-a)[0];
 $('#sA').textContent=n;$('#sC').textContent=by('cfg').length;$('#sX').textContent=by('crosshair').length;$('#sB').textContent=by('setting').length+by('bind').length;$('#sL').textContent=last?new Date(last).toLocaleString('ru'):'Записей пока нет';
 $('#chips').innerHTML=['all','cfg','crosshair','setting','bind'].map(k=>`<button data-cf="${k}" class="${cf===k?'on':''}">${k==='all'?'Все':TL[k]}</button>`).join('');
 const l=items.filter(i=>cf==='all'||typ(i.type)===cf);
 $('#cList').innerHTML=l.length?l.map(i=>`<div class="lr"><span class="chip" style="width:fit-content">${TL[typ(i.type)]||'CFG'}</span><div><b>${esc(i.title)}</b><small>${fmt(i.ts)}${i.group?' · '+esc(i.group):''}</small></div><div class="row"><button class="btn g s" data-ed="${i.id}">Изменить</button><button class="btn r s" data-rm="${i.id}">Удалить</button></div></div>`).join(''):'<div style="padding:24px 0;color:var(--mu)">Записей пока нет</div>'}
$('#chips').onclick=e=>{const b=e.target.closest('[data-cf]');if(b){cf=b.dataset.cf;renderAdmin()}};
$('#cList').onclick=async e=>{const m=e.target.closest('[data-ed]'),r=e.target.closest('[data-rm]');
 if(m)edit(items.find(i=>i.id===m.dataset.ed));
 if(r){const it=items.find(i=>i.id===r.dataset.rm);if(it&&confirm(`Удалить «${it.title}»?`))try{await deleteDoc(doc(db,'items',it.id));toast('Удалено')}catch(x){toast('Не удалось удалить: '+x.code,1)}}};
let eId=null,eT='cfg',eName='';
const LBL={cfg:['Название','Содержимое CFG'],crosshair:['Название','Код прицела'],setting:['Параметр (например: DPI)','Значение'],bind:['Описание действия','Команда или bind']};
function setType(t){eT=t;$$('#seg button').forEach(b=>b.classList.toggle('on',b.dataset.ty===t));$('#lT').textContent=LBL[t][0];$('#lC').textContent=LBL[t][1];
 $('#fG').style.display=t==='setting'||t==='bind'?'':'none';$('#fK').style.display=t==='bind'?'':'none';$('#fF').style.display=t==='cfg'?'':'none';$('#eC').style.minHeight=t==='cfg'?'170px':'70px'}
$('#seg').onclick=e=>{const b=e.target.closest('button');if(b)setType(b.dataset.ty)};
function edit(it){eId=it?.id||null;eName=it?.name||'';$('#eh').textContent=it?'Редактировать':'Новая запись';setType(it?typ(it.type):'cfg');$('#seg').style.display=it?'none':'';
 $('#eT').value=it?.title||'';$('#eG').value=it?.group||'';$('#eK').value=it?.key||'';$('#eD').value=it?.desc||'';$('#eC').value=it?.content||'';$('#eF').value='';$('#fn').textContent=eName;$('#eerr').textContent='';open('#mEd','#eT')}
$('#qAdd').onclick=$('#cAdd').onclick=()=>edit();
$('#eF').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(f.size>900000)return $('#eerr').textContent='Файл больше ~900 КБ';$('#eC').value=await f.text();eName=f.name;$('#fn').textContent=`${f.name} · ${(f.size/1024).toFixed(1)} КБ`;if(!$('#eT').value)$('#eT').value=f.name.replace(/\.[^.]+$/,'')};
$('#bSave').onclick=async e=>{const b=e.target,t=$('#eT').value.trim(),c=eT==='cfg'?$('#eC').value:$('#eC').value.trim();
 if(!t||!c)return $('#eerr').textContent='Заполните название и содержимое';if(new Blob([c]).size>900000)return $('#eerr').textContent='Содержимое больше ~900 КБ';
 if((eT==='setting'||eT==='bind')&&!$('#eG').value.trim())return $('#eerr').textContent='Укажите группу';
 b.disabled=true;b.textContent='Сохраняем…';
 try{await setDoc(doc(db,'items',eId||doc(collection(db,'items')).id),{type:eT,title:t,desc:$('#eD').value.trim(),group:$('#eG').value.trim(),key:$('#eK').value.trim(),name:eT==='cfg'?(eName||t):'',content:c,ts:serverTimestamp()});closeM();toast('Сохранено')}
 catch(x){$('#eerr').textContent='Не удалось сохранить: '+x.code}b.disabled=false;b.textContent='Сохранить'};
$('#vClear').onclick=async e=>{if(!confirm('Удалить все ранее собранные записи о посетителях (IP, устройство)?'))return;e.target.disabled=true;
 try{const s=await getDocs(collection(db,'visits'));for(let i=0;i<s.docs.length;i+=200){const b=writeBatch(db);s.docs.slice(i,i+200).forEach(d=>b.delete(d.ref));await b.commit()}toast(s.size?`Удалено записей: ${s.size}`:'Старых данных нет')}catch(x){toast('Ошибка: '+x.code,1)}e.target.disabled=false};
