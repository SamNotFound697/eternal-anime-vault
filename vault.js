let scrollCount = 0;
let currentPath = [];
let currentRealm = '';

// Magic Button - appears after 7 scrolls
window.addEventListener('scroll', () => {
  if (window.scrollY > window.innerHeight * 0.3) {
    scrollCount++;
    if (scrollCount >= 7) {
      document.getElementById('magic-button').classList.remove('hidden');
    }
  }
});

document.getElementById('magic-button').onclick = () => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.multiple = true;
  fileInput.onchange = handleMagicUpload;
  fileInput.click();
};

async function handleMagicUpload(e) {
  const files = Array.from(e.target.files);
  for (const file of files) {
    const category = await getFileCategory(file);
    const realm = await getRealmForCategory(category, file);
    const subfolder = prompt(`Create subfolder in ${realm} for ${file.name}:`) || 'Misc';
    await uploadFile(file, realm, subfolder);
  }
  showToast('Magic upload complete! ✨');
}

async function getFileCategory(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const type = file.type;
  
  if (type.startsWith('image/')) return 'photo';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (ext === 'apk') return 'android-game';
  if (ext === 'exe' || ext === 'zip') return 'pc-game';
  if (ext === 'mp3' || ext === 'wav') return 'music';
  return 'misc';
}

async function getRealmForCategory(category, file) {
  const ext = file.name.split('.').pop().toLowerCase();
  
  switch (category) {
    case 'photo': return 'Visuals';
    case 'video': return 'Movies';
    case 'audio': 
      const choice = confirm('Is this music or meme audio? (Cancel for music, OK for meme)');
      return choice ? 'Memes' : 'Music';
    case 'android-game': return 'Games';
    case 'pc-game': return 'Games';
    case 'music': return 'Music';
    default: return 'Secrets';
  }
}

async function uploadFile(file, realm, subfolder) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('realm', realm);
  formData.append('subfolder', subfolder);
  
  const response = await fetch('/.netlify/functions/upload', {
    method: 'POST',
    body: formData
  });
  
  if (response.ok) {
    showToast(`Uploaded ${file.name} to ${realm}/${subfolder}`);
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.bottom = '2rem';
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.bottom = '0';
  }, 3000);
}

// Realm page logic (for visuals.html, games.html, etc.)
if (window.location.pathname.includes('.html') && !window.location.pathname.includes('index')) {
  const realm = window.location.pathname.split('/')[1].replace('.html', '');
  initRealmPage(realm);
}

function initRealmPage(realm) {
  currentRealm = realm;
  document.body.classList.add('realm-page');
  
  // Breadcrumb
  const breadcrumb = document.createElement('div');
  breadcrumb.className = 'breadcrumb';
  breadcrumb.innerHTML = `<a href="index.html">Home</a> > <span>${realm}</span>`;
  document.body.appendChild(breadcrumb);
  
  // New folder button
  const newFolderBtn = document.createElement('button');
  newFolderBtn.className = 'new-folder-btn';
  newFolderBtn.textContent = '+ New Subfolder';
  newFolderBtn.onclick = createSubfolder;
  document.body.appendChild(newFolderBtn);
  
  // Upload zone
  const uploadZone = document.createElement('div');
  uploadZone.className = 'upload-zone';
  uploadZone.innerHTML = 'Drag files here';
  uploadZone.ondragover = uploadZone.ondragenter = (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  };
  uploadZone.ondragleave = uploadZone.ondrop = () => uploadZone.classList.remove('dragover');
  uploadZone.ondrop = handleDrop;
  document.body.appendChild(uploadZone);
  
  // Load subfolders
  loadSubfolders(realm);
}

async function createSubfolder() {
  const name = prompt('Subfolder name:');
  if (name) {
    currentPath.push(name);
    updateBreadcrumb();
    loadFiles();
  }
}

function updateBreadcrumb() {
  const breadcrumb = document.querySelector('.breadcrumb');
  breadcrumb.innerHTML = `<a href="index.html">Home</a> > <span>${currentRealm}</span>${currentPath.map(p => ` > <a href="#" onclick="enterFolder('${p}')">${p}</a>`).join('')}`;
}

function enterFolder(folder) {
  currentPath.push(folder);
  updateBreadcrumb();
  loadFiles();
}

async function loadSubfolders(realm) {
  const container = document.createElement('div');
  container.className = 'subfolders';
  
  // Sample subfolders (in real app, fetch from server)
  const sampleFolders = ['Misc', '2025', 'Memories', 'Favorites'];
  sampleFolders.forEach(folder => {
    const folderEl = document.createElement('div');
    folderEl.className = 'folder-icon';
    folderEl.innerHTML = '📁';
    folderEl.onclick = () => enterFolder(folder);
    container.appendChild(folderEl);
  });
  
  document.body.appendChild(container);
}

async function loadFiles() {
  const container = document.getElementById('files') || document.createElement('div');
  container.id = 'files';
  container.className = 'file-grid';
  container.innerHTML = '';
  
  // Sample files (in real app, fetch from server)
  const sampleFiles = [
    { name: 'shrek1.jpg', type: 'image' },
    { name: 'game.apk', type: 'apk' },
    { name: 'meme.mp4', type: 'video' }
  ];
  
  sampleFiles.forEach(file => {
    const fileEl = document.createElement('div');
    fileEl.className = 'file-item';
    if (file.type === 'image') {
      fileEl.innerHTML = `<img src="/uploads/${currentRealm}/${currentPath.join('/') || 'Misc'}/${file.name}" alt="">`;
    } else if (file.type === 'video') {
      fileEl.innerHTML = `<video src="/uploads/${currentRealm}/${currentPath.join('/') || 'Misc'}/${file.name}" muted></video>`;
    } else {
      fileEl.innerHTML = `<a href="/uploads/${currentRealm}/${currentPath.join('/') || 'Misc'}/${file.name}" download>${file.name}</a>`;
    }
    container.appendChild(fileEl);
  });
  
  if (!document.getElementById('files')) document.body.appendChild(container);
}

async function handleDrop(e) {
  e.preventDefault();
  const files = Array.from(e.dataTransfer.files);
  for (const file of files) {
    await uploadFile(file, currentRealm, currentPath.join('/'));
  }
  loadFiles();
}
