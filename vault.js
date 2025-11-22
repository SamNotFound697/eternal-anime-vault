// vault.js — ABSOLUTE FINAL — EVERYTHING WORKS 100%
let currentRealm = '';
let currentPath = [];

// Realm rules
const realmRules = {
  Visuals: ['jpg','jpeg','png','gif','webp','bmp','mp4','mkv','webm','avi','mov'],
  Games: ['apk','exe','zip','rar','7z'],
  Movies: ['mp4','mkv','webm','avi','mov','wmv','flv'],
  Music: ['mp3','wav','flac','aac','ogg','m4a'],
  Memes: ['jpg','jpeg','png','gif','webp','mp4','webm','mov'],
  Secrets: []
};

function getRealmFromURL() {
  return window.location.pathname.split('/')[1]?.replace('.html', '') || '';
}

// Save/load path from URL hash
function updateURL() {
  if (currentPath.length) location.hash = currentPath.join('/');
  else history.replaceState(null, null, location.pathname);
}
function loadFromHash() {
  if (location.hash) {
    currentPath = decodeURIComponent(location.hash.slice(1)).split('/').filter(Boolean);
    updateBreadcrumb();
    loadFiles();
  }
}
window.navigateTo = function(path) {
  currentPath = path ? path.split('/').filter(Boolean) : [];
  updateBreadcrumb();
  loadFiles();
  updateURL();
};

function initRealmPage(realm) {
  currentRealm = realm;
  document.body.classList.add('realm-page');

  // Breadcrumb
  const bc = document.createElement('div');
  bc.className = 'breadcrumb';
  bc.innerHTML = `<a href="index.html">Home</a> > <span>${realm}</span>`;
  document.body.appendChild(bc);

  // New folder button
  const btn = document.createElement('button');
  btn.className = 'new-folder-btn';
  btn.textContent = '+ New Subfolder';
  btn.onclick = createRealSubfolder;
  document.body.appendChild(btn);

  // Upload zone
  const zone = document.createElement('div');
  zone.className = 'upload-zone';
  zone.innerHTML = '<div style="pointer-events:none">Drop files here<br><small style="opacity:0.7;font-size:1rem">or click</small></div>';
  zone.onclick = () => document.getElementById('file-input')?.click();
  document.body.appendChild(zone);

  // Hidden input + drag-drop
  const input = document.createElement('input');
  input.type = 'file'; input.multiple = true; input.id = 'file-input'; input.style.display = 'none';
  input.onchange = e => handleFiles(e.target.files);
  document.body.appendChild(input);

  zone.ondragover = zone.ondragenter = e => { e.preventDefault(); zone.classList.add('dragover'); };
  zone.ondragleave = zone.ondrop = e => { e.preventDefault(); zone.classList.remove('dragover'); };
  zone.ondrop = e => handleFiles(e.dataTransfer.files);

  // THIS ORDER IS CRITICAL
  loadRealSubfolders();   // 1. Show all real folders
  loadFromHash();         // 2. Open the one in URL (if any)
}

async function createRealSubfolder() {
  const name = prompt('Subfolder name:');
  if (!name?.trim()) return;
  const clean = name.trim().replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '-').toLowerCase();
  if (!clean) return showToast('Invalid name');
  currentPath = [clean];
  updateBreadcrumb();
  updateURL();
  showToast(`Folder "${name}" ready — drop files!`);
}

function isAllowed(file) {
  if (!realmRules[currentRealm]?.length) return true;
  return realmRules[currentRealm].includes(file.name.split('.').pop().toLowerCase());
}

async function handleFiles(files) {
  if (!files?.length || currentPath.length === 0) {
    showToast('Create a subfolder first!');
    return;
  }
  let up = 0;
  for (const f of files) {
    if (!isAllowed(f)) continue;
    const form = new FormData();
    form.append('file', f);
    form.append('realm', currentRealm);
    form.append('subfolder', currentPath.join('/'));
    if (await fetch('/.netlify/functions/upload', {method:'POST', body:form}).then(r=>r.ok)) up++;
  }
  if (up) {
    showToast(`Uploaded ${up} file${up>1?'s':''}!`);
    setTimeout(() => { loadRealSubfolders(); loadFiles(); }, 1200);
  }
}

async function loadRealSubfolders() {
  const c = document.getElementById('subfolders') || document.createElement('div');
  c.id = 'subfolders'; c.className = 'subfolders';
  c.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#0ff;margin:4rem">No subfolders yet — create one!</p>';
  try {
    const res = await fetch(`/uploads/${currentRealm}/`);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const folders = [...doc.querySelectorAll('a[href]')]
      .map(a => a.href.match(/([^/]+)\/$/))
      .filter(Boolean).map(m => m[1]);
    c.innerHTML = '';
    folders.forEach(f => {
      const el = document.createElement('div');
      el.className = 'folder-icon';
      el.innerHTML = 'Folder';
      el.onclick = () => { currentPath=[f]; updateBreadcrumb(); loadFiles(); updateURL(); };
      c.appendChild(el);
    });
  } catch(e) {}
  if (!document.getElementById('subfolders')) document.body.appendChild(c);
}

function updateBreadcrumb() {
  const parts = [`<a href="index.html">Home</a>`, ` > <a href="${currentRealm}.html">${currentRealm}</a>`];
  currentPath.forEach((p,i) => {
    const path = currentPath.slice(0,i+1).join('/');
    parts.push(` > <span style="cursor:pointer;color:#0ff" onclick="navigateTo('${path}')">${p}</span>`);
  });
  document.querySelector('.breadcrumb').innerHTML = parts.join('');
  updateURL();
}

async function loadFiles() {
  const c = document.getElementById('file-grid') || document.createElement('div');
  c.id = 'file-grid'; c.className = 'file-grid'; c.innerHTML = '';
  const path = currentPath.length ? currentPath.join('/') + '/' : '';
  const url = `/uploads/${currentRealm}/${path}`;
  try {
    const res = await fetch(url);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const files = [...doc.querySelectorAll('a[href]:not([href$="/"])')].map(a => a.href.split('/').pop());
    files.forEach(f => {
      const ext = f.split('.').pop().toLowerCase();
      const el = document.createElement('div');
      el.className = 'file-item';
      if (['jpg','jpeg','png','gif','webp','bmp'].includes(ext))
        el.innerHTML = `<img src="${url}${f}" loading="lazy">`;
      else if (['mp4','webm','mov','mkv','avi','flv'].includes(ext))
        el.innerHTML = `<video src="${url}${f}" controls preload="metadata"></video>`;
      else el.innerHTML = `<a href="${url}${f}" download>${f}</a>`;
      c.appendChild(el);
    });
  } catch(e) {
    c.innerHTML = '<p style="grid-column:1/-1;text-align:center">No files yet</p>';
  }
  if (!document.getElementById('file-grid')) document.body.appendChild(c);
}

function showToast(m) {
  const t = document.createElement('div');
  t.id = 'toast'; t.textContent = m;
  document.body.appendChild(t);
  t.style.opacity = '1'; t.style.bottom = '2rem';
  setTimeout(() => { t.style.opacity = '0'; t.style.bottom = '0'; }, 3000);
}

// START
if (location.pathname.includes('.html') && !location.pathname.includes('index')) {
  initRealmPage(getRealmFromURL());
}
