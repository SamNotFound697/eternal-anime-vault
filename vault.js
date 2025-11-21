const realms = document.getElementById('realms');
const vault = document.getElementById('vault');
let currentRealm = '';
let currentFolder = '';

// stars
for(let i=0;i<200;i++){
  const s=document.createElement('div');s.className='star';
  s.style.top=Math.random()*100+'vh';s.style.left=Math.random()*100+'vw';
  s.style.animationDelay=Math.random()*4+'s';document.getElementById('stars').appendChild(s);
}

// enter realm
document.querySelectorAll('.realm').forEach(r => {
  r.onclick = () => {
    currentRealm = r.dataset.name;
    document.getElementById('realm-title').textContent = currentRealm + ' Realm';
    realms.classList.add('hidden');
    vault.classList.remove('hidden');
    loadFolders();
  };
});

document.getElementById('back').onclick = () => {
  vault.classList.add('hidden');
  realms.classList.remove('hidden');
  currentFolder = '';
};

document.getElementById('new-folder').onclick = () => {
  const name = prompt('Subfolder name (e.g. Shrek 2025, Goa Trip):');
  if(name){ currentFolder = name.trim(); updatePath(); loadFiles(); }
};

function updatePath(){
  document.getElementById('path').textContent = `${currentRealm}/${currentFolder}/`;
}

// drop zone
const zone = document.getElementById('dropzone');
['dragenter','dragover'].forEach(e=>zone.addEventListener(e,()=>zone.classList.add('highlight')));
['dragleave','drop'].forEach(e=>zone.addEventListener(e,()=>zone.classList.remove('highlight')));
zone.addEventListener('drop', async e => {
  e.preventDefault();
  if(!currentFolder) return toast('Create a subfolder first!');
  for(const file of e.dataTransfer.files){
    const fd = new FormData();
    fd.append('file', file);
    fd.append('path', `${currentRealm}/${currentFolder}/${file.name}`);
    await fetch('/.netlify/functions/upload',{method:'POST',body:fd});
    toast(`Saved ${file.name}`);
  }
  setTimeout(loadFiles,1500);
});

function loadFiles(){
  // simple refresh — files are served from /uploads/
  location.reload();
}

function toast(m){
  const t=document.getElementById('toast');
  t.textContent=m;t.style.opacity=1;t.style.bottom='40px';
  setTimeout(()=>{t.style.opacity=0;t.style.bottom='20px'},3000);
}
