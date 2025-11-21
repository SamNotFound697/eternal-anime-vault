let currentRealm = '';
let currentFolder = '';

// 300 super merry drifting stars
for(let i=0;i<300;i++){
  const s=document.createElement('div');
  s.className='star';
  s.style.top=Math.random()*100+'vh';
  s.style.left=Math.random()*100+'vw';
  s.style.animationDelay=Math.random()*4+'s';
  s.style.animationDuration=(50+Math.random()*50)+'s';
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

// Back to landing
document.getElementById('back').onclick = () => {
  document.getElementById('vault').classList.add('hidden');
  document.getElementById('realms').classList.remove('hidden');
  currentFolder = '';
  document.getElementById('dropzone').classList.add('hidden');
};

// Create subfolder
document.getElementById('new-folder').onclick = () => {
  const name = prompt('Subfolder name (e.g. Shrek 2025, Goa Trip):');
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
    btn.textContent = f;
    btn.onclick = () => {
      currentFolder = f;
      updatePath();
      document.getElementById('dropzone').classList.remove('hidden');
    };
    container.appendChild(btn);
  });
}

// Normal drop zone
const zone = document.getElementById('dropzone');
['dragenter','dragover'].forEach(e=>zone.addEventListener(e,()=>zone.classList.add('highlight')));
['dragleave','drop'].forEach(e=>zone.addEventListener(e,()=>zone.classList.remove('highlight')));
zone.addEventListener('drop', async e => {
  e.preventDefault();
  if(!currentFolder) return;
  for(const file of e.dataTransfer.files){
    const fd = new FormData();
    fd.append('file', file);
    fd.append('path', `${currentRealm}/${currentFolder}/${file.name}`);
    await fetch('/.netlify/functions/upload',{method:'POST',body:fd});
    toast(`Saved ${file.name}`);
  }
  setTimeout(()=>location.reload(),1500);
});

// MAGIC BUTTON — the one you asked for
document.getElementById('magic-upload').onclick = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.onchange = async e => {
    const files = e.target.files;
    if(files.length===0) return;

    const realm = prompt("Choose realm:\nVisuals | Games | Movies | Music | Memes | Secrets", "Visuals");
    if(!realm) return;
    const folder = prompt("Subfolder name:", "General");
    if(!folder) return;

    for(const file of files){
      const fd = new FormData();
      fd.append('file', file);
      fd.append('path', `${realm.trim()}/${folder.trim()}/${file.name}`);
      await fetch('/.netlify/functions/upload',{method:'POST',body:fd});
      toast(`Magically saved ${file.name}`);
    }
    setTimeout(()=>location.reload(),2000);
  };
  input.click();
};

function toast(m){
  const t=document.getElementById('toast');
  t.textContent=m;
  t.style.opacity=1;
  t.style.bottom='40px';
  setTimeout(()=>{t.style.opacity=0;t.style.bottom='20px'},3000);
}
