/* adnotice.js - 첫 접속 안내창 (광고 없음 안내)
   - index.html / desktop.html / mobile.html 에서 불러옵니다.
   - '다음 접속시 안보기'를 체크하고 확인을 누르면 localStorage 'adnotice.hide' 에 기억하고 다시 나타나지 않습니다.
   - 체크하지 않아도 같은 접속(탭) 안에서는 화면을 옮겨도 한 번만 나타납니다.
   - 다시 보고 싶으면 주소 뒤에 ?notice=1 을 붙이세요. */
(function(){'use strict';
var KEY='adnotice.hide',SES='adnotice.shown';
var force=/[?&]notice=1/.test(location.search);
try{if(!force&&(localStorage.getItem(KEY)==='1'||sessionStorage.getItem(SES)==='1'))return}catch(e){}
var page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
var theme=/desktop/.test(page)?'sky':/mobile/.test(page)?'glass':'warm';

var css='\
.adn-bg{position:fixed;inset:0;z-index:2147483002;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(8,10,26,.62);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);opacity:0;transition:opacity .25s}\
.adn-bg.on{opacity:1}\
.adn-box{position:relative;width:min(400px,100%);padding:30px 26px 22px;text-align:center;border-radius:22px;transform:translateY(14px) scale(.96);transition:transform .3s cubic-bezier(.2,.9,.3,1.2);font-family:var(--adn-font)}\
.adn-bg.on .adn-box{transform:none}\
.adn-ico{width:62px;height:62px;margin:-62px auto 12px;border-radius:50%;display:grid;place-items:center;background:var(--adn-ic-bg);border:3px solid var(--adn-ic-bd);box-shadow:0 6px 18px rgba(0,0,0,.35)}\
.adn-ico svg{width:32px;height:32px;fill:none;stroke:var(--adn-ic);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}\
.adn-tt{margin:0 0 10px;font-size:20px;font-weight:700;letter-spacing:.02em;color:var(--adn-tt)}\
.adn-tx{margin:0;font-size:15px;line-height:1.75;color:var(--adn-tx);word-break:keep-all}\
.adn-tx b{color:var(--adn-hl);font-weight:700}\
.adn-ck{display:flex;align-items:center;justify-content:center;gap:10px;margin:20px auto 0;padding:9px 14px;border-radius:12px;cursor:pointer;user-select:none;-webkit-user-select:none;font-size:14px;color:var(--adn-tx);background:var(--adn-ck-bg)}\
.adn-ck input{position:absolute;opacity:0;pointer-events:none}\
.adn-ck i{flex:none;width:22px;height:22px;border-radius:7px;border:2px solid var(--adn-bd);background:var(--adn-in);display:grid;place-items:center;transition:.15s}\
.adn-ck i:after{content:"";width:6px;height:11px;margin-top:-2px;border:solid #fff;border-width:0 3px 3px 0;transform:rotate(45deg) scale(0);transition:transform .15s}\
.adn-ck input:checked+i{background:var(--adn-ac);border-color:var(--adn-ac)}\
.adn-ck input:checked+i:after{transform:rotate(45deg) scale(1)}\
.adn-ck input:focus-visible+i{outline:3px solid var(--adn-hl);outline-offset:2px}\
.adn-ok{appearance:none;margin:16px 0 0;width:100%;height:46px;border:0;border-radius:99px;cursor:pointer;font:inherit;font-size:16px;font-weight:700;letter-spacing:.06em;color:#fff;background:var(--adn-btn);box-shadow:var(--adn-btn-sh);transition:transform .12s,filter .15s}\
.adn-ok:hover{filter:brightness(1.08)}.adn-ok:active{transform:translateY(2px)}\
.adn-ok:focus-visible{outline:3px solid var(--adn-hl);outline-offset:3px}\
.adn-bg[data-t=warm]{--adn-font:Jua,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif;--adn-ic-bg:linear-gradient(135deg,#ff8a96,#e8495b);--adn-ic-bd:#fff8ef;--adn-ic:#fff;--adn-tt:#e8495b;--adn-tx:#5a2a3a;--adn-hl:#2f9e6e;--adn-ck-bg:rgba(232,73,91,.08);--adn-bd:#e8495b;--adn-in:#fff;--adn-ac:#e8495b;--adn-btn:linear-gradient(135deg,#ff8a96,#e8495b 70%);--adn-btn-sh:0 4px 0 #a8263d,0 8px 18px rgba(232,73,91,.4)}\
.adn-bg[data-t=warm] .adn-box{background:#fff8ef;border:3px solid #fff;box-shadow:0 6px 0 rgba(120,40,70,.35),0 22px 50px rgba(10,6,40,.55)}\
.adn-bg[data-t=sky]{--adn-font:-apple-system,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic","Segoe UI",system-ui,sans-serif;--adn-ic-bg:#23272f;--adn-ic-bd:#4a90e2;--adn-ic:#4a90e2;--adn-tt:#fff;--adn-tx:#c9cdd6;--adn-hl:#7db4f5;--adn-ck-bg:rgba(255,255,255,.06);--adn-bd:#6b7384;--adn-in:#1e222a;--adn-ac:#4a90e2;--adn-btn:#4a90e2;--adn-btn-sh:0 4px 14px rgba(74,144,226,.4)}\
.adn-bg[data-t=sky] .adn-box{background:rgba(43,48,59,.98);border:1px solid rgba(255,255,255,.1);border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.6)}\
.adn-bg[data-t=sky] .adn-ok{border-radius:6px}\
.adn-bg[data-t=glass]{--adn-font:"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;--adn-ic-bg:rgba(255,255,255,.16);--adn-ic-bd:rgba(255,255,255,.55);--adn-ic:#fff;--adn-tt:#fff;--adn-tx:rgba(255,255,255,.9);--adn-hl:#ffe0a8;--adn-ck-bg:rgba(255,255,255,.12);--adn-bd:rgba(255,255,255,.7);--adn-in:rgba(255,255,255,.12);--adn-ac:#4a8fe0;--adn-btn:linear-gradient(135deg,#6aa8ff,#4a8fe0);--adn-btn-sh:0 6px 18px rgba(74,143,224,.45)}\
.adn-bg[data-t=glass] .adn-box{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.4);-webkit-backdrop-filter:blur(22px) saturate(1.4);backdrop-filter:blur(22px) saturate(1.4);box-shadow:0 20px 50px rgba(0,0,0,.45)}\
@media (prefers-reduced-motion:reduce){.adn-bg,.adn-box{transition:none}}';

function show(){
 if(document.getElementById('adn-bg'))return;
 var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
 var bg=document.createElement('div');bg.className='adn-bg';bg.id='adn-bg';bg.setAttribute('data-t',theme);
 bg.setAttribute('role','dialog');bg.setAttribute('aria-modal','true');bg.setAttribute('aria-labelledby','adn-tt');
 bg.innerHTML='<div class="adn-box">'
  +'<div class="adn-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5.5c0 4.4-3 7.7-7 9.5-4-1.8-7-5.1-7-9.5V6z"/><path d="M8.8 12.2l2.3 2.3 4.2-4.6"/></svg></div>'
  +'<h2 class="adn-tt" id="adn-tt">광고 없는 사이트 안내</h2>'
  +'<p class="adn-tx">이 사이트는 <b>수익을 위해 만든 사이트가 아니라 광고가 나오지 않습니다.</b> 이외 아이콘이 안보일경우 사이트에서 제공되는 <b>절전모드</b>를 꺼보세요.(휴대폰절전모드는 아닙니다.)</p>'
  +'<label class="adn-ck"><input type="checkbox" id="adn-ck"><i></i><span>다음 접속시 안보기</span></label>'
  +'<button type="button" class="adn-ok" id="adn-ok">확인</button></div>';
 document.body.appendChild(bg);
 try{sessionStorage.setItem(SES,'1')}catch(e){}
 var prev=document.activeElement,ck=bg.querySelector('#adn-ck'),ok=bg.querySelector('#adn-ok');
 function close(){
  try{if(ck.checked)localStorage.setItem(KEY,'1');else localStorage.removeItem(KEY)}catch(e){}
  document.removeEventListener('keydown',key,true);
  bg.classList.remove('on');setTimeout(function(){bg.remove();st.remove()},260);
  try{prev&&prev.focus&&prev.focus()}catch(e){}
 }
 function key(e){
  if(e.key==='Escape'||e.key==='Enter'&&document.activeElement===ok){e.preventDefault();close()}
  else if(e.key==='Tab'){var f=[ck,ok],i=f.indexOf(document.activeElement);e.preventDefault();f[(i+(e.shiftKey?-1:1)+2)%2].focus()}
 }
 ok.addEventListener('click',close);
 document.addEventListener('keydown',key,true);
 requestAnimationFrame(function(){bg.classList.add('on');ok.focus()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',show);else show();
})();
