const D=window.COURSE_DATA;
const PROFILE_INDEX='wmc_oncothermia_profiles_v1';
const ACTIVE_PROFILE='wmc_oncothermia_active_profile_v1';
const LEGACY_KEY='wmc_oncothermia_github_v1';
const DEFAULT_STATE=()=>({view:'home',slide:1,viewed:[],score:null,bestScore:null,passed:false,certId:'',completedAt:'',examAttempts:0});
let profile=null;
let state=DEFAULT_STATE();
const $=id=>document.getElementById(id);
const views=['signinView','homeView','courseView','examView','certView'];

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function safeId(id){return String(id||'').trim().toLowerCase().replace(/[^a-z0-9ก-๙_-]+/gi,'-').replace(/^-+|-+$/g,'')||'learner'}
function stateKey(id){return 'wmc_oncothermia_state_'+safeId(id)}
function getProfiles(){try{return JSON.parse(localStorage.getItem(PROFILE_INDEX)||'[]')}catch{return []}}
function setProfiles(arr){localStorage.setItem(PROFILE_INDEX,JSON.stringify(arr))}
function getActiveId(){return localStorage.getItem(ACTIVE_PROFILE)||''}
function setActiveId(id){if(id)localStorage.setItem(ACTIVE_PROFILE,id);else localStorage.removeItem(ACTIVE_PROFILE)}
function createCertId(){return 'WMC-ONC-'+new Date().getFullYear()+'-'+Math.random().toString(36).slice(2,10).toUpperCase()}
function loadStateFor(id){
  let raw=localStorage.getItem(stateKey(id));
  if(!raw){
    const legacy=localStorage.getItem(LEGACY_KEY);
    if(legacy && getProfiles().length<=1){raw=legacy;}
  }
  try{state=Object.assign(DEFAULT_STATE(),raw?JSON.parse(raw):{})}catch{state=DEFAULT_STATE()}
  if(state.bestScore==null&&state.score!=null)state.bestScore=state.score;
  if((state.bestScore??0)>=80)state.passed=true;
  if(!state.certId)state.certId=createCertId();
}
function save(){
  if(profile)localStorage.setItem(stateKey(profile.employeeId),JSON.stringify(state));
  updateProgress();
}
function show(id){
  views.forEach(v=>$(v)?.classList.toggle('hidden',v!==id));
  document.body.classList.toggle('signedOut',id==='signinView');
  window.scrollTo({top:0,behavior:'auto'});
  if(id!=='signinView')state.view=id;
  save();
}
function lessonFor(n){return D.lessons.find(l=>n>=l.start&&n<=l.end)||D.lessons[0]}
function updateProgress(){
  const count=new Set(state.viewed||[]).size;
  const pct=Math.round((count/D.slides)*100);
  if($('progressText'))$('progressText').textContent=pct+'%';
  if($('progressBar'))$('progressBar').style.width=pct+'%';
  if($('userName'))$('userName').textContent=profile?(profile.nameEn||profile.nameTh||profile.employeeId):'';
  if($('userInitials'))$('userInitials').textContent=profile?initials(profile.nameEn||profile.nameTh||'WMC'):'WMC';
}
function initials(name){
  const p=String(name||'').trim().split(/\s+/).filter(Boolean);
  if(!p.length)return 'WMC';
  if(/^[\u0E00-\u0E7F]/.test(p[0]))return p[0].slice(0,2);
  return (p[0][0]+(p[1]?.[0]||'')).toUpperCase();
}
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2200)}

function renderSignin(){
  const list=$('savedLearners');
  const profiles=getProfiles();
  list.innerHTML=profiles.length?profiles.map(p=>`<button class="savedLearner" data-id="${esc(p.employeeId)}"><span class="avatar">${esc(initials(p.nameEn||p.nameTh))}</span><span><b>${esc(p.nameEn||p.nameTh)}</b><small>${esc(p.employeeId)} • ${esc(p.department||'WMC')}</small></span><span class="continue">เรียนต่อ →</span></button>`).join(''):`<div class="noLearners">ยังไม่มีผู้เรียนที่บันทึกไว้ในเครื่องนี้</div>`;
  list.querySelectorAll('.savedLearner').forEach(b=>b.onclick=()=>signInExisting(b.dataset.id));
  $('signinForm').reset();
  show('signinView');
}
function registerLearner(){
  const nameEn=$('regNameEn').value.trim();
  const nameTh=$('regNameTh').value.trim();
  const employeeId=$('regEmployeeId').value.trim();
  const position=$('regPosition').value.trim();
  const department=$('regDepartment').value.trim();
  if(!nameEn || !employeeId || !position || !department){toast('กรุณากรอกชื่อ English, รหัสพนักงาน, ตำแหน่ง และแผนกให้ครบ');return}
  const now=new Date().toISOString();
  const profiles=getProfiles();
  const existing=profiles.find(p=>p.employeeId.toLowerCase()===employeeId.toLowerCase());
  const p={nameEn,nameTh,employeeId,position,department,createdAt:existing?.createdAt||now,updatedAt:now};
  const next=profiles.filter(x=>x.employeeId.toLowerCase()!==employeeId.toLowerCase());next.push(p);setProfiles(next);
  profile=p;setActiveId(employeeId);loadStateFor(employeeId);save();renderProfile();renderHome();show('homeView');location.hash='';toast('ลงชื่อเข้าเรียนเรียบร้อย');
}
function signInExisting(id){
  const p=getProfiles().find(x=>x.employeeId===id);
  if(!p){toast('ไม่พบข้อมูลผู้เรียน');return}
  profile=p;setActiveId(id);loadStateFor(id);save();renderProfile();renderHome();routeAfterLogin();
}
function routeAfterLogin(){
  const h=location.hash;
  if(h.startsWith('#slide-'))openSlide(parseInt(h.slice(7))||1);
  else if(h==='#exam')openExam();
  else if(h==='#certificate')openCert();
  else{renderHome();show('homeView')}
}
function signOut(){
  setActiveId('');profile=null;state=DEFAULT_STATE();location.hash='';renderSignin();
}
function renderProfile(){
  if(!profile)return;
  $('userName').textContent=profile.nameEn||profile.nameTh||profile.employeeId;
  $('userMeta').textContent=[profile.employeeId,profile.department].filter(Boolean).join(' • ');
  $('userInitials').textContent=initials(profile.nameEn||profile.nameTh);
}

function renderHome(){
  if(!profile)return renderSignin();
  $('welcomeName').textContent=profile.nameEn||profile.nameTh||'Learner';
  const grid=$('lessonGrid');
  grid.innerHTML=D.lessons.map((l,i)=>{const cover=l.coverAsset?`${l.coverAsset}?v=23.0`:`assets/slides/slide-${String(l.cover).padStart(3,'0')}.png?v=23.0`;return `<button class="lessonCard" data-slide="${l.start}"><img src="${cover}"><span class="copy"><b>${i+1}. ${l.title_th}</b><span>${l.title} • Screens ${l.start}–${l.end}</span></span></button>`;}).join('');
  grid.querySelectorAll('button').forEach(b=>b.onclick=()=>openSlide(+b.dataset.slide));
  $('resumeBtn').style.display=(state.viewed||[]).length?'inline-block':'none';
  updateProgress();
}
function renderRail(){
  const cur=lessonFor(state.slide);
  $('lessonRail').innerHTML=D.lessons.map((l,i)=>`<button class="railLesson ${cur.id===l.id?'active':''}" data-slide="${l.start}"><b>${i+1}. ${l.title_th}</b><span>${l.title} • ${l.end-l.start+1} screens</span></button>`).join('');
  $('lessonRail').querySelectorAll('button').forEach(b=>b.onclick=()=>openSlide(+b.dataset.slide));
}
function openSlide(n){
  if(!profile)return renderSignin();
  n=Math.max(1,Math.min(D.slides,n));state.slide=n;
  if(!state.viewed.includes(n))state.viewed.push(n);
  renderCourse();show('courseView');location.hash='slide-'+n;
}
function renderCourse(){
  const n=state.slide,l=lessonFor(n);renderRail();
  $('lessonLabel').textContent=`Lesson ${D.lessons.indexOf(l)+1} • ${l.title}`;
  $('slideTitle').textContent=D.titles[n-1]||`Slide ${n}`;
  $('screenCounter').textContent=`${n} / ${D.slides}`;
  const stage=$('slideStage');
  const practical=D.practicalVideos?.[String(n)];
  if(practical){
    stage.innerHTML=`<div class="videoWrap practicalVideoWrap"><video class="practicalVideo" controls playsinline preload="metadata" poster="${practical.poster}?v=23.0"><source src="${practical.src}?v=23.0" type="video/mp4">Your browser does not support HTML5 video.</video><div class="practicalVideoBadge"><b>Practical Video</b><span>${practical.subtitle||'EHY-2000 Plus'}</span></div></div>`;
  }else if(D.videoSlides.includes(n)){
    const src=`assets/video/slide-${String(n).padStart(3,'0')}.mp4?v=23.0`;
    const poster=`assets/video/slide-${String(n).padStart(3,'0')}-poster.png?v=23.0`;
    stage.innerHTML=`<div class="videoWrap pptAnimation"><video class="pptVideo" autoplay loop muted playsinline preload="auto" poster="${poster}"><source src="${src}" type="video/mp4"></video><button class="replayBtn" type="button" aria-label="Replay animation">↻ Replay</button><button class="pauseBtn" type="button" aria-label="Pause animation">Ⅱ Pause</button></div>`;
    const v=stage.querySelector('.pptVideo');v.play().catch(()=>{});
    stage.querySelector('.replayBtn').onclick=()=>{v.currentTime=0;v.play().catch(()=>{});};
    stage.querySelector('.pauseBtn').onclick=e=>{if(v.paused){v.play().catch(()=>{});e.currentTarget.textContent='Ⅱ Pause';}else{v.pause();e.currentTarget.textContent='▶ Play';}};
  }else stage.innerHTML=`<img src="assets/slides/slide-${String(n).padStart(3,'0')}.png?v=23.0" alt="Slide ${n}">`;
  $('prevBtn').disabled=n===1;$('nextBtn').textContent=n===D.slides?'Final Exam →':'Next →';
  $('lessonDots').innerHTML=Array.from({length:l.end-l.start+1},(_,i)=>`<i class="${l.start+i===n?'on':''}"></i>`).join('');save();
}
function prev(){if(state.slide>1)openSlide(state.slide-1)}
function next(){if(state.slide<D.slides)openSlide(state.slide+1);else openExam()}
function openExam(){if(!profile)return renderSignin();renderExam();show('examView');location.hash='exam'}
function renderExam(){
  const f=$('examForm');f.innerHTML=D.questions.map((q,i)=>`<section class="question" id="q${i}"><h3>${i+1}. ${q.q}</h3>${q.o.map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}"> ${o}</label>`).join('')}<div class="feedback"></div></section>`).join('');
  $('scoreBadge').textContent=state.bestScore==null?'Not attempted':`Best score ${state.bestScore}%`;
}
function submitExam(){
  let correct=0,answered=0;
  D.questions.forEach((q,i)=>{const box=$('q'+i),el=document.querySelector(`input[name=q${i}]:checked`);box.classList.remove('correct','wrong');const fb=box.querySelector('.feedback');if(el){answered++;const ok=+el.value===q.a;if(ok)correct++;box.classList.add(ok?'correct':'wrong');fb.textContent=(ok?'✓ ถูกต้อง • ':'✕ คำตอบที่ถูก: '+q.o[q.a]+' • ')+q.why+' ('+q.src+')'}else fb.textContent='ยังไม่ได้ตอบ'});
  if(answered<D.questions.length){toast(`ตอบแล้ว ${answered}/${D.questions.length} ข้อ`);return}
  state.examAttempts=(state.examAttempts||0)+1;state.score=Math.round(correct/D.questions.length*100);state.bestScore=Math.max(state.bestScore??0,state.score);state.passed=state.bestScore>=80;
  const completed=new Set(state.viewed).size===D.slides;if(state.passed&&completed&&!state.completedAt)state.completedAt=new Date().toISOString();save();
  $('scoreBadge').textContent=`Latest ${state.score}% • Best ${state.bestScore}% • ${state.passed?'PASS':'REVIEW & RETAKE'}`;toast(state.passed?'ผ่านเกณฑ์แล้ว — Certificate พร้อมเมื่อเรียนครบ 100%':'ยังไม่ผ่านเกณฑ์ 80%');
}
function openCert(){if(!profile)return renderSignin();renderCert();show('certView');location.hash='certificate'}
function renderCert(){
  const completed=new Set(state.viewed).size===D.slides;const ready=completed&&state.passed;
  if(ready&&!state.completedAt){state.completedAt=new Date().toISOString();save()}
  $('certLocked').classList.toggle('hidden',ready);$('certReady').classList.toggle('hidden',!ready);
  if(!ready){$('certLocked').innerHTML=`<div class="lockIcon">🔒</div><h2>Certificate ยังล็อกอยู่</h2><p>เงื่อนไข: เรียนครบ ${D.slides}/${D.slides} screens และ Final Exam ≥80%</p><p>ตอนนี้: เรียน ${new Set(state.viewed).size}/${D.slides} • คะแนนสูงสุด ${state.bestScore==null?'ยังไม่ได้สอบ':state.bestScore+'%'}</p><button class="primary" id="certNextAction">${!completed?'กลับไปเรียน':'ไป Final Exam'}</button>`;$('certNextAction').onclick=()=>!completed?openSlide(state.slide||1):openExam();return}
  updateCertificate();
}
function updateCertificate(){
  if(!profile)return;
  $('certName').textContent=profile.nameEn||profile.nameTh||'Learner';
  $('certThaiName').textContent=profile.nameTh||'';
  $('certThaiName').classList.toggle('hidden',!profile.nameTh);
  const completedDate=new Date(state.completedAt||Date.now()).toLocaleDateString('th-TH',{year:'numeric',month:'long',day:'numeric'});
  $('certDate').textContent=completedDate;
  $('certId').textContent=state.certId;
  $('certEmployeeId').textContent=profile.employeeId;
  $('certDepartment').textContent=profile.department;
  $('certPosition').textContent=profile.position;
  $('certProfileName').textContent=(profile.nameEn||profile.nameTh)+' • '+profile.employeeId;
  const certQrImg=$('certQrImg'), certQrFallback=$('certQrFallback');
  const verifyBox=document.querySelector('.certSourceVerify');
  if(certQrImg){
    const verifyUrl=new URL('verify.html', window.location.href);
    verifyUrl.hash='';
    verifyUrl.searchParams.set('certId', state.certId||'');
    verifyUrl.searchParams.set('nameEn', profile.nameEn||'');
    verifyUrl.searchParams.set('nameTh', profile.nameTh||'');
    verifyUrl.searchParams.set('course', 'Oncothermia e-Learning Program');
    verifyUrl.searchParams.set('completed', completedDate);
    verifyUrl.searchParams.set('employeeId', profile.employeeId||'');
    verifyUrl.searchParams.set('position', profile.position||'');
    verifyUrl.searchParams.set('department', profile.department||'');
    const qrSrc='https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data='+encodeURIComponent(verifyUrl.toString());
    certQrImg.onload=()=>{certQrImg.classList.remove('hidden');certQrFallback&&certQrFallback.classList.add('hidden');};
    certQrImg.onerror=()=>{certQrImg.classList.add('hidden');certQrFallback&&certQrFallback.classList.remove('hidden');};
    certQrImg.src=qrSrc;
    if(verifyBox){
      verifyBox.style.cursor='pointer';
      verifyBox.title='Open certificate verification';
      verifyBox.onclick=()=>window.open(verifyUrl.toString(),'_blank');
    }
  }
}

$('homeBtn').onclick=()=>{if(profile){renderHome();show('homeView');location.hash=''}else renderSignin()};
$('startBtn').onclick=()=>openSlide(1);$('resumeBtn').onclick=()=>openSlide(state.slide||1);$('examBtn').onclick=openExam;$('certificateBtn').onclick=openCert;
$('prevBtn').onclick=prev;$('nextBtn').onclick=next;$('submitExamBtn').onclick=submitExam;$('backCourseBtn').onclick=()=>openSlide(state.slide||1);
$('printCertBtn').onclick=()=>window.print();$('fullscreenBtn').onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()};
$('signinForm').addEventListener('submit',e=>{e.preventDefault();registerLearner()});
$('switchLearnerBtn').onclick=signOut;

document.addEventListener('keydown',e=>{if(state.view==='courseView'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){if(e.key==='ArrowRight')next();if(e.key==='ArrowLeft')prev();if(e.key==='f'||e.key==='F')$('fullscreenBtn').click()}});
function route(){if(!profile){renderSignin();return}routeAfterLogin()}
window.addEventListener('hashchange',()=>{if(profile)routeAfterLogin()});

(function init(){
  const active=getActiveId();const p=getProfiles().find(x=>x.employeeId===active);
  if(p){profile=p;loadStateFor(active);renderProfile();renderHome();updateProgress();routeAfterLogin()}
  else{renderSignin();updateProgress()}
})();
