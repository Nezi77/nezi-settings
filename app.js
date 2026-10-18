import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendEmailVerification,signInAnonymously,signOut,onAuthStateChanged,sendPasswordResetEmail} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore,collection,doc,getDoc,setDoc,deleteDoc,getDocs,writeBatch,onSnapshot,query,orderBy,limit,serverTimestamp,Timestamp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyCkcLwOQVtjDNyaqjY0hM2mCDl4GytQRTE",authDomain:"nezi-settings.firebaseapp.com",projectId:"nezi-settings",storageBucket:"nezi-settings.firebasestorage.app",messagingSenderId:"964059278629",appId:"1:964059278629:web:f1d54b1f47703c017a3ecc"};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=u=>/^https:\/\/[^\s]+$/i.test(u||'')?u:'';
const fmt=ts=>ts?.toDate?ts.toDate().toLocaleDateString('ru'):'';
const sz=c=>new Blob([c||'']).size;
const LS=(k,v)=>{try{if(v===undefined)return localStorage[k];localStorage[k]=v}catch{}};
const rm=matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ---------- состояние ---------- */
const DEF={title:'Nezi Settings',hero:'Мои *настройки*. Моя игра.',sub:'CFG, прицелы и настройки CS2 — всё в одном месте',foot:'Неофициальный персональный проект. Не связан с Valve.',guns:'https://guns.lol/nezimentality',tg:'https://t.me/Neziqq',steam:'',acc:'',stars:140,twinkle:true,fcUrl:'',fcKey:'',fcLevel:'',fcElo:'',hide:{}};
let T={...DEF},saved={...DEF},dirty=false,items=[],loaded=false,admin=false,user=null,unsubQR=null,lastF=null,fc={nick:'',loading:false,p:null,s:null,game:'',err:''},fcSig='';
const SOC=[['guns','guns.lol'],['tg','Telegram'],['steam','Steam']];
const SEC=[['faceit','FACEIT','Профиль'],['cfg','CFG','CFG'],['crosshair','Прицелы','Прицел'],['settings','Настройки','Игра и ПК'],['binds','Бинды','Команды']];
const TL={cfg:'CFG',crosshair:'Прицел',setting:'Настройка',bind:'Бинд'};
const PAL=[['Аквамарин',''],['Фиолет','#8B7BFF'],['Розовый','#FF8FAB'],['Золото','#FFC857'],['Небо','#7DD3FC']];
const typ=t=>t==='settings'?'cfg':t;

/* ---------- звёздное небо ---------- */
const sky=(()=>{const c=$('#sky'),x=c.getContext('2d');let W=0,H=0,S=[],sh=null,raf=0,dpr=1;
 function seed(){const n=Math.round((+T.stars||0)*(W<700?.55:1));S=Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.1+.25,p:Math.random()*6.3,s:Math.random()*.9+.3,d:Math.random()*.7+.2}))}
 function draw(t){x.clearRect(0,0,W,H);const dk=document.documentElement.dataset.theme==='dark',col=dk?'255,255,255':'28,40,80',anim=T.twinkle&&!rm;
  for(const s of S){const a=anim?.3+.7*Math.abs(Math.sin(t/1000*s.s+s.p)):.65;x.fillStyle=`rgba(${col},${a*(dk?.95:.45)})`;let y=(s.y-scrollY*s.d*.12)%H;if(y<0)y+=H;x.beginPath();x.arc(s.x,y,s.r,0,6.3);x.fill()}
  if(dk&&anim){if(!sh&&Math.random()<.0025)sh={x:W*.2+Math.random()*W*.8,y:Math.random()*H*.35,t:0};
   if(sh){sh.t+=.025;const px=sh.x-sh.t*320,py=sh.y+sh.t*160,g=x.createLinearGradient(px,py,px+90,py-45);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');x.strokeStyle=g;x.lineWidth=1.4;x.beginPath();x.moveTo(px,py);x.lineTo(px+90,py-45);x.stroke();if(sh.t>1)sh=null}}
  raf=anim&&!document.hidden?requestAnimationFrame(draw):0}
 const kick=()=>{if(!raf)raf=requestAnimationFrame(draw)};
 function init(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0);seed();kick()}
 addEventListener('resize',init);document.addEventListener('visibilitychange',kick);addEventListener('scroll',()=>{if(!T.twinkle||rm)kick()},{passive:true});
 return{init,kick,seed:()=>{seed();kick()}}})();

/* ---------- тема оформления (тёмная / светлая / система) ---------- */
const mq=matchMedia('(prefers-color-scheme:dark)');
function applyMode(anim){const m=LS('nzMode')||'dark',d=m==='dark'||(m==='system'&&mq.matches),r=document.documentElement;
 if(anim&&!rm){r.classList.add('tt');setTimeout(()=>r.classList.remove('tt'),450)}r.dataset.theme=d?'dark':'light';$('#tc').content=d?'#05060D':'#F3F5FB';
 $$('[data-m]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===m));sky.kick()}
mq.addEventListener('change',()=>applyMode(true));
document.addEventListener('click',e=>{const b=e.target.closest('[data-m]');if(b){LS('nzMode',b.dataset.m);applyMode(true)}});

/* ---------- UI-утилиты ---------- */
const toast=(t,e)=>{const x=$('#toast');x.textContent=t;x.classList.toggle('e',!!e);x.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>x.classList.remove('show'),2800)};
const open=(id,f)=>{lastF=document.activeElement;$(id).classList.add('on');setTimeout(()=>$(f||id+' input')?.focus(),60)};
function closeM(){$$('.modal.on').forEach(m=>m.id==='mCf'?ask.d?.(false):m.classList.remove('on'));lastF?.focus?.()}
function ask(t,s,ok='Подтвердить',danger){return new Promise(r=>{$('#cfT').textContent=t;$('#cfS').textContent=s||'';const b=$('#cfOk');b.textContent=ok;b.className='btn'+(danger?' dg':'');open('#mCf','#cfOk');ask.d=v=>{$('#mCf').classList.remove('on');ask.d=null;r(v)};b.onclick=()=>ask.d(true);$('#cfNo').onclick=()=>ask.d(false)})}
$$('[data-close]').forEach(b=>b.onclick=closeM);
$$('.modal').forEach(m=>m.onclick=e=>{if(e.target===m)m.id==='mCf'?ask.d?.(false):closeM()});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){const t=$$('.modal.on').pop();if(t)t.id==='mCf'?ask.d?.(false):closeM()}
 if(e.key==='Tab'){const m=$$('.modal.on').sort((a,b)=>getComputedStyle(a).zIndex-getComputedStyle(b).zIndex).pop();if(!m)return;
  const f=[...m.querySelectorAll('button,input,select,textarea,a[href]')].filter(x=>!x.disabled&&x.offsetParent);if(!f.length)return;
  if(e.shiftKey&&document.activeElement===f[0]){f.at(-1).focus();e.preventDefault()}else if(!e.shiftKey&&document.activeElement===f.at(-1)){f[0].focus();e.preventDefault()}}});
$('#burger').onclick=()=>{const o=$('#nav').classList.toggle('open');$('#burger').setAttribute('aria-expanded',o)};
$('#nav').onclick=e=>{if(e.target.closest('a'))$('#nav').classList.remove('open')};
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -5% 0px'});
const reveal=()=>$$('.rv:not(.in)').forEach((el,i)=>{el.style.transitionDelay=Math.min(i%6,5)*45+'ms';io.observe(el)});
addEventListener('scroll',()=>{let c='';SEC.forEach(([k])=>{const s=$('#'+k);if(!s.hidden&&s.getBoundingClientRect().top<140)c=k});$$('#nav a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+c))},{passive:true});
document.addEventListener('error',e=>{if(e.target.tagName==='IMG')e.target.remove()},true);
function save(name,text,mime='text/plain'){const u=URL.createObjectURL(new Blob([text],{type:mime+';charset=utf-8'})),a=Object.assign(document.createElement('a'),{href:u,download:name});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000)}
async function copy(t){try{await navigator.clipboard.writeText(t);return true}catch{const a=document.createElement('textarea');a.value=t;a.style.position='fixed';document.body.append(a);a.select();let ok=false;try{ok=document.execCommand('copy')}catch{}a.remove();return ok}}
const fail=(m,x)=>toast(m+(x?.code?': '+x.code:''),1);

/* ---------- cookie, установка приложения, офлайн ---------- */
const ck=$('#ck');if(!LS('nzCk'))setTimeout(()=>ck.classList.add('on'),700);
$('#ckOk').onclick=()=>{LS('nzCk','1');ck.classList.remove('on')};$('#ckOpen').onclick=()=>ck.classList.add('on');
let dip=null;const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone,ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
addEventListener('beforeinstallprompt',e=>{e.preventDefault();dip=e;$('#bInstall').hidden=false});
addEventListener('appinstalled',()=>{dip=null;$('#bInstall').hidden=true;toast('Приложение установлено')});
if(ios&&!standalone())$('#bInstall').hidden=false;
$('#bInstall').onclick=async()=>{if(dip){dip.prompt();await dip.userChoice;dip=null;$('#bInstall').hidden=true}else if(ios)open('#mIos','#mIos .btn')};
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));

/* ---------- настройки сайта (settings/theme) ---------- */
function applyTheme(t){T={...DEF,...t,hide:{...(t.hide||{})}};const s=document.documentElement.style;
 /^#[0-9a-f]{6}$/i.test(T.acc)?s.setProperty('--acc-l',T.acc):s.removeProperty('--acc-l');
 $('#logo').textContent=T.title;$('#fLogo').textContent=T.title;$('#hero').innerHTML=esc(T.hero).replace(/\*([^*]+)\*/g,'<b>$1</b>');$('#sub').textContent=T.sub;$('#foot').textContent=T.foot;document.title=T.title;
 const h=SOC.filter(([k])=>safeUrl(T[k])).map(([k,n])=>`<a class="soc" href="${esc(T[k])}" target="_blank" rel="noopener noreferrer">${n}</a>`).join('');$('#soc').innerHTML=h;$('#soc2').innerHTML=h;
 sky.seed();const sig=T.fcUrl+'|'+T.fcKey;if(sig!==fcSig){fcSig=sig;loadFaceit()}
 renderPublic();renderAdmin()}
const pick=t=>Object.fromEntries(Object.keys(DEF).filter(k=>k in t).map(k=>[k,t[k]]));
onSnapshot(doc(db,'settings','theme'),s=>{if(s.exists()){const d=s.data();saved={...DEF,...d};LS('nzTheme4',JSON.stringify(d));if(!dirty){applyTheme(d);fillForm()}}},()=>{});
function fillForm(){$$('[data-t]').forEach(i=>i.type==='checkbox'?i.checked=!!T[i.dataset.t]:i.value=T[i.dataset.t]??'');$$('#pal button').forEach(b=>b.classList.toggle('on',b.dataset.c===(T.acc||'')))}
function mark(d){dirty=d;$('#st').textContent=d?'Есть несохранённые изменения':'Всё сохранено';$('#st').classList.toggle('d',d)}
$('#pal').innerHTML=PAL.map(([n,c])=>`<button type="button" data-c="${c}" title="${n}" aria-label="${n}" style="background:${c||'#7FFFD4'}"></button>`).join('');
$('#pal').onclick=e=>{const b=e.target.closest('button');if(!b)return;applyTheme({...T,acc:b.dataset.c});fillForm();mark(true)};
$('#adm').addEventListener('input',e=>{const i=e.target.closest('[data-t]'),h=e.target.closest('[data-h]');
 if(i){applyTheme({...T,[i.dataset.t]:i.type==='checkbox'?i.checked:i.type==='range'?+i.value:i.value});mark(true)}
 if(h){applyTheme({...T,hide:{...T.hide,[h.dataset.h]:!h.checked}});mark(true)}});
$('#tSave').onclick=async e=>{const b=e.target,bad=SOC.find(([k])=>T[k]&&!safeUrl(T[k]));
 if(bad)return toast('Ссылка '+bad[1]+' должна начинаться с https://',1);
 if(T.fcUrl&&!nickOf(T.fcUrl))return toast('Ссылка FACEIT должна вести на профиль: faceit.com/…/players/ник',1);
 b.disabled=true;b.textContent='Сохраняем…';try{await setDoc(doc(db,'settings','theme'),pick(T),{merge:true});saved={...T};mark(false);toast('Сохранено')}catch(x){fail('Не удалось сохранить',x)}b.disabled=false;b.textContent='Сохранить'};
$('#tReset').onclick=()=>{applyTheme(saved);fillForm();mark(false)};

/* ---------- FACEIT: по ссылке на профиль ---------- */
const nickOf=u=>{const m=/^https:\/\/(?:www\.)?faceit\.com\/(?:[a-z]{2}(?:-[A-Za-z]{2})?\/)?players\/([^/?#]+)/i.exec(u||'');return m?decodeURIComponent(m[1]):''};
const FERR=e=>/40[13]/.test(e)?'ключ недействителен или не клиентский':/404/.test(e)?'игрок не найден':e==='AbortError'?'FACEIT не ответил вовремя':'сеть или CORS';
async function loadFaceit(force){const nick=nickOf(T.fcUrl);fc={nick,loading:false,p:null,s:null,game:'',err:''};
 if(!nick||!T.fcKey)return renderFaceit();
 const ck='nzFc:'+nick+':'+T.fcKey.slice(-6);let c=null;try{c=!force&&JSON.parse(LS(ck)||'null')}catch{}
 if(c&&Date.now()-c.t<6e5){fc={...fc,p:c.p,s:c.s,game:c.game};return renderFaceit()}
 fc.loading=true;renderFaceit();
 const get=async u=>{const ac=new AbortController(),t=setTimeout(()=>ac.abort(),9000);try{const r=await fetch(u,{headers:{Authorization:'Bearer '+T.fcKey,Accept:'application/json'},signal:ac.signal});if(!r.ok)throw new Error(r.status);return await r.json()}finally{clearTimeout(t)}};
 try{const p=await get('https://open.faceit.com/data/v4/players?nickname='+encodeURIComponent(nick)),game=p.games?.cs2?'cs2':p.games?.csgo?'csgo':'';let s=null;
  if(game)try{s=(await get(`https://open.faceit.com/data/v4/players/${p.player_id}/stats/${game}`)).lifetime}catch{}
  const slim={nickname:p.nickname,avatar:p.avatar,country:p.country,games:p.games};fc={...fc,p:slim,s,game};LS(ck,JSON.stringify({t:Date.now(),p:slim,s,game}))}
 catch(x){fc.err=x.name==='AbortError'?'AbortError':String(x.message)}
 fc.loading=false;renderFaceit()}
const LC=l=>l>=10?'#FE1F00':l>=8?'#FF6309':l>=4?'#FFC800':l>=2?'#1CE400':'#c8c8c8';
const badge=l=>l?`<svg viewBox="0 0 52 52" role="img" aria-label="Уровень ${l}"><circle cx="26" cy="26" r="23" fill="none" stroke="${LC(l)}" stroke-opacity=".2" stroke-width="3"/><circle cx="26" cy="26" r="23" fill="none" stroke="${LC(l)}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${l/10*144.5} 144.5" transform="rotate(-90 26 26)"/><text x="26" y="32" text-anchor="middle" font-size="18" font-weight="700" fill="${LC(l)}" font-family="Inter,sans-serif">${l}</text></svg>`:'';
function renderFaceit(){if(!secVis('faceit'))return;const el=$('#gFc');if(fc.loading){el.innerHTML='<div class="sk"></div>';return}
 const g=fc.p?.games?.[fc.game]||{},s=fc.s||{},lvl=+g.skill_level||+T.fcLevel||0,elo=g.faceit_elo||T.fcElo||'',name=fc.p?.nickname||fc.nick;
 const tiles=[['ELO',elo],['K/D',s['Average K/D Ratio']],['Побед',s['Win Rate %']?s['Win Rate %']+'%':''],['Попаданий в голову',s['Average Headshots %']?s['Average Headshots %']+'%':''],['Матчей',s.Matches],['Текущая серия',s['Current Win Streak']],['Лучшая серия',s['Longest Win Streak']]].filter(t=>t[1]!==undefined&&t[1]!==null&&t[1]!=='');
 const rec=(s['Recent Results']||[]).slice(-10).map(r=>`<i class="${String(r)==='1'?'w':'l'}">${String(r)==='1'?'W':'L'}</i>`).join('');
 el.innerHTML=`<div class="card fx rv"><div class="fh">${fc.p?.avatar?`<img class="av" src="${esc(fc.p.avatar)}" alt="" referrerpolicy="no-referrer" loading="lazy">`:`<div class="av">${esc(name.slice(0,1).toUpperCase())}</div>`}<div><h3>${esc(name)}</h3><small>${[fc.p?.country&&fc.p.country.toUpperCase(),g.region,g.game_player_name&&'в игре: '+g.game_player_name].filter(Boolean).map(esc).join(' · ')||'Профиль FACEIT'}</small></div><div class="lvl">${badge(lvl)}<a class="btn g s" href="${esc(T.fcUrl)}" target="_blank" rel="noopener noreferrer">Открыть профиль</a></div></div>
 ${tiles.length?`<div class="fs">${tiles.map(([n,v])=>`<div><b>${esc(v)}</b><span>${n}</span></div>`).join('')}</div>`:''}${rec?`<div><div class="lb" style="margin-bottom:8px">Последние матчи</div><div class="rr">${rec}</div></div>`:''}
 ${admin&&fc.err?`<div class="note">Живая статистика не загружена: ${esc(FERR(fc.err))}.</div>`:''}</div>`;reveal()}
$('#fcChk').onclick=async e=>{const b=e.target;b.disabled=true;$('#fcSt').textContent='Проверяем…';await loadFaceit(true);b.disabled=false;
 const g=fc.p?.games?.[fc.game]||{};$('#fcSt').textContent=!fc.nick?'Ссылка не распознана':!T.fcKey?`Профиль «${fc.nick}» найден в ссылке. Без ключа статистика не загрузится`:fc.err?'Ошибка: '+FERR(fc.err):`Найден: ${fc.p.nickname}, уровень ${g.skill_level||'—'}, ELO ${g.faceit_elo||'—'}`};

/* ---------- вход, регистрация, профиль ---------- */
const approveId=new URLSearchParams(location.search).get('approve');
const AERR={'auth/invalid-credential':'Неверная почта или пароль','auth/invalid-email':'Проверьте адрес почты','auth/too-many-requests':'Слишком много попыток, попробуйте позже','auth/network-request-failed':'Нет соединения','auth/email-already-in-use':'Эта почта уже зарегистрирована','auth/weak-password':'Слишком простой пароль (минимум 8 символов)','auth/operation-not-allowed':'Этот способ входа выключен в Firebase Authentication','auth/missing-password':'Введите пароль'};
async function probe(){for(const f of [()=>getDoc(doc(db,'admin','probe')),()=>getDocs(query(collection(db,'visits'),limit(1)))]){try{await f();return true}catch{}}return false}
function btns(){const real=user&&!user.isAnonymous;$('#bPanel').hidden=!admin;$('#bLogin').hidden=!!real;$('#bProf').hidden=!real||admin}
function setAdmin(v){const was=admin;admin=v;btns();if(v){closeM();if(!was)toast('Вход владельца выполнен')}else{$('#adm').classList.remove('on');document.body.style.overflow=''}renderAdmin();renderFaceit()}
async function check(u){const ok=await probe();setAdmin(ok);if(ok&&approveId&&!u.isAnonymous)openApprove()}
onAuthStateChanged(auth,u=>{unsubQR?.();user=u;btns();
 if(!u)setAdmin(false);
 else if(u.isAnonymous)unsubQR=onSnapshot(doc(db,'qr',u.uid),s=>{const d=s.data();d&&d.approved&&d.exp.toMillis()>Date.now()?check(u):setAdmin(false)},()=>setAdmin(false));
 else check(u);
 if(approveId&&!u)openAuth('Войдите, чтобы подтвердить вход на другом устройстве')});
let amode='in';
function setMode(m){amode=m;$$('#aTabs button').forEach(b=>b.classList.toggle('on',b.dataset.at===m));$('#fPw2').hidden=m!=='up';$('#aExtra').hidden=m!=='in';$('#qrwrap').hidden=true;$('#bDo').textContent=m==='in'?'Войти':'Создать аккаунт';$('#aT').textContent=m==='in'?'Вход':'Регистрация';$('#pw').autocomplete=m==='in'?'current-password':'new-password';$('#lerr').textContent='';$('#lerr').classList.remove('ok')}
function openAuth(note){setMode('in');$('#aSub').textContent=note||'';open('#mAuth','#lg')}
$('#aTabs').onclick=e=>{const b=e.target.closest('button');if(b)setMode(b.dataset.at)};
$('#bLogin').onclick=()=>openAuth();
$('#pwT').onclick=()=>{const p=$('#pw'),h=p.type==='password';p.type=h?'text':'password';$('#pwT').textContent=h?'Скрыть':'Показать'};
$('#fAuth').onsubmit=async e=>{e.preventDefault();const er=$('#lerr'),b=$('#bDo'),m=$('#lg').value.trim(),p=$('#pw').value;er.textContent='';er.classList.remove('ok');
 if(!/^\S+@\S+\.\S+$/.test(m))return er.textContent='Введите корректную почту';
 if(p.length<8)return er.textContent='Пароль должен быть не короче 8 символов';
 if(amode==='up'&&p!==$('#pw2').value)return er.textContent='Пароли не совпадают';
 b.disabled=true;const t=b.textContent;b.textContent='Подождите…';
 try{if(amode==='in'){await signInWithEmailAndPassword(auth,m,p);setTimeout(()=>{if(!admin&&user&&!user.isAnonymous&&$('#mAuth').classList.contains('on'))closeM()},1800)}
  else{const c=await createUserWithEmailAndPassword(auth,m,p);try{await sendEmailVerification(c.user)}catch{}closeM();toast('Аккаунт создан. Письмо для подтверждения отправлено')}
  $('#pw').value='';$('#pw2').value=''}
 catch(x){er.textContent=AERR[x.code]||('Ошибка: '+(x.code||x.message))}b.disabled=false;b.textContent=t};
$('#bReset').onclick=async()=>{const m=$('#lg').value.trim(),er=$('#lerr');er.classList.remove('ok');if(!m)return er.textContent='Введите почту в поле выше';
 try{await sendPasswordResetEmail(auth,m);er.classList.add('ok');er.textContent='Если такой аккаунт есть, письмо для сброса отправлено'}catch(x){er.textContent=AERR[x.code]||x.code}};
async function doOut(){const u=auth.currentUser;if(u?.isAnonymous)await deleteDoc(doc(db,'qr',u.uid)).catch(()=>{});await signOut(auth);toast('Вы вышли')}
$('#bOut').onclick=()=>{$('#adm').classList.remove('on');document.body.style.overflow='';doOut()};$('#pOut').onclick=()=>{closeM();doOut()};
$('#bProf').onclick=()=>{$('#pEmail').textContent=user?.email||'—';$('#pVer').textContent=user?.emailVerified?'Да':'Нет';$('#pSend').hidden=!!user?.emailVerified;open('#mProf','#mProf .btn')};
$('#pSend').onclick=async()=>{try{await sendEmailVerification(auth.currentUser);toast('Письмо отправлено')}catch(x){fail('Не удалось отправить',x)}};

/* ---------- QR-вход ---------- */
const QR_TTL=300e3;
const uaName=s=>(/Edg\//.test(s)?'Edge':/OPR\//.test(s)?'Opera':/Firefox\//.test(s)?'Firefox':/Chrome\//.test(s)?'Chrome':/Safari\//.test(s)?'Safari':'Браузер')+' · '+(/Windows/.test(s)?'Windows':/Android/.test(s)?'Android':/iPhone|iPad/.test(s)?'iOS':/Mac OS/.test(s)?'macOS':/Linux/.test(s)?'Linux':'неизвестная ОС');
$('#bQR').onclick=async()=>{const er=$('#lerr');er.textContent='';er.classList.remove('ok');
 try{let u=auth.currentUser;if(!u?.isAnonymous)u=(await signInAnonymously(auth)).user;
  const ref=doc(db,'qr',u.uid);await deleteDoc(ref).catch(()=>{});await setDoc(ref,{ua:navigator.userAgent.slice(0,200),ts:serverTimestamp()});
  const url=location.origin+location.pathname+'?approve='+u.uid;$('#qrUrl').value=url;$('#qrwrap').hidden=false;$('#qrbox').innerHTML='';
  if(window.QRCode)new QRCode($('#qrbox'),{text:url,width:192,height:192,correctLevel:QRCode.CorrectLevel.M});else $('#qrbox').textContent='QR-библиотека не загрузилась. Откройте ссылку ниже на телефоне.';
  $('#qrSt').textContent='Откройте камеру на телефоне, где вы вошли как владелец. Код действует 5 минут.';clearTimeout($('#qrSt').t);$('#qrSt').t=setTimeout(()=>{$('#qrSt').textContent='Код устарел. Нажмите «Вход по QR» ещё раз.'},QR_TTL)}
 catch(x){er.textContent=x.code==='auth/operation-not-allowed'?'Включите Anonymous в Firebase → Authentication → Sign-in method':x.code==='permission-denied'||/permission/i.test(x.message||'')?'Опубликуйте новые правила Firestore (см. README)':'QR недоступен: '+(x.code||x.message)}};
$('#qrCp').onclick=async()=>toast(await copy($('#qrUrl').value)?'Ссылка скопирована':'Не удалось скопировать',0);
async function openApprove(){const id=approveId,info=$('#apInfo'),yes=$('#apYes');yes.disabled=true;info.textContent='Загрузка запроса…';open('#mAp','#apNo');
 try{const s=await getDoc(doc(db,'qr',id));if(!s.exists())throw new Error('нет');const d=s.data(),age=Date.now()-(d.ts?.toMillis?.()||0);
  if(d.approved)info.textContent='Этот запрос уже подтверждён.';else if(age>QR_TTL)info.textContent='Запрос устарел. Создайте новый QR-код на компьютере.';
  else{info.textContent=`Запрос с устройства: ${uaName(d.ua||'')}. Создан ${Math.max(1,Math.round(age/1000))} с назад.`;yes.disabled=false}}
 catch{info.textContent='Запрос не найден или устарел. Создайте новый QR-код на компьютере.'}}
$('#apYes').onclick=async()=>{try{await setDoc(doc(db,'qr',approveId),{approved:true,exp:Timestamp.fromMillis(Date.now()+12*3600e3)},{merge:true});history.replaceState({},'',location.pathname);closeM();toast('Вход подтверждён')}catch(x){fail('Не удалось подтвердить',x)}};
$('#apNo').onclick=async()=>{await deleteDoc(doc(db,'qr',approveId)).catch(()=>{});history.replaceState({},'',location.pathname);closeM();toast('Запрос отклонён')};

/* ---------- публичный сайт ---------- */
onSnapshot(query(collection(db,'items'),orderBy('ts','desc')),s=>{items=s.docs.map(d=>({id:d.id,...d.data()}));loaded=true;renderPublic();renderAdmin()},e=>{console.error(e);loaded=true;renderPublic();toast('Не удалось загрузить данные',1)});
function sorted(l){return l.slice().sort((a,b)=>{const x=a.order,y=b.order;if(x!=null&&y!=null&&x!==y)return x-y;if((x!=null)!==(y!=null))return x!=null?-1:1;return(b.ts?.toMillis?.()||Infinity)-(a.ts?.toMillis?.()||Infinity)})}
const pub=t=>sorted(items.filter(i=>typ(i.type)===t&&i.status!=='draft'));
const secHas=k=>k==='faceit'?!!nickOf(T.fcUrl):pub({cfg:'cfg',crosshair:'crosshair',settings:'setting',binds:'bind'}[k]).length;
const secVis=k=>secHas(k)&&!T.hide?.[k];
const tags=it=>`<span class="row"><span class="chip">${TL[typ(it.type)]||'CFG'}</span>${it.status==='draft'?'<span class="chip dr">черновик</span>':''}</span>`;
const head=it=>`<div class="meta">${tags(it)}<span>${fmt(it.ts)}</span></div><h3>${esc(it.title)}</h3>${it.desc?`<p>${esc(it.desc)}</p>`:''}`;
const cardCfg=it=>{const c=it.content||'';return `<article class="card rv">${head(it)}<div class="pre">${esc(c.split('\n').slice(0,6).join('\n'))}</div><div class="meta"><span>${c.split('\n').length} строк · ${(sz(c)/1024).toFixed(1)} КБ</span></div><details><summary>Показать целиком</summary><div class="pre">${esc(c.slice(0,20000))}</div></details><div class="row"><button class="btn" data-dl="${it.id||''}">Скачать .cfg</button><button class="btn g" data-cp="${it.id||''}">Копировать</button></div></article>`};
const cardCh=it=>`<article class="card rv">${head(it)}<div class="cross">${esc(it.content)}</div><div class="row"><button class="btn" data-cp="${it.id||''}">Копировать код</button></div></article>`;
const cardSet=(n,r)=>`<article class="card rv"><div class="lb">${esc(n)}</div>${r.map(i=>`<div class="kv"><span>${esc(i.title)}</span><b>${esc(i.content)}</b></div>`).join('')}</article>`;
const rowBind=i=>`<div class="br"><span>${i.key?`<span class="key">${esc(i.key)}</span>`:`<span class="lb">${esc(i.group||'')}</span>`}</span><span>${esc(i.title)}</span><code>${esc(i.content)}</code><button class="btn g s" data-cp="${i.id||''}">Копировать</button></div>`;
function renderPublic(){$('#skel').hidden=loaded;const vis=SEC.filter(([k])=>secVis(k));
 SEC.forEach(([k])=>$('#'+k).hidden=!secVis(k));
 $('#nav').innerHTML=vis.map(([k,n])=>`<a href="#${k}">${n}</a>`).join('');$('#burger').hidden=!vis.length;
 vis.forEach(([k,,l],i)=>$('#'+k+' [data-n]').textContent=String(i+1).padStart(2,'0')+' · '+l);
 const cf=pub('cfg')[0],nc=pub('cfg').length,nx=pub('crosshair').length;
 $('#hStats').innerHTML=[nc&&`<span class="chip st">${nc} CFG</span>`,nx&&`<span class="chip st">${nx} ${nx===1?'прицел':'прицелов'}</span>`,secVis('faceit')&&'<span class="chip st">FACEIT</span>'].filter(Boolean).join('');
 $('#hCta').innerHTML=(secVis('cfg')&&cf?`<button class="btn" data-dl="${cf.id}">Скачать CFG</button>`:'')+(secVis('crosshair')?'<a class="btn g" href="#crosshair">Прицел</a>':'')+(secVis('faceit')?'<a class="btn g" href="#faceit">FACEIT</a>':'');
 if(secVis('cfg'))$('#gCfg').innerHTML=pub('cfg').map(cardCfg).join('');
 if(secVis('crosshair'))$('#gCh').innerHTML=pub('crosshair').map(cardCh).join('');
 if(secVis('settings')){const g={};pub('setting').forEach(i=>(g[i.group||'Другое']??=[]).push(i));$('#gSet').innerHTML=Object.entries(g).map(([n,r])=>cardSet(n,r)).join('')}
 if(secVis('binds'))renderBinds();
 renderFaceit();reveal()}
function renderBinds(){const q=$('#bq').value.trim().toLowerCase(),l=pub('bind').filter(i=>!q||[i.title,i.key,i.content,i.group].join(' ').toLowerCase().includes(q));
 $('#gBind').innerHTML=l.length?l.map(rowBind).join(''):'<div class="br" style="display:block;color:var(--mu)">Ничего не найдено</div>'}
$('#bq').oninput=renderBinds;
document.addEventListener('click',async e=>{const c=e.target.closest('[data-cp]'),d=e.target.closest('[data-dl]');
 if(c){const it=items.find(i=>i.id===c.dataset.cp);if(!it)return;if(await copy(it.content)){const o=c.textContent;c.textContent='Скопировано ✓';toast('Скопировано');setTimeout(()=>c.textContent=o,1400)}else toast('Не удалось скопировать',1)}
 if(d){const it=items.find(i=>i.id===d.dataset.dl);if(it)save((it.name||it.title||'config').replace(/[^\w\-.]+/g,'_').replace(/\.cfg$/i,'')+'.cfg',it.content)}});

/* ---------- админка ---------- */
$('#bPanel').onclick=()=>{fillForm();mark(dirty);goPage('ov');$('#adm').classList.add('on');document.body.style.overflow='hidden'};
$('#bClose').onclick=async()=>{if(dirty&&!(await ask('Закрыть панель?','Есть несохранённые изменения, в базу они не попадут.','Закрыть',true)))return;$('#adm').classList.remove('on');document.body.style.overflow='';location.hash='#top'};
$('#qSite').onclick=()=>$('#bClose').click();
function goPage(p){$$('.nv[data-p]').forEach(b=>b.classList.toggle('on',b.dataset.p===p));$$('.pg').forEach(g=>g.classList.toggle('on',g.id==='p-'+p));$('#sv').classList.toggle('on',['sc','fc','ap','tx'].includes(p))}
$$('.nv[data-p]').forEach(b=>b.onclick=()=>goPage(b.dataset.p));
function renderAdmin(){if(!admin)return;const D=items.filter(i=>i.status==='draft').length,P=items.length-D;
 $('#sA').textContent=P;$('#sD').textContent=D;$('#sC').textContent=items.filter(i=>typ(i.type)==='cfg').length;$('#sX').textContent=items.filter(i=>i.type==='crosshair').length;
 const w=[];if(D)w.push(`Черновиков: ${D}. Они не видны на сайте.`);
 SEC.forEach(([k,n])=>{if(T.hide?.[k]&&secHas(k))w.push(`Раздел «${n}» скрыт вручную.`)});
 if(!P)w.push('Нет опубликованных записей: посетители видят только главный экран.');
 if(nickOf(T.fcUrl)&&!T.fcKey)w.push('FACEIT: указана только ссылка. Чтобы подтягивать статистику, добавьте клиентский API-ключ.');
 $('#sW').innerHTML=w.length?w.map(x=>`<div class="warn">${esc(x)}</div>`).join(''):'<div class="sub" style="margin-top:6px">Замечаний нет</div>';
 const r=items.slice().sort((a,b)=>(b.ts?.toMillis?.()||0)-(a.ts?.toMillis?.()||0)).slice(0,5);
 $('#sR').innerHTML=r.length?r.map(i=>`<div class="kv"><span>${esc(i.title)} · ${TL[typ(i.type)]}</span><b>${fmt(i.ts)}</b></div>`).join(''):'<div class="sub">Записей пока нет</div>';
 $('#scL').innerHTML=SEC.map(([k,n])=>{const has=secHas(k);return `<label class="tg"><span><b>${n}</b><br><small style="color:var(--mu)">${has?'Есть данные':'Нет данных — скрыт автоматически'}</small></span><input type="checkbox" data-h="${k}" ${has&&!T.hide?.[k]?'checked':''} ${has?'':'disabled'}><i></i></label>`}).join('');
 $('#aM').textContent=user?.isAnonymous?'Устройство, подтверждённое по QR':(user?.email||'—');adminList()}
function adminList(){const q=$('#cq').value.trim().toLowerCase(),t=$('#cT').value,s=$('#cS').value,o=$('#cO').value;
 let l=items.filter(i=>(t==='all'||typ(i.type)===t)&&(s==='all'||(i.status==='draft'?'draft':'published')===s)&&(!q||[i.title,i.desc,i.group,i.key,i.content].join(' ').toLowerCase().includes(q)));
 l=o==='order'?sorted(l):o==='new'?l.sort((a,b)=>(b.ts?.toMillis?.()||Infinity)-(a.ts?.toMillis?.()||Infinity)):l.sort((a,b)=>(a.title||'').localeCompare(b.title||'','ru'));
 const mv=o==='order'&&t!=='all'&&s==='all'&&!q;
 $('#cList').innerHTML=l.length?l.map(i=>`<div class="lr"><span class="chip" style="width:fit-content">${TL[typ(i.type)]||'CFG'}</span><div><b>${esc(i.title)}${i.status==='draft'?' <span class="chip dr">черновик</span>':''}</b><small>${fmt(i.ts)}${i.group?' · '+esc(i.group):''}</small></div><div class="row">${mv?`<button class="btn g s" data-mv="${i.id}:-1" aria-label="Выше">↑</button><button class="btn g s" data-mv="${i.id}:1" aria-label="Ниже">↓</button>`:''}<button class="btn g s" data-pb="${i.id}">${i.status==='draft'?'Опубликовать':'В черновик'}</button><button class="btn g s" data-ed="${i.id}">Изменить</button><button class="btn g s" data-dp="${i.id}">Копия</button><button class="btn r s" data-rm="${i.id}">Удалить</button></div></div>`).join(''):'<div style="padding:24px 0;color:var(--mu)">Ничего не найдено</div>'}
['#cq','#cT','#cS','#cO'].forEach(s=>$(s).addEventListener('input',adminList));
const newOrder=t=>{const l=items.filter(i=>typ(i.type)===t&&i.order!=null);return l.length?Math.min(...l.map(i=>i.order))-10:0};
$('#cList').onclick=async e=>{const g=a=>e.target.closest(`[data-${a}]`)?.dataset[a],ed=g('ed'),rm=g('rm'),dp=g('dp'),pb=g('pb'),mv=g('mv');
 if(ed)edit(items.find(i=>i.id===ed));
 if(rm){const it=items.find(i=>i.id===rm);if(it&&await ask(`Удалить «${it.title}»?`,'Запись исчезнет с сайта. Действие нельзя отменить.','Удалить',true))try{await deleteDoc(doc(db,'items',it.id));toast('Удалено')}catch(x){fail('Не удалось удалить',x)}}
 if(pb){const it=items.find(i=>i.id===pb),st=it.status==='draft'?'published':'draft';try{await setDoc(doc(db,'items',it.id),{status:st},{merge:true});toast(st==='draft'?'Снято с публикации':'Опубликовано')}catch(x){fail('Не удалось изменить статус',x)}}
 if(dp){const it=items.find(i=>i.id===dp),{id,ts,...r}=it;try{await setDoc(doc(collection(db,'items')),{...r,title:it.title+' (копия)',status:'draft',order:newOrder(typ(it.type)),ts:serverTimestamp()});toast('Копия создана как черновик')}catch(x){fail('Не удалось дублировать',x)}}
 if(mv){const[id,d]=mv.split(':'),it=items.find(i=>i.id===id),l=sorted(items.filter(i=>typ(i.type)===typ(it.type))),a=l.findIndex(x=>x.id===id),b=a+ +d;if(b<0||b>=l.length)return;[l[a],l[b]]=[l[b],l[a]];
  const w=writeBatch(db);l.forEach((x,k)=>w.update(doc(db,'items',x.id),{order:k*10}));try{await w.commit()}catch(x){fail('Не удалось изменить порядок',x)}}};

/* ---------- редактор записи ---------- */
let eId=null,eT='cfg',eName='';
const LBL={cfg:['Название','Содержимое CFG'],crosshair:['Название','Код прицела'],setting:['Параметр (например: DPI)','Значение'],bind:['Описание действия','Команда или bind']};
function setType(t){eT=t;$$('#seg button').forEach(b=>b.classList.toggle('on',b.dataset.ty===t));$('#lT').textContent=LBL[t][0];$('#lC').textContent=LBL[t][1];
 $('#fG').hidden=!(t==='setting'||t==='bind');$('#fK').hidden=t!=='bind';$('#fF').hidden=t!=='cfg';$('#eC').style.minHeight=t==='cfg'?'170px':'70px';prev()}
$('#seg').onclick=e=>{const b=e.target.closest('button');if(b)setType(b.dataset.ty)};
const form=()=>({type:eT,title:$('#eT').value.trim()||'Без названия',desc:$('#eD').value.trim(),group:$('#eG').value.trim(),key:$('#eK').value.trim(),content:eT==='cfg'?$('#eC').value:$('#eC').value.trim(),status:$('#eS').value,ts:null});
function prev(){const f=form(),r=h=>h.replace('rv','rv in');$('#ePrev').innerHTML='<div class="lb" style="margin-bottom:8px">Предпросмотр</div>'+(!f.content?'<div class="sub">Заполните содержимое</div>':f.type==='cfg'?r(cardCfg(f)):f.type==='crosshair'?r(cardCh(f)):f.type==='setting'?r(cardSet(f.group||'Группа',[f])):`<div class="tbl">${rowBind(f)}</div>`)}
$('#mEd').addEventListener('input',prev);
function edit(it){eId=it?.id||null;eName=it?.name||'';$('#eh').textContent=it?'Редактировать':'Новая запись';$('#seg').hidden=!!it;
 $('#eT').value=it?.title||'';$('#eG').value=it?.group||'';$('#eK').value=it?.key||'';$('#eD').value=it?.desc||'';$('#eC').value=it?.content||'';$('#eS').value=it?.status==='draft'?'draft':'published';$('#eF').value='';$('#fn').textContent=eName;$('#eerr').textContent='';
 open('#mEd','#eT');setType(it?typ(it.type):'cfg')}
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
$('#bExp').onclick=()=>{save(`nezi-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({v:1,exported:new Date().toISOString(),theme:pick({...T,fcKey:''}),items:items.map(i=>({id:i.id,type:i.type,title:i.title,desc:i.desc||'',group:i.group||'',key:i.key||'',name:i.name||'',content:i.content,status:i.status||'published',order:i.order??null}))},null,1),'application/json');toast('Копия скачана')};
const TYPES=['cfg','crosshair','setting','bind','settings'];
function validate(d){if(!d||d.v!==1||!Array.isArray(d.items))return{ok:[],er:['Неверный формат файла (ожидается копия версии 1)']};
 const ok=[],er=[];if(d.items.length>500)er.push('Больше 500 записей, будут взяты первые 500');
 d.items.slice(0,500).forEach((i,n)=>{const bad=m=>er.push(`Запись ${n+1}: ${m}`);if(!i||typeof i!=='object')return bad('не объект');
  if(!/^[\w-]{1,40}$/.test(i.id||''))return bad('неверный id');if(!TYPES.includes(i.type))return bad('неверный тип');
  if(typeof i.title!=='string'||!i.title.trim()||i.title.length>80)return bad('неверное название');
  if(typeof i.content!=='string'||!i.content||sz(i.content)>900000)return bad('пустое или слишком большое содержимое');
  for(const k of['desc','group','key','name'])if(i[k]!=null&&(typeof i[k]!=='string'||i[k].length>200))return bad('поле '+k);
  if(i.status&&!['published','draft'].includes(i.status))return bad('статус');ok.push(i)});return{ok,er}}
let imp=null;
$('#iF').onchange=async e=>{const f=e.target.files[0];if(!f)return;$('#iN').textContent=f.name;let d;try{d=JSON.parse(await f.text())}catch{imp=null;return $('#iP').innerHTML='<div class="warn">Файл не является корректным JSON</div>'}
 const v=validate(d),ex=new Set(items.map(i=>i.id)),rep=v.ok.filter(i=>ex.has(i.id)).length;imp={ok:v.ok,theme:d.theme};
 $('#iP').innerHTML=`<div style="margin-top:14px"><div class="kv"><span>Корректных записей</span><b>${v.ok.length}</b></div><div class="kv"><span>Будут добавлены</span><b>${v.ok.length-rep}</b></div><div class="kv"><span>Заменят существующие</span><b>${rep}</b></div>${v.er.slice(0,5).map(x=>`<div class="warn">${esc(x)}</div>`).join('')}${v.er.length>5?`<div class="sub">…и ещё замечаний: ${v.er.length-5}</div>`:''}
 ${d.theme?'<label class="tg"><span>Импортировать тексты и настройки сайта</span><input type="checkbox" id="iTh"><i></i></label>':''}<div class="row" style="margin-top:14px"><button class="btn" id="iGo" ${v.ok.length?'':'disabled'}>Импортировать</button></div></div>`;
 $('#iGo')?.addEventListener('click',doImport);e.target.value=''};
async function doImport(){if(!imp)return;const n=imp.ok.length,th=$('#iTh')?.checked;
 if(!await ask('Импортировать данные?',`Записей: ${n}. Записи с совпадающим id будут заменены.${th?' Тексты сайта тоже обновятся.':''}`,'Импортировать'))return;
 const b=$('#iGo');b.disabled=true;b.textContent='Импорт…';
 try{for(let i=0;i<n;i+=200){const w=writeBatch(db);imp.ok.slice(i,i+200).forEach(x=>{const d={type:x.type,title:x.title.trim(),desc:x.desc||'',group:x.group||'',key:x.key||'',name:x.name||'',content:x.content,status:x.status||'published',ts:serverTimestamp()};if(typeof x.order==='number')d.order=x.order;w.set(doc(db,'items',x.id),d)});await w.commit()}
  if(th&&imp.theme&&typeof imp.theme==='object'){const t={};for(const[k,v]of Object.entries(imp.theme)){if(!(k in DEF)||k==='fcKey')continue;if(k==='hide'){if(v&&typeof v==='object')t.hide=Object.fromEntries(Object.entries(v).map(([a,c])=>[a,!!c]));continue}if(typeof v!==typeof DEF[k])continue;if(k==='acc'&&v&&!/^#[0-9a-f]{6}$/i.test(v))continue;if(['guns','tg','steam'].includes(k)&&v&&!safeUrl(v))continue;if(k==='fcUrl'&&v&&!nickOf(v))continue;t[k]=typeof v==='string'?v.slice(0,200):k==='stars'?Math.min(260,Math.max(0,v)):v}await setDoc(doc(db,'settings','theme'),t,{merge:true})}
  toast(`Импортировано записей: ${n}`);$('#iP').innerHTML='';$('#iN').textContent='';imp=null}catch(x){fail('Импорт не удался',x);b.disabled=false;b.textContent='Импортировать'}}
$('#vClear').onclick=async e=>{if(!await ask('Удалить старые данные посетителей?','Будут удалены все ранее собранные записи (IP, устройство).','Удалить',true))return;e.target.disabled=true;
 try{const s=await getDocs(collection(db,'visits'));for(let i=0;i<s.docs.length;i+=200){const w=writeBatch(db);s.docs.slice(i,i+200).forEach(d=>w.delete(d.ref));await w.commit()}toast(s.size?`Удалено записей: ${s.size}`:'Старых данных нет')}catch(x){fail('Ошибка',x)}e.target.disabled=false};

/* ---------- старт (после объявления всех функций) ---------- */
sky.init();applyMode();
try{applyTheme(JSON.parse(LS('nzTheme4')||'{}'))}catch{applyTheme({})}
