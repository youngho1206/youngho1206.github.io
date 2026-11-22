(() => {
 const $ = (s) => document.querySelector(s);
 const ownerEl=$('#owner'), repoEl=$('#repo'), branchEl=$('#branch'), tokenEl=$('#token');
 const connectStatus=$('#connect-status'), publishStatus=$('#publish-status'), progress=$('#progress-bar');
 const connectBtn=$('#connect'), publishBtn=$('#publish');
 let connected=false;
 const apiBase='https://api.github.com';
 const headers=()=>({'Accept':'application/vnd.github+json','Authorization':`Bearer ${tokenEl.value.trim()}`,'X-GitHub-Api-Version':'2022-11-28'});
 const repoInfo=()=>({owner:ownerEl.value.trim(),repo:repoEl.value.trim(),branch:branchEl.value.trim()||'main'});
 const escPath=p=>p.split('/').map(encodeURIComponent).join('/');
 function status(el,msg,type=''){el.textContent=msg;el.className='status '+type}
 function setProgress(n){progress.style.width=Math.max(0,Math.min(100,n))+'%'}
 function slugify(s){return s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9가-힣]+/g,'-').replace(/^-+|-+$/g,'').slice(0,55)||'game'}
 function base64(bytes){let out='';const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)out+=String.fromCharCode(...bytes.subarray(i,i+chunk));return btoa(out)}
 async function api(path,opts={}){const r=await fetch(apiBase+path,{...opts,headers:{...headers(),...(opts.headers||{})}});let data={};try{data=await r.json()}catch{}if(!r.ok)throw new Error(data.message||`GitHub API 오류 (${r.status})`);return data}
 async function getFile(path){try{return await api(`/repos/${encodeURIComponent(repoInfo().owner)}/${encodeURIComponent(repoInfo().repo)}/contents/${escPath(path)}?ref=${encodeURIComponent(repoInfo().branch)}`)}catch(e){if(String(e.message).includes('Not Found'))return null;throw e}}
 async function putFile(path,content,message){const old=await getFile(path);const body={message,content,branch:repoInfo().branch};if(old?.sha)body.sha=old.sha;return api(`/repos/${encodeURIComponent(repoInfo().owner)}/${encodeURIComponent(repoInfo().repo)}/contents/${escPath(path)}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})}
 async function readCatalog(){const f=await getFile('games/games.json');if(!f)return [];const raw=decodeURIComponent(escape(atob((f.content||'').replace(/\n/g,''))));const data=JSON.parse(raw);return Array.isArray(data)?data:[]}
 connectBtn.addEventListener('click',async()=>{const {owner,repo,branch}=repoInfo();if(!owner||!repo||!tokenEl.value.trim()){status(connectStatus,'사용자명, 저장소 이름, 토큰을 모두 입력하세요.','bad');return}connectBtn.disabled=true;status(connectStatus,'GitHub 저장소에 연결하는 중…');try{const r=await api(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);const b=await api(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches/${encodeURIComponent(branch)}`);connected=true;status(connectStatus,`연결 성공: ${r.full_name}\n브랜치: ${b.name}\n이제 게임을 등록할 수 있습니다.`,'good')}catch(e){connected=false;status(connectStatus,`연결 실패: ${e.message}\n저장소 이름, 브랜치, 토큰 권한을 확인하세요.`,'bad')}finally{connectBtn.disabled=false}});
 $('#game-form').addEventListener('submit',async e=>{e.preventDefault();const {owner,repo,branch}=repoInfo();const title=$('#game-title').value.trim(),platform=$('#platform').value,year=$('#year').value.trim(),description=$('#description').value.trim();const image=$('#game-image').files[0],files=[...$('#game-files').files];
  if(!owner||!repo||!tokenEl.value.trim()){status(publishStatus,'먼저 GitHub 연결 정보를 입력하세요.','bad');return}
  if(!title||!image||!files.length){status(publishStatus,'게임 이름, 타이틀 이미지, 게임 파일은 필수입니다.','bad');return}
  const total=files.reduce((n,f)=>n+f.size,0)+image.size;if(total>90*1024*1024){status(publishStatus,'선택한 파일 합계가 90MB를 넘습니다. GitHub 파일 업로드 제한을 고려해 더 작은 단위로 나눠주세요.','bad');return}
  if(files.some(f=>f.size>90*1024*1024)){status(publishStatus,'90MB를 초과하는 파일이 있습니다. 해당 파일은 별도 배포 저장소/호스팅이 필요합니다.','bad');return}
  publishBtn.disabled=true;setProgress(0);status(publishStatus,'등록 준비 중…');
  try{
   const catalog=await readCatalog();let id=slugify(title),suffix=2;while(catalog.some(g=>g.id===id))id=`${slugify(title)}-${suffix++}`;
   const root=`games/files/${platform}/${id}`;let done=0;const all=files.length+1;
   for(const file of files){const rel=(file.webkitRelativePath||file.name).replace(/^.*?\//,'').replace(/^\/+/, '');const path=`${root}/${rel}`;const content=base64(new Uint8Array(await file.arrayBuffer()));await putFile(path,content,`Add ${title} game file: ${rel}`);done++;setProgress(done/all*85);status(publishStatus,`게임 파일 업로드 중… (${done}/${all})\n${rel}`)}
   const ext=(image.name.split('.').pop()||'png').toLowerCase().replace(/[^a-z0-9]/g,'')||'png';const coverPath=`games/covers/${id}.${ext}`;await putFile(coverPath,base64(new Uint8Array(await image.arrayBuffer())),`Add ${title} cover image`);done++;setProgress(done/all*85);
   const entry={id,title,platform,year:year||'',description:description||'Classic PC game',symbol:platform==='win95'?'95':platform==='win98'?'98':'DOS',color:'linear-gradient(135deg,#284a65,#17273e)',cover:coverPath,files:files.map(f=>`${root}/${(f.webkitRelativePath||f.name).replace(/^.*?\//,'').replace(/^\/+/, '')}`),bundle:''};catalog.push(entry);
   await putFile('games/games.json',btoa(unescape(encodeURIComponent(JSON.stringify(catalog,null,2)))),`Register game: ${title}`);setProgress(100);status(publishStatus,`게시 완료!\n게임: ${title}\n플랫폼: ${platform.toUpperCase()}\n파일: ${files.length}개 + 타이틀 이미지\n저장소: ${owner}/${repo}\n\nGitHub Pages 반영까지 잠시 기다린 뒤 메인 페이지를 새로고침하세요.`,'good');$('#game-form').reset();
  }catch(err){status(publishStatus,`게시 중 오류: ${err.message}\n일부 파일은 이미 저장소에 올라갔을 수 있습니다. 다시 시도하면 중복 파일이 덮어써질 수 있으니 저장소를 먼저 확인하세요.`,'bad')}finally{publishBtn.disabled=false}
 });
})();
