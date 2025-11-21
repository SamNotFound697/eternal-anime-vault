let currentRealm = '';
let currentFolder = '';

// 300 merry drifting stars
for(let i=0;i<300;i++){
  const s=document.createElement('div');s.className='star';
  s.style.top=Math.random()*100+'vh';s.style.left=Math.random()*100+'vw';
  s.style.animationDelay=Math.random()*5+'s';
  s.style.animationDuration=(40+Math.random()*60)+'s';
  document.getElementById('stars').appendChild(s);
}

// Enter realm
document.querySelectorAll('.realm').forEach(r => {
  r.onclick = () => {
    currentRealm = r.dataset.name;
    document.getElementById('realm-title').textContent = currentRealm + ' Realm';
    document.getElementById('realms').classList.add('hidden');
    document.getElementById('vault').classList.remove('hidden');
    loadSubfolders();
  };
});

document.getElementById('back').onclick = () => {
  document.getElementById('vault').classList.add('hidden');
  document.getElementById('realms').classList.remove('hidden');
  currentFolder = '';
  document.getElementById('dropzone').classList.add('hidden');
};

// Create subfolder
document.getElementById('new-folder').onclick = () => {
  const name = prompt('Subfolder name:');
  if(name && name.trim()){
    currentFolder = name.trim();
    updatePath();
    document.getElementById('dropzone').classList.remove('hidden');
    saveFolder();
    toast('Subfolder created: ' + currentFolder);
  }
};

function updatePath(){
  document.getElementById('path').textContent = `${currentRealm}/${currentFolder}/`;
}

function saveFolder(){
  let list = JSON.parse(localStorage.getItem('folders_'+currentRealm) || '[]');
  if(!list.includes(currentFolder)) list.push(currentFolder);
  localStorage.setItem('folders_'+currentRealm, JSON.stringify(list));
  loadSubfolders();
}

function loadSubfolders(){
  const container = document.getElementById('folders');
  container.innerHTML = '';
  let list = JSON.parse(localStorage.getItem('folders_'+currentRealm) || '[]');
  list.forEach(f => {
    const btn = document.createElement('div');
    btn.className='folder-btn';
    btn.textContent = '📁 ' + f;
    btn.onclick = () => {
      currentFolder = f;
      updatePath();
      document.getElementById('dropzone').classList.remove('hidden');
      toast('Entered: ' + f);
    };
    container.appendChild(btn);
  });
}

// Normal drop zone (only works inside subfolder)
const zone = document.getElementById('dropzone');
['dragenter','dragover'].forEach(e=>zone.addEventListener(e,()=>zone.classList.add('highlight')));
['dragleave','drop'].forEach(e=>zone.addEventListener(e,()=>zone.classList.remove('highlight')));
zone.addEventListener('drop', async e => {
  e.preventDefault();
  if(!currentFolder){ toast('Create or enter a subfolder first!'); return; }
  for(const file of e.dataTransfer.files){
    const path = smartSort(file, currentRealm, currentFolder);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('path', path);
    await fetch('/.netlify/functions/upload',{method:'POST',body:fd});
    toast(`Smart-saved → ${path}`);
  }
  setTimeout(()=>location.reload(),2000);
});

// === SMART AUTO-SORTER (the real magic) ===
function smartSort(file, fallbackRealm, fallbackFolder){
  const name = file.name.toLowerCase();
  const ext = name.split('.').pop();

  // Hard rules — always go to correct realm
  if(['apk','zip','rar','7z'].includes(ext)) return `Games/${fallbackFolder || 'APKs'}/${file.name}`;
  if(['mp3','wav','ogg','flac'].includes(ext)) return `Music/${fallbackFolder || 'Tracks'}/${file.name}`;
  if(['mp4','webm','mkv','avi'].includes(ext)) return `Movies/${fallbackFolder || 'Clips'}/${file.name}`;
  if(['html','htm'].includes(ext)) return `Secrets/Web/${file.name}`;
  if(['exe','msi'].includes(ext)) return `Games/Dangerous/${file.name}`;

  // Soft rules for images/videos — ask only if ambiguous
  if(['png','jpg','jpeg','gif','webp','bmp','mp4','webm'].includes(ext)){
    const choice = prompt(
      `Smart sort: ${file.name}\n\n1 → Memes\n2 → Visuals\n3 → Secrets\n4 → Keep in current (${fallbackRealm}/${fallbackFolder})\n\nType 1-4`,
      "4"
    );
    switch(choice){
      case '1': return `Memes/${fallbackFolder || 'New'}/${file.name}`;
      case '2': return `Visuals/${fallbackFolder || 'New'}/${file.name}`;
      case '3': return `Secrets/${fallbackFolder || 'Hidden'}/${file.name}`;
      default: return `${fallbackRealm}/${fallbackFolder}/${file.name}`;
    }
  }

  // Default
  return `${fallbackRealm}/${fallbackFolder}/${file.name}`;
}

// SECRET EASTER EGG BUTTON ON LANDING PAGE
document.getElementById('magic-secret').onclick = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.onchange = async e => {
    for(const file of e.target.files){
      const path = smartSort(file, 'Visuals', 'Unsorted');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('path', path);
      await fetch('/.netlify/functions/upload',{method:'POST',body:fd});
      toast(`✨ Magic → ${path}`);
    }
    setTimeout(()=>location.reload(),2000);
  };
  input.click();
};

function toast(m){
  const t=document.getElementById('toast');
  t.textContent=m;t.style.opacity=1;t.style.bottom='40px';
  setTimeout(()=>{t.style.opacity=0;t.style.bottom='20px'},3000);
}
