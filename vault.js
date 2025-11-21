// vault.js — Smart per-realm file filter + everything else
let currentRealm = '';
let currentPath = [];

// Realm-specific allowed extensions
const realmRules = {
  Visuals: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
  Games: ['apk', 'exe', 'zip', 'rar'],
  Movies: ['mp4', 'mkv', 'webm', 'avi', 'mov', 'wmv'],
  Music: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
  Memes: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov'],
  Secrets: [] // accepts ANY file
};

function getRealmFromURL() {
  const path = window.location.pathname;
  return path.split('/')[1].replace('.html', '');
}

// Init realm page
function initRealmPage(realm) {
  currentRealm = realm;
  document.body.classList.add('realm-page');
  
  // Breadcrumb
  const breadcrumb = document.createElement('div');
  breadcrumb.className = 'breadcrumb';
  breadcrumb.innerHTML = `<a href="index.html">Home</a> > <span>${realm}</span>`;
  document.body.appendChild(breadcrumb);
  
  // New folder button
  const newBtn = document.createElement('button');
  newBtn.className = 'new-folder-btn';
  newBtn.textContent = '+ New Subfolder';
  newBtn.onclick = createSubfolder;
  document.body.appendChild(newBtn);
  
  // Upload zone
  const zone = document.createElement('div');
  zone.className = 'upload-zone';
  zone.id = 'upload-zone';
  zone.innerHTML = `Drop ${realm} files here<br><small>Only ${getAllowedText(realm)}</small>`;
  zone.onclick = () => document.getElementById('file-input').click();
  document.body.appendChild(zone);
  
  // Hidden file input
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.id = 'file-input';
  input.style.display = 'none';
  input.onchange = handleFiles;
  document.body.appendChild(input);
  
  // Drag & drop
  ['dragover', 'dragenter'].forEach(e => zone.addEventListener(e, () => zone.classList.add('dragover')));
  ['dragleave', 'drop'].forEach(e => zone.addEventListener(e, () => zone.classList.remove('dragover')));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  });
  
  loadSubfolders();
}

function getAllowedText(realm) {
  if (realm === 'Secrets') return 'ANY files';
  if (realm === 'Games') return '.apk .exe .zip';
  if (realm === 'Movies') return 'video files';
  if (realm === 'Music') return 'audio files';
  if (realm === 'Visuals') return 'images';
  if (realm === 'Memes') return 'images & short videos';
  return '';
}

function isAllowed(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const allowed = realmRules[currentRealm];
  if (allowed.length === 0) return true; // Secrets
  return allowed.includes(ext);
}

async function handleFiles(files) {
  if (!files) files = document.getElementById('file-input').files;
  if (!currentPath.length) return showToast('Create a subfolder first!');
  
  let validCount = 0;
  for (const file of files) {
    if (!isAllowed(file)) {
      showToast(`❌ ${file.name} not allowed in ${currentRealm}`);
      continue;
    }
    
    const form = new FormData();
    form.append('file', file);
    form.append('realm', currentRealm);
    form.append('subfolder', currentPath.join('/'));
    
    const res = await fetch('/.netlify/functions/upload', {method: 'POST', body: form});
    if (res.ok) validCount++;
  }
  
  if (validCount) {
    showToast(`✅ ${validCount} file${validCount>1?'s':''} uploaded!`);
    setTimeout(loadFiles, 1500);
  }
}

function createSubfolder() {
  const name = prompt('Subfolder name (e.g. Shrek Pack, Goa Trip 2025):');
  if (name) {
    currentPath = [name.trim()];
    updateBreadcrumb();
    document.getElementById('subfolders').innerHTML = '';
    showToast(`Folder "${name}" created! Drop files now.`);
  }
}

function updateBreadcrumb() {
  document.querySelector('.breadcrumb').innerHTML = 
    `<a href="index.html">Home</a> > <a href="${currentRealm}.html">${currentRealm}</a>` + 
    currentPath.map(p => ` > <span>${p}</span>`).join('');
}

// Load sample subfolders (replace with real fetch later)
function loadSubfolders() {
  const container = document.createElement('div');
  container.className = 'subfolders';
  const samples = ['Misc', '2025', 'Favorites', 'Old Stuff'];
  samples.forEach(folder => {
    const el = document.createElement('div');
    el.className = 'folder-icon';
    el.innerHTML = '📁';
    el.onclick = () => {
      currentPath = [folder];
      updateBreadcrumb();
      loadFiles();
    };
    container.appendChild(el);
  });
  document.body.appendChild(container);
}

// Load sample files (replace with real fetch later)
function loadFiles() {
  const container = document.getElementById('file-grid') || document.createElement('div');
  container.id = 'file-grid';
  container.className = 'file-grid';
  container.innerHTML = '';
  
  // Sample files — delete later when real uploads work
  const samples = [
    {name: 'shrek.jpg', type: 'image'},
    {name: 'game.apk', type: 'apk'},
    {name: 'meme.mp4', type: 'video'}
  ];
  
  samples.forEach(f => {
    const item = document.createElement('div');
    item.className = 'file-item';
    if (f.type === 'image') item.innerHTML = `<img src="https://picsum.photos/300/300?random=${Math.random()}">`;
    else if (f.type === 'video') item.innerHTML = `<video src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" muted></video>`;
    else item.innerHTML = `<a href="#">${f.name}</a>`;
    container.appendChild(item);
  });
  
  if (!document.getElementById('file-grid')) document.body.appendChild(container);
}

function showToast(message) {
  const toast = document.getElementById('toast') || document.createElement('div');
  toast.id = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  toast.style.opacity = '1';
  toast.style.bottom = '2rem';
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.bottom = '0';
  }, 3000);
}

// Auto-init on realm pages
if (window.location.pathname.includes('.html') && !window.location.pathname.includes('index')) {
  const realm = getRealmFromURL();
  initRealmPage(realm);
}
