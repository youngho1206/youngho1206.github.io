(() => {
 const $ = (s) => document.querySelector(s);
 const ownerEl=$('#owner'), repoEl=$('#repo'), branchEl=$('#branch'), tokenEl=$('#token');
 const connectStatus=$('#connect-status'), publishStatus=$('#publish-status'), progress=$('#progress-bar');
 const connectBtn=$('#connect'), publishBtn=$('#publish');
 const sourceEl=$('#game-source'), localField=$('#local-files-field'), urlField=$('#external-url-field');
 const filesEl=$('#game-files'), fileUrlEl=$('#game-file-url'), imageEl=$('#game-image'), coverUrlEl=$('#cover-url');
 let connected=false;
 const apiBase='https://api.github.com';
 const headers=()=>({'Accept':'application/vnd.github+json','Authorization':`Bearer ${tokenEl.value.trim()}`,'X-GitHub-Api-Version':'2022-11-28'});
 const repoInfo=()=>({owner:ownerEl.value.trim(),repo:repoEl.value.trim(),branch:branchEl.value.trim()||'main'});
 const escPath=p=>p.split('/').map(encodeURIComponent).join('/');
 function status(el,msg,type=''){el.textContent=msg;el.className='status '+type}
 function setProgress(n){progress.style.width=Math.max(0,Math.min(100,n))+'%'}
 function slugify(s){return s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9가-힣]+/g,'-').replace(/^-+|-+$/g,'').slice(0,55)||'game'}
 function base64(bytes){let out='';const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)out+=String.fromCharCode(...bytes.subarray(i,i+chunk));return btoa(out)}
 function safeHttps(value,label){try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)throw new Error();return u.href}catch{throw new Error(`${label}은(는) 로그인 정보가 포함되지 않은 유효한 HTTPS 주소여야 합니다.`)}}
 function syncSource(){const remote=sourceEl.value==='url';localField.classList.toggle('hidden',remote);urlField.classList.toggle('hidden',!remote);filesEl.required=!remote;fileUrlEl.required=remote}
 sourceEl.addEventListener('change',syncSource);syncSource();
 async function api(path,opts={}){const r=await fetch(apiBase+path,{...opts,headers:{...headers(),...(opts.headers||{})}});let data={};try{data=await r.json()}catch{}if(!r.ok)throw new Error(data.message||`GitHub API 오류 (${r.status})`);return data}
 async function getFile(path){try{return await api(`/repos/${encodeURIComponent(repoInfo().owner)}/${encodeURIComponent(repoInfo().repo)}/contents/${escPath(path)}?ref=${encodeURIComponent(repoInfo().branch)}`)}catch(e){if(String(e.message).includes('Not Found'))return null;throw e}}
 async function putFile(path,content,message){const old=await getFile(path);const body={message,content,branch:repoInfo().branch};if(old?.sha)body.sha=old.sha;return api(`/repos/${encodeURIComponent(repoInfo().owner)}/${encodeURIComponent(repoInfo().repo)}/contents/${escPath(path)}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})}
 async function readCatalog(){const f=await getFile('games/games.json');if(!f)return [];const raw=decodeURIComponent(escape(atob((f.content||'').replace(/\n/g,''))));const data=JSON.parse(raw);return Array.isArray(data)?data:[]}
 connectBtn.addEventListener('click',async()=>{const {owner,repo,branch}=repoInfo();if(!owner||!repo||!tokenEl.value.trim()){status(connectStatus,'사용자명, 저장소 이름, 토큰을 모두 입력하세요.','bad');return}connectBtn.disabled=true;status(connectStatus,'GitHub 저장소에 연결하는 중…');try{const r=await api(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);const b=await api(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches/${encodeURIComponent(branch)}`);connected=true;status(connectStatus,`연결 성공: ${r.full_name}\n브랜치: ${b.name}\n이제 게임을 등록할 수 있습니다.`,'good')}catch(e){connected=false;status(connectStatus,`연결 실패: ${e.message}\n저장소 이름, 브랜치, 토큰 권한을 확인하세요.`,'bad')}finally{connectBtn.disabled=false}});
 $('#game-form').addEventListener('submit',async e=>{e.preventDefault();const {owner,repo,branch}=repoInfo();const title=$('#game-title').value.trim(),platform=$('#platform').value,year=$('#year').value.trim(),description=$('#description').value.trim();const image=imageEl.files[0],files=[...filesEl.files],remote=sourceEl.value==='url';
  if(!owner||!repo||!tokenEl.value.trim()){status(publishStatus,'먼저 GitHub 연결 정보를 입력하세요.','bad');return}
  if(!title){status(publishStatus,'게임 이름을 입력하세요.','bad');return}
  if(!image&&!coverUrlEl.value.trim()){status(publishStatus,'타이틀 이미지 파일 또는 이미지 URL을 입력하세요.','bad');return}
  let externalUrl='';try{if(remote)externalUrl=safeHttps(fileUrlEl.value.trim(),'게임 파일 URL');if(coverUrlEl.value.trim())safeHttps(coverUrlEl.value.trim(),'타이틀 이미지 URL')}catch(err){status(publishStatus,err.message,'bad');return}
  if(remote&&!externalUrl){status(publishStatus,'외부 게임 파일 URL을 입력하세요.','bad');return}
  if(!remote&&!files.length){status(publishStatus,'게임 파일 또는 폴더를 선택하세요.','bad');return}
  const total=files.reduce((n,f)=>n+f.size,0)+(image?.size||0);if(!remote&&(total>90*1024*1024||files.some(f=>f.size>90*1024*1024))){status(publishStatus,'직접 업로드는 파일당 90MB 미만으로 제한합니다. 100MB 이상 파일은 외부 서버 URL 방식을 선택하세요.','bad');return}
  publishBtn.disabled=true;setProgress(0);status(publishStatus,'등록 준비 중…');
  try{
   const catalog=await readCatalog();let id=slugify(title),suffix=2;while(catalog.some(g=>g.id===id))id=`${slugify(title)}-${suffix++}`;
   const root=`games/files/${platform}/${id}`;let done=0;const all=(remote?0:files.length)+(image?1:0)+1;
   const storedFiles=[];
   if(!remote){for(const file of files){const rel=(file.webkitRelativePath||file.name).replace(/^.*?\//,'').replace(/^\/+/, '');const path=`${root}/${rel}`;const content=base64(new Uint8Array(await file.arrayBuffer()));await putFile(path,content,`Add ${title} game file: ${rel}`);storedFiles.push(path);done++;setProgress(done/all*85);status(publishStatus,`게임 파일 업로드 중… (${done}/${all})\n${rel}`)}}
   let cover='';if(image){const ext=(image.name.split('.').pop()||'png').toLowerCase().replace(/[^a-z0-9]/g,'')||'png';const coverPath=`games/covers/${id}.${ext}`;await putFile(coverPath,base64(new Uint8Array(await image.arrayBuffer())),`Add ${title} cover image`);cover=coverPath;done++;setProgress(done/all*85)}else if(coverUrlEl.value.trim()){cover=safeHttps(coverUrlEl.value.trim(),'타이틀 이미지 URL')}
   const entry={id,title,platform,year:year||'',description:description||'Classic PC game',symbol:platform==='win95'?'95':platform==='win98'?'98':'DOS',color:'linear-gradient(135deg,#284a65,#17273e)',cover,files:storedFiles,bundle:'',externalUrl:remote?externalUrl:'',externalFilename:remote?(new URL(externalUrl).pathname.split('/').pop()||'external-game-file'):'',storageMode:remote?'external-url':'github'};catalog.push(entry);
   await putFile('games/games.json',btoa(unescape(encodeURIComponent(JSON.stringify(catalog,null,2)))),`Register game: ${title}`);setProgress(100);status(publishStatus,`게시 완료!\n게임: ${title}\n플랫폼: ${platform.toUpperCase()}\n파일 방식: ${remote?'외부 URL 링크 저장':'GitHub 업로드 ('+files.length+'개 파일)'}\n타이틀 이미지: ${image?'GitHub 업로드':'이미지 URL'}\n저장소: ${owner}/${repo}\n\nGitHub Pages 반영까지 잠시 기다린 뒤 메인 페이지를 새로고침하세요.\n외부 파일은 링크가 공개 상태이고 실제 파일로 연결되는지 확인하세요.`,'good');$('#game-form').reset();syncSource();
  }catch(err){status(publishStatus,`게시 중 오류: ${err.message}\n일부 파일은 이미 저장소에 올라갔을 수 있습니다. 저장소를 먼저 확인하세요.`,'bad')}finally{publishBtn.disabled=false}
 });
})();
