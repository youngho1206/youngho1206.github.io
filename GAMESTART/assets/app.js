let games=[], active="all";
const grid=document.querySelector("#game-grid"), search=document.querySelector("#search"), empty=document.querySelector("#empty");
const labels={dos:"MS-DOS",win95:"WINDOWS 95",win98:"WINDOWS 98"};
async function init(){try{const r=await fetch("games/games.json");games=await r.json()}catch(e){games=[]}updateCounts();render()}
function updateCounts(){for(const key of ["all","dos","win95","win98"]){const n=key==="all"?games.length:games.filter(g=>g.platform===key).length;document.querySelector("#count-"+key).textContent=n}}
function render(){const q=search.value.trim().toLowerCase();const list=games.filter(g=>(active==="all"||g.platform===active)&&(`${g.title} ${g.description} ${g.year}`.toLowerCase().includes(q)));grid.innerHTML=list.map(g=>`<article class="game-card"><div class="game-cover" style="background:${g.color||"linear-gradient(135deg,#284a65,#17273e)"}"><span class="platform-tag">${labels[g.platform]||g.platform}</span><span class="cover-symbol">${g.symbol||"PC"}</span></div><div class="game-info"><h3>${esc(g.title)}</h3><p>${esc(g.description||"Classic PC game")}</p><div class="card-bottom"><span class="year">${g.year||"YEAR UNKNOWN"}</span><button class="play-link" ${g.bundle?"":"disabled"} onclick="launch('${encodeURIComponent(g.id)}')">${g.bundle?"PLAY NOW ↗":"COMING SOON"}</button></div></div></article>`).join("");empty.classList.toggle("hidden",list.length>0)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
document.querySelector("#filters").addEventListener("click",e=>{const b=e.target.closest("button[data-filter]");if(!b)return;active=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));render()});
search.addEventListener("input",render);
function launch(id){const g=games.find(x=>x.id===decodeURIComponent(id));if(!g||!g.bundle)return;location.href="player.html?game="+encodeURIComponent(g.id)}
init();