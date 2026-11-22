(() => {
 const $ = (s) => document.querySelector(s);
 const ownerEl=$('#owner'), repoEl=$('#repo'), branchEl=$('#branch'), tokenEl=$('#token');
 const connectStatus=$('#connect-status'), publishStatus=$('#publish-status'), progress=$('#progress-bar');
 const connectBtn=$('#connect'), publishBtn=$('#publish');
 const sourceEl=$('#game-source'), localField=$('#local-files-field'), urlField=$('#external-url-field');
 const filesEl=$('#game-files'), zipEl=$('#game-zips'), fileUrlEl=$('#game-file-url'), imageEl=$('#game-image'), coverUrlEl=$('#cover-url');
 const apiBase='https://api.github.com';
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const headers=()=>({'Accept':'application/vnd.github+json','Authorization':`Bearer ${tokenEl.value.trim()}`,'X-GitHub-Api-Version':'2022-11-28'});
 const repoInfo=()=>({owner:ownerEl.value.trim(),repo:repoEl.value.trim(),branch:branchEl.value.trim()||'main'});
 const repoPath=()=>{const {owner,repo}=repoInfo();return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`};
 const escPath=p=>p.split('/').map(encodeURIComponent).join('/');
 function status(el,msg,type=''){el.textContent=msg;el.className='status '+type}
 function setProgress(n){progress.style.width=Math.max(0,Math.min(100,n))+'%'}
 function slugify(s){return s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9가-힣]+/g,'-').replace(/^-+|-+$/g,'').slice(0,55)||'game'}
 function base64(bytes){let out='';const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)out+=String.fromCharCode.apply(null,bytes.subarray(i,i+chunk));return btoa(out)}
 function safeHttps(value,label){try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)throw new Error();return u.href}catch{throw new Error(`${label}은(는) 로그인 정보가 포함되지 않은 유효한 HTTPS 주소여야 합니다.`)}}

 function stripCommon(paths){const tops=new Set(paths.map(p=>p.split('/')[0]));if(tops.size===1&&paths.every(p=>p.includes('/')))return paths.map(p=>p.split('/').slice(1).join('/'));return paths}
 function pickExe(paths,title,wanted){
  if(wanted){const w=wanted.replace(/\\/g,'/').replace(/^\/+/,'').toLowerCase();const hit=paths.find(p=>p.toLowerCase()===w||p.toLowerCase().endsWith('/'+w));if(hit)return hit;throw new Error(`입력한 실행 파일 "${wanted}" 을(를) 게임 파일에서 찾지 못했습니다. 이름과 경로를 확인하세요.`)}
  const runnable=paths.filter(p=>/\.(exe|com|bat)$/i.test(p));
  const skip=/(^|\/)(setup|install|uninst|uninstall|config|setsound|sound|readme|dos4gw|pkunzip|cwsdpmi)[^\/]*\.(exe|com|bat)$/i;
  let c=runnable.filter(p=>!skip.test(p));if(!c.length)c=runnable;if(!c.length)return '';
  const t=slugify(title).replace(/-/g,'');
  const score=p=>{const n=p.split('/').pop().replace(/\.\w+$/,'').toLowerCase();return ((n.length>2&&t.includes(n))||(t.length>3&&n.includes(t.slice(0,4)))?0:10)+p.split('/').length};
  return c.sort((a,b)=>score(a)-score(b)||a.localeCompare(b))[0];
 }
 function makeConf(exe){
  const parts=exe.split('/');const file=parts.pop();
  const cd=parts.length?`cd ${parts.join('\\')}\n`:'';
  return `[sdl]\nautolock=true\n[cpu]\ncore=auto\ncycles=max\n[mixer]\nrate=44100\n[autoexec]\n@echo off\nmount c .\nc:\n${cd}${file}\nexit\n`;
 }
 function syncSource(){const remote=sourceEl.value==='url';localField.classList.toggle('hidden',remote);urlField.classList.toggle('hidden',!remote);filesEl.required=false;zipEl.required=false;fileUrlEl.required=remote}
 sourceEl.addEventListener('change',syncSource);syncSource();

 // GitHub API 호출 (속도 제한/일시 오류 시 자동 재시도)
 async function api(path,opts={},tries=5){
  for(let i=0;i<tries;i++){
   const r=await fetch(apiBase+path,{...opts,headers:{...headers(),...(opts.headers||{})}});
   let data={};try{data=await r.json()}catch{}
   if(r.ok)return data;
   const msg=data.message||`GitHub API 오류 (${r.status})`;
   const limited=(r.status===403||r.status===429)&&/rate limit|abuse|secondary/i.test(msg);
   if((limited||r.status>=500)&&i<tries-1){const wait=Math.max(1,Number(r.headers.get('retry-after'))||(15*(i+1)));status(publishStatus,`GitHub 요청 제한 — ${wait}초 후 자동으로 다시 시도합니다…`);await sleep(wait*1000);continue}
   const err=new Error(msg);err.status=r.status;throw err;
  }
 }
 async function getCatalogRaw(ref){
  const {owner,repo}=repoInfo();
  const r=await fetch(`${apiBase}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/games/games.json?ref=${encodeURIComponent(ref)}`,{headers:{...headers(),'Accept':'application/vnd.github.raw+json'}});
  if(r.status===404)return [];
  if(!r.ok)throw new Error(`게임 목록(games.json)을 읽지 못했습니다 (${r.status})`);
  const txt=(await r.text()).trim();
  if(!txt)return [];
  const data=JSON.parse(txt);
  return Array.isArray(data)?data:[];
 }

 connectBtn.addEventListener('click',async()=>{const {owner,repo,branch}=repoInfo();if(!owner||!repo||!tokenEl.value.trim()){status(connectStatus,'사용자명, 저장소 이름, 토큰을 모두 입력하세요.','bad');return}connectBtn.disabled=true;status(connectStatus,'GitHub 저장소에 연결하는 중…');try{const r=await api(repoPath());const b=await api(`${repoPath()}/branches/${escPath(branch)}`);const perm=r.permissions&&r.permissions.push===false?'\n⚠ 이 토큰에는 쓰기 권한이 없습니다. Contents: Read and write 를 확인하세요.':'';const def=r.default_branch&&r.default_branch!==branch?`\n⚠ 저장소 기본 브랜치는 "${r.default_branch}" 입니다. 사이트가 그 브랜치에서 게시된다면 Branch 칸을 "${r.default_branch}" 로 바꾸세요.`:'';status(connectStatus,`연결 성공: ${r.full_name}\n브랜치: ${b.name}${def}${perm}\n이제 게임을 등록할 수 있습니다.`,def||perm?'bad':'good')}catch(e){status(connectStatus,`연결 실패: ${e.message}\n저장소 이름, 브랜치, 토큰 권한을 확인하세요.`,'bad')}finally{connectBtn.disabled=false}});

 $('#game-form').addEventListener('submit',async e=>{e.preventDefault();const {owner,repo,branch}=repoInfo();const title=$('#game-title').value.trim(),platform=$('#platform').value,year=$('#year').value.trim(),description=$('#description').value.trim();const image=imageEl.files[0],files=[...filesEl.files],remote=sourceEl.value==='url';
  if(!owner||!repo||!tokenEl.value.trim()){status(publishStatus,'먼저 GitHub 연결 정보를 입력하세요.','bad');return}
  if(!title){status(publishStatus,'게임 이름을 입력하세요.','bad');return}
  if(!image&&!coverUrlEl.value.trim()){status(publishStatus,'타이틀 이미지 파일 또는 이미지 URL을 입력하세요.','bad');return}
  let externalUrl='';try{if(remote)externalUrl=safeHttps(fileUrlEl.value.trim(),'게임 파일 URL');if(coverUrlEl.value.trim())safeHttps(coverUrlEl.value.trim(),'타이틀 이미지 URL')}catch(err){status(publishStatus,err.message,'bad');return}
  if(remote&&!externalUrl){status(publishStatus,'외부 게임 파일 URL을 입력하세요.','bad');return}
  if(!remote&&!files.length&&!(zipEl?.files?.length)){status(publishStatus,'게임 파일, 폴더 또는 ZIP 파일을 선택하세요.','bad');return}
  const total=files.reduce((n,f)=>n+f.size,0)+[...(zipEl?.files||[])].reduce((n,f)=>n+f.size,0)+(image?.size||0);if(!remote&&(total>90*1024*1024||files.some(f=>f.size>90*1024*1024))){status(publishStatus,'직접 업로드는 선택한 전체 파일 기준 90MB 미만을 권장합니다. 100MB 이상 파일은 외부 서버 URL 방식을 선택하세요.','bad');return}
  publishBtn.disabled=true;setProgress(0);status(publishStatus,'등록 준비 중…');
  try{
   // 1) 현재 브랜치 최신 커밋과 게임 목록 읽기
   const ref=await api(`${repoPath()}/git/ref/heads/${escPath(branch)}`);
   const baseCommitSha=ref.object.sha;
   const baseCommit=await api(`${repoPath()}/git/commits/${baseCommitSha}`);
   const catalog=await getCatalogRaw(baseCommitSha);
   let id=slugify(title),suffix=2;while(catalog.some(g=>g.id===id))id=`${slugify(title)}-${suffix++}`;
   const root=`games/files/${platform}/${id}`;
   const storedFiles=[];const treeItems=[];

   // 2) 올릴 파일 목록 만들기 (폴더 / ZIP 해제)
   const uploadItems=[];
   if(!remote){
    files.forEach(file=>{const rp=(file.webkitRelativePath||file.name).replace(/^.*?\//,'').replace(/^\/+/,'');uploadItems.push({path:rp,rel:rp,file})});
    for(const zipFile of [...(zipEl?.files||[])]){
     if(!window.JSZip)throw new Error('ZIP 처리 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인하세요.');
     const archive=await JSZip.loadAsync(zipFile);
     const prefix=slugify(zipFile.name.replace(/\.zip$/i,''));
     for(const [entryName,entry] of Object.entries(archive.files)){
      if(entry.dir)continue;
      const normalized=entryName.replace(/\\/g,'/').replace(/^\/+/,'');
      if(normalized.split('/').some(part=>part==='..'))continue;
      uploadItems.push({path:`${prefix}/${normalized}`,rel:normalized,file:await entry.async('blob')});
     }
    }
    const extractedTotal=uploadItems.reduce((n,item)=>n+item.file.size,0)+(image?.size||0);
    if(extractedTotal>90*1024*1024)throw new Error('ZIP 압축 해제 후 전체 파일이 90MB를 초과합니다. 더 작은 ZIP 또는 외부 URL 방식을 사용하세요.');
   }
   // DOS 게임: 윈도우 없이 바로 실행되도록 .jsdos 번들을 자동으로 만든다
   let bundleNote='';
   if(!remote&&platform==='dos'&&uploadItems.length&&!uploadItems.some(i=>/\.jsdos$/i.test(i.path))){
    status(publishStatus,'DOS 바로 실행용 번들 만드는 중…');
    const rels=stripCommon(uploadItems.map(i=>i.rel));
    const exe=pickExe(rels,title,($('#exe-name')?.value||'').trim());
    if(exe){
     const zip=new JSZip();
     uploadItems.forEach((i,k)=>zip.file(rels[k],i.file));
     zip.file('.jsdos/dosbox.conf',makeConf(exe));
     const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}});
     uploadItems.length=0;uploadItems.push({path:`${id}.jsdos`,rel:`${id}.jsdos`,file:blob});
     bundleNote=`\n바로 실행 파일: ${exe} (자동 선택)`;
    }else{bundleNote='\n⚠ 실행 파일(exe/com/bat)을 찾지 못해 파일만 등록했습니다. "DOS 실행 파일 이름"을 입력해 다시 등록하세요.'}
   }
   const all=uploadItems.length+(image?1:0)||1;let done=0;

   // 3) 파일을 blob 으로 올리기 (아직 사이트에는 반영되지 않음)
   const putBlob=async(path,blobOrFile)=>{
    const b=await api(`${repoPath()}/git/blobs`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:base64(new Uint8Array(await blobOrFile.arrayBuffer())),encoding:'base64'})});
    treeItems.push({path,mode:'100644',type:'blob',sha:b.sha});
    done++;setProgress(done/all*80);status(publishStatus,`게임 파일 업로드 중… (${done}/${all})\n${path.split('/').slice(-1)[0]}`);
   };
   for(const item of uploadItems){const rel=item.path.replace(/^\/+/,'');const path=`${root}/${rel}`;await putBlob(path,item.file);storedFiles.push(path)}
   let cover='';
   if(image){const ext=(image.name.split('.').pop()||'png').toLowerCase().replace(/[^a-z0-9]/g,'')||'png';cover=`games/covers/${id}.${ext}`;await putBlob(cover,image)}
   else if(coverUrlEl.value.trim()){cover=safeHttps(coverUrlEl.value.trim(),'타이틀 이미지 URL')}

   // 4) 게임 목록(games.json)까지 합쳐서 "커밋 1번"으로 한꺼번에 반영
   const entry={id,title,platform,year:year||'',description:description||'Classic PC game',symbol:platform==='win95'?'95':platform==='win98'?'98':'DOS',color:'linear-gradient(135deg,#284a65,#17273e)',cover,files:storedFiles,bundle:storedFiles.find(p=>/\.jsdos$/i.test(p))||'',externalUrl:remote?externalUrl:'',externalFilename:remote?(new URL(externalUrl).pathname.split('/').pop()||'external-game-file'):'',storageMode:remote?'external-url':'github'};
   catalog.push(entry);
   treeItems.push({path:'games/games.json',mode:'100644',type:'blob',content:JSON.stringify(catalog,null,2)+'\n'});
   status(publishStatus,'커밋 만드는 중…');setProgress(88);
   const tree=await api(`${repoPath()}/git/trees`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({base_tree:baseCommit.tree.sha,tree:treeItems})});
   const commit=await api(`${repoPath()}/git/commits`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:`Register game: ${title}`,tree:tree.sha,parents:[baseCommitSha]})});
   await api(`${repoPath()}/git/refs/heads/${escPath(branch)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({sha:commit.sha,force:false})});

   // 5) 정말 저장소에 들어갔는지 다시 확인
   setProgress(95);status(publishStatus,'저장소에 반영됐는지 확인하는 중…');
   const check=await getCatalogRaw(branch);
   if(!check.some(g=>g.id===id))throw new Error('커밋은 만들어졌지만 games.json 에서 새 게임을 찾지 못했습니다.');
   setProgress(100);
   status(publishStatus,`게시 완료! (커밋 1번으로 저장됨)${bundleNote}\n게임: ${title}\n플랫폼: ${platform.toUpperCase()}\n파일: ${remote?'외부 URL 링크 저장':storedFiles.length+'개 GitHub 업로드'}\n저장소: ${owner}/${repo} (${branch})\n현재 등록된 게임 수: ${check.length}개\n\nGitHub Pages 반영(보통 1~3분)을 기다린 뒤 메인 페이지를 새로고침(Ctrl+F5)하세요.\n저장소 Actions 탭에서 "pages build and deployment" 가 초록색이 되면 반영된 것입니다.`,'good');
   $('#game-form').reset();syncSource();
  }catch(err){status(publishStatus,`게시 중 오류: ${err.message}\n오류가 나면 아무것도 사이트에 반영되지 않습니다(한 번에 커밋하기 때문). 다시 시도해도 안전합니다.`,'bad')}finally{publishBtn.disabled=false}
 });
})();
