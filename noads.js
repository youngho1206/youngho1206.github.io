/* noads.js - 광고 차단 (DNS 설정 불필요). 모든 페이지 <head> 맨 앞에서 먼저 실행됩니다.
   1) 알려진 광고/추적 주소로 가는 script·iframe·img·fetch·XHR·beacon·팝업 차단
   2) 허용 목록에 없는 외부 script 차단, 외부 코드가 만든 iframe·팝업·링크 클릭 차단
   3) 차단 기록: 브라우저 콘솔에서 __noadsLog 확인 */
(function(W){'use strict';
if(W.__noads)return;W.__noads=1;
var SELF=location.hostname,
AD=/doubleclick|googlesyndication|googleadservices|adservice\.google|googletagmanager|googletagservices|google-analytics|adsbygoogle|pagead|adsterra|propellerads|popads|popcash|exoclick|juicyads|trafficjunky|taboola|outbrain|mgid\.com|revcontent|criteo|adnxs|rubiconproject|pubmatic|amazon-adsystem|adform\.net|smartadserver|an\.yandex|yandexadexchange|daumcdn\.net\/kas|adfit|mobon|cauly|tenping|admob|applovin|unityads|chartboost|vungle|ironsrc|monetag|a-ads\.com|admaven|hilltopads|clickadu|richpops|onclickads|ezoic|adskeeper|zeropark|(^|[\/.])ads?[0-9]*\.|\/ads?\/|\/adserver/i,
CDN=/(^|\.)(accounts\.google\.com|apis\.google\.com|gstatic\.com|googleapis\.com|cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|cdn\.emulatorjs\.org|v8\.js-dos\.com|raw\.githubusercontent\.com|youtube\.com|ytimg\.com)$/i;
function log(u){try{(W.__noadsLog=W.__noadsLog||[]).push(String(u).slice(0,200))}catch(e){}}
function url(u){try{return new URL(u,location.href)}catch(e){return null}}
function ad(u){return AD.test(String(u))}
function trusted(h){return !h||h===SELF||CDN.test(h)}
function foreign(strict){var m=((new Error()).stack||'').match(/https?:\/\/[^\/:\s)'"]+/g)||[];
 for(var i=0;i<m.length;i++){var h=m[i].replace(/^https?:\/\//,'');if(strict?h!==SELF:!trusted(h))return true}return false}
function block(tag,u){if(!u)return false;var x=url(u);if(!x||!/^https?:$/.test(x.protocol))return false;
 if(ad(x.href))return true;
 if(tag==='SCRIPT')return !trusted(x.hostname);
 if(tag==='IFRAME'||tag==='EMBED')return !trusted(x.hostname)&&foreign();
 return false}
[['HTMLScriptElement','SCRIPT'],['HTMLIFrameElement','IFRAME'],['HTMLEmbedElement','EMBED'],['HTMLImageElement','IMG']].forEach(function(p){
 var C=W[p[0]],d=C&&Object.getOwnPropertyDescriptor(C.prototype,'src');if(!d||!d.set)return;
 Object.defineProperty(C.prototype,'src',{configurable:true,enumerable:d.enumerable,get:d.get,set:function(v){if(block(p[1],v)){log(v);return}d.set.call(this,v)}})});
var sa=Element.prototype.setAttribute;
Element.prototype.setAttribute=function(n,v){if(/^src$/i.test(n)&&block(this.tagName,v)){log(v);return}return sa.apply(this,arguments)};
var wo=W.open;
W.open=function(u){var x=u&&url(u);if(x&&/^https?:$/.test(x.protocol)&&(ad(x.href)||(x.hostname!==SELF&&!CDN.test(x.hostname)&&foreign(1)))){log(u);return null}return wo.apply(W,arguments)};
var ac=HTMLAnchorElement.prototype.click;
HTMLAnchorElement.prototype.click=function(){var x=url(this.href);if(x&&/^https?:$/.test(x.protocol)&&x.hostname!==SELF&&(ad(x.href)||foreign(1))){log(this.href);return}return ac.apply(this,arguments)};
var f=W.fetch;
if(f)W.fetch=function(i){var u=typeof i==='string'?i:(i&&i.url);if(u&&ad(u)){log(u);return Promise.reject(new TypeError('blocked'))}return f.apply(this,arguments)};
var xo=XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open=function(){var a=[].slice.call(arguments);if(ad(a[1])){log(a[1]);a[1]='data:,'}return xo.apply(this,a)};
var sb=navigator.sendBeacon;
if(sb)navigator.sendBeacon=function(u){if(ad(u)){log(u);return false}return sb.apply(navigator,arguments)};
try{Object.defineProperty(W,'EJS_AdUrl',{value:'',writable:false,configurable:false})}catch(e){}
function sweep(n){if(n.nodeType!==1)return;
 if(/^(SCRIPT|IFRAME|EMBED|IMG)$/.test(n.tagName)&&block(n.tagName,n.getAttribute('src'))){log(n.getAttribute('src'));n.remove();return}
 if(n.querySelectorAll)n.querySelectorAll('script[src],iframe[src],embed[src],img[src]').forEach(function(e){if(block(e.tagName,e.getAttribute('src'))){log(e.getAttribute('src'));e.remove()}})}
try{new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(sweep)})}).observe(document,{childList:true,subtree:true})}catch(e){}
var st=document.createElement('style');
st.textContent='ins.adsbygoogle,iframe[src*="doubleclick"],iframe[src*="googlesyndication"],[id^="google_ads"],[id^="div-gpt-ad"],a[href*="doubleclick"]{display:none!important}';
(document.head||document.documentElement).appendChild(st);
})(window);
