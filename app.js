import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,signInWithEmailAndPassword,signInAnonymously,signOut,onAuthStateChanged,sendPasswordResetEmail} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore,collection,doc,getDoc,setDoc,deleteDoc,getDocs,writeBatch,onSnapshot,query,orderBy,limit,serverTimestamp,Timestamp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyCkcLwOQVtjDNyaqjY0hM2mCDl4GytQRTE",authDomain:"nezi-settings.firebaseapp.com",databaseURL:"https://nezi-settings-default-rtdb.firebaseio.com",projectId:"nezi-settings",storageBucket:"nezi-settings.firebasestorage.app",messagingSenderId:"964059278629",appId:"1:964059278629:web:f1d54b1f47703c017a3ecc",measurementId:"G-4M9QH95MFQ"};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=u=>/^https:\/\/[^\s]+$/i.test(u||'')?u:'';
const fmt=ts=>ts?.toDate?ts.toDate().toLocaleDateString('ru'):'';
const sz=c=>new Blob([c||'']).size;
const LS=(k,v)=>{try{if(v===undefined)return localStorage[k];localStorage[k]=v}catch{}};

/* ---------- состояние ---------- */
const DEF={title:'Nezi Settings',hero:'Мои настройки. Моя игра.',sub:'CFG, прицелы и настройки CS2 — всё в одном месте',foot:'Неофициальный персональный проект. Не связан с Valve.',guns:'https://guns.lol/nezimentality',tg:'https://t.me/Neziqq',steam:'',acc:'#1F9E86',radius:12,font:'Inter',fcNick:'',fcUrl:'',fcLevel:'',fcElo:'',fcUpd:'',hide:{}};
let T={...DEF},saved={...DEF},dirty=false,items=[],loaded=false,admin=false,user=null,unsubQR=null,lastF=null;
const SOC=[['guns','guns.lol'],['tg','Telegram'],['steam','Steam']];
const SEC=[['cfg','CFG','CFG'],['crosshair','Прицел','Прицел'],['settings','Настройки','Игра и ПК'],['binds','Бинды','Команды'],['faceit','FACEIT','Профиль']];
const TL={cfg:'CFG',crosshair:'Прицел',setting:'Настройка',bind:'Бинд'};
const typ=t=>t==='settings'?'cfg':t;

/* ---------- тема светлая/тёмная ---------- */
const mq=matchMedia('(prefers-color-scheme:dark)');
function applyMode(anim){const m=LS('nzMode')||'system',d=m==='dark'||(m==='system'&&mq.matches),r=document.documentElement;
 if(anim){r.classList.add('tt');setTimeout(()=>r.classList.remove('tt'),450)}r.dataset.theme=d?'dark':'light';$('#tc').content=d?'#0B0C0D':'#F5F5F3';$$('[data-m]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===m))}
mq.addEventListener('change',()=>applyMode(true));applyMode();
document.addEventListener('click',e=>{const b=e.target.closest('[data-m]');if(b){LS('nzMode',b.dataset.m);applyMode(true)}});

/* ---------- UI-утилиты ---------- */
const toast=(t,e)=>{const x=$('#toast');x.textContent=t;x.classList.toggle('e',!!e);x.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>x.classList.remove('show'),2600)};
const open=(id,f)=>{lastF=document.activeElement;$(id).classList.add('on');setTimeout(()=>$(f||id+' input')?.focus(),60)};
function closeM(){$$('.modal.on').forEach(m=>m.id==='mCf'?ask.d?.(false):m.classList.remove('on'));lastF?.focus?.()}
function ask(t,s,ok='Подтвердить',danger){return new Promise(r=>{$('#cfT').textContent=t;$('#cfS').textContent=s||'';const b=$('#cfOk');b.textContent=ok;b.className='btn'+(danger?' dg':'');open('#mCf','#cfOk');ask.d=v=>{$('#mCf').classList.remove('on');ask.d=null;r(v)};b.onclick=()=>ask.d(true);$('#cfNo').onclick=()=>ask.d(false)})}
$$('[data-close]').forEach(b=>b.onclick=closeM);
$$('.modal').forEach(m=>m.onclick=e=>{if(e.target===m)m.id==='mCf'?ask.d?.(false):closeM()});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){const t=$$('.modal.on').pop();if(t)t.id==='mCf'?ask.d?.(false):closeM()}
 if(e.key==='Tab'){const ms=$$('.modal.on').sort((a,b)=>getComputedStyle(a).zIndex-getComputedStyle(b).zIndex),m=ms.pop();if(!m)return;
  const f=[...m.querySelectorAll('button,input,select,textarea,a[href]')].filter(x=>!x.disabled&&x.offsetParent);if(!f.length)return;
  if(e.shiftKey&&document.activeElement===f[0]){f.at(-1).focus();e.preventDefault()}else if(!e.shiftKey&&document.activeElement===f.at(-1)){f[0].focus();e.preventDefault()}}});
$('#burger').onclick=()=>{const o=$('#nav').classList.toggle('open');$('#burger').setAttribute('aria-expanded',o)};
$('#nav').onclick=e=>{if(e.target.closest('a'))$('#nav').classList.remove('open')};
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -5% 0px'});
const reveal=()=>$$('.rv:not(.in)').forEach((el,i)=>{el.style.transitionDelay=Math.min(i%6,5)*45+'ms';io.observe(el)});
addEventListener('scroll',()=>{let c='';SEC.forEach(([k])=>{const s=$('#'+k);if(!s.hidden&&s.getBoundingClientRect().top<140)c=k});$$('#nav a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+c))},{passive:true});
function save(name,text,mime='text/plain'){const u=URL.createObjectURL(new Blob([text],{type:mime+';charset=utf-8'})),a=Object.assign(document.createElement('a'),{href:u,download:name});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000)}
async function copy(t){try{await navigator.clipboard.writeText(t);return true}catch{const a=document.createElement('textarea');a.value=t;a.style.position='fixed';document.body.append(a);a.select();let ok=false;try{ok=document.execCommand('copy')}catch{}a.remove();return ok}}

/* ---------- настройки сайта: settings/theme ---------- */
function applyTheme(t){T={...DEF,...t,hide:{...(t.hide||{})}};const s=document.documentElement.style;
 T.acc!==DEF.acc&&/^#[0-9a-f]{6}$/i.test(T.acc)?s.setProperty('--acc-l',T.acc):s.removeProperty('--acc-l');
 s.setProperty('--r',(+T.radius||12)+'px');s.setProperty('--font',`'${T.font==='Manrope'?'Manrope':'Inter'}',system-ui,-apple-system,'Segoe UI',sans-serif`);
 if(T.font==='Manrope'&&!$('#fm')){const l=document.createElement('link');l.id='fm';l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap';document.head.append(l)}
 $('#logo').textContent=T.title;$('#fLogo').textContent=T.title;$('#hero').textContent=T.hero;$('#sub').textContent=T.sub;$('#foot').textContent=T.foot;document.title=T.title;
 const h=SOC.filter(([k])=>safeUrl(T[k])).map(([k,n])=>`<a class="soc" href="${esc(T[k])}" target="_blank" rel="noopener noreferrer">${n}</a>`).join('');$('#soc').innerHTML=h;$('#soc2').innerHTML=h;
 renderPublic();renderAdmin()}
const pick=t=>Object.fromEntries(Object.keys(DEF).filter(k=>k in t).map(k=>[k,t[k]]));
onSnapshot(doc(db,'settings','theme'),s=>{if(s.exists()){const d=s.data();saved={...DEF,...d};LS('nzTheme3',JSON.stringify(d));if(!dirty){applyTheme(d);fillForm()}}},()=>{});
const fillForm=()=>$$('[data-t]').forEach(i=>i.value=T[i.dataset.t]??'');
function mark(d){dirty=d;$('#st').textContent=d?'Есть несохранённые изменения':'Всё сохранено';$('#st').classList.toggle('d',d)}
$('#adm').addEventListener('input',e=>{const i=e.target.closest('[data-t]'),h=e.target.closest('[data-h]');
 if(i){applyTheme({...T,[i.dataset.t]:i.type==='range'?+i.value:i.value});mark(true)}
 if(h){applyTheme({...T,hide:{...T.hide,[h.dataset.h]:!h.checked}});mark(true)}});
$('#tSave').onclick=async e=>{const b=e.target,bad=SOC.find(([k])=>T[k]&&!safeUrl(T[k]))||(T.fcUrl&&!safeUrl(T.fcUrl)&&['','FACEIT']);
 if(bad)return toast('Ссылка '+bad[1]+' должна начинаться с https://',1);
 b.disabled=true;b.textContent='Сохраняем…';try{await setDoc(doc(db,'settings','theme'),pick(T),{merge:true});saved={...T};mark(false);toast('Сохранено')}catch(x){toast('Не удалось сохранить: '+x.code,1)}b.disabled=false;b.textContent='Сохранить'};
$('#tReset').onclick=()=>{applyTheme(saved);fillForm();mark(false)};

/* ---------- доступ (решают правила Firestore) ---------- */
const approveId=new URLSearchParams(location.search).get('approve');
async function probe(){for(const f of [()=>getDoc(doc(db,'admin','probe')),()=>getDocs(query(collection(db,'visits'),limit(1)))]){try{await f();return true}catch{}}return false}
function setAdmin(v){admin=v;$('#bPanel').hidden=!v;$('#bLogin').hidden=v;if(v){closeM();renderAdmin()}else{$('#adm').classList.remove('on');document.body.style.overflow=''}}
async function check(u){const ok=await probe();setAdmin(ok);if(ok&&approveId&&!u.isAnonymous)open('#mAp','#bYes')}
onAuthStateChanged(auth,u=>{unsubQR?.();user=u;
 if(!u)setAdmin(false);
 else if(u.isAnonymous)unsubQR=onSnapshot(doc(db,'qr',u.uid),s=>{const d=s.data();d&&d.approved&&d.exp.toMillis()>Date.now()?check(u):setAdmin(false)},()=>setAdmin(false));
 else check(u);
 if(approveId&&!u)openAuth(true)});
function openAuth(n){$('#aSub').textContent=n?'Войдите, чтобы подтвердить вход на другом устройстве':'Только для владельца сайта';$('#lerr').textContent='';open('#mAuth','#lg')}
$('#bLogin').onclick=()=>openAuth();
$('#pwT').onclick=()=>{const p=$('#pw'),h=p.type==='password';p.type=h?'text':'password';$('#pwT').textContent=h?'Скрыть':'Показать'};
const AERR={'auth/invalid-credential':'Неверная почта или пароль','auth/invalid-email':'Проверьте адрес почты','auth/too-many-requests':'Слишком много попыток, попробуйте позже','auth/network-request-failed':'Нет соединения'};
$('#bDo').onclick=async e=>{const b=e.target;b.disabled=true;b.textContent='Входим…';$('#lerr').textContent='';
 try{await signInWithEmailAndPassword(auth,$('#lg').value.trim(),$('#pw').value);$('#pw').value='';setTimeout(()=>{if(!admin&&user&&!user.isAnonymous)$('#lerr').textContent='Аккаунт вошёл, но не имеет прав владельца'},1800)}
 catch(x){$('#lerr').textContent=AERR[x.code]||('Ошибка: '+x.code)}b.disabled=false;b.textContent='Войти'};
$('#bReset').onclick=async()=>{const m=$('#lg').value.trim();if(!m)return $('#lerr').textContent='Введите почту выше';try{await sendPasswordResetEmail(auth,m);$('#lerr').textContent='Если аккаунт существует, письмо отправлено'}catch(x){$('#lerr').textContent=AERR[x.code]||x.code}};
$('#bQR').onclick=async()=>{try{const u=auth.currentUser?.isAnonymous?auth.currentUser:(await signInAnonymously(auth)).user;$('#qrwrap').hidden=false;$('#qrbox').innerHTML='';new QRCode($('#qrbox'),{text:location.origin+location.pathname+'?approve='+u.uid,width:190,height:190})}catch(x){$('#lerr').textContent='QR недоступен: '+x.code}};
$('#bYes').onclick=async()=>{try{await setDoc(doc(db,'qr',approveId),{approved:true,exp:Timestamp.fromMillis(Date.now()+12*3600e3)});history.replaceState({},'',location.pathname);closeM();toast('Вход подтверждён')}catch{toast('Нет прав подтверждать вход',1)}};
$('#bOut').onclick=async()=>{$('#adm').classList.remove('on');document.body.style.overflow='';await signOut(auth);toast('Вы вышли')};

/* ---------- данные ---------- */
onSnapshot(query(collection(db,'items'),orderBy('ts','desc')),s=>{items=s.docs.map(d=>({id:d.id,...d.data()}));loaded=true;renderPublic();renderAdmin()},e=>{console.error(e);loaded=true;renderPublic();toast('Не удалось загрузить данные',1)});
function sorted(l){return l.slice().sort((a,b)=>{const x=a.order,y=b.order;if(x!=null&&y!=null&&x!==y)return x-y;if((x!=null)!==(y!=null))return x!=null?-1:1;return(b.ts?.toMillis?.()||Infinity)-(a.ts?.toMillis?.()||Infinity)})}
const pub=t=>sorted(items.filter(i=>typ(i.type)===t&&i.status!=='draft'));
const secHas=k=>k==='cfg'?pub('cfg').length:k==='crosshair'?pub('crosshair').length:k==='settings'?pub('setting').length:k==='binds'?pub('bind').length:!!(T.fcNick||T.fcElo||T.fcLevel);
const secVis=k=>secHas(k)&&!T.hide?.[k];

/* ---------- карточки ---------- */
const chips=it=>`<span class="chip">${TL[typ(it.type)]||'CFG'}</span>${it.status==='draft'?'<span class="chip dr">черновик</span>':''}`;
function cardCfg(it){const c=it.content||'';return `<article class="card rv"><div class="meta"><span class="row" style="gap:6px;padding:0;margin:0">${chips(it)}</span><span>${fmt(it.ts)}</span></div><h3>${esc(it.title)}</h3>${it.desc?`<p>${esc(it.desc)}</p>`:''}<div class="pre">${esc(c.split('\n').slice(0,6).join('\n'))}</div><div class="meta"><span>${c.split('\n').length} строк · ${(sz(c)/1024).toFixed(1)} КБ</span></div><details><summary>Показать целиком</summary><div class="pre">${esc(c.slice(0,20000))}</div></details><div class="row"><button class="btn" data-dl="${it.id||''}">Скачать .cfg</button><button class="btn g" data-cp="${it.id||''}">Копировать</button></div></article>`}
function cardCh(it){return `<article class="card rv"><div class="meta"><span class="row" style="gap:6px;padding:0;margin:0">${chips(it)}</span><span>${fmt(it.ts)}</span></div><h3>${esc(it.title)}</h3>${it.desc?`<p>${esc(it.desc)}</p>`:''}<div class="dark"><div class="code" style="margin:0">${esc(it.content)}</div></div><div class="row"><button class="btn" data-cp="${it.id||''}">Копировать код</button></div></article>`}
const cardSet=(n,r)=>`<article class="card rv"><div class="lb">${esc(n)}</div>${r.map(i=>`<div class="kv"><span>${esc(i.title)}</span><b>${esc(i.content)}</b></div>`).join('')}</article>`;
const rowBind=i=>`<div class="br"><span>${i.key?`<span class="key">${esc(i.key)}</span>`:`<span class="lb">${esc(i.group||'')}</span>`}</span><span>${esc(i.title)}</span><code>${esc(i.content)}</code><button class="btn g s" data-cp="${i.id||''}">Копировать</button></div>`;

function renderPublic(){
 $('#skel').hidden=loaded;const vis=SEC.filter(([k])=>secVis(k));
 SEC.forEach(([k])=>$('#'+k).hidden=!secVis(k));
 $('#nav').innerHTML=vis.map(([k,n])=>`<a href="#${k}">${n}</a>`).join('');$('#burger').hidden=!vis.length;
 vis.forEach(([k,,l],i)=>$('#'+k+' [data-n]').textContent=String(i+1).padStart(2,'0')+' / '+l);
 const cf=pub('cfg')[0],ch=pub('crosshair')[0];
 $('#hCta').innerHTML=(secVis('cfg')&&cf?`<button class="btn" data-dl="${cf.id}">Скачать CFG</button>`:'')+(secVis('crosshair')?'<a class="btn g" href="#crosshair">Посмотреть прицел</a>':'');
 const hc=secVis('crosshair')&&ch;$('#hero0').classList.toggle('solo',!hc);$('#hCh').hidden=!hc;
 if(hc)$('#hCh').innerHTML=`<div class="lb">Текущий прицел</div><div class="code">${esc(ch.content)}</div><button class="btn s" data-cp="${ch.id}">Копировать код</button>`;
 if(secVis('cfg'))$('#gCfg').innerHTML=pub('cfg').map(cardCfg).join('');
 if(secVis('crosshair'))$('#gCh').innerHTML=pub('crosshair').map(cardCh).join('');
 if(secVis('settings')){const g={};pub('setting').forEach(i=>(g[i.group||'Другое']??=[]).push(i));$('#gSet').innerHTML=Object.entries(g).map(([n,r])=>cardSet(n,r)).join('')}
 if(secVis('binds'))renderBinds();
 if(secVis('faceit')){const t=T;$('#gFc').innerHTML=`<div class="tbl rv"><div class="fc"><div><span>Ник</span><b>${esc(t.fcNick||'—')}</b></div><div><span>Уровень</span><b>${esc(t.fcLevel||'—')}</b></div><div><span>ELO</span><b>${esc(t.fcElo||'—')}</b></div></div>${t.fcUpd||safeUrl(t.fcUrl)?`<div class="br" style="grid-template-columns:1fr auto"><span class="lb">${t.fcUpd?'Данные обновлены: '+esc(t.fcUpd):''}</span>${safeUrl(t.fcUrl)?`<a class="btn g s" href="${esc(t.fcUrl)}" target="_blank" rel="noopener noreferrer">Открыть профиль</a>`:''}</div>`:''}</div>`}
 reveal()}
function renderBinds(){const q=$('#bq').value.trim().toLowerCase(),l=pub('bind').filter(i=>!q||[i.title,i.key,i.content,i.group].join(' ').toLowerCase().includes(q));
 $('#gBind').innerHTML=l.length?l.map(rowBind).join(''):'<div class="br" style="display:block;color:var(--mu)">Ничего не найдено</div>'}
$('#bq').oninput=renderBinds;
document.addEventListener('click',async e=>{const c=e.target.closest('[data-cp]'),d=e.target.closest('[data-dl]');
 if(c){const it=items.find(i=>i.id===c.dataset.cp);if(!it)return;if(await copy(it.content)){const o=c.textContent;c.textContent='Скопировано ✓';c.classList.add('ok');toast('Скопировано');setTimeout(()=>{c.textContent=o;c.classList.remove('ok')},1400)}else toast('Не удалось скопировать',1)}
 if(d){const it=items.find(i=>i.id===d.dataset.dl);if(it)save((it.name||it.title||'config').replace(/[^\w\-.]+/g,'_').replace(/\.cfg$/i,'')+'.cfg',it.content)}});

/* ---------- админка ---------- */
$('#bPanel').onclick=()=>{fillForm();mark(dirty);goPage('ov');$('#adm').classList.add('on');document.body.style.overflow='hidden'};
$('#bClose').onclick=async()=>{if(dirty&&!(await ask('Закрыть панель?','Есть несохранённые изменения, они не будут сохранены в базе.','Закрыть',true)))return;$('#adm').classList.remove('on');document.body.style.overflow='';location.hash='#top'};
$('#qSite').onclick=()=>$('#bClose').click();
function goPage(p){$$('.nv[data-p]').forEach(b=>b.classList.toggle('on',b.dataset.p===p));$$('.pg').forEach(g=>g.classList.toggle('on',g.id==='p-'+p));$('#sv').classList.toggle('on',['sc','fc','ap','tx'].includes(p))}
$$('.nv[data-p]').forEach(b=>b.onclick=()=>goPage(b.dataset.p));
function renderAdmin(){if(!admin)return;
 const P=items.filter(i=>i.status!=='draft'),D=items.length-P.length;
 $('#sA').textContent=P.length;$('#sD').textContent=D;$('#sC').textContent=items.filter(i=>typ(i.type)==='cfg').length;$('#sX').textContent=items.filter(i=>i.type==='crosshair').length;
 const w=[];if(D)w.push(`Черновиков: ${D}. Они не видны на сайте.`);SEC.forEach(([k,n])=>{if(T.hide?.[k]&&secHasRaw(k))w.push(`Раздел «${n}» скрыт вручную.`)});
 if(!P.length)w.push('Нет опубликованных записей: посетители видят только главный экран.');if(T.fcNick&&!safeUrl(T.fcUrl))w.push('FACEIT: не указана ссылка на профиль.');
 $('#sW').innerHTML=w.length?w.map(x=>`<div class="warn">${esc(x)}</div>`).join(''):'<div class="sub" style="margin-top:6px">Замечаний нет</div>';
 const r=items.slice().sort((a,b)=>(b.ts?.toMillis?.()||0)-(a.ts?.toMillis?.()||0)).slice(0,5);
 $('#sR').innerHTML=r.length?r.map(i=>`<div class="kv"><span>${esc(i.title)} · ${TL[typ(i.type)]}</span><b>${fmt(i.ts)}</b></div>`).join(''):'<div class="sub">Записей пока нет</div>';
 $('#scL').innerHTML=SEC.map(([k,n])=>{const has=secHas(k);return `<label class="tg"><span><b>${n}</b><br><small style="color:var(--mu)">${has?'Есть опубликованные данные':'Нет данных — скрыт автоматически'}</small></span><input type="checkbox" data-h="${k}" ${has&&!T.hide?.[k]?'checked':''} ${has?'':'disabled'}><i></i></label>`}).join('');
 $('#aM').textContent=user?.isAnonymous?'Устройство, подтверждённое по QR':(user?.email||'—');adminList()}
const secHasRaw=k=>k==='faceit'?!!(T.fcNick||T.fcElo||T.fcLevel):secHas(k);
function adminList(){const q=$('#cq').value.trim().toLowerCase(),t=$('#cT').value,s=$('#cS').value,o=$('#cO').value;
 let l=items.filter(i=>(t==='all'||typ(i.type)===t)&&(s==='all'||(i.status==='draft'?'draft':'published')===s)&&(!q||[i.title,i.desc,i.group,i.key,i.content].join(' ').toLowerCase().includes(q)));
 l=o==='order'?sorted(l):o==='new'?l.sort((a,b)=>(b.ts?.toMillis?.()||Infinity)-(a.ts?.toMillis?.()||Infinity)):l.sort((a,b)=>(a.title||'').localeCompare(b.title||'','ru'));
 const mv=o==='order'&&t!=='all'&&s==='all'&&!q;
 $('#cList').innerHTML=l.length?l.map(i=>`<div class="lr"><div class="row" style="gap:6px;justify-content:flex-start"><span class="chip">${TL[typ(i.type)]||'CFG'}</span></div><div><b>${esc(i.title)}${i.status==='draft'?' <span class="chip dr">черновик</span>':''}</b><small>${fmt(i.ts)}${i.group?' · '+esc(i.group):''}</small></div><div class="row">${mv?`<button class="btn g s" data-mv="${i.id}:-1" aria-label="Выше">↑</button><button class="btn g s" data-mv="${i.id}:1" aria-label="Ниже">↓</button>`:''}<button class="btn g s" data-pb="${i.id}">${i.status==='draft'?'Опубликовать':'В черновик'}</button><button class="btn g s" data-ed="${i.id}">Изменить</button><button class="btn g s" data-dp="${i.id}">Копия</button><button class="btn r s" data-rm="${i.id}">Удалить</button></div></div>`).join(''):'<div style="padding:24px 0;color:var(--mu)">Ничего не найдено</div>'}
['#cq','#cT','#cS','#cO'].forEach(s=>$(s).addEventListener('input',adminList));
const fail=(m,x)=>toast(m+(x?.code?': '+x.code:''),1);
$('#cList').onclick=async e=>{const g=a=>{const b=e.target.closest(`[data-${a}]`);return b&&b.dataset[a]};
 const ed=g('ed'),rm=g('rm'),dp=g('dp'),pb=g('pb'),mv=g('mv');
 if(ed)edit(items.find(i=>i.id===ed));
 if(rm){const it=items.find(i=>i.id===rm);if(it&&await ask(`Удалить «${it.title}»?`,'Запись исчезнет с сайта. Это действие нельзя отменить.','Удалить',true))try{await deleteDoc(doc(db,'items',it.id));toast('Удалено')}catch(x){fail('Не удалось удалить',x)}}
 if(pb){const it=items.find(i=>i.id===pb),st=it.status==='draft'?'published':'draft';try{await setDoc(doc(db,'items',it.id),{status:st},{merge:true});toast(st==='draft'?'Снято с публикации':'Опубликовано')}catch(x){fail('Не удалось изменить статус',x)}}
 if(dp){const it=items.find(i=>i.id===dp),{id,ts,...r}=it;try{await setDoc(doc(collection(db,'items')),{...r,title:it.title+' (копия)',status:'draft',order:newOrder(typ(it.type)),ts:serverTimestamp()});toast('Копия создана как черновик')}catch(x){fail('Не удалось дублировать',x)}}
 if(mv){const[id,d]=mv.split(':'),it=items.find(i=>i.id===id),l=sorted(items.filter(i=>typ(i.type)===typ(it.type))),a=l.findIndex(x=>x.id===id),b=a+ +d;if(b<0||b>=l.length)return;[l[a],l[b]]=[l[b],l[a]];
  const w=writeBatch(db);l.forEach((x,k)=>w.update(doc(db,'items',x.id),{order:k*10}));try{await w.commit()}catch(x){fail('Не удалось изменить порядок',x)}}};
const newOrder=t=>{const l=items.filter(i=>typ(i.type)===t&&i.order!=null);return l.length?Math.min(...l.map(i=>i.order))-10:0};

/* ---------- редактор ---------- */
let eId=null,eT='cfg',eName='';
const LBL={cfg:['Название','Содержимое CFG'],crosshair:['Название','Код прицела'],setting:['Параметр (например: DPI)','Значение'],bind:['Описание действия','Команда или bind']};
function setType(t){eT=t;$$('#seg button').forEach(b=>b.classList.toggle('on',b.dataset.ty===t));$('#lT').textContent=LBL[t][0];$('#lC').textContent=LBL[t][1];
 $('#fG').hidden=!(t==='setting'||t==='bind');$('#fK').hidden=t!=='bind';$('#fF').hidden=t!=='cfg';$('#eC').style.minHeight=t==='cfg'?'170px':'70px';prev()}
$('#seg').onclick=e=>{const b=e.target.closest('button');if(b)setType(b.dataset.ty)};
const form=()=>({type:eT,title:$('#eT').value.trim()||'Без названия',desc:$('#eD').value.trim(),group:$('#eG').value.trim(),key:$('#eK').value.trim(),content:eT==='cfg'?$('#eC').value:$('#eC').value.trim(),status:$('#eS').value,ts:null});
function prev(){const f=form();$('#ePrev').innerHTML=`<div class="lb" style="margin-bottom:8px">Предпросмотр</div>`+(!f.content?'<div class="sub">Заполните содержимое</div>':f.type==='cfg'?cardCfg(f).replace('rv','rv in'):f.type==='crosshair'?cardCh(f).replace('rv','rv in'):f.type==='setting'?cardSet(f.group||'Группа',[f]).replace('rv','rv in'):`<div class="tbl">${rowBind(f)}</div>`)}
$('#mEd').addEventListener('input',prev);
function edit(it){eId=it?.id||null;eName=it?.name||'';$('#eh').textContent=it?'Редактировать':'Новая запись';$('#seg').hidden=!!it;
 $('#eT').value=it?.title||'';$('#eG').value=it?.group||'';$('#eK').value=it?.key||'';$('#eD').value=it?.desc||'';$('#eC').value=it?.content||'';$('#eS').value=it?.status==='draft'?'draft':'published';$('#eF').value='';$('#fn').textContent=eName;$('#eerr').textContent='';
 if(!it)$('#eT').value='';open('#mEd','#eT');setType(it?typ(it.type):'cfg')}
$('#qAdd').onclick=$('#cAdd').onclick=()=>edit();
$('#eF').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(f.size>900000)return $('#eerr').textContent='Файл больше ~900 КБ';$('#eC').value=await f.text();eName=f.name;$('#fn').textContent=`${f.name} · ${(f.size/1024).toFixed(1)} КБ`;if(!$('#eT').value)$('#eT').value=f.name.replace(/\.[^.]+$/,'');prev()};
$('#bSave').onclick=async e=>{const b=e.target,f=form(),t=$('#eT').value.trim();$('#eerr').textContent='';
 if(!t||!f.content)return $('#eerr').textContent='Заполните название и содержимое';if(sz(f.content)>900000)return $('#eerr').textContent='Содержимое больше ~900 КБ';
 if((eT==='setting'||eT==='bind')&&!f.group)return $('#eerr').textContent='Укажите группу';
 b.disabled=true;b.textContent='Сохраняем…';
 try{const d={type:eT,title:t,desc:f.desc,group:f.group,key:f.key,name:eT==='cfg'?(eName||t):'',content:f.content,status:f.status,ts:serverTimestamp()};if(!eId)d.order=newOrder(eT);
  await setDoc(eId?doc(db,'items',eId):doc(collection(db,'items')),d,{merge:true});closeM();toast('Сохранено')}
 catch(x){$('#eerr').textContent='Не удалось сохранить: '+(x.code||x.message)}b.disabled=false;b.textContent='Сохранить'};

/* ---------- резервная копия ---------- */
$('#bExp').onclick=()=>{const d={v:1,exported:new Date().toISOString(),theme:pick(T),items:items.map(i=>({id:i.id,type:i.type,title:i.title,desc:i.desc||'',group:i.group||'',key:i.key||'',name:i.name||'',content:i.content,status:i.status||'published',order:i.order??null}))};
 save(`nezi-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(d,null,1),'application/json');toast('Копия скачана')};
const TYPES=['cfg','crosshair','setting','bind','settings'];
function validate(d){if(!d||d.v!==1||!Array.isArray(d.items))return{ok:[],er:['Неверный формат файла (ожидается копия версии 1)']};
 const ok=[],er=[];if(d.items.length>500)er.push('Больше 500 записей');
 d.items.slice(0,500).forEach((i,n)=>{const bad=m=>er.push(`Запись ${n+1}: ${m}`);if(!i||typeof i!=='object')return bad('не объект');
  if(!/^[\w-]{1,40}$/.test(i.id||''))return bad('неверный id');if(!TYPES.includes(i.type))return bad('неверный тип');
  if(typeof i.title!=='string'||!i.title.trim()||i.title.length>80)return bad('неверное название');
  if(typeof i.content!=='string'||!i.content||sz(i.content)>900000)return bad('пустое или слишком большое содержимое');
  for(const k of['desc','group','key','name'])if(i[k]!=null&&(typeof i[k]!=='string'||i[k].length>200))return bad('поле '+k);
  if(i.status&&!['published','draft'].includes(i.status))return bad('статус');ok.push(i)});return{ok,er}}
let imp=null;
$('#iF').onchange=async e=>{const f=e.target.files[0];if(!f)return;$('#iN').textContent=f.name;let d;try{d=JSON.parse(await f.text())}catch{imp=null;return $('#iP').innerHTML='<div class="warn">Файл не является корректным JSON</div>'}
 const v=validate(d),ex=new Set(items.map(i=>i.id)),rep=v.ok.filter(i=>ex.has(i.id)).length;imp={ok:v.ok,theme:d.theme};
 $('#iP').innerHTML=`<div style="margin-top:14px"><div class="kv"><span>Корректных записей</span><b>${v.ok.length}</b></div><div class="kv"><span>Будут добавлены</span><b>${v.ok.length-rep}</b></div><div class="kv"><span>Заменят существующие</span><b>${rep}</b></div>${v.er.slice(0,5).map(x=>`<div class="warn">${esc(x)}</div>`).join('')}${v.er.length>5?`<div class="sub">…и ещё ошибок: ${v.er.length-5}</div>`:''}
 ${d.theme?'<label class="tg"><span>Импортировать тексты и настройки сайта</span><input type="checkbox" id="iTh"><i></i></label>':''}<div class="row" style="margin-top:14px"><button class="btn" id="iGo" ${v.ok.length?'':'disabled'}>Импортировать</button></div></div>`;
 $('#iGo')?.addEventListener('click',doImport);e.target.value=''};
async function doImport(){if(!imp)return;const n=imp.ok.length,th=$('#iTh')?.checked;
 if(!await ask('Импортировать данные?',`Записей: ${n}. Записи с совпадающим id будут заменены.${th?' Тексты сайта тоже будут обновлены.':''}`,'Импортировать'))return;
 const b=$('#iGo');b.disabled=true;b.textContent='Импорт…';
 try{for(let i=0;i<n;i+=200){const w=writeBatch(db);imp.ok.slice(i,i+200).forEach(x=>{const d={type:x.type,title:x.title.trim(),desc:x.desc||'',group:x.group||'',key:x.key||'',name:x.name||'',content:x.content,status:x.status||'published',ts:serverTimestamp()};if(typeof x.order==='number')d.order=x.order;w.set(doc(db,'items',x.id),d)});await w.commit()}
  if(th&&imp.theme&&typeof imp.theme==='object'){const t={};for(const[k,v]of Object.entries(imp.theme)){if(!(k in DEF))continue;if(k==='hide'){if(v&&typeof v==='object')t.hide=Object.fromEntries(Object.entries(v).map(([a,c])=>[a,!!c]));continue}if(typeof v!==typeof DEF[k])continue;if(k==='acc'&&!/^#[0-9a-f]{6}$/i.test(v))continue;if(['guns','tg','steam','fcUrl'].includes(k)&&v&&!safeUrl(v))continue;t[k]=typeof v==='string'?v.slice(0,200):v}await setDoc(doc(db,'settings','theme'),t,{merge:true})}
  toast(`Импортировано записей: ${n}`);$('#iP').innerHTML='';$('#iN').textContent='';imp=null}catch(x){fail('Импорт не удался',x);b.disabled=false;b.textContent='Импортировать'}}
$('#vClear').onclick=async e=>{if(!await ask('Удалить старые данные посетителей?','Будут удалены все ранее собранные записи (IP, устройство).','Удалить',true))return;e.target.disabled=true;
 try{const s=await getDocs(collection(db,'visits'));for(let i=0;i<s.docs.length;i+=200){const w=writeBatch(db);s.docs.slice(i,i+200).forEach(d=>w.delete(d.ref));await w.commit()}toast(s.size?`Удалено записей: ${s.size}`:'Старых данных нет')}catch(x){fail('Ошибка',x)}e.target.disabled=false};

/* ---------- старт (после объявления всех функций) ---------- */
try{applyTheme(JSON.parse(LS('nzTheme3')||'{}'))}catch{applyTheme({})}
